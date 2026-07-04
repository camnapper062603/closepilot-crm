import { createHash, randomBytes } from "node:crypto";
import Stripe from "stripe";
import { sendInviteEmailWithResend } from "./email-service.js";

const planCatalog = {
  starter: { label: "Starter", seatLimit: 3, priceEnv: "STRIPE_PRICE_STARTER" },
  growth: { label: "Growth", seatLimit: 10, priceEnv: "STRIPE_PRICE_GROWTH" },
  scale: { label: "Scale", seatLimit: 25, priceEnv: "STRIPE_PRICE_SCALE" },
};

let stripeClient;

export function isClosePilotApiPath(pathname) {
  return (
    pathname === "/api/stripe/create-checkout-session" ||
    pathname === "/api/stripe/create-portal-session" ||
    pathname === "/api/stripe/webhook" ||
    pathname === "/api/invites/send" ||
    pathname === "/api/invites/accept"
  );
}

export async function handleClosePilotApiRequest(request, response) {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    if (url.pathname === "/api/stripe/webhook") {
      await handleStripeWebhook(request, response);
      return;
    }

    const payload = await readJsonBody(request);

    if (url.pathname === "/api/stripe/create-checkout-session") {
      await handleCreateCheckoutSession(request, response, payload);
      return;
    }
    if (url.pathname === "/api/stripe/create-portal-session") {
      await handleCreatePortalSession(request, response, payload);
      return;
    }
    if (url.pathname === "/api/invites/send") {
      await handleSendInvite(request, response, payload);
      return;
    }
    if (url.pathname === "/api/invites/accept") {
      await handleAcceptInvite(response, payload);
      return;
    }

    sendJson(response, 404, { error: "API route not found" });
  } catch (error) {
    sendJson(response, error.statusCode || 500, { error: error.message || String(error) });
  }
}

async function handleCreateCheckoutSession(request, response, payload) {
  const stripe = getStripeClient();
  const planId = normalizePlanId(payload.plan);
  const priceId = process.env[planCatalog[planId].priceEnv] || "";
  const workspaceId = cleanText(payload.workspaceId);
  const baseUrl = appBaseUrl(request);

  if (!stripe || !priceId) {
    sendJson(response, 200, {
      demo: true,
      message: `Live checkout is not configured. Add STRIPE_SECRET_KEY and ${planCatalog[planId].priceEnv} to enable ${planCatalog[planId].label}.`,
    });
    return;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: cleanText(payload.stripeCustomerId) || undefined,
    customer_email: cleanEmail(payload.ownerEmail) || undefined,
    client_reference_id: workspaceId || undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/?billing=success#admin`,
    cancel_url: `${baseUrl}/?billing=cancelled#admin`,
    metadata: {
      workspaceId,
      plan: planId,
    },
    subscription_data: {
      metadata: {
        workspaceId,
        plan: planId,
      },
    },
  });

  if (workspaceId) {
    await syncSubscriptionToSupabase({
      workspaceId,
      plan: planId,
      status: "trialing",
      seatLimit: planCatalog[planId].seatLimit,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : "",
      stripeSubscriptionId: "",
    });
  }

  sendJson(response, 200, { url: session.url, sessionId: session.id });
}

async function handleCreatePortalSession(request, response, payload) {
  const stripe = getStripeClient();
  const workspaceId = cleanText(payload.workspaceId);
  const baseUrl = appBaseUrl(request);
  let customerId = cleanText(payload.stripeCustomerId);

  if (!customerId && workspaceId) {
    const subscription = await loadSubscriptionFromSupabase(workspaceId);
    customerId = cleanText(subscription?.stripe_customer_id);
  }

  if (!stripe || !customerId) {
    sendJson(response, 200, {
      demo: true,
      message: "Billing portal is not ready yet. Add STRIPE_SECRET_KEY and complete a checkout so a Stripe customer ID exists.",
    });
    return;
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${baseUrl}/#admin`,
  });

  sendJson(response, 200, { url: session.url });
}

async function handleStripeWebhook(request, response) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";
  const rawBody = await readRawBody(request);

  if (!stripe || !webhookSecret) {
    sendJson(response, 200, {
      received: true,
      demo: true,
      message: "Stripe webhook received in demo mode. Add STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET to verify events.",
    });
    return;
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, request.headers["stripe-signature"], webhookSecret);
  } catch (error) {
    sendJson(response, 400, { error: `Webhook signature verification failed: ${error.message}` });
    return;
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const subscriptionId = typeof session.subscription === "string" ? session.subscription : "";
    if (subscriptionId) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId);
      await syncStripeSubscription(subscription, {
        workspaceId: session.metadata?.workspaceId || session.client_reference_id,
        plan: session.metadata?.plan,
        customerId: typeof session.customer === "string" ? session.customer : "",
      });
    }
  }

  if (event.type.startsWith("customer.subscription.")) {
    await syncStripeSubscription(event.data.object);
  }

  sendJson(response, 200, { received: true });
}

async function handleSendInvite(request, response, payload) {
  const workspaceId = cleanText(payload.workspaceId);
  const inviteId = cleanText(payload.inviteId);
  const email = cleanEmail(payload.email);
  const role = ["admin", "member"].includes(payload.role) ? payload.role : "member";
  const workspaceName = cleanText(payload.workspaceName) || "Kira Home";
  const inviterEmail = cleanEmail(payload.inviterEmail) || process.env.SUPPORT_EMAIL || "support@kira.local";
  const productUrl = cleanUrl(payload.productUrl, appBaseUrl(request));
  const inviteFromEmail = cleanEmail(process.env.INVITE_FROM_EMAIL || "");

  if (!email) {
    sendJson(response, 400, { error: "Invite email is required." });
    return;
  }

  const token = randomBytes(32).toString("hex");
  const inviteTokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + 7 * 86400000).toISOString();
  const inviteLink = `${appBaseUrl(request)}/?invite=${token}`;

  if (workspaceId && inviteId) {
    await updateInviteTokenInSupabase({ workspaceId, inviteId, inviteTokenHash, expiresAt });
  }

  const delivery = await sendInviteEmailWithResend({
    to: email,
    from: inviteFromEmail,
    replyTo: inviterEmail,
    workspaceName,
    appName: "Kira Home",
    role,
    productUrl,
    inviteLink,
  });

  if (!delivery.sent) {
    sendJson(response, 200, {
      demo: true,
      sent: false,
      inviteLink,
      expiresAt,
      message: delivery.message,
    });
    return;
  }

  sendJson(response, 200, {
    sent: true,
    inviteLink,
    expiresAt,
    message: `Invite email sent to ${email}.`,
  });
}

async function handleAcceptInvite(response, payload) {
  const token = cleanText(payload.token);
  const userId = cleanText(payload.userId);
  const userEmail = cleanEmail(payload.email);

  if (!token || !userId || !userEmail) {
    sendJson(response, 400, { error: "Invite token, user ID, and email are required." });
    return;
  }

  if (!hasSupabaseServiceConfig()) {
    sendJson(response, 200, {
      demo: true,
      accepted: false,
      message: "Invite acceptance needs SUPABASE_SERVICE_ROLE_KEY in production.",
    });
    return;
  }

  const tokenHash = hashToken(token);
  const invitation = await findInvitationByTokenHash(tokenHash);
  if (!invitation) {
    sendJson(response, 404, { error: "Invite link is invalid or expired." });
    return;
  }

  if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
    sendJson(response, 403, { error: "This invite belongs to a different email address." });
    return;
  }

  await upsertWorkspaceMember({
    workspaceId: invitation.workspace_id,
    userId,
    role: invitation.role,
  });
  await markInvitationAccepted(invitation.id);

  sendJson(response, 200, {
    accepted: true,
    workspaceId: invitation.workspace_id,
    message: "Invite accepted. Workspace access is ready.",
  });
}

async function syncStripeSubscription(subscription, override = {}) {
  const workspaceId = cleanText(override.workspaceId || subscription.metadata?.workspaceId);
  if (!workspaceId) return;
  const plan = normalizePlanId(override.plan || subscription.metadata?.plan || planFromStripeSubscription(subscription));

  await syncSubscriptionToSupabase({
    workspaceId,
    plan,
    status: subscription.status || "active",
    seatLimit: planCatalog[plan].seatLimit,
    stripeCustomerId:
      cleanText(override.customerId) ||
      (typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id || ""),
    stripeSubscriptionId: subscription.id,
    trialEndsAt: unixToIso(subscription.trial_end),
    currentPeriodEnd: unixToIso(subscription.current_period_end),
  });
}

async function syncSubscriptionToSupabase(subscription) {
  if (!hasSupabaseServiceConfig() || !subscription.workspaceId) {
    return { synced: false };
  }

  const row = {
    workspace_id: subscription.workspaceId,
    plan: normalizePlanId(subscription.plan),
    status: normalizeSubscriptionStatus(subscription.status),
    seat_limit: subscription.seatLimit || planCatalog[normalizePlanId(subscription.plan)].seatLimit,
    stripe_customer_id: subscription.stripeCustomerId || null,
    stripe_subscription_id: subscription.stripeSubscriptionId || null,
    trial_ends_at: subscription.trialEndsAt || null,
    current_period_end: subscription.currentPeriodEnd || null,
    updated_at: new Date().toISOString(),
  };

  await supabaseRequest("workspace_subscriptions?on_conflict=workspace_id", {
    method: "POST",
    body: [row],
    prefer: "resolution=merge-duplicates,return=minimal",
  });

  return { synced: true };
}

async function loadSubscriptionFromSupabase(workspaceId) {
  if (!hasSupabaseServiceConfig() || !workspaceId) return null;
  const rows = await supabaseRequest(
    `workspace_subscriptions?workspace_id=eq.${encodeURIComponent(workspaceId)}&select=*`,
    { method: "GET" },
  );
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function updateInviteTokenInSupabase({ workspaceId, inviteId, inviteTokenHash, expiresAt }) {
  if (!hasSupabaseServiceConfig()) return;
  await supabaseRequest(
    `workspace_invitations?id=eq.${encodeURIComponent(inviteId)}&workspace_id=eq.${encodeURIComponent(workspaceId)}`,
    {
      method: "PATCH",
      body: {
        invite_token_hash: inviteTokenHash,
        expires_at: expiresAt,
        status: "pending",
      },
      prefer: "return=minimal",
    },
  );
}

async function findInvitationByTokenHash(tokenHash) {
  const rows = await supabaseRequest(
    `workspace_invitations?invite_token_hash=eq.${encodeURIComponent(tokenHash)}&status=eq.pending&expires_at=gt.${encodeURIComponent(
      new Date().toISOString(),
    )}&select=*`,
    { method: "GET" },
  );
  return Array.isArray(rows) ? rows[0] || null : null;
}

async function upsertWorkspaceMember({ workspaceId, userId, role }) {
  await supabaseRequest("workspace_members?on_conflict=workspace_id,user_id", {
    method: "POST",
    body: [{ workspace_id: workspaceId, user_id: userId, role }],
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}

async function markInvitationAccepted(inviteId) {
  await supabaseRequest(`workspace_invitations?id=eq.${encodeURIComponent(inviteId)}`, {
    method: "PATCH",
    body: {
      status: "accepted",
      accepted_at: new Date().toISOString(),
    },
    prefer: "return=minimal",
  });
}

async function supabaseRequest(path, { method, body, prefer } = {}) {
  const response = await fetch(`${process.env.SUPABASE_URL.replace(/\/$/, "")}/rest/v1/${path}`, {
    method: method || "GET",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
      ...(prefer ? { prefer } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await response.text();
  let data = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!response.ok) {
    const message = data?.message || data?.hint || text || `Supabase request failed with ${response.status}.`;
    const error = new Error(message);
    error.statusCode = response.status;
    throw error;
  }

  return data;
}

function getStripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  stripeClient ||= new Stripe(process.env.STRIPE_SECRET_KEY);
  return stripeClient;
}

function hasSupabaseServiceConfig() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function normalizePlanId(plan) {
  return planCatalog[plan] ? plan : "starter";
}

function normalizeSubscriptionStatus(status) {
  if (status === "trialing") return "trialing";
  if (status === "canceled" || status === "incomplete_expired") return "canceled";
  if (["past_due", "incomplete", "unpaid", "paused"].includes(status)) return "past_due";
  return "active";
}

function planFromStripeSubscription(subscription) {
  const priceId = subscription.items?.data?.[0]?.price?.id || "";
  const match = Object.entries(planCatalog).find(([, plan]) => process.env[plan.priceEnv] === priceId);
  return match?.[0] || "starter";
}

function unixToIso(value) {
  return value ? new Date(value * 1000).toISOString() : null;
}

function appBaseUrl(request) {
  return (
    process.env.APP_BASE_URL ||
    `${request.headers["x-forwarded-proto"] || "http"}://${request.headers["x-forwarded-host"] || request.headers.host || "localhost:4173"}`
  ).replace(/\/$/, "");
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function cleanText(value) {
  return String(value || "").trim();
}

function cleanEmail(value) {
  const email = cleanText(value).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function cleanUrl(value, fallback) {
  const fallbackUrl = cleanText(fallback);
  const text = cleanText(value) || fallbackUrl;
  try {
    return new URL(text).toString().replace(/\/$/, "");
  } catch {
    return fallbackUrl;
  }
}

function readJsonBody(request) {
  return readRawBody(request).then((body) => {
    try {
      return body.length ? JSON.parse(body.toString("utf8")) : {};
    } catch {
      const error = new Error("Invalid JSON request body.");
      error.statusCode = 400;
      throw error;
    }
  });
}

function readRawBody(request) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > 1000000) {
        reject(new Error("Request body is too large."));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => resolve(Buffer.concat(chunks)));
    request.on("error", reject);
  });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "access-control-allow-origin": process.env.APP_BASE_URL || "*",
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "content-type, stripe-signature",
    "content-type": "application/json; charset=utf-8",
  });
  response.end(statusCode === 204 ? "" : JSON.stringify(payload));
}
