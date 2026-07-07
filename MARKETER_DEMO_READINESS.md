# Marketer Demo Readiness

ClosePilot / Kira Home is positioned as a premium AI sales operating system for home improvement companies.

## What Is Ready To Show

- CRM Daily Command Center with "Start My Day" Flow Mode.
- Lead Intelligence, Opportunity Health, Smart Follow-Up Queue, and Time Saved proof points.
- AI Sales Copilot with deterministic/local suggestions.
- Communications hub for calls, texts, emails, notes, call logging, quick actions, and AI assistant panels.
- Automations builder, templates, logs, and placeholder AI workflow generation.
- Admin workspace with pricing, seat limits, invites, roles, add-ons, product overview, launch readiness, and audit trail.
- Kira Recruit paid add-on demo with job intake, candidate pipeline, interviews, onboarding, payroll staging, and CRM sync.
- Residential Lead Generator paid add-on demo with property imports, cost planning, DNC-aware workflow, and CRM handoff.

## Five-Minute Demo Flow

1. Open Dashboard and explain the Daily Command Center answers: "What should I do next?"
2. Click Start My Day and show Flow Mode, Lead Intelligence, scripts, and time saved.
3. Open Communications and show conversation history, composer, call controls, and AI suggestions.
4. Open Automations and show templates plus the workflow canvas.
5. Open Admin, then Product Overview, Team roles, Pricing/Add-ons, and Ready to Demo checklist.
6. Open Kira Recruit and Residential Lead Generator as paid add-ons.

## Current Setup / Demo Status

- Demo mode remains honest when Supabase, Stripe, Resend, Twilio, OpenAI, or Google Calendar are missing.
- Billing add-on checkout is not rebuilt in this pass; existing Stripe behavior is preserved.
- Invite emails send through Resend when configured; otherwise a copyable invite link is shown.
- APP_BASE_URL should be set to the production domain before sending real invites.

## Manual Setup Remaining

- Run `supabase-schema.sql` in Supabase after pulling updates.
- Confirm Vercel env vars, especially `APP_BASE_URL`, Stripe prices, Resend sender, Twilio, OpenAI, and Google Calendar.
- Rotate any secrets that were pasted into chat or committed anywhere unsafe.
