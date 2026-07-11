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

test("public readiness omits protected server secret names", async () => {
  global.fetch = createMockFetch({ role: "admin" });
  const response = await postApi("/api/system/readiness", {}, { auth: false });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.checkedBy, undefined);
  assert.equal(response.body.checks.some((check) => check.env), false);
});

test("API responses include security headers and request IDs", async () => {
  global.fetch = createMockFetch({ role: "admin" });
  const response = await postApi("/api/system/readiness", { workspaceId: workspaceA }, { headers: { "x-request-id": "unit-request" } });
  assert.equal(response.headers["x-request-id"], "unit-request");
  assert.match(response.headers["content-security-policy"], /frame-ancestors 'none'/);
  assert.equal(response.headers["x-frame-options"], "DENY");
  assert.equal(response.headers["cache-control"], "no-store");
});

test("CORS preflight rejects disallowed origins", async () => {
  global.fetch = createMockFetch();
  const response = await postApi("/api/system/readiness", {}, {
    method: "OPTIONS",
    auth: false,
    headers: { origin: "https://evil.example" },
  });
  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error.code, "CORS_FORBIDDEN");
});

test("CORS preflight allows the configured app origin", async () => {
  global.fetch = createMockFetch();
  const response = await postApi("/api/system/readiness", {}, {
    method: "OPTIONS",
    auth: false,
    headers: { origin: "http://127.0.0.1:4173" },
  });
  assert.equal(response.statusCode, 204);
  assert.equal(response.headers["access-control-allow-origin"], "http://127.0.0.1:4173");
});

test("limited endpoint families return retry-after when rate limited", async () => {
  global.fetch = createMockFetch({ role: "member" });
  let response;
  for (let index = 0; index < 25; index += 1) {
    response = await postApi(
      "/api/ai/lead-copilot",
      { workspaceId: workspaceA },
      { remoteAddress: "rate-limit-unit" },
    );
  }
  assert.equal(response.statusCode, 429);
  assert.equal(response.body.error.code, "RATE_LIMITED");
  assert.ok(Number(response.headers["retry-after"]) >= 1);
});
