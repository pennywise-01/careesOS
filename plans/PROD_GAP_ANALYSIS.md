# Production Gap Analysis — Career OS V2

> Compares what is built in the current prototype against what the full production plan requires.

---

## Current Prototype — What is Built

### Applicant Side
| Feature | Status | Notes |
|---|---|---|
| Job listing page | ✅ Built | 3 hardcoded jobs from `mockData.js` |
| Job detail page (description, requirements, about company) | ✅ Built | Static per job in mockData |
| 6 open-ended narrative questions | ✅ Built | Dynamic per selected job |
| DeepSeek profile extraction (`/api/extract-profile`) | ✅ Built | Returns skills, work context, goals, red flags |
| Extracted profile review screen | ✅ Built | Shows evidence quotes, confidence, red flags |
| Work sample assessment | ✅ Built | Dynamic per job (title, context, steps, artifact) |
| DeepSeek assessment grading (`/api/grade-assessment`) | ✅ Built | Returns 4 dimensions + normalised score |
| Composite scoring (semantic, skill coverage, verification, context fit) | ✅ Built | Calculated client-side |
| Matching calculation screen | ✅ Built | Shows weighted breakdown |
| Contact info capture before submission | ✅ Built | Name, email, phone |
| Application submission to localStorage | ✅ Built | `careesOS_applications` key |
| Application submitted confirmation screen | ✅ Built | — |

### Reviewer Side
| Feature | Status | Notes |
|---|---|---|
| Reviewer dashboard with ranked applicants | ✅ Built | Reads from localStorage + mock candidates |
| Per-job scoring (each applicant scored against their applied job) | ✅ Built | Looks up job by `jobId` |
| Candidate detail view (skills, evidence, score breakdown) | ✅ Built | — |
| Reviewer scoring guide legend | ✅ Built | Thresholds, factor explanations, red flags |
| Live application timestamps (dynamic time-ago) | ✅ Built | Auto-refreshes every 60s |
| Shortlist / Reject buttons | ⚠️ UI only | No state saved, no action taken |
| Layer 3 post-hire feedback loop simulation | ✅ Built | Weight retraining simulation with rating 1–5 |
| Job posting creation from dashboard | ❌ Not built | Jobs are hardcoded in mockData.js |

---

## Missing for Production

### 1. Authentication & Identity
| Item | Priority |
|---|---|
| Applicant registration & login | High |
| Reviewer/employer login (separate role) | High |
| JWT session management | High |
| Password reset / magic link | Medium |

### 2. Database (replace localStorage)
| Item | Priority |
|---|---|
| `jobs` table — store job postings | High |
| `applications` table — store submitted applications | High |
| `users` table — applicants and reviewers | High |
| `reviewer_actions` table — shortlist/reject decisions | Medium |
| `hiring_outcomes` table — 90-day performance ratings for Layer 3 | Medium |
| `coach_conversations` table — AI chat history per user | Low |

### 3. Dynamic Job Posting (Reviewer → Applicant)
| Item | Priority |
|---|---|
| "Post a Job" form in reviewer dashboard | High |
| Editable questionnaire (6 questions, reviewer-defined) | High |
| Editable work sample task fields | High |
| Required skills + team context inputs | High |
| `/api/extract-profile` prompt made dynamic (reads job's question labels) | High |
| Jobs stored in DB, read by applicant job list | High |

### 4. Candidate Experience (from full plan)
| Item | Priority | Plan Reference |
|---|---|---|
| Career Trajectory Graph (interactive node graph) | High | Plan §4.1, Screen 3 |
| AI Career Coach (context-aware chat) | High | Plan §4.2 |
| Skill Gap Radar (spider chart vs selected path) | High | Plan §4.4 |
| Life Chapter Onboarding (Student → Executive flow) | Medium | Plan §4.7 |
| Application Feedback Loop (outcome tracker with insights) | Medium | Plan §4.6 |
| Living Portfolio (shareable profile link) | Low | Bonus in plan |

### 5. Employer / Reviewer Experience

#### Currently Built (Prototype)
| Feature | Status | Notes |
|---|---|---|
| Ranked applicant list | ✅ Built | Sorted by composite score |
| Candidate detail view | ✅ Built | Skills, evidence, score breakdown |
| Reviewer scoring guide legend | ✅ Built | Thresholds, red flag signals |
| Live timestamps | ✅ Built | Auto-refreshes every 60s |
| Layer 3 weight retraining simulation | ✅ Built | Rating 1–5 adjusts weights |
| Shortlist / Reject buttons | ⚠️ UI only | No persistence, no action |
| Job posting creation | ❌ Not built | Hardcoded in mockData.js |

#### Missing for Production (from plan)
| Item | Priority | Plan Reference |
|---|---|---|
| Shortlist/Reject actions that persist to DB | High | `reviewer_actions` table |
| Job posting CRUD form (title, questions, work sample, skills) | High | `ROADMAP_DYNAMIC_JOB_POSTING-prod.md` |
| Employer KPI strip (active roles, total applicants, avg composite score) | High | Plan Screen 6 |
| Trajectory-based candidate ranking (not just composite score) | Medium | Plan §4.5 |
| Retention signal per candidate (estimated stay probability) | Medium | Plan §4.5 |
| Passive candidate flag (not actively looking) | Low | Plan §4.5 |

#### Features to Consider Adding
| Feature | Value | Complexity |
|---|---|---|
| **Pipeline view (Kanban)** — visualise applicants across Applied → Shortlisted → Interviewing → Hired stages | High — gives reviewers a clear workflow instead of a flat list | Medium |
| **Bulk actions** — shortlist or reject multiple candidates at once | High — reduces reviewer friction at scale | Low |
| **Candidate comparison view** — side-by-side score breakdown for 2–3 candidates | High — helps reviewers make final decisions | Low |
| **Interview notes** — reviewer attaches notes to a candidate post-interview | High — closes the feedback loop from interview back to the system | Low |
| **Email notification to shortlisted candidate** — triggered when reviewer clicks Shortlist | High — makes the platform feel production-ready | Medium |
| **Score weight customisation per job** — reviewer adjusts semantic/skill/verification weights per role, not globally | Medium — different roles weight differently (e.g. verification matters more for technical roles) | Low |
| **Application analytics per job** — drop-off rate per step (how many started vs finished), avg score distribution | Medium — helps reviewers understand pool quality | Medium |
| **Duplicate application detection** — flag if same email applies to the same role twice | Medium — prevents gaming | Low |
| **Reviewer team access** — multiple reviewers on one company account, each can comment/shortlist | Low for MVP — but needed at any real company | High |

### 6. Scoring Improvements
| Item | Priority | Notes |
|---|---|---|
| Real embedding vectors (replace `embedding_mock`) | High | Currently 4-float mock arrays |
| Semantic scoring via actual vector similarity (e.g. sentence-transformers) | High | Currently based on avg confidence |
| Trajectory similarity as a scoring factor | High | Not yet implemented |
| LinkedIn profile import & parsing | Low | Mock-parse for demo, real for prod |

### 7. Infrastructure
| Item | Priority | Notes |
|---|---|---|
| FastAPI backend (replace Vite dev proxy) | High | Vite plugin endpoints are dev-only |
| PostgreSQL + Supabase | High | Replace localStorage |
| Cloudflare Workers or Supabase Edge Functions | High | For production API |
| Resume file upload & storage | Medium | Currently only stores filename |
| CI/CD pipeline (GitHub Actions) | Medium | — |
| Proper environment variable management (not `.env` in repo) | High | DEEPSEEK_API_KEY exposure risk |

---

## Summary Table

| Category | Built | Missing |
|---|---|---|
| Applicant flow (questions → assessment → score → submit) | ✅ Complete | — |
| Reviewer dashboard (view, score, legend) | ✅ Mostly done | Shortlist/Reject persistence, job posting |
| Auth & identity | ❌ None | Full auth system needed |
| Database | ❌ localStorage only | All tables needed |
| Dynamic job posting | ❌ Hardcoded | Full CRUD for reviewer |
| Career trajectory graph | ❌ Not built | Core plan feature |
| AI career coach | ❌ Not built | Core plan feature |
| Skill gap radar | ❌ Not built | Core plan feature |
| Real embeddings/semantic scoring | ❌ Mocked | Scoring accuracy depends on this |
| Production backend & deployment | ⚠️ Vite proxy only | FastAPI + cloud deploy needed |

---

## What the Prototype Demonstrates Well (for pitch purposes)

- The full applicant evaluation pipeline (Layer 1 + Layer 2 + Composite Score)
- AI-powered evidence extraction vs keyword matching — the core thesis
- Dynamic job-specific questions and work sample tasks
- Reviewer scoring transparency (weighted breakdown, red flag guide)
- Post-hire feedback loop concept (Layer 3 weight retraining)
- The employer-side scoring methodology

These are the conceptual differentiators. The missing items above are engineering execution — they do not change the core approach.
