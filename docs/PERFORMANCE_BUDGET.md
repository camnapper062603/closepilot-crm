# Performance Budget

Measurements must be taken from the current deployment before marking this passing.

## Targets

| Budget | Target |
| --- | --- |
| Initial HTML response | Under 500 ms from target region |
| Largest JavaScript file | Under 900 KB uncompressed before public launch |
| CSS bundle | Under 350 KB uncompressed before public launch |
| Dashboard critical requests | 5 or fewer network requests after app shell loads |
| Dashboard usable time | Under 3 seconds on a mid-range mobile device |
| Mobile interaction response | Under 100 ms for drawer, primary buttons, and form focus |
| Layout shift | No visible horizontal overflow or major content jump on critical mobile flows |

## Current Status

Unknown until measured in the target beta deployment. Do not mark `PERFORMANCE_BUDGET_VERIFIED` until evidence is recorded.

## Guardrails

- Paginate or limit long histories.
- Avoid duplicate dashboard requests.
- Debounce searches.
- Do not recalculate large aggregates repeatedly in the browser.
- Lazy-load low-priority panels only when it improves real user time-to-work.
