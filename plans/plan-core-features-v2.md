# Next-Gen Talent Platform — Full Product Plan

> A three-layer system that replaces keyword-based job matching with semantic intelligence, verified skill signals, and a self-improving feedback loop.

---

## Table of Contents

1. [Problem Statement](#1-problem-statement)
2. [Solution Overview](#2-solution-overview)
3. [Layer 1 — Semantic Matching Engine](#3-layer-1--semantic-matching-engine)
   - 3.1 Candidate Profile Pipeline
   - 3.2 Job Profile Pipeline
   - 3.3 Matching Logic
4. [Layer 2 — Skill Verification](#4-layer-2--skill-verification)
   - 4.1 Work Sample Assessments
   - 4.2 Portfolio Signal Parsing
   - 4.3 Verification Scoring Engine
5. [Layer 3 — Post-Hire Feedback Loop](#5-layer-3--post-hire-feedback-loop)
   - 5.1 Outcome Data Collection
   - 5.2 Signal Aggregation
   - 5.3 Model Retraining
6. [Data Schema](#6-data-schema)
7. [LLM Prompt Templates](#7-llm-prompt-templates)
8. [Tech Stack](#8-tech-stack)
9. [MVP Scope](#9-mvp-scope)
10. [Key Design Principles](#10-key-design-principles)

---

## 1. Problem Statement

Existing platforms (LinkedIn, Indeed, Jobstreet) share three critical structural failures:

### 1.1 Keyword-Based Matching is Shallow
- Matching is done on keyword/ATS overlap between resume text and job description text.
- A candidate who writes "built cloud infrastructure to cut latency by 40%" gets filtered out while someone who keyword-stuffed "AWS, Kubernetes, Terraform, DevSecOps" ranks first — regardless of actual competency.
- Neither side is semantically understood. Matching resumes to job descriptions ≠ matching humans to roles.

### 1.2 No Verified Skill Signal
- Profiles are entirely self-reported. Endorsements are unverified clicks. Certifications confirm study, not applied ability.
- There is no way to distinguish a candidate who led a cloud migration solo from someone who attended two project meetings.
- Recruiters make hiring decisions on thin, unverified, unstructured data.

### 1.3 No Post-Hire Feedback Loop
- Platforms optimise for *applications submitted* or *job posts filled*, not *successful placements*.
- There is zero signal flowing back from "this hire succeeded / failed" into the matching algorithm.
- The model never learns. Matching quality does not improve with scale.

---

## 2. Solution Overview

Three compounding layers that each fix one problem and feed the next:

```
┌─────────────────────────────────────────────────────┐
│  Layer 1 — Semantic Matching Engine                 │
│  Replaces keyword overlap with vector similarity    │
└───────────────────────┬─────────────────────────────┘
                        │ better candidates reach verification
┌───────────────────────▼─────────────────────────────┐
│  Layer 2 — Skill Verification                       │
│  Replaces self-reported claims with observed perf.  │
└───────────────────────┬─────────────────────────────┘
                        │ verified scores enrich profiles
┌───────────────────────▼─────────────────────────────┐
│  Layer 3 — Post-Hire Feedback Loop                  │
│  Every hire outcome retrains the matching model     │
└───────────────────────┬─────────────────────────────┘
                        │ improves match weights
                        └──────────────► back to Layer 1
```

Each layer independently improves the platform. Together they compound: better matching → better candidates reach verification → richer verified signal feeds the feedback loop → feedback loop improves matching weights.

---

## 3. Layer 1 — Semantic Matching Engine

### 3.1 Candidate Profile Pipeline

The goal is to convert a candidate's raw narrative into a structured, embeddable semantic profile. **Do not ask for a resume.** Run an asynchronous LLM-guided interview instead.

#### 3.1.1 Raw Input Collection

Collect three types of input:

**A. Guided Questionnaire (required)**

Ask 5–8 open-ended questions designed to extract narrative, not keywords. The candidate answers async over text. Example questions:

1. "Tell me about a piece of work you're most proud of. What was the problem? What did you specifically do — not your team, you? What changed as a result?"
2. "Describe the most technically complex thing you've built or solved. Walk me through your approach."
3. "What kind of environment do you do your best work in? Think about team size, pace, how decisions get made, and how much ambiguity you're comfortable with."
4. "What are you trying to move toward in your career in the next 2 years? And what are you actively trying to move away from?"
5. "Tell me about a time something you built failed or underperformed. What happened, and what did you do about it?"
6. (Role-specific) e.g. for security: "Walk me through how you approach a threat model for a new system."

Design principles for questions:
- Open-ended — no dropdowns, no star ratings, no multiple choice.
- Outcome-focused — "what changed as a result?" forces evidence, not claims.
- Anti-keyword — phrased to elicit story, not list of technologies.
- Role-adaptive — add 1–2 domain-specific questions based on the role category the candidate selects.

**B. Portfolio Links (optional)**

- GitHub profile URL
- Personal blog / write-up links
- Public case study links
- LinkedIn URL (for tenure/title extraction only, not keyword matching)

**C. Career History Context (optional)**

- Last 3 roles: title, company, team size, and a 2–3 sentence description of what they actually did (not a job description copy-paste)
- Reason for leaving each role

---

#### 3.1.2 LLM Extraction Layer

An LLM reads all raw inputs and extracts structured data according to a strict schema. This is the core conversion step — messy human narrative → structured, comparable fields.

**Model:** GPT-4o or Claude Sonnet (latest). Use structured output / JSON mode.

**Extraction prompt** (see Section 7.1 for full template):

The LLM is instructed to extract:

- `skills[]` — each with: skill name, evidence quote (verbatim from candidate answer), inferred proficiency tier (junior / mid / senior / expert), confidence score (0–1)
- `work_context` — preferred team size range, preferred pace (exploratory / balanced / execution-focused), autonomy preference (low / medium / high), industry familiarity[]
- `goals` — direction (what they want more of), anti_preferences (what they want to avoid), time_horizon
- `soft_signals` — communication style (inferred), decision_making_pattern (inferred), collaboration_preference
- `red_flags[]` — anything that warrants recruiter attention (job-hopping without explanation, inconsistencies, vague answers on critical questions)

**Rules the LLM must follow:**
- If something cannot be confidently inferred, set it to `null`. Do not hallucinate or guess.
- Evidence quotes must be verbatim from the candidate's own words.
- Confidence scores reflect how much evidence supports each field.
- Flag any answer that is suspiciously keyword-dense (possible prompt-gaming).

---

#### 3.1.3 Structured Profile Fields

The structured profile has three primary embedding dimensions:

**A. Skill Evidence**

Each skill entry contains:
```
{
  "name": "Kubernetes",
  "evidence_quote": "migrated 3-node cluster to EKS, reduced deploy time from 45 min to 8 min",
  "inferred_level": "senior",
  "confidence": 0.87,
  "verified": false,          ← updated by Layer 2
  "verified_score": null      ← updated by Layer 2
}
```

**B. Work Context**

```
{
  "preferred_team_size": "5–15",
  "preferred_pace": "balanced",
  "autonomy_level": "high",
  "industry_familiarity": ["fintech", "b2b saas"],
  "remote_preference": "hybrid"
}
```

**C. Goals & Values**

```
{
  "direction": "move into technical leadership, stay hands-on",
  "anti_preferences": ["pure management", "enterprise bureaucracy"],
  "time_horizon": "2 years",
  "motivation_type": "impact-driven"
}
```

**D. Soft Signals** (inferred, lower confidence weight)

```
{
  "communication_style": "direct, structured",
  "decision_making": "data-first, moves fast under ambiguity",
  "collaboration_preference": "async-first, sync for key decisions"
}
```

---

#### 3.1.4 Embedding Step

Once the structured profile is extracted, serialize it into a rich text representation and embed it:

**Serialization format:**

```
Candidate skills: [Kubernetes (senior, high confidence), AWS IAM (expert), Python (senior)]
Work context: thrives in teams of 5–15, high autonomy, balanced pace, fintech familiarity
Goals: moving toward technical leadership, avoiding pure management roles
Work style: direct communicator, data-first decisions, async-first collaboration
Notable evidence: migrated 3-node cluster to EKS, reduced deploy time from 45 to 8 min
```

**Embedding model:** `text-embedding-3-large` (OpenAI) — 1536 dimensions. Alternatively `embed-english-v3.0` (Cohere) for higher retrieval accuracy on longer documents.

**Storage:** Store the embedding vector alongside the structured profile in the database. Use `pgvector` extension on PostgreSQL for MVP. Migrate to Pinecone or Weaviate at scale (>100k candidates).

**Refresh policy:** Re-embed the profile whenever:
- The candidate updates their answers
- A verified skill score is added (from Layer 2)
- The candidate completes a new work sample

---

### 3.2 Job Profile Pipeline

The job profile goes through the same pipeline as the candidate profile. **Do not accept a copy-pasted job description.** Guide the hiring manager through structured input instead.

#### 3.2.1 Hiring Manager Questionnaire

Replace the job description form with these questions:

1. "What problem is this person solving? What does failure look like at 6 months, and what does success look like?"
2. "What will they spend 80% of their time actually doing day-to-day?"
3. "What decisions will they own? What will they need to get approved?"
4. "What does the person who would thrive here look like — not in terms of job titles, but in how they think and work?"
5. "What environment are they joining? Team size, pace, how technical is the surrounding team?"
6. "What hard skills are non-negotiable vs nice-to-have? Be specific — not 'strong Python' but 'can optimise slow queries and write production-grade async code'."

#### 3.2.2 Job Profile Fields

Same extraction schema as candidates, with job-side fields:

```
{
  "role_outcomes": ["reduce API p95 latency to <200ms in 6 months", "own platform observability stack"],
  "daily_work": ["writing and reviewing Python services", "on-call rotation 1 week/month"],
  "decision_authority": "owns technical approach, gets headcount/vendor approved",
  "required_skills": [{"name": "Python", "level": "senior", "non_negotiable": true}],
  "nice_to_have_skills": [{"name": "Rust", "level": "any"}],
  "team_context": {"size": 8, "pace": "fast", "autonomy": "high"},
  "growth_offered": "IC leadership track, no mandatory management"
}
```

#### 3.2.3 Job Embedding

Same serialization → `text-embedding-3-large` → pgvector storage.

---

### 3.3 Matching Logic

#### 3.3.1 Similarity Search

At query time:
1. Embed the job profile → produce job vector `j`
2. Run cosine similarity search against all candidate vectors in pgvector
3. Return top-N candidates ranked by similarity score

```sql
SELECT candidate_id, profile, 
       1 - (embedding <=> $1) AS similarity_score
FROM candidates
ORDER BY embedding <=> $1
LIMIT 50;
```

#### 3.3.2 Composite Score

Raw vector similarity is one input. The final match score combines:

| Component | Weight | Description |
|---|---|---|
| Semantic similarity | 40% | Cosine similarity between candidate and job vectors |
| Skill coverage | 25% | % of non-negotiable skills with evidence in profile |
| Verification score | 20% | Verified skill score from Layer 2 (0 if not yet verified) |
| Context fit | 15% | Alignment on work context and goals fields |

Weights are configurable and will be tuned by Layer 3 retraining.

#### 3.3.3 Explainability

For every match, surface to the recruiter:
- Top 3 reasons this candidate was matched (skill evidence quotes from their answers)
- Top 1–2 mismatches or unknowns (fields where confidence was low or null)
- Verification status per skill (verified / unverified / not assessed)

---

## 4. Layer 2 — Skill Verification

### 4.1 Work Sample Assessments

Work samples are short, role-relevant tasks that observe how a candidate actually thinks and executes — not trivia, not leetcode.

#### 4.1.1 Assessment Design Principles

- **Time-boxed:** 45–90 minutes max. Never multi-hour take-homes.
- **Role-realistic:** The task should resemble something they would actually do in the first month of the job.
- **Open-ended output:** No multiple choice. Produce something — a design, a script, a code review, an analysis.
- **Graded on approach, not just output:** Evaluators score the reasoning, edge cases considered, and communication — not just whether the final answer is correct.

#### 4.1.2 Assessment Types by Role Category

**Software Engineering**
- Fix a bug in a real-ish codebase (provided repo) and write the PR description
- Review a pull request and leave comments as you would for a junior engineer
- Given a slow query and schema, propose and justify an optimisation

**Cloud / DevSecOps / Security**
- Audit a misconfigured IAM policy and document findings with severity ratings
- Given a flawed Terraform module, identify issues and propose fixes
- Threat model a simple web application architecture

**Product / Design**
- Given a user complaint thread, identify the underlying problem and propose a solution with trade-offs
- Critique a provided UI flow and suggest improvements with rationale

**Data / Analytics**
- Given a messy dataset (CSV), clean it and answer 3 business questions with visualisations
- Write and explain a SQL query for a given business question against a provided schema

#### 4.1.3 Anti-Cheating Design

- Tasks are parameterized — details change per candidate (different variable names, schemas, bug types). No two candidates see the exact same task.
- A follow-up async Q&A is sent after submission: "Walk me through how you approached X" — answers must be consistent with the submission.
- Submissions are diff'd against known solutions and public code. Plagiarism detection is run automatically.
- Completion time is recorded. Suspiciously fast submissions flag for review.

---

### 4.2 Portfolio Signal Parsing

For candidates who provide GitHub or portfolio links, automated parsing extracts additional signal:

**GitHub signals:**
- Commit frequency and consistency over time (not just recency)
- Code review activity (comments left on others' PRs) — signals collaborative ability
- Language distribution — what they actually write vs. what they claim
- Repo quality indicators: README quality, test coverage presence, CI/CD configuration, issue tracking usage
- Stars/forks on their own repos (social validation signal, low weight)

**Blog / writing signals:**
- Technical depth of articles (parsed via LLM, scored on specificity and accuracy)
- Recency — when was the last piece of substantive writing?

**Parsing approach:**
- GitHub: use GitHub API (`/repos`, `/commits`, `/pulls`) to collect raw data, then run an LLM summarisation pass to produce a structured `portfolio_signal` object
- Blogs: `fetch(url)` → extract main content → LLM analysis

**Portfolio signals feed into** the `skill_evidence` array in the candidate profile, supplementing (not replacing) their questionnaire answers.

---

### 4.3 Verification Scoring Engine

#### 4.3.1 Scoring Dimensions

Each work sample is scored on 4 dimensions:

| Dimension | What it measures | Weight |
|---|---|---|
| Task completion | Did they produce the requested output? | 25% |
| Technical accuracy | Is the output correct / sound? | 35% |
| Code / work quality | Readability, structure, edge cases, documentation | 25% |
| Communication | How well did they explain their approach? | 15% |

#### 4.3.2 Peer Cohort Normalisation

Scores are normalised against a cohort of candidates who completed the same assessment. This prevents score inflation/deflation across different task difficulties.

```
normalised_score = (raw_score - cohort_mean) / cohort_stddev
```

The final displayed score is a percentile rank within the relevant cohort (e.g. "top 15% of cloud security candidates").

#### 4.3.3 Verified Badge

A skill receives a `verified: true` badge when:
- A work sample directly tested that skill
- The normalised score is above the 40th percentile
- The follow-up Q&A answers are consistent with the submission

Verified badges are shown to recruiters with the underlying percentile and the evidence. No binary pass/fail — recruiters see the full breakdown.

#### 4.3.4 Profile Update

On verification:
1. Update `skill.verified = true` and `skill.verified_score = normalised_score` in the candidate profile
2. Re-serialize and re-embed the full profile
3. Recalculate composite match score for any active job matches

---

## 5. Layer 3 — Post-Hire Feedback Loop

### 5.1 Outcome Data Collection

#### 5.1.1 Check-In Schedule

Automated check-ins sent to both the new hire and their hiring manager:

| Milestone | Sent to | Questions |
|---|---|---|
| 30 days | Hire + Manager | Onboarding smoothness, early signals of fit |
| 90 days | Hire + Manager | Performance trajectory, role-reality match |
| 180 days | Manager | Retention likelihood, skill gap assessment |
| 12 months | Manager | Promotion track, overall hire quality rating |

#### 5.1.2 Check-In Questions

These are short (3–5 questions), structured for machine-readability, not open-ended essays.

**Manager check-in (90 days):**
1. "How would you rate this hire's performance so far?" (1–5 scale)
2. "How well did the candidate's stated skills match what you actually needed?" (1–5 scale)
3. "Is this person on track to meet the role outcomes we defined?" (yes / needs support / no)
4. "What surprised you most — positively or negatively — about this hire?" (short text, optional)
5. "Would you hire this person again if starting over?" (yes / probably yes / unsure / no)

**Hire check-in (90 days):**
1. "How well does the role match what was described in the hiring process?" (1–5 scale)
2. "Do you feel your skills are well-matched to what's actually needed?" (yes / some gaps / significant mismatch)
3. "How satisfied are you with this role?" (1–5 scale)
4. "Is there anything about the job that was significantly different from what you expected?" (short text, optional)

---

### 5.2 Signal Aggregation

All post-hire data is aggregated into a `hire_outcome` record linked back to the original match:

```json
{
  "hire_id": "uuid",
  "candidate_id": "uuid",
  "job_id": "uuid",
  "match_score_at_hire": 0.83,
  "match_components_at_hire": {
    "semantic_similarity": 0.79,
    "skill_coverage": 0.90,
    "verification_score": 0.85,
    "context_fit": 0.78
  },
  "outcomes": {
    "30_day_manager_rating": 4,
    "90_day_manager_rating": 4,
    "90_day_hire_satisfaction": 5,
    "180_day_retention": true,
    "12_month_promoted": false,
    "overall_hire_quality": "good"
  },
  "label": "successful"   ← derived: successful / neutral / poor
}
```

**Label derivation rules:**

| Label | Criteria |
|---|---|
| `successful` | 90-day manager rating ≥ 4 AND hire satisfaction ≥ 4 AND retained at 180 days |
| `poor` | 90-day manager rating ≤ 2 OR hire left before 180 days |
| `neutral` | Everything else |

---

### 5.3 Model Retraining

#### 5.3.1 What Gets Retrained

The matching composite score weights (Section 3.3.2) are retrained on the labeled outcome dataset. This is a regression/ranking model, not the embedding model itself.

**Training signal:** For each hire outcome, the question is: which match components were predictive of success/failure?

If candidates with high `context_fit` scores consistently outperform candidates with high `semantic_similarity` alone, the model learns to weight context fit higher.

#### 5.3.2 Retraining Schedule

- **Trigger-based:** Retrain when 50+ new labeled outcomes are available
- **Minimum frequency:** Monthly retrain even if fewer outcomes (prevents model staleness)
- **Validation:** Hold out 20% of outcomes for validation. Only deploy new weights if validation performance improves.

#### 5.3.3 What Retraining Does NOT Do

- Does not retrain the embedding model (that's a separate, expensive process)
- Does not directly modify candidate or job profiles
- Does not expose any individual hire outcome data to candidates or employers

---

## 6. Data Schema

### 6.1 Candidate Profile

```sql
CREATE TABLE candidates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  -- Raw inputs
  questionnaire_answers  JSONB,
  portfolio_urls         TEXT[],
  career_history         JSONB,

  -- Extracted structured profile
  skills                 JSONB,   -- skill evidence array
  work_context           JSONB,
  goals                  JSONB,
  soft_signals           JSONB,
  red_flags              JSONB,
  extraction_confidence  FLOAT,   -- overall confidence in extraction quality

  -- Embedding
  embedding              VECTOR(1536),
  embedding_updated_at   TIMESTAMPTZ,

  -- Verification
  assessments_completed  INT DEFAULT 0,
  verified_skills        TEXT[]   -- names of verified skills
);
```

### 6.2 Job Profile

```sql
CREATE TABLE jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id     UUID REFERENCES employers(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  status          TEXT DEFAULT 'active',  -- active / paused / filled / closed

  -- HM answers (raw)
  hm_questionnaire_answers  JSONB,

  -- Extracted job profile
  role_outcomes          JSONB,
  daily_work             JSONB,
  required_skills        JSONB,
  nice_to_have_skills    JSONB,
  team_context           JSONB,
  decision_authority     TEXT,
  growth_offered         TEXT,

  -- Embedding
  embedding              VECTOR(1536),
  embedding_updated_at   TIMESTAMPTZ
);
```

### 6.3 Match Record

```sql
CREATE TABLE matches (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id    UUID REFERENCES candidates(id),
  job_id          UUID REFERENCES jobs(id),
  created_at      TIMESTAMPTZ DEFAULT now(),

  -- Score components
  semantic_similarity  FLOAT,
  skill_coverage       FLOAT,
  verification_score   FLOAT,
  context_fit          FLOAT,
  composite_score      FLOAT,

  -- Explainability
  match_reasons        JSONB,   -- top 3 supporting evidence quotes
  match_gaps           JSONB,   -- top 1-2 unknowns or mismatches

  -- Status
  status              TEXT DEFAULT 'pending',  -- pending / viewed / shortlisted / hired / rejected
  hired_at            TIMESTAMPTZ
);
```

### 6.4 Hire Outcome

```sql
CREATE TABLE hire_outcomes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id        UUID REFERENCES matches(id),
  candidate_id    UUID REFERENCES candidates(id),
  job_id          UUID REFERENCES jobs(id),

  -- Match snapshot at time of hire
  match_score_at_hire       FLOAT,
  match_components_at_hire  JSONB,

  -- Check-in responses
  checkin_30d_manager   JSONB,
  checkin_90d_manager   JSONB,
  checkin_90d_hire      JSONB,
  checkin_180d_manager  JSONB,
  checkin_12m_manager   JSONB,

  -- Derived label
  label                 TEXT,   -- successful / neutral / poor
  retained_180d         BOOLEAN,
  retained_12m          BOOLEAN
);
```

### 6.5 Assessment

```sql
CREATE TABLE assessments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id    UUID REFERENCES candidates(id),
  created_at      TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ,

  -- Task
  task_type       TEXT,   -- e.g. 'cloud_security_audit', 'code_review', 'sql_analysis'
  task_variant    TEXT,   -- parameterised variant ID
  
  -- Submission
  submission      JSONB,
  completion_time_seconds  INT,
  
  -- Scoring
  score_task_completion    FLOAT,
  score_technical_accuracy FLOAT,
  score_work_quality       FLOAT,
  score_communication      FLOAT,
  raw_score                FLOAT,
  normalised_score         FLOAT,  -- percentile within cohort
  cohort_id                TEXT,

  -- Flags
  plagiarism_flag   BOOLEAN DEFAULT false,
  speed_flag        BOOLEAN DEFAULT false,  -- completed suspiciously fast
  followup_answers  JSONB
);
```

---

## 7. LLM Prompt Templates

### 7.1 Candidate Profile Extraction

```
You are a talent intelligence system. A candidate has answered a structured interview questionnaire. Your job is to extract a structured profile from their answers.

Candidate's answers:
---
{candidate_answers}
---

Portfolio data (if provided):
---
{portfolio_data}
---

Extract the following fields and return ONLY valid JSON. Do not include any explanation or preamble.

Rules:
- If a field cannot be confidently inferred from the candidate's own words, set it to null. Do not guess.
- evidence_quote must be verbatim from the candidate's text.
- confidence scores (0.0–1.0): 0.9+ = strong direct evidence, 0.7–0.9 = clear inference, 0.5–0.7 = reasonable inference, below 0.5 = set field to null instead.
- Flag any answer that reads as suspiciously keyword-dense or templated in red_flags.

Required JSON structure:
{
  "skills": [
    {
      "name": "string",
      "evidence_quote": "verbatim quote from candidate answer",
      "inferred_level": "junior | mid | senior | expert",
      "confidence": 0.0–1.0
    }
  ],
  "work_context": {
    "preferred_team_size": "string or null",
    "preferred_pace": "exploratory | balanced | execution-focused | null",
    "autonomy_level": "low | medium | high | null",
    "industry_familiarity": ["string"],
    "remote_preference": "remote | hybrid | onsite | no-preference | null"
  },
  "goals": {
    "direction": "string or null",
    "anti_preferences": ["string"],
    "time_horizon": "string or null",
    "motivation_type": "impact-driven | compensation-driven | growth-driven | stability-driven | null"
  },
  "soft_signals": {
    "communication_style": "string or null",
    "decision_making_pattern": "string or null",
    "collaboration_preference": "string or null"
  },
  "red_flags": [
    {
      "type": "keyword_stuffing | inconsistency | vague_answers | suspiciously_perfect",
      "detail": "string"
    }
  ],
  "extraction_confidence": 0.0–1.0
}
```

### 7.2 Job Profile Extraction

```
You are a talent intelligence system. A hiring manager has answered a structured questionnaire about an open role. Extract a structured job profile.

Hiring manager's answers:
---
{hm_answers}
---

Return ONLY valid JSON. Do not guess. Set fields to null if not clearly stated.

{
  "role_outcomes": ["string"],
  "daily_work": ["string"],
  "decision_authority": "string or null",
  "required_skills": [
    {
      "name": "string",
      "level": "any | junior | mid | senior | expert",
      "non_negotiable": true | false,
      "specifics": "string or null"
    }
  ],
  "nice_to_have_skills": [
    {
      "name": "string",
      "level": "any | junior | mid | senior | expert"
    }
  ],
  "team_context": {
    "size": "integer or null",
    "pace": "exploratory | balanced | execution-focused | null",
    "autonomy_offered": "low | medium | high | null",
    "technical_depth_of_team": "string or null"
  },
  "growth_offered": "string or null",
  "extraction_confidence": 0.0–1.0
}
```

### 7.3 Candidate Profile Serialization (for embedding)

```
Candidate profile summary for semantic embedding:

Skills (with evidence):
{for each skill: "{name} ({level}, confidence {score}): {evidence_quote}"}

Work context: {preferred_team_size} team, {autonomy_level} autonomy, {preferred_pace} pace, familiar with {industry_familiarity}

Career direction: Moving toward {direction}. Avoiding {anti_preferences}. Timeframe: {time_horizon}.

Work style: {communication_style}. Decision-making: {decision_making_pattern}. Collaboration: {collaboration_preference}.

Verification status: {count} skills verified. Verified: {verified_skills list}.
```

---

## 8. Tech Stack

### 8.1 Backend

| Component | Technology | Rationale |
|---|---|---|
| API server | FastAPI (Python) | Strong ML library ecosystem, async support |
| Database | PostgreSQL + pgvector | Single DB for relational + vector storage at MVP scale |
| Task queue | Celery + Redis | Async LLM extraction, re-embedding, score calculation |
| LLM calls | OpenAI SDK (GPT-4o) | JSON mode for structured extraction, reliable |
| Embedding | OpenAI `text-embedding-3-large` | 1536-dim, strong semantic retrieval |
| GitHub parsing | PyGithub | REST API wrapper for portfolio signal extraction |

### 8.2 Frontend

| Component | Technology |
|---|---|
| Web app | React + TypeScript |
| Candidate questionnaire | Multi-step form with autosave |
| Recruiter dashboard | Table + card views, sortable by composite score |
| Assessment delivery | Sandboxed iframe or hosted coding env (e.g. Judge0 for code) |

### 8.3 Infrastructure

| Component | Technology |
|---|---|
| Hosting | Railway or Render (MVP), AWS ECS (scale) |
| Vector DB | pgvector (MVP), Pinecone (>100k candidates) |
| Storage | S3 — assessment submission files |
| Auth | Supabase Auth or Clerk |
| Monitoring | Sentry (errors), PostHog (product analytics) |

### 8.4 ML / Retraining

| Component | Technology |
|---|---|
| Outcome label pipeline | Python script, scheduled via Celery beat |
| Weight optimisation | scikit-learn `Ridge` or `LightGBM` on labeled outcomes |
| Experiment tracking | MLflow or simple versioned JSON config |

---

## 9. MVP Scope

The MVP proves the core value proposition: semantic matching outperforms keyword matching, in one vertical, for one role type.

### 9.1 MVP Scope (Month 1–3)

**In scope:**
- Candidate questionnaire (5 questions, one role category e.g. software engineering)
- LLM extraction pipeline → structured profile → embedding → pgvector storage
- Job profile questionnaire (hiring manager, one role category)
- Cosine similarity search + basic composite score
- Recruiter dashboard: ranked candidates, match reasons, profile view
- One work sample type (e.g. code review task) with manual scoring by human reviewers

**Out of scope for MVP:**
- Portfolio parsing
- Automated assessment scoring
- Post-hire feedback loop
- Model retraining

### 9.2 MVP Success Metrics

| Metric | Target |
|---|---|
| Recruiter-rated match quality | >70% of top-10 matches rated "relevant" by recruiter |
| Candidate completion rate | >60% of started questionnaires completed |
| Time to shortlist | <24 hours from job post to ranked candidate list |
| Baseline comparison | Semantic top-10 vs. keyword top-10 — recruiter blind-rates both |

### 9.3 Phase 2 (Month 4–6)

- Automated assessment scoring (LLM-assisted + peer normalisation)
- Portfolio parsing (GitHub API)
- Composite score with verification weight
- Anti-cheating Q&A follow-up

### 9.4 Phase 3 (Month 7–12)

- Post-hire check-in system
- Hire outcome labeling pipeline
- First retraining run on composite score weights
- Multi-role-category support

---

## 10. Key Design Principles

### 10.1 The Profile is Never Done
The candidate profile is a living object. It is updated when:
- The candidate updates their answers
- A new verified skill score is added
- A work sample is completed
- Post-hire feedback is received (for future role matching)

### 10.2 Explainability is Non-Negotiable
Every match must surface the specific evidence that drove it. Recruiters must be able to see the exact quote from the candidate's answers that matched the role. A black-box score is not acceptable.

### 10.3 Optimise for Match Quality, Not Application Volume
The platform's north star metric is successful hire rate (90-day manager rating ≥ 4 AND candidate satisfaction ≥ 4). Not applications submitted. Not jobs filled. Successful placements.

### 10.4 No Keyword Gaming
The system is specifically designed to be resistant to keyword stuffing. The extraction LLM flags suspiciously dense answers. Work samples cannot be gamed with keywords. Scores are based on evidence and performance, not self-reporting.

### 10.5 Fairness by Design
Semantic matching reduces (but does not eliminate) bias compared to keyword matching. Additional safeguards:
- Skills extracted from evidence quotes, not job title or education pedigree
- Work samples are anonymised during scoring
- Composite score weights are audited periodically for disparate impact across demographic groups
- Candidates can view and dispute their extracted profile

### 10.6 The Feedback Loop is the Moat
Every hire that flows through the platform produces a training signal. Competitors cannot replicate this without the same volume of quality outcome data. The longer the platform operates, the sharper the matching gets — and the harder it is to catch up from scratch.

---

*Last updated: May 2026*
*Version: 1.0.0*
