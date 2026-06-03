# Core Production Features — Career OS

Extracted from `plan.md` for production-ready environment.

---

## Candidate Experience

### Career Trajectory Graph
Interactive node-graph showing probable career paths with salary, timeline, and probability data per node. Filterable by industry, location, age bracket.

### AI Career Coach
Context-aware conversational assistant grounded in the user's actual profile, trajectory position, skill gaps, and regional salary data. Maintains full conversation history.

### Skill Gap Radar
Spider chart comparing current skills vs. required skills for any selected path node, with readiness score and gap breakdown.

### Asia Fair Pay Engine
City-specific salary benchmarking (8 Asian cities), percentile positioning, cross-city comparison, and 5-year growth projection.

### Application Feedback Loop
Application tracker with stage logging, outcome capture, and AI-generated insights (e.g. "profiles like yours had 3x more success at Series B startups").

### Life Chapter Onboarding
Life-stage-based onboarding (Student → Executive) with tailored flows, role/industry/location/skill capture, and optional LinkedIn profile import.

---

## Employer Experience

### Smart Talent Matching Dashboard
Trajectory-based candidate ranking (not keyword), with composite match score:
- Skills: 40%
- Trajectory: 40%
- Experience: 20%

### Retention Signals
Estimated stay probability per candidate (>2 years), plus passive candidate flags for proactive outreach.

### Job Posting Management
Role creation with required skills, seniority, city, and salary range.

---

## Platform & Data

### Auth & Identity
JWT-based authentication (register/login), user profile management.

### Synthetic Career Data Layer
Pre-seeded trajectory nodes, edges, and salary datasets (12 industries, 8 cities, 5 seniority levels).

### AI Infrastructure
DeepSeek API integration with structured system prompts, profile context injection, and conversation state management.

### Database
PostgreSQL with tables for:
- users
- career_profiles
- trajectory_nodes
- trajectory_edges
- salary_data
- applications
- job_postings
- employers
- coach_conversations

### Deployment
Dockerized, cloud-deployed (AWS ECS / Azure Container Apps), with reverse proxy (Nginx) and CI/CD (GitHub Actions).

---

## Out of Scope for Production MVP

- **Living Portfolio** (shareable profile links) — marked as bonus in the plan
- **University / Curriculum Engine** — explicitly noted as "bonus if time"
- **Real-time data pipelines** — plan specifies synthetic data for the MVP
- **Full LinkedIn parsing** — plan notes mock-parse for demo, real parse for prod

---

## Summary

Production core = 6 candidate features + 2 employer features + auth + AI backend + seeded data + cloud deployment. Everything else is post-MVP.
