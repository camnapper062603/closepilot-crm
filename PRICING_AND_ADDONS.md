# Pricing And Add-Ons

ClosePilot base CRM plans and paid add-ons should be shown separately so marketers and buyers understand what is included.

## Base CRM Plans

| Plan | Demo Price | Seats | Positioning |
| --- | ---: | ---: | --- |
| Starter | $29/mo | 3 | Solo workflow, core CRM, exports, backups |
| Growth | $79/mo | 10 | Team seats, source reporting, automations, forecasting |
| Scale | $199/mo | 25 | Higher seat limits, admin controls, rollout support |

## Paid Add-Ons

| Add-On | Demo Price | Positioning |
| --- | ---: | --- |
| Kira Recruit | $99/mo | Applicant pipeline, AI candidate summaries, interview tracking, onboarding, payroll staging, CRM candidate sync |
| Residential Lead Gen | $149/mo | Territory lists, property data imports, skip trace planning, DNC-aware exports, CRM handoff |
| Recruit + Lead Gen Bundle | $199/mo | Both background apps for teams scaling staffing and lead flow together |

## Add-On Access States

| State | What Users See | Intended Use |
| --- | --- | --- |
| Demo add-on | Full demo experience, clear demo labels, local/browser persistence only | Sales demos, marketer walkthroughs, internal testing |
| Add-on enabled | Working add-on UI, CRM handoff, local/Supabase-ready persistence where configured | Private beta customers after plan enablement |
| Locked add-on | Paid add-on card with View Demo and Ask Admin to Enable | Manager/member accounts without paid access |

Kira Recruit and Residential Lead Generator both include consistent navigation back to the CRM, paid add-on badges, and locked-state cards. Lead Generator exports also create audit-style rows and remind users to verify consent/DNC compliance before outreach.

## Future Stripe Env Vars

These are documented for future add-on checkout work. This pass does not rebuild Stripe add-on checkout.

```text
STRIPE_PRICE_ADDON_RECRUIT=
STRIPE_PRICE_ADDON_LEADGEN=
STRIPE_PRICE_ADDON_BUNDLE=
```

## Demo/Fallback Notes

- Add-on cards show View Demo and Add to Plan/Contact Sales positioning.
- Managers and Members should see guidance to ask an admin to enable paid add-ons.
- If add-on Stripe price IDs are missing, the UI should remain in setup/demo mode rather than pretending checkout is live.
- Add-on price IDs are documented now so checkout can be wired later without changing the pricing story.
