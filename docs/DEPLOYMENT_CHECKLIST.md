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

The smoke test checks app shell, manifest, service worker, public readiness, protected API auth, and unknown API JSON 404 behavior.

## Manual Live Database Verification

```bash
npm run security:verify-migration -- --json
npm run security:check-plaintext-tokens -- --json
```

These commands are read-only. They require `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
