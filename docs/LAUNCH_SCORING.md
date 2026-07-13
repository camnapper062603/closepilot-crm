# Launch Scoring

ClosePilot launch readiness is calculated in `command-center-config.js`. The API, UI, and tests all consume the same policy.

## Stages

Supported stages are `development`, `security_hardening`, `beta_certification`, `private_beta`, `paying_pilot`, and `public_launch`.

Private beta does not require app-store or marketing readiness. Paying pilot adds billing, cancellation, support, monitoring, export, and legal requirements. Public launch requires the full category set and no unresolved high launch blockers.

## Categories

The supported categories are `security`, `authentication`, `backend`, `frontend`, `billing`, `testing`, `deployment`, `production_operations`, `mobile`, `documentation`, `customer_experience`, and `legal_compliance`.

Each category stores a score, weight, status, source, evidence, and timestamp in `launch_readiness_categories`. Missing required categories are treated as unknown, not passing. Security requires 80+. Authentication requires 85+.

## Mandatory NO-GO Rules

`NO_GO` is returned when any required launch gate is failed or unknown for the current stage, including critical blockers, security score below 80, authentication score below 85, failed or unknown tenant isolation, failed production smoke, failed release gates, failed Supabase verification, failed billing live path for paid stages, required provider failure, failed required checklist, required migration missing, plaintext provider tokens remaining, or degraded auth/workspace authorization.

`CONDITIONAL_GO` is allowed only when no mandatory NO-GO exists but high blockers, accepted risks, optional provider gaps, incomplete docs/monitoring/legal/mobile/onboarding, or stage score gaps remain.

`GO` requires all stage-required categories, providers, verification checks, migrations, checklist items, and weighted score thresholds to pass with no launch-blocking high severity blockers.

The recommendation output includes `status`, score, blocking reasons, warnings, passed requirements, unknown requirements, accepted risks, evaluated stage, and timestamp.
