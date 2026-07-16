# Deployment Checklist

Use this before beta or production deploys.

## Required Local Gate

```bash
npm run release:check
```

This runs:

- `npm run build`
- `npm run test:route-inventory`
- `npm run test:security`
- `npm run test:command-center`
- `npm run test:launch-policy`
- `npm run test:daily-goals`
- `npm run test:team-performance`
- `npm run test:operations`
- `npm run test:ux`
- `npm run test:accessibility`
- `npm test`
- `npm run test:browser-smoke`
- `npm run security:scan-secrets`

## Required Environment

Set these for a company beta:

```text
APP_MODE=beta
PUBLIC_DEMO_ENABLED=false
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
APP_BASE_URL=https://your-production-domain
PRODUCT_URL=https://your-production-domain
SUPPORT_EMAIL=support@your-domain
SUPPORT_URL=
STATUS_PAGE_URL=
MONITORING_ENABLED=false
LAUNCH_STAGE=private_beta
```

Provider-specific features remain setup-gated until their keys are configured:

- Stripe billing: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, plan price/product IDs.
- Resend email: `RESEND_API_KEY`, `INVITE_FROM_EMAIL`.
- Twilio SMS: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`.
- OpenAI: `OPENAI_API_KEY`.
- Google Calendar: `GOOGLE_CALENDAR_CLIENT_ID`, `GOOGLE_CALENDAR_CLIENT_SECRET`, `GOOGLE_TOKEN_ENCRYPTION_KEY`.

## Post Deploy Smoke

```bash
PRODUCTION_SMOKE_URL=https://your-production-domain npm run test:production-smoke
```

The smoke test checks app shell, static assets, manifest, service worker, health endpoints, public readiness, security headers, CORS, invalid JSON handling, protected API auth, support entry, stack-trace leakage, and unknown API JSON 404 behavior.

Also run the manual `Production Smoke` GitHub Actions workflow against the deployed URL.

Before marking Launch Command Center operations passing, record evidence for health endpoints, uptime monitoring, production smoke, support contact, backup/PITR, incident-response review, mobile QA, accessibility QA, and performance-budget verification.

## Manual Live Database Verification

```bash
npm run security:verify-migration -- --json
npm run security:check-plaintext-tokens -- --json
```

These commands are read-only. They require `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.

Apply the command-center migrations in order before a live Launch Command Center review:

```bash
supabase/migrations/20260712_launch_command_center.sql
supabase/migrations/20260713_launch_policy_categories.sql
supabase/migrations/20260713_launch_blocker_beta_fields.sql
supabase/migrations/20260716_operational_events.sql
```
