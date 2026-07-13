import assert from "node:assert/strict";
import test from "node:test";
import { calculateDailyGoalProgress } from "../../command-center-config.js";

const now = "2026-03-08T06:30:00.000Z";
const timezone = "America/New_York";
const userA = "11111111-1111-4111-8111-111111111111";
const userB = "99999999-9999-4999-8999-999999999999";

function progress(input = {}) {
  return calculateDailyGoalProgress({
    now,
    timezone,
    role: "manager",
    goals: {
      calls: 1,
      contacts_reached: 2,
      follow_ups_completed: 1,
      appointments_booked: 1,
      new_leads: 1,
      tasks_completed: 1,
      proposals_sent: 1,
      sales_closed: 1,
      revenue_won: 1000,
      emails_sent: 1,
      sms_sent: 1,
      ...input.goals,
    },
    leads: input.leads || [
      { id: "lead-new", createdAt: now, stage: "new", value: 500 },
      { id: "lead-won", createdAt: now, updatedAt: now, stage: "won", value: 1500 },
    ],
    tasks: input.tasks || [{ id: "task-done", done: true, completedAt: now, assignedTo: userA }],
    appointments: input.appointments || [{ id: "appt", createdAt: now, bookedBy: userA }],
    activities: input.activities || [
      { id: "act-call", type: "call", createdAt: now, actorUserId: userA },
      { id: "act-proposal", type: "proposal", message: "Proposal sent", createdAt: now, actorUserId: userA },
    ],
    communications: input.communications || [
      { id: "email", channel: "email", direction: "outgoing", status: "sent", provider: "resend", createdAt: now, sentBy: userA },
      { id: "sms", channel: "sms", direction: "outgoing", status: "delivered", provider: "twilio", createdAt: now, sentBy: userB },
      { id: "failed", channel: "email", direction: "outgoing", status: "failed", provider: "resend", createdAt: now, sentBy: userB },
      { id: "demo", channel: "sms", direction: "outgoing", status: "sent", provider: "demo", createdAt: now, sentBy: userA },
    ],
    calls: input.calls || [],
    currentUser: { userId: userA, email: "a@example.com" },
  });
}

test("every supported daily goal maps to an explicit calculation", () => {
  const rows = progress();
  const byKey = new Map(rows.map((row) => [row.key, row]));

  for (const key of [
    "calls",
    "contacts_reached",
    "follow_ups_completed",
    "appointments_booked",
    "new_leads",
    "tasks_completed",
    "proposals_sent",
    "sales_closed",
    "revenue_won",
    "emails_sent",
    "sms_sent",
  ]) {
    assert.ok(byKey.has(key), `${key} should be present`);
    assert.ok(byKey.get(key).calculationSource, `${key} should explain its source`);
    assert.equal(byKey.get(key).timezone, timezone);
  }
});

test("failed and demo communications do not count as sent", () => {
  const byKey = new Map(progress().map((row) => [row.key, row]));

  assert.equal(byKey.get("contacts_reached").actual, 2);
  assert.equal(byKey.get("emails_sent").actual, 1);
  assert.equal(byKey.get("sms_sent").actual, 1);
});

test("target zero, no data, exceeded target, and unsupported goals are safe", () => {
  const rows = progress({
    goals: { calls: 0, new_leads: 1, unsupported_goal: 5 },
    leads: [{ id: "lead-a", createdAt: now, stage: "new", value: 0 }, { id: "lead-b", createdAt: now, stage: "new", value: 0 }],
    communications: [],
    activities: [],
    tasks: [],
    appointments: [],
  });
  const byKey = new Map(rows.map((row) => [row.key, row]));

  assert.equal(byKey.get("calls").status, "no_target");
  assert.equal(byKey.get("contacts_reached").status, "no_data");
  assert.equal(byKey.get("new_leads").completionPercentage, 200);
  assert.equal(byKey.get("unsupported_goal").status, "unsupported");
});

test("member view uses personal progress where an actor field exists", () => {
  const rows = calculateDailyGoalProgress({
    now,
    timezone,
    role: "member",
    currentUser: { userId: userA, email: "a@example.com" },
    goals: { emails_sent: 1, sms_sent: 1 },
    communications: [
      { id: "a", channel: "email", direction: "outgoing", status: "sent", provider: "resend", createdAt: now, sentBy: userA },
      { id: "b", channel: "sms", direction: "outgoing", status: "sent", provider: "twilio", createdAt: now, sentBy: userB },
    ],
  });
  const byKey = new Map(rows.map((row) => [row.key, row]));

  assert.equal(byKey.get("emails_sent").actual, 1);
  assert.equal(byKey.get("sms_sent").actual, 0);
  assert.equal(byKey.get("emails_sent").scope, "personal");
});
