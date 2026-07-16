# Incident Response

## Severity Definitions

- SEV-1: security breach, cross-tenant exposure, widespread outage, or data loss.
- SEV-2: major feature unavailable, billing broken, or provider outage affecting customers.
- SEV-3: partial degradation or isolated workflow failures.
- SEV-4: cosmetic or low-impact issue.

## Procedure

1. Detect: alert, support report, smoke failure, or provider-failure spike.
2. Triage: assign severity, owner, affected systems, start time, and request IDs.
3. Contain: disable unsafe paths, pause deploys, rotate exposed credentials if needed.
4. Communicate: customer-facing update for SEV-1/SEV-2, internal note for all incidents.
5. Recover: apply fix, rollback, provider workaround, or configuration repair.
6. Validate: run targeted tests, health checks, smoke tests, and provider verification.
7. Review: document root cause, timeline, customer impact, and prevention.

## Playbooks

### Authentication outage

Check Supabase status, auth env vars, CORS, browser console, and protected route rejection. Validate sign-in in staging before closing.

### Supabase outage

Confirm `/api/health/ready`, Supabase dashboard, and operational events. Preserve local drafts; avoid destructive retries.

### Stripe webhook outage

Check webhook signing secret, endpoint URL, event delivery logs, and `operational_events` for Stripe failures. Replay only safe Stripe events.

### Email outage

Check Resend domain verification, rate limits, and invite delivery failures. Provide manual invite fallback when appropriate.

### SMS outage

Check Twilio account status, trial restrictions, sender number, rate limits, and delivery errors.

### Google OAuth failure

Check OAuth redirect URI, state verification, token encryption key, revoked access, and calendar permissions.

### Accidental secret exposure

Remove exposure, rotate secret, audit logs/artifacts, invalidate tokens, and notify affected parties if needed.

### Cross-workspace data concern

Treat as SEV-1. Freeze affected operations, preserve evidence, verify RLS/API authorization, and run tenant-isolation tests.

### Failed deployment

Pause rollout, inspect smoke report, check health endpoints, roll back or redeploy fixed build, then rerun release checks.

### Corrupt migration

Stop writes if needed, inspect migration status, use Supabase backups/PITR per recovery plan, and verify schema tests.

### PWA/service-worker issue

Check service worker cache version, manifest, offline behavior, and static asset smoke checks. Ship a cache-busting service worker fix.
