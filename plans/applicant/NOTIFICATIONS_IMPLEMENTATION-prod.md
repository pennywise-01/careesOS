# Implementation Plan: Job Status Notifications

> Applicants receive in-app and email notifications when an employer takes action on their application.  
> **Dependencies:** Auth, DB, Backend deployment plans complete. Supabase Realtime enabled on `notifications` table.

---

## What it does
Applicants receive notifications when an employer takes action on their application. Delivered via in-app notification bell + email.

### Notification types

| Event | Trigger | In-app | Email |
|---|---|---|---|
| Application received | Applicant submits | ✅ | ✅ (confirmation) |
| Application viewed | Reviewer opens candidate detail | ✅ | ❌ (too noisy) |
| Shortlisted | Reviewer clicks Shortlist | ✅ | ✅ |
| Rejected | Reviewer clicks Reject | ✅ | ✅ |
| Interview invitation | Reviewer moves to "interviewing" stage | ✅ | ✅ (with details) |

---

### 1.1 Database

```sql
CREATE TABLE notifications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) NOT NULL,  -- recipient (applicant)
  application_id  UUID REFERENCES applications(id),
  job_id          UUID REFERENCES jobs(id),
  type            TEXT NOT NULL,  -- received | viewed | shortlisted | rejected | interview_invited
  title           TEXT NOT NULL,  -- "Your application was shortlisted"
  body            TEXT,           -- "Congratulations! Acme Corp has shortlisted you for Senior Engineer."
  is_read         BOOLEAN DEFAULT false,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX ON notifications(user_id, created_at DESC);
CREATE INDEX ON notifications(user_id, is_read);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Applicant reads only their own notifications
CREATE POLICY "applicant_read_own_notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);

-- Only backend (service key) inserts notifications — no direct client insert
CREATE POLICY "service_insert_notifications"
ON notifications FOR INSERT
WITH CHECK (false);  -- blocked for all JWT users; backend uses service key
```

---

### 1.2 Notification Triggers (Backend)

Notifications are created server-side in response to reviewer actions. Never trust the client to create them.

#### On application submitted

```python
# routers/applications.py — POST /api/applications
async def create_notification(db, user_id, application_id, job_id, notif_type, title, body):
    notif = Notification(
        user_id=user_id,
        application_id=application_id,
        job_id=job_id,
        type=notif_type,
        title=title,
        body=body
    )
    db.add(notif)
    await db.commit()

# Called after application is saved:
await create_notification(
    db, applicant.id, app.id, app.job_id,
    "received",
    "Application submitted",
    f"Your application for {job.title} has been received. We'll keep you updated."
)
```

#### On reviewer action (shortlist / reject / interview)

```python
# routers/reviewer_actions.py — POST /api/reviewer-actions

NOTIFICATION_COPY = {
    "shortlisted": {
        "title": "You've been shortlisted 🎉",
        "body": "Great news! {company} has shortlisted your application for {job_title}. Stay tuned for next steps."
    },
    "rejected": {
        "title": "Application update",
        "body": "Thank you for applying to {job_title} at {company}. After careful review, they've decided to move forward with other candidates."
    },
    "interviewing": {
        "title": "Interview invitation 📅",
        "body": "{company} would like to invite you to interview for {job_title}. They will be in touch shortly with details."
    }
}

async def on_reviewer_action(action: str, application_id: str, reviewer_id: str, db):
    app = await db.get(Application, application_id)
    job = await db.get(Job, app.job_id)
    copy = NOTIFICATION_COPY.get(action)
    if copy:
        await create_notification(
            db, app.user_id, app.id, app.job_id,
            action,
            copy["title"],
            copy["body"].format(company="the employer", job_title=job.title)
        )
```

#### On application viewed (reviewer opens candidate detail)

```python
# GET /api/applications/:id  — when reviewer fetches a specific application
# Only trigger once (first view), not on every subsequent open

already_viewed = await db.query(Notification).filter_by(
    application_id=app_id, type="viewed"
).first()

if not already_viewed:
    await create_notification(
        db, app.user_id, app.id, app.job_id,
        "viewed",
        "Your application was viewed",
        f"Someone from the hiring team has reviewed your application for {job.title}."
    )
```

---

### 1.3 In-App Notification Bell

#### API

```
GET  /api/notifications          → list latest 20, sorted by created_at DESC
PATCH /api/notifications/read-all → mark all as read
PATCH /api/notifications/:id/read → mark single as read
```

#### Frontend component

```jsx
// components/NotificationBell.jsx

function NotificationBell() {
  const { data: notifications } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => apiCall('/api/notifications').then(r => r.json()),
    refetchInterval: 30_000   // poll every 30s as fallback
  })

  const unreadCount = notifications?.filter(n => !n.is_read).length ?? 0

  return (
    <div className="relative">
      <button onClick={toggleDropdown}>
        <BellIcon />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      {open && <NotificationDropdown notifications={notifications} />}
    </div>
  )
}
```

---

### 1.4 Real-Time Updates (Supabase Realtime)

Instead of polling, subscribe to the `notifications` table for the logged-in user. New rows appear instantly without page refresh.

```js
// hooks/useNotifications.js

useEffect(() => {
  const channel = supabase
    .channel('notifications')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'notifications',
      filter: `user_id=eq.${user.id}`
    }, (payload) => {
      // Add new notification to local state + show toast
      queryClient.invalidateQueries(['notifications'])
      toast(payload.new.title)
    })
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [user.id])
```

**Enable Supabase Realtime on the `notifications` table** in the Supabase dashboard (Tables → Realtime toggle).

---

### 1.5 Email Notifications

Use **Resend** (already in reviewer plan). Triggered from a Supabase Edge Function called by the backend after creating the notification row.

```python
# After inserting notification, call Edge Function
if notif_type in ("shortlisted", "rejected", "interviewing"):
    await send_email_notification(
        to=applicant.email,
        subject=copy["title"],
        body_text=copy["body"].format(...)
    )
```

```js
// Supabase Edge Function: send-notification-email
import { Resend } from 'resend'

const resend = new Resend(Deno.env.get('RESEND_API_KEY'))

Deno.serve(async (req) => {
  const { to, subject, body_text } = await req.json()
  await resend.emails.send({
    from: 'careers@careeros.com',
    to,
    subject,
    text: body_text
  })
  return new Response('ok')
})
```

**Why not send email directly from FastAPI:** Supabase Edge Functions are closer to Resend's infrastructure (both on the edge), reducing latency. Also isolates email logic from the core API.

---

### 1.6 Notification Preference (opt-out)

Add `email_notifications_enabled` to `career_profiles`:

```sql
ALTER TABLE career_profiles ADD COLUMN email_notifications_enabled BOOLEAN DEFAULT true;
```

Check this before sending email:

```python
if applicant_profile.email_notifications_enabled:
    await send_email_notification(...)
```

---

## Build Order

```
1. Create notifications table + RLS policies              ← 30 minutes
2. Enable Supabase Realtime on notifications table        ← 5 minutes (dashboard toggle)
3. Build create_notification() backend helper             ← 1 hour
4. Hook into POST /api/applications → "received" notif   ← 30 minutes
5. Hook into POST /api/reviewer-actions → shortlist/reject/invite ← 1 hour
6. Hook into GET /api/applications/:id → "viewed" (once) ← 30 minutes
7. Build GET/PATCH notification endpoints                 ← 1 hour
8. Build NotificationBell frontend component              ← 2 hours
9. Build useNotifications hook (Supabase Realtime)        ← 1 hour
10. Set up Resend + Edge Function for emails              ← 1 hour
11. Add email_notifications_enabled opt-out + check      ← 30 minutes
```

---

## Effort Estimate

| Task | Effort |
|---|---|
| Notifications DB + RLS | 1 hour |
| Backend triggers (submit, action, view) | 2 hours |
| GET/PATCH notification endpoints | 1 hour |
| NotificationBell + Realtime hook | 3 hours |
| Email via Resend + Edge Function | 1 hour |
| Email opt-out field | 30 minutes |
| **Total** | **~1 day** |

---

## Risks

| Risk | Mitigation |
|---|---|
| Realtime subscription not firing | Fall back to 30s polling via `refetchInterval` in React Query |
| "Viewed" notification fires multiple times | Check for existing `type="viewed"` row before inserting |
| Applicant email bounces | Resend returns bounce status — log it, don't retry silently |
