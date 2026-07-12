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

## Release Evidence

Record the following in the Launch Command Center:

- Open blockers and owner.
- Provider status.
- Beta company status.
- Checklist completion.
- Latest release gate result.
- Founder launch recommendation.
