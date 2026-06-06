# Implementation Plan: Auth & Identity

> **This is Phase 0 — everything else in the production roadmap is blocked until this is complete.**  
> The primary goal is not just login — it is **data isolation**: ensuring no user can ever read, modify, or influence another user's profile, applications, scores, or AI suggestions.

---

## Threat Model — What We Are Protecting Against

| Threat | Attack vector | Impact if unprotected |
|---|---|---|
| Unauthenticated access | Direct API call without token | Anyone reads any candidate's profile |
| Token forgery | Crafted JWT with different user_id | User A accesses User B's data |
| Horizontal privilege escalation | Authenticated user changes user_id in request | User reads another user's applications |
| Reviewer impersonation | Applicant calls reviewer-only endpoints | Applicant sees all candidates, changes scores |
| Replay attacks | Reuse of expired token | Access persists after logout |
| Insecure direct object reference (IDOR) | `/api/applications/123` without ownership check | Any authenticated user reads any application |

---

## Stack Decision

**Supabase Auth** — recommended for this project.

| Reason | Detail |
|---|---|
| Already using Supabase (pgvector plan) | Single platform, single billing, no extra vendor |
| Row Level Security (RLS) built-in | Database-level isolation — even a compromised backend cannot return another user's data |
| JWT issued and verified by Supabase | No custom token logic to get wrong |
| Supports email/password, magic link, OAuth | Flexible for both applicants and reviewers |
| Free tier covers 50,000 monthly active users | No cost concern at prototype/early scale |

---

## User Roles

Two distinct roles with separate access scopes:

| Role | Who | Access |
|---|---|---|
| `applicant` | Job seekers | Own profile, own applications, job listings, job fit scores |
| `reviewer` | Hiring managers | All applications for their company's jobs, job posting CRUD, reviewer dashboard |

Role is stored in Supabase's `auth.users` metadata field:
```json
{ "role": "applicant" }
{ "role": "reviewer" }
```

---

## Database: Row Level Security (RLS)

This is the **most critical protection**. RLS is enforced at the PostgreSQL level — even if backend code has a bug and does not filter by user_id, the database refuses to return another user's rows.

### Enable RLS on all sensitive tables

```sql
ALTER TABLE career_profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications         ENABLE ROW LEVEL SECURITY;
ALTER TABLE coach_conversations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviewer_actions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE hiring_outcomes      ENABLE ROW LEVEL SECURITY;
```

### RLS Policies

#### `career_profiles` — applicant owns their own profile

```sql
-- Read own profile only
CREATE POLICY "applicant_read_own_profile"
ON career_profiles FOR SELECT
USING (auth.uid() = user_id);

-- Update own profile only
CREATE POLICY "applicant_update_own_profile"
ON career_profiles FOR UPDATE
USING (auth.uid() = user_id);

-- Insert own profile only
CREATE POLICY "applicant_insert_own_profile"
ON career_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### `applications` — applicant owns theirs, reviewer reads all for their jobs

```sql
-- Applicant reads only their own applications
CREATE POLICY "applicant_read_own_applications"
ON applications FOR SELECT
USING (auth.uid() = user_id);

-- Reviewer reads all applications for jobs they own
CREATE POLICY "reviewer_read_applications"
ON applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM jobs
    WHERE jobs.id = applications.job_id
    AND jobs.created_by = auth.uid()
  )
);

-- Only applicant can insert their own application
CREATE POLICY "applicant_insert_application"
ON applications FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### `coach_conversations` — strictly user-owned

```sql
CREATE POLICY "user_read_own_conversations"
ON coach_conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "user_insert_own_conversations"
ON coach_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

#### `jobs` — public read, reviewer-only write

```sql
-- Anyone (including unauthenticated) can read active job listings
CREATE POLICY "public_read_active_jobs"
ON jobs FOR SELECT
USING (is_active = true);

-- Only reviewers can create jobs
CREATE POLICY "reviewer_insert_jobs"
ON jobs FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'reviewer'
);

-- Reviewer can only update/delete their own jobs
CREATE POLICY "reviewer_manage_own_jobs"
ON jobs FOR UPDATE
USING (created_by = auth.uid());
```

---

## Backend JWT Verification

Every protected endpoint must verify the JWT before doing anything else. In FastAPI:

```python
# middleware/auth.py

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client

supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
bearer = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(bearer)):
    token = credentials.credentials
    try:
        user = supabase.auth.get_user(token)
        if not user or not user.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user.user
    except Exception:
        raise HTTPException(status_code=401, detail="Token verification failed")

async def require_reviewer(user = Depends(get_current_user)):
    role = user.user_metadata.get("role")
    if role != "reviewer":
        raise HTTPException(status_code=403, detail="Reviewer access required")
    return user
```

### Applied to endpoints

```python
# Applicant-only endpoints
@router.get("/api/profile")
async def get_profile(user = Depends(get_current_user)):
    # RLS guarantees this only returns the caller's profile
    return db.query(CareerProfile).filter_by(user_id=user.id).first()

# Reviewer-only endpoints
@router.get("/api/dashboard/applications")
async def get_applications(user = Depends(require_reviewer)):
    # RLS guarantees this only returns applications for reviewer's jobs
    return db.query(Application).all()

# Public endpoint (no auth required)
@router.get("/api/jobs")
async def list_jobs():
    return db.query(Job).filter_by(is_active=True).all()
```

---

## IDOR Prevention

Every query that takes a resource ID in the URL must verify ownership — **never trust the ID alone**.

```python
# WRONG — IDOR vulnerability
@router.get("/api/applications/{app_id}")
async def get_application(app_id: str, user = Depends(get_current_user)):
    return db.query(Application).filter_by(id=app_id).first()
    # Any authenticated user can read any application by guessing the ID

# CORRECT — ownership verified
@router.get("/api/applications/{app_id}")
async def get_application(app_id: str, user = Depends(get_current_user)):
    app = db.query(Application).filter_by(id=app_id, user_id=user.id).first()
    # RLS also enforces this at DB level — double protection
    if not app:
        raise HTTPException(status_code=404)  # Return 404, not 403 — don't confirm existence
    return app
```

> Return `404` not `403` when a resource exists but the user doesn't own it. A `403` tells the attacker the resource exists; a `404` reveals nothing.

---

## Auth Flow — Applicant

```
1. Applicant visits /register
2. Enters email + password
3. Supabase creates auth.users record with role: "applicant"
4. Confirmation email sent (Supabase handles this)
5. Applicant confirms email → account active
6. Applicant logs in → Supabase returns JWT (access_token + refresh_token)
7. Frontend stores tokens (Supabase JS client handles storage securely)
8. All API requests include: Authorization: Bearer <access_token>
9. Access token expires in 1 hour → refresh_token used to get a new one silently
10. Logout → tokens revoked on Supabase side
```

---

## Auth Flow — Reviewer

```
1. Reviewer account created by admin (not self-register — prevents applicants claiming reviewer role)
2. Admin calls Supabase Admin API to create user with role: "reviewer"
3. Reviewer receives invite email with one-time login link
4. Reviewer sets password → account active
5. Same JWT flow as applicant from step 6
```

> **Why reviewers cannot self-register:** If self-registration sets the role from a form field, any applicant can set `role: "reviewer"` on signup and access all candidates' data.

---

## Employer Portal Separation

### Architecture Decision: One Auth Table, Not Two

**Do not create separate login tables for applicants and employers.** One `auth.users` table with `role` in `user_metadata` is the correct approach.

| Approach | Verdict | Reason |
|---|---|---|
| Separate `applicant_users` + `reviewer_users` tables | ❌ Wrong | Double auth logic, double token management, double security surface. More complexity, no security benefit. |
| One `auth.users` table + `role` in `user_metadata` | ✅ Correct | Single JWT system, role enforced by middleware and frontend guards. Standard industry pattern. |

The separation is enforced by **which login page they use**, the **role check after login**, and **backend middleware** — not by separate databases.

---

### Landing Screen (Role Selection)

The entry point is a landing page at `/` where the user selects their role before going anywhere else. This prevents users from landing on the wrong portal by accident.

```
careeros.com/
        ↓
┌─────────────────────────────────────────────────┐
│              Welcome to Career OS               │
│                                                 │
│  ┌─────────────────────┐  ┌──────────────────┐  │
│  │    Job Seeker       │  │    Employer       │  │
│  │                     │  │                  │  │
│  │  Browse roles,      │  │  Post jobs,      │  │
│  │  get AI career      │  │  review ranked   │  │
│  │  coaching           │  │  candidates      │  │
│  │                     │  │                  │  │
│  │  [Get Started →]    │  │  [Post a Job →]  │  │
│  └─────────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────┘
```

- **Job Seeker card** → navigates to `/login` (or `/register` for new users)
- **Employer card** → navigates to `/employer/login`
  - If no account: shows "Don't have an employer account? Contact us." — employer accounts are invite-only, not self-serve

### URL Structure

| Path | Who | What |
|---|---|---|
| `/` | Everyone | Landing screen — choose role |
| `/login` | Applicants | Applicant login / register |
| `/apply/*` | Applicants (auth required) | Job browsing and application flow |
| `/employer/login` | Reviewers only | Employer login (invite-only) |
| `/employer/dashboard` | Reviewers (auth required) | Reviewer dashboard |
| `/employer/jobs/new` | Reviewers (auth required) | Create job posting |

### The Problem Being Solved
Without explicit portal-level enforcement, an applicant who knows the employer dashboard URL can attempt to log in at `/employer/login` using their applicant credentials. Even if the backend blocks their API calls, they should never reach the portal UI at all.

### Two Separate Login Pages

| Portal | URL | Accessible by |
|---|---|---|
| Applicant portal | `/login` | `role: applicant` only |
| Employer portal | `/employer/login` | `role: reviewer` only |

These are two distinct login forms — not the same form with a toggle.

### How it works

```
Applicant visits /employer/login
        ↓
Enters valid applicant credentials
        ↓
Supabase Auth succeeds → issues JWT
        ↓
Frontend checks JWT role BEFORE redirecting:
  user.user_metadata.role === "applicant"  ← not "reviewer"
        ↓
Immediately calls supabase.auth.signOut()
        ↓
Redirects to /employer/login with error:
  "This portal is for employers only. Applicants sign in at /login"
        ↓
No employer UI is ever rendered
```

### Frontend: Employer Login Page

```jsx
// pages/EmployerLogin.jsx

async function handleEmployerLogin(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    setErrorMessage('Invalid credentials.')
    return
  }

  const role = data.user?.user_metadata?.role

  if (role !== 'reviewer') {
    // Valid credentials but wrong role — sign them out immediately
    await supabase.auth.signOut()
    setErrorMessage('This portal is for employers only. Applicants sign in at /login')
    return
  }

  // Role confirmed as reviewer — proceed to dashboard
  navigate('/employer/dashboard')
}
```

### Backend: Portal Guard Middleware

Every employer portal endpoint uses `require_reviewer()`. If an applicant's JWT somehow reaches the backend (e.g. via direct API call), it is rejected:

```python
async def require_reviewer(user = Depends(get_current_user)):
    role = user.user_metadata.get('role')
    if role != 'reviewer':
        # Do not reveal that the endpoint exists for other roles
        raise HTTPException(status_code=404)
    return user
```

> Return `404` not `403` on wrong-role access to employer endpoints — a `403` tells the applicant the endpoint exists and they are blocked; a `404` reveals nothing.

### Route Guard

```jsx
// Employer portal routes
<Route path="/employer/login" element={<EmployerLogin />} />

<Route path="/employer/*" element={
  <ProtectedRoute requiredRole="reviewer" loginPath="/employer/login">
    <EmployerLayout />
  </ProtectedRoute>
} />

// Applicant routes
<Route path="/login" element={<ApplicantLogin />} />

<Route path="/apply/*" element={
  <ProtectedRoute requiredRole="applicant" loginPath="/login">
    <UserJourney />
  </ProtectedRoute>
} />
```

The `ProtectedRoute` component is extended with a `loginPath` prop so each portal redirects to the correct login page on session expiry.

### Updated ProtectedRoute

```jsx
export function ProtectedRoute({ children, requiredRole, loginPath = '/login' }) {
  const [user, setUser] = useState(undefined)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  if (user === undefined) return <LoadingScreen />
  if (!user) return <Navigate to={loginPath} />

  const role = user.user_metadata?.role
  if (requiredRole && role !== requiredRole) {
    // Wrong role trying to access wrong portal — sign out and redirect
    supabase.auth.signOut()
    return <Navigate to={loginPath} state={{ error: 'Wrong portal' }} />
  }

  return children
}
```

### What This Prevents

| Scenario | Outcome |
|---|---|
| Applicant navigates directly to `/employer/dashboard` | Redirected to `/employer/login` |
| Applicant enters valid credentials on employer login | Signed out immediately, error message shown |
| Applicant sends request to `/api/dashboard/stats` with their JWT | Backend returns `404` |
| Applicant guesses a reviewer endpoint and calls it | Backend returns `404` |
| Reviewer navigates to `/apply` | Redirected to `/employer/login` |
| Session expires mid-session in employer portal | Redirected to `/employer/login` (not `/login`) |

---

## Token Security Rules

| Rule | Implementation |
|---|---|
| Never store JWT in localStorage | Supabase JS client uses `httpOnly` cookies in production mode |
| Short access token lifetime | 1 hour (Supabase default) |
| Refresh tokens are single-use | Supabase rotates refresh tokens on each use |
| Logout revokes server-side | Call `supabase.auth.signOut()` — invalidates token in Supabase's revocation list |
| HTTPS only | Enforce in Cloudflare Pages / deployment config — reject HTTP |

---

## Frontend Auth Guards

```jsx
// components/ProtectedRoute.jsx
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Navigate } from 'react-router-dom'

export function ProtectedRoute({ children, requiredRole }) {
  const [user, setUser] = useState(undefined)  // undefined = loading

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  if (user === undefined) return <div>Loading...</div>
  if (!user) return <Navigate to="/login" />
  if (requiredRole && user.user_metadata?.role !== requiredRole) {
    return <Navigate to="/unauthorized" />
  }
  return children
}

// Usage in router
<Route path="/reviewer" element={
  <ProtectedRoute requiredRole="reviewer">
    <Dashboard />
  </ProtectedRoute>
} />

<Route path="/apply" element={
  <ProtectedRoute requiredRole="applicant">
    <UserJourney />
  </ProtectedRoute>
} />
```

---

## Build Order

```
1. Create Supabase project                          ← 10 minutes
2. Enable email auth in Supabase dashboard          ← 5 minutes
3. Enable RLS on all sensitive tables               ← 30 minutes
4. Write all RLS policies                           ← 2 hours
5. Build get_current_user() middleware (FastAPI)    ← 1 hour
6. Build require_reviewer() middleware              ← 30 minutes
7. Apply auth middleware to all protected endpoints ← 2 hours
8. Add IDOR ownership checks to all resource routes ← 1 hour
9. Build /register + /login UI (applicant)          ← 1 day
10. Build reviewer invite flow (admin creates)      ← 2 hours
11. Build ProtectedRoute component                  ← 1 hour
12. Add auth guards to all routes                   ← 1 hour
13. Test cross-user access (attempt IDOR manually)  ← 1 hour
```

---

## Verification Checklist Before Launch

**Cross-user isolation:**
- [ ] Applicant cannot access `/api/applications/{id}` for another applicant's application
- [ ] Applicant cannot access any `/api/reviewer-*` or `/api/dashboard/*` endpoint
- [ ] Reviewer cannot access another reviewer's job postings or their applicants
- [ ] All DeepSeek calls use `user_id` from verified JWT — never from request body

**Portal separation:**
- [ ] Applicant credentials rejected at `/employer/login` — sign-out triggered immediately
- [ ] Applicant JWT returns `404` on all employer API endpoints (not `403`)
- [ ] Reviewer session expiry in employer portal redirects to `/employer/login` (not `/login`)
- [ ] Applicant cannot register with `role: reviewer` via any API call
- [ ] Reviewer invite-only flow — no self-registration endpoint exists for reviewer role

**Token security:**
- [ ] Unauthenticated request to any protected endpoint returns `401`
- [ ] Expired token returns `401`
- [ ] Logout invalidates token server-side (cannot be reused after `signOut()`)
- [ ] HTTPS enforced — HTTP requests rejected at CDN level

---

## Effort Estimate

| Task | Effort |
|---|---|
| Supabase setup + RLS policies | 3 hours |
| Backend auth middleware | 2 hours |
| IDOR checks on all endpoints | 2 hours |
| Login/register UI (applicant) | 1 day |
| Employer login page with role check + sign-out on wrong role | 2 hours |
| Reviewer invite flow (admin creates via Supabase Admin API) | 2 hours |
| ProtectedRoute with loginPath prop | 1 hour |
| Frontend route guards (separate applicant + employer routes) | 1 hour |
| Backend `require_reviewer()` returns 404 on wrong role | 30 minutes |
| Security verification testing (attempt cross-portal access) | 2 hours |
| **Total** | **~3 days** |
