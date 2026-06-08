# CareerOS V2 — Full Prototype Documentation

> **Prototype Disclaimer:** This is a functional concept prototype, not a production system. Every screen, flow, and calculation in this prototype exists to **demonstrate and validate the core concepts** that would be implemented in a production build. Seed data, mock percentages, and simulated AI responses are used deliberately to make the experience demonstrable without requiring a live candidate database.

---

## Table of Contents

1. [What is CareerOS?](#1-what-is-careeros)
2. [What This Prototype Demonstrates](#2-what-this-prototype-demonstrates)
3. [Platform Tiers](#3-platform-tiers)
4. [User Personas & User Stories](#4-user-personas--user-stories)
5. [User Journeys](#5-user-journeys)
   - 5.1 [Premium Job Seeker Journey](#51-premium-job-seeker-journey)
   - 5.2 [Standard Job Seeker Journey](#52-standard-job-seeker-journey)
   - 5.3 [Premium Recruiter Journey](#53-premium-recruiter-journey)
   - 5.4 [Standard Recruiter Journey](#54-standard-recruiter-journey)
   - 5.5 [Premium Reviewer Journey](#55-premium-reviewer-journey)
   - 5.6 [Standard Reviewer Journey](#56-standard-reviewer-journey)
6. [AI Scoring Architecture](#6-ai-scoring-architecture)
   - 6.1 [Layer 1 — Profile Extraction](#61-layer-1--profile-extraction)
   - 6.2 [Layer 2 — Work Sample Grading](#62-layer-2--work-sample-grading)
   - 6.3 [Composite Score Calculation](#63-composite-score-calculation)
   - 6.4 [Layer 3 — Post-Hire Feedback Loop](#64-layer-3--post-hire-feedback-loop)
7. [Score Interpretation](#7-score-interpretation)
8. [Mock Match % (Job Discovery)](#8-mock-match--job-discovery)
9. [Technical Architecture](#9-technical-architecture)
10. [Data Structures](#10-data-structures)
11. [Prototype vs Production](#11-prototype-vs-production)
12. [Running the Prototype](#12-running-the-prototype)

---

## 1. What is CareerOS?

CareerOS is a next-generation talent platform built on **verified skills, not keywords**. The core problem it solves:

> Traditional hiring systems match candidates to jobs by scanning resumes for keyword frequency. This rewards candidates who are good at writing resumes — not candidates who are good at the job. It also penalises strong candidates who don't optimise their resume language for ATS systems.

CareerOS replaces keyword-matching with a three-layer AI pipeline:

1. **Extract** what a candidate actually knows from how they narrate their experience.
2. **Verify** those claims through a practical, role-specific work sample.
3. **Match** the candidate to the job using a weighted composite score across evidence quality, skill coverage, verification strength, and culture/context fit.

The result is a hiring signal that is harder to game and more predictive of actual job performance.

---

## 2. What This Prototype Demonstrates

This prototype is a **full end-to-end clickable demo** of the CareerOS concept. It is designed to show:

| Concept | What the Prototype Shows |
|---|---|
| Evidence-based profile extraction | A live DeepSeek LLM call that reads 6 narrative answers and returns a structured JSON profile with verbatim evidence quotes |
| AI-graded work samples | A live DeepSeek LLM call that grades a candidate's practical submission across 4 dimensions |
| Composite matching score | Real-time calculation of a 4-factor weighted score visible to both the applicant and the reviewer |
| Match % on job discovery | A mock match percentage shown to premium applicants before they apply, giving them signal on fit |
| Reviewer-side ranked dashboard | A ranked list of candidates with score breakdowns and adjustable weights |
| Post-hire feedback loop | A model weight retraining simulation based on 90-day hire performance outcomes |
| Two-tier product model | Standard (form-based) vs Premium (AI-powered) flows for both job seekers and recruiters |

**What it does NOT demonstrate (production scope):**
- Real user authentication and accounts
- A real database (localStorage is used for session persistence)
- Real resume parsing (resume is attached but not parsed by AI)
- Full vector embedding model (mock cosine similarity with hardcoded vectors)
- Real payment or subscription gating

---

## 3. Platform Tiers

CareerOS operates on a two-tier model across both sides of the marketplace.

### Job Seeker Tiers

| Feature | Standard | Premium |
|---|---|---|
| Application method | Resume + generic screening questions | 6 narrative questions + work sample |
| AI profile extraction | ✗ | ✓ (Layer 1 — DeepSeek) |
| Work sample assessment | ✗ | ✓ (Layer 2 — DeepSeek) |
| Composite match score | ✗ | ✓ |
| Match % on job listings | ✗ | ✓ (all listings) |
| Access to premium listings | ✗ | ✓ |
| Verified skill badges | ✗ | ✓ |

### Recruiter Tiers

| Feature | Standard | Premium |
|---|---|---|
| Job posting type | Generic form-based | AI-screened with work sample |
| Screening questions | Pre-set generic library | Custom open-ended narrative questions |
| Applicant ranking | ✗ | ✓ (composite score) |
| AI skill verification | ✗ | ✓ |
| Post-hire feedback loop | ✗ | ✓ |
| Weight retraining | ✗ | ✓ |

---

## 4. User Personas & User Stories

### Persona 1 — Premium Job Seeker

**Profile:** A skilled professional who wants their genuine expertise to be surfaced fairly, not buried by keyword-optimised competitors.

**User Stories:**
- *"As a premium job seeker, I want to see my estimated match % before I apply, so I can prioritise the roles I'm most suited for."*
- *"As a premium job seeker, I want to answer narrative questions about my real work, so my application is evaluated on what I've actually done — not how well I've keyword-stuffed my resume."*
- *"As a premium job seeker, I want to see the exact skills and evidence the AI extracted from my answers, so I know what the hiring system sees."*
- *"As a premium job seeker, I want to complete a practical task that proves my skills, so my claims are backed by verified evidence."*
- *"As a premium job seeker, I want to see my composite match score before submitting, so I understand where I'm strong and where I have gaps."*

### Persona 2 — Standard Job Seeker

**Profile:** A candidate applying to roles where AI screening is not required — quick-apply roles using resume + standard screening questions.

**User Stories:**
- *"As a standard job seeker, I want to quickly browse available roles and apply with my resume and a few questions."*
- *"As a standard job seeker, I want to answer practical questions like salary expectations and start date, so the recruiter has the basics upfront."*

### Persona 3 — Premium Recruiter

**Profile:** A hiring manager or talent leader who wants to shortlist by verified skill evidence, not by who has the best-formatted resume.

**User Stories:**
- *"As a premium recruiter, I want to post a job with custom narrative questions so I can extract domain-specific evidence from applicants."*
- *"As a premium recruiter, I want to attach a role-specific work sample task so applicants are tested, not just interviewed."*
- *"As a premium recruiter, I want to see all applicants ranked by a composite match score so I can fast-track the strongest candidates to interview."*
- *"As a premium recruiter, I want to adjust the scoring weights (semantic, skill coverage, verification, context fit) based on what matters most for this specific role."*
- *"As a premium recruiter, after 90 days I want to log how a hire performed so the system can learn which signals were most predictive."*

### Persona 4 — Standard Recruiter

**Profile:** A recruiter who wants to post a job quickly with screening questions and manually review applicants.

**User Stories:**
- *"As a standard recruiter, I want to select from a library of generic screening questions so I can configure a job ad in minutes."*
- *"As a standard recruiter, I want to view applicant answers and resumes in a clean dashboard so I can review at my own pace."*

---

## 5. User Journeys

### 5.1 Premium Job Seeker Journey

**Route:** `/apply/premium` → `UserJourney.jsx`

This is the flagship 8-step flow demonstrating the full AI pipeline.

```
Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6 → Step 7 → Step 8
  ↓         ↓         ↓         ↓         ↓         ↓         ↓         ↓
Job       Job       Guided    Profile   Work      Match     Contact   Submitted
Discovery Detail    Q&A       Review    Sample    Score     Info
```

**Step 1 — Job Discovery**
- All available roles (premium + standard) are listed.
- **Premium applicants see a match % badge on every listing** — a mock signal derived from pre-seeded data indicating estimated fit before applying.
- Match % is colour-coded: green (≥75%), gold (50–74%), muted grey (<50%).
- Clicking a standard job redirects to the standard applicant flow.
- Clicking a premium job advances to Step 2.

**Step 2 — Job Detail**
- Full job description, requirements, and company context.
- Explanation of how the application will be evaluated (narrative AI, not resume parsing).
- One-click to begin the application.

**Step 3 — Guided Narrative Questionnaire**
- 6 open-ended questions tailored to the specific role (each job has its own question set).
- Minimum 30 characters per answer to prevent trivial submissions.
- Optional resume attachment — explicitly noted as forwarded to the hiring manager for human context only, **not parsed by the AI**.
- On submit, answers are sent live to DeepSeek via `POST /api/extract-profile`.
- A processing indicator shows while the LLM is working.

**Step 4 — Structured Profile Review (Layer 1 Output)**
- The AI-extracted profile is displayed back to the candidate.
- Shows: extracted skills with evidence quotes, inferred proficiency level, confidence scores, work context preferences, career goals, and any red flags detected.
- This is exactly what the hiring system will use — no hidden transformations.
- Candidate proceeds to Layer 2 verification.

**Step 5 — Work Sample Assessment (Layer 2)**
- A role-specific practical task is presented with: scenario context, numbered steps to complete, and a data artifact (code snippet, table, or text).
- Candidate writes their solution in a free-text area.
- On submit, the answer is sent live to DeepSeek via `POST /api/grade-assessment`.
- After grading, scores across 4 dimensions are displayed: task completion, technical accuracy, work quality, communication.
- A normalised score (0–100th percentile) is shown.
- The profile is automatically updated — all extracted skills gain a "Verified" badge with the normalised score.

**Step 6 — Composite Match Score Breakdown**
- The full composite score calculation is shown transparently.
- Each of the 4 factors is displayed with its raw score, weight multiplier, and weighted contribution.
- The composite total is shown with a decision label (Strong / Marginal / Reject).
- This gives candidates visibility into exactly why they scored how they did.

**Step 7 — Contact Information**
- Name, email, and phone number collected.
- Explicitly noted as only shared with the hiring team if shortlisted.
- Not used in AI scoring.

**Step 8 — Submission Confirmation**
- Application is saved to `localStorage` under `careesOS_applications`.
- Summary of what happens next (reviewer queue → human shortlist → interview).
- Options to start a new application or return home.

---

### 5.2 Standard Job Seeker Journey

**Route:** `/apply/normal` → `NormalApplicantFlow.jsx`

```
Step 1 → Step 2 → Step 3
  ↓         ↓         ↓
Job       Resume    Screening   Submitted
Discovery + Upload  Questions
```

- Browse standard jobs.
- Upload resume.
- Answer the generic screening questions configured by the recruiter (salary, availability, experience level, etc.).
- No AI involvement. No match score. No skill extraction.
- Application saved to `localStorage`.

---

### 5.3 Premium Recruiter Journey

**Route:** `/post/premium` → `PremiumJobPost.jsx`

```
Step 1 → Step 2 → Step 3 → Step 4
  ↓         ↓         ↓         ↓
Job       Narrative  Work      Review &
Details   Questions  Sample    Publish
```

- Enter job title, department, employment type, and description.
- Configure 6 narrative questions tailored to the role (these become the candidate questionnaire in Step 3 of the applicant flow).
- Configure the work sample task: context paragraph, numbered steps, optional data artifact (code or text), time limit.
- Define required skills with proficiency level and mark which are non-negotiable (used in skill coverage scoring).
- Review and publish. The job appears in all job discovery screens.

---

### 5.4 Standard Recruiter Journey

**Route:** `/post/normal` → `NormalJobPost.jsx`

- Enter job title, department, employment type, description, requirements, and company overview.
- Select from a library of 10 pre-built generic screening questions (salary, relocation, notice period, education, etc.).
- Review and publish. Job appears in all discovery screens as a "Standard" listing.

---

### 5.5 Premium Reviewer Journey

**Route:** `/reviewer/premium` → `Dashboard.jsx`

This is the hiring manager's control panel for premium applicants.

```
Dashboard (Matches Tab) → Select Candidate → Candidate Detail Panel
         ↓
Feedback Loop Tab → Outcome Logging → Weight Retraining
```

**Matches View:**
- All applicants (seed data + live localStorage submissions) are displayed ranked by composite score (highest first).
- Each candidate card shows: name, job applied for, composite score with decision badge, and individual factor scores (semantic, skill coverage, verification, context fit).
- Adjustable weight sliders — changing weights immediately re-sorts the ranked list in real-time.
- Expandable detail panel showing the full AI-extracted profile: skills with evidence quotes and verification status, work context, goals, red flags, and assessment breakdown.

**Feedback Loop View:**
- Post-hire outcomes table showing 90-day performance ratings and retention data.
- Bar chart visualising the correlation between verification score at hire and actual performance.
- If the data shows verification score is strongly predictive, a retraining recommendation appears.
- One-click weight retraining: adjusts composite weights based on observed outcome patterns.

---

### 5.6 Standard Reviewer Journey

**Route:** `/reviewer/normal` → `NormalReviewerDashboard.jsx`

- Tabular view of all standard applicants with their screening question answers and resume link.
- Filter by job listing, sort by submission date.
- No AI scores. Human review only.

---

## 6. AI Scoring Architecture

The scoring system is a **three-layer pipeline**. Layers 1 and 2 produce the inputs; the composite formula combines them into a single decision signal.

### Full Pipeline

```
Applicant answers 6 questions
         ↓
POST /api/extract-profile (DeepSeek)
         ↓
Layer 1: Structured Profile
  - skills[] with evidence_quote, confidence, inferred_level
  - work_context (pace, autonomy, team size preference)
  - goals (direction, anti-preferences)
  - soft_signals (communication style, decision-making)
  - red_flags (keyword stuffing, vague answers, inconsistency)
         ↓
Applicant completes work sample
         ↓
POST /api/grade-assessment (DeepSeek)
         ↓
Layer 2: Assessment Scores
  - task_completion
  - technical_accuracy
  - work_quality
  - communication
  - normalised_score (applied as verified_score to all skills)
         ↓
Composite Score Calculation
         ↓
Reviewer Dashboard — Ranked Candidates
```

---

### 6.1 Layer 1 — Profile Extraction

**Model:** `deepseek-chat`  
**Temperature:** `0.2` (low — for consistent structured output)  
**Response format:** `json_object`

The prompt instructs DeepSeek to:
- Read all 6 answers as a single narrative.
- Extract **only what is directly evidenced** — no hallucination.
- Return verbatim `evidence_quote` from the candidate's own words.
- Assign confidence scores based on evidence quality:

| Confidence Range | Meaning |
|---|---|
| 0.9 – 1.0 | Strong direct evidence — candidate explicitly described an outcome |
| 0.7 – 0.9 | Clear inference — strong contextual support |
| 0.5 – 0.7 | Reasonable guess — some supporting context |
| < 0.5 | Null — do not guess, omit the field |

- Flag red flags for: keyword stuffing, vague single-word answers, or internal inconsistencies.
- If answers are nonsensical or trivially short, return empty skills array and add a `vague_answers` red flag.

**Output Schema:**
```json
{
  "skills": [
    {
      "name": "string",
      "evidence_quote": "verbatim quote from candidate answer",
      "inferred_level": "junior | mid | senior | expert",
      "confidence": 0.85
    }
  ],
  "work_context": {
    "preferred_team_size": "string or null",
    "preferred_pace": "exploratory | balanced | execution-focused | null",
    "autonomy_level": "low | medium | high | null"
  },
  "goals": {
    "direction": "string or null",
    "anti_preferences": ["string"]
  },
  "soft_signals": {
    "communication_style": "string or null",
    "decision_making_pattern": "string or null"
  },
  "red_flags": [
    {
      "type": "keyword_stuffing | inconsistency | vague_answers",
      "detail": "string"
    }
  ]
}
```

---

### 6.2 Layer 2 — Work Sample Grading

**Model:** `deepseek-chat`  
**Temperature:** `0.1` (very low — for strict, consistent grading)  
**Response format:** `json_object`

The prompt instructs DeepSeek to:
- Receive the full task description and the candidate's free-text submission.
- Grade strictly across 4 dimensions (0.0–1.0 each).
- Not inflate scores.
- If the submission is empty, all scores must be `0.0`.

**Grading Dimensions:**

| Dimension | What It Measures |
|---|---|
| `task_completion` | Did the candidate attempt and address all required steps? |
| `technical_accuracy` | Is the solution technically / domain-correct? |
| `work_quality` | Depth, structure, and thoughtfulness of the response |
| `communication` | Clarity of reasoning and explanation |
| `normalised_score` | Overall percentile score across all four dimensions |
| `feedback` | One-sentence human-readable summary |

**Key design decision:** The `normalised_score` is applied as `verified_score` to **every skill extracted in Layer 1**. This means the work sample directly validates — or invalidates — the narrative claims made in the open-ended questions. A candidate who claims expert Kubernetes experience but fails the EKS security task will have all their skill claims downgraded accordingly.

**Output Schema:**
```json
{
  "task_completion": 0.85,
  "technical_accuracy": 0.80,
  "work_quality": 0.78,
  "communication": 0.82,
  "normalised_score": 0.81,
  "feedback": "Candidate correctly identified the flaw and provided a well-reasoned least-privilege policy."
}
```

---

### 6.3 Composite Score Calculation

The composite score is calculated in real-time on both the applicant-side (Step 6) and the reviewer dashboard.

**Formula:**
```
Composite = (Semantic × 0.40)
          + (Skill Coverage × 0.25)
          + (Verification × 0.20)
          + (Context Fit × 0.15)
```

**Default Weights:**

| Factor | Default Weight | Rationale |
|---|---|---|
| Semantic | 40% | Measures narrative quality and domain alignment — the richness of the candidate's evidence |
| Skill Coverage | 25% | Measures how many of the job's non-negotiable required skills the candidate's profile covers |
| Verification | 20% | The only independently tested signal — directly from the work sample |
| Context Fit | 15% | Cultural and work-style alignment — pace and autonomy match |

**How each factor is derived:**

#### Semantic Score (40%)
Derived from the average confidence of all extracted skills:
```
semantic = min(0.99, (avg_confidence × 0.8) + 0.15)
```
On the reviewer dashboard, cosine similarity between mock embedding vectors is used instead (simulating what a real embedding model would compute in production).

#### Skill Coverage (25%)
```
skill_coverage = matched_non_negotiable_skills / total_non_negotiable_skills
```
Matching is fuzzy — keyword overlap is used. For example, "Employee Relations" matches "Employee Relations & Investigation" because the key words overlap. Only non-negotiable skills (marked with `✱`) are counted.

#### Verification Score (20%)
```
verification = assessment.normalised_score
```
Directly the grade returned by DeepSeek. This is the hardest signal to fake.

#### Context Fit (15%)
```
context_fit = matching_context_fields / total_context_fields
```
Fields compared:
- Candidate's `preferred_pace` vs job's `team_context.pace`
- Candidate's `autonomy_level` vs job's `team_context.autonomy_offered`

---

### 6.4 Layer 3 — Post-Hire Feedback Loop

After a hire is made and their 90-day performance is rated by the hiring manager, the prototype simulates weight retraining.

**Trigger condition:** Verification score of successful hires is more than 0.20 above verification score of poor hires.

**Weight adjustments:**

| Outcome Pattern | Adjustment Applied |
|---|---|
| High-verification candidates performed well | Verification weight increased: 20% → 30%, Semantic reduced: 40% → 35% |
| Low-verification candidates performed poorly | Semantic increased: 40% → 45%, Verification reduced: 20% → 10% |

This is shown in the `FeedbackLoop.jsx` screen accessible from the premium reviewer dashboard sidebar. In production, this would be a continuous model improvement loop fed by real outcome data.

---

## 7. Score Interpretation

| Composite Score | Decision | Action |
|---|---|---|
| 0.75 – 1.00 | **Strong Match** | Fast-track to interview |
| 0.60 – 0.74 | **Marginal** | Human review required — check which factor is dragging |
| < 0.60 | **Likely Reject** | Significant gaps in skill, context, or evidence quality |

**Red flag combinations to watch:**

| Pattern | Interpretation |
|---|---|
| High semantic + low verification | Candidate may be optimising narrative without real skills. Prioritise the work sample score. |
| High verification + low skill coverage | Strong performer but skills don't map to this specific role. |
| Low context fit | May underperform regardless of skill — probe culture fit in interview. |

---

## 8. Mock Match % (Job Discovery)

Premium job seekers see a match percentage badge on every job listing in Step 1, before they begin any application. This feature signals fit early and helps candidates self-select into roles they're most likely to succeed in.

**In this prototype:** The percentages are hardcoded mock values seeded in `mockData.js`. In production, this would be calculated by comparing the user's existing verified profile (from a previous application or profile setup) against the job's requirements using the same composite scoring engine.

**Mock values used:**

| Job | Mock Match | Colour |
|---|---|---|
| Senior Platform Engineer | 78% | Gold (accent) |
| HR Business Partner | 62% | Gold (accent) |
| Operations Administrator | 85% | Green (success) |
| Customer Service Executive | 45% | Muted grey |
| Marketing Coordinator | 58% | Gold (accent) |

**Colour thresholds:**
- `≥ 75%` → Green — strong signal
- `50–74%` → Gold — moderate fit
- `< 50%` → Muted — low alignment

**Visibility rule:** Only premium applicants (users in the `/apply/premium` flow) see these badges. Standard applicants browsing via `/apply/normal` do not see them.

---

## 9. Technical Architecture

### Stack

| Layer | Technology |
|---|---|
| Framework | React 19 |
| Build tool | Vite 8 |
| Routing | React Router v7 |
| State management | React `useReducer` + Context API |
| Styling | TailwindCSS v4 (custom design tokens) |
| Animation | Framer Motion v12 |
| Charts | Recharts v3 |
| AI backend | DeepSeek API (`deepseek-chat` model) |
| API layer (dev) | Vite dev server middleware |
| API layer (prod) | Netlify/serverless functions in `functions/api/` |
| Data persistence | `localStorage` (prototype only) |

### Routes

| Path | Component | Description |
|---|---|---|
| `/` | `Landing.jsx` | Entry point — role and tier selection |
| `/apply/premium` | `UserJourney.jsx` | Full 8-step premium applicant flow |
| `/apply/normal` | `NormalApplicantFlow.jsx` | Standard applicant form |
| `/post/premium` | `PremiumJobPost.jsx` | Premium job creation wizard |
| `/post/normal` | `NormalJobPost.jsx` | Standard job creation form |
| `/reviewer/premium` | `Dashboard.jsx` | Premium reviewer ranked dashboard |
| `/reviewer/normal` | `NormalReviewerDashboard.jsx` | Standard applicant review table |

### Global State (`AppContext.jsx`)

```js
{
  view: 'dashboard',               // Active sidebar view
  selectedCandidate: null,         // Currently viewed candidate
  weights: {
    semantic: 0.40,
    skill_coverage: 0.25,
    verification: 0.20,
    context_fit: 0.15
  }
}
```

Actions: `NAVIGATE`, `UPDATE_WEIGHTS`, `SELECT_CANDIDATE`

### API Endpoints

Both endpoints live in `vite.config.js` as Vite dev server middleware and are mirrored in `functions/api/` for serverless deployment.

**`POST /api/extract-profile`**
- Input: `{ answers: { q1, q2, q3, q4, q5, q6 } }`
- Output: `{ success: true, data: { skills, work_context, goals, soft_signals, red_flags } }`

**`POST /api/grade-assessment`**
- Input: `{ answer: string, task: string }`
- Output: `{ success: true, data: { task_completion, technical_accuracy, work_quality, communication, normalised_score, feedback } }`

### Environment Variable

```
DEEPSEEK_API_KEY=your_key_here
```

Place in a `.env` file in the project root. Never commit this file (it is gitignored).

---

## 10. Data Structures

### Premium Candidate Profile (post-extraction)
```js
{
  id: "c1",
  name: "Alice Chen",
  skills: [
    {
      name: "Kubernetes",
      evidence_quote: "migrated 3-node cluster to EKS, reduced deploy time from 45 min to 8 min",
      inferred_level: "senior",       // junior | mid | senior | expert
      confidence: 0.87,               // 0.0 – 1.0
      verified: true,
      verified_score: 0.85            // normalised_score from Layer 2
    }
  ],
  work_context: {
    preferred_team_size: "5-15",
    preferred_pace: "balanced",       // exploratory | balanced | execution-focused
    autonomy_level: "high"            // low | medium | high
  },
  goals: {
    direction: "technical leadership",
    anti_preferences: ["pure management"]
  },
  embedding_mock: [0.1, 0.8, 0.3, 0.9]  // 4-dim mock embedding vector
}
```

### Premium Job Listing
```js
{
  id: "j1",
  title: "Senior Platform Engineer",
  premium: true,
  department: "Platform Engineering",
  type: "Full-time · Hybrid",
  mock_match: 78,                     // Mock match % shown to premium applicants
  required_skills: [
    { name: "Kubernetes", level: "senior", non_negotiable: true },
    { name: "Python", level: "senior", non_negotiable: true }
  ],
  team_context: {
    size: 8,
    pace: "balanced",
    autonomy_offered: "high"
  },
  questionnaire: [ /* 6 role-specific questions */ ],
  work_sample: {
    title: "Task: EKS IAM Policy Audit",
    time_limit: "45 min",
    context: "...",
    steps: ["...", "...", "..."],
    artifact: "...",                  // code or text data
    artifact_type: "code | text",
    placeholder: "..."
  },
  embedding_mock: [0.15, 0.85, 0.35, 0.88]
}
```

### Post-Hire Outcome
```js
{
  match_id: "m1",
  candidate_id: "c1",
  job_id: "j1",
  manager_rating_90d: 5,            // 1–5 scale
  hire_satisfaction_90d: 5,
  retained_180d: true,
  label: "successful | poor",
  verification_score_at_hire: 0.85
}
```

---

## 11. Prototype vs Production

This table clarifies what is simulated in the prototype and what the production equivalent would be.

| Prototype Behaviour | Production Implementation |
|---|---|
| Mock `embedding_mock` vectors for cosine similarity | Real vector embeddings generated by an embedding model (e.g. `text-embedding-3-small`) from the actual skill profiles and job descriptions |
| `localStorage` for application persistence | PostgreSQL or equivalent relational database with user accounts |
| Hardcoded `mock_match` % on job listings | Real-time composite score calculated from the user's existing verified profile vs each job's requirements |
| No authentication | Full auth system (OAuth / magic link) for both job seekers and recruiters |
| Resume attached but not parsed | Resume optionally parsed for human reviewer display — still excluded from AI scoring by design |
| Single DeepSeek model for all AI | Potentially fine-tuned or role-specific models per domain (engineering, HR, operations) |
| Manual weight slider in reviewer dashboard | Admin-controlled weights per job category, with automated retraining pipeline on outcome data |
| 2 mock outcome records for feedback loop | Real outcome logging tied to actual hire records and 90-day check-in workflows |
| Vite middleware for API | Proper serverless functions or dedicated API service with rate limiting, error handling, and logging |
| No payment or subscription gating | Premium tier gated behind subscription (Stripe or equivalent) |

---

## 12. Running the Prototype

### Prerequisites
- Node.js 18+
- A DeepSeek API key (get one at [platform.deepseek.com](https://platform.deepseek.com))

### Setup

```bash
# Install dependencies
npm install

# Create your environment file
echo "DEEPSEEK_API_KEY=your_key_here" > .env

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`.

### Navigating the Prototype

| What to explore | Where to go |
|---|---|
| Full premium applicant AI flow | Click **Job Seeker → Premium** on the landing page |
| Standard quick-apply flow | Click **Job Seeker → Standard** on the landing page |
| Create a premium job posting | Click **Recruiter → Premium** on the landing page |
| Create a standard job posting | Click **Recruiter → Standard** on the landing page |
| Premium reviewer ranked dashboard | Click **Premium Reviewer Dashboard** link on landing, or `/reviewer/premium` |
| Standard reviewer applicant table | Click **Normal Reviewer Dashboard** link on landing, or `/reviewer/normal` |
| Post-hire feedback loop | Go to Premium Reviewer Dashboard → click **Feedback Loop** in the sidebar |

### Tips
- Complete the full premium applicant flow first (Steps 1–8) to generate a live application — it will appear at the top of the premium reviewer dashboard ranked above the seed data.
- The weight sliders on the reviewer dashboard are interactive — dragging them re-ranks all candidates in real time.
- The **Apply New Weights & Retrain Model** button in the Feedback Loop screen permanently adjusts the composite formula weights for the session.
