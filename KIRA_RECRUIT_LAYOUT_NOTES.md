# Kira Recruit Layout Notes

## Beta Layout

Kira Recruit now opens as a CRM-style hiring command center instead of a preview-only dashboard. The first screen answers: who should I hire next, and what do I do with them?

- Header: `Kira Recruit Command Center`, CRM/add-on status, Add Candidate, Post Job, and View Demo actions.
- KPI cards: Open roles, New applicants, Interviews this week, Top candidates, and Hires in progress, each with a visual marker and short status label.
- Main desktop layout: candidate pipeline on the left/center, sticky AI Recruiter on the right, and interviews/tasks below.
- Pipeline stages: New, Screened, Interview, Offer, Hired, and Onboarding.
- Candidate cards show name, role, score ring, source, stage, next action, last touch, and quick actions for message, schedule, move stage, and notes.
- Candidate detail sheet includes contact/profile context, score breakdown, resume placeholders, notes, timeline, interviews, AI summary, stage controls, and onboarding checklist progress.

## Mobile Layout

Mobile uses dashboard tabs: Overview, Pipeline, Interviews, Tasks, and AI. The Pipeline tab uses stage filters instead of forcing the full desktop board into the phone viewport. The AI Recruiter panel is its own mobile area, and the candidate detail opens as a bottom sheet. The regular top recruiting pages still work as separate pages, matching the CRM navigation model.

## AI Recruiter Behavior

The AI panel uses the strongest open candidate by score and current stage. In demo or fallback mode, it uses local applicant data only and labels itself as fallback/demo AI. In live mode, it reflects the authenticated CRM workspace state loaded from the backend.

The panel shows:

- best candidate and why
- suggested next action
- interview questions
- red flags to verify
- outreach draft
- copy message action
- onboarding reminder for hired/onboarding candidates

## Access States

- Demo: safe for beta demos; no secrets are stored, and provider tokens stay disabled.
- Live: uses the CRM Supabase session and backend recruiting endpoints.
- Locked: shows `Kira Recruit is a paid recruiting add-on.`, keeps live actions disabled, and gives managers/members an `Ask admin to enable` CTA.
- Setup Required / admin state: owners/admins can use `Add Kira Recruit` and configure connector metadata; provider secrets still belong server-side.

## Remaining Production Opportunities

- Replace fallback AI summaries with a server-side provider once prompt logging, consent, and audit retention are approved.
- Add real drag/drop only after keyboard-accessible stage movement and backend persistence are finalized.
- Connect job board webhooks for production applicant intake.
- Add resume attachment parsing from provider APIs or secure file upload.
- Add calendar provider booking instead of local Monday/Wednesday/Friday demo slots.
- Add payroll/onboarding provider webhooks for packet completion and payment status.
