# Launch Command Center

The Founder Launch Command Center is the internal beta-readiness page for ClosePilot CRM and Kira Recruit.

## Access

- Browser route: `/launch-command-center` or `#launch-command-center`
- API family: `/api/launch-command-center/*`
- Auth: Supabase bearer session plus server-side internal access
- Internal access: set `INTERNAL_ADMIN_EMAILS` to a comma-separated allowlist

The allowlist is never sent to the browser. If `INTERNAL_ADMIN_EMAILS` is missing, the backend fails closed with `INTERNAL_ACCESS_NOT_CONFIGURED`.

## Live Data

The page reads and writes these Supabase tables through service-role backend routes:

- `launch_readiness_categories`
- `launch_provider_status`
- `launch_blockers`
- `launch_checklist_items`
- `launch_beta_accounts`
- `launch_status_snapshots`

All launch tables have RLS enabled and are intended for backend service-role access only.

## Demo And Setup States

- Public demo mode does not show founder launch data.
- Missing CI integration shows `Not connected`.
- Missing providers show setup states instead of pretending to be healthy.
- Manual scores and blockers are allowed, but automation is not claimed unless a provider/status row exists.

## Main Routes

- `POST /api/launch-command-center/overview`
- `POST /api/launch-command-center/readiness`
- `POST /api/launch-command-center/blockers`
- `POST /api/launch-command-center/providers`
- `POST /api/launch-command-center/checklist`
- `POST /api/launch-command-center/beta-companies`
- `POST /api/launch-command-center/status-snapshot`

This repo’s API handler uses POST routes for read and mutation operations. Mutations use payload fields such as `mutation`, `itemKey`, `completed`, and `companyName`.
