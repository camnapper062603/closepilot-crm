# Troubleshooting

## App Stays In Demo Mode

Check live `config.js`. If `supabaseUrl` and `supabaseAnonKey` are empty, add Supabase env vars in Vercel and redeploy.

## Invite Sends But Only Shows A Link

Add `RESEND_API_KEY` and `INVITE_FROM_EMAIL`. Verify the sender domain in Resend.

## Checkout Shows Setup Message

Add `STRIPE_SECRET_KEY` and the correct `STRIPE_PRICE_*` IDs. Add webhook secret for subscription sync.

## SMS Logs But Does Not Send

Add Twilio vars and verify the phone number can send to your customer region.

## AI Says Fallback

Add `OPENAI_API_KEY` in Vercel. The key is used server-side only.

## Supabase Insert Fails

Run `supabase-schema.sql` again. It is idempotent and safe to rerun after updates.
