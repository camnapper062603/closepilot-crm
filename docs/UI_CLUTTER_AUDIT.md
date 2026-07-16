# UI Clutter Audit

This audit covers the existing ClosePilot / Kira Home CRM and companion Kira Recruit surfaces before the visual hierarchy pass. The goal is calmer SaaS usability without removing features, routes, permissions, or workflows.

| Screen | Primary objective | Primary action | Clutter sources | Proposed correction |
| --- | --- | --- | --- | --- |
| Landing page | Explain the product and drive sign-in/demo. | Sign in or view demo. | Dense proof/pricing sections compete below the hero. | Keep hero dominant, use restrained section spacing, and keep pricing/add-on totals scannable. |
| Authentication | Let users enter the CRM or demo safely. | Sign in. | Demo, signup, and tour paths can visually compete. | Keep sign-in as primary, demo as clearly secondary, and retain setup warnings. |
| App shell | Help users find their work area quickly. | Navigate to the relevant module. | Single long sidebar list, no grouping, topbar repeats page context. | Group navigation by Home, CRM, Sales Tools, Team, Business, and Internal; add page descriptions. |
| Daily Command Center | Tell users what to do today. | Start the highest-priority action. | Many metrics and widgets compete with the focus panel. | Keep focus panel first, cap primary KPI emphasis, demote secondary panels visually. |
| Main dashboard | Manage daily CRM work. | Start My Day, open follow-up queue, open best lead. | Follow-up, copilot, comm stats, time saved, revenue, and reports all compete. | Use stronger hierarchy, quieter cards, and clear section order. |
| Founder Launch Command Center | Decide launch readiness. | Review blockers and recommendation. | Recommendation, readiness, provider, checklist, and beta tables all look equally heavy. | Make recommendation dominant, use compact rows for evidence and blockers. |
| Leads / Contacts | Manage and act on contacts. | Add/import/select contacts. | Filters, bulk actions, profile, and list all appear close together. | Keep list primary, profile as subpage, and use toolbar/disclosure patterns. |
| Pipeline | Move opportunities toward close. | Advance or open a lead. | Cards can carry too much detail when the board fills. | Keep card essentials visible and send details to profile/drawer flows. |
| Tasks | Clear due work. | Add task or mark complete. | Filters, form, bulk controls, and list are close together. | Keep due list prominent and bulk controls contextual. |
| Calendar / Appointments | Manage scheduled work. | Add appointment or connect calendar. | Calendar status and appointment controls compete. | Keep connection status secondary and appointment actions primary. |
| Communications | Read and send customer messages. | Open a conversation and respond. | Conversation list, composer, AI, context, and quick actions all compete. | Preserve three-pane pattern, reduce panel borders, clarify simulated statuses. |
| Dialer | Work calls and log outcomes. | Start/log call outcome. | Dial floor, outcome form, appointments, and schedule are dense. | Keep floor/schedule subpage split and make outcome logging visually dominant. |
| Follow-up queue | Clear overdue or due follow-ups. | Complete or open a lead. | Queue cards and dashboard snippets duplicate urgency. | Dashboard shows summary; queue page carries detail. |
| Automations | Configure and monitor workflows. | Enable/edit automation. | Builder, templates, run history, and status panels feel equal. | Keep subpage tabs and quieter run/history cards. |
| AI tools | Generate coaching and sales assistance. | Refresh or apply suggested action. | AI output panels can look like primary data. | Keep AI suggestions as action support, not page identity. |
| Recruiting | Review candidate feed and handoff. | Sync candidates or open Recruit. | CRM inbox and Recruit app share similar concepts. | Keep CRM inbox as handoff surface; Kira Recruit owns connector/applicant setup. |
| Team members / Invitations | Manage users and access. | Invite member. | Billing, seats, invites, and roles share the Admin page. | Preserve Admin subpages and make team/billing sections distinct. |
| Analytics / performance | Understand team and pipeline health. | Open underlying records or coaching action. | Decorative metrics can pile up. | Retain actionable metrics and explain why each matters. |
| Billing | Manage plan, seats, and add-ons. | Change plan or manage billing. | Plan cards, add-ons, seats, and readiness can compete. | Keep plan summary first, add-on totals explicit, setup details secondary. |
| Integrations | Configure provider metadata. | Save connector status. | Provider forms can imply browser secret storage. | Disable demo secrets, emphasize server-side setup, and store only public metadata. |
| Workspace settings | Tune workspace defaults. | Save settings. | Multiple settings forms on one page. | Keep subpages and consistent form grouping. |
| Personal settings | Adjust local preferences. | Save appearance/dashboard preferences. | Sidebar density, dashboard density, and accent controls are dense. | Keep labels clear and reduce preview card visual weight. |
| Mobile navigation | Navigate without horizontal overflow. | Open menu and choose module. | Previous horizontal nav required swiping through many modules. | Use a mobile drawer with large targets and preserve active route. |
| Empty states | Explain missing data. | Create/import/sync. | Some states are generic or demo-colored. | Make empty states specific and action-oriented. |
| Loading states | Show progress without layout shift. | Wait/retry. | Command centers use text placeholders. | Keep readable placeholders and avoid large spinners. |
| Error states | Explain what failed safely. | Retry or ask admin. | Some setup errors share status styling with success. | Use clear status text, request-safe messages, and no stack traces. |
| Modals / drawers | Complete focused edits. | Save or cancel. | Lead details can become long vertical forms. | Keep modal for lead details, prefer subpage/drawer patterns for complex work. |
| Tables / forms / filters | Manage dense records. | Search/filter/select. | Inline controls can become crowded. | Keep toolbars consistent and bulk actions contextual. |

## Cross-App Issues

- Navigation needed hierarchy more than new routes.
- Page headers needed consistent title, breadcrumb, description, and action hierarchy.
- Strong color should be reserved for selected state, primary action, errors, warnings, and success.
- Cards should identify grouped work, not every text block.
- Mobile should not depend on hover or horizontal sidebar scanning.

## Implemented Corrections In This Pass

- Grouped sidebar navigation.
- Standard page header description and breadcrumb.
- Mobile drawer navigation with Escape-to-close.
- Quieter panel/card borders and shadows.
- Kira Recruit connector setup broadened while preserving secret safety.
- Documentation added for design system, navigation, responsive behavior, accessibility, and preservation checks.
