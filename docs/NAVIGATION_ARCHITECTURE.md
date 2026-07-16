# Navigation Architecture

The CRM navigation is grouped by user intent while preserving existing route IDs and hashes.

## Groups

- Home: `Daily Command`
- CRM: `Dashboard`, `Contacts`, `Tasks`, `Calendar`, `Communications`
- Sales tools: `Dial`, `Automations`, `AI Sales Manager`, `Activity`
- Team: `Recruiting Inbox`
- Business: `Admin`, `Settings`
- Internal: `Launch Command Center`

## Rules

- Keep existing `data-nav-page` values stable.
- Do not add a sidebar item unless the route works.
- Role filtering remains driven by `canAccessPage`.
- Empty nav groups collapse automatically after permission filtering.
- Internal pages still rely on backend founder/internal gates for sensitive data.

## Desktop Behavior

- Sidebar is persistent.
- Selected state is persistent.
- Compact sidebar keeps icon-like first-letter affordance and adds tooltips from `aria-label`.
- Workspace context stays at the bottom.

## Mobile Behavior

- The sidebar becomes a drawer.
- The drawer opens from the topbar Menu button.
- Escape closes the drawer.
- Selecting a route closes the drawer.
- Background scrolling is locked while open.

## Adding A Sidebar Link

1. Add the page to `pageTitles`, `pageDescriptions`, and `pageBreadcrumbs`.
2. Add the link to the correct `.nav-group`.
3. Confirm the route exists and role access is correct.
4. Add or update Playwright coverage if the link exposes a new workflow.
