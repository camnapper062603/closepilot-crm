# Production Operations

Kira Home now exposes safe operational primitives for private beta.

## Health Routes

- `GET /api/health/live`: process liveness only.
- `GET /api/health/ready`: coarse readiness with no secret names or tenant data.
- `GET /api/health`: summary pointer for live and ready checks.
- `GET /api/admin/operations/health`: founder-only diagnostics with provider failures and safe operational checks.
- `POST /api/workspace/operations/provider-failures`: workspace-scoped provider failures for managers/admins.
- `POST /api/support/report`: authenticated support report with optional safe diagnostics.

Every JSON API response includes `X-Request-ID`; error bodies include `requestId`.

## Monitoring

Monitoring is provider-neutral and disabled by default.

Required to mark configured:

- `MONITORING_ENABLED=true`
- `SENTRY_DSN`

Optional metadata:

- `SENTRY_ENVIRONMENT`
- `SENTRY_RELEASE`
- `PUBLIC_SENTRY_DSN`
- `LOG_LEVEL`
- `APP_RELEASE`
- `APP_COMMIT_SHA`

If monitoring is missing, the app continues to run and reports `not_configured`.

## Operational Events

The `operational_events` table stores safe provider-failure records:

- provider
- operation
- workspace ID when relevant
- actor ID when relevant
- resource type and ID
- safe error code
- outcome
- retryable flag
- first/last seen
- occurrence count
- request ID
- redacted metadata

Do not store tokens, credentials, private message bodies, uploaded files, or full provider responses.

## Launch Evidence Flags

The Launch Command Center uses evidence variables so unknown work does not appear passing:

- `HEALTH_ENDPOINTS_VERIFIED`
- `UPTIME_MONITORING_CONFIGURED`
- `PRODUCTION_SMOKE_PASSED`
- `BACKUP_EVIDENCE_RECORDED`
- `INCIDENT_RESPONSE_REVIEWED`
- `MOBILE_QA_COMPLETED`
- `ACCESSIBILITY_QA_COMPLETED`
- `PERFORMANCE_BUDGET_VERIFIED`

Leave these blank until verification is actually complete.
