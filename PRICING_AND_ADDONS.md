# Pricing And Coming Soon Apps

ClosePilot base CRM plans and coming soon app previews should be shown separately so marketers and buyers understand what is included today.

## Base CRM Plans

| Plan | Demo Price | Seats | Positioning |
| --- | ---: | ---: | --- |
| Starter | $29/mo | 75 | Solo workflow, core CRM, exports, backups |
| Growth | $79/mo | 200 | Expanded team seats, source reporting, automations, forecasting |
| Scale | $199/mo | Unlimited | Unlimited seats, admin controls, rollout support |

## Coming Soon App Previews

| Add-On | Demo Price | Positioning |
| --- | ---: | --- |
| Kira Recruit | $99/mo | Applicant pipeline, AI candidate summaries, interview tracking, onboarding, payroll staging, CRM candidate sync |
| Residential Lead Gen | $149/mo | Territory lists, property data imports, skip trace planning, DNC-aware exports, CRM handoff |
| Recruit + Lead Gen Bundle | $199/mo | Both background apps for teams scaling staffing and lead flow together |

These prices are positioning estimates for future checkout. The CRM is the live paid product today.

## Preview Access States

| State | What Users See | Intended Use |
| --- | --- | --- |
| Demo preview | Full demo experience, clear demo labels, local/browser persistence only | Sales demos, marketer walkthroughs, internal testing |
| Preview enabled | Working preview UI, CRM handoff, local/Supabase-ready persistence where configured | Private beta customers after manual early-access approval |
| Preview locked | Coming soon card with View Demo and Back to CRM | Manager/member accounts without preview access |

Kira Recruit and Residential Lead Generator both include consistent navigation back to the CRM, coming soon badges, and locked-state cards. Lead Generator exports also create audit-style rows and remind users to verify consent/DNC compliance before outreach.

## Future Stripe Env Vars

These are documented for future add-on checkout work. Current CRM launch keeps these apps in preview mode.

```text
STRIPE_PRICE_ADDON_RECRUIT=
STRIPE_PRICE_ADDON_LEADGEN=
STRIPE_PRICE_ADDON_BUNDLE=
```

## Demo/Fallback Notes

- Coming soon cards show View Demo and early-access interest positioning.
- Managers and Members should see guidance to use demo preview or ask an admin for early access.
- If future app Stripe price IDs are missing, the UI should remain in setup/demo mode rather than pretending checkout is live.
- Future app price IDs are documented now so checkout can be wired later without changing the pricing story.
