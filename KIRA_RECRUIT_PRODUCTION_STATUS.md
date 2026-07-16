# Kira Recruit Production Status

Kira Recruit is a paid recruiting add-on that belongs to the ClosePilot CRM workspace. It uses the same Supabase auth session and workspace membership model as the CRM.

## Live In Beta

- CRM session gate: live Kira Recruit requires an authenticated ClosePilot CRM session.
- Add-on gate: Owners/Admins can enable early access from a locked workspace; Managers can use Kira Recruit when the add-on is enabled; Members remain locked unless explicitly allowed in add-on metadata.
- Supabase persistence for:
  - `recruiting_candidates`
  - `recruiting_app_state`
  - `workspace_addons`
  - `integration_settings`
  - CRM `tasks`
  - CRM `activities`
  - staged `workspace_invitations`
- Job setup, job board/ATS public connector metadata, applicant inbox, interview list, onboarding packet staging, payroll workflow staging, recruiter notes, hiring outcomes, and CRM handoff history persist through the live backend.
- Built-in connector profiles cover common boards and ATS systems, and the Custom job board / ATS profile supports any site that allows employer posting through a direct API, ATS/XML feed, apply webhook, email applicant export, or manual posting checklist.
- Candidate CRM handoff supports:
  - save assigned recruiter/manager and hiring outcome
  - create follow-up task
  - add activity note
  - convert candidate to staged team-member invitation

## Demo Only

- Demo mode writes to browser `localStorage`.
- Demo job-board sync uses seeded candidate data.
- Demo onboarding packets and payroll runs are staged only; no tax IDs, bank data, or payroll provider writes are performed.
- Demo token fields are disabled and clearly labeled as server-side/provider setup only.

## Requires API Setup Before Full Production

- Job board API posting/import: Indeed, LinkedIn Jobs, ZipRecruiter, Monster, Glassdoor, Google Jobs, CareerBuilder, Craigslist, Handshake, Wellfound, Greenhouse, Lever, Workable, BambooHR, JazzHR, and custom providers can store public setup metadata now. Direct API posting/import still needs each provider's server-side OAuth/API credentials, approved account access, feed/webhook routing, or manual posting process.
- Payroll payouts: Gusto, ADP, QuickBooks Payroll, Stripe Connect, or manual export workflows need provider contracts and server-side secret storage.
- Onboarding email delivery: Resend must be configured for live packet emails.
- Compliance review: employment paperwork, tax forms, direct deposit, payroll, consent, and candidate data retention rules need customer-specific legal/process approval.
- Background jobs/webhooks: provider applicant webhooks should call `/api/recruiting/applicants` from trusted server integrations, not from browser-held secrets.

## Beta Customer Safe Use

Beta customers can safely use live mode for:

- creating and saving job details
- tracking candidate data
- assigning recruiter and manager ownership
- tracking hiring outcomes
- creating CRM follow-up tasks
- adding CRM activity notes
- staging team-member invitations for hired candidates
- storing public connector setup status for built-in and custom job boards/ATS feeds
- staging onboarding packet and payroll workflow records

Beta customers should not enter or rely on:

- job-board API secrets in the browser
- payroll API secrets in the browser
- tax IDs, bank account numbers, or direct deposit data
- automated production job-board spend or payroll execution until provider connectors are server-side configured and approved by the customer

## Backend Endpoints

- `POST /api/recruiting/access`: validates CRM session, workspace membership, role, and add-on state.
- `POST /api/recruiting/addon-settings`: Owner/Admin only; enables or updates the recruiting add-on.
- `POST /api/recruiting/load`: loads live recruiting app state and candidates.
- `POST /api/recruiting/save`: saves live recruiting app state and candidate rows.
- `POST /api/recruiting/applicants`: syncs candidate intake records into `recruiting_candidates`.
- `POST /api/recruiting/crm-handoff`: writes candidate assignments, hiring outcomes, tasks, activity notes, and team-member invitations.
- `POST /api/recruiting/onboarding-email`: stages onboarding email work and audit events.
- `POST /api/recruiting/integration-status`: Owner/Admin only; saves public connector status and strips browser token fields.

## Supabase Schema Notes

Run `supabase-schema.sql` before enabling beta customers. Existing projects need the additive migration columns for candidate assignment, hiring outcomes, CRM handoff IDs, connector settings, recruiter notes, hiring outcome history, and CRM handoff history.

Kira Recruit depends on service-role backend access for live writes. Direct browser writes are not used for production handoff actions.
