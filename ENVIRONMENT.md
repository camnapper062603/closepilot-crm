# Environment Variables

Do not expose secret keys in browser runtime config. Only `SUPABASE_URL`, `SUPABASE_ANON_KEY`, public URLs, and non-secret emails are used client-side.

## Supabase

- `SUPABASE_URL`: Supabase project URL.
- `SUPABASE_ANON_KEY`: Supabase anon/publishable key, including newer `sb_publishable_...` keys.
- `SUPABASE_SERVICE_ROLE_KEY`: backend-only service role key.

## Stripe

- `STRIPE_SECRET_KEY`: backend-only Stripe secret key.
- `STRIPE_WEBHOOK_SECRET`: webhook signing secret.
- `STRIPE_PRICE_STARTER`: Starter recurring price ID.
- `STRIPE_PRICE_GROWTH`: Growth recurring price ID.
- `STRIPE_PRICE_SCALE`: Scale recurring price ID.

## Email

- `RESEND_API_KEY`: backend-only Resend API key.
- `INVITE_FROM_EMAIL`: verified sender email.
- `SUPPORT_EMAIL`: support/reply-to email.

## SMS

- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_PHONE_NUMBER`

Missing Twilio vars keep SMS in demo/log-only mode.

## AI

- `OPENAI_API_KEY`: backend-only key for AI endpoints.
- `OPENAI_MODEL`: optional model override.

Missing OpenAI vars keep deterministic fallback AI active.

## Calendar

- `GOOGLE_CALENDAR_CLIENT_ID`
- `GOOGLE_CALENDAR_CLIENT_SECRET`
- `GOOGLE_CALENDAR_REDIRECT_URI`

Calendar is currently a production-ready placeholder until OAuth is configured.

## App URLs

- `APP_BASE_URL`: deployed app URL.
- `PRODUCT_URL`: public product URL used in emails.
