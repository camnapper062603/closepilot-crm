# Uptime Monitoring

Use any external uptime provider that supports HTTPS checks and alert thresholds.

## Recommended Checks

| Target | Method | Interval | Alert after |
| --- | --- | --- | --- |
| Landing page `/` | GET | 5 minutes | 2 failures |
| Liveness `/api/health/live` | GET | 1 minute | 3 failures |
| Readiness `/api/health/ready` | GET | 5 minutes | 2 failures |
| Login page HTML `/` | GET with content check for sign-in text | 5 minutes | 2 failures |
| PWA manifest `/manifest.webmanifest` | GET | 30 minutes | 2 failures |
| Service worker `/service-worker.js` | GET | 30 minutes | 2 failures |

## Alert Routing

- SEV-1: health live down, widespread login failure, cross-tenant concern.
- SEV-2: readiness failing, billing/email/SMS provider outage affecting beta customers.
- SEV-3: degraded provider, support report spike, failed smoke test.

Do not place notification webhook secrets in logs or artifacts.

## Launch Command Center Evidence

Set `UPTIME_MONITORING_CONFIGURED=true` only after the external monitor exists, alert routing is tested, and the check list above is documented.
