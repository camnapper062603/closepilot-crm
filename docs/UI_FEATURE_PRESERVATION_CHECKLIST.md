# UI Feature Preservation Checklist

Use this checklist before merging major UI changes.

| Area | Route | Primary action preserved | Secondary actions discoverable | Permission behavior | Mobile | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| Landing | `/` | Sign in/demo | Product tour/pricing | Public demo flag | Yes | Do not replace real auth. |
| Auth | `/` auth panel | Sign in | Sign up/demo/back | Supabase/session rules | Yes | Keep setup errors readable. |
| Daily Command | `#daily-command` | Refresh priorities | Goals, KPIs, pipeline, team | Role-aware team rows | Yes | Public demo locks live internals. |
| Dashboard | `#pipeline` | Start My Day | Follow-ups, best lead, widgets | Role-aware widgets | Yes | Do not hide follow-up queue. |
| Launch Command | `/launch-command-center`, `#launch-command-center` | Review recommendation | Blockers/checklist/beta companies | Backend internal gate | Yes | Sensitive data must stay server-gated. |
| Contacts | `#contacts` | Add/import/select contacts | Profile, bulk actions, filters | Role-aware page access | Yes | Profile remains accessible. |
| Pipeline | `#pipeline` | Move/open lead | Lead brief, insights, reports | Role-aware page access | Yes | Board must not overflow. |
| Tasks | `#tasks` | Add/complete task | Filters/bulk actions | Role-aware page access | Yes | Bulk action bar remains contextual. |
| Calendar | `#calendar` | Add appointment/connect calendar | Refresh/status/views | Calendar endpoint auth | Yes | Tokens never exposed. |
| Communications | `#communications` | Compose/log message | AI, quick actions, context | Protected endpoints | Yes | Simulated status should be clear. |
| Dial | `#dial` | Log call outcome | Schedule/appointments | Role-aware page access | Yes | Floor and schedule remain split. |
| Automations | `#automation` | Enable/edit automation | Builder/templates/runs | Manager/admin rules | Yes | Existing workflows stay intact. |
| Activity | `#activity` | Review events | Filters/export | Workspace scope | Yes | Audit context stays visible. |
| Recruiting Inbox | `#recruiting` | Sync/open candidate | Convert/task/review | Add-on and role gate | Yes | Kira Recruit remains separate app. |
| Admin/Billing | `#admin` | Manage plan/invites | Add-ons/readiness/audit/backup | Admin-only actions | Yes | Billing stays backend-gated. |
| Settings | `#settings` | Save preferences | Appearance/workflow/workspace | Admin-only subpages | Yes | Compact sidebar setting preserved. |
| Kira Recruit | `/recruiting/*` | Manage recruiting workflow | Connectors/onboarding/payroll/feed | CRM session/add-on gate | Yes | Browser secrets remain disabled in demo. |

## Required Regression Commands

- `npm run build`
- `npm run test:route-inventory`
- `npm run test:security`
- `npm run test:command-center`
- `npm test`
- `npm run test:browser-smoke`
- `npm run security:scan-secrets`
- `npm run release:check`
