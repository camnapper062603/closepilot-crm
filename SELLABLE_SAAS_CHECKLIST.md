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
- Recruiting preview app and CRM recruiting inbox
- Lead generator preview and cost planner
- Stripe backend checkout/portal/webhook stubs with live support
- Resend invite delivery
- Supabase schema/RLS foundation
- Production readiness panel
- Demo fallback mode
- Role-restricted navigation and action guards for billing, team invites, exports, backups, lead deletes, and future app early-access paths
- Coming soon preview locked states for Kira Recruit and Residential Lead Generator
- Lead Generator export audit entries and compliance-safe export messaging
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

What is live/back-end-ready:

- Supabase schema can be rerun safely and now includes safer admin/manager/member policies for sensitive workspace tables.
- Stripe checkout, portal, and webhook endpoints exist for the base CRM plans.
- Resend invite delivery exists and falls back cleanly when email env vars are missing.
- Google Calendar endpoints exist and fall back to CRM-only appointments when OAuth is missing.
- OpenAI/Twilio/provider-backed communication can be turned on with env vars; deterministic/local fallbacks remain for demos.

What is still demo/fallback/manual:

- Add-on checkout for Kira Recruit and Residential Lead Generator is intentionally held as coming soon early-access interest, not a live Stripe purchase flow.
- Job board, payroll, lead enrichment, skip tracing, and DNC vendors are setup screens and demo workflows until provider contracts/API keys are added.
- Public records/Zillow/Redfin workflows must use authorized exports or approved APIs. The app should not be sold as an unauthorized scraper.
- Production support process, billing support, cancellation/refund terms, and compliance review still need owner approval.

Before selling:

1. Add all env vars.
2. Redeploy Vercel.
3. Run Supabase SQL schema.
4. Create your owner login.
5. Test invite, billing, communication fallback/live mode, lead import, Flow Mode, and mobile views.

Before first paying customer:

1. Run the updated schema in Supabase and confirm RLS policies with Admin, Manager, and Member test accounts.
2. Verify Stripe checkout, customer portal, and webhook state changes on the deployed domain.
3. Send and accept a Resend invite from the production domain.
4. Confirm no provider screens imply live job posting, SMS, email, payroll, skip tracing, or AI when env vars/API contracts are missing.
5. Keep Kira Recruit and Residential Lead Generator as preview-only until provider contracts, compliance, and support processes are documented.

Before public launch:

1. Add in-app terms/privacy/compliance links.
2. Complete Twilio A2P/10DLC, consent language, opt-out handling, and DNC process review.
3. Complete payroll/legal review before letting customers pay workers through the app.
4. Replace remaining demo provider workflows with real vendors or label them as beta waitlist.
5. Add monitoring, error reporting, support inbox workflow, and backup/export policy.
