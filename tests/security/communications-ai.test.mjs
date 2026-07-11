import assert from "node:assert/strict";
import test from "node:test";
import { createMockFetch, installMockEnvironment, leadId, postApi, workspaceA } from "./helpers/api-harness.mjs";

const originalFetch = global.fetch;

test.beforeEach(() => {
  installMockEnvironment();
});

test.afterEach(() => {
  global.fetch = originalFetch;
});

test("email sends require a recipient and body before provider calls", async () => {
  global.fetch = createMockFetch({ role: "member" });
  const response = await postApi("/api/communications/send-email", {
    workspaceId: workspaceA,
    leadId,
    to: "customer@example.com",
  });
  assert.equal(response.statusCode, 400);
  assert.match(response.body.error.message, /Email recipient and body/);
});

test("SMS uses demo mode when Twilio is not configured and still logs safely", async () => {
  const fetchMock = createMockFetch({ role: "member" });
  global.fetch = fetchMock;
  const response = await postApi("/api/communications/send-sms", {
    workspaceId: workspaceA,
    leadId,
    to: "+15555550123",
    body: "Hello",
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.demo, true);
  assert.ok(fetchMock.calls.some((call) => call.url.includes("/rest/v1/communications")));
});

test("AI endpoints use deterministic fallback when OpenAI is not configured", async () => {
  const fetchMock = createMockFetch({ role: "member" });
  global.fetch = fetchMock;
  const response = await postApi("/api/ai/lead-copilot", {
    workspaceId: workspaceA,
    leadId,
    lead: { id: leadId, name: "Taylor Recruit", company: "Window project", stage: "qualified" },
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.provider, "rule-based-fallback");
  assert.ok(fetchMock.calls.some((call) => call.url.includes("/rest/v1/ai_outputs")));
});
