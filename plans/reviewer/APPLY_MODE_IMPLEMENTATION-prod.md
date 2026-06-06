# Implementation Plan: Dual Application Mode

> When creating a job post, employers choose how candidates apply — via the Career OS platform form, an external ATS link, or both.  
> **Dependencies:** Auth, DB, Backend deployment plans complete. Job posting form must exist.

---

## Modes

| Mode | Behaviour |
|---|---|
| `platform` | Current flow — open-ended questions + work sample assessment, AI scored |
| `external` | "Apply" button opens the company's ATS link (Workday, Greenhouse, Lever, etc.) in a new tab. No platform form. **Application not tracked or scored in Career OS.** |
| `both` | Applicant sees two options on the job detail page — they choose their path |

### Why `both` matters

Employers who already use an ATS don't want to abandon it, but want the AI scoring layer as an option. `both` lets them offer it without forcing applicants onto the platform.

---

## ⚠️ External Link Warning — No AI Scoring

**Applicants who apply via the external link will not receive an AI match score, will not appear in the Career OS candidate pipeline, and will not be tracked in the platform.**

This must be communicated clearly in three places:

### 1. To the employer — on the job creation form

```
⚠️  Note: Applications submitted via external link will not be tracked,
    ranked, or scored by Career OS. You will need to review those candidates
    directly in your ATS.
```

Shown inline beneath the external URL field when `external` or `both` is selected.

### 2. To the applicant — on the job detail page (external mode)

```
ℹ️  This employer is accepting applications through their own website.
    Applying externally means your Career OS match score and AI assessment
    will not be included with your application.
```

Shown above the external apply button.

### 3. To the applicant — on the `both` mode picker

```
┌────────────────────────────────┐  ┌──────────────────────────────┐
│   Apply via Career OS          │  │   Apply on company website   │
│                                │  │                              │
│   ✅ AI match score included   │  │   ⚠️ No AI score included    │
│   ✅ Tracked in pipeline       │  │   ⚠️ Not tracked in Career OS│
│   ✅ Career insights unlocked  │  │   Opens external site ↗      │
│                                │  │                              │
│   [Start Application →]        │  │   [Visit company site ↗]     │
└────────────────────────────────┘  └──────────────────────────────┘
```

The platform path is clearly the value-add option. The warning on the external card is honest — not designed to block the applicant, just to set expectations.

---

## Database

```sql
ALTER TABLE jobs ADD COLUMN application_mode   TEXT NOT NULL DEFAULT 'platform';
-- 'platform' | 'external' | 'both'

ALTER TABLE jobs ADD COLUMN external_apply_url TEXT DEFAULT NULL;
-- Required when application_mode is 'external' or 'both'
```

**Source:** `platform/DATABASE_IMPLEMENTATION-prod.md` — already added to `jobs` table.

---

## Backend

### Validation on job create/update

```python
class JobCreate(BaseModel):
    title: str
    # ... other fields
    application_mode: Literal["platform", "external", "both"] = "platform"
    external_apply_url: Optional[HttpUrl] = None

    @validator("external_apply_url")
    def validate_external_url(cls, v, values):
        if values.get("application_mode") in ("external", "both") and not v:
            raise ValueError("external_apply_url is required when application_mode is external or both")
        return v
```

### Response includes mode fields

`GET /api/jobs` and `GET /api/jobs/:id` always return `application_mode` and `external_apply_url` so the frontend can render the correct UI without additional calls.

---

## Job Posting Form (Employer Side)

```
How should candidates apply?
  ● Via Career OS platform   (AI-scored — open-ended + work sample)
  ○ External link            (redirect to your ATS)
  ○ Both options             (candidate chooses)

[Shown only when external or both is selected]
┌─────────────────────────────────────────────────────┐
│  External application URL                           │
│  [https://company.workday.com/jobs/12345          ] │
│  e.g. Workday, Greenhouse, Lever, or any apply URL  │
└─────────────────────────────────────────────────────┘

⚠️  Note: Applications submitted via external link will not be tracked,
    ranked, or scored by Career OS. You will need to review those
    candidates directly in your ATS.
```

---

## Job Detail Page (Applicant Side)

### `platform` mode — unchanged

```
[Apply for this role →]
```

### `external` mode

```
ℹ️  This employer is accepting applications through their own website.
    Applying externally means your Career OS match score and AI
    assessment will not be included with your application.

[Apply on company website ↗]
```

Button opens `external_apply_url` in a new tab. No platform form shown. No row created in `applications` table.

### `both` mode

```
┌────────────────────────────────┐  ┌──────────────────────────────┐
│   Apply via Career OS          │  │   Apply on company website   │
│                                │  │                              │
│   ✅ AI match score included   │  │   ⚠️ No AI score included    │
│   ✅ Tracked in pipeline       │  │   ⚠️ Not tracked in Career OS│
│   ✅ Career insights unlocked  │  │   Opens external site ↗      │
│                                │  │                              │
│   [Start Application →]        │  │   [Visit company site ↗]     │
└────────────────────────────────┘  └──────────────────────────────┘
```

---

## Job Fit Score (Pre-Application) — Still Shown for External/Both

Even in `external` and `both` modes, the pre-application fit score still displays on the job detail page if the applicant has a career profile. This requires no extra work — it uses the existing `GET /api/job-fit?job_id=` endpoint.

```
Your pre-match score:  ████████░░  74%
→ Apply via Career OS to include this score with your application
```

For `external` mode this acts as a conversion nudge — if the employer later enables `both`, applicants have already seen their score.

---

## Build Order

```
1. Add application_mode + external_apply_url to jobs migration  ← 10 minutes
2. Add validator to JobCreate Pydantic model                    ← 30 minutes
3. Update GET /api/jobs + /api/jobs/:id to return mode fields   ← 15 minutes
4. Add apply mode radio selector to job creation form           ← 1 hour
5. Add conditional external URL input field + inline warning    ← 30 minutes
6. Update job detail page — render per mode:
   a. platform: existing apply button (no change)              ← 0
   b. external: info banner + external apply button            ← 1 hour
   c. both: two-card picker with score/warning labels          ← 1.5 hours
7. Test all three modes end-to-end                             ← 1 hour
```

---

## Effort Estimate

| Task | Effort |
|---|---|
| DB migration + backend validator | 45 minutes |
| Job creation form — mode selector + warning | 1.5 hours |
| Job detail page — external mode UI | 1 hour |
| Job detail page — both mode picker UI | 1.5 hours |
| End-to-end testing | 1 hour |
| **Total** | **~6 hours** |

---

## Risks

| Risk | Mitigation |
|---|---|
| Employer sets `both` but external URL goes dead | URL validated at save time via `HttpUrl`. Consider a periodic link-check cron for production. |
| Applicant applies externally and also via platform | Duplicate detection handles platform duplicates. External applications are invisible to Career OS — employer manages them in their own ATS. |
| Employer expects external applicants in Career OS pipeline | Warning on job form and employer dashboard makes this explicit. |
