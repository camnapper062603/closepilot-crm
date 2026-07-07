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

Without Stripe vars, billing buttons show setup messages instead of fake checkout.
