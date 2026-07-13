# Daily Command Center

The customer Daily Command Center is the authenticated workspace operating page for each CRM customer.

## Access

- Browser route: `/daily-command-center` or `#daily-command`
- API family: `/api/dashboard/*` and `/api/workspace/daily-goals`
- Auth: Supabase bearer session
- Tenant boundary: every route verifies the requested `workspaceId` against `workspace_members`

## What Is Live

When Supabase is configured, the backend reads tenant-scoped rows from:

- `leads`
- `tasks`
- `appointments`
- `activities`
- `communications`
- `notifications`
- `workspace_members`
- `workspace_daily_goals`

The API returns deterministic priorities, KPI cards, pipeline health, today’s work, activity, alerts, explicit daily-goal progress, and role-aware team performance.

## Role Behavior

- Owners/Admins: can read the command center, view team performance, and update daily goals.
- Managers: can read the command center and view team performance.
- Members: can read their daily command center and receive personal goal progress where an actor field exists. Team performance remains locked.

## Daily Goal Registry

Supported goal keys are:

- `calls`: call logs plus call activities.
- `contacts_reached`: successful outgoing non-demo communications.
- `follow_ups_completed`: completed tasks or follow-up activities.
- `appointments_booked`: appointments created/booked in the workspace day.
- `new_leads`: leads created in the workspace day.
- `tasks_completed`: done tasks completed/updated in the workspace day.
- `proposals_sent`: proposal activities or successful proposal communications.
- `sales_closed`: won leads updated in the workspace day.
- `revenue_won`: value of won leads updated in the workspace day.
- `emails_sent`: successful outgoing non-demo email communications.
- `sms_sent`: successful outgoing non-demo SMS communications.

Each goal returns key, label, target, actual, remaining, completion percentage, status, calculation source, date range, and timezone. Unknown goal types return `unsupported`. Target zero returns `no_target`. Empty source data returns `no_data`, not success.

## Team Attribution

Team metrics use explicit actor fields only. Supported fields include `assigned_to`, `owner_id`, `created_by`, `completed_by`, `actor_user_id`, `user_id`, `member_id`, `booked_by`, `sent_by`, and `recorded_by`.

Unattributed records are counted under `unassigned`, `system`, or `unknown`; they are never copied to every member. Failed, bounced, canceled, demo, and simulated communications are excluded from sent-contact metrics. Revenue is attributed to the current `leads.assigned_to` owner of a won lead.

The workspace timezone comes from `workspace_settings.working_hours.timezone` when present and otherwise uses `UTC`.

## Demo Behavior

If the browser is in public demo mode or a live backend is unavailable, the page uses local CRM state and clearly labels the result as demo/local. It does not claim cloud sync.

## Routes

- `POST /api/dashboard/daily-command-center`
- `POST /api/dashboard/team-performance`
- `POST /api/dashboard/pipeline-health`
- `POST /api/dashboard/today`
- `POST /api/workspace/daily-goals`

`/api/workspace/daily-goals` reads goals for any workspace member and updates goals only for Owners/Admins.
