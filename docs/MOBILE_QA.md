# Mobile QA

## Required Widths

Test 320, 360, 375, 390, 412, 430, 768, and 1024 px widths.

## Critical Flows

- Open/close navigation drawer, Escape close, focus return.
- Add lead with required contact details.
- Move a pipeline record without desktop drag-and-drop.
- Complete/snooze tasks.
- Open communications and preserve a draft while changing views.
- Create an appointment and verify calendar sync status.
- Send a team invite from Admin.
- Save workspace settings.
- Open Founder Launch Command Center and read blockers before metrics.
- Open support report and include safe diagnostics.

## Pass Criteria

- No horizontal page overflow.
- Primary action remains discoverable.
- Touch targets are reachable.
- Dialog bodies scroll without hiding actions.
- Keyboard does not hide active form fields.
- Status and error text remains associated with controls.

Set `MOBILE_QA_COMPLETED=true` only after this matrix is verified in the deployment target.
