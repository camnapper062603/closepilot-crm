# ClosePilot / Kira Home Security Notes

## API Auth Contract

Live API endpoints must not trust identity, role, workspace, email, or customer IDs from JSON request bodies. The browser sends the Supabase session as `Authorization: Bearer <access_token>`. The backend verifies that token with Supabase Auth, then loads workspace membership/ownership from Supabase before allowing an action.

Client fields such as `actorRole`, `actorUserId`, `ownerEmail`, `inviterEmail`, `userId`, `stripeCustomerId`, `membership`, `isAdmin`, or `isOwner` are ignored for authorization.

## Endpoint Matrix

| Endpoint family | Auth required | Workspace role | Notes |
| --- | --- | --- | --- |
| `/api/system/readiness` | No for public summary, yes for detailed diagnostics | Owner/Admin for detailed diagnostics | Public response omits protected server-secret diagnostics. |
| `/api/stripe/create-checkout-session` | Yes | Owner/Admin | Stripe customer is loaded from `workspace_subscriptions`; client customer IDs are ignored. |
| `/api/stripe/create-portal-session` | Yes | Owner/Admin | Opens only the workspace customer stored server-side. |
| `/api/stripe/webhook` | Stripe signature in live modes | N/A | In `APP_MODE=beta` or `production`, missing webhook verification fails closed. |
| `/api/invites/send` | Yes | Owner/Admin | Uses authenticated sender email; invite tokens and temporary passwords are hashed. |
| `/api/invites/accept` | Yes | Signed-in invited email | Uses authenticated Supabase user ID/email, not body `userId` or `email`. |
| `/api/google/calendar/connect` | Yes | Owner/Admin | OAuth state is signed and tied to the authenticated user/workspace. |
| `/api/google/calendar/callback` | Signed OAuth state | Owner/Admin from stored state | Stores encrypted tokens only after migration columns exist. |
| `/api/google/calendar/status` | Yes | Workspace member | Returns connection metadata only, never raw tokens. |
| `/api/google/calendar/create-event` | Yes | Workspace member | Uses encrypted stored Google tokens. |
| `/api/ai/*` | Yes | Workspace member | Validates optional lead ownership before saving AI output. |
| `/api/communications/*` | Yes | Workspace member | Validates optional lead ownership before logging/sending. |
| `/api/recruiting/*` | Yes | Owner/Admin/Manager when add-on enabled | Setup endpoints require Owner/Admin; token must be in Authorization header. |

## Google Token Encryption

Required env vars:

```bash
GOOGLE_TOKEN_ENCRYPTION_KEY=<32 random bytes as base64, hex, or utf8>
GOOGLE_TOKEN_ENCRYPTION_KEY_VERSION=v1
```

Run the additive migration:

```bash
supabase db push
# or paste supabase/migrations/20260711_security_hardening.sql into Supabase SQL Editor
```

For existing plaintext Google Calendar rows, run:

```bash
npm run security:encrypt-google-tokens
npm run security:encrypt-google-tokens -- --clear-plaintext
```

Run without `--clear-plaintext` first, verify calendar status/events, then rerun with `--clear-plaintext`.

## Beta Verification

```bash
npm run build
npm run test:route-inventory
npm run test:security
npm run test:browser-smoke
npm run security:scan-secrets
npm test
```

Protected endpoints should return `401 AUTH_REQUIRED` without a bearer token. Role and tenant checks are covered by the grouped suites under `tests/security/`.

## Release Gates

```bash
npm run release:check
PRODUCTION_SMOKE_URL=https://your-domain npm run test:production-smoke
npm run security:verify-migration -- --json
```

`docs/route-permissions.json` is the machine-readable endpoint inventory. `npm run test:route-inventory` fails if `api-handlers.js` and the documented matrix drift.

## Logging And Redaction

Use `redactSecurityLog()` before logging request context, provider errors, or backend diagnostics that might include headers, tokens, passwords, API keys, webhook secrets, Google tokens, or invite tokens. Security tests assert recursive redaction for common provider secret shapes.

## More Detail

- `docs/SECURITY_TESTING.md`
- `docs/DEPLOYMENT_CHECKLIST.md`
- `docs/SUPABASE_SECURITY_VERIFICATION.md`
- `docs/GOOGLE_TOKEN_MIGRATION.md`
- `docs/ROUTE_PERMISSION_MATRIX.md`
