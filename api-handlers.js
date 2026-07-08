import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import Stripe from "stripe";
import { sendInviteEmailWithResend } from "./email-service.js";

const planCatalog = {
  starter: { label: "Starter", seatLimit: 3, priceEnv: "STRIPE_PRICE_STARTER", productEnv: "STRIPE_PRODUCT_STARTER" },
  growth: { label: "Growth", seatLimit: 10, priceEnv: "STRIPE_PRICE_GROWTH", productEnv: "STRIPE_PRODUCT_GROWTH" },
  scale: { label: "Scale", seatLimit: 25, priceEnv: "STRIPE_PRICE_SCALE", productEnv: "STRIPE_PRODUCT_SCALE" },
};

const aiEndpoints = new Set([
  "/api/ai/lead-copilot",
  "/api/ai/daily-briefing",
  "/api/ai/follow-up-message",
  "/api/ai/manager-insights",
  "/api/ai/sales-coach",
  "/api/ai/proposal-draft",
  "/api/ai/conversation-summary",
  "/api/ai/pipeline-analysis",
]);

const communicationEndpoints = new Set([
  "/api/communications/send-sms",
  "/api/communications/send-email",
  "/api/communications/save-draft",
  "/api/communications/log-call",
  "/api/communications/schedule-message",
  "/api/communications/conversation-summary",
]);

const readinessChecks = [
  { key: "supabaseUrl", label: "Supabase project URL", env: "SUPABASE_URL", public: true },
  { key: "supabaseAnonKey", label: "Supabase anon or publishable key", env: "SUPABASE_ANON_KEY", public: true },
  { key: "supabaseServiceRole", label: "Supabase service role key", env: "SUPABASE_SERVICE_ROLE_KEY" },
  { key: "stripeSecret", label: "Stripe secret key", env: "STRIPE_SECRET_KEY" },
  { key: "stripePublishable", label: "Stripe publishable key", env: "STRIPE_PUBLISHABLE_KEY", public: true, optional: true },
  { key: "stripeWebhook", label: "Stripe webhook secret", env: "STRIPE_WEBHOOK_SECRET" },
  { key: "stripeStarter", label: "Stripe Starter price", env: "STRIPE_PRICE_STARTER", optional: true },
  { key: "stripeGrowth", label: "Stripe Growth price", env: "STRIPE_PRICE_GROWTH", optional: true },
  { key: "stripeScale", label: "Stripe Scale price", env: "STRIPE_PRICE_SCALE", optional: true },
  { key: "stripeStarterProduct", label: "Stripe Starter product", env: "STRIPE_PRODUCT_STARTER", optional: true },
  { key: "stripeGrowthProduct", label: "Stripe Growth product", env: "STRIPE_PRODUCT_GROWTH", optional: true },
  { key: "stripeScaleProduct", label: "Stripe Scale product", env: "STRIPE_PRODUCT_SCALE", optional: true },
  { key: "stripeMeterKey", label: "Stripe meter key", env: "STRIPE_METER_KEY", optional: true },
  { key: "appBaseUrl", label: "Application base URL", env: "APP_BASE_URL", public: true },
  { key: "resend", label: "Resend API key", env: "RESEND_API_KEY" },
  { key: "inviteFrom", label: "Invite sender email", env: "INVITE_FROM_EMAIL" },
  { key: "supportEmail", label: "Support email", env: "SUPPORT_EMAIL", public: true },
  { key: "twilioSid", label: "Twilio account SID", env: "TWILIO_ACCOUNT_SID" },
  { key: "twilioToken", label: "Twilio auth token", env: "TWILIO_AUTH_TOKEN" },
  { key: "twilioPhone", label: "Twilio phone number", env: "TWILIO_PHONE_NUMBER" },
  { key: "openai", label: "OpenAI API key", env: "OPENAI_API_KEY" },
  { key: "calendarClient", label: "Google Calendar OAuth client", env: "GOOGLE_CALENDAR_CLIENT_ID" },
  { key: "calendarSecret", label: "Google Calendar OAuth secret", env: "GOOGLE_CALENDAR_CLIENT_SECRET" },
];

let stripeClient;
const rateLimitBuckets = new Map();

export function isClosePilotApiPath(pathname) {
  return (
    pathname === "/api/stripe/create-checkout-session" ||
    pathname === "/api/stripe/create-portal-session" ||
    pathname === "/api/stripe/webhook" ||
    pathname === "/api/invites/send" ||
    pathname === "/api/invites/accept" ||
    pathname === "/api/google/calendar/connect" ||
    pathname === "/api/google/calendar/callback" ||
    pathname === "/api/google/calendar/status" ||
    pathname === "/api/google/calendar/create-event" ||
    pathname === "/api/system/readiness" ||
    aiEndpoints.has(pathname) ||
    communicationEndpoints.has(pathname)
  );
}

export async function handleClosePilotApiRequest(request, response) {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (url.pathname === "/api/google/calendar/callback" && request.method === "GET") {
    await handleGoogleCalendarCallback(request, response, url);
    return;
  }

  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed" });
    return;
  }

  try {
    assertRateLimit(request, url.pathname);

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
    if (url.pathname === "/api/system/readiness") {
      await handleSystemReadiness(request, response, payload);
      return;
    }
    if (url.pathname === "/api/google/calendar/connect") {
      await handleGoogleCalendarConnect(request, response, payload);
      return;
    }
    if (url.pathname === "/api/google/calendar/status") {
      await handleGoogleCalendarStatus(response, payload);
      return;
    }
    if (url.pathname === "/api/google/calendar/create-event") {
      await handleGoogleCalendarCreateEvent(response, payload);
      return;
    }
    if (aiEndpoints.has(url.pathname)) {
      await handleAiRequest(url.pathname, request, response, payload);
      return;
    }
    if (communicationEndpoints.has(url.pathname)) {
      await handleCommunicationRequest(url.pathname, request, response, payload);
      return;
    }

    sendJson(response, 404, { error: "API route not found" });
  } catch (error) {
    sendJson(response, error.statusCode || 500, { error: error.message || String(error) });
  }
}

async function handleSystemReadiness(request, response) {
  const checks = readinessChecks.map((check) => ({
    key: check.key,
    label: check.label,
    env: check.env,
    configured: Boolean(process.env[check.env]),
    public: Boolean(check.public),
  }));
  const groups = {
    database: ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    billing:
      Boolean(process.env.STRIPE_SECRET_KEY) &&
      Boolean(process.env.STRIPE_WEBHOOK_SECRET) &&
      Object.values(planCatalog).every((plan) => Boolean(process.env[plan.priceEnv] || process.env[plan.productEnv])),
    email: ["RESEND_API_KEY", "INVITE_FROM_EMAIL"],
    sms: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
    ai: ["OPENAI_API_KEY"],
    calendar: ["GOOGLE_CALENDAR_CLIENT_ID", "GOOGLE_CALENDAR_CLIENT_SECRET"],
    app: ["APP_BASE_URL"],
  };
  const groupStatus = Object.fromEntries(
    Object.entries(groups).map(([key, envs]) => [
      key,
      Array.isArray(envs) ? envs.every((env) => Boolean(process.env[env])) : Boolean(envs),
    ]),
  );
  const required = checks.filter((check) => !check.optional && !["SUPPORT_EMAIL"].includes(check.env));
  const configured = required.filter((check) => check.configured).length;
  const percentage = Math.round((configured / required.length) * 100);

  sendJson(response, 200, {
    ready: percentage >= 80 && groupStatus.database,
    percentage,
    mode: groupStatus.database ? "live-ready" : "demo",
    checkedAt: new Date().toISOString(),
    appBaseUrl: appBaseUrl(request),
    groups: groupStatus,
    checks,
    warnings: launchWarnings(groupStatus),
  });
}

async function handleAiRequest(pathname, request, response, payload) {
  validateWorkspacePayload(payload);
  const intent = pathname.split("/").pop();
  const fallback = buildRuleBasedAiResponse(intent, payload);

  if (!process.env.OPENAI_API_KEY) {
    await saveAiOutput(payload, intent, fallback, { demo: true });
    sendJson(response, 200, {
      demo: true,
      provider: "rule-based-fallback",
      message: "OpenAI is not configured. Using deterministic ClosePilot fallback AI.",
      ...fallback,
    });
    return;
  }

  const prompt = aiPromptForIntent(intent, payload);
  const data = await callOpenAi(prompt, fallback);
  await saveAiOutput(payload, intent, data, { demo: false });
  sendJson(response, 200, {
    demo: false,
    provider: "openai",
    ...data,
  });
}

async function handleCommunicationRequest(pathname, request, response, payload) {
  validateWorkspacePayload(payload, { requireLead: false });
  const action = pathname.split("/").pop();

  if (action === "send-sms") {
    const to = cleanText(payload.to);
    const body = cleanText(payload.body);
    if (!to || !body) throwInputError("SMS recipient and body are required.");
    const result = await sendSms(payload, request);
    await saveCommunicationEvent(payload, "sms", result);
    sendJson(response, 200, result);
    return;
  }

  if (action === "send-email") {
    const to = cleanEmail(payload.to);
    const subject = cleanText(payload.subject) || "Follow-up from Kira Home";
    const body = cleanText(payload.body);
    if (!to || !body) throwInputError("Email recipient and body are required.");
    const result = await sendEmail(payload, subject);
    await saveCommunicationEvent(payload, "email", result);
    sendJson(response, 200, result);
    return;
  }

  if (action === "save-draft" || action === "schedule-message" || action === "log-call") {
    const type = action === "log-call" ? "call" : action === "save-draft" ? "draft" : "scheduled";
    const result = {
      demo: !hasSupabaseServiceConfig(),
      saved: true,
      message:
        action === "log-call"
          ? "Call logged. Connect a phone provider for live call controls."
          : action === "save-draft"
            ? "Draft saved for this conversation."
            : "Message scheduled. Connect providers before live delivery.",
    };
    await saveCommunicationEvent(payload, type, result);
    sendJson(response, 200, result);
    return;
  }

  if (action === "conversation-summary") {
    const fallback = buildRuleBasedAiResponse("conversation-summary", payload);
    await saveAiOutput(payload, "conversation-summary", fallback, { demo: !process.env.OPENAI_API_KEY });
    sendJson(response, 200, {
      demo: !process.env.OPENAI_API_KEY,
      provider: process.env.OPENAI_API_KEY ? "openai-ready" : "rule-based-fallback",
      ...fallback,
    });
    return;
  }

  sendJson(response, 404, { error: "Communication route not found" });
}

async function handleCreateCheckoutSession(request, response, payload) {
  assertAdminPayload(payload, "Only Admin or Owner access can create Stripe checkout sessions.");
  const stripe = getStripeClient();
  const planId = normalizePlanId(payload.plan);
  const priceId = stripe ? await resolveStripePlanPriceId(stripe, planId) : "";
  const workspaceId = cleanText(payload.workspaceId);
  const baseUrl = appBaseUrl(request);

  if (!stripe || !priceId) {
    sendJson(response, 200, {
      demo: true,
      message: `Live checkout is not configured. Add STRIPE_SECRET_KEY plus ${planCatalog[planId].priceEnv} or ${planCatalog[planId].productEnv} with a default recurring price to enable ${planCatalog[planId].label}.`,
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
  assertAdminPayload(payload, "Only Admin or Owner access can open the billing portal.");
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
  assertAdminPayload(payload, "Only Admin or Owner access can send workspace invites.");
  const workspaceId = cleanText(payload.workspaceId);
  const inviteId = cleanText(payload.inviteId);
  const email = cleanEmail(payload.email);
  const role = ["admin", "manager", "member"].includes(payload.role) ? payload.role : "member";
  const teamFunction = ["dialer", "setter", "closer"].includes(payload.teamFunction) ? payload.teamFunction : "";
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
  const temporaryPassword = generateTemporaryPassword();
  const temporaryPasswordHash = hashToken(temporaryPassword);
  const temporaryPasswordExpiresAt = expiresAt;
  const authProvisioning = await provisionTemporaryAuthUser({
    email,
    temporaryPassword,
    workspaceId,
    inviteId,
    role,
    teamFunction,
  });

  if (workspaceId && inviteId) {
    await updateInviteTokenInSupabase({
      workspaceId,
      inviteId,
      inviteTokenHash,
      expiresAt,
      teamFunction,
      temporaryPasswordHash,
      temporaryPasswordExpiresAt,
    });
  }

  let delivery;
  try {
    delivery = await sendInviteEmailWithResend({
      to: email,
      from: inviteFromEmail,
      replyTo: inviterEmail,
      workspaceName,
      appName: "Kira Home",
      role: teamFunction ? `${role} / ${teamFunction}` : role,
      productUrl,
      inviteLink,
      temporaryPassword,
      temporaryPasswordWorks: authProvisioning.provisioned,
      existingUser: authProvisioning.existingUser,
      authMessage: authProvisioning.message,
    });
  } catch (error) {
    delivery = {
      sent: false,
      setupError: true,
      message: `Invite link generated, but email delivery needs attention: ${error.message}`,
    };
  }

  if (!delivery.sent) {
    sendJson(response, 200, {
      demo: true,
      sent: false,
      inviteLink,
      expiresAt,
      temporaryPassword,
      requiresPasswordChange: true,
      message: delivery.message,
    });
    return;
  }

  sendJson(response, 200, {
    sent: true,
    inviteLink,
    expiresAt,
    requiresPasswordChange: true,
    message: `Invite email sent to ${email}.`,
    authProvisioning,
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
    teamFunction: invitation.team_function || "",
  });
  await markInvitationAccepted(invitation.id);

  sendJson(response, 200, {
    accepted: true,
    workspaceId: invitation.workspace_id,
    requiresPasswordChange: true,
    message: "Invite accepted. Workspace access is ready.",
  });
}

async function handleGoogleCalendarConnect(request, response, payload) {
  const workspaceId = cleanText(payload.workspaceId);
  const ownerEmail = cleanEmail(payload.ownerEmail);
  const baseUrl = appBaseUrl(request);

  if (!hasGoogleCalendarConfig()) {
    sendJson(response, 200, {
      demo: true,
      connected: false,
      message: "Google Calendar is not configured. Add GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET.",
    });
    return;
  }

  if (!workspaceId) {
    sendJson(response, 200, {
      demo: true,
      connected: false,
      message: "Google Calendar connect needs cloud mode so a workspace ID can safely store OAuth tokens.",
    });
    return;
  }

  const state = signCalendarState({ workspaceId, ownerEmail, createdAt: Date.now(), nonce: randomBytes(12).toString("hex") });
  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", process.env.GOOGLE_CALENDAR_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", googleCalendarRedirectUri(baseUrl));
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("include_granted_scopes", "true");
  authUrl.searchParams.set("scope", "openid email https://www.googleapis.com/auth/calendar.events");
  authUrl.searchParams.set("state", state);

  sendJson(response, 200, {
    connected: false,
    authUrl: authUrl.toString(),
    message: "Open Google to connect Calendar.",
  });
}

async function handleGoogleCalendarCallback(request, response, url) {
  const code = cleanText(url.searchParams.get("code"));
  const state = cleanText(url.searchParams.get("state"));
  const baseUrl = appBaseUrl(request);

  try {
    if (!code || !state) throwInputError("Google Calendar callback is missing code or state.");
    const stateValue = verifyCalendarState(state);
    if (!stateValue?.workspaceId) throwInputError("Google Calendar state is invalid.");
    if (!hasSupabaseServiceConfig()) throwInputError("Supabase service role is required to store Google Calendar tokens.");

    const token = await exchangeGoogleCalendarCode(code, baseUrl);
    const profile = await fetchGoogleProfile(token.access_token);
    await saveGoogleCalendarConnection({
      workspaceId: stateValue.workspaceId,
      googleAccountEmail: profile.email || stateValue.ownerEmail || "",
      accessToken: token.access_token,
      refreshToken: token.refresh_token,
      expiresIn: token.expires_in,
      scope: token.scope,
    });

    sendRedirectHtml(response, `${baseUrl}/?calendar=connected#calendar`, "Google Calendar connected. Returning to Kira Home...");
  } catch (error) {
    const target = `${baseUrl}/?calendar=error&calendarMessage=${encodeURIComponent(error.message || "Google Calendar connect failed.")}#calendar`;
    sendRedirectHtml(response, target, "Google Calendar needs attention. Returning to Kira Home...");
  }
}

async function handleGoogleCalendarStatus(response, payload) {
  const workspaceId = cleanText(payload.workspaceId);
  if (!hasGoogleCalendarConfig()) {
    sendJson(response, 200, {
      configured: false,
      connected: false,
      message: "Google Calendar credentials are not configured.",
    });
    return;
  }
  if (!workspaceId) {
    sendJson(response, 200, {
      configured: true,
      connected: false,
      message: "Sign in with cloud mode to connect a workspace calendar.",
    });
    return;
  }

  const connection = await loadGoogleCalendarConnection(workspaceId);
  sendJson(response, 200, {
    configured: true,
    connected: Boolean(connection?.refresh_token || connection?.access_token),
    status: connection?.status || "not_connected",
    googleAccountEmail: connection?.google_account_email || "",
    calendarId: connection?.calendar_id || "primary",
    expiresAt: connection?.expires_at || "",
    message: connection ? "Google Calendar is connected." : "Google Calendar is ready to connect.",
  });
}

async function handleGoogleCalendarCreateEvent(response, payload) {
  const workspaceId = cleanText(payload.workspaceId);
  const appointment = payload.appointment || {};

  if (!hasGoogleCalendarConfig()) {
    sendJson(response, 200, {
      demo: true,
      synced: false,
      message: "Google Calendar credentials are not configured.",
    });
    return;
  }
  if (!workspaceId) {
    sendJson(response, 200, {
      demo: true,
      synced: false,
      message: "Calendar event saved in CRM only. Cloud mode is required for Google Calendar sync.",
    });
    return;
  }

  const connection = await loadGoogleCalendarConnection(workspaceId);
  if (!connection) {
    sendJson(response, 200, {
      synced: false,
      connected: false,
      message: "Connect Google Calendar before syncing appointment events.",
    });
    return;
  }

  const accessToken = await validGoogleAccessToken(connection);
  const startsAt = new Date(cleanText(appointment.startsAt));
  if (Number.isNaN(startsAt.getTime())) throwInputError("Appointment start time is invalid.");
  const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);
  const assignedTo = cleanEmail(appointment.assignedTo);
  const calendarId = cleanText(connection.calendar_id) || "primary";
  const event = {
    summary: cleanText(appointment.leadName || appointment.title || "Kira Home appointment"),
    description: [
      `Contact: ${cleanText(appointment.contactName || "Contact")}`,
      cleanText(appointment.notes),
      cleanText(appointment.outcome),
    ]
      .filter(Boolean)
      .join("\n"),
    start: { dateTime: startsAt.toISOString() },
    end: { dateTime: endsAt.toISOString() },
    attendees: assignedTo ? [{ email: assignedTo }] : undefined,
  };

  const googleResponse = await fetchWithTimeout(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=all`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(event),
    },
  );
  const data = await googleResponse.json();
  if (!googleResponse.ok) {
    const error = new Error(data.error?.message || `Google Calendar event failed with ${googleResponse.status}.`);
    error.statusCode = 502;
    throw error;
  }

  sendJson(response, 200, {
    synced: true,
    provider: "google-calendar",
    eventId: data.id,
    htmlLink: data.htmlLink,
    message: "Appointment synced to Google Calendar.",
  });
}

function validateWorkspacePayload(payload, options = {}) {
  const workspaceId = cleanText(payload.workspaceId);
  const leadId = cleanText(payload.leadId);
  if (workspaceId && workspaceId.length > 120) throwInputError("Workspace ID is too long.");
  if (options.requireLead && !leadId) throwInputError("Lead ID is required.");
  if (cleanText(payload.body).length > 5000) throwInputError("Message body is too long.");
  if (cleanText(payload.prompt).length > 4000) throwInputError("AI prompt is too long.");
}

function assertAdminPayload(payload, message = "Admin access is required.") {
  const role = cleanText(payload.actorRole || "");
  if (role && !["owner", "admin"].includes(role)) {
    const error = new Error(message);
    error.statusCode = 403;
    throw error;
  }
}

function buildRuleBasedAiResponse(intent, payload = {}) {
  const lead = payload.lead || {};
  const leadName = cleanText(lead.name || payload.leadName || "this homeowner");
  const company = cleanText(lead.company || payload.company || "the project");
  const stage = cleanText(lead.stage || "new");
  const value = Number(lead.value || payload.value || 0);
  const highValue = value >= 12000;
  const urgency =
    /follow|overdue|today/i.test(cleanText(payload.reason || lead.nextAction)) || stage === "qualified"
      ? "High"
      : highValue
        ? "Medium-high"
        : "Medium";
  const bestNextAction =
    stage === "proposal"
      ? "Follow up on the estimate and ask for a clear yes/no next step."
      : stage === "qualified"
        ? "Book or confirm the next appointment window."
        : "Call first, then send a short follow-up text if there is no answer.";
  const summary = `${leadName} is a ${stage} opportunity for ${company}${value ? ` worth about $${value.toLocaleString("en-US")}` : ""}.`;
  const text = `Hi ${firstName(leadName)}, this is Kira Home. I wanted to follow up on ${company}. Is now a good time to talk through the next step?`;

  return {
    intent,
    summary,
    leadSummary: summary,
    bestNextAction,
    urgency,
    closeProbability: highValue ? 72 : stage === "proposal" ? 68 : 54,
    closeProbabilityExplanation: highValue
      ? "Higher project value and active stage make this worth prioritizing."
      : "Probability is based on stage, recency, and follow-up context.",
    objectionRisk: stage === "proposal" ? "Price comparison or decision delay" : "Timing and trust",
    likelyObjections: ["Need to compare quotes", "Need to talk with spouse or decision maker", "Timing is not urgent yet"],
    callOpener: `Hi ${firstName(leadName)}, this is Kira Home. I saw the note about ${company}. Did I catch you at an okay time?`,
    followUpText: text,
    followUpEmail: `Subject: Quick follow-up on ${company}\n\nHi ${firstName(leadName)},\n\nI wanted to follow up on ${company}. The best next step is: ${bestNextAction}\n\nWould today or tomorrow be easier?`,
    proposalDraft: `Proposal draft for ${company}: confirm scope, timeline, decision makers, and the next deposit or scheduling step.`,
    appointmentPrep: `Review notes, confirm project scope, ask about timeline, budget range, decision maker, and preferred start date.`,
    taskSuggestions: [
      `Call ${leadName}`,
      `Send follow-up text to ${leadName}`,
      `Create a follow-up task for ${company}`,
    ],
    stageRecommendation: stage === "new" ? "Move to Qualified after contact is made." : "Keep stage until the next customer response.",
    managerNote: `${leadName} should be worked before lower-value or colder leads because the next action is clear.`,
  };
}

function aiPromptForIntent(intent, payload) {
  return [
    "You are ClosePilot, an AI operating system for home improvement sales teams.",
    "Return compact JSON only. Do not include markdown.",
    `Intent: ${intent}`,
    `Lead/context JSON: ${JSON.stringify(payload).slice(0, 7000)}`,
  ].join("\n");
}

async function callOpenAi(prompt, fallback) {
  const body = {
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    messages: [
      { role: "system", content: "Return JSON for a home improvement sales SaaS assistant." },
      { role: "user", content: prompt },
    ],
    temperature: 0.2,
    response_format: { type: "json_object" },
  };

  try {
    const response = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error?.message || `OpenAI request failed with ${response.status}.`);
    const content = data.choices?.[0]?.message?.content || "{}";
    return { ...fallback, ...JSON.parse(content) };
  } catch (error) {
    return {
      ...fallback,
      providerWarning: `OpenAI unavailable, deterministic fallback used: ${error.message}`,
    };
  }
}

async function sendSms(payload, request) {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
    return {
      demo: true,
      sent: false,
      message: "SMS provider is not configured. Add TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.",
    };
  }

  const params = new URLSearchParams({
    To: cleanText(payload.to),
    From: process.env.TWILIO_PHONE_NUMBER,
    Body: cleanText(payload.body),
  });
  const credentials = Buffer.from(`${process.env.TWILIO_ACCOUNT_SID}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64");
  const response = await fetchWithTimeout(
    `https://api.twilio.com/2010-04-01/Accounts/${process.env.TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        authorization: `Basic ${credentials}`,
        "content-type": "application/x-www-form-urlencoded",
      },
      body: params,
    },
  );
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || `Twilio request failed with ${response.status}.`);
    error.statusCode = 502;
    throw error;
  }
  return {
    sent: true,
    provider: "twilio",
    providerMessageId: data.sid,
    message: "SMS sent through Twilio.",
    appBaseUrl: appBaseUrl(request),
  };
}

async function sendEmail(payload, subject) {
  if (!process.env.RESEND_API_KEY || !process.env.INVITE_FROM_EMAIL) {
    return {
      demo: true,
      sent: false,
      message: "Email provider is not configured. Add RESEND_API_KEY and INVITE_FROM_EMAIL.",
    };
  }

  const response = await fetchWithTimeout("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      from: `Kira Home <${process.env.INVITE_FROM_EMAIL}>`,
      to: [cleanEmail(payload.to)],
      subject,
      text: cleanText(payload.body),
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.message || `Resend request failed with ${response.status}.`);
    error.statusCode = 502;
    throw error;
  }
  return {
    sent: true,
    provider: "resend",
    providerMessageId: data.id,
    message: "Email sent through Resend.",
  };
}

async function saveCommunicationEvent(payload, type, result) {
  if (!hasSupabaseServiceConfig() || !payload.workspaceId) return { saved: false };
  try {
    await supabaseRequest("communications", {
      method: "POST",
      body: [
        {
          workspace_id: cleanText(payload.workspaceId),
          lead_id: cleanUuid(payload.leadId) || null,
          channel: type,
          direction: payload.direction || "outgoing",
          status: result.sent || result.saved ? "logged" : "demo",
          subject: cleanText(payload.subject),
          body: cleanText(payload.body || result.message),
          provider: result.provider || "demo",
          provider_message_id: cleanText(result.providerMessageId),
          metadata: { result },
        },
      ],
      prefer: "return=minimal",
    });
    return { saved: true };
  } catch (error) {
    if (isMissingTableError(error, "communications")) return { saved: false };
    throw error;
  }
}

async function saveAiOutput(payload, type, output, options = {}) {
  if (!hasSupabaseServiceConfig() || !payload.workspaceId) return { saved: false };
  try {
    await supabaseRequest("ai_outputs", {
      method: "POST",
      body: [
        {
          workspace_id: cleanText(payload.workspaceId),
          lead_id: cleanUuid(payload.leadId || payload.lead?.id) || null,
          output_type: type,
          provider: options.demo ? "fallback" : "openai",
          prompt: cleanText(payload.prompt || type),
          output,
        },
      ],
      prefer: "return=minimal",
    });
    return { saved: true };
  } catch (error) {
    if (isMissingTableError(error, "ai_outputs")) return { saved: false };
    throw error;
  }
}

function launchWarnings(groups) {
  const warnings = [];
  if (!groups.database) warnings.push("Supabase is not fully configured; the app will use demo/localStorage fallback.");
  if (!groups.app) warnings.push("APP_BASE_URL is missing; invite links and OAuth redirects should be set to the production domain before live demos.");
  if (looksLikePreviewUrl(process.env.APP_BASE_URL)) {
    warnings.push("APP_BASE_URL looks like a Vercel preview URL. Use the production domain so invites do not send users to protected preview deployments.");
  }
  if (!groups.billing) warnings.push("Stripe checkout and billing portal remain in setup mode.");
  if (!groups.email) warnings.push("Team invites and outbound email use fallback links/logging until Resend is configured.");
  if (!groups.sms) warnings.push("SMS is logged only until Twilio credentials and a sending number are configured.");
  if (!groups.ai) warnings.push("AI features use deterministic fallback until OPENAI_API_KEY is configured.");
  if (!groups.calendar) warnings.push("Calendar events are CRM-only until Google Calendar OAuth is configured.");
  return warnings;
}

function looksLikePreviewUrl(value) {
  const text = cleanText(value);
  return Boolean(text && /\.vercel\.app/i.test(text) && !/kirahome\.org/i.test(text));
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

async function updateInviteTokenInSupabase({
  workspaceId,
  inviteId,
  inviteTokenHash,
  expiresAt,
  teamFunction = "",
  temporaryPasswordHash = "",
  temporaryPasswordExpiresAt = "",
}) {
  if (!hasSupabaseServiceConfig()) return;
  await supabaseRequest(
    `workspace_invitations?id=eq.${encodeURIComponent(inviteId)}&workspace_id=eq.${encodeURIComponent(workspaceId)}`,
    {
      method: "PATCH",
      body: {
        invite_token_hash: inviteTokenHash,
        expires_at: expiresAt,
        temporary_password_hash: temporaryPasswordHash || null,
        temporary_password_expires_at: temporaryPasswordExpiresAt || null,
        temporary_password_changed_at: null,
        onboarding_started_at: null,
        team_function: teamFunction || null,
        status: "pending",
      },
      prefer: "return=minimal",
    },
  );
}

async function provisionTemporaryAuthUser({ email, temporaryPassword, workspaceId, inviteId, role, teamFunction = "" }) {
  if (!hasSupabaseServiceConfig()) {
    return {
      provisioned: false,
      demo: true,
      message: "Supabase service role is missing, so the temporary password is demo-only.",
    };
  }

  const response = await fetch(`${process.env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email,
      password: temporaryPassword,
      email_confirm: true,
      user_metadata: {
        invited_workspace_id: workspaceId || "",
        invited_invite_id: inviteId || "",
        invited_role: role,
        invited_team_function: teamFunction || "",
        temporary_password_required: true,
      },
    }),
  });

  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { message: text };
    }
  }

  if (response.ok) {
    return {
      provisioned: true,
      userId: body?.id || "",
      message: "Temporary auth user created.",
    };
  }

  const message = body?.message || body?.msg || text || `Supabase Auth request failed with ${response.status}.`;
  if (/already|registered|exists/i.test(message)) {
    return {
      provisioned: false,
      existingUser: true,
      message: "A user already exists for this email. They can use the invite link with their current password.",
    };
  }

  return {
    provisioned: false,
    message,
  };
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

async function upsertWorkspaceMember({ workspaceId, userId, role, teamFunction = "" }) {
  await supabaseRequest("workspace_members?on_conflict=workspace_id,user_id", {
    method: "POST",
    body: [{ workspace_id: workspaceId, user_id: userId, role, team_function: teamFunction || null }],
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

function hasGoogleCalendarConfig() {
  return Boolean(process.env.GOOGLE_CALENDAR_CLIENT_ID && process.env.GOOGLE_CALENDAR_CLIENT_SECRET);
}

function googleCalendarRedirectUri(baseUrl) {
  return cleanText(process.env.GOOGLE_CALENDAR_REDIRECT_URI) || `${baseUrl}/api/google/calendar/callback`;
}

function signCalendarState(value) {
  const payload = Buffer.from(JSON.stringify(value)).toString("base64url");
  const signature = createHmac("sha256", googleCalendarStateSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

function verifyCalendarState(state) {
  const [payload, signature] = state.split(".");
  if (!payload || !signature) return null;
  const expected = createHmac("sha256", googleCalendarStateSecret()).update(payload).digest("base64url");
  if (!timingSafeEqualText(signature, expected)) return null;
  const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  if (!parsed.createdAt || Date.now() - Number(parsed.createdAt) > 10 * 60 * 1000) return null;
  return parsed;
}

function googleCalendarStateSecret() {
  return process.env.GOOGLE_CALENDAR_CLIENT_SECRET || process.env.STRIPE_WEBHOOK_SECRET || "closepilot-calendar-demo";
}

function timingSafeEqualText(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

async function exchangeGoogleCalendarCode(code, baseUrl) {
  const response = await fetchWithTimeout("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      redirect_uri: googleCalendarRedirectUri(baseUrl),
      grant_type: "authorization_code",
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error_description || data.error || `Google token exchange failed with ${response.status}.`);
    error.statusCode = 502;
    throw error;
  }
  return data;
}

async function fetchGoogleProfile(accessToken) {
  const response = await fetchWithTimeout("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { authorization: `Bearer ${accessToken}` },
  });
  const data = await response.json();
  return response.ok ? data : {};
}

async function saveGoogleCalendarConnection(connection) {
  if (!hasSupabaseServiceConfig()) throwInputError("Supabase service role is required for calendar token storage.");
  const expiresAt = connection.expiresIn
    ? new Date(Date.now() + Math.max(0, Number(connection.expiresIn) - 60) * 1000).toISOString()
    : null;

  const existing = await loadGoogleCalendarConnection(connection.workspaceId);
  const refreshToken = cleanText(connection.refreshToken || existing?.refresh_token);
  await supabaseRequest("calendar_connections?on_conflict=workspace_id", {
    method: "POST",
    body: [
      {
        workspace_id: connection.workspaceId,
        provider: "google",
        google_account_email: cleanEmail(connection.googleAccountEmail),
        calendar_id: "primary",
        access_token: cleanText(connection.accessToken),
        refresh_token: refreshToken,
        scope: cleanText(connection.scope),
        expires_at: expiresAt,
        status: "connected",
        updated_at: new Date().toISOString(),
      },
    ],
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}

async function loadGoogleCalendarConnection(workspaceId) {
  if (!hasSupabaseServiceConfig() || !workspaceId) return null;
  try {
    const rows = await supabaseRequest(
      `calendar_connections?workspace_id=eq.${encodeURIComponent(workspaceId)}&provider=eq.google&select=*`,
      { method: "GET" },
    );
    return Array.isArray(rows) ? rows[0] || null : null;
  } catch (error) {
    if (isMissingTableError(error, "calendar_connections")) return null;
    throw error;
  }
}

async function validGoogleAccessToken(connection) {
  const expiresAt = new Date(connection.expires_at || 0).getTime();
  if (connection.access_token && expiresAt - Date.now() > 2 * 60 * 1000) return connection.access_token;
  if (!connection.refresh_token) throwInputError("Google Calendar refresh token is missing. Reconnect Calendar.");

  const response = await fetchWithTimeout("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      refresh_token: connection.refresh_token,
      grant_type: "refresh_token",
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    const error = new Error(data.error_description || data.error || `Google token refresh failed with ${response.status}.`);
    error.statusCode = 502;
    throw error;
  }
  await saveGoogleCalendarConnection({
    workspaceId: connection.workspace_id,
    googleAccountEmail: connection.google_account_email,
    accessToken: data.access_token,
    refreshToken: connection.refresh_token,
    expiresIn: data.expires_in,
    scope: data.scope || connection.scope,
  });
  return data.access_token;
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

async function resolveStripePlanPriceId(stripe, planId) {
  const plan = planCatalog[planId];
  const explicitPriceId = cleanText(process.env[plan.priceEnv]);
  if (explicitPriceId) return explicitPriceId;

  const productId = cleanText(process.env[plan.productEnv]);
  if (!productId) return "";

  try {
    const product = await stripe.products.retrieve(productId, { expand: ["default_price"] });
    if (typeof product.default_price === "string") return product.default_price;
    return product.default_price?.id || "";
  } catch {
    return "";
  }
}

function hasSupabaseServiceConfig() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function isMissingTableError(error, table) {
  return error?.code === "42P01" || error?.message?.includes(table);
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

function generateTemporaryPassword() {
  const groups = ["Kira", randomPasswordSegment(4), randomPasswordSegment(4), randomPasswordSegment(4)];
  return `${groups.join("-")}!7`;
}

function randomPasswordSegment(length) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  let value = "";
  for (let index = 0; index < length; index += 1) {
    value += alphabet[randomBytes(1)[0] % alphabet.length];
  }
  return value;
}

function cleanText(value) {
  return String(value || "").trim();
}

function cleanEmail(value) {
  const email = cleanText(value).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function cleanUuid(value) {
  const text = cleanText(value);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(text) ? text : "";
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

function firstName(value) {
  return cleanText(value).split(/\s+/)[0] || "there";
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function throwInputError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  throw error;
}

function assertRateLimit(request, pathname) {
  if (pathname === "/api/stripe/webhook") return;
  const limited = pathname.startsWith("/api/ai/") || pathname.startsWith("/api/communications/");
  const max = limited ? 24 : 80;
  const windowMs = 60000;
  const identity =
    request.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    request.socket?.remoteAddress ||
    "local";
  const key = `${pathname}:${identity}`;
  const now = Date.now();
  const bucket = rateLimitBuckets.get(key) || { count: 0, resetAt: now + windowMs };
  if (bucket.resetAt <= now) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  rateLimitBuckets.set(key, bucket);
  if (bucket.count > max) {
    const error = new Error("Too many requests. Try again in a minute.");
    error.statusCode = 429;
    throw error;
  }
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
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
    "content-security-policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "content-type": "application/json; charset=utf-8",
  });
  response.end(statusCode === 204 ? "" : JSON.stringify(payload));
}

function sendRedirectHtml(response, targetUrl, message) {
  response.writeHead(200, {
    "content-type": "text/html; charset=utf-8",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
  });
  response.end(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0;url=${escapeHtml(targetUrl)}" />
    <title>Kira Home Calendar</title>
  </head>
  <body>
    <p>${escapeHtml(message)} <a href="${escapeHtml(targetUrl)}">Continue</a></p>
    <script>window.location.replace(${JSON.stringify(targetUrl)});</script>
  </body>
</html>`);
}
