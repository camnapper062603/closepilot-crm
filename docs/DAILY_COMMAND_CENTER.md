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

The API returns deterministic priorities, KPI cards, pipeline health, today’s work, activity, alerts, and role-aware team performance.

## Role Behavior

- Owners/Admins: can read the command center, view team performance, and update daily goals.
- Managers: can read the command center and view team performance.
- Members: can read their daily command center but receive a locked team-performance state.

## Demo Behavior

If the browser is in public demo mode or a live backend is unavailable, the page uses local CRM state and clearly labels the result as demo/local. It does not claim cloud sync.

## Routes

- `POST /api/dashboard/daily-command-center`
- `POST /api/dashboard/team-performance`
- `POST /api/dashboard/pipeline-health`
- `POST /api/dashboard/today`
- `POST /api/workspace/daily-goals`

`/api/workspace/daily-goals` reads goals for any workspace member and updates goals only for Owners/Admins.
