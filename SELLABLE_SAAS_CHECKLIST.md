# Sellable SaaS Checklist

Implemented:

- CRM dashboard and Daily Command Center
- Flow Mode
- Lead Intelligence
- Time Saved Engine
- Smart Follow-Up Queue
- Communications Hub with provider abstraction
- AI Sales Manager UI
- Automation builder
- Recruiting app and CRM recruiting inbox
- Lead generator and cost planner
- Stripe backend checkout/portal/webhook stubs with live support
- Resend invite delivery
- Supabase schema/RLS foundation
- Production readiness panel
- Demo fallback mode
- Mobile/PWA readiness

Manual setup still required:

- Supabase URL/keys and schema run
- Stripe products/prices/webhook
- Resend verified sending domain
- Twilio SMS credentials
- OpenAI API key
- Google Calendar OAuth
- production domain/DNS
- app-store signing

Before selling:

1. Add all env vars.
2. Redeploy Vercel.
3. Run Supabase SQL schema.
4. Create your owner login.
5. Test invite, billing, communication fallback/live mode, lead import, Flow Mode, and mobile views.
