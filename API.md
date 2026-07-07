# ClosePilot API

All production endpoints are POST-only and return JSON. Missing provider credentials return honest demo/setup responses.

## System

- `POST /api/system/readiness`

Returns readiness percentage, configured provider groups, missing env guidance, and demo/live mode.

## Billing

- `POST /api/stripe/create-checkout-session`
- `POST /api/stripe/create-portal-session`
- `POST /api/stripe/webhook`

## Invites

- `POST /api/invites/send`
- `POST /api/invites/accept`

## AI

- `POST /api/ai/lead-copilot`
- `POST /api/ai/daily-briefing`
- `POST /api/ai/follow-up-message`
- `POST /api/ai/manager-insights`
- `POST /api/ai/sales-coach`
- `POST /api/ai/proposal-draft`
- `POST /api/ai/conversation-summary`
- `POST /api/ai/pipeline-analysis`

## Communications

- `POST /api/communications/send-sms`
- `POST /api/communications/send-email`
- `POST /api/communications/save-draft`
- `POST /api/communications/log-call`
- `POST /api/communications/schedule-message`
- `POST /api/communications/conversation-summary`
