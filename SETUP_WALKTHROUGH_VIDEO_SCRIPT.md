# Kira Home Live Setup Walkthrough

Use this as a teleprompter script, Loom outline, or AI-video prompt. Target length: 8 to 10 minutes.

## AI Video Prompt

Create a clean, step-by-step screen-recording style walkthrough for setting up the Kira Home web app for production. The video should feel like a calm technical onboarding guide for a founder preparing a SaaS app launch. Show browser dashboard mockups for Vercel, Supabase, Stripe, Resend, Twilio, OpenAI, and Google Cloud. Use clear chapter cards, zoom in on environment variable names, and never display real secret values. Emphasize which keys are public-safe and which keys must stay secret. End with a final production readiness check inside the Kira Home Admin page.

## Scene 1: Goal Of The Setup

On screen: Kira Home Admin production readiness checklist.

Voiceover:
In this walkthrough, we are taking Kira Home from demo mode to live production setup. We will connect Supabase for auth and database, Stripe for checkout and billing portal, Resend for invite emails, Twilio for SMS, OpenAI for live AI, and Google Calendar for appointment sync.

On-screen checklist:
- Supabase database and auth
- Stripe checkout and billing portal
- Resend invite emails
- Twilio SMS
- OpenAI live AI
- Google Calendar OAuth
- Final redeploy and readiness check

## Scene 2: Vercel Environment Rules

On screen: Vercel project -> Settings -> Environment Variables.

Voiceover:
All production configuration lives in Vercel Environment Variables. Do not paste service secrets into GitHub, frontend files, README files, screenshots, or chat messages. Vercel stores environment variables encrypted, and the app reads them during build and serverless function execution.

Important note:
Supabase has three values. The Supabase project URL and anon key are public browser configuration. They are safe to expose to the frontend because Supabase Row Level Security protects the data. The service role key is different. The service role key bypasses Row Level Security and must stay secret.

On-screen key safety table:

| Variable | Safe in browser? | Where to put it |
| --- | --- | --- |
| `SUPABASE_URL` | Yes | Vercel Production and Preview |
| `SUPABASE_ANON_KEY` | Yes | Vercel Production and Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Vercel secret/sensitive env only |
| `STRIPE_SECRET_KEY` | No | Vercel secret/sensitive env only |
| `STRIPE_WEBHOOK_SECRET` | No | Vercel secret/sensitive env only |
| `RESEND_API_KEY` | No | Vercel secret/sensitive env only |
| `TWILIO_AUTH_TOKEN` | No | Vercel secret/sensitive env only |
| `OPENAI_API_KEY` | No | Vercel secret/sensitive env only |
| `GOOGLE_CALENDAR_CLIENT_SECRET` | No | Vercel secret/sensitive env only |

What to click:
1. Open Vercel.
2. Open the Kira Home project.
3. Go to Settings.
4. Go to Environment Variables.
5. Add variables for Production and Preview.
6. Use Development too only if you plan to run `vercel dev` or pull env vars locally.
7. Redeploy after changes.

## Scene 3: Supabase Project And Schema

On screen: Supabase dashboard.

Voiceover:
Start with Supabase because it is the foundation. Supabase handles user accounts, workspace data, tasks, leads, subscriptions, invitations, calendar tokens, and AI output logs.

What to click:
1. Create or open the Supabase project.
2. Go to Project Settings.
3. Open API.
4. Copy the Project URL into `SUPABASE_URL`.
5. Copy the anon or publishable key into `SUPABASE_ANON_KEY`.
6. Copy the service role key into `SUPABASE_SERVICE_ROLE_KEY`.
7. In Vercel, mark service role as secret or sensitive if that option is available.

Important:
`SUPABASE_URL` must be only the project base URL, like `https://your-project-ref.supabase.co`.
Do not paste the REST endpoint, and do not include `/rest/v1/` at the end.

Voiceover:
Next, run the database schema.

What to click:
1. In Supabase, open SQL Editor.
2. Click New Query.
3. Open `supabase-schema.sql` from the repo.
4. Copy the entire file.
5. Paste it into the SQL Editor.
6. Click Run.

On-screen note:
The schema file is idempotent. It uses `create table if not exists`, safe `alter table` statements, RLS policies, functions, and indexes. It can be rerun later when the app changes.

Auth URL setup:
1. In Supabase, go to Authentication.
2. Go to URL Configuration.
3. Set Site URL to `https://kirahome.org` or the final production domain.
4. Add the same production URL as an allowed redirect URL.

## Scene 4: Stripe Checkout And Billing Portal

On screen: Stripe dashboard.

Voiceover:
Stripe powers the Starter, Growth, and Scale plan checkout, plus the billing portal after a customer exists.

What to click:
1. Open Stripe.
2. Go to Product Catalog.
3. Create a Starter product with a recurring monthly price of 29 dollars.
4. Create a Growth product with a recurring monthly price of 79 dollars.
5. Create a Scale product with a recurring monthly price of 199 dollars.
6. Copy each price ID. They start with `price_`.

Add to Vercel:
```text
STRIPE_PRICE_STARTER=price_...
STRIPE_PRICE_GROWTH=price_...
STRIPE_PRICE_SCALE=price_...
STRIPE_SECRET_KEY=sk_...
```

Webhook setup:
1. In Stripe, go to Developers.
2. Go to Webhooks.
3. Add endpoint.
4. Use `https://kirahome.org/api/stripe/webhook`.
5. Subscribe to `checkout.session.completed`.
6. Subscribe to `customer.subscription.created`.
7. Subscribe to `customer.subscription.updated`.
8. Subscribe to `customer.subscription.deleted`.
9. Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

Voiceover:
The billing portal will work after a workspace completes checkout and Stripe has a customer ID for that workspace.

## Scene 5: Resend Invite Emails

On screen: Resend dashboard.

Voiceover:
Resend sends team invites and future outbound email. The app can fall back to copyable invite links, but production should use a verified sender domain.

What to click:
1. Open Resend.
2. Go to Domains.
3. Add your sending domain.
4. Add the required DNS records where your domain DNS is managed.
5. Wait for verification.
6. Go to API Keys.
7. Create a sending API key.

Add to Vercel:
```text
RESEND_API_KEY=re_...
INVITE_FROM_EMAIL=invites@yourdomain.com
SUPPORT_EMAIL=support@yourdomain.com
```

On-screen note:
`INVITE_FROM_EMAIL` must use a verified Resend domain.

## Scene 6: Twilio SMS

On screen: Twilio Console.

Voiceover:
Twilio powers live SMS. Without Twilio, the app logs SMS activity as demo/provider-missing events.

What to click:
1. Open Twilio Console.
2. Buy or verify a sending phone number.
3. Open Account Info.
4. Copy Account SID.
5. Copy Auth Token.
6. Copy the Twilio phone number.

Add to Vercel:
```text
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_PHONE_NUMBER=+15551234567
```

On-screen note:
Use E.164 phone format: plus sign, country code, and number.

## Scene 7: OpenAI Live AI

On screen: OpenAI platform.

Voiceover:
OpenAI powers live AI responses for sales copilot, manager insights, daily briefings, proposal drafts, summaries, and follow-up messages. Without this key, the app still works with deterministic fallback AI.

What to click:
1. Open the OpenAI platform.
2. Go to API keys.
3. Create a new API key.
4. Copy it once and store it securely.

Add to Vercel:
```text
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

## Scene 8: Google Calendar OAuth

On screen: Google Cloud Console.

Voiceover:
Google Calendar OAuth lets a workspace connect Google Calendar so appointments can sync outside the app.

What to click:
1. Open Google Cloud Console.
2. Create or select a project.
3. Go to APIs and Services.
4. Enable Google Calendar API.
5. Configure the OAuth consent screen.
6. Create OAuth Client ID.
7. Choose Web application.
8. Add this authorized redirect URI: `https://kirahome.org/api/google/calendar/callback`.
9. Copy the client ID and client secret.

Add to Vercel:
```text
GOOGLE_CALENDAR_CLIENT_ID=...
GOOGLE_CALENDAR_CLIENT_SECRET=...
GOOGLE_CALENDAR_REDIRECT_URI=https://kirahome.org/api/google/calendar/callback
```

## Scene 9: Redeploy

On screen: Vercel Deployments tab.

Voiceover:
After environment variables are added or changed, redeploy. Old deployments do not automatically receive new environment variable values.

What to click:
1. Go to Vercel Deployments.
2. Choose the latest production deployment.
3. Click Redeploy.
4. Wait for Ready status.
5. Open the production URL.

## Scene 10: Final App Check

On screen: Kira Home login, then Admin production readiness.

Voiceover:
Now open the app. Sign in or create the first owner account. The first signed-in user becomes the workspace owner. Go to Admin and check production readiness.

Expected result:
- Database should show ready.
- Stripe checkout should show ready.
- Billing portal should be ready after checkout creates a customer.
- Email invites should show ready when Resend is configured.
- SMS should show ready when Twilio is configured.
- AI services should show ready when OpenAI is configured.
- Calendar should show ready when Google OAuth credentials are configured.

Final verification prompt:
Ask Codex: "Check the deployed readiness endpoint, confirm Supabase env vars are present in Vercel, and verify the expected Supabase tables exist without printing secrets."

## Closing

Voiceover:
That is the live setup path. Supabase is the foundation, Stripe handles paid plans, Resend handles invites, Twilio handles SMS, OpenAI powers live AI, and Google Calendar syncs appointments. Keep secret keys out of source code, redeploy after every environment change, and use the Admin readiness checklist as the final launch signal.
