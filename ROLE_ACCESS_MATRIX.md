# Role Access Matrix

ClosePilot uses three user-facing access tiers and optional sales function labels.

## Access Tiers

| Tier | Intended User | Can Access | Cannot Access |
| --- | --- | --- | --- |
| Admin | Owner/operator or trusted admin | Full CRM, billing, team invites, workspace settings, launch readiness, automations, import/export, reporting, add-on management, Kira Recruit, Lead Generator | Workspace deletion is still intentionally not exposed in the demo UI |
| Manager | Sales manager or team lead | CRM, assigned/team leads, team performance, lead assignment, follow-up queue, communications, reporting, Flow Mode, AI Copilot, limited automations | Billing, full admin settings, owner-level controls, workspace deletion |
| Member | Dialer, setter, closer, or rep | Assigned lead workflows, Flow Mode, follow-up tasks, assigned communications, basic AI Copilot | Billing, team management, admin settings, launch readiness, full export, add-on purchasing |

`owner` remains an internal super-admin alias for existing workspaces, but the UI presents it as Admin/Owner.

## Sales Function Labels

| Label | Meaning |
| --- | --- |
| Dialer | Call list/dial floor, basic lead info, call/text logging, follow-up disposition |
| Setter | Assigned leads, appointment setting, follow-up tasks, communication tools |
| Closer | Assigned hot leads, appointments, proposal context, AI Copilot, Flow Mode, assigned communications |

Function labels do not replace access tiers. They clarify the person's sales job while Admin/Manager/Member controls permissions.

## Invite Behavior

- Invite role selector shows Admin, Manager, Member.
- Function label selector shows No function label, Dialer, Setter, Closer.
- Duplicate pending invites are blocked.
- Seat limits are displayed before invites are staged.
- Resend sends live email when configured.
- Demo mode shows/copies a fallback invite link.
- Role changes and removals require confirmation.
- Admins cannot accidentally remove the owner or themselves from the team UI.
