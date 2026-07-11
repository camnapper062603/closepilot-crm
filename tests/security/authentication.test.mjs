import assert from "node:assert/strict";
import test from "node:test";
import { createMockFetch, installMockEnvironment, postApi, workspaceA } from "./helpers/api-harness.mjs";

const originalFetch = global.fetch;

test.beforeEach(() => {
  installMockEnvironment();
  global.fetch = createMockFetch();
});

test.afterEach(() => {
  global.fetch = originalFetch;
});

test("protected endpoints require a Supabase bearer token", async () => {
  const response = await postApi("/api/communications/save-draft", { workspaceId: workspaceA, body: "test" }, { auth: false });
  assert.equal(response.statusCode, 401);
  assert.equal(response.body.error.code, "AUTH_REQUIRED");
});

test("malformed authorization headers fail closed", async () => {
  const response = await postApi("/api/communications/save-draft", { workspaceId: workspaceA }, { authorization: "Basic abc" });
  assert.equal(response.statusCode, 401);
  assert.equal(response.body.error.code, "AUTH_MALFORMED");
});

test("ambiguous authorization headers fail closed", async () => {
  const response = await postApi("/api/communications/save-draft", { workspaceId: workspaceA }, { headers: { authorization: "Bearer a, Bearer b" } });
  assert.equal(response.statusCode, 401);
  assert.equal(response.body.error.code, "AUTH_AMBIGUOUS");
});

test("non-json API requests are rejected before provider work", async () => {
  const response = await postApi(
    "/api/communications/save-draft",
    {},
    { contentType: "text/plain", rawBody: "workspaceId=bad" },
  );
  assert.equal(response.statusCode, 415);
  assert.equal(response.body.error.code, "UNSUPPORTED_MEDIA_TYPE");
});
