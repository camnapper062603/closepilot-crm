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

test("invite send rejects invalid roles", async () => {
  global.fetch = createMockFetch({ role: "admin" });
  const response = await postApi("/api/invites/send", {
    workspaceId: workspaceA,
    email: "new@example.com",
    role: "owner",
  });
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error.code, "INVALID_INVITE_ROLE");
});

test("members cannot send workspace invites", async () => {
  global.fetch = createMockFetch({ role: "member" });
  const response = await postApi("/api/invites/send", {
    workspaceId: workspaceA,
    email: "new@example.com",
    role: "member",
  });
  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error.code, "ROLE_FORBIDDEN");
});

test("duplicate active invites are blocked", async () => {
  global.fetch = createMockFetch({ role: "admin", duplicateInvite: "new@example.com" });
  const response = await postApi("/api/invites/send", {
    workspaceId: workspaceA,
    email: "new@example.com",
    role: "member",
  });
  assert.equal(response.statusCode, 409);
  assert.equal(response.body.error.code, "INVITE_ALREADY_EXISTS");
});

test("seat limits are enforced before staging another invite", async () => {
  global.fetch = createMockFetch({
    role: "admin",
    seatLimit: 1,
    workspaceMembers: [{ user_id: "existing" }],
    pendingInvites: [],
  });
  const response = await postApi("/api/invites/send", {
    workspaceId: workspaceA,
    email: "new@example.com",
    role: "member",
  });
  assert.equal(response.statusCode, 409);
  assert.equal(response.body.error.code, "SEAT_LIMIT_REACHED");
});

test("invite acceptance requires the signed-in email to match the invitation", async () => {
  global.fetch = createMockFetch({ email: "wrong@example.com", invitedEmail: "right@example.com" });
  const response = await postApi("/api/invites/accept", { token: "valid-token" });
  assert.equal(response.statusCode, 403);
  assert.match(response.body.error.message, /different email/);
});
