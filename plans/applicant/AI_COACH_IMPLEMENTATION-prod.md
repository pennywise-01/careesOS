# Implementation Plan: AI Career Coach

> **Dependency:** Auth flow (Phase 0) and Career Trajectory Graph (Phases 0–2) must be completed before this feature is buildable. The coach is only meaningful when it has a verified user profile and trajectory suggestions to reason from.

---

## What It Does

The AI Career Coach reads the user's career profile, their suggested trajectory nodes, and the required skills for each node. It then tells the user specifically what they need to do — with a prioritised action plan — to maximise their chances of progressing to their target role.

---

## Hard Dependencies

| Dependency | Why Required |
|---|---|
| **Auth + user session (Phase 0)** | Coach context must be user-specific. No auth = no isolation = responses could bleed between users |
| **Career profile in DB** | Coach needs current role, skills, years exp, industry, life chapter |
| **Trajectory nodes seeded in DB** | Coach references required_skills from actual node data, not hallucinated |
| **DeepSeek node ranking done (Phase 2)** | Coach needs to know which nodes were suggested and their probabilities |
| **Skill gap pre-computation** | Gaps are calculated server-side before DeepSeek is called — never ask DeepSeek to compute what your backend can calculate deterministically |

---

## Database

### New table required

```sql
CREATE TABLE coach_conversations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES auth.users(id),
  node_id      UUID REFERENCES trajectory_nodes(id) NULL,  -- which path they were discussing
  role         TEXT NOT NULL,    -- 'user' | 'assistant'
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON coach_conversations(user_id, created_at DESC);
```

### Why `node_id` on each message
Conversations are anchored to the node the user clicked. If the user switches to a different path node, a fresh context window is built. This prevents the coach from confusing advice across different target roles.

---

## API Endpoints

### Send a message
```
POST /api/coach/message
Authorization: Bearer <jwt>

Body:
{
  "message": "string",
  "node_id": "uuid"   // the trajectory node currently selected
}

Response:
{
  "reply": "string",
  "structured": {
    "immediate_action": "string",
    "goal_30_day": "string",
    "goal_90_day": "string",
    "blockers": ["string"]
  }
}
```

### Get conversation history
```
GET /api/coach/history?node_id=<uuid>
Authorization: Bearer <jwt>

Response: last 20 messages for this user + node
```

---

## Backend Logic (per message)

```python
1.  Verify JWT → extract user_id

2.  Fetch career_profile WHERE user_id = ?
      → current_role, skills, years_experience, industry, life_chapter

3.  Fetch trajectory_node WHERE id = node_id
      → role_title, required_skills, seniority_level, salary range

4.  Compute skill gaps (server-side, not DeepSeek):
      gaps = [s for s in node.required_skills if s not in profile.skills]

5.  Fetch last 6 messages WHERE user_id = ? AND node_id = ?
      ORDER BY created_at DESC LIMIT 6

6.  Build DeepSeek prompt (see below)

7.  Call DeepSeek API

8.  Save user message + assistant reply to coach_conversations

9.  Return structured response to frontend
```

---

## DeepSeek Prompt Architecture

### System prompt (sent once per conversation)
```
You are a Career OS co-pilot for professionals in Southeast Asia.
You have access to the user's full career profile, their selected target career node,
the exact required skills for that node, and their computed skill gaps.

Rules:
- Give specific, actionable advice grounded in the user's actual data
- Never give generic career tips (e.g. "network more", "be proactive")
- ONLY reference skills from the provided required_skills list — do not invent certifications or tools
- Always prioritise the highest-leverage action based on the largest or most critical skill gap
- When asked for a plan, structure your response as:
    IMMEDIATE: (single most important action this week)
    30 DAYS: (one concrete milestone)
    90 DAYS: (measurable outcome that signals readiness)
    BLOCKERS: (honest list of what could slow this down)
- Sound like a senior mentor who has seen thousands of careers, not a chatbot
- Be honest — do not inflate the user's readiness or hide hard truths
```

### User context block (injected on every message)
```
--- USER PROFILE ---
Current role: {current_role}
Industry: {industry}
Years experience: {years_experience}
Life chapter: {life_chapter}
Current skills: {profile.skills as comma list}

--- TARGET CAREER NODE ---
Role: {node.role_title}
Seniority: {node.seniority_level}
Required skills: {node.required_skills as comma list}
Salary range: RM {node.salary_min} – {node.salary_max}

--- COMPUTED SKILL GAPS ---
Missing: {gaps as comma list}
Coverage: {matched}/{total} required skills

--- CONVERSATION HISTORY (last 6 messages) ---
{history}

--- USER'S MESSAGE ---
{message}
```

### Why gaps are pre-computed server-side
Asking DeepSeek to compute gaps wastes tokens and introduces hallucination risk. The backend does a simple array diff — fast, deterministic, free. DeepSeek only receives the result and uses it for reasoning.

---

## Token Budget Management

| Context component | Approx tokens |
|---|---|
| System prompt | ~300 |
| User profile block | ~150 |
| Node + required skills | ~100 |
| Computed gaps | ~50 |
| Last 6 messages | ~600 (100 each) |
| User's current message | ~100 |
| **Total input** | **~1,300** |
| DeepSeek max context | 64,000 |

Well within limits. If conversations grow very long, drop to last 4 messages and append a one-sentence summary of older context.

---

## Conversation History Strategy

| Scenario | Behaviour |
|---|---|
| User clicks a new node | New context window — load history for that node_id |
| User returns to a previous node | Load existing history for that node_id — conversation resumes |
| User asks a follow-up | Last 6 messages included — coach remembers context |
| Session expires / user returns next day | History loaded from DB — no loss of context |
| History grows beyond 20 messages | Keep last 6 in prompt, summarise the rest in one sentence |

---

## Frontend Integration

### Coach panel layout
```
┌─────────────────────────────────────┐
│  AI Career Coach                    │
│  ─────────────────────────────────  │
│  Discussing: Staff Engineer path    │
│                                     │
│  [Coach message bubble]             │
│  "Your biggest gap is System        │
│   Design. Here's what I'd do..."    │
│                                     │
│  IMMEDIATE: ...                     │
│  30 DAYS: ...                       │
│  90 DAYS: ...                       │
│                                     │
│  [User message bubble]              │
│                                     │
│  ─────────────────────────────────  │
│  [Type your question...]  [Send]    │
└─────────────────────────────────────┘
```

### Trigger events
- **User clicks a trajectory node** → Coach auto-sends a first message analysing that path without user input
- **User sends a follow-up** → Normal chat exchange
- **User switches node** → Coach panel header updates, new context loaded, auto-analysis sent

### First message (auto-triggered on node click)
No user input needed — backend generates the first message automatically:
```
Trigger: "Analyse this candidate's fit for the selected node and give them
          their prioritised action plan (IMMEDIATE / 30 DAYS / 90 DAYS)."
```
This makes the coach feel proactive, not a blank chat box.

---

## Build Order

```
Phase 0 — Auth complete + career_profiles table       ← prerequisite
     ↓
Phase 1 — Trajectory nodes seeded                     ← prerequisite
     ↓
Phase 2 — DeepSeek node ranking working               ← prerequisite
     ↓
Phase 3a — Skill gap computation endpoint (backend)   ← 2 hours
     ↓
Phase 3b — coach_conversations table + history API    ← 2 hours
     ↓
Phase 3c — /api/coach/message endpoint + prompt       ← 1 day
     ↓
Phase 3d — Coach panel UI (chat + structured output)  ← 1–2 days
     ↓
Phase 3e — Auto-trigger on node click                 ← 2 hours
```

---

## Effort Estimate

| Phase | Effort | Blocker |
|---|---|---|
| Phase 0 (Auth) | 2–3 days | None — start here |
| Phase 1 (Seed data) | 1 day | None — can run in parallel |
| Phase 2 (Trajectory ranking) | 1 day | Phase 0 |
| Phase 3a (Gap computation) | 2 hours | Phase 0 + 1 |
| Phase 3b (Conversation DB) | 2 hours | Phase 0 |
| Phase 3c (Coach API) | 1 day | Phase 3a + 3b |
| Phase 3d (Coach UI) | 1–2 days | Phase 3c |
| Phase 3e (Auto-trigger) | 2 hours | Phase 3d |
| **Total (coach only)** | **~2–3 days after trajectory is done** | — |
| **Total (end to end)** | **~8–10 days** | — |

---

## Known Risks

| Risk | Mitigation |
|---|---|
| DeepSeek references skills not in node data | System prompt constraint: "only use provided required_skills" |
| Token bloat from long conversations | Trim to last 6 messages, summarise older context |
| Coach gives generic advice | Strict system prompt rules + inject real gap data |
| User session expires mid-conversation | History persisted in DB — resumes cleanly on re-login |
| High DeepSeek API cost at scale | Cache first auto-message per user+node combo (same profile = same gaps = same advice) |
