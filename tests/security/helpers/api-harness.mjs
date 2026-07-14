import { PassThrough } from "node:stream";
import { handleClosePilotApiRequest } from "../../../api-handlers.js";

export const workspaceA = "00000000-0000-4000-8000-000000000001";
export const workspaceB = "00000000-0000-4000-8000-000000000002";
export const userId = "11111111-1111-4111-8111-111111111111";
export const otherUserId = "99999999-9999-4999-8999-999999999999";
export const leadId = "22222222-2222-4222-8222-222222222222";
export const inviteId = "33333333-3333-4333-8333-333333333333";

export function installMockEnvironment(overrides = {}) {
  process.env.SUPABASE_URL = "https://unit-test.supabase.co";
  process.env.SUPABASE_ANON_KEY = "anon-test";
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-test";
  process.env.APP_BASE_URL = "http://127.0.0.1:4173";
  process.env.PRODUCT_URL = "http://127.0.0.1:4173";
  process.env.PUBLIC_DEMO_ENABLED = "false";
  process.env.APP_MODE = "test";
  process.env.GOOGLE_TOKEN_ENCRYPTION_KEY = "12345678901234567890123456789012";
  process.env.GOOGLE_TOKEN_ENCRYPTION_KEY_VERSION = "test";
  delete process.env.STRIPE_SECRET_KEY;
  delete process.env.STRIPE_WEBHOOK_SECRET;
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.TWILIO_PHONE_NUMBER;
  delete process.env.RESEND_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.GOOGLE_CALENDAR_CLIENT_ID;
  delete process.env.GOOGLE_CALENDAR_CLIENT_SECRET;
  delete process.env.TRUST_PROXY_HEADERS;
  Object.assign(process.env, overrides);
}

export async function postApi(path, body = {}, options = {}) {
  return invokeApi(path, body, { ...options, method: options.method || "POST" });
}

export async function getApi(path, options = {}) {
  return invokeApi(path, undefined, { ...options, method: "GET" });
}

async function invokeApi(path, body, options = {}) {
  return new Promise((resolve) => {
    const request = new PassThrough();
    request.method = options.method || "POST";
    request.url = path;
    request.headers = {
      host: "127.0.0.1:4173",
      "content-type": options.contentType === undefined ? "application/json" : options.contentType,
      ...(options.auth === false ? {} : { authorization: options.authorization || "Bearer valid-token" }),
      ...(options.headers || {}),
    };
    request.socket = { remoteAddress: options.remoteAddress || "127.0.0.1" };

    const response = {
      statusCode: 0,
      headers: {},
      writeHead(statusCode, responseHeaders) {
        this.statusCode = statusCode;
        this.headers = responseHeaders;
      },
      end(payload) {
        let parsed = {};
        if (payload) {
          try {
            parsed = JSON.parse(payload);
          } catch {
            parsed = String(payload);
          }
        }
        resolve({
          statusCode: this.statusCode,
          headers: this.headers,
          body: parsed,
          rawBody: payload || "",
        });
      },
    };

    handleClosePilotApiRequest(request, response);
    if (body === undefined) {
      request.end();
    } else if (options.rawBody !== undefined) {
      request.end(options.rawBody);
    } else {
      request.end(JSON.stringify(body));
    }
  });
}

export function createMockFetch(options = {}) {
  const calls = [];
  const store = {
    recruitingCandidates: [...(options.candidateRows || [])],
    recruitingState: options.recruitingState ? [options.recruitingState] : [],
  };

  const fetchMock = async (url, init = {}) => {
    const href = String(url);
    const body = parseBody(init.body);
    calls.push({ url: href, init, body });

    if (href.includes("/auth/v1/user")) {
      if (options.authInvalid) return jsonResponse({ message: "JWT expired" }, 401);
      return jsonResponse({ id: options.userId || userId, email: options.email || "admin@example.com" });
    }

    if (href.includes("/auth/v1/admin/users")) {
      return jsonResponse({ id: options.provisionedUserId || "44444444-4444-4444-8444-444444444444" }, options.authAdminStatus || 200);
    }

    if (href.includes("/rest/v1/workspaces")) {
      const requestedWorkspace = requestedWorkspaceId(href) || options.workspaceId || workspaceA;
      if (options.denyWorkspace === requestedWorkspace || options.noWorkspace) return jsonResponse([]);
      return jsonResponse([
        {
          id: requestedWorkspace,
          owner_id: options.role === "owner" ? options.userId || userId : otherUserId,
          name: "Unit Workspace",
        },
      ]);
    }

    if (href.includes("/rest/v1/workspace_members")) {
      const requestedWorkspace = requestedWorkspaceId(href) || options.workspaceId || workspaceA;
      if (options.denyWorkspace === requestedWorkspace || options.noMembership) return jsonResponse([]);
      if (href.includes("select=workspace_id,role,team_function")) {
        return jsonResponse(
          options.memberships || [
            {
              workspace_id: requestedWorkspace,
              user_id: options.userId || userId,
              role: options.role || "admin",
              team_function: options.teamFunction || null,
            },
          ],
        );
      }
      if (href.includes("select=user_id")) {
        return jsonResponse(options.workspaceMembers || [{ user_id: options.userId || userId }]);
      }
      return jsonResponse([
        {
          workspace_id: requestedWorkspace,
          user_id: options.userId || userId,
          role: options.role || "admin",
          team_function: options.teamFunction || null,
        },
      ]);
    }

    if (href.includes("/rest/v1/workspace_addons")) {
      if (options.addonMissing) return jsonResponse([]);
      return jsonResponse([
        {
          workspace_id: requestedWorkspaceId(href) || options.workspaceId || workspaceA,
          addon_key: "recruiting",
          status: options.addonStatus || "active",
          metadata: options.addonMetadata || { allowedRoles: ["owner", "admin", "manager"] },
        },
      ]);
    }

    if (href.includes("/rest/v1/workspace_subscriptions")) {
      return jsonResponse([
        {
          workspace_id: requestedWorkspaceId(href) || options.workspaceId || workspaceA,
          plan: options.plan || "growth",
          status: options.subscriptionStatus || "active",
          seat_limit: options.seatLimit ?? 300,
          stripe_customer_id: options.stripeCustomerId || "",
          stripe_subscription_id: "sub_unit",
        },
      ]);
    }

    if (href.includes("/rest/v1/workspace_invitations")) {
      if (init.method === "POST") return jsonResponse((body || []).map((row) => ({ id: inviteId, ...row })));
      if (init.method === "PATCH") return jsonResponse({});
      if (href.includes("invite_token_hash=eq.")) {
        return jsonResponse(
          options.invitation
            ? [options.invitation]
            : [
                {
                  id: inviteId,
                  workspace_id: options.workspaceId || workspaceA,
                  email: options.invitedEmail || "admin@example.com",
                  role: "member",
                  team_function: null,
                },
              ],
        );
      }
      if (href.includes("email=eq.") && options.duplicateInvite) {
        return jsonResponse([{ id: inviteId, email: options.duplicateInvite, status: "pending" }]);
      }
      if (href.includes("status=eq.pending")) return jsonResponse(options.pendingInvites || []);
      return jsonResponse([]);
    }

    if (href.includes("/rest/v1/leads")) {
      return jsonResponse(
        options.denyLead
          ? []
          : options.leadRows || [
              {
                id: leadId,
                workspace_id: options.workspaceId || workspaceA,
                name: "Unit Lead",
                company: "Unit Co",
                stage: "qualified",
                value: 12000,
                score: 82,
                next_action: "Call today",
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ],
      );
    }

    if (href.includes("/rest/v1/calendar_connections")) {
      if (init.method === "POST" || init.method === "PATCH") return jsonResponse({});
      return jsonResponse(options.googleConnection ? [options.googleConnection] : []);
    }

    if (href.includes("/rest/v1/recruiting_candidates")) {
      if (init.method === "POST") {
        store.recruitingCandidates = [...store.recruitingCandidates, ...(body || [])];
        return jsonResponse(store.recruitingCandidates);
      }
      return jsonResponse(store.recruitingCandidates);
    }

    if (href.includes("/rest/v1/recruiting_app_state")) {
      if (init.method === "POST") {
        store.recruitingState = body || [];
        return jsonResponse({});
      }
      return jsonResponse(store.recruitingState);
    }

    if (href.includes("/rest/v1/workspace_daily_goals")) {
      if (init.method === "POST") return jsonResponse(body || []);
      return jsonResponse(options.dailyGoals ? [{ goals: options.dailyGoals, updated_at: new Date().toISOString() }] : []);
    }

    if (href.includes("/rest/v1/launch_blockers")) {
      if (init.method === "POST") return jsonResponse(body || []);
      return jsonResponse(options.launchBlockers || []);
    }
    if (href.includes("/rest/v1/launch_checklist_items")) {
      if (init.method === "POST") return jsonResponse(body || []);
      return jsonResponse(options.launchChecklist || []);
    }
    if (href.includes("/rest/v1/launch_provider_status")) return jsonResponse(options.launchProviders || []);
    if (href.includes("/rest/v1/launch_readiness_categories")) return jsonResponse(options.launchCategories || []);
    if (href.includes("/rest/v1/launch_beta_accounts")) {
      if (init.method === "POST") return jsonResponse(body || []);
      return jsonResponse(options.launchBetaAccounts || []);
    }
    if (href.includes("/rest/v1/launch_status_snapshots")) {
      if (init.method === "POST") return jsonResponse(body || []);
      return jsonResponse(options.launchStatusSnapshots || []);
    }

    if (href.includes("/rest/v1/tasks")) {
      if (init.method === "POST") return jsonResponse([{ id: "55555555-5555-4555-8555-555555555555" }]);
      return jsonResponse(options.taskRows || [{ id: "55555555-5555-4555-8555-555555555555", text: "Unit task", due: "today", done: false }]);
    }
    if (href.includes("/rest/v1/appointments")) return jsonResponse(options.appointmentRows || []);
    if (href.includes("/rest/v1/activities")) {
      if (init.method === "POST") return jsonResponse([{ id: "66666666-6666-4666-8666-666666666666" }]);
      return jsonResponse(options.activityRows || [{ id: "66666666-6666-4666-8666-666666666666", type: "call", message: "Called lead", created_at: new Date().toISOString() }]);
    }
    if (href.includes("/rest/v1/communications")) return jsonResponse(options.communicationRows || []);
    if (href.includes("/rest/v1/notifications")) return jsonResponse(options.notificationRows || []);
    if (href.includes("/rest/v1/ai_outputs")) return jsonResponse([]);
    if (href.includes("/rest/v1/integration_settings")) return jsonResponse([]);
    if (href.includes("/rest/v1/workspace_audit_events")) return jsonResponse([]);

    if (href.includes("https://api.twilio.com")) return jsonResponse({ sid: "SM_unit" });
    if (href.includes("https://api.resend.com")) return jsonResponse({ id: "email_unit" });
    if (href.includes("https://api.openai.com")) {
      return jsonResponse({ choices: [{ message: { content: JSON.stringify({ summary: "OpenAI mock summary" }) } }] });
    }
    if (href.includes("https://oauth2.googleapis.com/token")) {
      return jsonResponse({ access_token: "google-access", refresh_token: "google-refresh", expires_in: 3600, scope: "calendar" });
    }
    if (href.includes("https://openidconnect.googleapis.com")) return jsonResponse({ email: "calendar@example.com" });
    if (href.includes("https://www.googleapis.com/calendar")) return jsonResponse({ id: "event_unit", htmlLink: "https://calendar/unit" });

    return jsonResponse([]);
  };
  fetchMock.calls = calls;
  fetchMock.store = store;
  return fetchMock;
}

export function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    async json() {
      return body;
    },
    async text() {
      return body === undefined ? "" : JSON.stringify(body);
    },
  };
}

function requestedWorkspaceId(href) {
  const match = href.match(/workspace_id=eq\.([^&]+)/);
  return match ? decodeURIComponent(match[1]) : "";
}

function parseBody(body) {
  if (!body) return undefined;
  try {
    return JSON.parse(String(body));
  } catch {
    return body;
  }
}
