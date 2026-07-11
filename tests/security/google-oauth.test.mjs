import assert from "node:assert/strict";
import test from "node:test";
import { createMockFetch, getApi, installMockEnvironment, postApi, workspaceA } from "./helpers/api-harness.mjs";

const originalFetch = global.fetch;

test.beforeEach(() => {
  installMockEnvironment();
});

test.afterEach(() => {
  global.fetch = originalFetch;
});

test("Google connect stays in demo/setup mode without OAuth credentials", async () => {
  global.fetch = createMockFetch({ role: "admin" });
  const response = await postApi("/api/google/calendar/connect", { workspaceId: workspaceA });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.demo, true);
  assert.equal(response.body.connected, false);
});

test("Google connect requires token encryption before live OAuth starts", async () => {
  installMockEnvironment({
    GOOGLE_CALENDAR_CLIENT_ID: "client",
    GOOGLE_CALENDAR_CLIENT_SECRET: "secret",
    GOOGLE_TOKEN_ENCRYPTION_KEY: "",
  });
  global.fetch = createMockFetch({ role: "admin" });
  const response = await postApi("/api/google/calendar/connect", { workspaceId: workspaceA });
  assert.equal(response.statusCode, 503);
  assert.equal(response.body.error.code, "GOOGLE_TOKEN_ENCRYPTION_REQUIRED");
});

test("Google status never returns raw stored tokens", async () => {
  installMockEnvironment({ GOOGLE_CALENDAR_CLIENT_ID: "client", GOOGLE_CALENDAR_CLIENT_SECRET: "secret" });
  global.fetch = createMockFetch({
    role: "member",
    googleConnection: {
      workspace_id: workspaceA,
      status: "connected",
      google_account_email: "calendar@example.com",
      calendar_id: "primary",
      access_token: "plaintext-access",
      refresh_token: "plaintext-refresh",
    },
  });
  const response = await postApi("/api/google/calendar/status", { workspaceId: workspaceA });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.connected, true);
  assert.equal("access_token" in response.body, false);
  assert.equal("refresh_token" in response.body, false);
});

test("Google callback with invalid state redirects to a safe app URL", async () => {
  global.fetch = createMockFetch({ role: "admin" });
  const response = await getApi("/api/google/calendar/callback?code=abc&state=bad");
  assert.equal(response.statusCode, 200);
  assert.match(response.rawBody, /calendar=error/);
  assert.match(response.headers["x-frame-options"], /DENY/);
});
