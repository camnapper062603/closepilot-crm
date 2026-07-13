import assert from "node:assert/strict";
import test from "node:test";
import { buildTeamPerformance } from "../../command-center-config.js";

const now = "2026-07-12T14:00:00.000Z";
const userA = "11111111-1111-4111-8111-111111111111";
const userB = "99999999-9999-4999-8999-999999999999";

function team(input = {}) {
  return buildTeamPerformance({
    now,
    timezone: "America/Chicago",
    members: [
      { userId: userA, email: "user-a@example.com", role: "manager" },
      { userId: userB, email: "user-b@example.com", role: "member" },
    ],
    leads: input.leads || [
      { id: "lead-a", assignedTo: userA, stage: "proposal", value: 5000, createdAt: now },
      { id: "lead-b", assignedTo: userB, stage: "won", value: 9000, createdAt: now, updatedAt: now },
      { id: "lead-unassigned", stage: "new", value: 1000, createdAt: now },
    ],
    tasks: input.tasks || [
      { id: "task-a", assignedTo: userA, done: false, due: "2026-07-11" },
      { id: "task-b", assignedTo: userA, completedBy: userB, done: true, completedAt: now },
    ],
    appointments: input.appointments || [{ id: "appt-a", bookedBy: userA, createdAt: now }],
    activities: input.activities || [
      { id: "call-a", type: "call", actorUserId: userA, createdAt: now },
      { id: "follow-b", type: "follow_up", actorUserId: userB, createdAt: now },
    ],
    communications: input.communications || [
      { id: "email-a", channel: "email", direction: "outgoing", status: "sent", provider: "resend", sentBy: userA, createdAt: now },
      { id: "sms-b", channel: "sms", direction: "outgoing", status: "delivered", provider: "twilio", sentBy: userB, createdAt: now },
      { id: "failed-b", channel: "email", direction: "outgoing", status: "failed", provider: "resend", sentBy: userB, createdAt: now },
      { id: "demo-a", channel: "sms", direction: "outgoing", status: "sent", provider: "demo", sentBy: userA, createdAt: now },
      { id: "unknown", channel: "email", direction: "outgoing", status: "sent", provider: "resend", createdAt: now },
    ],
    calls: input.calls || [{ id: "call-log-a", recordedBy: userA, createdAt: now }],
  });
}

test("workspace activity is not duplicated across every member", () => {
  const result = team();
  const userARow = result.members.find((member) => member.userId === userA);
  const userBRow = result.members.find((member) => member.userId === userB);

  assert.equal(userARow.emailsSent, 1);
  assert.equal(userBRow.emailsSent, 0);
  assert.equal(userARow.smsSent, 0);
  assert.equal(userBRow.smsSent, 1);
  assert.equal(userARow.callsLogged, 2);
  assert.equal(userBRow.callsLogged, 0);
});

test("unattributed activity is counted under unknown instead of every member", () => {
  const result = team();
  const unknown = result.members.find((member) => member.key === "unknown");

  assert.ok(unknown);
  assert.equal(unknown.emailsSent, 1);
  assert.equal(result.members.find((member) => member.userId === userA).emailsSent, 1);
  assert.equal(result.members.find((member) => member.userId === userB).emailsSent, 0);
});

test("appointment, completed task, overdue task, and revenue attribution are per user", () => {
  const result = team();
  const userARow = result.members.find((member) => member.userId === userA);
  const userBRow = result.members.find((member) => member.userId === userB);
  const unassigned = result.members.find((member) => member.key === "unassigned");

  assert.equal(userARow.appointmentsBooked, 1);
  assert.equal(userARow.overdueTasks, 1);
  assert.equal(userBRow.tasksCompleted, 1);
  assert.equal(userBRow.wonValue, 9000);
  assert.equal(unassigned.openLeads, 1);
});

test("workspace totals equal attributed plus unassigned and unknown rows", () => {
  const result = team();
  const summedEmails = result.members.reduce((sum, member) => sum + member.emailsSent, 0);
  const summedSms = result.members.reduce((sum, member) => sum + member.smsSent, 0);

  assert.equal(result.totals.emailsSent, summedEmails);
  assert.equal(result.totals.smsSent, summedSms);
});
