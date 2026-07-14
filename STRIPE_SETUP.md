# Stripe Setup

1. Create recurring prices for Starter, Growth, and Scale.
2. Add the price IDs to Vercel:
   - `STRIPE_PRICE_STARTER`
   - `STRIPE_PRICE_GROWTH`
   - `STRIPE_PRICE_SCALE`
3. Add `STRIPE_SECRET_KEY`.
4. Create a webhook endpoint:

```text
https://closepilot-crm.vercel.app/api/stripe/webhook
```

5. Subscribe to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
6. Add the webhook secret as `STRIPE_WEBHOOK_SECRET`.

The Admin billing layout reads the configured CRM `STRIPE_PRICE_*` IDs through the backend readiness check. When `STRIPE_SECRET_KEY` is available, the backend resolves each Stripe Price and the app displays that recurring amount. Without the secret key, billing stays in setup mode and the layout uses the safe fallback display prices.

Without Stripe vars, billing buttons show setup messages instead of fake checkout.
