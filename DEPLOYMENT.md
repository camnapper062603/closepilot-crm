# ClosePilot Deployment

ClosePilot is deployed as a static SaaS app with lightweight serverless API routes.

## Vercel

1. Connect the GitHub repo to Vercel.
2. Use build command `npm run build`.
3. Use output directory `dist`.
4. Add every production env var from `ENVIRONMENT.md`.
5. Redeploy after env vars change.

The production API routes live under `/api/...` and are implemented as Vercel functions.

## Netlify

Netlify can serve the static app, but the backend routes need equivalent serverless functions or a hosted Node server. Vercel is the preferred production target for this repo.

## Smoke Tests

After each deploy:

- Open `https://closepilot-crm.vercel.app`.
- Check Admin -> Production readiness.
- Confirm `/api/system/readiness` returns JSON.
- Confirm `/api/invites/send` returns a JSON setup message when Resend is missing.
- Confirm `/api/stripe/create-checkout-session` returns a Stripe URL or honest setup message.
- Confirm mobile viewport loads dashboard, lead generator, and Kira Recruit.
