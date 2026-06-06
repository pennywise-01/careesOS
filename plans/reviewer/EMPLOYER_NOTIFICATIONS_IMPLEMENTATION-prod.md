# Implementation Plan: Employer Notifications

> Reviewers receive signal-based notifications for new applications — not per-application real-time pings.  
> **Dependencies:** Auth, DB, Backend deployment plans complete. Resend + Supabase Edge Functions for email.

---

## Why Not Real-Time Per-Application Emails

A job post receiving 30 applications in a day generates 30 pings. Reviewers learn to ignore or disable them. The right model is **signal-based notifications** — only notify when something is genuinely actionable.

### Notification Strategy

| Type | Delivery | Trigger | Default |
|---|---|---|---|
| **Dashboard badge** | In-app counter | Any new unreviewed application | Always on |
| **First application alert** | Email + in-app | First application submitted for a job post | On |
| **Daily digest** | Email | End of day if new applications received | On |
| **High-score alert** | Email + in-app | Applicant composite score ≥ threshold | Configurable per job |

No per-application real-time email. The dashboard badge handles awareness; email is reserved for meaningful signals.

---

### 1.1 Dashboard Badge (Unread Applications)

No new table needed. Count applications with no corresponding `reviewer_actions` row:

```sql
-- Unread = no reviewer action taken yet
SELECT COUNT(a.id) AS unread_count
FROM applications a
LEFT JOIN reviewer_actions ra ON ra.application_id = a.id AND ra.reviewer_id = :reviewer_id
JOIN jobs j ON j.id = a.job_id AND j.created_by = :reviewer_id
WHERE ra.id IS NULL;
```

This feeds the existing `GET /api/dashboard/stats` response — add `unread_applications` to the response body.

```json
{
  "active_jobs": 3,
  "total_applications": 47,
  "unread_applications": 12,
  "avg_composite_score": 0.71,
  ...
}
```

Frontend shows this as a badge on the dashboard nav icon:

```jsx
{stats.unread_applications > 0 && (
  <span className="badge">{stats.unread_applications}</span>
)}
```

---

### 1.2 First Application Alert

Triggered once when the first application is submitted for a job. Backend checks count before inserting:

```python
# After saving application to DB

existing_count = await db.scalar(
    select(func.count()).where(Application.job_id == job_id)
)

if existing_count == 1:  # this was the first one
    await send_reviewer_notification(
        reviewer_id=job.created_by,
        job_id=job_id,
        type="first_application",
        title=f"First application received for {job.title}",
        body=f"Your job post is live and receiving applications. Log in to review candidates."
    )
```

---

### 1.3 Daily Digest Email

A Supabase Edge Function runs on a cron schedule (23:00 local time). For each reviewer with new unreviewed applications that day:

```js
// Supabase Edge Function: daily-digest (cron: "0 23 * * *")

const { data: reviewers } = await supabase.rpc('get_reviewers_with_new_applications_today')

for (const reviewer of reviewers) {
  await resend.emails.send({
    from: 'careers@careeros.com',
    to: reviewer.email,
    subject: `${reviewer.new_count} new application${reviewer.new_count > 1 ? 's' : ''} today`,
    text: reviewer.digest_lines.join('\n')
    // e.g.:
    // Senior Engineer: 8 new applications (avg score: 0.74, highest: 0.91)
    // Product Manager: 3 new applications (avg score: 0.68, highest: 0.79)
  })
}
```

---

### 1.4 High-Score Alert

Reviewer sets a score threshold per job when creating/editing it. Default: no threshold (off).

When an application is submitted and its composite score exceeds the threshold:

```python
if job.alert_score_threshold and composite_score >= job.alert_score_threshold:
    await send_reviewer_notification(
        reviewer_id=job.created_by,
        type="high_score_applicant",
        title=f"Strong applicant for {job.title}",
        body=f"A candidate scored {composite_score:.0%} — above your {job.alert_score_threshold:.0%} threshold. Review them now."
    )
```

---

### 1.5 Reviewer Notifications Table

Same pattern as applicant notifications — a shared `reviewer_notifications` table, or reuse `notifications` with `recipient_type`:

```sql
-- Option A: reuse notifications table, add recipient_type
ALTER TABLE notifications ADD COLUMN recipient_type TEXT DEFAULT 'applicant';
-- 'applicant' | 'reviewer'

-- Option B: separate table (cleaner separation)
CREATE TABLE reviewer_notifications (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id  UUID REFERENCES auth.users(id) NOT NULL,
  job_id       UUID REFERENCES jobs(id),
  type         TEXT NOT NULL,  -- first_application | high_score_applicant | daily_digest
  title        TEXT NOT NULL,
  body         TEXT,
  is_read      BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON reviewer_notifications(reviewer_id, created_at DESC);
CREATE INDEX ON reviewer_notifications(reviewer_id, is_read);
ALTER TABLE reviewer_notifications ENABLE ROW LEVEL SECURITY;
```

**Recommendation: Option B** — separate table. Reviewer notifications have different fields (no `application_id` on digest), different RLS policies, and different display logic from applicant notifications.

### DB change on `jobs` table

```sql
ALTER TABLE jobs ADD COLUMN alert_score_threshold FLOAT DEFAULT NULL;
-- NULL = disabled. 0.85 = alert when composite >= 0.85
ALTER TABLE jobs ADD COLUMN email_digest_enabled BOOLEAN DEFAULT true;
```

### Reviewer notification preferences on `auth.users` metadata

```json
{
  "role": "reviewer",
  "notification_prefs": {
    "first_application_email": true,
    "daily_digest_email": true,
    "high_score_email": true
  }
}
```

---

## Build Order

```
1. Add reviewer_notifications table + RLS                 ← 30 minutes
2. Add alert_score_threshold + email_digest_enabled to jobs ← migration, 10 minutes
3. Add unread_applications count to GET /api/dashboard/stats ← 30 minutes
4. Build send_reviewer_notification() helper              ← 1 hour
5. Hook into POST /api/applications → first_application trigger ← 30 minutes
6. Hook into composite score calculation → high_score trigger ← 30 minutes
7. Build daily digest Edge Function + cron schedule       ← 2 hours
8. Build reviewer notification bell in dashboard header   ← 1.5 hours
9. Add score threshold input to job creation form         ← 1 hour
```

---

## Effort Estimate

| Task | Effort |
|---|---|
| reviewer_notifications DB + RLS | 1 hour |
| Dashboard badge (unread count) | 1 hour |
| First application alert | 1 hour |
| Daily digest Edge Function + cron | 2 hours |
| High-score alert | 1 hour |
| Reviewer notification bell UI | 1.5 hours |
| **Total** | **~1 day** |

