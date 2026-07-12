# Launch Scoring

ClosePilot launch readiness is calculated from `command-center-config.js` so the API, UI, and tests use the same rules.

## Weighted Categories

- Auth, tenant security, and access control: 24%
- Core CRM workflows: 18%
- Provider integrations: 16%
- Billing and trials: 14%
- Kira Recruit beta add-on: 10%
- Release operations and monitoring: 18%

Each category returns a 0-100 score. If no manual score exists in `launch_readiness_categories`, the backend derives the category score from configured provider state.

## Recommendation Rules

- `NO-GO`: any critical blocker is open, readiness is below 65, or a required provider is missing.
- `CONDITIONAL GO`: core launch gates are usable but high blockers, checklist gaps, or release operations still need follow-up.
- `GO`: readiness is at least 85, beta checklist progress is at least 80%, no high/critical blockers are open, and required providers are connected.

CI status is intentionally not faked. If no CI status provider is configured, the Launch Command Center shows `Not connected`.
