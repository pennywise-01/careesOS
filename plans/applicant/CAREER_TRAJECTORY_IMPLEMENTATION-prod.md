# Implementation Plan: Career Trajectory Graph

> **Dependency:** Auth flow must be completed first. Session isolation is required before any personalised DeepSeek suggestions can be safely served.

---

## Why Auth Must Come First

DeepSeek is stateless — it has no concept of users. Without auth, there is no way to:
- Know whose profile to send to DeepSeek
- Prevent one user's suggestions appearing for another
- Persist a profile across page refreshes or devices
- Associate a trajectory with the right person

**Every personalised feature (trajectory graph, AI coach, saved applications) depends on a verified user session.**

---

## Phase 0 — Auth & Session Foundation

### Stack
- **Supabase Auth** — email/password or magic link
- **JWT tokens** — issued by Supabase, verified by backend on every request
- **PostgreSQL (Supabase)** — user profiles stored under `user_id`

### Tables needed

```sql
-- Managed by Supabase Auth automatically
auth.users (id, email, created_at)

-- Your application data
CREATE TABLE career_profiles (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID REFERENCES auth.users(id) UNIQUE,
  current_role     TEXT,
  company_size     TEXT,       -- startup / sme / mnc / glc
  industry         TEXT,
  city             TEXT,
  years_experience INT,
  skills           TEXT[],
  target_role      TEXT,
  life_chapter     TEXT,       -- student / early_career / mid_career / senior / executive
  updated_at       TIMESTAMPTZ DEFAULT now()
);
```

### Session isolation flow

```
1. User registers / logs in via Supabase Auth
2. Supabase issues JWT token
3. Frontend stores token (Supabase client handles this automatically)
4. Every API request sends token in Authorization header
5. Backend middleware verifies token → extracts user_id
6. All DB queries filtered by that user_id
7. DeepSeek receives ONLY that user's profile — no cross-user bleed possible
```

### Estimated effort
- Supabase project setup: 30 minutes
- Auth UI (login/register forms): 1 day
- Backend JWT verification middleware: 2 hours
- Career profile save/read endpoints: 2 hours

---

## Phase 1 — Pre-Seed Career Graph Data

Before any AI personalisation, the graph nodes and edges must exist. DeepSeek selects from these — it does not generate them.

### Node schema

```sql
CREATE TABLE trajectory_nodes (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_title       TEXT NOT NULL,
  specialisation   TEXT,
  industry         TEXT,           -- engineering / hr / operations / finance / etc.
  seniority_level  TEXT,           -- junior / mid / senior / lead / director / vp
  salary_min_myr   INT,
  salary_max_myr   INT,
  required_skills  TEXT[],
  reach_time_months INT            -- avg months to reach from an entry-level equivalent
);

CREATE TABLE trajectory_edges (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_node_id   UUID REFERENCES trajectory_nodes(id),
  to_node_id     UUID REFERENCES trajectory_nodes(id),
  probability    FLOAT,            -- 0.0 to 1.0 (based on synthetic cohort data)
  avg_time_months INT
);
```

### Seed data scope (MVP)
- **3 industry tracks:** Engineering, HR/People, Operations
- **4–5 seniority levels per track:** ~15 nodes per track = ~45 nodes total
- **2–3 edges per node** = ~90–135 edges
- One-time data entry — not dynamic, not AI-generated

### Example nodes (Engineering track)
```
Junior Developer → Mid Software Engineer → Senior Engineer →
  ├── Engineering Manager
  ├── Staff Engineer
  └── Solutions Architect → VP Engineering
```

---

## Phase 2 — DeepSeek Profile → Node Ranking

Once auth and seeded graph data exist, DeepSeek's role is simple: **rank the pre-existing nodes by fit for the current user.**

### API endpoint

```
POST /api/trajectory-suggestions
Authorization: Bearer <jwt>

Body: { user_id }  ← backend retrieves profile internally, never trust client-sent profile
```

### What the backend does

```python
1. Verify JWT → extract user_id
2. Fetch career_profile WHERE user_id = ?
3. Fetch all trajectory_nodes for user's industry
4. Send to DeepSeek with structured prompt
5. Return top 5 ranked nodes with probabilities and reasons
```

### DeepSeek prompt

```
You are a career trajectory analyst.

Candidate profile:
- Current role: {current_role}
- Industry: {industry}
- Years experience: {years_experience}
- Skills: {skills}
- Target role (if set): {target_role}
- Life chapter: {life_chapter}

Available career nodes:
{node_list as JSON}

Return ONLY valid JSON. Select the top 5 most probable next career nodes for this candidate.

{
  "suggestions": [
    {
      "node_id": "uuid",
      "probability": 0.0-1.0,
      "reason": "one sentence why this fits",
      "time_to_reach_months": int,
      "key_gaps": ["skill or experience missing"]
    }
  ]
}

Rules:
- Base suggestions on real career progression patterns, not just keywords
- If the candidate lacks critical skills, lower the probability and list the gaps
- Do not suggest nodes outside the candidate's industry unless a transition is realistic
- Be honest — do not inflate probabilities
```

### Response used to highlight the graph
- Top 5 nodes → highlighted green/yellow on the React Flow graph
- Remaining nodes → rendered grey (reachable but not suggested)
- Current role node → highlighted in accent colour

---

## Phase 3 — React Flow Graph Rendering

### Library
**React Flow** — handles node layout, edges, zoom, pan, and click events natively.

### Node visual anatomy

```
╔══════════════════════════╗
║  Senior Platform Engineer ║  ← role_title
║  Cloud / Infrastructure   ║  ← specialisation
║  RM 9,000 – 14,000        ║  ← salary range (font-mono)
║  ████░░ 74%               ║  ← probability bar (from DeepSeek)
║  ~18 months               ║  ← time_to_reach
╚══════════════════════════╝
```

### Node colours
| Colour | Meaning |
|---|---|
| Yellow (accent) | Current position |
| Green | Top DeepSeek suggestion (probability > 0.6) |
| Blue | Possible path (probability 0.3–0.6) |
| Grey | Reachable but not suggested (< 0.3) |

### On node click
1. Right panel slides open with:
   - DeepSeek's one-sentence reason for this path
   - Key skill gaps for this node
   - Salary comparison vs current
   - "Add to learning plan" CTA (future feature)
2. AI Career Coach panel (if built) sends a new message about the clicked path

---

## Phase 4 — Click-to-Explain (Node Detail)

When a user clicks a node, a second DeepSeek call explains that specific path in context of the user's profile.

### API endpoint

```
POST /api/trajectory-explain
Authorization: Bearer <jwt>

Body: { node_id }
```

### DeepSeek prompt (second call)

```
Given this candidate profile: {profile}
And this career node they clicked: {node}

Explain in 3–4 sentences:
1. Why this path does or doesn't fit them specifically
2. The 2–3 most important skill or experience gaps
3. A realistic time estimate and what would accelerate it

Be direct and honest. Do not be generically encouraging.
```

---

## Build Order

```
Phase 0 — Auth & session isolation          ← MUST complete first
     ↓
Phase 1 — Seed trajectory nodes & edges     ← Can be done in parallel with Phase 0
     ↓
Phase 2 — DeepSeek node ranking endpoint    ← Requires Phase 0 + Phase 1
     ↓
Phase 3 — React Flow graph UI               ← Requires Phase 2 data
     ↓
Phase 4 — Click-to-explain detail view      ← Requires Phase 3
```

---

## Effort Estimate

| Phase | Effort | Blocker |
|---|---|---|
| Phase 0: Auth | 2–3 days | None |
| Phase 1: Seed data | 1 day | None |
| Phase 2: DeepSeek ranking API | 1 day | Phase 0 |
| Phase 3: React Flow graph | 2–3 days | Phase 2 |
| Phase 4: Click-to-explain | 0.5 day | Phase 3 |
| **Total** | **~7–9 days** | — |

---

## What This Does Not Include (Post-MVP)

- LinkedIn profile import to auto-fill career profile
- Real cohort data for edge probabilities (currently synthetic)
- Multi-industry cross-path suggestions (e.g. engineer → product manager)
- Saved/pinned trajectory paths per user
- Notifications when market demand shifts for a node
