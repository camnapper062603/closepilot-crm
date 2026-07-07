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

## Test

```bash
npm test
```

## Production Docs

- `DEPLOYMENT.md`
- `ENVIRONMENT.md`
- `SUPABASE_SETUP.md`
- `STRIPE_SETUP.md`
- `EMAIL_SMS_SETUP.md`
- `AI_SETUP.md`
- `MOBILE_SETUP.md`
- `SELLABLE_SAAS_CHECKLIST.md`
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
6. Subscription plan, status, seat limit, trial end, current period end, Stripe customer ID, and Stripe subscription ID sync into `workspace_subscriptions`.

If Stripe variables are missing, the Admin page stays in demo mode and shows a useful setup message instead of breaking.

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

The backend creates a secure invite token, stores only its SHA-256 hash in Supabase, sets an expiration, and sends the invite email through Resend. Invite emails include the invited email address, role, workspace/app name, product URL, and secure invite link.

Invite acceptance uses:

```text
POST /api/invites/accept
```

When a signed-in user opens `?invite=...`, the app accepts the invite and joins the correct workspace. If Resend or `INVITE_FROM_EMAIL` is not configured, the Admin page shows and copies a fallback invite link instead of crashing.

## Local Demo Mode

Local demo mode is still fully supported:

- Missing Supabase variables: CRM/account data stays in `localStorage`.
- Missing Stripe variables: billing buttons show setup guidance instead of opening Checkout.
- Missing Resend variables: invites are staged locally and a fallback invite link is copied/shown.
- Missing production backend on a static host: frontend calls fail gracefully with demo messages.

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
7. Create Stripe products/prices and connect the webhook endpoint at `/api/stripe/webhook`.
8. Verify the Resend sender domain and confirm `INVITE_FROM_EMAIL` can send invites.
9. Smoke test CRM dashboard, Admin billing, billing portal, invite send/accept, mobile viewport, Kira Recruit, and Lead Generator on the deployed URL.
10. Confirm `/api/...` routes return JSON from the backend and not the SPA fallback page.
11. Leave demo mode available so missing production services show setup guidance instead of breaking the app.

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
- Launch readiness checklist and admin audit trail
- Supabase schema and RLS policies for CRM data, subscriptions, and invitations
- CRM pipeline, contacts, tasks, automations, activity, CSV import/export, backups, revenue goals, and channel reporting
- Standalone Kira Recruit background app for job setup, job-board connector feeds, applicant intake, interview booking, and future CRM recruits sync
