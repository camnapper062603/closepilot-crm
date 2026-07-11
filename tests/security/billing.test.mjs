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

test("checkout rejects unknown plan IDs instead of downgrading silently", async () => {
  global.fetch = createMockFetch({ role: "admin" });
  const response = await postApi("/api/stripe/create-checkout-session", { workspaceId: workspaceA, plan: "enterprise" });
  assert.equal(response.statusCode, 400);
  assert.equal(response.body.error.code, "INVALID_PLAN");
});

test("checkout uses server workspace access and returns setup mode without Stripe keys", async () => {
  global.fetch = createMockFetch({ role: "admin" });
  const response = await postApi("/api/stripe/create-checkout-session", {
    workspaceId: workspaceA,
    stripeCustomerId: "cus_spoofed",
    plan: "growth",
  });
  assert.equal(response.statusCode, 200);
  assert.equal(response.body.demo, true);
  assert.match(response.body.message, /Live checkout is not configured/);
});

test("webhook fails closed in live-like mode when Stripe verification is not configured", async () => {
  installMockEnvironment({ APP_MODE: "production" });
  global.fetch = createMockFetch();
  const response = await postApi("/api/stripe/webhook", { type: "customer.subscription.updated" }, { auth: false });
  assert.equal(response.statusCode, 503);
  assert.equal(response.body.error.code, "STRIPE_WEBHOOK_CONFIG_REQUIRED");
});
