# Email and SMS Setup

## Resend Email

1. Verify a sending domain in Resend.
2. Add `RESEND_API_KEY`.
3. Add `INVITE_FROM_EMAIL` as a verified sender address.
4. Add `SUPPORT_EMAIL`.

Team invites and email sends use Resend when configured. Otherwise ClosePilot logs/saves fallback messages and shows setup guidance.

## Twilio SMS

1. Buy or verify a Twilio sending number.
2. Add:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - `TWILIO_PHONE_NUMBER`

Without Twilio, SMS actions are logged in the CRM timeline as demo/provider-missing events.
