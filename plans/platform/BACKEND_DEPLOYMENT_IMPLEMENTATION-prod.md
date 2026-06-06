# Implementation Plan: Production Backend & Deployment

> Replaces the current Vite dev proxy (`vite.config.js` plugin) which only works in local development and cannot be deployed. Consolidates requirements from all `-prod.md` plans.

---

## Current State (Prototype)

```
Frontend (React/Vite)
    │
    └── Vite dev plugin (/api/extract-profile, /api/grade-assessment)
            │
            └── DeepSeek API (direct HTTPS call from Node.js plugin)
```

**Problems with this:**
- Vite plugin only runs during `vite dev` — it is stripped on `vite build`
- `DEEPSEEK_API_KEY` is exposed in `vite.config.js` — readable by anyone with repo access
- No auth middleware possible
- No database connection possible
- Cannot be deployed to Cloudflare Pages (static hosting only)

---

## Production Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│                React + Vite (Cloudflare Pages)                  │
└────────────────────────────┬────────────────────────────────────┘
                             │  HTTPS + JWT in Authorization header
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND API                                  │
│              FastAPI (Cloudflare Workers or Railway)             │
│                                                                  │
│  /api/extract-profile     → DeepSeek API                        │
│  /api/grade-assessment    → DeepSeek API                        │
│  /api/jobs                → Supabase DB                         │
│  /api/applications        → Supabase DB                         │
│  /api/trajectory-*        → Supabase DB + DeepSeek API          │
│  /api/coach/*             → Supabase DB + DeepSeek API          │
│  /api/skill-gap           → Supabase DB (no AI)                 │
│  /api/job-fit             → Supabase DB (no AI)                 │
└────────────────────────────┬────────────────────────────────────┘
                             │  Supabase connection string (SSL)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      SUPABASE                                    │
│          PostgreSQL + pgvector + Auth + RLS                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Backend Stack

**FastAPI (Python)** — same stack referenced in `plan.md`

| Reason | Detail |
|---|---|
| Async native | All DeepSeek and DB calls are I/O bound — async is essential |
| Type safety | Pydantic v2 models validate all request/response shapes |
| Supabase Python client | First-class support, JWT verification built-in |
| Matches plan.md spec | FastAPI + SQLAlchemy + Pydantic already chosen |

---

## Deployment Platform

**Railway** — recommended over Cloudflare Workers for this project.

| Consideration | Railway | Cloudflare Workers |
|---|---|---|
| FastAPI support | ✅ Full Python support | ❌ No Python — Workers run JS/WASM only |
| Deployment simplicity | Push to GitHub → auto-deploy | Requires Worker rewrite in JS |
| Cost | Free tier: $5 credit/month | Free tier: 100k req/day |
| Cold starts | None (always-on container) | ~50ms cold starts on free tier |
| Environment variables | Dashboard + auto-injected | Wrangler secrets |
| Supabase connection | Standard TCP connection string | Requires Supabase REST API (no direct TCP) |

> **If Workers are required** (e.g. Cloudflare Pages constraint): use Supabase Edge Functions (Deno runtime) instead of FastAPI. Same logic, different runtime. All API routes become Edge Functions deployed alongside the Supabase project.

---

## Project Structure

```
careesOS/
├── frontend/                    ← current prototypeV2 becomes this
│   ├── src/
│   ├── package.json
│   └── vite.config.js           ← remove deepseekPlugin(), keep only Vite config
│
└── backend/
    ├── main.py                  ← FastAPI app entry point
    ├── routers/
    │   ├── jobs.py
    │   ├── applications.py
    │   ├── profile.py           ← extract-profile, grade-assessment
    │   ├── trajectory.py
    │   ├── coach.py
    │   ├── scoring.py           ← skill-gap, job-fit
    │   ├── notifications.py     ← GET/PATCH notification endpoints
    │   └── resume.py            ← upload, extract, parse
    ├── middleware/
    │   └── auth.py              ← JWT verification, role guards
    ├── services/
    │   ├── deepseek.py          ← all DeepSeek API calls
    │   ├── embeddings.py        ← generate_embedding()
    │   └── scoring.py           ← composite score, skill gap, context fit
    ├── models/
    │   └── schemas.py           ← Pydantic request/response models
    ├── .env                     ← never commit — see env vars section
    ├── requirements.txt
    └── railway.toml             ← Railway deployment config
```

---

## Secure DB Connection

### Connection string format

```
postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
```

**Three connection modes in Supabase:**

| Mode | Use case | Port |
|---|---|---|
| Direct connection | Backend server (Railway) — persistent connections | 5432 |
| PgBouncer (transaction mode) | Serverless/Edge Functions — short-lived connections | 6543 |
| Supabase REST API | Browser/client — no direct DB access needed | 443 (HTTPS) |

**For FastAPI on Railway: use direct connection on port 5432 with PgBouncer disabled** — Railway containers are long-lived, not serverless.

### SQLAlchemy connection (backend)

```python
# database.py

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os

DATABASE_URL = os.environ["SUPABASE_DB_URL"]
# Format: postgresql+asyncpg://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres

engine = create_async_engine(
    DATABASE_URL,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,      # verify connection before using from pool
    connect_args={
        "ssl": "require",    # always TLS — Supabase enforces this
        "server_settings": {
            "application_name": "careeros-backend"
        }
    }
)

AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
```

### Why `ssl="require"` is critical
All traffic between Railway and Supabase goes over public internet. Without TLS, the connection string and all query data are transmitted in plaintext. Supabase rejects non-SSL connections by default, but explicitly requiring it in the app prevents misconfiguration.

---

## Environment Variables

**Backend `.env` (Railway dashboard → Variables, never in repo):**

```env
# Supabase
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_SERVICE_KEY=[service_role_key]        # backend only — full DB access, bypass RLS
SUPABASE_DB_URL=postgresql+asyncpg://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres

# DeepSeek
DEEPSEEK_API_KEY=[key]

# App
ENVIRONMENT=production
ALLOWED_ORIGINS=https://careeros.pages.dev,https://careeros.com
```

**Frontend `.env` (Cloudflare Pages → Environment variables):**

```env
VITE_SUPABASE_URL=https://[PROJECT_REF].supabase.co
VITE_SUPABASE_ANON_KEY=[anon_key]              # public-safe — only anon access, RLS enforced
VITE_API_URL=https://careeros-backend.railway.app
```

### Key distinction

| Key | Used by | Access level |
|---|---|---|
| `SUPABASE_SERVICE_KEY` | Backend only | Bypasses RLS — full DB access — **never expose to frontend** |
| `SUPABASE_ANON_KEY` | Frontend only | Subject to RLS — safe to expose — only public/authenticated data |
| `DEEPSEEK_API_KEY` | Backend only | API billing key — **never expose to frontend** |

---

## CORS Configuration

Frontend (Cloudflare Pages) is on a different origin from backend (Railway). CORS must be explicitly configured:

```python
# main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=os.environ["ALLOWED_ORIGINS"].split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

**Never use `allow_origins=["*"]` in production** — this allows any website to make authenticated requests using the user's session.

---

## API Endpoints (full surface)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| **Jobs** | | | |
| `GET` | `/api/jobs` | Public | List active job postings |
| `POST` | `/api/jobs` | Reviewer | Create job posting (generates embedding) |
| `GET` | `/api/jobs/:id` | Public | Get single job |
| `PUT` | `/api/jobs/:id` | Reviewer (owner) | Update job posting (re-generates embedding) |
| `DELETE` | `/api/jobs/:id` | Reviewer (owner) | Soft-delete: set `is_active = false` |
| `GET` | `/api/jobs/:id/analytics` | Reviewer (owner) | Funnel, score distribution, avg scores |
| **Applications** | | | |
| `POST` | `/api/applications` | Applicant | Submit application |
| `GET` | `/api/applications` | Reviewer | List applications for own jobs |
| `GET` | `/api/applications/:id` | Reviewer/Owner | Get single application |
| `PATCH` | `/api/applications/:id/status` | Applicant | Update step status (started → submitted) |
| **Applicant — AI & Scoring** | | | |
| `POST` | `/api/extract-profile` | Applicant | DeepSeek profile extraction (dynamic questions) |
| `POST` | `/api/grade-assessment` | Applicant | DeepSeek work sample grading |
| `GET` | `/api/job-fit?job_id=` | Applicant | Pre-application fit score |
| **Reviewer Actions** | | | |
| `POST` | `/api/reviewer-actions` | Reviewer | Create shortlist/reject decision |
| `PATCH` | `/api/reviewer-actions/:id` | Reviewer | Update stage (Kanban move) |
| `POST` | `/api/reviewer-actions/:id/notes` | Reviewer | Add interview notes + AI match signal |
| **Dashboard** | | | |
| `GET` | `/api/dashboard/stats` | Reviewer | KPI strip: active roles, applicants, avg score |
| **Applicant Profile** | | | |
| `GET` | `/api/profile` | Applicant | Get own career profile |
| `PUT` | `/api/profile` | Applicant | Update own career profile |
| **Trajectory & Coach** | | | |
| `GET` | `/api/trajectory-suggestions` | Applicant | DeepSeek node ranking |
| `GET` | `/api/skill-gap?node_id=` | Applicant | Skill gap radar data |
| `POST` | `/api/coach/message` | Applicant | Send AI coach message |
| `GET` | `/api/coach/history?node_id=` | Applicant | Get conversation history |
| **Applicant Notifications** | | | |
| `GET` | `/api/notifications` | Applicant | List latest 20 notifications |
| `PATCH` | `/api/notifications/read-all` | Applicant | Mark all as read |
| `PATCH` | `/api/notifications/:id/read` | Applicant | Mark single as read |
| **Reviewer Notifications** | | | |
| `GET` | `/api/reviewer-notifications` | Reviewer | List latest 20 reviewer notifications |
| `PATCH` | `/api/reviewer-notifications/read-all` | Reviewer | Mark all as read |
| `PATCH` | `/api/reviewer-notifications/:id/read` | Reviewer | Mark single as read |
| **Resume** | | | |
| `POST` | `/api/resume/upload` | Applicant | Upload file, extract text, parse via DeepSeek, return parsed profile (not auto-saved) |
| **Layer 3** | | | |
| `POST` | `/api/outcomes` | Reviewer | Log 90-day performance rating |

---

## Frontend API Changes

Replace all Vite proxy calls with calls to the Railway backend URL:

```js
// Before (dev only — Vite proxy)
fetch('/api/extract-profile', { method: 'POST', body: ... })

// After (works in prod)
fetch(`${import.meta.env.VITE_API_URL}/api/extract-profile`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabase.auth.getSession().access_token}`
  },
  body: ...
})
```

Create a shared `api.js` helper to avoid repeating the auth header on every call:

```js
// lib/api.js
import { supabase } from './supabase'

export async function apiCall(path, options = {}) {
  const { data: { session } } = await supabase.auth.getSession()
  return fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session?.access_token}`,
      ...options.headers
    }
  })
}
```

---

## Deployment Pipeline

```
Developer pushes to GitHub (main branch)
        │
        ├──→ Cloudflare Pages (frontend)
        │       └── vite build → deploy static files
        │           ~30 seconds
        │
        └──→ Railway (backend)
                └── pip install -r requirements.txt → uvicorn main:app
                    ~60 seconds
```

### `railway.toml`

```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2"
healthcheckPath = "/health"
healthcheckTimeout = 30
restartPolicyType = "ON_FAILURE"
```

### Health check endpoint

```python
@app.get("/health")
async def health():
    return { "status": "ok" }
```

---

## Removing the Vite Plugin

Once backend is live, remove `deepseekPlugin()` from `vite.config.js`:

```js
// Before
plugins: [react(), tailwindcss(), deepseekPlugin()]

// After
plugins: [react(), tailwindcss()]
```

The `httpsPost` function and the entire `deepseekPlugin()` block can be deleted. All API logic moves to the FastAPI backend.

---

## Build Order

```
1.  Create Railway account → new project → connect GitHub repo     ← 15 minutes
2.  Create backend/ folder structure                               ← 30 minutes
3.  Install dependencies: fastapi, uvicorn, sqlalchemy[asyncio],
    asyncpg, supabase, httpx, pydantic, python-dotenv             ← 10 minutes
4.  Build database.py (SQLAlchemy + SSL connection)                ← 1 hour
5.  Build auth.py middleware (JWT verify + role guard)             ← 1 hour (from AUTH plan)
6.  Migrate /api/extract-profile from vite.config.js to FastAPI   ← 1 hour
7.  Migrate /api/grade-assessment from vite.config.js to FastAPI  ← 1 hour
8.  Build remaining API routes (jobs, applications, profile)       ← 1 day
9.  Set env vars in Railway dashboard                              ← 15 minutes
10. Set env vars in Cloudflare Pages dashboard                     ← 15 minutes
11. Update frontend fetch calls to use VITE_API_URL + auth header  ← 2 hours
12. Delete deepseekPlugin() from vite.config.js                   ← 10 minutes
13. Deploy both — verify /health endpoint responds                 ← 30 minutes
14. Test auth flow end-to-end (register → apply → dashboard)      ← 1 hour
```

---

## Effort Estimate

| Task | Effort |
|---|---|
| Backend project setup + DB connection | 2 hours |
| Auth middleware (from AUTH plan) | 2 hours |
| Migrate existing 2 API endpoints | 2 hours |
| Build remaining 12 API routes | 1.5 days |
| Frontend fetch migration + api.js helper | 2 hours |
| Deployment config + env vars | 1 hour |
| End-to-end testing | 2 hours |
| **Total** | **~3 days** |
