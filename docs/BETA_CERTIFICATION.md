# Beta Certification

Use this checklist before inviting a beta customer to ClosePilot CRM or Kira Recruit.

## Required Before Beta

- Supabase Auth works on the production domain.
- RLS policies are applied from `supabase-schema.sql` or Supabase migrations.
- `INTERNAL_ADMIN_EMAILS` is set for founder-only Launch Command Center access.
- `PUBLIC_DEMO_ENABLED=false` for private beta deployments unless a public demo is intentional.
- Stripe trial checkout is configured or explicitly marked setup-only.
- Resend invite delivery is configured or invite fallback links are clearly labeled.
- `npm run release:check` passes.
- `npm run security:scan-secrets` passes.
- `npm run test:operations`, `npm run test:ux`, and `npm run test:accessibility` pass.
- `/api/health/live` and `/api/health/ready` return safe non-secret status.
- Support intake is configured or explicitly shown as not configured.
- Launch Command Center recommendation is not `NO_GO` for the target stage.
- Required migration verification passes or every warning is documented as an accepted risk.

## Safe For Beta Customers

- CRM dashboard, pipeline, contacts, tasks, activities, communications logging, calendar CRM scheduling, workspace admin, billing setup, and Daily Command Center.
- Kira Recruit live add-on when the workspace add-on is enabled and the customer understands which external job board, payroll, and onboarding providers are setup-only.
- Deterministic fallback AI labels when `OPENAI_API_KEY` is not configured.

## Requires API Or Provider Setup

- Stripe live checkout and webhooks.
- Resend outbound email.
- Twilio SMS.
- Google Calendar OAuth and encrypted token migration.
- OpenAI responses beyond rule-based fallback.
- CI status feed for automated release-health reporting.
- Error monitoring provider and uptime monitoring evidence.
- Backup/PITR evidence and restore test.
- Mobile, accessibility, and performance-budget verification.

## Release Evidence

Record the following in the Launch Command Center:

- Open blockers and owner.
- Blocker category, evidence, target stage, and resolution or accepted-risk reason.
- Provider status.
- Beta company status, onboarding stage, assigned owner, next action, issue count, feedback count, and conversion likelihood.
- Checklist completion.
- Latest release gate result.
- Latest production smoke result.
- Health endpoint and provider-failure status.
- Support, uptime, monitoring, backup, mobile QA, accessibility QA, and performance evidence.
- Founder launch recommendation.

## Manual Verification Checklist

- Confirm `INTERNAL_ADMIN_EMAILS` contains only internal founder/operator accounts.
- Confirm ordinary workspace owners/admins cannot open `/launch-command-center`.
- Confirm `workspace_daily_goals` reads are tenant-scoped and updates require owner/admin.
- Confirm failed/demo communications do not appear in sent-contact metrics.
- Confirm the latest Supabase migrations are applied before inviting beta customers.
