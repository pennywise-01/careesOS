# 📋 Hackathon Logistics Plan

> **Event:** Talentbank Tech Hackathon | techhackathon.com  
> **Challenge:** Career OS / Career Marketplace  
> **This file:** Timeline, judging criteria, checkpoints, deliverables, and hackathon logistics.  
> **Feature plan:** See `plan.md` for Career OS architecture, design, and implementation.

---

## 1. Timeline — It's 28 Days (Not 25 Hours)

The original plan estimates ~25 hours across 3 phases. **This is wrong.** The build phase is **28 days (4 weeks)** of full-time work.

### Full Hackathon Schedule

| Phase | Dates | Activity |
|-------|-------|----------|
| Registration | 18 May – 15 Jun | Register + submit Intent Form |
| Kickoff | 20 Jun | Onboarding, Reference Build access |
| Build Phase | 29 Jun – 26 Jul | 28 days of building |
| Panel Review | 3 Aug – 16 Aug | Top 10 selected |
| Grand Finale | 29 Aug | Live presentation, winners announced |

### Week-by-Week Build Plan

**Week 1 (Days 1-7): Foundation**
- Days 1-2: Project scaffold, design system, component library
- Days 3-4: Onboarding flow (3 steps, Ahmad persona pre-filled)
- Days 5-7: Career Trajectory Graph (React Flow, seed data, interactive)

**Week 2 (Days 8-14): Core Features**
- Days 8-9: Skill Gap Radar (Recharts RadarChart, click-triggered)
- **Day 10: CHECKPOINT 1 DUE**
- Days 11-12: AI Career Coach (Claude API, conversation state, pre-loaded messages)
- Days 13-14: Fair Pay Engine (salary data, percentile bar, city comparison)

**Week 3 (Days 15-21): Employer Side + Polish**
- Days 15-16: Employer dashboard (match cards, retention signal)
- Days 17-18: Feedback Loop (application logger, insight text)
- Day 19: Auth (Supabase, login/register flow)
- **Day 20: CHECKPOINT 2 DUE**
- Day 21: Seed database (4 personas, salary data, trajectory graph)

**Week 4 (Days 22-28): Deploy + Test + Document**
- Days 22-23: Deploy to AWS/Azure, live URL, SSL
- Days 24-25: Testing (unit tests, E2E manual test, bug fixes)
- Day 26: Documentation (README, API docs, architecture diagram)
- Day 27: Mobile-responsive polish, animations
- Days 28: **CHECKPOINT 3 DUE**, final checks, demo run-throughs

---

## 2. Build Phase Checkpoints — Don't Get Disqualified

**Critical:** There are **3 mandatory checkpoints** during the 28-day build phase (roughly days 10, 20, and 28). Each is a **300-word async update** on progress, blockers, and decisions. **Missing a checkpoint without notice is grounds for disqualification.**

### Checkpoint Template

```
Checkpoint [1/2/3] — [Date]

PROGRESS (150 words):
- What's built and working
- Key milestones hit
- Demo-ready features

BLOCKERS (75 words):
- What's slowing you down
- What you need help with
- Risks to timeline

DECISIONS (75 words):
- Architectural choices made
- Features prioritised/deprioritised
- Trade-offs accepted
```

**Checkpoint 1 (Day 10) — Foundation**
- Progress: Project scaffold complete, design system implemented, onboarding flow working, trajectory graph prototype started
- Blockers: Any issues with React Flow library, synthetic data generation challenges
- Decisions: Chose React Flow over D3.js, hardcoded coach messages for demo reliability, prioritised candidate side first

**Checkpoint 2 (Day 20) — Core Features**
- Progress: Trajectory graph interactive, skill gap radar working, AI coach integrated, salary engine complete
- Blockers: API rate limits, deployment issues, data accuracy concerns
- Decisions: Trajectory-based matching (not keyword), added retention probability, pre-seeded 4 personas

**Checkpoint 3 (Day 28) — Final Push**
- Progress: Employer dashboard complete, feedback loop working, deployed to production, 4 personas seeded
- Blockers: Last-minute bugs, performance issues, mobile responsiveness gaps
- Decisions: Prioritised demo path over edge cases, focused on Ahmad's journey

**Action:** Set calendar reminders for days 10, 20, and 28. Submit checkpoints even if you're behind — silence = disqualification.

---

## 3. Judging Criteria — How to Score Maximum Points

The judges evaluate on **5 weighted criteria**. Every decision should optimise for these.

### Criteria Breakdown

| # | Criterion | Weight | What They're Looking For | How Career OS Wins |
|---|-----------|--------|-------------------------|-------------------|
| 01 | **Product & UX Thinking** | **30%** | User-centric design, intuitive flows, solves real problems | Life Chapter onboarding (90s), 3-panel OS layout, interactive trajectory graph |
| 02 | **System Design & Integration** | **25%** | Architecture quality, scalability, component integration | Clean FastAPI + React, trajectory graph integrated with skill gap + salary + coach |
| 03 | **Completeness** | **20%** | Feature coverage, both sides, production-ready | Candidate (4 modules) + Employer (2 modules) + Feedback Loop, deployed live |
| 04 | **AI Craft** | **15%** | AI integration quality, prompt engineering, context-awareness | Claude API with full profile context, trajectory-aware responses, pre-loaded messages |
| 05 | **Code Quality** | **10%** | Clean code, documentation, testing | TypeScript, ESLint, unit tests, API docs, README, architecture diagram |

### How to Optimise Each Criterion

**01 · Product & UX Thinking (30%)**
- Lead with the user journey, not the tech
- Show Ahmad's 90-second onboarding → trajectory graph → skill gap → salary → AI coach flow
- Emphasise the "OS metaphor" — dashboard, apps, memory, background processes
- Reference Talentbank's own life chapter UI and show you've elevated it
- Judges will click through — make every interaction smooth, every empty state handled

**02 · System Design & Integration (25%)**
- Show the architecture diagram in your pitch
- Highlight how trajectory graph connects to skill gap radar, salary engine, and AI coach
- Demonstrate bidirectional flow: candidate builds profile → employer sees trajectory-matched candidates
- Show employer dashboard pulling from same candidate data but with different lens (retention signals)

**03 · Completeness (20%)**
- Cover both sides: candidate (4 modules) + employer (2 modules)
- Show all features working, not just mocked
- Deploy to production (AWS/Azure) — live URL required
- Pre-seed 4 personas (Ahmad, Priya, David, Siti) so judges can test different paths
- Include Feedback Loop — most teams will skip this, it's your edge

**04 · AI Craft (15%)**
- Show the AI Career Coach is context-aware, not generic
- Demonstrate how it uses: user profile, current trajectory node, skill gaps, salary data
- Pre-load personalised messages for each demo persona
- Mention conversation state management (Zustand store, full history on each API call)

**05 · Code Quality (10%)**
- Use TypeScript for type safety
- ESLint + Prettier for consistent formatting
- Unit tests for core logic (matching algorithm, trajectory calculations)
- API documentation (FastAPI auto-generates OpenAPI docs)
- README with setup instructions, environment variables, deployment guide

---

## 4. AI Tool Declaration — Be Transparent

At submission, you must **declare which AI tools you used and roughly how**. This is not optional.

### AI Tools You'll Likely Use

| Tool | Usage | Declaration |
|------|-------|-------------|
| Claude (API) | AI Career Coach backend | "Integrated Claude API for conversational AI coach. Full profile context sent on each call." |
| Cursor / Copilot | Code generation | "Used AI pair programming for boilerplate code. All generated code reviewed and customised." |
| v0 / Bolt | UI prototyping (optional) | "Used for rapid UI exploration. Final implementation hand-coded in React with Tailwind." |

### What Judges Score

They score **taste, integration, and output quality** — not hand-typed code. Be honest about tool usage, show you directed AI well, and demonstrate integration quality.

**Don't hide AI usage — showcase it.** This is an AI-native hackathon.

---

## 5. Production-Ready Definition

The brief says "production-ready only". Here's what that means:

### The 5 Gates

1. **Clean** — No console errors, no broken links, no placeholder text visible
2. **Documented** — README with setup instructions, API docs, architecture diagram
3. **Tested** — Core logic unit tests, happy path E2E test, no obvious bugs
4. **Deployed** — Live URL on AWS/Azure/GCP, not localhost, SSL enabled
5. **Integrable** — Code structure is modular, dependencies clear, no hardcoded secrets

### Testing Strategy

**Minimum Viable Testing:**
- Unit tests for matching algorithm (`calculate_match_score`)
- Unit tests for trajectory probability calculations
- Manual E2E: Ahmad's full journey + Employer dashboard

**Nice to Have:**
- React Testing Library tests for key components
- FastAPI endpoint tests (pytest)
- Cypress/Playwright E2E tests

### Documentation Checklist

- [ ] README.md with project overview, tech stack, setup, deployment, demo
- [ ] Architecture diagram (frontend → backend → database → AI API)
- [ ] API documentation (FastAPI auto-generates at `/docs`)
- [ ] Deployment guide
- [ ] Demo walkthrough for judges
- [ ] AI tool declaration

---

## 6. Intent Form Stage — The Gate Before Build

Before the 28-day build phase, you must submit an **Intent Form** (Stage 1).

### What's Required

1. **Clickable prototype or interactive link** — Shows the idea in motion
2. **Proposal or concept brief** — What you'll build, why it matters
3. **Supporting materials** — Pictures, videos, decks (optional but helpful)
4. **Module preferences** — Which Career OS modules you'll implement

### Strategy

**Clickable Prototype:**
- Build a Figma prototype OR static frontend (React + Tailwind) deployed to Vercel
- Show the 3-panel OS layout and trajectory graph interaction

**Concept Brief (500 words):**
- Open with their brief language: "For most of us, no one tells us what's next."
- Pitch the OS metaphor, highlight differentiators
- Mention both sides: candidate (4 modules) + employer (2 modules)
- Reference the 4 pillars: Discovery, Growth, Progression, Feedback

**Timeline:**
- Days 1-3: Build prototype
- Days 4-5: Write concept brief
- Day 6: Submit Intent Form
- Day 7: Receive acceptance, get Reference Build access

---

## 7. Adoption Pool Strategy

The Adoption Pool offers up to RM 25K (Code Adoption) or RM 10K (Strategic Adoption).

### Two Tiers

**Tier 1: Code Adoption (up to RM 25K/team)**
- Your code deploys directly into Talentbank's production stack
- 5-gate review: stack compatibility, code quality, documentation, AI provenance, test coverage
- Milestones: 10% sign / 20% review / 20% docs / 20% integration / 30% live

**Tier 2: Strategic Adoption (up to RM 10K/team)**
- Your concept shapes their roadmap, they rebuild on their stack
- Paid: 50% on signing / 50% on first integration milestone

### Stack Compatibility Note

Talentbank's production platform runs on **Angular**. Your plan uses React — this is fine for the hackathon, but flag: "Built in React for velocity. Aware Talentbank's production stack is Angular. Willing to migrate or provide implementation guide."

### IP Ownership

- You retain full ownership unless adopted
- If adopted, full IP transfers to Talentbank on signing Adoption Agreement
- You retain portfolio acknowledgement: "Worked on Career OS at Talentbank Tech Hackathon 2026"

---

## 8. Reference Build — Beat It, Don't Ignore It

Shortlisted teams unlock Talentbank's internal Career OS prototype at kickoff.

### What to Do

1. **Study it immediately** at kickoff
2. **Identify gaps** — what's missing, clunky, slow
3. **Beat it on the same features** — make yours interactive and beautiful
4. **Add features they don't have** — Feedback Loop, retention signals, AI Career Coach
5. **Reference it in your pitch** — "We saw the reference build. We respected it. Then we asked: what does it look like when you treat a career like a system?"

---

## 9. Team Composition

Team size: **1 to 4 members**. Mix universities, organisations, and countries across APAC.

### Ideal Team (4 people)

| Role | Responsibility |
|------|---------------|
| **Frontend Lead** | React, Tailwind, React Flow, Recharts, Framer Motion |
| **Backend Lead** | FastAPI, PostgreSQL, SQLAlchemy, Docker, deployment |
| **AI Engineer** | Claude API integration, prompt engineering, conversation state |
| **Product/Designer** | UX design, Figma, user flows, pitch deck, presentation |

### Solo Strategy

**Advantages:** Faster decisions, no coordination overhead
**Risks:** Burnout, skill gaps

**Action:** If solo, ruthlessly prioritise the demo path. Cut features that don't serve Ahmad's journey.

---

## 10. Deliverables — What You Actually Submit

### Stage 2 (Build Phase) Deliverables

1. **Working code** — GitHub repo, version-controlled
2. **Implemented Career OS modules** — Candidate + employer features
3. **Production-ready build** — Deployed live, not localhost
4. **Documentation and walkthrough** — README + demo guide for judges

### Submission Package Checklist

**Code:**
- [ ] GitHub repo (public or private with judge access)
- [ ] Clean git history (squash WIP commits)
- [ ] No secrets in code (use environment variables)
- [ ] `.env.example` file

**Deployment:**
- [ ] Live URL (AWS/Azure/GCP, not localhost)
- [ ] SSL enabled (HTTPS)
- [ ] Health check endpoint (`/api/health`)

**Documentation:**
- [ ] README.md (overview, tech stack, setup, deployment, demo)
- [ ] Architecture diagram
- [ ] API documentation
- [ ] Demo walkthrough for judges
- [ ] AI tool declaration

**Pitch Materials:**
- [ ] Slide deck (5-7 slides)
- [ ] Architecture slide
- [ ] Team slide
- [ ] Demo script (5-minute, timed)

**Pre-Seeded Data:**
- [ ] 4 demo personas with full profiles
- [ ] Trajectory graph data (nodes, edges, probabilities)
- [ ] Salary data (8 cities, 30 roles, 5 seniority levels)
- [ ] Sample applications and employer job postings

---

## 11. Q&A Preparation

After your 5-minute pitch, there's a **2-minute Q&A**. Prepare for these questions:

### Likely Questions & Answers

**Q: "How is this different from LinkedIn / JobStreet?"**
A: "Career OS is trajectory-based, not keyword-based. We show where your career is heading based on actual data. We also close the feedback loop — candidates log outcomes, the system learns, employers see aggregate signals."

**Q: "Where does your trajectory data come from?"**
A: "For this demo, synthetic but realistic data. In production, this comes from Talentbank's 15 years of employer-graduate data, university alumni tracking, and user-contributed application outcomes."

**Q: "Is the AI Coach just ChatGPT with a wrapper?"**
A: "No. The coach is context-aware — it knows the user's profile, trajectory node, skill gaps, and salary data. Every response is grounded in their actual situation, engineered to sound like a senior Asia career mentor."

**Q: "How would you scale this?"**
A: "FastAPI backend (async, stateless), PostgreSQL (indexed), Redis for session state, React Flow for client-side rendering. Trajectory graph is pre-computed and cached."

**Q: "Why didn't you build university modules?"**
A: "We prioritised depth over breadth. The brief requires both candidate and employer sides — we covered those comprehensively. University modules are a natural extension."

### Q&A Strategy

- **Rehearse answers** out loud
- **Be honest** about limitations
- **Pivot to strengths**
- **Reference their brief** ("You mentioned the 4 pillars...")
- **Don't bluff** — say "We haven't explored that yet, but here's how we'd approach it..."

---

## 12. Winning Checklist

### Must-Haves (Non-Negotiable)

- [ ] Both sides covered (Candidate + Employer) — mandatory per brief
- [ ] Live deployed URL — they said "production-ready only"
- [ ] Career Trajectory Graph working and clickable
- [ ] AI Career Coach giving contextual, profile-aware responses
- [ ] Fair Pay Engine with Asian city comparison
- [ ] Skill Gap Radar updating when graph node clicked
- [ ] Feedback Loop with at least read/write on applications
- [ ] Employer match dashboard with at least one matched candidate shown
- [ ] Ahmad persona pre-seeded and demoable in under 2 minutes
- [ ] Onboarding flow completing in under 90 seconds

### Differentiators (Win Margin)

- [ ] Career Trajectory Graph uses ACTUAL node probability percentages
- [ ] AI Coach references user's specific role, city, and career stage (not generic)
- [ ] Employer "retention probability" signal visible on candidate cards
- [ ] Feedback Loop insight message is specific (not placeholder text)
- [ ] Design matches Talentbank's colour palette (judges will notice)
- [ ] Their brief language used in your pitch opening
- [ ] Architecture referenced explicitly in pitch ("we saw your reference build")

### Compliance & Administrative (Don't Forget)

- [ ] **Intent Form submitted** before 15 June deadline — clickable prototype + concept brief + module preferences
- [ ] **3 Checkpoints submitted** on days 10, 20, and 30 — missing any without notice = disqualification
- [ ] **AI Tool Declaration** included in submission — which tools used, how used
- [ ] **README.md** complete with setup instructions, environment variables, deployment guide, demo walkthrough
- [ ] **Architecture diagram** included — frontend → backend → database → AI API flow
- [ ] **API documentation** — FastAPI auto-generates at `/docs`, verify it works
- [ ] **Unit tests** for core logic — matching algorithm, trajectory calculations
- [ ] **GitHub repo** clean — squashed WIP commits, no secrets, `.env.example` included
- [ ] **Live URL** deployed with SSL (HTTPS) — not localhost, not Vercel preview
- [ ] **Reference Build reviewed** at kickoff — studied Talentbank's prototype, identified gaps to beat
- [ ] **Q&A rehearsed** — prepared answers for common judge questions
- [ ] **Demo run-throughs** completed at least 3x — timed to 5 minutes, smooth transitions

### Red Flags to Avoid

- ❌ Demoing from localhost — deploy it
- ❌ Generic AI responses not tied to the user's profile
- ❌ Keyword-based matching (you are trajectory-based — say it)
- ❌ Showing features that crash or throw errors during demo
- ❌ Opening with "so our idea is..." — open with their own words
- ❌ Building too wide and too shallow — depth on the demo path wins

---

## 13. Build Order Reference (Quick Version)

See `plan.md` Section 13 for detailed build order. Quick reference:

### Phase 1 — The Demo Path (Build This First)

1. Project scaffold (Vite + React + Tailwind + FastAPI + Docker)
2. Design system (CSS variables, fonts, card components, button)
3. Onboarding flow (3 steps, Ahmad persona pre-filled)
4. Career Trajectory Graph (React Flow, seed data, 3 paths)
5. Skill Gap Radar (Recharts RadarChart, click-triggered)
6. AI Career Coach panel (Claude API, pre-loaded message)
7. Fair Pay Engine (salary data, percentile bar, city comparison)
8. Feedback Loop (application logger, insight text)

### Phase 2 — Employer Side + Polish

9. Employer dashboard (match cards, retention signal)
10. Auth (Supabase, login/register flow)
11. Seed database (4 personas, salary data, trajectory graph)
12. Deploy (Docker → AWS/Azure, live URL)
13. Mobile-responsive polish
14. Animations (Framer Motion, stagger reveals)

### Phase 3 — Buffer + Presentation

15. Bug fixes and edge case handling
16. Demo run-throughs (3x minimum)
17. Slide deck (1 architecture slide, 1 team slide)
18. Final deployment check, live URL verification

### Critical Path Rule

> If you run out of time, the Trajectory Graph must be perfect. Everything else is negotiable. A polished narrow demo beats a broken wide one, every time.

---

*Built for: Talentbank Tech Hackathon | Hackathon logistics plan | Author: Hafzan*
