import assert from "node:assert/strict";
import test from "node:test";
import { monitoringStatus, captureMonitoringEvent } from "../../lib/monitoring.js";
import { createMockFetch, getApi, installMockEnvironment, postApi, workspaceA, workspaceB } from "../security/helpers/api-harness.mjs";

const originalFetch = global.fetch;

test.beforeEach(() => {
  installMockEnvironment();
});

test.afterEach(() => {
  global.fetch = originalFetch;
});

test("public health endpoints return coarse status and request IDs", async () => {
  global.fetch = createMockFetch();
  const live = await getApi("/api/health/live", { auth: false, headers: { "x-request-id": "health-live-unit" } });
  assert.equal(live.statusCode, 200);
  assert.equal(live.headers["x-request-id"], "health-live-unit");
  assert.equal(live.body.status, "ok");

  const ready = await getApi("/api/health/ready", { auth: false });
  assert.equal(ready.statusCode, 200);
  assert.equal(typeof ready.body.ready, "boolean");
  assert.equal(JSON.stringify(ready.body).includes("SUPABASE_SERVICE_ROLE_KEY"), false);
  assert.equal(ready.body.checks.some((check) => check.key === "monitoring"), true);
});

test("founder operations health is protected and redacts operational metadata", async () => {
  installMockEnvironment({ INTERNAL_ADMIN_EMAILS: "admin@example.com" });
  global.fetch = createMockFetch({
    operationalEvents: [
      {
        provider: "twilio",
        operation: "send_sms",
        workspace_id: workspaceA,
        safe_error_code: "TWILIO_SEND_FAILED",
        outcome: "failed",
        retryable: true,
        request_id: "ops-unit",
        metadata: { authorization: "Bearer secret-token-value", harmless: "visible" },
      },
    ],
  });
  const response = await getApi("/api/admin/operations/health");
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.checkedBy, "admin@example.com");
  assert.equal(response.body.providerFailures.length, 1);
  assert.equal(response.body.providerFailures[0].metadata.authorization, "[redacted]");
  assert.equal(response.body.providerFailures[0].metadata.harmless, "visible");
});

test("workspace provider failures are scoped to the requested workspace", async () => {
  global.fetch = createMockFetch({
    role: "manager",
    operationalEvents: [
      { provider: "resend", operation: "send_email", workspace_id: workspaceA, safe_error_code: "RESEND_SEND_FAILED", outcome: "failed" },
      { provider: "stripe", operation: "webhook", workspace_id: workspaceB, safe_error_code: "STRIPE_WEBHOOK_FAILED", outcome: "failed" },
    ],
  });
  const response = await postApi("/api/workspace/operations/provider-failures", { workspaceId: workspaceA });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.workspaceId, workspaceA);
  assert.equal(response.body.providerFailures.length, 1);
  assert.equal(response.body.providerFailures[0].provider, "resend");
});

test("support report stores only safe diagnostics and returns a request ID", async () => {
  const fetchMock = createMockFetch({ role: "member" });
  global.fetch = fetchMock;
  const response = await postApi(
    "/api/support/report",
    {
      workspaceId: workspaceA,
      description: "The calendar page showed an error.",
      includeDiagnostics: true,
      route: "#calendar",
      browser: "Unit Browser",
      viewport: "390x844",
    },
    { headers: { "x-request-id": "support-unit" } },
  );
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.reported, true);
  assert.equal(response.body.requestId, "support-unit");
  assert.equal(fetchMock.store.operationalEvents.length, 1);
  const event = fetchMock.store.operationalEvents[0];
  assert.equal(event.workspace_id, workspaceA);
  assert.equal(JSON.stringify(event).includes("The calendar page showed an error."), false);
});

test("monitoring stays provider-neutral and redacts secrets when disabled", () => {
  const status = monitoringStatus({ MONITORING_ENABLED: "false", SENTRY_DSN: "" });
  assert.equal(status.status, "not_configured");
  const result = captureMonitoringEvent(
    { type: "unit", authorization: "Bearer secret-token-value", nested: { api_key: "sk_live_unit" } },
    { MONITORING_ENABLED: "false", SENTRY_DSN: "" },
  );
  assert.equal(result.captured, false);
  assert.equal(result.event.authorization, "[redacted]");
  assert.equal(result.event.nested.api_key, "[redacted]");
});
