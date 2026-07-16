# Support Operations

## Support Configuration

- `SUPPORT_EMAIL`: staffed inbox for beta customers.
- `SUPPORT_URL`: optional external support intake form.
- `STATUS_PAGE_URL`: optional public status page.

If neither support email nor URL is configured, the app shows a safe fallback and does not claim staffed support.

## Report A Problem

The in-app support dialog can include, with user consent:

- request ID
- current route
- browser summary
- viewport size

It must not include tokens, passwords, full records, private notes, message bodies, or customer files.

## Severity

- SEV-1: security breach, cross-workspace exposure, data loss, widespread outage.
- SEV-2: major workflow unavailable, billing broken, provider outage affecting customers.
- SEV-3: partial degradation or isolated workflow failure.
- SEV-4: cosmetic or low-impact issue.

## Triage

1. Capture request ID, route, workspace ID where safe, browser/device summary, and concise description.
2. Reproduce in a test workspace.
3. Check `/api/admin/operations/health` and provider failures.
4. Decide severity and owner.
5. Communicate next update time.
6. Record resolution notes and verification evidence.

## Customer Communication

- Be specific about impact.
- Do not expose another customer's data.
- Do not mention internal secrets, stack traces, or raw provider responses.
- Confirm when the issue is fixed and what validation was run.
