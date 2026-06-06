# Implementation Plan: Skill Gap Radar + Job Application Fit Score

> Both features read from the user's career profile. Auth and a saved profile in the DB are required before either feature is buildable.

---

## Feature 1: Skill Gap Radar

### Does it need AI?

**Short answer: No for calculation. Yes for recommendations.**

| Sub-task | AI needed? | Why |
|---|---|---|
| Calculate which skills are missing | ❌ No | Pure set difference: `required_skills - user_skills` |
| Fuzzy/partial skill matching (e.g. "AWS EC2" counts for "AWS") | ⚠️ Optional | Can use same partial word matching already in the codebase |
| Rank which gap matters most | ✅ Yes | Context-dependent — AI adds real value here |
| Suggest how to close each gap | ✅ Yes | Learning paths, timeframes, resources |
| Readiness score (%) | ❌ No | `matched / total * 100` |

**The radar chart itself is 100% deterministic.** AI is only needed for the "what to do about it" layer — which is where the AI Coach picks up.

---

### How It Works

```
User selects a trajectory node (target role)
        ↓
Backend fetches node.required_skills
        ↓
Backend fetches user's career_profile.skills
        ↓
Server computes:
  - matched_skills = intersection(required, user_skills)  [partial match]
  - gap_skills = required_skills NOT in user_skills
  - readiness_score = matched / total * 100
        ↓
Frontend renders radar chart
        ↓
(Optional) AI Coach explains gaps + priority order
```

---

### Radar Chart Data Structure

```json
{
  "node": "Staff Engineer",
  "readiness_score": 67,
  "axes": [
    { "skill": "Kubernetes",     "user_level": 0.9, "required_level": 1.0, "gap": 0.1 },
    { "skill": "System Design",  "user_level": 0.4, "required_level": 1.0, "gap": 0.6 },
    { "skill": "Python",         "user_level": 0.8, "required_level": 0.8, "gap": 0.0 },
    { "skill": "Mentoring",      "user_level": 0.2, "required_level": 0.7, "gap": 0.5 },
    { "skill": "AWS",            "user_level": 0.7, "required_level": 0.9, "gap": 0.2 }
  ],
  "matched": 3,
  "total": 5,
  "critical_gaps": ["System Design", "Mentoring"]
}
```

`user_level` is inferred from `confidence` in the extracted profile (from Layer 1 DeepSeek extraction). Required level is fixed per node.

---

### API Endpoint

```
GET /api/skill-gap?node_id=<uuid>
Authorization: Bearer <jwt>

Response: radar chart data (see structure above)
```

No DeepSeek call needed. Pure DB reads + server computation.

---

### Visualisation

**Library:** Recharts `RadarChart`

```
             Kubernetes
                 │
        ████████ │ ████░░
       /                  \
      /                    \
 Mentoring              System Design
   ██░░░░░░            ████░░░░░░░░
      \                    /
       \                  /
        Python ──────── AWS
         ████████     ███████░

— Solid fill = user's current level
— Dashed outline = required level for the node
— Gap score displayed below: "67% ready · 2 critical gaps"
```

Node colours follow the same system as the trajectory graph:
- Green axis = no gap (met or exceeded)
- Yellow axis = partial gap
- Red axis = critical gap (user level < 50% of required)

---

### Skill Level Inference from User Profile

Since the user profile stores skills extracted by DeepSeek with `confidence` scores, map them to levels:

```
confidence >= 0.85  →  user_level = 1.0   (expert/senior)
confidence 0.70–0.84 → user_level = 0.75  (solid mid)
confidence 0.50–0.69 → user_level = 0.50  (junior/partial)
confidence < 0.50   →  skill not counted  (too weak to claim)
```

If the user profile has no evidence for a required skill → `user_level = 0.0`.

---

## Feature 2: Job Application Fit Score (Reverse Feature)

### What it does

From the **candidate's perspective**: given their profile, how strong is their application for a specific job posting?

This is the **mirror of the reviewer dashboard** — same scoring engine, but the candidate sees their own score before they apply, with a breakdown of what to improve.

---

### How It Relates to the Existing Scoring Engine

The reviewer dashboard already calculates:
```
Composite = (Semantic × 0.40) + (Skill Coverage × 0.25)
          + (Verification × 0.20) + (Context Fit × 0.15)
```

The Job Fit Score uses the same formula but:
- Exposes it to the **candidate** before submission
- Adds **"what to improve"** guidance per weak factor
- Shows a **probability band** instead of just a number

---

### When it shows

- **Job listing page** — compact fit badge on each job card (e.g. "74% pre-match")
- **Job detail page** — full breakdown when the user clicks into a role

This is shown **before the user applies** — no work sample has been completed yet.

### What the Candidate Sees

**Job listing card (compact):**
```
┌──────────────────────────────────────────────┐
│  Senior Platform Engineer                    │
│  Platform Engineering · Full-time · Hybrid   │
│                                              │
│  Your pre-match: ████████░░  74%             │
│  2 skill gaps · Context fit: strong          │
│                                              │
│  [View Role →]                               │
└──────────────────────────────────────────────┘
```

**Job detail page (full breakdown):**
```
┌──────────────────────────────────────────────────────┐
│  Your Fit for: Senior Platform Engineer              │
│  Pre-application estimate based on your profile      │
│                                                      │
│  Pre-match Score           0.71  ●●●●●●●○○○          │
│  ─────────────────────────────────────────────────── │
│  Semantic Alignment        0.83   Strong ✓           │
│  Skill Coverage            0.60   Gaps found ⚠       │
│  Context Fit               1.00   Strong ✓           │
│  Verification              —      Unlocks after      │
│                                   work sample ○      │
│                                                      │
│  Skill gaps: Kubernetes, Python                      │
│  → Apply and complete the work sample to unlock      │
│    your full composite score (+0.20 potential)       │
│                                                      │
│  [Apply for this role →]                             │
└──────────────────────────────────────────────────────┘
```

Verification is intentionally shown as `—` (not 0) to avoid misleading the user into thinking they scored poorly — they simply haven't been tested yet.

---

### API Endpoint

```
GET /api/job-fit?job_id=<uuid>
Authorization: Bearer <jwt>

Response:
{
  "composite": 0.71,
  "scores": {
    "semantic": 0.83,
    "skill_coverage": 0.60,
    "verification": 0.00,
    "context_fit": 1.00
  },
  "improvement_hints": [
    "Complete the work sample assessment to unlock the verification score (+0.20 max)",
    "Add evidence for: Kubernetes, Python to improve skill coverage"
  ],
  "probability_band": "Marginal — human review likely required"
}
```

---

### Does This Need AI?

**No.** Same deterministic scoring engine already built in `Dashboard.jsx`. Move it to the backend, make it callable per user+job, return the result with improvement hints generated from simple rules:

```python
hints = []

if scores["verification"] == 0:
    hints.append("Complete the work sample assessment to unlock the verification score (+0.20 max)")

if scores["skill_coverage"] < 0.7:
    gaps = [s for s in job.required_skills if s not in user.skills]
    hints.append(f"Add evidence for: {', '.join(gaps[:3])} to improve skill coverage")

if scores["context_fit"] < 0.5:
    hints.append("Your preferred working style may not align with this team's pace and structure")
```

No DeepSeek needed. Hints are rule-based, deterministic, and honest.

---

### Probability Band Mapping

| Composite | Band | Message shown to candidate |
|---|---|---|
| 0.75 – 1.00 | Strong | "Strong application — likely to progress to interview" |
| 0.60 – 0.74 | Marginal | "Marginal — human review likely required" |
| < 0.60 | Weak | "Significant gaps detected — consider improving before applying" |

---

## How Both Features Connect

```
User profile (skills + work_context + goals)
        │
        ├──→ Skill Gap Radar
        │       Reads: user.skills vs node.required_skills
        │       Output: radar chart + readiness % + critical gaps
        │
        └──→ Job Application Fit Score
                Reads: user profile vs job.required_skills + job.team_context
                Output: composite fit score + improvement hints + probability band
```

Both are **read-only, deterministic, and cheap** — no DeepSeek calls required. The AI Coach is the layer that explains what to do about the gaps they reveal.

---

## What the User Profile Must Contain (for both features)

| Field | Used by | Source |
|---|---|---|
| `skills[]` with `confidence` per skill | Both | DeepSeek Layer 1 extraction |
| `work_context.preferred_pace` | Job fit (context fit score) | DeepSeek Layer 1 extraction |
| `work_context.autonomy_level` | Job fit (context fit score) | DeepSeek Layer 1 extraction |
| `assessment.normalised_score` | Job fit (verification score) | DeepSeek Layer 2 grading |
| `embedding_mock[]` | Job fit (semantic score) | Computed from Layer 1 confidence |

This data is already captured in the current prototype's application flow. For the career profile use case, it needs to be saved to the DB under the user's account (not just localStorage).

---

## Dependencies

| Requirement | Skill Gap Radar | Job Fit Score |
|---|---|---|
| Auth + user session | ✅ Required | ✅ Required |
| Career profile in DB | ✅ Required | ✅ Required |
| Trajectory nodes seeded | ✅ Required | ❌ Not needed |
| Job postings in DB | ❌ Not needed | ✅ Required |
| DeepSeek call | ❌ Not needed | ❌ Not needed |
| Scoring engine moved to backend | ❌ Not needed | ✅ Required |

---

## Build Order

```
Phase 0 — Auth + career_profiles table              ← prerequisite for both
     ↓
Phase 1 — Trajectory nodes seeded                  ← prerequisite for radar only
     ↓
Phase A — /api/skill-gap endpoint + Recharts radar  ← 1–2 days
     ↓
Phase B — Scoring engine moved to backend           ← 0.5 day (already written in frontend)
     ↓
Phase C — /api/job-fit endpoint + improvement hints ← 1 day
     ↓
Phase D — Job fit UI on job detail page             ← 1 day
```

---

## Effort Estimate

| Feature | Effort (after Phase 0) |
|---|---|
| Skill gap computation endpoint | 2 hours |
| Radar chart UI (Recharts) | 1 day |
| Job fit scoring endpoint | 0.5 day |
| Improvement hints (rule-based) | 2 hours |
| Job fit UI on job detail page | 1 day |
| **Total** | **~3–4 days** |
