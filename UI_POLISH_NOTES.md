# ClosePilot / Kira Home UI Polish Notes

## Design System

- Core surfaces use shared CSS variables for ink, muted text, borders, navy actions, elevated surfaces, radius, shadows, focus rings, and motion timing.
- Cards, panels, dashboard sections, Flow Mode, Copilot, team rows, and readiness checks now share consistent hover, focus, and pressed states.
- Motion is subtle and GPU-friendly: page enters, step transitions, toasts, card lifts, and loading shimmer. `prefers-reduced-motion` disables meaningful movement.
- The CRM now supports explicit `light`, `dark`, and `system` theme preferences through `data-theme`, while retaining the existing system-color fallback.
- Accent, density, dashboard layout, and sidebar preferences are CSS-variable driven so future backend persistence can reuse the same local preference object.

## Customization

- Admin -> Customization lets users save theme mode, accent color, comfortable/compact density, sidebar mode, default landing page, dashboard layout, AI tone, default trade, company display name, brand accent, logo placeholder text, and visible dashboard widgets.
- Demo mode stores preferences in `localStorage` under `closepilot-ui-preferences-demo`; authenticated users use a user-scoped key.
- Preferences are intentionally local/user-specific today. The object shape is ready to sync into a Supabase user/workspace preferences table later.
- Dashboard widget visibility currently covers Today's Focus, Opportunity Health, AI Copilot, Communications, Time Saved, AI Recommendations, Revenue, Team Activity, and Calendar.

## Mobile Behavior

- At phone widths, the primary CRM navigation becomes a fixed bottom app nav with safe-area padding.
- A floating mobile `+ Lead` action keeps the most common creation action reachable without hunting through the topbar.
- Dashboard, contacts, Flow Mode, communications, team, billing, and readiness sections keep compact row/grid layouts where practical.
- Buttons and form controls use larger tap targets on mobile, and modal/form layouts collapse cleanly.

## CRM Polish

- The app shell now responds to saved density/sidebar preferences.
- AI/Copilot surfaces have a subtle pulse treatment and clearer demo/fallback language.
- Customization settings include a live brand preview and explain that demo preferences are local.

## Kira Recruit Polish

- Kira Recruit has a dashboard command-center hero for next best candidate action, interview cadence, and AI recruiter readiness.
- Candidate cards now show score context and a recommended next action such as calling the best candidate first or booking an interview.
- Recruit surfaces share rounded panels, lifted hover states, dark-mode support, and mobile stacked layouts.
- Recruiting integrations now include provider-ready setup forms for Indeed and Monster/ZipRecruiter, including employer account ID, employer email, apply webhook URL, budget defaults, posting notes, and masked token status.
- W-2/W-9 onboarding tracks worker packet status, worker type, role, pay rate, tax packet status, direct deposit status, and notes while redacting tax-ID-like numbers from demo notes.
- Payroll staging supports provider settings for Gusto, ADP, QuickBooks Payroll, Stripe Connect contractor payouts, and manual export, plus demo payroll run totals and paid status.
- Demo mode intentionally does not store raw API tokens, SSNs, EINs, bank account numbers, or routing numbers. Live payroll and tax collection should be connected through a secure provider-side flow.

## Lead Generator Polish

- The Residential Lead Generator has a territory command-center panel that reinforces CSV/API-only compliance, lead quality target, and recommended area placeholders.
- Prospect/import/status panels now share premium card hover states and stronger visual hierarchy.
- Cost planner behavior remains unchanged while its surrounding shell aligns more closely with the CRM design language.

## Invite And Member Behavior

- Invite roles are now `admin`, `manager`, and `rep`, with `owner` shown as a protected role in the permissions reference.
- The invite form validates email, resends existing pending invites from manual entry, respects seat limits, and keeps the existing Resend/live-email fallback behavior.
- Team rows show role descriptions, pending status, expiration dates when available, resend actions, and audit-friendly status text.
- Invite links continue to use the configured app URL through the backend and fall back to a copyable local/demo link if email delivery is unavailable.

## AI Templates

- AI Sales Copilot now uses deterministic template categories for home improvement sales:
  - Roofing
  - Windows
  - Remodeling
  - Flooring
  - Solar
  - General home improvement
- Tone options are deterministic and ready for future OpenAI calls:
  - Professional
  - Friendly
  - Direct
  - Urgent
  - Luxury/high-ticket
- Templates include placeholders for customer name, project type, property address, appointment date, rep name, company name, estimate amount, last interaction, and next step.
- Saved AI tone preferences influence deterministic Copilot copy when the user chooses a non-default tone.
- Saved default trade preferences provide the fallback category when a lead does not clearly match roofing, windows, remodeling, flooring, or solar.

## Remaining Manual Setup

- Keep `kirahome.org` as the canonical production URL unless `www.kirahome.org` is reissued with a matching certificate.
- Add Twilio credentials when live SMS is ready.
- Add `OPENAI_API_KEY` when replacing deterministic AI templates with live AI generation.
- Add Google Calendar OAuth credentials when two-way calendar sync is ready.
