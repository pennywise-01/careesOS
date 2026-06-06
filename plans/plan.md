# Career OS — Feature Design Plan

> **Event:** Talentbank Tech Hackathon | techhackathon.com  

> **Challenge:** Career OS / Career Marketplace  

> **Requirement:** Build the platform that connects employers and candidates across Asia. Cover both sides. Architecture, UX, stack — your call.


---


## Table of Contents


1. [Strategic Overview](#1-strategic-overview)

2. [Track Selection & Rationale](#2-track-selection--rationale)

3. [The Winning Angle](#3-the-winning-angle)

4. [Feature Set — What to Build](#4-feature-set--what-to-build)

5. [UI/UX Design System](#5-uiux-design-system)

6. [Screen-by-Screen Layout Plan](#6-screen-by-screen-layout-plan)

7. [Tech Stack](#7-tech-stack)

8. [Database Schema](#8-database-schema)

9. [API Architecture](#9-api-architecture)

10. [AI Integration (DeepSeek API)](#10-ai-integration-claude-api)

11. [Data Strategy](#11-data-strategy)

12. [Build Order](#12-build-order) 



---


## 1. Strategic Overview


### What the Judges Actually Want

The brief explicitly states:

- **Required for ALL teams:** Build Career OS — a platform connecting employers and candidates across Asia

- Both sides (candidate + employer) must be covered

- They have a reference prototype — you must beat it

- Production-ready only (not Figma mockups, not localhost demos)


### The 4 Pillars (Their Own Framework)

Every feature must trace back to one of these:


| # | Pillar | Meaning |
|---|---|---|
| 01 | **Discovery** | Help candidates find roles and employers find talent — beyond keyword matching |
| 02 | **Growth** | Surface skill gaps, learning paths, moves that compound value over time |
| 03 | **Progression** | Map likely trajectories. Help users decide at the right moment, with real signal |
| 04 | **Feedback** | Close the gap between applications, interviews, and outcomes — both sides |

### What Everyone Else Will Build

Generic job board + AI chatbot + skills list. Keyword-based matching with a thin AI wrapper. Predictable. Forgettable.


### What You Will Build

An **Operating System for your career** — not a search engine. The metaphor is the strategy.


---


## 2. Track Selection & Rationale


### Chosen Modules (from the 18 available)


#### Candidate Side (Primary)

| # | Module | Why |
|---|---|---|
| C-01 | **Career Path Navigator** | Visual centrepiece. Most differentiating feature. Hits Pillar 03 |
| C-03 | **AI Career Coach** | High judges' impression. Real AI demo. Hits Pillars 02 & 03 |
| C-04 | **Fair Pay Engine** | Tangible, numbers-based, instantly relatable. Hits Pillar 03 |
| C-02 | **Living Portfolio** | Supports onboarding and profile richness |

#### Employer Side (Required Coverage)

| # | Module | Why |
|---|---|---|
| E-01 | **Smart Talent Matching** | Demonstrates "both sides" requirement cleanly |
| E-02 | **Talent Retention Signals** | Differentiates from basic hiring tools |

#### Universities Side (Bonus if time)

| # | Module | Why |
|---|---|---|
| U-02 | **Future-State Curriculum Engine** | Strong story for judges, ties all 3 sides together |

### Why This Combination Wins

- Covers all 4 pillars

- Satisfies the mandatory "both sides" requirement

- Highly demoable in a 5-minute pitch window

- Plays directly into AI/full-stack strengths

- Avoids being spread too thin


---


## 3. The Winning Angle


### The Pitch in One Sentence

> *"Career OS isn't a job board. It's the co-pilot Talentbank's users have never had — from your first profile to your last role."*


### The OS Metaphor — Execute It Fully

An operating system has:

- A **Dashboard** (current state, signals, notifications)

- **Apps** (Career Coach, Salary Engine, Path Navigator, Feedback Loop)

- **Memory** (your career history is the OS's persistent state)

- **Background processes** (trajectory signals updating, retention flags, market shifts)

- **Settings/Profile** (your chapter, location, preferences)


This framing tells judges: you thought at a systems level, not a feature level.


### The One Line That Wins the Room

Open by reading their own brief back to them:

> *"For most of us, across Asia, careers are built spontaneously, unpredictably, alone. We make the most consequential decisions of our lives with no map, no signal, no co-pilot."*  

> **Then pause. Then:** *"We built the co-pilot."*


---


## 4. Feature Set — What to Build


### 4.1 Career Trajectory Graph ⭐ (Your Visual Showstopper)


**What it does:**

- Node-graph showing: *"People who had your profile at age 25 ended up here at 30, here at 35"*

- Branching paths, not a list. Interactive, zoomable, clickable

- Each node shows: role title, median salary, time-to-reach, % of similar profiles who took this path

- Color-coded by likelihood: green (high probability), yellow (possible), grey (unlikely with current profile)


**Tech:** React Flow or D3.js force-directed graph


**Data:** Synthetic but credible Asia career paths dataset (see Section 11)


**Interactions:**

- Click a node → Skill Gap Radar updates on right panel

- Hover → tooltip with "42% of profiles like yours reached this role"

- Filter by industry, location, age bracket


**Why this wins:** Nobody else will have an interactive graph. It's the one screenshot judges will remember. Build this first.


---


### 4.2 AI Career Coach (DeepSeek API)


**What it does:**

- Conversational AI, always visible in right-side panel

- Context-aware — knows the user's full profile, current trajectory view, skill gaps

- Not generic tips — specific, grounded in the user's actual data

- Proactively surfaces moves the user hasn't thought of


**Sample Coach Output (hardcode this for demo):**

> *"Based on your 3 years in IT Support at a Malaysian financial institution, your highest-probability next move is Cloud Engineer (AWS focus). 41% of profiles matching yours reached this in under 18 months. You're missing 2 skills: Terraform and AWS Solutions Architect certification. Want me to map that learning path?"*


**Prompt Engineering:**

```

System: You are a Career OS co-pilot for Asia professionals. You have access to the user's full career profile, trajectory graph position, skill gaps, and market salary data. You give specific, data-grounded advice. Never give generic career tips. Always reference the user's actual role, company type, location, and career stage. Sound like a senior mentor who has seen thousands of careers, not a chatbot.


User context: {profile\_json}

Current trajectory view: {selected\_path}

Skill gap: {gap\_list}

```


**Conversation Memory:** Send full history on each API call (DeepSeek has no memory between calls — maintain state in frontend)


---


### 4.3 Asia Fair Pay Engine


**What it does:**

- Salary ranges by role + city: KL, JB, Penang, SG, JKT, MNL, BKK

- Shows percentile position: *"You're at the 42nd percentile for your role in KL"*

- Comparison: *"If you moved to Singapore, this role pays SGD 5,800–7,200/month (≈RM 20,400–25,200)"*

- Trend line: salary growth trajectory over 5 years for the selected path


**Visualisation:** Recharts `AreaChart` for trend, horizontal bar with percentile marker for current position


**Data:** Synthetic salary dataset — 8 cities, 30 roles, 5 seniority levels (see Section 11)


---


### 4.4 Skill Gap Radar


**What it does:**

- Spider/radar chart: current skills vs. required skills for each career path branch

- Tied directly to Trajectory Graph — when you click a path node, the radar updates

- Shows gap score: *"You're 73% ready for this path"*

- Each missing skill links to a learning resource (mock links for demo, real for prod)


**Visualisation:** Recharts `RadarChart`


**Skill Categories:** Technical, Leadership, Communication, Domain Knowledge, Certifications


---


### 4.5 Employer Smart Matching Dashboard


**What it does:**

- Employer posts a role

- System returns candidates ranked by **trajectory match**, not keyword match

- Shows WHY they match: skills alignment %, trajectory similarity, career stage fit

- Retention signal: *"This candidate is statistically likely to stay 2+ years based on career stage and trajectory direction"*

- Flag: *"This candidate is a trajectory match but not actively looking — consider proactive outreach"*


**This is the "both sides" requirement met cleanly.**


---


### 4.6 The Feedback Loop


**What it does:**

- After an application: candidate logs outcome (applied, got interview, rejected, offer, accepted)

- After an interview: candidate logs feedback received

- System aggregates: *"People from your background who got rejected at this company type found success here instead"*

- Employer side: sees aggregate outcome data on their own job posts — drop-off rates, quality signals


**Why this wins:** The most underbuilt feature in every existing job platform. You show you read the brief deeper than everyone else. It directly closes Pillar 04 (Feedback).


---


### 4.7 Life Chapter Onboarding


**What it does:**

- Mirrors their own site's age-bubble UI — but makes it interactive and functional

- 5 life chapters: Student (15), Young Adult (20), Early Career (30), Mid-Career (40), Senior Career (50), Executive & Beyond (60+)

- User picks their chapter → onboarding flow tailors itself

- Asks: Current role, Company size, Industry, Location, Years experience, Top 5 skills

- Optionally: paste LinkedIn URL (parse on backend, or mock-parse for demo)


**Target:** Complete onboarding in under 90 seconds. Judges will go through this live.


---


### 4.8 Living Portfolio (Bonus)


**What it does:**

- Auto-generated profile card from inputs

- Shows: career trajectory so far (visual timeline), skill cloud, salary percentile badge, trajectory direction arrow

- Shareable link for each user: `careeros.app/profile/ahmad-razif`

- Employers can view this instead of a CV


---


## 5. UI/UX Design System


### 5.1 Visual Identity


Match and elevate Talentbank's own design language — judges will notice and respect it.


#### Colour Palette

```css

:root {

  /* Backgrounds */

  --bg-primary:    #0d1f1a;   /* Deep forest green — main background */

  --bg-surface:    #112820;   /* Card/panel background */

  --bg-elevated:   #1a3d2e;   /* Hover states, secondary panels */

  --bg-highlight:  #1f4a36;   /* Active/selected states */


  /* Accent — Yellow (their brand) */

  --accent-primary:  #f5c518; /* Primary CTA, highlights */

  --accent-hover:    #ffd740; /* Hover state for CTAs */

  --accent-muted:    #a68b10; /* Muted accent, tags */


  /* Text */

  --text-primary:   #f0f4f0;  /* Main text */

  --text-secondary: #8aab97;  /* Subtext, labels */

  --text-muted:     #4d7a63;  /* Timestamps, inactive */


  /* Status */

  --status-green:  #4caf7d;   /* High probability paths */

  --status-yellow: #f5c518;   /* Medium probability */

  --status-grey:   #3d5a4e;   /* Low probability */

  --status-red:    #e05555;   /* Alerts, gaps */


  /* Graph nodes */

  --node-current:  #f5c518;

  --node-likely:   #4caf7d;

  --node-possible: #6ba8ff;

  --node-unlikely: #3d5a4e;

}

```


#### Typography

```css

/* Display / Headers */

@import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap');


/* Body / UI */

@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=DM+Sans:wght@300;400;500;600&display=swap');


\--font-display: 'DM Serif Display', serif;      /* Hero headings */

\--font-body:    'DM Sans', sans-serif;           /* Body, UI labels */

\--font-mono:    'IBM Plex Mono', monospace;      /* Numbers, codes, data */

```


**Why:** DM Serif Display gives gravitas to big statements. IBM Plex Mono for salary figures and stats makes them feel like real data. DM Sans is clean for UI. None of these are generic AI choices.


#### Spacing & Radius

```css

- -radius-sm:  4px;

- -radius-md:  8px;

- -radius-lg:  16px;

- -radius-xl:  24px;


- -space-xs:   4px;

- -space-sm:   8px;

- -space-md:   16px;

- -space-lg:   24px;

- -space-xl:   48px;

- -space-xxl:  80px;

```


---


### 5.2 Component Patterns


#### Cards

```css

.card {

  background: var(--bg-surface);

  border: 1px solid rgba(245, 197, 24, 0.12);

  border-radius: var(--radius-lg);

  padding: var(--space-lg);

}


.card:hover {

  border-color: rgba(245, 197, 24, 0.3);

  background: var(--bg-elevated);

  transition: all 0.2s ease;

}

```


#### Primary CTA Button

```css

.btn-primary {

  background: var(--accent-primary);

  color: #0d1f1a;

  font-family: var(--font-body);

  font-weight: 600;

  padding: 12px 24px;

  border-radius: var(--radius-md);

  letter-spacing: 0.02em;

  transition: background 0.15s ease, transform 0.1s ease;

}


.btn-primary:hover {

  background: var(--accent-hover);

  transform: translateY(-1px);

}

```


#### Numbered Labels (their style)

```css

.section-number {

  font-family: var(--font-mono);

  font-size: 11px;

  color: var(--accent-primary);

  letter-spacing: 0.15em;

  text-transform: uppercase;

}

/* Usage: 01 · Discovery */

```


#### Progress / Percentile Bar

```css

.percentile-bar {

  height: 4px;

  background: var(--bg-elevated);

  border-radius: 2px;

  position: relative;

}


.percentile-fill {

  height: 100%;

  background: linear-gradient(90deg, var(--accent-muted), var(--accent-primary));

  border-radius: 2px;

}


.percentile-marker {

  position: absolute;

  top: -4px;

  width: 12px;

  height: 12px;

  border-radius: 50%;

  background: var(--accent-primary);

  border: 2px solid var(--bg-primary);

}

```


---


## 6. Screen-by-Screen Layout Plan


### Screen 0: Landing / Life Chapter Selection


**Layout:** Full viewport, vertically centred

**Content:**

- Top: `[T]` logo + "Career OS by Talentbank" in header

- Centre hero: *"For most of us, no one tells us what's next."* in DM Serif Display, 48px

- Sub: *"Career OS is the co-pilot you never had."*

- Below: 5 interactive age-bubble cards (their own UI pattern, but clickable)

- Yellow CTA: "Start your Career OS →"


**Animation:** Bubbles stagger-fade in on load (CSS animation-delay, 100ms each)


---


### Screen 1: Onboarding Flow (3 Steps)


**Step 1 — Your Chapter**

- Confirm the age/life-chapter selected

- Chapter name + description displayed

- "This changes how we model your paths" — builds confidence in the system


**Step 2 — Your Profile**

```

Current Role:        [\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_\_]

Company Size:        [Startup / SME / MNC / GLC]

Industry:            [Dropdown — 12 Asian industries]

City:                [KL / JB / Penang / SG / JKT / MNL / BKK / Other]

Years Experience:    [Slider: 0–20+]

Top Skills (pick 5): [Tag chips from curated list]

```


**Step 3 — Quick Wins (optional)**

- LinkedIn URL (mock-parse for demo)

- Target role or industry (helps trajectory graph focus)


**Progress bar at top, yellow accent. Total time: under 90 seconds.**


---


### Screen 2: Career OS Dashboard (Main Hub)


**Layout: 3-panel OS-style**


```

┌─────────────────────────────────────────────────────────────────┐

│  [T] Career OS                          Ahmad Razif  ▾   🔔     │

├──────────┬──────────────────────────────┬────────────────────────┤

│          │                              │                        │

│ SIDEBAR  │   MAIN PANEL                 │   AI CAREER COACH      │

│          │   (Career Trajectory Graph   │   (Always visible)     │

│ · Home   │    by default)               │                        │

│ · Paths  │                              │   "Based on your       │

│ · Skills │                              │   profile, here's      │

│ · Salary │                              │   what I'd focus       │

│ · Coach  │                              │   on first..."         │

│ · Jobs   │                              │                        │

│ · Feedback│                             │   [Chat input]         │

│          │                              │                        │

└──────────┴──────────────────────────────┴────────────────────────┘

```


**Sidebar:**

- User avatar + chapter badge (e.g. "Early Career · KL")

- Navigation items with yellow active state

- Small "Market Signal" widget at bottom: "3 roles trending in your field this week"


**Main Panel (default — Trajectory Graph):**

- Graph centred, current node in yellow

- Top controls: Filter by industry / location / time horizon

- Bottom: Quick stats row — "Median salary for your path: RM 7,200 | Skill readiness: 73%"


**Right Panel (AI Coach):**

- Always visible, collapsible on mobile

- First message pre-loaded based on profile

- Chat input at bottom

- Thin yellow border-left to distinguish


---


### Screen 3: Career Trajectory Graph (Expanded View)


**Full-width main panel takeover**


**Node anatomy:**

```

╔══════════════════════╗

║  Cloud Engineer      ║  ← Role title

║  AWS / Azure         ║  ← Specialisation

║  RM 7,500 – 11,000   ║  ← Salary range (font-mono)

║  ████░░ 42%          ║  ← % of profiles who reached this

║  \~18 months          ║  ← Time to reach from current node

╚══════════════════════╝

```


**Node colours by probability:**

- 🟡 Yellow: Current position

- 🟢 Green: High probability (>35% of similar profiles)

- 🔵 Blue: Possible (15–35%)

- ⬜ Grey: Unlikely (<15% without profile changes)


**On click:**

- Right panel slides to Skill Gap Radar + Salary comparison

- AI Coach sends a new message about the clicked path

- "People like Ahmad who took this path" testimonial card appears below graph


---


### Screen 4: Skill Gap Radar (Right Panel — triggered by graph click)


```

        Technical

            │

    ████████│████░░░

   /                 \\

  /                   \\

Leadership         Domain

  █████░░░          Knowledge

  \\                  ████████

   \\                /

    Communication

       ██████░

```


- **Solid line:** Your current skills

- **Dashed line:** Required skills for selected path

- **Gap score:** "You're 73% ready for Cloud Engineer path"

- **Top 3 missing skills** listed below with "Learn this →" links

- CTA: "Add these to your learning plan"


---


### Screen 5: Fair Pay Engine


**Layout: Two columns**


**Left — Your Position:**

```

Cloud Engineer · KL


    RM 7,500 – 11,000

    ├──────────────────────────────┤

                     ▲

                   You are here

               42nd percentile


Compared to:

  SG: SGD 5,800–7,200 (≈RM 20,400–25,200)  [+178%]

  JKT: IDR 18M–28M    (≈RM 5,200–8,100)    [-15%]

```


**Right — 5-Year Trajectory:**

```

Salary Growth Projection (Cloud Engineer path, KL)


RM 11k ─────────────────────────── ╱

RM  9k ─────────────────────── ╱───

RM  7k ────────────────── ╱────────

RM  5k ─── ● You ─────────────────

       2025   2026   2027   2028   2029

```


Recharts AreaChart with gradient fill, yellow accent line.


---


### Screen 6: Employer Dashboard


**Different colour variant:** Same dark green, but employer accent is a cooler blue-green to distinguish from candidate view.


**Top KPI strip:**

```

[ Active Roles: 3 ]  [ Candidates Matched: 47 ]  [ Avg Match Score: 78% ]  [ Retention Risk: 2 ]

```


**Candidate Match Cards:**

```

┌─────────────────────────────────────────────────────────┐

│  Ahmad Razif · 28 · Early Career · KL                   │

│  Current: IT Support Specialist, 3 yrs                  │

│                                                         │

│  Match Score: ████████░░ 82%                            │

│  ✓ Trajectory match: Cloud Engineer path                │

│  ✓ Skill alignment: 7/9 required skills                 │

│  ⚠ Not actively looking — proactive outreach suggested  │

│                                                         │

│  Est. retention probability: 87% (>2 years)             │

│                                                         │

│  [View Full Profile]  [Send Signal]                     │

└─────────────────────────────────────────────────────────┘

```


**Why this wins:** Shows trajectory-matching, not keyword-matching. Shows retention signal. Shows "passive candidate" flag — this is sophisticated talent intelligence that LinkedIn Recruiter doesn't surface this way.


---


### Screen 7: Feedback Loop


**Candidate view — Application Tracker:**

```

Role Applied      Company Type    Stage            Outcome

──────────────    ────────────    ─────────────    ────────────────

Cloud Engineer    MNC Fin         Interview ✓      Offer received ✓

DevOps Lead       Startup         Applied           Rejected ✗

SRE Engineer      GLC             Interview ✓       Pending...


Insight: "People with your profile who were rejected at MNC roles 

         had 3x more success at high-growth Series B startups."

```


**Why this matters:** This closes the loop on Pillar 04. No other team will build this.


---


## 7. Tech Stack


### Frontend

| Technology | Purpose |
|---|---|
| React 18 + Vite | App framework |
| Tailwind CSS | Utility styling |
| React Flow | Career Trajectory Graph (node-graph) |
| Recharts | Salary charts, Radar chart, Area charts |
| Zustand | Lightweight state management |
| React Router v6 | Multi-page routing |
| Framer Motion | Page transitions, panel animations |

### Backend
| Technology | Purpose |
|---|---|
| FastAPI (Python) | REST API, async |
| PostgreSQL | Primary database |
| Redis | Session state, AI conversation history |
| SQLAlchemy | ORM |
| Alembic | DB migrations |
| Pydantic v2 | Data validation |

### AI

| Technology | Purpose |
|---|---|
| DeepSeek API | AI Career Coach |
| Full conversation history | Passed on every API call |
| Structured outputs | Profile analysis, trajectory scoring |

### Auth & Infra

| Technology | Purpose |
|---|---|
| Supabase Auth | JWT-based auth (quick setup) |
| Docker + docker-compose | Local dev + deployment |
| AWS ECS / Azure Container Apps | Production deployment |
| Nginx | Reverse proxy |
| GitHub Actions | CI/CD pipeline |

### Why This Stack Wins

- FastAPI + React = your existing CostPilot stack, maximum velocity

- React Flow is the best graph library for this exact use case

- Docker + cloud deploy = you can show a live URL, not localhost

- Supabase Auth = 30-minute auth setup, don't waste time building auth

- Your CKA + AWS/Azure certs mean cloud deploy is fast for you

**⚠️ Angular Compatibility Note:** Talentbank's production stack is Angular, not React. If your solution is selected for adoption, they may need to rebuild the frontend in Angular. This is acceptable for the hackathon (they explicitly allow any stack), but be prepared to:

- Document your React components clearly so Angular migration is straightforward

- Keep business logic in the FastAPI backend (stack-agnostic)

- Mention in your pitch that you chose React for speed but understand Angular migration may be needed for production adoption

This won't hurt your hackathon score — the FAQ explicitly says "Open stack. AI welcome." — but awareness shows strategic thinking.


---


## 8. Database Schema


```sql

- - Users / Candidates

CREATE TABLE users (

  id            UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

  email         VARCHAR(255) UNIQUE NOT NULL,

  name          VARCHAR(255),

  age           INT,

  life\_chapter  VARCHAR(50),   -- student / young\_adult / early\_career / mid\_career / senior / executive

  created\_at    TIMESTAMP DEFAULT NOW()

);


- - Career Profiles

CREATE TABLE career\_profiles (

  id                UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

  user\_id           UUID REFERENCES users(id),

  current\_role      VARCHAR(255),

  company\_size      VARCHAR(50),   -- startup / sme / mnc / glc

  industry          VARCHAR(100),

  city              VARCHAR(100),

  years\_experience  INT,

  skills            TEXT[],        -- array of skill strings

  target\_role       VARCHAR(255),

  linkedin\_url      VARCHAR(500),

  updated\_at        TIMESTAMP DEFAULT NOW()

);


- - Career Trajectory Nodes (pre-seeded synthetic data)

CREATE TABLE trajectory\_nodes (

  id                UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

  role\_title        VARCHAR(255),

  specialisation    VARCHAR(255),

  industry          VARCHAR(100),

  seniority\_level   VARCHAR(50),

  salary\_min\_myr    INT,

  salary\_max\_myr    INT,

  city              VARCHAR(100),

  required\_skills   TEXT[],

  reach\_time\_months INT,           -- avg months to reach from entry point

  created\_at        TIMESTAMP DEFAULT NOW()

);


- - Trajectory Edges (connections between nodes)

CREATE TABLE trajectory\_edges (

  id              UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

  from\_node\_id    UUID REFERENCES trajectory\_nodes(id),

  to\_node\_id      UUID REFERENCES trajectory\_nodes(id),

  probability     FLOAT,     -- 0.0 to 1.0

  profile\_count   INT,       -- how many profiles in dataset took this path

  avg\_time\_months INT

);


- - User's current graph position + history

CREATE TABLE user\_trajectories (

  id              UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

  user\_id         UUID REFERENCES users(id),

  current\_node\_id UUID REFERENCES trajectory\_nodes(id),

  path\_history    UUID[],    -- array of past node IDs

  updated\_at      TIMESTAMP DEFAULT NOW()

);


- - Salary data

CREATE TABLE salary\_data (

  id              UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

  role\_title      VARCHAR(255),

  city            VARCHAR(100),

  seniority       VARCHAR(50),

  salary\_p25\_myr  INT,

  salary\_p50\_myr  INT,

  salary\_p75\_myr  INT,

  salary\_p90\_myr  INT,

  year            INT

);


- - Applications (Feedback Loop)

CREATE TABLE applications (

  id              UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

  user\_id         UUID REFERENCES users(id),

  role\_title      VARCHAR(255),

  company\_type    VARCHAR(100),

  stage           VARCHAR(100),   -- applied / interview / offer / rejected / accepted

  outcome\_notes   TEXT,

  applied\_at      TIMESTAMP DEFAULT NOW(),

  updated\_at      TIMESTAMP DEFAULT NOW()

);


- - Employers

CREATE TABLE employers (

  id          UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

  company     VARCHAR(255),

  industry    VARCHAR(100),

  size        VARCHAR(50),

  city        VARCHAR(100),

  created\_at  TIMESTAMP DEFAULT NOW()

);


- - Job Postings

CREATE TABLE job\_postings (

  id              UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

  employer\_id     UUID REFERENCES employers(id),

  role\_title      VARCHAR(255),

  required\_skills TEXT[],

  seniority       VARCHAR(50),

  city            VARCHAR(100),

  salary\_min\_myr  INT,

  salary\_max\_myr  INT,

  active          BOOLEAN DEFAULT TRUE,

  posted\_at       TIMESTAMP DEFAULT NOW()

);


- - AI Coach Conversation History

CREATE TABLE coach\_conversations (

  id          UUID PRIMARY KEY DEFAULT gen\_random\_uuid(),

  user\_id     UUID REFERENCES users(id),

  messages    JSONB,        -- full conversation array [{role, content}, ...]

  updated\_at  TIMESTAMP DEFAULT NOW()

);

```


---


## 9. API Architecture


### Candidate Endpoints

```

POST   /api/auth/register

POST   /api/auth/login

GET    /api/profile/{user\_id}

PUT    /api/profile/{user\_id}


GET    /api/trajectory/{user\_id}          → Returns graph nodes + edges for user

POST   /api/trajectory/{user\_id}/position → Update current node

GET    /api/trajectory/paths              → All possible path branches


GET    /api/skills/gap/{user\_id}/{node\_id} → Radar chart data for a target node

GET    /api/skills/list                    → All skills in system


GET    /api/salary/{role}/{city}           → Salary distribution + percentile

GET    /api/salary/compare/{role}          → Cross-city salary comparison


POST   /api/coach/message                  → Send message to AI Coach (full history)

GET    /api/coach/history/{user\_id}        → Get conversation history


GET    /api/applications/{user\_id}         → All applications

POST   /api/applications                   → Log new application

PUT    /api/applications/{id}              → Update stage/outcome

GET    /api/applications/{user\_id}/insight → AI-generated feedback loop insight

```


### Employer Endpoints

```

GET    /api/employer/{employer\_id}/matches/{job\_id}  → Trajectory-matched candidates

GET    /api/employer/{employer\_id}/retention/{user\_id} → Retention probability

POST   /api/employer/jobs                             → Post new role

GET    /api/employer/jobs/{employer\_id}               → All active jobs

```


### Matching Algorithm (Simplified for Demo)

```python

def calculate\_match\_score(candidate\_profile, job\_posting):

    skill\_score = len(

        set(candidate\_profile.skills) & set(job\_posting.required\_skills)

    ) / len(job\_posting.required\_skills)

    

    # Trajectory direction match (is their career heading toward this role?)

    trajectory\_score = get\_trajectory\_alignment(

        candidate\_profile.current\_node\_id, 

        job\_posting.role\_title

    )

    

    # Experience level fit

    experience\_score = calculate\_experience\_fit(

        candidate\_profile.years\_experience,

        job\_posting.seniority

    )

    

    # Weighted composite

    return (

        skill\_score * 0.40 +

        trajectory\_score * 0.40 +

        experience\_score * 0.20

    )

```


---


## 10. AI Integration (DeepSeek API)


### Career Coach System Prompt

```python

CAREER\_COACH\_SYSTEM = """

You are Career OS — an AI career co-pilot built specifically for Asia professionals.

You have access to the user's full career profile, their current trajectory graph 

position, skill gaps, and regional salary market data.


YOUR RULES:

1. NEVER give generic career advice. Always reference the user's actual role, 

   company type, city, years of experience, and life chapter.

2. When referencing data, use numbers. Don't say "you could earn more" — say 

   "Cloud Engineers at your level in KL earn RM 7,500–11,000. You're currently 

   at the 42nd percentile."

3. Be direct. You are a senior mentor who has seen thousands of careers across 

   Asia, not a chatbot.

4. Proactively surface moves the user hasn't thought of. If their trajectory 

   data suggests a high-probability path they haven't explored, mention it.

5. Anchor every recommendation to their trajectory graph. Reference path names 

   (e.g. "the Cloud Engineer branch", "the Product Manager path").

6. Understand Asia career contexts: GLCs, MNCs in KLCC, startup ecosystems in 

   Bangsar South, regional moves to Singapore, etc.

7. Be empathetic but efficient. Career decisions are high-stakes. Treat them 

   seriously.


RESPONSE FORMAT:

- Lead with the most important insight

- Use bullet points only when listing specific skills, roles, or action steps

- Keep responses under 150 words unless asked to elaborate

- End with ONE specific, actionable next step


CONTEXT PROVIDED:

User Profile: {profile}

Life Chapter: {chapter}

Current Trajectory Node: {current\_node}

Skill Gap for selected path: {skill\_gap}

Market Salary Context: {salary\_context}

"""

```


### Conversation State Management

```javascript

// Frontend — Zustand store

const useCoachStore = create((set, get) => ({

  messages: [],

  

  sendMessage: async (userMessage, userProfile) => {

    const newMessage = { role: 'user', content: userMessage };

    const updatedMessages = [...get().messages, newMessage];

    

    set({ messages: updatedMessages, loading: true });

    

    const response = await fetch('/api/coach/message', {

      method: 'POST',

      headers: { 'Content-Type': 'application/json' },

      body: JSON.stringify({

        messages: updatedMessages,

        profile: userProfile,

        current\_node: get().currentNode,

        skill\_gap: get().skillGap

      })

    });

    

    const data = await response.json();

    set({ 

      messages: [...updatedMessages, { role: 'assistant', content: data.reply }],

      loading: false 

    });

  }

}));

```


### Pre-loaded Coach Messages (Demo Hardcodes)

Seed these for the demo so AI feels instantly personalised:


**Ahmad (IT Support, 3 yrs, KL):**

> *"Based on your 3 years in IT Support at a financial institution in KL, your highest-probability move is Cloud Engineer (AWS focus) — 41% of similar profiles reached this within 18 months. You have 7 of 9 required skills. The 2 gaps are Terraform and AWS Solutions Architect cert. Want me to map the 6-month learning path?"*


**Priya (Junior HR, 1 yr, SG):**

> *"Your profile shows a strong signal toward HR Tech / People Analytics — a fast-growing vertical in Singapore. 3 of the companies that hired from your university recently are scaling these teams. Your psychology background is a differentiator most candidates lack. Should we look at that path?"*


---


## 11. Data Strategy


### Synthetic Dataset — Asia Career Paths


Seed the database with realistic-looking synthetic data. This is not fake — it's representative data that shows the system works.


#### Industries Covered (12)

Financial Services, Technology, Healthcare, E-commerce / Retail, Manufacturing, Consulting, Government / GLC, Education, Media / Creative, Logistics, Energy / Utilities, Property / Construction


#### Cities Covered (8)

Kuala Lumpur, Johor Bahru, Penang, Singapore, Jakarta, Manila, Bangkok, Remote-Asia


#### Roles per Industry (sample — IT/Tech track)


**Entry:** IT Support Specialist → Help Desk Analyst → Junior Developer

**Mid-Low:** Systems Administrator → Cloud Engineer → Junior DevOps

**Mid-High:** Senior Cloud Engineer → DevOps Lead → Solutions Architect

**Senior:** Engineering Manager → Head of Infrastructure → CTO

**Pivot paths:**
- Cloud Engineer → Product Manager (Technical)
- Systems Admin → Cybersecurity Analyst
- Developer → Cloud Architect


#### Salary Anchors (MYR/month, 2025 data)


| Role | KL | JB | SG (MYR equiv) |
|---|---|---|---|
| IT Support Spec | 2,800 – 4,200 | 2,200 – 3,600 | 8,500 – 12,000 |
| Cloud Engineer | 5,500 – 9,000 | 4,500 – 7,500 | 18,000 – 28,000 |
| DevOps Lead | 8,000 – 14,000 | 6,500 – 11,000 | 25,000 – 40,000 |
| Solutions Architect | 12,000 – 20,000 | 10,000 – 17,000 | 35,000 – 55,000 |
| Engineering Manager | 15,000 – 25,000 | 12,000 – 20,000 | 40,000 – 65,000 |


#### Demo Personas (Seed These 4 Accounts)

| Name | Age | Role | Location | Chapter | Trajectory |
|---|---|---|---|---|---|
| Ahmad Razif | 28 | IT Support Specialist | KL | Early Career | → Cloud Engineer |
| Priya Nair | 24 | Junior HR Executive | Singapore | Young Adult | → HR Tech / People Analytics |
| David Tan | 38 | Senior Software Engineer | KL | Mid-Career | → Engineering Manager / CTO |
| Siti Aminah | 45 | Marketing Manager | JB | Senior Career | → CMO / Consultant pivot |

---

## 12. Build Order


> See `hackathon-plan.md` for the full 28-day timeline, weekly milestones, and checkpoint deadlines.

The task order below remains valid — build in this sequence, spread across the 28-day build phase.

### Phase 1 — The Demo Path (Build This First)


*Goal: Ahmad can do a full journey end-to-end. Nothing else matters until this works.*
| # | Task | Time |
|---|---|---|
| 1 | Project scaffold (Vite + React + Tailwind + FastAPI + Docker) | 1 hr |
| 2 | Design system (CSS variables, fonts, card components, button) | 1 hr |
| 3 | Onboarding flow (3 steps, Ahmad persona pre-filled) | 1.5 hr |
| 4 | Career Trajectory Graph (React Flow, seed data, 3 paths) | 3 hr |
| 5 | Skill Gap Radar (Recharts RadarChart, click-triggered) | 1.5 hr |
| 6 | AI Career Coach panel (DeepSeek API, pre-loaded message) | 2 hr |
| 7 | Fair Pay Engine (salary data, percentile bar, city comparison) | 1.5 hr |
| 8 | Feedback Loop (application logger, insight text) | 1 hr |

**Total Phase 1: ~12.5 hrs**


### Phase 2 — Employer Side + Polish

| # | Task | Time |
|---|---|---|
| 9  | Employer dashboard (match cards, retention signal) | 2 hr |
| 10 | Auth (Supabase, login/register flow) | 1.5 hr |
| 11 | Seed database (4 personas, salary data, trajectory graph) | 1 hr |
| 12 | Deploy (Docker → AWS/Azure, live URL) | 1.5 hr |
| 13 | Mobile-responsive polish | 1 hr |
| 14 | Animations (Framer Motion, stagger reveals) | 1 hr |

**Total Phase 2: ~8 hrs**


### Phase 3 — Buffer + Presentation

| # | Task | Time |
|---|---|---|
| 15 | Bug fixes and edge case handling | 2 hr |
| 16 | Demo run-throughs (3x minimum) | 1 hr |
| 17 | Slide deck (1 architecture slide, 1 team slide) | 1 hr |
| 18 | Final deployment check, live URL verification | 30 min |

**Total Phase 3: ~4.5 hrs**


### Critical Path Rule

> If you run out of time, the Trajectory Graph must be perfect. Everything else is negotiable. A polished narrow demo beats a broken wide one, every time.


---


\

## Appendix A: Quick Reference — All 18 Challenge Modules


### Candidates (6)

| # | Module | Core Idea |
|---|---|---|
| C-01 | Career Path Navigator | Interactive trajectory map |
| C-02 | Living Portfolio | Auto-generated career profile |
| C-03 | AI Career Coach | Conversational AI mentor |
| C-04 | Fair Pay Engine | Salary transparency + benchmarking |
| C-05 | Life Chapter Designer | Career planning by life stage |
| C-06 | Your Own Track | Custom challenge |

### Employers (6)

| # | Module | Core Idea |
|---|---|---|
| E-01 | Smart Talent Matching | Beyond keyword matching |
| E-02 | Talent Retention Signals | Predict who might leave |
| E-03 | Talent Re-Engagement | Re-activate past candidates |
| E-04 | Onboarding Success Predictor | Predict new hire success |
| E-05 | Workforce Resilience Planner | Scenario planning for talent |
| E-06 | Your Own Track | Custom challenge |

### Universities (6)

| # | Module | Core Idea |
|---|---|---|
| U-01 | Lifelong Outcome Loop | Track alumni career outcomes |
| U-02 | Future-State Curriculum Engine | Align curriculum to market needs |
| U-03 | Adaptive Readiness Profile | Student career readiness scoring |
| U-04 | Live Internship Marketplace | Real-time internship matching |
| U-05 | Lifelong Learning Wallet | Portable learning credentials |
| U-06 | Your Own Track | Custom challenge |

---


*

*Built for: Talentbank Tech Hackathon | Feature Design Plan | Author: Hafzan*