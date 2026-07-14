import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import Stripe from "stripe";
import {
  buildDailyCommandCenterSnapshot,
  buildLaunchReadiness,
  checklistProgressPercent,
  defaultDailyGoals,
  launchRecommendation,
  mergeLaunchChecklist,
  mergeProviderRows,
  normalizeDailyGoals,
  normalizeLaunchBlocker,
  providerStatusesFromEnv,
} from "./command-center-config.js";
import { sendInviteEmailWithResend } from "./email-service.js";

const planCatalog = {
  starter: { label: "Starter", seatLimit: 75, priceEnv: "STRIPE_PRICE_STARTER", productEnv: "STRIPE_PRODUCT_STARTER" },
  growth: { label: "Growth", seatLimit: 200, priceEnv: "STRIPE_PRICE_GROWTH", productEnv: "STRIPE_PRODUCT_GROWTH" },
  scale: { label: "Scale", seatLimit: 0, priceEnv: "STRIPE_PRICE_SCALE", productEnv: "STRIPE_PRODUCT_SCALE" },
};

const freeTrialDays = 7;

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

const recruitingEndpoints = new Set([
  "/api/recruiting/access",
  "/api/recruiting/load",
  "/api/recruiting/save",
  "/api/recruiting/applicants",
  "/api/recruiting/onboarding-email",
  "/api/recruiting/integration-status",
  "/api/recruiting/addon-settings",
  "/api/recruiting/crm-handoff",
]);

const launchCommandCenterEndpoints = new Set([
  "/api/launch-command-center/overview",
  "/api/launch-command-center/readiness",
  "/api/launch-command-center/blockers",
  "/api/launch-command-center/providers",
  "/api/launch-command-center/checklist",
  "/api/launch-command-center/beta-companies",
  "/api/launch-command-center/status-snapshot",
]);

const dailyCommandCenterEndpoints = new Set([
  "/api/dashboard/daily-command-center",
  "/api/dashboard/team-performance",
  "/api/dashboard/pipeline-health",
  "/api/dashboard/today",
  "/api/workspace/daily-goals",
]);

export const closePilotApiRoutes = [
  { method: "POST", route: "/api/stripe/create-checkout-session" },
  { method: "POST", route: "/api/stripe/create-portal-session" },
  { method: "POST", route: "/api/stripe/webhook" },
  { method: "POST", route: "/api/invites/send" },
  { method: "POST", route: "/api/invites/accept" },
  { method: "POST", route: "/api/google/calendar/connect" },
  { method: "GET", route: "/api/google/calendar/callback" },
  { method: "POST", route: "/api/google/calendar/status" },
  { method: "POST", route: "/api/google/calendar/create-event" },
  { method: "POST", route: "/api/system/readiness" },
  ...[...launchCommandCenterEndpoints].map((route) => ({ method: "POST", route })),
  ...[...dailyCommandCenterEndpoints].map((route) => ({ method: "POST", route })),
  ...[...recruitingEndpoints].map((route) => ({ method: "POST", route })),
  ...[...aiEndpoints].map((route) => ({ method: "POST", route })),
  ...[...communicationEndpoints].map((route) => ({ method: "POST", route })),
].sort((left, right) => `${left.method} ${left.route}`.localeCompare(`${right.method} ${right.route}`));

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
  { key: "publicDemoEnabled", label: "Public demo flag", env: "PUBLIC_DEMO_ENABLED", public: true, optional: true },
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
    launchCommandCenterEndpoints.has(pathname) ||
    dailyCommandCenterEndpoints.has(pathname) ||
    recruitingEndpoints.has(pathname) ||
    aiEndpoints.has(pathname) ||
    communicationEndpoints.has(pathname)
  );
}

export async function handleClosePilotApiRequest(request, response) {
  const url = new URL(request.url || "/", `http://${request.headers.host || "localhost"}`);
  response.__request = request;
  response.__requestId = requestIdFor(request);

  if (request.method === "OPTIONS") {
    if (!isCorsOriginAllowed(request)) {
      sendJson(response, 403, { error: { code: "CORS_FORBIDDEN", message: "Origin is not allowed." }, message: "Origin is not allowed." });
      return;
    }
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
      await handleAcceptInvite(request, response, payload);
      return;
    }
    if (url.pathname === "/api/system/readiness") {
      await handleSystemReadiness(request, response, payload);
      return;
    }
    if (launchCommandCenterEndpoints.has(url.pathname)) {
      await handleLaunchCommandCenterRequest(url.pathname, request, response, payload);
      return;
    }
    if (dailyCommandCenterEndpoints.has(url.pathname)) {
      await handleDailyCommandCenterRequest(url.pathname, request, response, payload);
      return;
    }
    if (recruitingEndpoints.has(url.pathname)) {
      await handleRecruitingRequest(url.pathname, request, response, payload);
      return;
    }
    if (url.pathname === "/api/google/calendar/connect") {
      await handleGoogleCalendarConnect(request, response, payload);
      return;
    }
    if (url.pathname === "/api/google/calendar/status") {
      await handleGoogleCalendarStatus(request, response, payload);
      return;
    }
    if (url.pathname === "/api/google/calendar/create-event") {
      await handleGoogleCalendarCreateEvent(request, response, payload);
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
    sendError(response, error);
  }
}

async function handleSystemReadiness(request, response, payload = {}) {
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
    domain: Boolean(process.env.APP_BASE_URL) && !looksLikePreviewUrl(process.env.APP_BASE_URL),
    publicDemoConfigured: Object.prototype.hasOwnProperty.call(process.env, "PUBLIC_DEMO_ENABLED"),
    publicDemoEnabled: publicDemoIsEnabled(),
    roleGating: true,
  };
  const groupStatus = Object.fromEntries(
    Object.entries(groups).map(([key, envs]) => [
      key,
      Array.isArray(envs) ? envs.every((env) => Boolean(process.env[env])) : Boolean(envs),
    ]),
  );
  const required = checks.filter((check) => !check.optional && !["SUPPORT_EMAIL"].includes(check.env));
  const configured = required.filter((check) => check.configured).length;
  const privateBetaScore = readinessScore([
    groupStatus.app,
    groupStatus.domain,
    groupStatus.database,
    groupStatus.email,
    groupStatus.billing,
    groupStatus.ai,
    groupStatus.roleGating,
  ]);
  const productionScore = readinessScore([
    groupStatus.app,
    groupStatus.domain,
    groupStatus.database,
    groupStatus.email,
    groupStatus.billing,
    groupStatus.sms,
    groupStatus.ai,
    groupStatus.calendar,
    groupStatus.roleGating,
    !productionPublicDemoWarning(),
  ]);
  const percentage = privateBetaScore;

  const publicPayload = {
    ready: privateBetaScore >= 80 && groupStatus.database,
    percentage,
    privateBetaScore,
    productionScore,
    mode: groupStatus.database ? "live-ready" : "demo",
    checkedAt: new Date().toISOString(),
    appBaseUrl: appBaseUrl(request),
    groups: groupStatus,
    warnings: launchWarnings(groupStatus),
  };

  const detailAccess = await optionalReadinessAdminAccess(request, payload);
  if (!detailAccess) {
    sendJson(response, 200, {
      ...publicPayload,
      checks: checks.filter((check) => check.public).map(({ key, label, configured, public: isPublic }) => ({
        key,
        label,
        configured,
        public: isPublic,
      })),
      detail: "Public readiness omits server secret names and protected setup diagnostics.",
    });
    return;
  }

  sendJson(response, 200, {
    ...publicPayload,
    checkedBy: detailAccess.email,
    workspaceId: detailAccess.workspaceId,
    checks,
  });
}

async function handleLaunchCommandCenterRequest(pathname, request, response, payload = {}) {
  assertFeatureEnabled("FEATURE_LAUNCH_COMMAND_CENTER", "Launch Command Center");
  const founder = await requireFounderAccess(request);
  const [blockerRows, checklistRows, providerRows, categoryRows, betaCompanies, statusSnapshots] = await Promise.all([
    loadLaunchRows("launch_blockers?select=*&order=created_at.desc"),
    loadLaunchRows("launch_checklist_items?select=*&order=updated_at.desc"),
    loadLaunchRows("launch_provider_status?select=*&order=updated_at.desc"),
    loadLaunchRows("launch_readiness_categories?select=*&order=updated_at.desc"),
    loadLaunchRows("launch_beta_accounts?select=*&order=created_at.desc"),
    loadLaunchRows("launch_status_snapshots?select=*&order=created_at.desc&limit=5"),
  ]);

  if (pathname === "/api/launch-command-center/blockers" && payload.mutation) {
    await mutateLaunchBlocker(payload, founder);
  }
  if (pathname === "/api/launch-command-center/checklist" && (payload.itemKey || payload.key)) {
    await mutateLaunchChecklist(payload, founder);
  }
  if (pathname === "/api/launch-command-center/beta-companies" && (payload.companyName || payload.name || payload.companyId)) {
    await mutateLaunchBetaCompany(payload, founder);
  }
  if (pathname === "/api/launch-command-center/status-snapshot" && payload.snapshot) {
    await insertLaunchStatusSnapshot(payload.snapshot, founder);
  }

  const refreshedChecklistRows =
    pathname === "/api/launch-command-center/checklist" && (payload.itemKey || payload.key)
      ? await loadLaunchRows("launch_checklist_items?select=*&order=updated_at.desc")
      : checklistRows;
  const refreshedBlockerRows =
    pathname === "/api/launch-command-center/blockers" && payload.mutation
      ? await loadLaunchRows("launch_blockers?select=*&order=created_at.desc")
      : blockerRows;
  const refreshedBetaCompanies =
    pathname === "/api/launch-command-center/beta-companies" && (payload.companyName || payload.name || payload.companyId)
      ? await loadLaunchRows("launch_beta_accounts?select=*&order=created_at.desc")
      : betaCompanies;
  const snapshot = buildLaunchCommandCenterPayload({
    founder,
    blockerRows: refreshedBlockerRows,
    checklistRows: refreshedChecklistRows,
    providerRows,
    categoryRows,
    betaCompanies: refreshedBetaCompanies,
    statusSnapshots,
  });

  if (pathname.endsWith("/readiness")) {
    sendJson(response, 200, {
      checkedBy: founder.email,
      readiness: snapshot.readiness,
      recommendation: snapshot.recommendation,
    });
    return;
  }
  if (pathname.endsWith("/providers")) {
    sendJson(response, 200, {
      checkedBy: founder.email,
      providers: snapshot.providers,
      releaseHealth: snapshot.releaseHealth,
    });
    return;
  }
  if (pathname.endsWith("/blockers")) {
    sendJson(response, 200, {
      checkedBy: founder.email,
      blockers: snapshot.blockers,
      recommendation: snapshot.recommendation,
    });
    return;
  }
  if (pathname.endsWith("/checklist")) {
    sendJson(response, 200, {
      checkedBy: founder.email,
      checklist: snapshot.checklist,
      checklistProgress: snapshot.checklistProgress,
    });
    return;
  }
  if (pathname.endsWith("/beta-companies")) {
    sendJson(response, 200, {
      checkedBy: founder.email,
      betaCompanies: snapshot.betaCompanies,
    });
    return;
  }
  if (pathname.endsWith("/status-snapshot")) {
    sendJson(response, 200, {
      checkedBy: founder.email,
      statusSnapshots: snapshot.statusSnapshots,
      releaseHealth: snapshot.releaseHealth,
    });
    return;
  }

  sendJson(response, 200, snapshot);
}

async function handleDailyCommandCenterRequest(pathname, request, response, payload = {}) {
  assertFeatureEnabled("FEATURE_DAILY_COMMAND_CENTER", "Daily Command Center");
  const auth = await requireAuthenticatedRequest(request);

  if (pathname === "/api/workspace/daily-goals" && (payload.goals || payload.action === "update")) {
    const access = await requireWorkspaceAccess(auth, payload.workspaceId, { allowedRoles: ["owner", "admin"] });
    const goals = normalizeDailyGoals(payload.goals || {});
    await upsertWorkspaceDailyGoals(access.workspaceId, goals, auth.email);
    await logWorkspaceAudit(access.workspaceId, "Daily goals updated", `${auth.email} updated Daily Command Center goals.`);
    sendJson(response, 200, {
      saved: true,
      workspaceId: access.workspaceId,
      goals,
      updatedBy: auth.email,
    });
    return;
  }

  const access = await requireWorkspaceAccess(auth, payload.workspaceId, {
    allowedRoles: pathname === "/api/dashboard/team-performance" ? ["owner", "admin", "manager"] : ["owner", "admin", "manager", "member"],
  });
  const goals = await loadWorkspaceDailyGoals(access.workspaceId);

  if (pathname === "/api/workspace/daily-goals") {
    sendJson(response, 200, {
      workspaceId: access.workspaceId,
      goals,
      canManage: ["owner", "admin"].includes(access.role),
    });
    return;
  }

  const rows = await loadDailyCommandWorkspaceRows(access.workspaceId);
  const snapshot = buildDailyCommandCenterSnapshot({
    ...rows,
    goals,
    role: access.role,
    mode: "live",
    currentUserId: access.userId,
    currentUserEmail: access.email,
    timezone: rows.timezone,
  });

  if (pathname === "/api/dashboard/team-performance") {
    sendJson(response, 200, {
      workspaceId: access.workspaceId,
      role: access.role,
      teamPerformance: snapshot.teamPerformance,
      generatedAt: snapshot.generatedAt,
    });
    return;
  }
  if (pathname === "/api/dashboard/pipeline-health") {
    sendJson(response, 200, {
      workspaceId: access.workspaceId,
      pipelineHealth: snapshot.pipelineHealth,
      kpis: snapshot.kpis,
      generatedAt: snapshot.generatedAt,
    });
    return;
  }
  if (pathname === "/api/dashboard/today") {
    sendJson(response, 200, {
      workspaceId: access.workspaceId,
      priorities: snapshot.priorities,
      today: snapshot.today,
      generatedAt: snapshot.generatedAt,
    });
    return;
  }

  sendJson(response, 200, {
    workspaceId: access.workspaceId,
    workspaceName: access.workspaceName,
    role: access.role,
    ...snapshot,
  });
}

function buildLaunchCommandCenterPayload({ founder, blockerRows, checklistRows, providerRows, categoryRows, betaCompanies, statusSnapshots }) {
  const providers = mergeProviderRows(providerStatusesFromEnv(process.env), providerRows);
  const readiness = buildLaunchReadiness(categoryRows, providers);
  const blockers = (blockerRows || []).map(normalizeLaunchBlocker);
  const checklist = mergeLaunchChecklist(checklistRows || []);
  const checklistProgress = checklistProgressPercent(checklist);
  const latestStatusSnapshot = Array.isArray(statusSnapshots) ? statusSnapshots[0]?.snapshot || {} : {};
  const launchStage = cleanText(latestStatusSnapshot.launchStage || latestStatusSnapshot.stage || process.env.LAUNCH_STAGE || "private_beta");
  const recommendation = launchRecommendation({
    launchStage,
    readiness,
    blockers,
    checklist,
    providers,
    statusSnapshot: latestStatusSnapshot,
  });
  const openBlockers = blockers.filter((blocker) => blocker.status !== "resolved");
  const releaseHealth = {
    ciStatus: providers.find((provider) => provider.key === "ci_status")?.displayStatus || "Not connected",
    requiredProvidersConfigured: recommendation.passedRequirements.filter((item) => item.code === "REQUIRED_PROVIDER_CONNECTED").length,
    requiredProvidersTotal: recommendation.passedRequirements.filter((item) => item.code === "REQUIRED_PROVIDER_CONNECTED").length +
      recommendation.blockingReasons.filter((item) => item.code === "REQUIRED_PROVIDER_NOT_CONFIGURED" || item.code === "REQUIRED_PROVIDER_FAILED" || item.code === "REQUIRED_PROVIDER_UNKNOWN").length,
    openCriticalBlockers: openBlockers.filter((blocker) => blocker.severity === "critical").length,
    openHighBlockers: openBlockers.filter((blocker) => blocker.severity === "high").length,
    checklistProgress,
    blockingReasonCount: recommendation.blockingReasons.length,
    warningCount: recommendation.warnings.length,
    unknownRequirementCount: recommendation.unknownRequirements.length,
  };

  return {
    checkedAt: new Date().toISOString(),
    checkedBy: founder.email,
    source: hasSupabaseServiceConfig() ? "supabase-live" : "configuration-only",
    launchStage: recommendation.evaluatedStage,
    readiness,
    providers,
    blockers,
    checklist,
    checklistProgress,
    betaCompanies: (betaCompanies || []).map((company) => ({
      id: company.id || "",
      name: company.company_name || company.name || "Unnamed beta company",
      status: company.beta_status || company.status || "prospect",
      betaStatus: company.beta_status || company.status || "prospect",
      owner: company.assigned_owner || company.owner || "",
      contactName: company.contact_name || "",
      contactEmail: company.contact_email || "",
      contactPhone: company.contact_phone || "",
      industry: company.industry || "",
      onboardingStage: company.onboarding_stage || "not_started",
      startDate: company.start_date || "",
      lastActivityAt: company.last_activity_at || "",
      openIssueCount: Number(company.open_issue_count || 0),
      feedbackCount: Number(company.feedback_count || 0),
      conversionLikelihood: Number(company.conversion_likelihood || 0),
      pilotPrice: Number(company.pilot_price || 0),
      expectedConversionDate: company.expected_conversion_date || "",
      workspaceId: company.workspace_id || "",
      notes: company.notes || "",
      nextAction: company.next_action || "",
      nextActionDueAt: company.next_action_due_at || "",
      createdAt: company.created_at || "",
      updatedAt: company.updated_at || "",
    })),
    statusSnapshots: statusSnapshots || [],
    releaseHealth,
    recommendation,
    nextMilestone: nextLaunchMilestone({ recommendation, openBlockers, checklistProgress, providers }),
  };
}

function nextLaunchMilestone({ recommendation, openBlockers, checklistProgress, providers }) {
  const missingProvider = providers.find((provider) =>
    recommendation.blockingReasons.some((reason) => reason.providerKey === provider.key),
  );
  if (openBlockers.some((blocker) => blocker.severity === "critical")) return "Resolve all critical blockers before beta launch.";
  if (recommendation.blockingReasons[0]) return recommendation.blockingReasons[0].message;
  if (missingProvider) return `Connect ${missingProvider.label}.`;
  if (checklistProgress < 80) return "Complete the remaining beta certification checklist items.";
  if (recommendation.status === "GO") return "Schedule founder sign-off and invite the next beta company.";
  return "Review high blockers and confirm the conditional beta scope.";
}

async function requireFounderAccess(request) {
  const auth = await requireAuthenticatedRequest(request);
  const allowlist = internalAdminEmails();
  const metadataAccess =
    auth.user?.app_metadata?.internal_admin === true ||
    auth.user?.app_metadata?.founder === true ||
    auth.user?.user_metadata?.internal_admin === true;
  if (!allowlist.length && !metadataAccess) {
    throwHttpError(503, "INTERNAL_ACCESS_NOT_CONFIGURED", "Founder access is not configured for this deployment.");
  }
  if (!metadataAccess && !allowlist.includes(auth.email)) {
    throwHttpError(403, "INTERNAL_ACCESS_FORBIDDEN", "This account is not allowed to open the Launch Command Center.");
  }
  return auth;
}

function internalAdminEmails() {
  return cleanText(process.env.INTERNAL_ADMIN_EMAILS || process.env.FOUNDER_EMAILS || "")
    .split(/[,\s]+/)
    .map(cleanEmail)
    .filter(Boolean);
}

function assertFeatureEnabled(envName, label) {
  if (process.env[envName] === "false") {
    throwHttpError(404, "FEATURE_DISABLED", `${label} is disabled for this deployment.`);
  }
}

async function loadLaunchRows(path) {
  if (!hasSupabaseServiceConfig()) return [];
  try {
    return await supabaseRequest(path, { method: "GET" });
  } catch (error) {
    if (isMissingTableError(error, path.split("?")[0])) return [];
    throw error;
  }
}

async function mutateLaunchBlocker(payload, founder) {
  const mutation = cleanText(payload.mutation).toLowerCase();
  const now = new Date().toISOString();
  if (mutation === "delete") throwInputError("Launch blockers should be resolved or accepted, not deleted.");
  const id = cleanUuid(payload.id);
  const blocker = normalizeLaunchBlocker({
    ...payload.blocker,
    ...payload,
    updated_at: now,
  });
  if (!blocker.title) throwInputError("Blocker title is required.");

  const row = {
    title: blocker.title,
    detail: blocker.detail,
    category: blocker.category,
    evidence_url: blocker.evidenceUrl,
    evidence_text: blocker.evidenceText,
    resolution_notes: blocker.resolutionNotes,
    accepted_risk_reason: blocker.acceptedRiskReason,
    accepted_risk_by: blocker.acceptedRiskBy,
    accepted_risk_at: blocker.acceptedRiskAt,
    launch_blocking: blocker.launchBlocking,
    target_stage: blocker.targetStage,
    owner_user_id: cleanUuid(blocker.ownerUserId) || null,
    resolved_by: blocker.resolvedBy,
    resolved_at: blocker.resolvedAt,
    severity: blocker.severity,
    status: blocker.status,
    owner: blocker.owner,
    due_at: blocker.dueAt,
    updated_at: now,
    updated_by: founder.email,
  };
  if (blocker.evidenceUrl && !/^https?:\/\/[^\s]+$/i.test(blocker.evidenceUrl)) throwInputError("Evidence URL must start with http:// or https://.");
  if (blocker.status === "accepted_risk" && !blocker.acceptedRiskReason) throwInputError("Accepted risk requires a reason.");
  if (blocker.status === "resolved" && !blocker.resolutionNotes) throwInputError("Resolved blockers require resolution notes.");
  if (blocker.status === "resolved" && !row.resolved_at) row.resolved_at = now;
  if (blocker.status === "accepted_risk" && !row.accepted_risk_at) row.accepted_risk_at = now;
  if (blocker.status === "accepted_risk" && !row.accepted_risk_by) row.accepted_risk_by = founder.email;
  if (id) row.id = id;

  await supabaseRequest(id ? "launch_blockers?on_conflict=id" : "launch_blockers", {
    method: "POST",
    body: [row],
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}

async function mutateLaunchChecklist(payload, founder) {
  const key = cleanText(payload.itemKey || payload.key);
  if (!key) throwInputError("Checklist item key is required.");
  const completed = Boolean(payload.completed);
  const now = new Date().toISOString();
  await supabaseRequest("launch_checklist_items?on_conflict=item_key", {
    method: "POST",
    body: [
      {
        item_key: key,
        label: cleanText(payload.label),
        category: cleanText(payload.category),
        completed,
        status: normalizeChecklistStatus(payload.status || (completed ? "complete" : "unknown")),
        required: Boolean(payload.required),
        evidence: sanitizeJson(payload.evidence || {}),
        note: cleanText(payload.note).slice(0, 1000),
        completed_at: completed ? now : null,
        updated_at: now,
        updated_by: founder.email,
      },
    ],
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}

async function mutateLaunchBetaCompany(payload, founder) {
  const companyName = cleanText(payload.companyName || payload.name);
  if (!companyName) throwInputError("Beta company name is required.");
  const contactEmail = cleanEmail(payload.contactEmail || payload.contact_email || "");
  if ((payload.contactEmail || payload.contact_email) && !contactEmail) throwInputError("Beta account contact email is invalid.");
  const conversionLikelihood = boundedNumber(payload.conversionLikelihood ?? payload.conversion_likelihood, 0, 100, 0);
  const now = new Date().toISOString();
  const row = {
    company_name: companyName,
    status: normalizeBetaCompanyStatus(payload.status || payload.betaStatus || payload.beta_status),
    beta_status: normalizeBetaCompanyStatus(payload.betaStatus || payload.beta_status || payload.status),
    contact_name: cleanText(payload.contactName || payload.contact_name),
    contact_email: contactEmail,
    contact_phone: cleanText(payload.contactPhone || payload.contact_phone),
    industry: cleanText(payload.industry),
    onboarding_stage: normalizeBetaOnboardingStage(payload.onboardingStage || payload.onboarding_stage),
    start_date: cleanDate(payload.startDate || payload.start_date),
    last_activity_at: cleanTimestamp(payload.lastActivityAt || payload.last_activity_at),
    open_issue_count: boundedNumber(payload.openIssueCount ?? payload.open_issue_count, 0, 100000, 0),
    feedback_count: boundedNumber(payload.feedbackCount ?? payload.feedback_count, 0, 100000, 0),
    conversion_likelihood: conversionLikelihood,
    pilot_price: boundedNumber(payload.pilotPrice ?? payload.pilot_price, 0, 100000000, 0),
    expected_conversion_date: cleanDate(payload.expectedConversionDate || payload.expected_conversion_date),
    assigned_owner: cleanText(payload.assignedOwner || payload.assigned_owner || payload.owner || founder.email),
    owner: cleanText(payload.owner || payload.assignedOwner || payload.assigned_owner || founder.email),
    workspace_id: cleanUuid(payload.workspaceId) || null,
    notes: cleanText(payload.notes).slice(0, 2000),
    next_action: cleanText(payload.nextAction || payload.next_action).slice(0, 1000),
    next_action_due_at: cleanTimestamp(payload.nextActionDueAt || payload.next_action_due_at),
    updated_at: now,
    updated_by: founder.email,
  };
  const id = cleanUuid(payload.companyId || payload.id);
  if (id) row.id = id;
  await supabaseRequest(id ? "launch_beta_accounts?on_conflict=id" : "launch_beta_accounts", {
    method: "POST",
    body: [row],
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}

async function insertLaunchStatusSnapshot(snapshot, founder) {
  await supabaseRequest("launch_status_snapshots", {
    method: "POST",
    body: [
      {
        snapshot: sanitizeJson(snapshot),
        created_by: founder.email,
      },
    ],
    prefer: "return=minimal",
  });
}

function normalizeBetaCompanyStatus(status) {
  const value = cleanText(status).toLowerCase();
  return ["prospect", "invited", "onboarding", "active", "paused", "completed", "converted", "churned", "candidate", "graduated"].includes(value)
    ? value.replace("candidate", "prospect").replace("graduated", "completed")
    : "prospect";
}

function normalizeBetaOnboardingStage(stage) {
  const value = cleanText(stage).toLowerCase();
  return [
    "not_started",
    "account_created",
    "workspace_configured",
    "data_imported",
    "team_invited",
    "provider_connected",
    "training_completed",
    "live_usage",
  ].includes(value)
    ? value
    : "not_started";
}

function normalizeChecklistStatus(status) {
  const value = cleanText(status).toLowerCase();
  return ["unknown", "passed", "failed", "complete", "skipped"].includes(value) ? value : "unknown";
}

async function loadDailyCommandWorkspaceRows(workspaceId) {
  const encodedWorkspaceId = encodeURIComponent(workspaceId);
  const [leads, tasks, appointments, activities, communications, calls, notifications, members, settings] = await Promise.all([
    safeSupabaseRows(`leads?workspace_id=eq.${encodedWorkspaceId}&select=*&order=updated_at.desc`),
    safeSupabaseRows(`tasks?workspace_id=eq.${encodedWorkspaceId}&select=*&order=created_at.desc`),
    safeSupabaseRows(`appointments?workspace_id=eq.${encodedWorkspaceId}&select=*&order=starts_at.asc`),
    safeSupabaseRows(`activities?workspace_id=eq.${encodedWorkspaceId}&select=*&order=created_at.desc&limit=100`),
    safeSupabaseRows(`communications?workspace_id=eq.${encodedWorkspaceId}&select=*&order=created_at.desc&limit=100`),
    safeSupabaseRows(`calls?workspace_id=eq.${encodedWorkspaceId}&select=*&order=created_at.desc&limit=100`),
    safeSupabaseRows(`notifications?workspace_id=eq.${encodedWorkspaceId}&select=*&order=created_at.desc&limit=50`),
    safeSupabaseRows(`workspace_members?workspace_id=eq.${encodedWorkspaceId}&select=user_id,role,team_function`),
    safeSupabaseRows(`workspace_settings?workspace_id=eq.${encodedWorkspaceId}&select=working_hours`),
  ]);
  return {
    leads,
    tasks,
    appointments,
    activities,
    communications,
    calls,
    notifications,
    timezone: settings?.[0]?.working_hours?.timezone || "UTC",
    members: members.map((member) => ({
      userId: member.user_id,
      email: member.email || "",
      role: member.role,
      teamFunction: member.team_function || "",
    })),
  };
}

async function loadWorkspaceDailyGoals(workspaceId) {
  const rows = await safeSupabaseRows(
    `workspace_daily_goals?workspace_id=eq.${encodeURIComponent(workspaceId)}&select=goals,updated_at`,
  );
  return normalizeDailyGoals(rows?.[0]?.goals || defaultDailyGoals);
}

async function upsertWorkspaceDailyGoals(workspaceId, goals, email) {
  await supabaseRequest("workspace_daily_goals?on_conflict=workspace_id", {
    method: "POST",
    body: [
      {
        workspace_id: workspaceId,
        goals,
        updated_by: email || "",
        updated_at: new Date().toISOString(),
      },
    ],
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}

async function safeSupabaseRows(path) {
  try {
    const rows = await supabaseRequest(path, { method: "GET" });
    return Array.isArray(rows) ? rows : [];
  } catch (error) {
    const table = path.split("?")[0];
    if (isMissingTableError(error, table)) return [];
    throw error;
  }
}

async function handleAiRequest(pathname, request, response, payload) {
  const auth = await requireAuthenticatedRequest(request);
  const access = await requireWorkspaceAccess(auth, payload.workspaceId);
  payload.workspaceId = access.workspaceId;
  await assertLeadBelongsToWorkspace(access.workspaceId, payload.leadId || payload.lead?.id);
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
  const auth = await requireAuthenticatedRequest(request);
  const access = await requireWorkspaceAccess(auth, payload.workspaceId);
  payload.workspaceId = access.workspaceId;
  await assertLeadBelongsToWorkspace(access.workspaceId, payload.leadId || payload.lead?.id);
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
  const auth = await requireAuthenticatedRequest(request);
  const access = await requireWorkspaceAccess(auth, payload.workspaceId, { allowedRoles: ["owner", "admin"] });
  const stripe = getStripeClient();
  const planId = assertRequestedPlanId(payload.plan);
  const priceId = stripe ? await resolveStripePlanPriceId(stripe, planId) : "";
  const workspaceId = access.workspaceId;
  const baseUrl = appBaseUrl(request);
  const subscription = await loadSubscriptionFromSupabase(workspaceId);
  const customerId = cleanText(subscription?.stripe_customer_id);

  if (!stripe || !priceId) {
    sendJson(response, 200, {
      demo: true,
      message: `Live checkout is not configured. Add STRIPE_SECRET_KEY plus ${planCatalog[planId].priceEnv} or ${planCatalog[planId].productEnv} with a default recurring price to enable ${planCatalog[planId].label}.`,
    });
    return;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId || undefined,
    customer_email: customerId ? undefined : auth.email || undefined,
    client_reference_id: workspaceId || undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${baseUrl}/?billing=success#admin`,
    cancel_url: `${baseUrl}/?billing=cancelled#admin`,
    metadata: {
      workspaceId,
      plan: planId,
    },
    subscription_data: {
      trial_period_days: freeTrialDays,
      metadata: {
        workspaceId,
        plan: planId,
        trialDays: String(freeTrialDays),
      },
    },
  });

  sendJson(response, 200, { url: session.url, sessionId: session.id });
}

async function handleCreatePortalSession(request, response, payload) {
  const auth = await requireAuthenticatedRequest(request);
  const access = await requireWorkspaceAccess(auth, payload.workspaceId, { allowedRoles: ["owner", "admin"] });
  const stripe = getStripeClient();
  const workspaceId = access.workspaceId;
  const baseUrl = appBaseUrl(request);
  const subscription = await loadSubscriptionFromSupabase(workspaceId);
  const customerId = cleanText(subscription?.stripe_customer_id);

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
    if (isLiveLikeMode()) {
      throwHttpError(503, "STRIPE_WEBHOOK_CONFIG_REQUIRED", "Stripe webhook verification is not configured.");
    }
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
  const auth = await requireAuthenticatedRequest(request);
  const access = await requireWorkspaceAccess(auth, payload.workspaceId, { allowedRoles: ["owner", "admin"] });
  const workspaceId = access.workspaceId;
  const inviteId = cleanText(payload.inviteId);
  const email = cleanEmail(payload.email);
  const role = cleanText(payload.role || "member").toLowerCase();
  const teamFunction = cleanText(payload.teamFunction).toLowerCase();
  const workspaceName = cleanText(payload.workspaceName) || "Kira Home";
  const inviterEmail = auth.email || process.env.SUPPORT_EMAIL || "support@kira.local";
  const productUrl = cleanUrl(payload.productUrl, appBaseUrl(request));
  const inviteFromEmail = cleanEmail(process.env.INVITE_FROM_EMAIL || "");

  if (!email) {
    sendJson(response, 400, { error: "Invite email is required." });
    return;
  }
  if (!["admin", "manager", "member"].includes(role)) {
    throwHttpError(400, "INVALID_INVITE_ROLE", "Invite role must be admin, manager, or member.");
  }
  if (teamFunction && !["dialer", "setter", "closer"].includes(teamFunction)) {
    throwHttpError(400, "INVALID_TEAM_FUNCTION", "Team function must be dialer, setter, closer, or blank.");
  }
  await assertInviteCapacityAndUniqueness(workspaceId, email, { inviteId });

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
      role,
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

async function handleAcceptInvite(request, response, payload) {
  const auth = await requireAuthenticatedRequest(request);
  const token = cleanText(payload.token);
  const userId = auth.userId;
  const userEmail = auth.email;

  if (!token || !userId || !userEmail) {
    sendJson(response, 400, { error: "Invite token and signed-in email are required." });
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
    throwHttpError(404, "INVITE_NOT_FOUND", "Invite link is invalid or expired.");
  }

  if (invitation.email.toLowerCase() !== userEmail.toLowerCase()) {
    throwHttpError(403, "INVITE_EMAIL_MISMATCH", "This invite belongs to a different email address.");
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
    role: invitation.role,
    teamFunction: invitation.team_function || "",
    requiresPasswordChange: true,
    message: "Invite accepted. Workspace access is ready.",
  });
}

async function handleGoogleCalendarConnect(request, response, payload) {
  const auth = await requireAuthenticatedRequest(request);
  const access = await requireWorkspaceAccess(auth, payload.workspaceId, { allowedRoles: ["owner", "admin"] });
  const workspaceId = access.workspaceId;
  const baseUrl = appBaseUrl(request);

  if (!hasGoogleCalendarConfig()) {
    sendJson(response, 200, {
      demo: true,
      connected: false,
      message: "Google Calendar is not configured. Add GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET.",
    });
    return;
  }

  assertGoogleTokenEncryptionConfigured();
  const state = signCalendarState({
    workspaceId,
    userId: auth.userId,
    email: auth.email,
    createdAt: Date.now(),
    nonce: randomBytes(12).toString("hex"),
  });
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
    if (!stateValue?.workspaceId || !stateValue?.userId) throwInputError("Google Calendar state is invalid.");
    if (!hasSupabaseServiceConfig()) throwInputError("Supabase service role is required to store Google Calendar tokens.");
    await requireWorkspaceAccessForUser(stateValue.userId, stateValue.workspaceId, { allowedRoles: ["owner", "admin"] });
    assertGoogleTokenEncryptionConfigured();

    const token = await exchangeGoogleCalendarCode(code, baseUrl);
    const profile = await fetchGoogleProfile(token.access_token);
    await saveGoogleCalendarConnection({
      workspaceId: stateValue.workspaceId,
      googleAccountEmail: profile.email || stateValue.email || "",
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

async function handleGoogleCalendarStatus(request, response, payload) {
  const auth = await requireAuthenticatedRequest(request);
  const access = await requireWorkspaceAccess(auth, payload.workspaceId);
  const workspaceId = access.workspaceId;
  if (!hasGoogleCalendarConfig()) {
    sendJson(response, 200, {
      configured: false,
      connected: false,
      message: "Google Calendar credentials are not configured.",
    });
    return;
  }
  const connection = await loadGoogleCalendarConnection(workspaceId);
  sendJson(response, 200, {
    configured: true,
    connected: hasStoredGoogleTokens(connection),
    status: connection?.status || "not_connected",
    googleAccountEmail: connection?.google_account_email || "",
    calendarId: connection?.calendar_id || "primary",
    expiresAt: connection?.expires_at || "",
    message: connection ? "Google Calendar is connected." : "Google Calendar is ready to connect.",
  });
}

async function handleGoogleCalendarCreateEvent(request, response, payload) {
  const auth = await requireAuthenticatedRequest(request);
  const access = await requireWorkspaceAccess(auth, payload.workspaceId);
  const workspaceId = access.workspaceId;
  const appointment = payload.appointment || {};

  if (!hasGoogleCalendarConfig()) {
    sendJson(response, 200, {
      demo: true,
      synced: false,
      message: "Google Calendar credentials are not configured.",
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

async function optionalReadinessAdminAccess(request, payload = {}) {
  try {
    if (!bearerTokenFromRequest(request) || !payload.workspaceId) return null;
    const auth = await requireAuthenticatedRequest(request);
    return requireWorkspaceAccess(auth, payload.workspaceId, { allowedRoles: ["owner", "admin"] });
  } catch {
    return null;
  }
}

async function requireAuthenticatedRequest(request) {
  const accessToken = bearerTokenFromRequest(request);
  if (!accessToken) {
    throwHttpError(401, "AUTH_REQUIRED", "Sign in to the CRM before using this endpoint.");
  }
  assertSupabaseAuthConfig();
  const user = await loadSupabaseUser(accessToken);
  return {
    accessToken,
    user,
    userId: cleanUuid(user.id),
    email: cleanEmail(user.email),
  };
}

function bearerTokenFromRequest(request) {
  const header = request.headers.authorization || request.headers.Authorization || "";
  if (Array.isArray(header) || String(header).includes(",")) {
    throwHttpError(401, "AUTH_AMBIGUOUS", "Authorization header is ambiguous.");
  }
  if (!header) return "";
  const match = String(header).match(/^Bearer\s+(.+)$/i);
  if (!match || !cleanText(match[1])) {
    throwHttpError(401, "AUTH_MALFORMED", "Authorization header must use Bearer authentication.");
  }
  return cleanText(match[1]);
}

function assertSupabaseAuthConfig() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throwHttpError(503, "AUTH_CONFIG_REQUIRED", "Live authentication is not configured on this backend.");
  }
}

async function requireWorkspaceAccess(auth, workspaceId, options = {}) {
  return requireWorkspaceAccessForUser(auth.userId, workspaceId, {
    ...options,
    email: auth.email,
  });
}

async function requireWorkspaceAccessForUser(userId, workspaceId, options = {}) {
  const cleanedWorkspaceId = cleanUuid(workspaceId);
  const cleanedUserId = cleanUuid(userId);
  if (!cleanedWorkspaceId) throwInputError("A valid workspace ID is required.");
  if (!cleanedUserId) throwHttpError(401, "AUTH_INVALID", "Supabase user identity is invalid.");

  const [workspaceRows, memberRows] = await Promise.all([
    supabaseRequest(`workspaces?id=eq.${encodeURIComponent(cleanedWorkspaceId)}&select=id,owner_id,name`, { method: "GET" }),
    supabaseRequest(
      `workspace_members?workspace_id=eq.${encodeURIComponent(cleanedWorkspaceId)}&user_id=eq.${encodeURIComponent(cleanedUserId)}&select=workspace_id,user_id,role,team_function`,
      { method: "GET" },
    ),
  ]);

  const workspace = Array.isArray(workspaceRows) ? workspaceRows[0] : null;
  const member = Array.isArray(memberRows) ? memberRows[0] : null;
  const role = workspace?.owner_id === cleanedUserId ? "owner" : normalizeRoleId(member?.role || "");
  if (!workspace || (!member && role !== "owner")) {
    throwHttpError(403, "WORKSPACE_FORBIDDEN", "You do not have access to this workspace.");
  }

  const allowedRoles = options.allowedRoles || ["owner", "admin", "manager", "member"];
  if (!allowedRoles.includes(role)) {
    throwHttpError(403, "ROLE_FORBIDDEN", "Your workspace role does not allow this action.");
  }

  return {
    workspaceId: cleanedWorkspaceId,
    workspaceName: workspace.name || "",
    userId: cleanedUserId,
    email: options.email || "",
    role,
    teamFunction: member?.team_function || "",
  };
}

async function assertLeadBelongsToWorkspace(workspaceId, leadId) {
  const rawLeadId = cleanText(leadId);
  if (!rawLeadId) return;
  const cleanedLeadId = cleanUuid(rawLeadId);
  if (!cleanedLeadId) throwInputError("A valid lead ID is required.");
  const rows = await supabaseRequest(
    `leads?id=eq.${encodeURIComponent(cleanedLeadId)}&workspace_id=eq.${encodeURIComponent(workspaceId)}&select=id`,
    { method: "GET" },
  );
  if (!Array.isArray(rows) || !rows.length) {
    throwHttpError(403, "RESOURCE_FORBIDDEN", "This lead does not belong to the authenticated workspace.");
  }
}

function throwHttpError(statusCode, code, message) {
  const error = new Error(message);
  error.statusCode = statusCode;
  error.code = code;
  throw error;
}

export function redactSecurityLog(value) {
  const secretKeys = [
    "authorization",
    "access_token",
    "refresh_token",
    "token",
    "token_hash",
    "invite_token",
    "temporary_password",
    "password",
    "secret",
    "api_key",
    "apikey",
    "auth_token",
    "webhook_secret",
    "encryption_key",
    "tag",
  ];
  const redactText = (text) =>
    String(text)
      .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
      .replace(/\b(sk_live|sk_test|rk_live|SG|xox[baprs]|AIza|ya29|sb_secret|sb_publishable)_[A-Za-z0-9._-]+/g, "[redacted-secret]")
      .replace(/\b[A-Za-z0-9+/]{32,}={0,2}\b/g, "[redacted-token]");

  const walk = (entry, key = "") => {
    if (entry === null || entry === undefined) return entry;
    if (secretKeys.some((secretKey) => key.toLowerCase().includes(secretKey))) return "[redacted]";
    if (typeof entry === "string") return redactText(entry);
    if (Array.isArray(entry)) return entry.map((item) => walk(item, key));
    if (typeof entry === "object") {
      return Object.fromEntries(Object.entries(entry).map(([childKey, childValue]) => [childKey, walk(childValue, childKey)]));
    }
    return entry;
  };

  return walk(value);
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

async function handleRecruitingRequest(pathname, request, response, payload) {
  const auth = await requireAuthenticatedRequest(request);

  if (pathname === "/api/recruiting/access") {
    const access = await recruitingAccessForPayload(auth, payload, { allowLocked: true });
    sendJson(response, 200, access);
    return;
  }

  if (pathname === "/api/recruiting/addon-settings") {
    const access = await recruitingAccessForPayload(auth, payload, { allowLocked: true, requireAdmin: true });
    const status = ["locked", "requested", "trialing", "active", "early_access", "canceled"].includes(cleanText(payload.status))
      ? cleanText(payload.status)
      : "early_access";
    const allowedRoles = sanitizeRoleList(payload.allowedRoles || ["owner", "admin", "manager"]);
    const now = new Date().toISOString();
    const metadata = sanitizeJson({
      ...(payload.metadata || {}),
      crmApp: "ClosePilot CRM",
      module: "Kira Recruit",
      allowedRoles,
      enabledBy: access.email,
      enabledAt: now,
    });
    await supabaseRequest("workspace_addons?on_conflict=workspace_id,addon_key", {
      method: "POST",
      body: [
        {
          workspace_id: access.workspaceId,
          addon_key: "recruiting",
          status,
          trial_ends_at: payload.trialEndsAt || null,
          metadata,
          updated_at: now,
        },
      ],
      prefer: "resolution=merge-duplicates,return=minimal",
    });
    await logWorkspaceAudit(access.workspaceId, "Kira Recruit add-on updated", `${access.email} set Kira Recruit add-on to ${status}.`);
    const refreshedAccess = await recruitingAccessForPayload(auth, payload, { allowLocked: true });
    sendJson(response, 200, {
      saved: true,
      access: refreshedAccess,
      message: "Kira Recruit early access is enabled for this CRM workspace.",
    });
    return;
  }

  if (pathname === "/api/recruiting/load") {
    const access = await recruitingAccessForPayload(auth, payload);
    const appState = await loadRecruitingAppState(access.workspaceId);
    const candidates = await loadRecruitingCandidatesForWorkspace(access.workspaceId);
    sendJson(response, 200, { access, state: appState, candidates });
    return;
  }

  if (pathname === "/api/recruiting/save") {
    const access = await recruitingAccessForPayload(auth, payload);
    const state = sanitizeRecruitingState(payload.state || {});
    await saveRecruitingAppState(access.workspaceId, state);
    const candidates = await saveRecruitingCandidatesForWorkspace(access.workspaceId, payload.candidates || state.candidates || []);
    await logWorkspaceAudit(access.workspaceId, "Recruiting state synced", `${access.email} synced Kira Recruit state.`);
    sendJson(response, 200, {
      saved: true,
      access,
      candidates,
      message: "Kira Recruit state synced to the live workspace.",
    });
    return;
  }

  if (pathname === "/api/recruiting/applicants") {
    const access = await recruitingAccessForPayload(auth, payload);
    const incoming = Array.isArray(payload.candidates) ? payload.candidates : payload.candidate ? [payload.candidate] : [];
    const candidates = await saveRecruitingCandidatesForWorkspace(access.workspaceId, incoming);
    await logWorkspaceAudit(access.workspaceId, "Recruiting applicants synced", `${candidates.length} applicant record(s) synced.`);
    sendJson(response, 200, { synced: true, count: candidates.length, candidates });
    return;
  }

  if (pathname === "/api/recruiting/onboarding-email") {
    const access = await recruitingAccessForPayload(auth, payload);
    const workerRecipients = Array.isArray(payload.workers)
      ? payload.workers.map((worker) => cleanEmail(worker.email)).filter(Boolean)
      : [];
    const recipients = Array.isArray(payload.recipients) ? payload.recipients.map(cleanEmail).filter(Boolean) : workerRecipients;
    if (!recipients.length) throwInputError("At least one onboarding recipient is required.");
    await logWorkspaceAudit(
      access.workspaceId,
      "Recruiting onboarding email staged",
      `${access.email} staged ${recipients.length} onboarding email(s) with ${cleanText(payload.template || "welcome")} template.`,
    );
    sendJson(response, 200, {
      staged: true,
      provider: process.env.RESEND_API_KEY ? "resend-ready" : "provider-not-configured",
      message: "Onboarding email staged. Use a secure payroll/onboarding provider for tax and bank forms.",
    });
    return;
  }

  if (pathname === "/api/recruiting/crm-handoff") {
    const access = await recruitingAccessForPayload(auth, payload);
    const result = await handleRecruitingCrmHandoff(access, payload);
    sendJson(response, 200, result);
    return;
  }

  if (pathname === "/api/recruiting/integration-status") {
    const access = await recruitingAccessForPayload(auth, payload, { requireAdmin: true });
    const provider = cleanText(payload.provider || "indeed").toLowerCase();
    const publicPayload = sanitizeJson(payload.publicConfig || {});
    const publicConfig = {
      accountId: cleanText(publicPayload.accountId || payload.accountId),
      email: cleanEmail(publicPayload.email || payload.email),
      webhookUrl: cleanUrl(publicPayload.webhookUrl || payload.webhookUrl, ""),
      budget: cleanText(publicPayload.budget || payload.budget),
      companyId: cleanText(publicPayload.companyId || payload.companyId),
      tokenConfigured: Boolean(publicPayload.tokenConfigured || cleanText(publicPayload.tokenLast4 || payload.tokenConfigured || payload.tokenLast4)),
      tokenLast4: cleanText(publicPayload.tokenLast4 || payload.tokenLast4).slice(-4),
      status: cleanText(publicPayload.status || payload.status || "saved"),
      checkedAt: new Date().toISOString(),
    };
    await supabaseRequest("integration_settings?on_conflict=workspace_id,provider", {
      method: "POST",
      body: [
        {
          workspace_id: access.workspaceId,
          provider: `recruiting:${provider}`,
          status: publicConfig.status,
          public_config: publicConfig,
          last_checked_at: publicConfig.checkedAt,
          updated_at: publicConfig.checkedAt,
        },
      ],
      prefer: "resolution=merge-duplicates,return=minimal",
    });
    sendJson(response, 200, {
      saved: true,
      provider,
      publicConfig,
      message: `${provider} integration metadata saved. Secrets are not stored from the browser.`,
    });
    return;
  }

  sendJson(response, 404, { error: "Recruiting route not found" });
}

async function recruitingAccessForPayload(auth, payload, options = {}) {
  const requestedWorkspaceId = cleanUuid(payload.workspaceId);
  if (payload.workspaceId && !requestedWorkspaceId) throwInputError("A valid workspace ID is required.");
  const memberships = await supabaseRequest(
    `workspace_members?user_id=eq.${encodeURIComponent(auth.userId)}&select=workspace_id,role,team_function`,
    { method: "GET" },
  );
  const membership = (memberships || []).find((item) => !requestedWorkspaceId || item.workspace_id === requestedWorkspaceId) || memberships?.[0];
  if (!membership) {
    const error = new Error("No CRM workspace membership found for this user.");
    error.statusCode = 403;
    throw error;
  }

  const workspaceId = membership.workspace_id;
  const role = normalizeRoleId(membership.role);
  const addon = await loadWorkspaceAddon(workspaceId, "recruiting");
  const subscription = await loadSubscriptionFromSupabase(workspaceId);
  const addonStatus = cleanText(addon?.status || "locked");
  const addonEnabled = ["active", "trialing", "early_access"].includes(addonStatus);
  const addonMetadata = sanitizeJson(addon?.metadata || {});
  const allowedRoles = sanitizeRoleList(addonMetadata.allowedRoles || ["owner", "admin", "manager"]);
  const roleCanOpen = ["owner", "admin", "manager"].includes(role) || allowedRoles.includes(role);
  const setupAllowed = ["owner", "admin"].includes(role);
  const locked = !roleCanOpen || !addonEnabled;
  if (options.requireAdmin && !setupAllowed) {
    const error = new Error("Only Owners and Admins can manage Kira Recruit setup.");
    error.statusCode = 403;
    throw error;
  }
  if (!options.allowLocked && locked) {
    const error = new Error(
      !roleCanOpen
        ? "Kira Recruit is restricted to Owners, Admins, and Managers."
        : "Kira Recruit is a locked paid add-on for this workspace.",
    );
    error.statusCode = 403;
    throw error;
  }

  return {
    mode: locked ? "locked" : "live",
    locked,
    workspaceId,
    email: auth.email,
    userId: auth.userId,
    role,
    teamFunction: membership.team_function || "",
    setupAllowed,
    addonStatus,
    allowedRoles,
    subscriptionStatus: subscription?.status || "",
    plan: subscription?.plan || "starter",
    crmApp: "ClosePilot CRM",
    module: "Kira Recruit",
    label: locked ? "Locked paid add-on" : "Live recruiting add-on",
    message: locked
      ? setupAllowed
        ? "Kira Recruit is locked until an Owner/Admin enables early access for this CRM workspace."
        : "Kira Recruit is a paid add-on. Ask an Owner/Admin to enable early access."
      : "Kira Recruit live add-on access confirmed.",
  };
}

async function loadSupabaseUser(accessToken) {
  const response = await fetch(`${process.env.SUPABASE_URL.replace(/\/$/, "")}/auth/v1/user`, {
    headers: {
      apikey: process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY,
      authorization: `Bearer ${accessToken}`,
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.id) {
    const error = new Error(data.message || "Supabase session is expired. Sign in again from the CRM.");
    error.statusCode = 401;
    error.code = "AUTH_INVALID";
    throw error;
  }
  return data;
}

async function loadWorkspaceAddon(workspaceId, addonKey) {
  try {
    const rows = await supabaseRequest(
      `workspace_addons?workspace_id=eq.${encodeURIComponent(workspaceId)}&addon_key=eq.${encodeURIComponent(addonKey)}&select=*`,
      { method: "GET" },
    );
    return Array.isArray(rows) ? rows[0] || null : null;
  } catch (error) {
    if (isMissingTableError(error, "workspace_addons")) return null;
    throw error;
  }
}

async function loadRecruitingAppState(workspaceId) {
  try {
    const rows = await supabaseRequest(`recruiting_app_state?workspace_id=eq.${encodeURIComponent(workspaceId)}&select=*`, {
      method: "GET",
    });
    const row = Array.isArray(rows) ? rows[0] : null;
    return row
      ? {
          job: row.job || {},
          postings: row.postings || [],
          integrations: row.integrations_public || {},
          connectorSettings: row.connector_settings || {},
          interviews: row.interviews || [],
          onboardingWorkers: row.onboarding_workers || [],
          payrollProvider: row.payroll_provider_public || {},
          payrollRuns: row.payroll_runs || [],
          recruiterNotes: row.recruiter_notes || [],
          hiringOutcomes: row.hiring_outcomes || [],
          crmHandoffs: row.crm_handoffs || [],
          feedSyncedAt: row.feed_synced_at || "",
        }
      : {};
  } catch (error) {
    if (isMissingTableError(error, "recruiting_app_state")) return {};
    throw error;
  }
}

async function saveRecruitingAppState(workspaceId, state) {
  await supabaseRequest("recruiting_app_state?on_conflict=workspace_id", {
    method: "POST",
    body: [
      {
        workspace_id: workspaceId,
        job: state.job || {},
        postings: state.postings || [],
        integrations_public: state.integrations || {},
        connector_settings: state.connectorSettings || {},
        interviews: state.interviews || [],
        onboarding_workers: state.onboardingWorkers || [],
        payroll_provider_public: state.payrollProvider || {},
        payroll_runs: state.payrollRuns || [],
        recruiter_notes: state.recruiterNotes || [],
        hiring_outcomes: state.hiringOutcomes || [],
        crm_handoffs: state.crmHandoffs || [],
        feed_synced_at: state.feedSyncedAt || null,
        updated_at: new Date().toISOString(),
      },
    ],
    prefer: "resolution=merge-duplicates,return=minimal",
  });
}

async function loadRecruitingCandidatesForWorkspace(workspaceId) {
  try {
    const rows = await supabaseRequest(
      `recruiting_candidates?workspace_id=eq.${encodeURIComponent(workspaceId)}&select=*&order=synced_at.desc`,
      { method: "GET" },
    );
    return (rows || []).map(recruitingCandidateFromRow);
  } catch (error) {
    if (isMissingTableError(error, "recruiting_candidates")) return [];
    throw error;
  }
}

async function saveRecruitingCandidatesForWorkspace(workspaceId, candidates) {
  const normalized = (Array.isArray(candidates) ? candidates : []).map(normalizeRecruitingCandidatePayload).filter((candidate) => candidate.name);
  if (!normalized.length) return [];
  await supabaseRequest("recruiting_candidates?on_conflict=workspace_id,external_id", {
    method: "POST",
    body: normalized.map((candidate) => recruitingCandidateToRow(candidate, workspaceId)),
    prefer: "resolution=merge-duplicates,return=representation",
  });
  return loadRecruitingCandidatesForWorkspace(workspaceId);
}

function sanitizeRecruitingState(state) {
  return {
    job: sanitizeJson(state.job || {}),
    postings: sanitizeJsonArray(state.postings),
    integrations: sanitizeIntegrationPublicConfig(state.integrations || {}),
    connectorSettings: sanitizeConnectorSettings(state.connectorSettings || {}),
    interviews: sanitizeJsonArray(state.interviews),
    onboardingWorkers: sanitizeOnboardingWorkers(state.onboardingWorkers),
    payrollProvider: sanitizePayrollProvider(state.payrollProvider || {}),
    payrollRuns: sanitizeJsonArray(state.payrollRuns),
    recruiterNotes: sanitizeJsonArray(state.recruiterNotes),
    hiringOutcomes: sanitizeJsonArray(state.hiringOutcomes),
    crmHandoffs: sanitizeJsonArray(state.crmHandoffs),
    feedSyncedAt: cleanText(state.feedSyncedAt),
  };
}

function sanitizeIntegrationPublicConfig(integrations) {
  return Object.fromEntries(
    Object.entries(integrations || {}).map(([key, value]) => [
      cleanText(key),
      sanitizeJson({
        ...value,
        tokenConfigured: Boolean(value?.tokenConfigured),
        tokenLast4: cleanText(value?.tokenLast4).slice(-4),
        apiToken: undefined,
        token: undefined,
      }),
    ]),
  );
}

function sanitizeConnectorSettings(settings) {
  return sanitizeJson({
    ...settings,
    apiToken: undefined,
    accessToken: undefined,
    refreshToken: undefined,
    clientSecret: undefined,
    token: undefined,
    secret: undefined,
  });
}

function sanitizePayrollProvider(provider) {
  return sanitizeJson({
    ...provider,
    tokenConfigured: Boolean(provider?.tokenConfigured),
    tokenLast4: cleanText(provider?.tokenLast4).slice(-4),
    apiToken: undefined,
    token: undefined,
  });
}

function sanitizeOnboardingWorkers(workers) {
  return sanitizeJsonArray(workers).map((worker) => ({
    ...worker,
    notes: cleanText(worker.notes).replace(/\b\d{3}-?\d{2}-?\d{4}\b/g, "[redacted tax id]").replace(/\b\d{9,17}\b/g, "[redacted sensitive number]"),
  }));
}

function sanitizeJsonArray(value) {
  return Array.isArray(value) ? value.map(sanitizeJson) : [];
}

function sanitizeJson(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

function normalizeRecruitingCandidatePayload(candidate = {}) {
  const externalId = cleanText(candidate.externalId || candidate.id || candidate.email || candidate.name);
  return {
    id: externalId,
    externalId,
    name: cleanText(candidate.name).slice(0, 160),
    role: cleanText(candidate.role || candidate.jobTitle || "Sales candidate").slice(0, 160),
    source: cleanText(candidate.source || "Kira Recruit").slice(0, 120),
    interviewStatus: cleanText(candidate.interviewStatus || candidate.status || "New").slice(0, 80),
    interviewAt: cleanText(candidate.interviewAt || ""),
    score: Math.min(100, Math.max(0, Number(candidate.score || 65))),
    nextAction: cleanText(candidate.nextAction || "Review candidate fit.").slice(0, 500),
    email: cleanEmail(candidate.email),
    phone: cleanText(candidate.phone).slice(0, 80),
    assignedRecruiter: cleanText(candidate.assignedRecruiter).slice(0, 160),
    assignedManager: cleanText(candidate.assignedManager).slice(0, 160),
    hiringOutcome: normalizeHiringOutcome(candidate.hiringOutcome),
    recruiterNotes: cleanText(candidate.recruiterNotes).slice(0, 2000),
    convertedLeadId: cleanUuid(candidate.convertedLeadId),
    convertedMemberInvitationId: cleanUuid(candidate.convertedMemberInvitationId),
    followUpTaskId: cleanUuid(candidate.followUpTaskId),
    activityNoteId: cleanUuid(candidate.activityNoteId),
    reviewedAt: cleanText(candidate.reviewedAt || ""),
    lastHandoffAt: cleanText(candidate.lastHandoffAt || ""),
    syncedAt: cleanText(candidate.syncedAt || new Date().toISOString()),
    experience: cleanText(candidate.experience).slice(0, 1000),
    skills: Array.isArray(candidate.skills) ? candidate.skills.map((skill) => cleanText(skill)).filter(Boolean).slice(0, 12) : [],
    taskCreatedAt: cleanText(candidate.taskCreatedAt || ""),
  };
}

function recruitingCandidateToRow(candidate, workspaceId) {
  return {
    workspace_id: workspaceId,
    external_id: candidate.externalId,
    name: candidate.name,
    role: candidate.role,
    source: candidate.source,
    interview_status: candidate.interviewStatus,
    interview_at: candidate.interviewAt || null,
    score: Math.round(candidate.score),
    next_action: candidate.nextAction,
    email: candidate.email,
    phone: candidate.phone,
    assigned_recruiter: candidate.assignedRecruiter,
    assigned_manager: candidate.assignedManager,
    hiring_outcome: candidate.hiringOutcome,
    recruiter_notes: candidate.recruiterNotes,
    status: candidate.convertedLeadId || candidate.convertedMemberInvitationId || candidate.hiringOutcome === "hired" ? "converted" : candidate.reviewedAt ? "reviewed" : "new",
    converted_lead_id: candidate.convertedLeadId || null,
    converted_member_invitation_id: candidate.convertedMemberInvitationId || null,
    follow_up_task_id: candidate.followUpTaskId || null,
    activity_note_id: candidate.activityNoteId || null,
    reviewed_at: candidate.reviewedAt || null,
    last_handoff_at: candidate.lastHandoffAt || null,
    synced_at: candidate.syncedAt || new Date().toISOString(),
    payload: {
      experience: candidate.experience,
      skills: candidate.skills,
      taskCreatedAt: candidate.taskCreatedAt,
      assignedRecruiter: candidate.assignedRecruiter,
      assignedManager: candidate.assignedManager,
      hiringOutcome: candidate.hiringOutcome,
      recruiterNotes: candidate.recruiterNotes,
      convertedMemberInvitationId: candidate.convertedMemberInvitationId,
      followUpTaskId: candidate.followUpTaskId,
      activityNoteId: candidate.activityNoteId,
      lastHandoffAt: candidate.lastHandoffAt,
    },
    updated_at: new Date().toISOString(),
  };
}

function recruitingCandidateFromRow(row) {
  return normalizeRecruitingCandidatePayload({
    id: row.external_id || row.id,
    externalId: row.external_id || row.id,
    name: row.name,
    role: row.role,
    source: row.source,
    interviewStatus: row.interview_status,
    interviewAt: row.interview_at || "",
    score: row.score,
    nextAction: row.next_action,
    email: row.email,
    phone: row.phone,
    assignedRecruiter: row.assigned_recruiter || row.payload?.assignedRecruiter || "",
    assignedManager: row.assigned_manager || row.payload?.assignedManager || "",
    hiringOutcome: row.hiring_outcome || row.payload?.hiringOutcome || "",
    recruiterNotes: row.recruiter_notes || row.payload?.recruiterNotes || "",
    convertedLeadId: row.converted_lead_id || "",
    convertedMemberInvitationId: row.converted_member_invitation_id || row.payload?.convertedMemberInvitationId || "",
    followUpTaskId: row.follow_up_task_id || row.payload?.followUpTaskId || "",
    activityNoteId: row.activity_note_id || row.payload?.activityNoteId || "",
    reviewedAt: row.reviewed_at || "",
    lastHandoffAt: row.last_handoff_at || row.payload?.lastHandoffAt || "",
    syncedAt: row.synced_at || "",
    experience: row.payload?.experience || "",
    skills: row.payload?.skills || [],
    taskCreatedAt: row.payload?.taskCreatedAt || "",
  });
}

async function handleRecruitingCrmHandoff(access, payload) {
  const action = cleanText(payload.action || "update-hiring");
  const now = new Date().toISOString();
  const candidate = normalizeRecruitingCandidatePayload({
    ...(payload.candidate || {}),
    assignedRecruiter: payload.assignedRecruiter || payload.candidate?.assignedRecruiter,
    assignedManager: payload.assignedManager || payload.candidate?.assignedManager,
    hiringOutcome: payload.hiringOutcome || payload.candidate?.hiringOutcome,
    recruiterNotes: payload.recruiterNotes || payload.candidate?.recruiterNotes,
  });
  if (!candidate.name) throwInputError("Candidate is required for CRM handoff.");

  let message = "Candidate handoff saved to the CRM workspace.";
  const handoff = {
    action,
    candidateExternalId: candidate.externalId,
    candidateName: candidate.name,
    candidateEmail: candidate.email,
    performedBy: access.email,
    performedAt: now,
  };

  if (action === "convert-team-member") {
    if (!access.setupAllowed) {
      const error = new Error("Only Owners and Admins can convert candidates to team members.");
      error.statusCode = 403;
      throw error;
    }
    const invitation = await upsertRecruitingMemberInvitation(access, candidate, payload, now);
    candidate.convertedMemberInvitationId = invitation.id || candidate.convertedMemberInvitationId;
    candidate.hiringOutcome = normalizeHiringOutcome(payload.hiringOutcome || candidate.hiringOutcome || "hired");
    candidate.reviewedAt = candidate.reviewedAt || now;
    candidate.lastHandoffAt = now;
    handoff.invitationId = invitation.id || "";
    handoff.hiringOutcome = candidate.hiringOutcome;
    message = `${candidate.name} was staged as a CRM team member invitation.`;
  } else if (action === "create-follow-up-task") {
    const taskText =
      cleanText(payload.taskText).slice(0, 500) ||
      `Follow up with ${candidate.name} about ${candidate.role || "the open role"}.`;
    const rows = await supabaseRequest("tasks", {
      method: "POST",
      body: [
        {
          workspace_id: access.workspaceId,
          text: taskText,
          due: cleanText(payload.due || "today").slice(0, 80) || "today",
        },
      ],
      prefer: "return=representation",
    });
    candidate.followUpTaskId = rows?.[0]?.id || candidate.followUpTaskId;
    candidate.lastHandoffAt = now;
    handoff.taskId = candidate.followUpTaskId;
    message = `Follow-up task created for ${candidate.name}.`;
  } else if (action === "add-activity-note") {
    const note =
      cleanText(payload.note || candidate.recruiterNotes).slice(0, 1000) ||
      `${candidate.name} reviewed in Kira Recruit.`;
    const rows = await supabaseRequest("activities", {
      method: "POST",
      body: [
        {
          workspace_id: access.workspaceId,
          type: "recruiting",
          message: note,
        },
      ],
      prefer: "return=representation",
    });
    candidate.activityNoteId = rows?.[0]?.id || candidate.activityNoteId;
    candidate.recruiterNotes = note;
    candidate.lastHandoffAt = now;
    handoff.activityId = candidate.activityNoteId;
    message = `Activity note added for ${candidate.name}.`;
  } else if (["update-hiring", "assign-candidate", "save-handoff"].includes(action)) {
    candidate.assignedRecruiter = cleanText(payload.assignedRecruiter || candidate.assignedRecruiter).slice(0, 160);
    candidate.assignedManager = cleanText(payload.assignedManager || candidate.assignedManager).slice(0, 160);
    candidate.hiringOutcome = normalizeHiringOutcome(payload.hiringOutcome || candidate.hiringOutcome);
    candidate.recruiterNotes = cleanText(payload.recruiterNotes || candidate.recruiterNotes).slice(0, 2000);
    candidate.reviewedAt = candidate.reviewedAt || now;
    candidate.lastHandoffAt = now;
    handoff.assignedRecruiter = candidate.assignedRecruiter;
    handoff.assignedManager = candidate.assignedManager;
    handoff.hiringOutcome = candidate.hiringOutcome;
    message = `${candidate.name} assignment and hiring outcome saved.`;
  } else {
    throwInputError("Unsupported recruiting CRM handoff action.");
  }

  const candidates = await saveRecruitingCandidatesForWorkspace(access.workspaceId, [candidate]);
  const updatedCandidate =
    candidates.find((item) => item.externalId === candidate.externalId || item.id === candidate.externalId) || candidate;
  await recordRecruitingHandoff(access.workspaceId, handoff, updatedCandidate);
  await logWorkspaceAudit(access.workspaceId, "Kira Recruit CRM handoff", `${access.email} ran ${action} for ${candidate.name}.`);

  return {
    saved: true,
    action,
    candidate: updatedCandidate,
    handoff,
    message,
  };
}

async function upsertRecruitingMemberInvitation(access, candidate, payload, now) {
  const email = cleanEmail(candidate.email);
  if (!email) throwInputError("Candidate email is required before converting to a team member.");
  const role = cleanText(payload.memberRole || "member").toLowerCase();
  if (!["admin", "manager", "member"].includes(role)) {
    throwHttpError(400, "INVALID_MEMBER_ROLE", "Converted team member role must be admin, manager, or member.");
  }
  const rows = await supabaseRequest("workspace_invitations?on_conflict=workspace_id,email", {
    method: "POST",
    body: [
      {
        workspace_id: access.workspaceId,
        email,
        role,
        team_function: inferTeamFunction(candidate.role || candidate.nextAction),
        status: "pending",
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        onboarding_started_at: now,
      },
    ],
    prefer: "resolution=merge-duplicates,return=representation",
  });
  return rows?.[0] || {};
}

async function recordRecruitingHandoff(workspaceId, handoff, candidate) {
  const current = await loadRecruitingAppState(workspaceId);
  const nextHandoff = sanitizeJson({ ...handoff, candidateId: candidate.id || candidate.externalId });
  const hiringOutcome = sanitizeJson({
    candidateExternalId: candidate.externalId || candidate.id,
    candidateName: candidate.name,
    outcome: candidate.hiringOutcome,
    updatedAt: handoff.performedAt,
  });
  const recruiterNote = candidate.recruiterNotes
    ? sanitizeJson({
        candidateExternalId: candidate.externalId || candidate.id,
        candidateName: candidate.name,
        note: candidate.recruiterNotes,
        updatedAt: handoff.performedAt,
      })
    : null;

  await saveRecruitingAppState(workspaceId, {
    ...current,
    crmHandoffs: [nextHandoff, ...(current.crmHandoffs || [])].slice(0, 100),
    hiringOutcomes: [hiringOutcome, ...(current.hiringOutcomes || [])].slice(0, 100),
    recruiterNotes: recruiterNote ? [recruiterNote, ...(current.recruiterNotes || [])].slice(0, 100) : current.recruiterNotes || [],
  });
}

function inferTeamFunction(value) {
  const text = cleanText(value).toLowerCase();
  if (text.includes("closer")) return "closer";
  if (text.includes("setter")) return "setter";
  if (text.includes("dial") || text.includes("sdr") || text.includes("caller")) return "dialer";
  return null;
}

async function logWorkspaceAudit(workspaceId, action, detail) {
  if (!workspaceId) return;
  try {
    await supabaseRequest("workspace_audit_events", {
      method: "POST",
      body: [{ workspace_id: workspaceId, action, detail }],
      prefer: "return=minimal",
    });
  } catch (error) {
    if (!isMissingTableError(error, "workspace_audit_events")) throw error;
  }
}

function launchWarnings(groups) {
  const warnings = [];
  if (!groups.database) warnings.push("Supabase is not fully configured; the app will use demo/localStorage fallback.");
  if (!groups.app) warnings.push("APP_BASE_URL is missing; invite links and OAuth redirects should be set to the production domain before live demos.");
  if (looksLikePreviewUrl(process.env.APP_BASE_URL)) {
    warnings.push("APP_BASE_URL looks like a Vercel preview URL. Use the production domain so invites do not send users to protected preview deployments.");
  }
  if (!groups.publicDemoConfigured) warnings.push("PUBLIC_DEMO_ENABLED is not explicitly set. Set it to false for production unless the public demo is intentional.");
  if (productionPublicDemoWarning()) warnings.push("PUBLIC_DEMO_ENABLED is true in a production-like environment. Keep it intentional, labeled, and monitored.");
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

function publicDemoIsEnabled() {
  return process.env.PUBLIC_DEMO_ENABLED !== "false";
}

function productionPublicDemoWarning() {
  const mode = cleanText(process.env.APP_MODE || process.env.VERCEL_ENV || "");
  return publicDemoIsEnabled() && ["beta", "production"].includes(mode);
}

function isLiveLikeMode() {
  const mode = cleanText(process.env.APP_MODE || process.env.VERCEL_ENV || "");
  return ["beta", "production"].includes(mode);
}

function readinessScore(items) {
  const checks = items.map(Boolean);
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
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
    seat_limit: subscription.seatLimit ?? planCatalog[normalizePlanId(subscription.plan)].seatLimit,
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

async function assertInviteCapacityAndUniqueness(workspaceId, email, { inviteId = "" } = {}) {
  if (!hasSupabaseServiceConfig() || !workspaceId || !email) return;
  const [subscription, members, pendingInvites] = await Promise.all([
    loadSubscriptionFromSupabase(workspaceId),
    supabaseRequest(`workspace_members?workspace_id=eq.${encodeURIComponent(workspaceId)}&select=user_id`, { method: "GET" }),
    supabaseRequest(
      `workspace_invitations?workspace_id=eq.${encodeURIComponent(workspaceId)}&email=eq.${encodeURIComponent(
        email,
      )}&status=in.(pending,accepted)&select=id,email,status`,
      { method: "GET" },
    ),
  ]);
  const activeInvites = Array.isArray(pendingInvites) ? pendingInvites : [];
  const sameInvite = inviteId ? activeInvites.find((invite) => invite.id === inviteId) : null;
  if (sameInvite?.status === "accepted") {
    throwHttpError(409, "INVITE_ALREADY_ACCEPTED", "This invite has already been accepted.");
  }
  const duplicateInvites = activeInvites.filter((invite) => !inviteId || invite.id !== inviteId);
  if (duplicateInvites.length) {
    throwHttpError(409, "INVITE_ALREADY_EXISTS", "An active invite already exists for this email.");
  }

  const seatLimit = Number(subscription?.seat_limit ?? planCatalog.starter.seatLimit);
  const activeMemberCount = Array.isArray(members) ? members.length : 0;
  const pendingSeatRows = await supabaseRequest(
    `workspace_invitations?workspace_id=eq.${encodeURIComponent(workspaceId)}&status=eq.pending&select=id`,
    { method: "GET" },
  );
  const pendingSeatCount = Array.isArray(pendingSeatRows)
    ? pendingSeatRows.filter((invite) => !inviteId || invite.id !== inviteId).length
    : 0;
  if (seatLimit > 0 && activeMemberCount + pendingSeatCount >= seatLimit) {
    throwHttpError(409, "SEAT_LIMIT_REACHED", "This workspace has reached its current seat limit.");
  }
}

async function updateInviteTokenInSupabase({
  workspaceId,
  inviteId,
  inviteTokenHash,
  expiresAt,
  role = "",
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
        role: role || "member",
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
  assertGoogleTokenEncryptionConfigured();
  const expiresAt = connection.expiresIn
    ? new Date(Date.now() + Math.max(0, Number(connection.expiresIn) - 60) * 1000).toISOString()
    : null;

  const existing = await loadGoogleCalendarConnection(connection.workspaceId);
  const existingRefreshToken = decryptGoogleToken(existing, "refresh") || cleanText(existing?.refresh_token);
  const refreshToken = cleanText(connection.refreshToken || existingRefreshToken);
  const accessTokenFields = encryptedGoogleTokenFields("access_token", connection.accessToken);
  const refreshTokenFields = encryptedGoogleTokenFields("refresh_token", refreshToken);
  await supabaseRequest("calendar_connections?on_conflict=workspace_id", {
    method: "POST",
    body: [
      {
        workspace_id: connection.workspaceId,
        provider: "google",
        google_account_email: cleanEmail(connection.googleAccountEmail),
        calendar_id: "primary",
        access_token: "",
        refresh_token: "",
        ...accessTokenFields,
        ...refreshTokenFields,
        token_key_version: googleTokenKeyVersion(),
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
  const accessToken = decryptGoogleToken(connection, "access") || cleanText(connection.access_token);
  const refreshToken = decryptGoogleToken(connection, "refresh") || cleanText(connection.refresh_token);
  if (accessToken && expiresAt - Date.now() > 2 * 60 * 1000) return accessToken;
  if (!refreshToken) throwInputError("Google Calendar refresh token is missing. Reconnect Calendar.");

  const response = await fetchWithTimeout("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CALENDAR_CLIENT_ID,
      client_secret: process.env.GOOGLE_CALENDAR_CLIENT_SECRET,
      refresh_token: refreshToken,
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
    refreshToken,
    expiresIn: data.expires_in,
    scope: data.scope || connection.scope,
  });
  return data.access_token;
}

function hasStoredGoogleTokens(connection) {
  return Boolean(
    connection &&
      (connection.refresh_token_ciphertext ||
        connection.access_token_ciphertext ||
        connection.refresh_token ||
        connection.access_token),
  );
}

function assertGoogleTokenEncryptionConfigured() {
  if (!googleTokenKey()) {
    throwHttpError(
      503,
      "GOOGLE_TOKEN_ENCRYPTION_REQUIRED",
      "Google Calendar token encryption is not configured. Set GOOGLE_TOKEN_ENCRYPTION_KEY before connecting calendars.",
    );
  }
}

function encryptedGoogleTokenFields(prefix, value) {
  const text = cleanText(value);
  if (!text) {
    return {
      [`${prefix}_ciphertext`]: "",
      [`${prefix}_iv`]: "",
      [`${prefix}_tag`]: "",
    };
  }
  const key = googleTokenKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return {
    [`${prefix}_ciphertext`]: ciphertext.toString("base64"),
    [`${prefix}_iv`]: iv.toString("base64"),
    [`${prefix}_tag`]: tag.toString("base64"),
  };
}

function decryptGoogleToken(connection, type) {
  if (!connection) return "";
  const prefix = type === "refresh" ? "refresh_token" : "access_token";
  const ciphertext = cleanText(connection[`${prefix}_ciphertext`]);
  const iv = cleanText(connection[`${prefix}_iv`]);
  const tag = cleanText(connection[`${prefix}_tag`]);
  if (!ciphertext || !iv || !tag) return "";
  const key = googleTokenKey();
  if (!key) return "";
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, Buffer.from(iv, "base64"));
    decipher.setAuthTag(Buffer.from(tag, "base64"));
    return Buffer.concat([decipher.update(Buffer.from(ciphertext, "base64")), decipher.final()]).toString("utf8");
  } catch {
    throwHttpError(500, "GOOGLE_TOKEN_DECRYPT_FAILED", "Stored Google Calendar tokens could not be decrypted.");
  }
}

function googleTokenKey() {
  const raw = cleanText(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY);
  if (!raw) return null;
  const candidates = [];
  if (/^[0-9a-f]{64}$/i.test(raw)) candidates.push(Buffer.from(raw, "hex"));
  candidates.push(Buffer.from(raw, "base64"));
  candidates.push(Buffer.from(raw, "utf8"));
  return candidates.find((candidate) => candidate.length === 32) || null;
}

function googleTokenKeyVersion() {
  return cleanText(process.env.GOOGLE_TOKEN_ENCRYPTION_KEY_VERSION || "v1");
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
    error.code = data?.code || "SUPABASE_REQUEST_FAILED";
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

function assertRequestedPlanId(plan) {
  const planId = cleanText(plan || "starter").toLowerCase();
  if (!planCatalog[planId]) {
    throwHttpError(400, "INVALID_PLAN", "Billing plan must be starter, growth, or scale.");
  }
  return planId;
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

function boundedNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function cleanDate(value) {
  const text = cleanText(value);
  if (!text) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

function cleanTimestamp(value) {
  const text = cleanText(value);
  if (!text) return null;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function normalizeRoleId(role) {
  const value = cleanText(role).toLowerCase();
  return ["owner", "admin", "manager", "member"].includes(value) ? value : "member";
}

function sanitizeRoleList(value) {
  const roles = Array.isArray(value) ? value : [];
  const cleaned = roles.map(normalizeRoleId).filter(Boolean);
  return [...new Set(cleaned.length ? cleaned : ["owner", "admin", "manager"])];
}

function normalizeHiringOutcome(value) {
  const outcome = cleanText(value).toLowerCase();
  return ["screening", "interviewing", "offer", "hired", "not_selected", "nurture"].includes(outcome) ? outcome : "screening";
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
  const identity = requestRateLimitIdentity(request);
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
    error.code = "RATE_LIMITED";
    error.retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    throw error;
  }
}

function requestRateLimitIdentity(request) {
  if (process.env.TRUST_PROXY_HEADERS === "true") {
    const forwardedFor = request.headers["x-forwarded-for"]?.split(",")[0]?.trim();
    if (forwardedFor) return forwardedFor;
  }
  return request.socket?.remoteAddress || "local";
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
  const contentType = cleanText(request.headers["content-type"]).toLowerCase();
  if (contentType && !contentType.includes("application/json")) {
    throwHttpError(415, "UNSUPPORTED_MEDIA_TYPE", "JSON requests must use application/json.");
  }
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
        const error = new Error("Request body is too large.");
        error.statusCode = 413;
        error.code = "PAYLOAD_TOO_LARGE";
        reject(error);
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
  const request = response.__request || { headers: {} };
  const headers = {
    "access-control-allow-methods": "POST, OPTIONS",
    "access-control-allow-headers": "authorization, content-type, stripe-signature",
    "content-security-policy": "default-src 'none'; frame-ancestors 'none'; base-uri 'none'",
    "cache-control": "no-store",
    "permissions-policy": "camera=(), microphone=(), geolocation=(), payment=()",
    "referrer-policy": "strict-origin-when-cross-origin",
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "x-request-id": response.__requestId || requestIdFor(request),
    "content-type": "application/json; charset=utf-8",
    ...(response.__extraHeaders || {}),
  };
  const allowedOrigin = allowedCorsOrigin(request);
  if (allowedOrigin) headers["access-control-allow-origin"] = allowedOrigin;
  if (isLiveLikeMode()) headers["strict-transport-security"] = "max-age=31536000; includeSubDomains";
  response.writeHead(statusCode, headers);
  response.end(statusCode === 204 ? "" : JSON.stringify(payload));
}

function sendError(response, error) {
  const statusCode = Number(error.statusCode || error.status || 500);
  const safeStatus = statusCode >= 400 && statusCode < 600 ? statusCode : 500;
  const code = cleanText(error.code || (safeStatus === 500 ? "INTERNAL_ERROR" : "REQUEST_FAILED"));
  const message =
    safeStatus === 500 && process.env.APP_MODE === "production"
      ? "The request could not be completed."
      : error.message || "The request could not be completed.";
  if (error.retryAfterSeconds) response.__extraHeaders = { ...(response.__extraHeaders || {}), "retry-after": String(error.retryAfterSeconds) };
  sendJson(response, safeStatus, {
    error: { code, message },
    message,
  });
}

function requestIdFor(request) {
  const incoming = cleanText(request?.headers?.["x-request-id"]);
  return incoming && incoming.length <= 120 ? incoming : randomBytes(12).toString("hex");
}

function allowedCorsOrigin(request) {
  const origin = cleanText(request?.headers?.origin);
  if (!origin) return "";
  return isCorsOriginAllowed(request) ? origin : "";
}

function isCorsOriginAllowed(request) {
  const origin = cleanText(request?.headers?.origin);
  if (!origin) return true;
  const allowed = new Set(
    [
      process.env.APP_BASE_URL,
      process.env.PRODUCT_URL,
      "https://kirahome.org",
      "https://www.kirahome.org",
      ...cleanText(process.env.ALLOWED_API_ORIGINS).split(","),
    ]
      .map((value) => cleanText(value).replace(/\/$/, ""))
      .filter(Boolean),
  );
  if (!isLiveLikeMode()) {
    allowed.add("http://localhost:4173");
    allowed.add("http://127.0.0.1:4173");
  }
  return allowed.has(origin.replace(/\/$/, ""));
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
