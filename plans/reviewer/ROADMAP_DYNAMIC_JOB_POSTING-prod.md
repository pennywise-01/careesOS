# Roadmap: Dynamic Job Posting from Reviewer Dashboard

> **Status:** Planned — not yet implemented.  
> Current prototype uses hardcoded jobs in `mockData.js`. This document outlines the full implementation plan including a production-grade database architecture.

---

## Goal

Allow reviewers to create and manage job postings directly from the dashboard. Each posted job dynamically drives:
- The job detail page (description, requirements, company info)
- The 6 open-ended interview questions
- The work sample assessment task
- The AI scoring criteria (required skills, team context)

---

## Phase 1 — Demo (localStorage, no backend)

For the current prototype, jobs are stored in the browser's localStorage — same approach used for submitted applications.

### What changes

| File | Change |
|---|---|
| `mockData.js` | `jobs` array becomes the seed/default only |
| `UserJourney.jsx` | Reads jobs from `localStorage` (`careesOS_jobs`), falls back to `mockData.jobs` |
| `Dashboard.jsx` | Add "Post a Job" form that writes to `localStorage` |
| `vite.config.js` | `/api/extract-profile` prompt becomes dynamic based on the job's questionnaire |

### Data flow (localStorage)

```
Reviewer fills "Post a Job" form in Dashboard
        ↓
Job saved to localStorage: careesOS_jobs[]
        ↓
Applicant opens job list → reads careesOS_jobs from localStorage
        ↓
Applicant selects job → detail page, questions, work sample all from that job object
        ↓
/api/extract-profile → receives questions array dynamically
        ↓
/api/grade-assessment → receives job.work_sample_task dynamically
        ↓
Scoring → uses job.required_skills + job.team_context (already dynamic)
```

### Limitation
Jobs disappear if browser storage is cleared. Not shareable across devices or browsers. Sufficient for demo only.

---

## Phase 2 — Production (Database + Backend)

### Recommended Stack

| Layer | Technology | Reason |
|---|---|---|
| Database | **Supabase (PostgreSQL)** | Managed Postgres, free tier, real-time, built-in auth |
| Backend API | **Supabase Edge Functions** or **Cloudflare Workers** | Serverless, works with Cloudflare Pages deployment |
| Auth | **Supabase Auth** | Reviewer login (email/password or magic link), applicant identity |
| File storage | **Supabase Storage** | Resume uploads |

---

## Database Schema

### `jobs` table
```sql
CREATE TABLE jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  department    TEXT,
  type          TEXT,                        -- "Full-time · Hybrid"
  description   TEXT,
  requirements  JSONB,                       -- string[]
  about_company TEXT,
  questionnaire JSONB,                       -- { id, label, question }[]
  work_sample   JSONB,                       -- { title, time_limit, context, steps[], artifact, artifact_type, placeholder }
  work_sample_task TEXT,                     -- string sent to DeepSeek grader
  required_skills  JSONB,                    -- { name, level, non_negotiable }[]
  team_context     JSONB,                    -- { size, pace, autonomy_offered }
  embedding_mock   JSONB,                    -- float[] for semantic scoring
  is_active     BOOLEAN DEFAULT true,
  created_by    UUID REFERENCES auth.users(id),
  created_at    TIMESTAMPTZ DEFAULT now()
);
```

### `applications` table
```sql
CREATE TABLE applications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id        UUID REFERENCES jobs(id),
  applicant_name  TEXT,
  email           TEXT,
  phone           TEXT,
  skills          JSONB,       -- extracted by DeepSeek
  work_context    JSONB,
  goals           JSONB,
  soft_signals    JSONB,
  red_flags       JSONB,
  assessment      JSONB,       -- work sample grades from DeepSeek
  match_score     JSONB,       -- { semantic, skillCoverage, verification, contextFit, composite }
  embedding_mock  JSONB,
  submitted_at    TIMESTAMPTZ DEFAULT now()
);
```

### `reviewer_actions` table *(for shortlist/reject tracking)*
```sql
CREATE TABLE reviewer_actions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID REFERENCES applications(id),
  reviewer_id     UUID REFERENCES auth.users(id),
  action          TEXT,        -- "shortlisted" | "rejected"
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

### `hiring_outcomes` table *(for Layer 3 feedback loop)*
```sql
CREATE TABLE hiring_outcomes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id  UUID REFERENCES applications(id),
  manager_rating  INT,         -- 1–5, collected at 90 days
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);
```

---

## API Endpoints (Phase 2)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/jobs` | List all active job postings |
| `POST` | `/api/jobs` | Create a new job posting (reviewer auth required) |
| `PUT` | `/api/jobs/:id` | Update a job posting |
| `DELETE` | `/api/jobs/:id` | Deactivate a job posting |
| `GET` | `/api/applications?job_id=` | List applications, optionally filtered by job |
| `POST` | `/api/applications` | Submit a new application |
| `POST` | `/api/reviewer-actions` | Shortlist or reject a candidate |
| `POST` | `/api/outcomes` | Log 90-day performance rating |
| `POST` | `/api/extract-profile` | DeepSeek profile extraction (already exists) |
| `POST` | `/api/grade-assessment` | DeepSeek work sample grading (already exists) |

---

## The One Non-Trivial Code Change: Dynamic Extract-Profile Prompt

Currently the DeepSeek prompt in `vite.config.js` hardcodes question labels:
```js
// CURRENT — hardcoded
`1. Proudest Work: ${answers.q1}
 2. Technical Complexity: ${answers.q2}
 ...`
```

In Phase 1 and 2, this needs to be dynamic:
```js
// FUTURE — dynamic
const questionLines = questions.map((q, i) =>
  `${i + 1}. ${q.label}: ${answers[q.id] || 'Not provided'}`
).join('\n');
```

The `questions` array (from the job's `questionnaire` field) is passed alongside `answers` in the request body.

Everything else in the scoring pipeline — skill matching, work sample grading, composite calculation — is already fully dynamic and requires no changes.

---

## Migration Path

```
Phase 1 (now)         Phase 2 (later)
─────────────         ───────────────
localStorage jobs  →  Supabase jobs table
localStorage apps  →  Supabase applications table
No auth            →  Supabase Auth (reviewer login)
Vite dev proxy     →  Supabase Edge Functions / Cloudflare Workers
No file storage    →  Supabase Storage (resume uploads)
```

No frontend logic changes are required for the migration — only the data source (localStorage → API calls) changes.
