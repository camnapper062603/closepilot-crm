import assert from "node:assert/strict";
import test from "node:test";
import { createMockFetch, installMockEnvironment, postApi, workspaceA } from "./helpers/api-harness.mjs";

const originalFetch = global.fetch;

test.beforeEach(() => {
  installMockEnvironment();
});

test.afterEach(() => {
  global.fetch = originalFetch;
});

test("recruiting access returns a locked state for members without allowed add-on access", async () => {
  global.fetch = createMockFetch({ role: "member", addonStatus: "active" });
  const response = await postApi("/api/recruiting/access", { workspaceId: workspaceA });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.locked, true);
  assert.equal(response.body.mode, "locked");
});

test("managers can use Kira Recruit when the add-on is enabled", async () => {
  global.fetch = createMockFetch({ role: "manager", addonStatus: "active" });
  const response = await postApi("/api/recruiting/load", { workspaceId: workspaceA });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.access.mode, "live");
  assert.equal(response.body.access.module, "Kira Recruit");
});

test("only owners/admins can save recruiting integration setup", async () => {
  global.fetch = createMockFetch({ role: "manager", addonStatus: "active" });
  const response = await postApi("/api/recruiting/integration-status", {
    workspaceId: workspaceA,
    provider: "indeed",
    tokenLast4: "1234",
  });
  assert.equal(response.statusCode, 403);
  assert.match(response.body.error.message, /Only Owners and Admins/);
});

test("connector status never stores browser token secrets", async () => {
  const fetchMock = createMockFetch({ role: "admin", addonStatus: "active" });
  global.fetch = fetchMock;
  const response = await postApi("/api/recruiting/integration-status", {
    workspaceId: workspaceA,
    provider: "indeed",
    publicConfig: { tokenConfigured: true, tokenLast4: "abcd", apiToken: "secret" },
  });
  assert.equal(response.statusCode, 200);
  const integrationCall = fetchMock.calls.find((call) => call.url.includes("/rest/v1/integration_settings"));
  assert.ok(integrationCall);
  assert.equal(JSON.stringify(integrationCall.body).includes("secret"), false);
});

test("custom recruiting job board connectors store public routing metadata only", async () => {
  const fetchMock = createMockFetch({ role: "admin", addonStatus: "active" });
  global.fetch = fetchMock;
  const response = await postApi("/api/recruiting/integration-status", {
    workspaceId: workspaceA,
    provider: "Custom Local Sales Board",
    publicConfig: {
      provider: "custom-texas-sales-jobs",
      providerLabel: "Texas Sales Jobs",
      customName: "Texas Sales Jobs",
      method: "ats_feed",
      accountId: "texas-board",
      email: "jobs@example.com",
      webhookUrl: "https://kirahome.org/api/recruiting/applicants",
      postingUrl: "https://texas.example.com/post",
      feedUrl: "https://kirahome.org/recruiting/job-feed.xml",
      accessToken: "should-not-store",
      refreshToken: "should-not-store-either",
      clientSecret: "client-secret",
      tokenLast4: "7890",
    },
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.publicConfig.provider, "custom-texas-sales-jobs");
  assert.equal(response.body.publicConfig.providerLabel, "Texas Sales Jobs");
  assert.equal(response.body.publicConfig.method, "ats_feed");
  assert.equal(response.body.publicConfig.feedUrl, "https://kirahome.org/recruiting/job-feed.xml");
  const integrationCall = fetchMock.calls.find((call) => call.url.includes("/rest/v1/integration_settings"));
  assert.ok(integrationCall);
  const serialized = JSON.stringify(integrationCall.body);
  assert.equal(serialized.includes("should-not-store"), false);
  assert.equal(serialized.includes("client-secret"), false);
});

test("CRM handoff conversion is admin-only and records a team invitation", async () => {
  const fetchMock = createMockFetch({ role: "admin", addonStatus: "active" });
  global.fetch = fetchMock;
  const response = await postApi("/api/recruiting/crm-handoff", {
    workspaceId: workspaceA,
    action: "convert-team-member",
    candidate: { name: "Tyler Rusk", email: "tyler@example.com", role: "Setter" },
    memberRole: "member",
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.saved, true);
  assert.ok(fetchMock.calls.some((call) => call.url.includes("/rest/v1/workspace_invitations")));
});
