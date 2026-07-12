import assert from "node:assert/strict";
import test from "node:test";
import { buildDailyCommandCenterSnapshot, launchRecommendation } from "../../command-center-config.js";
import { createMockFetch, installMockEnvironment, postApi, workspaceA, workspaceB } from "./helpers/api-harness.mjs";

const originalFetch = global.fetch;

test.beforeEach(() => {
  installMockEnvironment();
});

test.afterEach(() => {
  global.fetch = originalFetch;
});

test("launch command center requires an internal allowlisted Supabase user", async () => {
  process.env.INTERNAL_ADMIN_EMAILS = "founder@example.com";
  global.fetch = createMockFetch({ email: "admin@example.com", role: "owner", workspaceId: workspaceA });

  const response = await postApi("/api/launch-command-center/overview", { workspaceId: workspaceA });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error.code, "INTERNAL_ACCESS_FORBIDDEN");
});

test("launch command center returns deterministic NO-GO when critical blockers are open", async () => {
  process.env.INTERNAL_ADMIN_EMAILS = "founder@example.com";
  global.fetch = createMockFetch({
    email: "founder@example.com",
    role: "owner",
    workspaceId: workspaceA,
    launchBlockers: [
      {
        id: "77777777-7777-4777-8777-777777777777",
        title: "Email confirmations failing",
        severity: "critical",
        status: "open",
      },
    ],
    launchChecklist: [{ item_key: "auth-confirmed", completed: true }],
  });

  const response = await postApi("/api/launch-command-center/overview", { workspaceId: workspaceA });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.recommendation.status, "NO_GO");
  assert.equal(response.body.releaseHealth.openCriticalBlockers, 1);
  assert.equal(response.body.providers.find((provider) => provider.key === "ci_status").displayStatus, "Not connected");
});

test("dashboard command center rejects cross-tenant workspace access", async () => {
  global.fetch = createMockFetch({ role: "manager", workspaceId: workspaceA, denyWorkspace: workspaceB });

  const response = await postApi("/api/dashboard/daily-command-center", { workspaceId: workspaceB });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error.code, "WORKSPACE_FORBIDDEN");
});

test("member role cannot load team performance endpoint", async () => {
  global.fetch = createMockFetch({ role: "member", workspaceId: workspaceA });

  const response = await postApi("/api/dashboard/team-performance", { workspaceId: workspaceA });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error.code, "ROLE_FORBIDDEN");
});

test("daily goals can be updated only by admins and owners", async () => {
  global.fetch = createMockFetch({ role: "admin", workspaceId: workspaceA });
  const saved = await postApi("/api/workspace/daily-goals", {
    workspaceId: workspaceA,
    action: "update",
    goals: { calls: 40, followUps: 25, appointments: 4, newLeads: 8, revenue: 50000 },
  });

  assert.equal(saved.statusCode, 200);
  assert.equal(saved.body.goals.calls, 40);

  global.fetch = createMockFetch({ role: "member", workspaceId: workspaceA });
  const denied = await postApi("/api/workspace/daily-goals", {
    workspaceId: workspaceA,
    action: "update",
    goals: { calls: 1 },
  });

  assert.equal(denied.statusCode, 403);
  assert.equal(denied.body.error.code, "ROLE_FORBIDDEN");
});

test("daily command metrics are explainable and role-aware", () => {
  const now = "2026-07-12T14:00:00.000Z";
  const snapshot = buildDailyCommandCenterSnapshot({
    now,
    role: "member",
    goals: { revenue: 100000 },
    leads: [
      { id: "lead-a", name: "Hot Lead", stage: "proposal", value: 20000, score: 91, updated_at: now },
      { id: "lead-b", name: "Won Lead", stage: "won", value: 10000, score: 90, updated_at: now },
    ],
    tasks: [{ id: "task-a", text: "Call", due: "today", done: false }],
    appointments: [{ id: "appt-a", title: "Demo", starts_at: now }],
    activities: [{ id: "act-a", type: "call", message: "Called", created_at: now }],
  });

  assert.equal(snapshot.kpis.find((kpi) => kpi.key === "hot_leads").value, 1);
  assert.equal(snapshot.kpis.find((kpi) => kpi.key === "won_month").value, 10000);
  assert.equal(snapshot.today.appointments.length, 1);
  assert.equal(snapshot.teamPerformance.locked, true);
});

test("launch recommendation allows GO only after score, checklist, blocker, and provider gates pass", () => {
  const recommendation = launchRecommendation({
    readinessScore: 92,
    blockers: [],
    checklist: Array.from({ length: 10 }, (_item, index) => ({ completed: index < 9 })),
    providers: [{ key: "database", required: true, configured: true }],
  });

  assert.equal(recommendation.status, "GO");
});
