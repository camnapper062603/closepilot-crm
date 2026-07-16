# Design System

ClosePilot uses the existing `styles.css` and `recruiting.css` architecture. This pass consolidates a lightweight system without adding a component library.

## Tokens

Core tokens live in `:root` in `styles.css`.

- Background: `--app-bg`
- Surfaces: `--surface-primary`, `--surface-secondary`, `--surface-subtle`
- Borders: `--border-subtle`, `--border-strong`
- Text: `--text-primary`, `--text-secondary`, `--text-muted`
- Status: `--success`, `--warning`, `--danger`, existing navy/accent colors
- Focus: `--focus`
- Spacing: `--space-1` through `--space-12`
- Radius: `--radius-control`, `--radius-panel`
- Elevation: `--shadow-elevated`

## Typography

- Page title: topbar `h1`, compact and route-specific.
- Page description: `.page-description`, one short sentence explaining the page objective.
- Section title: panel `h2`/`h3`.
- Label/metadata: `.eyebrow`, small labels, table metadata, status pills.
- Metrics: strong numeric emphasis inside KPI rows or cards, never more dominant than the page objective.

## Color Rules

- Primary action uses the existing primary button styling.
- Selected navigation and active tabs use navy/accent.
- Success, warning, and danger colors should map to actual states only.
- Demo/simulated/provider-not-configured states must not look like final success.
- Most surfaces stay neutral.

## Container Rules

- Use cards for distinct records, repeated items, modals, and framed tools.
- Do not nest card-heavy sections unnecessarily.
- Prefer spacing, section headings, simple dividers, and grouped rows for secondary information.

## States

- Hover should clarify clickability, not create visual noise.
- Focus must remain visible through `:focus-visible`.
- Disabled controls must keep readable labels.
- Loading and error states should preserve layout shape where possible.

## Adding A New Page

1. Add the route label to `pageTitles`.
2. Add one sentence to `pageDescriptions`.
3. Add a breadcrumb to `pageBreadcrumbs`.
4. Place the sidebar link in the correct `.nav-group`.
5. Use existing buttons, panels, forms, and status pills before adding new styles.
