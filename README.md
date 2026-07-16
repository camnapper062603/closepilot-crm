# Kira Home

Kira Home is a hosted MVP CRM for a personal sales workflow now and a SaaS product later.

## Run Locally

Use the local static server:

```bash
npm start
```

Then visit:

```text
http://localhost:4173
```

The recruiting background app is available at:

```text
http://localhost:4173/recruiting.html
```

If that port is already busy, run another port:

```bash
PORT=4174 npm start
```

Local `npm start` and `npm run build` load `.env.local` first and `.env` second. Keep secrets out of Git, and use `.env` only on your machine or in Vercel environment variables.

## Test

```bash
npm test
npm run test:security
npm run release:check
```

## Company Beta Mode

For a real company beta, deploy with live Supabase auth/data and disable public demo access:

```text
APP_MODE=beta
PUBLIC_DEMO_ENABLED=false
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
APP_BASE_URL=https://your-beta-domain.com
PRODUCT_URL=https://your-beta-domain.com
SUPPORT_EMAIL=support@yourdomain.com
```

Then run `supabase-schema.sql` in Supabase, rebuild with `npm run build`, deploy `dist`, and create the first beta owner account from the sign-in screen. Keep Stripe, Resend, Twilio, OpenAI, and Google Calendar configured as they become part of the beta scope; missing optional providers show setup guidance instead of pretending to be live. See `SECURITY.md` before beta launch for the protected API matrix and token-encryption migration.

## Production Docs

- `DEPLOYMENT.md`
- `ENVIRONMENT.md`
- `SUPABASE_SETUP.md`
- `STRIPE_SETUP.md`
- `EMAIL_SMS_SETUP.md`
- `AI_SETUP.md`
- `MOBILE_SETUP.md`
- `SELLABLE_SAAS_CHECKLIST.md`
- `MARKETER_DEMO_READINESS.md`
- `ROLE_ACCESS_MATRIX.md`
- `PRICING_AND_ADDONS.md`
- `TROUBLESHOOTING.md`
- `API.md`

## Deploy On Vercel

1. Create a GitHub repository for this folder.
2. Push the project to GitHub.
3. Go to Vercel and choose **Add New Project**.
4. Import the GitHub repository.
5. Use these settings:
   - Framework Preset: **Other**
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Deploy.

The included `vercel.json` already applies those settings and routes `/recruiting` and `/lead-generator` to the companion apps.

## Platform Modules

| Module | Status | Notes |
| --- | --- | --- |
| ClosePilot CRM | Live SaaS product | Daily Command Center, Flow Mode, Communications, Automations, AI Sales Manager, Admin, billing/invite backend endpoints, and demo fallback |
| Kira Recruit | Beta paid add-on | CRM-session gated live backend for candidates, job setup, interviews, onboarding packet staging, payroll workflow staging, and CRM handoff; provider APIs still require setup |
| Residential Lead Generator | Coming soon preview | CRM customers can view demo mode; live enrichment, provider imports, CRM sync, and exports require compliance setup before early access |

Open demos:

```text
http://localhost:4173/
http://localhost:4173/recruiting.html?demo=1
http://localhost:4173/recruiting/applicants?demo=1
http://localhost:4173/lead-generator?demo=1
```

See `KIRA_RECRUIT_PRODUCTION_STATUS.md` for Kira Recruit live/demo boundaries, add-on gating, provider setup requirements, and beta-safe customer workflows.

## Security And Release Gates

Before beta deploys, run:

```bash
npm run release:check
```

After deploy, run:

```bash
PRODUCTION_SMOKE_URL=https://your-production-domain npm run test:production-smoke
```

Live Supabase verification is read-only:

```bash
npm run security:verify-migration -- --json
npm run security:check-plaintext-tokens -- --json
```

Operational endpoints:

```text
GET /api/health/live
GET /api/health/ready
GET /api/admin/operations/health
POST /api/workspace/operations/provider-failures
POST /api/support/report
```

Monitoring, uptime, backup, support, mobile QA, accessibility QA, and performance status are evidence-based. Leave `MONITORING_ENABLED`, `HEALTH_ENDPOINTS_VERIFIED`, `UPTIME_MONITORING_CONFIGURED`, `PRODUCTION_SMOKE_PASSED`, `BACKUP_EVIDENCE_RECORDED`, `MOBILE_QA_COMPLETED`, `ACCESSIBILITY_QA_COMPLETED`, and `PERFORMANCE_BUDGET_VERIFIED` blank until verified.

See `docs/SECURITY_TESTING.md`, `docs/DEPLOYMENT_CHECKLIST.md`, `docs/ROUTE_PERMISSION_MATRIX.md`, `docs/BETA_EXPERIENCE_AUDIT.md`, `docs/PRODUCTION_OPERATIONS.md`, `docs/UPTIME_MONITORING.md`, `docs/SUPPORT_OPERATIONS.md`, `docs/INCIDENT_RESPONSE.md`, `docs/BACKUP_AND_RECOVERY.md`, `docs/PERFORMANCE_BUDGET.md`, and `docs/MOBILE_QA.md`.

## Mobile App Store Packaging

The CRM, Kira Recruit, and Lead Generator are packaged as one Capacitor app suite named Kira Home.

```bash
npm run mobile:sync
npm run mobile:open:android
npm run mobile:open:ios
```

Android builds open in Android Studio from `android/`. iOS builds open in Xcode from `ios/` and need CocoaPods/Xcode on a Mac for final signing and App Store upload. See `mobile-store-readiness.md` for the store checklist.

## Supabase Setup

1. Create a Supabase project.
2. Open the SQL editor.
3. Run the contents of `supabase-schema.sql`.
4. Existing installs can safely rerun the schema file. It uses `create table if not exists`, `alter table if exists`, and idempotent policy/index updates for the new billing and invite fields.
5. Copy your Project URL, anon public key, and service role key.
6. In Vercel or Netlify, add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `APP_BASE_URL`
   - `SUPPORT_EMAIL`
7. Redeploy the site.
8. In Supabase Auth URL Configuration, set:
   - Site URL: your production URL
   - Redirect URL: your production URL

Without those variables, the app runs in demo mode using browser storage.

## Stripe Billing Setup

1. Create Starter, Growth, and Scale recurring prices in Stripe.
2. Add these environment variables:
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_STARTER`
   - `STRIPE_PRICE_GROWTH`
   - `STRIPE_PRICE_SCALE`
   - `STRIPE_PRICE_ADDON_RECRUIT` (optional future add-on checkout)
   - `STRIPE_PRICE_ADDON_LEADGEN` (optional future add-on checkout)
   - `STRIPE_PRICE_ADDON_BUNDLE` (optional future add-on checkout)
   - `APP_BASE_URL`
3. Add a Stripe webhook endpoint pointing to:

```text
https://your-domain.com/api/stripe/webhook
```

4. Subscribe the webhook to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. The Admin billing buttons call backend endpoints:
   - `POST /api/stripe/create-checkout-session`
   - `POST /api/stripe/create-portal-session`
6. The Admin billing layout resolves recurring display prices from the configured Stripe Price IDs when `STRIPE_SECRET_KEY` is available; otherwise it uses setup-mode fallback prices.
7. Subscription plan, status, seat limit, trial end, current period end, Stripe customer ID, and Stripe subscription ID sync into `workspace_subscriptions`.

If Stripe variables are missing, the Admin page stays in demo mode and shows a useful setup message instead of breaking.

Add-on checkout hardening is intentionally out of scope for the first CRM customer launch. Kira Recruit, Residential Lead Gen, and the bundle are displayed as coming soon previews with demo CTAs and early-access interest logging.

## Roles And Add-Ons

The user-facing access tiers are:

- Admin: full CRM, billing, team/invites, workspace settings, launch readiness, automations, import/export, reporting, and coming soon app previews.
- Manager: CRM, team execution, assigned/team leads, follow-up queue, communications, reporting, Flow Mode, AI Copilot, and limited automations. No billing or owner-level settings.
- Member: assigned lead workflow, Flow Mode, follow-up tasks, assigned communications, and basic AI Copilot. No billing, team management, launch readiness, full export, or add-on purchasing.

Optional sales function labels are Dialer, Setter, and Closer. See `ROLE_ACCESS_MATRIX.md` and `PRICING_AND_ADDONS.md`.

## Resend Invite Email Setup

1. Create a Resend API key and verify a sending domain.
2. Add:
   - `RESEND_API_KEY`
   - `INVITE_FROM_EMAIL`
   - `SUPPORT_EMAIL`
   - `APP_BASE_URL`
3. Set `INVITE_FROM_EMAIL` to a verified Resend sender address, such as `invites@yourdomain.com`.
4. Team invites call:

```text
POST /api/invites/send
```

The backend creates a secure invite token, stores only its SHA-256 hash in Supabase, sets an expiration, generates a temporary password, and sends the invite email through Resend. Invite emails include the invited email address, role, workspace/app name, product URL, secure invite link, temporary password, and a prompt to change that password after first sign-in.

Invite acceptance uses:

```text
POST /api/invites/accept
```

When a signed-in user opens `?invite=...`, the app accepts the invite and joins the correct workspace. If Supabase service credentials are available, the send route attempts to provision the invited auth user with the temporary password. Changing that password in-app starts the automated onboarding checklist. If Resend or `INVITE_FROM_EMAIL` is not configured, the Admin page shows and copies a fallback invite link plus demo temporary password instead of crashing.

## Google Calendar Setup

1. In Google Cloud Console, enable the Google Calendar API.
2. Configure the OAuth consent screen for the `kirahome.org` domain.
3. Create an OAuth Client ID with type **Web application**.
4. Add an authorized redirect URI:

```text
https://your-domain.com/api/google/calendar/callback
```

5. Add these environment variables:
   - `GOOGLE_CALENDAR_CLIENT_ID`
   - `GOOGLE_CALENDAR_CLIENT_SECRET`
   - `GOOGLE_CALENDAR_REDIRECT_URI`
   - `GOOGLE_TOKEN_ENCRYPTION_KEY`
   - `GOOGLE_TOKEN_ENCRYPTION_KEY_VERSION`
   - `APP_BASE_URL`
6. Rerun `supabase-schema.sql` so the `calendar_connections` table exists.
7. Redeploy, then use the Calendar page to connect Google Calendar.

OAuth tokens are encrypted server-side with AES-256-GCM before storage and are not exposed to the browser. If you already have plaintext Calendar rows, run `npm run security:encrypt-google-tokens`, verify Calendar status/events, then run `npm run security:encrypt-google-tokens -- --clear-plaintext`. If Calendar credentials, Supabase service credentials, or the encryption key are missing, protected Calendar endpoints fail closed.

## API Security

Protected APIs require `Authorization: Bearer <Supabase access token>`. The backend verifies the token with Supabase Auth and loads workspace membership before allowing billing, invites, Google Calendar, communications, AI, or Kira Recruit actions. Client-supplied identity fields such as `actorRole`, `userId`, `ownerEmail`, or `stripeCustomerId` are not used for authorization. See `SECURITY.md` for the endpoint matrix and test commands.

## Local Demo Mode

Local demo mode is still fully supported:

- Missing Supabase variables: CRM/account data stays in `localStorage`.
- Missing Stripe variables: billing buttons show setup guidance instead of opening Checkout.
- Missing Resend variables: invites are staged locally and a fallback invite link plus demo temporary password is copied/shown.
- Missing Google Calendar variables or cloud workspace: appointments remain in the CRM calendar.
- Missing production backend on a static host: frontend calls fail gracefully with demo messages.
- Public demo access: visitors can explore without login, but demo mode does not cloud sync or unlock paid production usage.
- Coming soon previews: Kira Recruit and Residential Lead Generator show demo links and early-access prompts for non-enabled roles.

## Live Vs Demo Vs Manual

- Live/back-end-ready: CRM workflows, role navigation, Supabase-ready persistence, Stripe base plan endpoints, Resend invite endpoint, Google Calendar endpoint, AI/SMS/email endpoint fallbacks.
- Demo/fallback: AI when `OPENAI_API_KEY` is missing, SMS/email when Twilio/provider env vars are missing, billing when Stripe env vars are missing, calendar when OAuth is missing.
- Manual/beta: Kira Recruit can save public setup metadata for built-in and custom job boards/ATS feeds, but live provider posting/import, payroll provider payout, lead enrichment/skip trace vendors, DNC vendor contracts, add-on checkout purchase flows, and compliance/legal review still require provider setup and approvals.

## Command Centers

- Customer Daily Command Center: visit `#daily-command` or `/daily-command-center`. It uses authenticated, tenant-scoped Supabase data when live and falls back to clearly labeled local/demo calculations when the backend is unavailable.
- Founder Launch Command Center: visit `/launch-command-center`. It requires a signed-in Supabase user plus server-side internal access through `INTERNAL_ADMIN_EMAILS`; the allowlist is never exposed to the browser. The launch recommendation now evaluates stage-specific `GO`, `CONDITIONAL_GO`, and `NO_GO` rules from `command-center-config.js`.
- See `docs/DAILY_COMMAND_CENTER.md`, `docs/LAUNCH_COMMAND_CENTER.md`, `docs/LAUNCH_SCORING.md`, and `docs/BETA_CERTIFICATION.md`.

## UI Architecture

- The CRM shell uses grouped navigation, standard page-header descriptions, restrained status colors, and a mobile drawer for primary navigation.
- Before changing layout patterns, review `docs/UI_CLUTTER_AUDIT.md`, `docs/DESIGN_SYSTEM.md`, `docs/NAVIGATION_ARCHITECTURE.md`, `docs/RESPONSIVE_LAYOUTS.md`, `docs/UI_FEATURE_PRESERVATION_CHECKLIST.md`, and `docs/ACCESSIBILITY.md`.
- New pages should add a stable route label, breadcrumb, one-sentence page description, role-aware sidebar item, and interaction coverage before launch.

Run `npm run release:check` before a beta/prod deployment. It includes build, route inventory, security tests, command-center policy tests, daily-goal tests, team-attribution tests, full Playwright tests, browser smoke, and secret scan.

## Production Deployment Checklist

For Vercel:

1. Import the GitHub repo.
2. Keep Framework Preset as **Other**.
3. Use Build Command `npm run build`.
4. Use Output Directory `dist`.
5. Add all Supabase, Stripe, Resend, and `APP_BASE_URL` env vars.
6. Deploy. The `api/[...path].js` function handles backend API routes.

For Netlify:

1. Use Build Command `npm run build`.
2. Use Publish Directory `dist`.
3. Add the same env vars.
4. Add equivalent serverless functions or deploy the Node server behind the site for `/api/...` routes.
5. Confirm Stripe webhook URL points at the deployed backend.

## Monday Launch Checklist

Before launch:

1. Run `npm install`.
2. Run `npm run build`.
3. Run `npm test`.
4. Apply `supabase-schema.sql` in the Supabase SQL editor.
5. Configure Supabase Auth Site URL and Redirect URL to the production domain.
6. Add production env vars in Vercel or Netlify:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `STRIPE_PRICE_STARTER`
   - `STRIPE_PRICE_GROWTH`
   - `STRIPE_PRICE_SCALE`
   - `APP_BASE_URL`
   - `RESEND_API_KEY`
   - `INVITE_FROM_EMAIL`
   - `SUPPORT_EMAIL`
   - `INTERNAL_ADMIN_EMAILS`
7. Create Stripe products/prices and connect the webhook endpoint at `/api/stripe/webhook`.
8. Verify the Resend sender domain and confirm `INVITE_FROM_EMAIL` can send invites.
9. Enable Google Calendar API, add OAuth credentials, rerun `supabase-schema.sql`, and connect Calendar from the Calendar page.
10. Smoke test CRM dashboard, Admin billing, billing portal, invite send/accept, mobile viewport, Kira Recruit, Lead Generator, and Google Calendar appointment sync on the deployed URL.
11. Confirm `/api/...` routes return JSON from the backend and not the SPA fallback page.
12. Leave demo mode available so missing production services show setup guidance instead of breaking the app.

## Deploy On Netlify

1. Create a GitHub repository for this folder.
2. Push the project to GitHub.
3. Go to Netlify and choose **Add new site**.
4. Import the GitHub repository.
5. Use these settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Deploy.

## What This Version Stores

Without Supabase environment variables, the app runs in demo mode and stores CRM/account data in the browser with `localStorage`. With Supabase configured, leads, tasks, automations, activity, workspace members, subscription state, and invitations can sync to the cloud.

## SaaS Foundation Included

This build includes:

- User signup/login through Supabase Auth
- Workspace/account setup
- Team members and staged invitations
- Plan/seat management for Starter, Growth, and Scale
- Stripe checkout, customer portal, and webhook backend endpoints with demo fallback
- Resend-ready team invite delivery with secure invite token fallback
- Google Calendar OAuth connection and appointment event sync
- Founder Launch Command Center, launch scoring, beta checklist, blocker tracking, provider status, and admin audit trail
- Customer Daily Command Center with live tenant-scoped priorities, goals, pipeline health, schedule, and role-aware team performance
- Supabase schema and RLS policies for CRM data, subscriptions, and invitations
- CRM pipeline, contacts, tasks, automations, activity, CSV import/export, backups, revenue goals, and channel reporting
- Standalone Kira Recruit add-on for job setup, job-board connector metadata, applicant intake, interview booking, onboarding packet staging, payroll workflow staging, and live CRM candidate handoff
