# Security Testing

ClosePilot/Kira Home security tests run against the real API handler with deterministic mocks for Supabase, Stripe, Google, Twilio, Resend, and OpenAI. They do not call live providers.

## Local Commands

```bash
npm run test:route-inventory
npm run test:security
npm run test:browser-smoke
npm run security:scan-secrets
npm run release:check
```

Focused suites:

```bash
npm run test:security:auth
npm run test:security:tenant
npm run test:security:oauth
npm run test:security:billing
npm run test:security:communications
```

## What Is Covered

- Supabase bearer auth, malformed auth, and missing auth.
- Workspace role checks for billing, invites, Google setup, and Kira Recruit setup.
- Tenant isolation for workspace and lead-scoped routes.
- Invite role validation, duplicate invite blocking, and seat-limit blocking.
- Stripe setup/fail-closed behavior.
- Google OAuth setup, token encryption requirement, and token-free status responses.
- Communications and AI provider fallbacks with persistence calls.
- Readiness public vs admin diagnostics.
- HTTP security headers, CORS preflight, request IDs, and rate limits.
- Route inventory drift between `api-handlers.js` and `docs/route-permissions.json`.
- Recursive log redaction for auth/provider secrets.

## Route Inventory Gate

`docs/route-permissions.json` is the machine-readable API permission inventory. `npm run test:route-inventory` imports `closePilotApiRoutes` from `api-handlers.js` and fails if any route is missing, duplicated, or undocumented.

When adding an API route:

1. Register it in `api-handlers.js`.
2. Add it to `closePilotApiRoutes`.
3. Add a matching entry in `docs/route-permissions.json`.
4. Add or update the relevant security test.
