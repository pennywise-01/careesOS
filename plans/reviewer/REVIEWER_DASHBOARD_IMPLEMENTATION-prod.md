# Implementation Plan: Reviewer / Employer Dashboard

> Covers all missing production features and proposed additions for the reviewer side.  
> **Dependency:** Auth (platform/AUTH_IMPLEMENTATION-prod.md) and DB (platform/DATABASE_IMPLEMENTATION-prod.md) must be complete first.

---

## Current State (Prototype)

| Feature | Status |
|---|---|
| Ranked applicant list (composite score) | ✅ Built |
| Candidate detail view (skills, evidence, score breakdown) | ✅ Built |
| Reviewer scoring guide legend | ✅ Built |
| Live timestamps (60s auto-refresh) | ✅ Built |
| Layer 3 weight retraining simulation | ✅ Built |
| Shortlist / Reject buttons | ⚠️ UI only — no persistence |
| Job posting creation | ❌ Not built |
| KPI strip | ❌ Not built |
| Pipeline / workflow view | ❌ Not built |

---

## Feature 1 — Shortlist / Reject with Persistence

### What it does
When a reviewer clicks Shortlist or Reject, the decision is saved to the `reviewer_actions` table in the DB. The candidate's status is reflected immediately in the UI and persists across sessions.

### API

```
POST /api/reviewer-actions
Authorization: Bearer <jwt> (reviewer only)

Body: { application_id, action: "shortlisted" | "rejected", notes: "" }

Response: { id, action, created_at }
```

### DB write

```sql
INSERT INTO reviewer_actions (application_id, reviewer_id, action, notes)
VALUES (:app_id, :reviewer_id, :action, :notes)
ON CONFLICT (application_id, reviewer_id) DO UPDATE SET action = EXCLUDED.action;
```

### UI changes
- Button state reflects saved action (green Shortlisted / red Rejected badge)
- Filter tabs on candidate list: All · Shortlisted · Rejected · Pending
- Action is optimistic — update UI immediately, rollback on API error
- Optional notes textarea appears before confirming action

### Email notification (on Shortlist)
Trigger a Supabase Edge Function when action = "shortlisted":

```js
// Supabase Edge Function: notify-shortlisted
const { data: app } = await supabase.from('applications').select('email, applicant_name, job_id').eq('id', application_id).single()
const { data: job } = await supabase.from('jobs').select('title').eq('id', app.job_id).single()

await resend.emails.send({
  from: 'careers@careeros.com',
  to: app.email,
  subject: `Update on your application — ${job.title}`,
  text: `Hi ${app.applicant_name}, you have been shortlisted for the ${job.title} role. The hiring team will be in touch shortly.`
})
```

**Email service:** Resend (free tier: 3,000 emails/month) — simplest to integrate with Supabase Edge Functions.

---

## Feature 2 — Job Posting CRUD

### What it does
Reviewer creates, edits, and deactivates job postings directly from the dashboard. Each posted job drives the applicant's job listing, job detail page, questionnaire, and work sample.

### Form fields

```
Basic Info:
  - Job title *
  - Department *
  - Job type (Full-time · Hybrid / On-site / Remote) *
  - Description (textarea) *
  - About company (textarea) *
  - Requirements (add/remove list, min 3) *

Required Skills (add/remove):
  - Skill name *
  - Level: junior | mid | senior
  - Non-negotiable toggle

Team Context:
  - Team size
  - Pace: exploratory | balanced | execution-focused
  - Autonomy offered: low | medium | high

Questionnaire (6 questions — pre-filled with defaults, editable):
  - Label (short) *
  - Question text *

Work Sample:
  - Title *
  - Time limit (e.g. "45 min") *
  - Context (scenario setup) *
  - Step 1, Step 2, Step 3 *
  - Artifact (code block or text data — optional)
  - Artifact type: code | text
  - Answer placeholder text *
```

### API

```
POST   /api/jobs           → create (reviewer auth)
GET    /api/jobs           → list all active (public)
GET    /api/jobs/:id       → get single job
PUT    /api/jobs/:id       → update (reviewer owner only)
DELETE /api/jobs/:id       → soft-delete: set is_active = false (reviewer owner only)
```

### Embedding generation on job creation

```python
# After saving job to DB
job_text = f"{job.description} {' '.join(job.requirements)} {job.work_sample_task}"
job.embedding = await generate_embedding(job_text)
await db.commit()
```

### Dynamic extract-profile prompt

Once reviewer-defined questions are stored, `/api/extract-profile` must read them dynamically:

```python
# Pass questions with submission
question_lines = "\n".join([
    f"{i+1}. {q['label']}: {answers.get(q['id'], 'Not provided')}"
    for i, q in enumerate(job['questionnaire'])
])
# Insert into DeepSeek prompt instead of hardcoded Q1-Q6
```

---

## Feature 3 — Employer KPI Strip

### What it shows

```
┌─────────────────────────────────────────────────────────────────┐
│  Active Roles: 3   │  Total Applicants: 47   │  Avg Score: 0.71 │
│  Shortlisted: 12   │  Pending Review: 28     │  Rejected: 7     │
└─────────────────────────────────────────────────────────────────┘
```

### API

```
GET /api/dashboard/stats
Authorization: Bearer <jwt> (reviewer only)

Response:
{
  "active_jobs": 3,
  "total_applications": 47,
  "avg_composite_score": 0.71,
  "shortlisted": 12,
  "pending": 28,
  "rejected": 7
}
```

### SQL (backend)

```sql
SELECT
  COUNT(DISTINCT j.id) FILTER (WHERE j.is_active = true) AS active_jobs,
  COUNT(a.id) AS total_applications,
  ROUND(AVG((a.match_score->>'composite')::float)::numeric, 2) AS avg_composite_score,
  COUNT(ra.id) FILTER (WHERE ra.action = 'shortlisted') AS shortlisted,
  COUNT(ra.id) FILTER (WHERE ra.action = 'rejected') AS rejected,
  COUNT(a.id) - COUNT(ra.id) AS pending
FROM jobs j
LEFT JOIN applications a ON a.job_id = j.id
LEFT JOIN reviewer_actions ra ON ra.application_id = a.id
WHERE j.created_by = :reviewer_id;
```

---

## Feature 4 — Pipeline View (Kanban)

### What it does
Instead of a flat ranked list, candidates are displayed in columns by stage:

```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Applied    │  │  Shortlisted │  │  Interviewing│  │    Hired     │
│              │  │              │  │              │  │              │
│  [Alice Chen]│  │ [Bob Smith]  │  │ [Carol Davis]│  │              │
│  Score: 0.82 │  │ Score: 0.78  │  │ Score: 0.91  │  │              │
│              │  │              │  │              │  │              │
│ [JohnDoe]    │  │              │  │              │  │              │
│  Score: 0.73 │  │              │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

### Stage progression
Stages: `applied` → `shortlisted` → `interviewing` → `hired` | `rejected`

Add `stage` column to `reviewer_actions`:
```sql
ALTER TABLE reviewer_actions ADD COLUMN stage TEXT DEFAULT 'applied';
-- applied | shortlisted | interviewing | hired | rejected
```

### Drag-and-drop
Use `@dnd-kit/core` (React DnD) — lightweight, accessible, works well with Framer Motion.

On drop to new column:
```
PATCH /api/reviewer-actions/:id   { stage: "interviewing" }
```

### Toggle between views
Add a toggle button on the dashboard header: `[List View] [Pipeline View]`
Store preference in `localStorage` — no DB needed for this.

---

## Feature 5 — Candidate Comparison View

### What it does
Reviewer selects 2–3 candidates via checkbox, clicks "Compare" — opens a side-by-side breakdown:

```
                      Alice Chen          Bob Smith          Carol Davis
──────────────────────────────────────────────────────────────────────
Composite Score           0.82               0.71               0.91
Semantic                  0.87               0.78               0.85
Skill Coverage            0.80               0.60               1.00
Verification              0.85               0.00               0.88
Context Fit               0.75               1.00               0.90
──────────────────────────────────────────────────────────────────────
Red Flags                 None           vague_answers           None
──────────────────────────────────────────────────────────────────────
Missing Skills            –              Kubernetes, Python       –
```

### Implementation
- No new API needed — data already loaded in dashboard state
- Pure frontend: `selectedCandidates[]` state (max 3), comparison modal/panel
- Highlight best value per row in green

---

## Feature 6 — Interview Notes

### What it does
After interviewing a candidate, the reviewer attaches structured notes that feed back into the system (used for Layer 3 outcome logging).

### Form fields
- Overall impression: 1–5 stars
- Strengths observed (free text)
- Concerns (free text)
- Recommendation: Hire · Hold · Reject
- Did AI score match your assessment? Yes · Partially · No (feedback signal for model improvement)

### API

```
POST /api/reviewer-actions/:id/notes
Authorization: Bearer <jwt> (reviewer only)

Body: {
  rating: 1-5,
  strengths: "string",
  concerns: "string",
  recommendation: "hire" | "hold" | "reject",
  ai_score_matched: true | false | "partial"
}
```

The `ai_score_matched` field is the most valuable — it directly feeds the Layer 3 scoring weight retraining model over time.

---

## Feature 7 — Per-Job Score Weight Customisation

### What it does
When creating or editing a job, the reviewer can adjust the scoring weights for that role. Technical roles should weight verification higher; culture-fit roles weight context fit higher.

### UI (on job creation form)

```
Score Weights for this role (must sum to 100%)
  Semantic Alignment    [████████░░]  40%  ↕
  Skill Coverage        [██████░░░░]  25%  ↕
  Verification          [████░░░░░░]  20%  ↕
  Context Fit           [███░░░░░░░]  15%  ↕
```

### DB change

```sql
ALTER TABLE jobs ADD COLUMN score_weights JSONB DEFAULT
  '{"semantic": 0.40, "skill_coverage": 0.25, "verification": 0.20, "context_fit": 0.15}';
```

### Scoring engine change
When calculating composite score in the backend, use `job.score_weights` instead of the global default:

```python
weights = job.score_weights or DEFAULT_WEIGHTS
composite = (
    semantic * weights["semantic"] +
    skill_coverage * weights["skill_coverage"] +
    verification * weights["verification"] +
    context_fit * weights["context_fit"]
)
```

---

## Feature 8 — Application Analytics Per Job

### What it shows
For each job posting, a reviewer can see:
- Total applicants over time (line chart)
- Step completion funnel (how many reached each step)
- Score distribution histogram (how candidates cluster)
- Avg score per factor

### API

```
GET /api/jobs/:id/analytics
Authorization: Bearer <jwt> (reviewer owner only)

Response: {
  "total_applications": 47,
  "funnel": {
    "started_questionnaire": 47,
    "completed_questionnaire": 41,
    "completed_work_sample": 38,
    "submitted": 35
  },
  "score_distribution": { "0.0-0.2": 2, "0.2-0.4": 5, "0.4-0.6": 8, "0.6-0.8": 15, "0.8-1.0": 5 },
  "avg_scores": { "semantic": 0.74, "skill_coverage": 0.61, "verification": 0.55, "context_fit": 0.82 }
}
```

**Implementation note:** Funnel data requires tracking partial submissions — add `status` field to `applications` table: `started` | `questionnaire_done` | `assessment_done` | `submitted`.

---

## Feature 9 — Duplicate Application Detection

### What it does
Flags if the same email address applies to the same job more than once. Shown as a warning badge in the candidate list.

### Implementation
The `applications` table already has `UNIQUE(user_id, job_id)` — this prevents duplicate submissions at the DB level for authenticated users.

For unauthenticated or email-based detection:

```sql
-- Add unique constraint on email per job
CREATE UNIQUE INDEX ON applications(email, job_id);
```

If a duplicate is detected on submission, return HTTP 409 with a clear message to the applicant. No new UI needed for the reviewer — duplicates simply cannot exist.

---

## Build Order

```
Phase 0 — Auth complete                                   ← prerequisite
Phase 1 — DB schema + migrations complete                 ← prerequisite
        ↓
1. Job posting CRUD form + API                            ← 2 days (highest priority)
2. Shortlist/Reject persistence + filter tabs             ← 1 day
3. KPI strip + /api/dashboard/stats                       ← 0.5 day
4. Per-job score weights (add to job form)                ← 0.5 day
5. Email notification on shortlist (Resend + Edge Fn)     ← 0.5 day
6. Duplicate detection (DB constraint + 409 handling)     ← 2 hours
7. Candidate comparison view (frontend only)              ← 1 day
8. Pipeline Kanban view                                   ← 2 days
9. Interview notes form + API                             ← 1 day
10. Application analytics + funnel chart                  ← 1.5 days
```

---

## Effort Estimate

| Feature | Effort |
|---|---|
| Job posting CRUD | 2 days |
| Shortlist/Reject persistence | 1 day |
| Email notification | 0.5 day |
| KPI strip | 0.5 day |
| Per-job score weights | 0.5 day |
| Duplicate detection | 2 hours |
| Candidate comparison view | 1 day |
| Pipeline Kanban view | 2 days |
| Interview notes | 1 day |
| Application analytics | 1.5 days |
| **Total** | **~11 days** |
