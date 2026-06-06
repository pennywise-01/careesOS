# Implementation Plan: Database Architecture

> Consolidated from all `-prod.md` plans. This is the single source of truth for the production database schema, indexing strategy, security model, and scaling approach.

---

## Platform

**Supabase (PostgreSQL)**
- Managed PostgreSQL — no server to maintain
- Built-in auth (`auth.users`) — no separate auth DB needed
- Row Level Security (RLS) — data isolation enforced at DB level
- pgvector extension — semantic similarity search built-in
- Free tier: 500MB storage, 2GB bandwidth, 50,000 MAU — sufficient for early production
- Scale tier: $25/month for 8GB storage, unlimited bandwidth

---

## Extensions Required

```sql
CREATE EXTENSION IF NOT EXISTS vector;     -- semantic embeddings (pgvector)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp"; -- UUID generation (enabled by default in Supabase)
```

---

## Full Schema

### `auth.users` — managed by Supabase Auth

```sql
-- Supabase manages this table automatically. Do not create manually.
-- Relevant fields:
--   id          UUID    primary key
--   email       TEXT    unique
--   user_metadata JSONB  { "role": "applicant" | "reviewer" }
--   created_at  TIMESTAMPTZ
```

---

### `career_profiles` — one per applicant user

```sql
CREATE TABLE career_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) UNIQUE NOT NULL,
  current_role     TEXT,
  company_size     TEXT,             -- startup | sme | mnc | glc
  industry         TEXT,
  city             TEXT,
  years_experience INT,
  skills           TEXT[],           -- raw skill names from onboarding
  target_role      TEXT,
  life_chapter     TEXT,             -- student | early_career | mid_career | senior | executive
  updated_at       TIMESTAMPTZ DEFAULT now()
);
```

**Source:** `CAREER_TRAJECTORY_IMPLEMENTATION-prod.md`  
**Populated:** During applicant onboarding / profile setup

---

### `jobs` — job postings created by reviewers

```sql
CREATE TABLE jobs (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            TEXT NOT NULL,
  department       TEXT,
  type             TEXT,             -- "Full-time · Hybrid"
  description      TEXT,
  requirements     JSONB,            -- string[]
  about_company    TEXT,
  questionnaire    JSONB,            -- { id, label, question }[]
  work_sample      JSONB,            -- { title, time_limit, context, steps[], artifact, artifact_type, placeholder }
  work_sample_task TEXT,             -- plain text sent to DeepSeek grader
  required_skills  JSONB,            -- { name, level, non_negotiable }[]
  team_context     JSONB,            -- { size, pace, autonomy_offered }
  embedding        vector(1024),     -- generated at post time via DeepSeek/BGE-M3
  score_weights    JSONB DEFAULT '{"semantic": 0.40, "skill_coverage": 0.25, "verification": 0.20, "context_fit": 0.15}',
  application_mode TEXT NOT NULL DEFAULT 'platform',  -- platform | external | both
  external_apply_url TEXT DEFAULT NULL,               -- required when mode is external or both
  alert_score_threshold FLOAT DEFAULT NULL,           -- notify reviewer when composite >= this value
  email_digest_enabled  BOOLEAN DEFAULT true,
  is_active        BOOLEAN DEFAULT true,
  created_by       UUID REFERENCES auth.users(id) NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);
```

**Source:** `ROADMAP_DYNAMIC_JOB_POSTING-prod.md` + `SEMANTIC_SCORING_IMPLEMENTATION-prod.md`  
**Embedding:** `description + requirements joined + work_sample_task` → embedded on job creation

---

### `applications` — one per applicant per job

```sql
CREATE TABLE applications (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES auth.users(id) NOT NULL,
  job_id         UUID REFERENCES jobs(id) NOT NULL,
  -- Contact info
  applicant_name TEXT,
  email          TEXT,
  phone          TEXT,
  -- Layer 1: DeepSeek extracted profile
  skills         JSONB,            -- { name, evidence_quote, inferred_level, confidence, verified, verified_score }[]
  work_context   JSONB,            -- { preferred_team_size, preferred_pace, autonomy_level }
  goals          JSONB,            -- { direction, anti_preferences[] }
  soft_signals   JSONB,            -- { communication_style, decision_making_pattern }
  red_flags      JSONB,            -- { type, detail }[]
  -- Layer 2: Work sample assessment
  assessment     JSONB,            -- { task_completion, technical_accuracy, work_quality, communication, normalised_score, feedback }
  -- Composite scores
  match_score    JSONB,            -- { semantic, skillCoverage, verification, contextFit, composite }
  -- Semantic embedding (Layer 1)
  embedding      vector(1024),     -- generated from raw answers at submission
  status         TEXT DEFAULT 'started',  -- started | questionnaire_done | assessment_done | submitted
  submitted_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, job_id),         -- one application per user per job
  UNIQUE(email, job_id)            -- duplicate email detection
);
```

**Source:** `ROADMAP_DYNAMIC_JOB_POSTING-prod.md` + `SEMANTIC_SCORING_IMPLEMENTATION-prod.md`  
**Embedding:** all 6 raw answers concatenated → embedded on questionnaire submission

---

### `reviewer_actions` — shortlist / reject decisions

```sql
CREATE TABLE reviewer_actions (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      UUID REFERENCES applications(id) NOT NULL,
  reviewer_id         UUID REFERENCES auth.users(id) NOT NULL,
  action              TEXT NOT NULL,   -- shortlisted | rejected
  stage               TEXT DEFAULT 'applied',  -- applied | shortlisted | interviewing | hired | rejected
  notes               TEXT,
  -- Interview notes (filled post-interview)
  interview_rating    INT CHECK (interview_rating BETWEEN 1 AND 5),
  interview_strengths TEXT,
  interview_concerns  TEXT,
  recommendation      TEXT,            -- hire | hold | reject
  ai_score_matched    TEXT,            -- true | false | partial (Layer 3 signal)
  created_at          TIMESTAMPTZ DEFAULT now(),
  UNIQUE(application_id, reviewer_id)  -- one decision per reviewer per application
);
```

**Source:** `ROADMAP_DYNAMIC_JOB_POSTING-prod.md` + `reviewer/REVIEWER_DASHBOARD_IMPLEMENTATION-prod.md`  
**Notes:** `stage` drives the Pipeline Kanban view. `ai_score_matched` feeds Layer 3 weight retraining.

---

### `hiring_outcomes` — 90-day performance rating (Layer 3 feedback loop)

```sql
CREATE TABLE hiring_outcomes (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id) NOT NULL UNIQUE,
  manager_rating INT CHECK (manager_rating BETWEEN 1 AND 5),
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now()
);
```

**Source:** `ROADMAP_DYNAMIC_JOB_POSTING-prod.md`  
**Used for:** Retraining scoring weights (high rating → increase verification weight)

---

### `trajectory_nodes` — pre-seeded career path nodes

```sql
CREATE TABLE trajectory_nodes (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_title        TEXT NOT NULL,
  specialisation    TEXT,
  industry          TEXT,           -- engineering | hr | operations | finance
  seniority_level   TEXT,           -- junior | mid | senior | lead | director | vp
  salary_min_myr    INT,
  salary_max_myr    INT,
  required_skills   TEXT[],
  reach_time_months INT
);
```

**Source:** `CAREER_TRAJECTORY_IMPLEMENTATION-prod.md`  
**Populated:** One-time seed data (~45 nodes across 3 industry tracks)

---

### `trajectory_edges` — directed connections between nodes

```sql
CREATE TABLE trajectory_edges (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id    UUID REFERENCES trajectory_nodes(id) NOT NULL,
  to_node_id      UUID REFERENCES trajectory_nodes(id) NOT NULL,
  probability     FLOAT CHECK (probability BETWEEN 0 AND 1),
  avg_time_months INT,
  UNIQUE(from_node_id, to_node_id)
);
```

**Source:** `CAREER_TRAJECTORY_IMPLEMENTATION-prod.md`  
**Populated:** One-time seed data (~90–135 edges)

---

### `coach_conversations` — AI coach chat history per user per node

```sql
CREATE TABLE coach_conversations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) NOT NULL,
  node_id    UUID REFERENCES trajectory_nodes(id),  -- NULL = general career question
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Source:** `AI_COACH_IMPLEMENTATION-prod.md`  
**Indexed:** `(user_id, created_at DESC)` — fetch latest messages quickly

---

### `notifications` — in-app job status notifications per applicant

```sql
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) NOT NULL,
  application_id  UUID REFERENCES applications(id),
  job_id          UUID REFERENCES jobs(id),
  type            TEXT NOT NULL,   -- received | viewed | shortlisted | rejected | interview_invited
  title           TEXT NOT NULL,
  body            TEXT,
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

**Source:** `applicant/NOTIFICATIONS_IMPLEMENTATION-prod.md`  
**Trigger:** Created server-side only (service key) — no direct client insert.

---

### `reviewer_notifications` — in-app notifications for employers

```sql
CREATE TABLE reviewer_notifications (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID REFERENCES auth.users(id) NOT NULL,
  job_id      UUID REFERENCES jobs(id),
  type        TEXT NOT NULL,   -- first_application | high_score_applicant | daily_digest
  title       TEXT NOT NULL,
  body        TEXT,
  is_read     BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT now()
);
```

**Source:** `reviewer/EMPLOYER_NOTIFICATIONS_AND_APPLY_MODE_IMPLEMENTATION-prod.md`  
**Trigger:** Created server-side only (service key) — no direct client insert.

---

### `career_profiles` additional columns (resume + notification prefs)

```sql
ALTER TABLE career_profiles ADD COLUMN resume_storage_path         TEXT;
ALTER TABLE career_profiles ADD COLUMN resume_filename             TEXT;
ALTER TABLE career_profiles ADD COLUMN resume_uploaded_at          TIMESTAMPTZ;
ALTER TABLE career_profiles ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true;
```

**Source:** `applicant/RESUME_UPLOAD_PARSING_IMPLEMENTATION-prod.md` + `applicant/NOTIFICATIONS_IMPLEMENTATION-prod.md`

---

## Indexes

```sql
-- Career profiles: fast lookup by user
CREATE UNIQUE INDEX ON career_profiles(user_id);

-- Applications: fast lookup by user, by job, and sorted by score
CREATE INDEX ON applications(user_id);
CREATE INDEX ON applications(job_id);
CREATE INDEX ON applications((match_score->>'composite') DESC);

-- Reviewer actions: fast lookup per application
CREATE INDEX ON reviewer_actions(application_id);

-- Trajectory graph traversal
CREATE INDEX ON trajectory_edges(from_node_id);
CREATE INDEX ON trajectory_edges(to_node_id);

-- Coach conversations: fetch latest messages for a user+node
CREATE INDEX ON coach_conversations(user_id, created_at DESC);
CREATE INDEX ON coach_conversations(user_id, node_id, created_at DESC);

-- Notifications: unread count + latest feed per user
CREATE INDEX ON notifications(user_id, created_at DESC);
CREATE INDEX ON notifications(user_id, is_read);

-- Reviewer notifications
CREATE INDEX ON reviewer_notifications(reviewer_id, created_at DESC);
CREATE INDEX ON reviewer_notifications(reviewer_id, is_read);

-- Semantic similarity (ANN search) — add before production scale
-- Only needed when applications > 10,000 rows
CREATE INDEX ON jobs        USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
CREATE INDEX ON applications USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
```

---

## Row Level Security (RLS)

Enable on all sensitive tables — **this is the primary data isolation mechanism.**

```sql
ALTER TABLE career_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_actions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring_outcomes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications           ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_notifications  ENABLE ROW LEVEL SECURITY;
-- trajectory_nodes and trajectory_edges: public read, no RLS needed (no PII)
```

### Summary of policies by table

| Table | Applicant | Reviewer | Public |
|---|---|---|---|
| `career_profiles` | Read/write own only | No access | No access |
| `jobs` | Read active only | Read/write own jobs | Read active only |
| `applications` | Read/write own only | Read all for own jobs | No access |
| `reviewer_actions` | No access | Read/write own | No access |
| `hiring_outcomes` | No access | Read/write for own jobs' applications | No access |
| `trajectory_nodes` | Read all | Read all | Read all |
| `trajectory_edges` | Read all | Read all | Read all |
| `coach_conversations` | Read/write own only | No access | No access |
| `notifications` | Read own only (service key inserts) | No access | No access |
| `reviewer_notifications` | No access | Read own only (service key inserts) | No access |

Full RLS policy SQL is defined in `AUTH_IMPLEMENTATION-prod.md`.

---

## Scaling Strategy

### Storage growth estimate

| Table | Row size | 1,000 users | 10,000 users |
|---|---|---|---|
| `career_profiles` | ~1KB | 1MB | 10MB |
| `applications` (no embedding) | ~5KB | 5MB | 50MB |
| `applications.embedding` | 4KB (1024 floats) | 4MB | 40MB |
| `jobs` (no embedding) | ~3KB | ~30KB | ~300KB |
| `coach_conversations` | ~500B/msg × 20 | 10MB | 100MB |
| `notifications` | ~300B/notif × 5 | 1.5MB | 15MB |
| `reviewer_notifications` | ~300B/notif × 3 | ~1MB | ~10MB |
| **Total estimate** | | **~20MB** | **~200MB** |

Supabase free tier (500MB) handles ~25,000 users. Pro tier ($25/month, 8GB) handles 1M+ users.

### Query scaling

| Bottleneck | Trigger | Solution |
|---|---|---|
| Semantic search slow | >10,000 applications | Enable ivfflat ANN index |
| Dashboard ranking slow | >1,000 applications per job | Add `composite` score index |
| Coach history slow | >10,000 conversations | Index on `(user_id, node_id, created_at)` — already planned |
| Embedding generation slow | High submission volume | Queue embedding jobs async (Supabase Edge Functions + queue) |

### Connection pooling
Use **Supabase's built-in PgBouncer** connection pooler for the FastAPI backend. Set `pool_size=10` per instance. Supabase Pro includes this by default.

---

## Security Hardening

| Rule | Implementation |
|---|---|
| Never expose Supabase service key to frontend | Backend only — frontend uses anon key + JWT |
| All PII fields encrypted at rest | Supabase encrypts all data at rest by default (AES-256) |
| Backups | Supabase Pro includes daily automated backups with 7-day retention |
| Audit log | Enable Supabase's built-in audit logging for all auth events |
| No raw SQL from user input | All queries use parameterised statements (SQLAlchemy ORM or prepared statements) |
| Soft-delete jobs | Set `is_active = false` instead of `DELETE` — preserves application referential integrity |

---

## Migration Order

```
1. Create Supabase project
2. Enable vector + uuid-ossp extensions
3. Create tables in this order (respects foreign key dependencies):
   a. career_profiles
   b. trajectory_nodes
   c. trajectory_edges
   d. jobs
   e. applications
   f. reviewer_actions
   g. hiring_outcomes
   h. coach_conversations
   i. notifications
   j. reviewer_notifications
4. Run career_profiles ALTER TABLE migrations (resume + notification fields)
5. Create all indexes
5. Enable RLS on sensitive tables
6. Apply all RLS policies (see AUTH_IMPLEMENTATION-prod.md)
7. Seed trajectory_nodes and trajectory_edges (one-time)
8. Seed 3 default jobs (migrated from mockData.js)
```

---

## Table Dependency Map

```
auth.users (Supabase managed)
    │
    ├── career_profiles (1:1 with user)
    │
    ├── jobs (created_by → user)
    │       │
    │       └── applications (job_id + user_id)
    │               │
    │               ├── reviewer_actions (application_id)
    │               └── hiring_outcomes (application_id)
    │
    ├── coach_conversations (user_id + node_id)
    ├── notifications (user_id + application_id + job_id)
    ├── reviewer_notifications (reviewer_id + job_id)
    │
trajectory_nodes ──── trajectory_edges (from/to node_id)
    │
    └── coach_conversations (node_id, nullable)
```
