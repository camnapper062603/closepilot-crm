import assert from "node:assert/strict";
import { PassThrough } from "node:stream";
import test from "node:test";
import { handleClosePilotApiRequest } from "../../api-handlers.js";

const workspaceA = "00000000-0000-4000-8000-000000000001";
const workspaceB = "00000000-0000-4000-8000-000000000002";
const userId = "11111111-1111-4111-8111-111111111111";
const leadId = "22222222-2222-4222-8222-222222222222";
const originalFetch = global.fetch;

test.beforeEach(() => {
  process.env.SUPABASE_URL = "https://unit-test.supabase.co";
  process.env.SUPABASE_ANON_KEY = "anon-test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-test";
  process.env.APP_BASE_URL = "http://127.0.0.1:4173";
  process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = "12345678901234567890123456789012";
});

test.afterEach(() => {
  global.fetch = originalFetch;
});

test("member role cannot create billing checkout even with actorRole owner in body", async () => {
  global.fetch = mockSupabaseFetch({ role: "member", workspaceId: workspaceA });
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
  global.fetch = mockSupabaseFetch({ role: "admin", workspaceId: workspaceA, denyWorkspace: workspaceB });
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
  global.fetch = mockSupabaseFetch({ role: "manager", workspaceId: workspaceA, denyLead: true });
  const response = await postApi("/api/communications/save-draft", {
    workspaceId: workspaceA,
    leadId,
    body: "Do not cross tenant boundaries.",
  });

  assert.equal(response.statusCode, 403);
  assert.equal(response.body.error.code, "RESOURCE_FORBIDDEN");
});

test("admin readiness returns protected diagnostics only for an authorized workspace", async () => {
  global.fetch = mockSupabaseFetch({ role: "admin", workspaceId: workspaceA });
  const response = await postApi("/api/system/readiness", { workspaceId: workspaceA });

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.checkedBy, "admin@example.com");
  assert.ok(response.body.checks.some((check) => check.env === "SUPABASE_SERVICE_ROLE_KEY"));
});

function postApi(path, body, headers = {}) {
  return new Promise((resolve) => {
    const request = new PassThrough();
    request.method = "POST";
    request.url = path;
    request.headers = {
      host: "127.0.0.1:4173",
      authorization: "Bearer valid-token",
      ...headers,
    };
    request.socket = { remoteAddress: "127.0.0.1" };

    const response = {
      statusCode: 0,
      headers: {},
      writeHead(statusCode, responseHeaders) {
        this.statusCode = statusCode;
        this.headers = responseHeaders;
      },
      end(payload) {
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: payload ? JSON.parse(payload) : {},
        });
      },
    };

    handleClosePilotApiRequest(request, response);
    request.end(JSON.stringify(body));
  });
}

function mockSupabaseFetch({ role, workspaceId, denyWorkspace = "", denyLead = false }) {
  return async (url) => {
    const href = String(url);
    if (href.includes("/auth/v1/user")) {
      return jsonResponse({ id: userId, email: "admin@example.com" });
    }
    if (href.includes("/rest/v1/workspaces")) {
      const requestedWorkspace = href.includes(encodeURIComponent(workspaceB)) ? workspaceB : workspaceId;
      return jsonResponse([{ id: requestedWorkspace, owner_id: "99999999-9999-4999-8999-999999999999", name: "Unit Workspace" }]);
    }
    if (href.includes("/rest/v1/workspace_members")) {
      if (denyWorkspace && href.includes(encodeURIComponent(denyWorkspace))) return jsonResponse([]);
      return jsonResponse([{ workspace_id: workspaceId, user_id: userId, role, team_function: null }]);
    }
    if (href.includes("/rest/v1/leads")) {
      return jsonResponse(denyLead ? [] : [{ id: leadId }]);
    }
    if (href.includes("/rest/v1/ai_outputs") || href.includes("/rest/v1/communications")) {
      return jsonResponse([]);
    }
    return jsonResponse([]);
  };
}

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
    async text() {
      return JSON.stringify(body);
    },
  };
}
