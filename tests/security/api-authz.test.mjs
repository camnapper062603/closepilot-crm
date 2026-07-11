import assert from "node:assert/strict";
import test from "node:test";
import {
  createMockFetch,
  installMockEnvironment,
  leadId,
  postApi,
  workspaceA,
  workspaceB,
} from "./helpers/api-harness.mjs";

const originalFetch = global.fetch;

test.beforeEach(() => {
  installMockEnvironment();
});

test.afterEach(() => {
  global.fetch = originalFetch;
});

test("member role cannot create billing checkout even with actorRole owner in body", async () => {
  global.fetch = createMockFetch({ role: "member", workspaceId: workspaceA });
  const response = await postApi("/api/stripe/create-checkout-session", {
    workspaceId: workspaceA,
    actorRole: "owner",
    stripeCustomerId: "cus_attacker",
    plan: "scale",
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error.code, "ROLE_FORBIDDEN");
});

test("workspace membership is checked against requested tenant", async () => {
  global.fetch = createMockFetch({ role: "admin", workspaceId: workspaceA, denyWorkspace: workspaceB });
  const response = await postApi("/api/invites/send", {
    workspaceId: workspaceB,
    actorRole: "owner",
    email: "intruder@example.com",
    role: "admin",
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error.code, "WORKSPACE_FORBIDDEN");
});

test("communications reject lead IDs outside the authenticated workspace", async () => {
  global.fetch = createMockFetch({ role: "manager", workspaceId: workspaceA, denyLead: true });
  const response = await postApi("/api/communications/save-draft", {
    workspaceId: workspaceA,
    leadId,
    body: "Do not cross tenant boundaries.",
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error.code, "RESOURCE_FORBIDDEN");
});

test("admin readiness returns protected diagnostics only for an authorized workspace", async () => {
  global.fetch = createMockFetch({ role: "admin", workspaceId: workspaceA });
  const response = await postApi("/api/system/readiness", { workspaceId: workspaceA });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.checkedBy, "admin@example.com");
  assert.ok(response.body.checks.some((check) => check.env === "SUPABASE_SERVICE_ROLE_KEY"));
});
