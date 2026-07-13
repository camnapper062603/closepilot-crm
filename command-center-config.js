export const launchStageOrder = [
  "development",
  "security_hardening",
  "beta_certification",
  "private_beta",
  "paying_pilot",
  "public_launch",
];

export const launchReadinessCategories = [
  { key: "security", label: "Security", weight: 14, required: true, threshold: 80 },
  { key: "authentication", label: "Authentication and workspace authorization", weight: 12, required: true, threshold: 85 },
  { key: "backend", label: "Backend and Supabase data layer", weight: 10, required: true, threshold: 80 },
  { key: "frontend", label: "Frontend product experience", weight: 8, required: true, threshold: 75 },
  { key: "billing", label: "Billing and trials", weight: 8, required: false, threshold: 80 },
  { key: "testing", label: "Automated testing", weight: 10, required: true, threshold: 80 },
  { key: "deployment", label: "Deployment and release gates", weight: 9, required: true, threshold: 80 },
  { key: "production_operations", label: "Production operations and monitoring", weight: 8, required: false, threshold: 80 },
  { key: "mobile", label: "Mobile readiness", weight: 4, required: false, threshold: 70 },
  { key: "documentation", label: "Documentation and setup guidance", weight: 6, required: true, threshold: 75 },
  { key: "customer_experience", label: "Customer experience and onboarding", weight: 6, required: true, threshold: 75 },
  { key: "legal_compliance", label: "Legal and compliance", weight: 5, required: false, threshold: 80 },
];

export const launchStageRequirements = {
  development: {
    minimumScore: 60,
    requiredCategories: ["security", "authentication", "backend", "frontend"],
    requiredProviders: ["database", "internal_access"],
    requiredVerifications: [],
    requiredChecklist: ["auth-confirmed"],
  },
  security_hardening: {
    minimumScore: 70,
    requiredCategories: ["security", "authentication", "backend", "testing"],
    requiredProviders: ["database", "internal_access"],
    requiredVerifications: ["tenant_isolation", "supabase_security", "auth_authorization"],
    requiredChecklist: ["auth-confirmed", "rls-verified"],
  },
  beta_certification: {
    minimumScore: 80,
    requiredCategories: ["security", "authentication", "backend", "frontend", "testing", "deployment", "documentation", "customer_experience"],
    requiredProviders: ["database", "internal_access", "app_domain", "email"],
    requiredVerifications: [
      "tenant_isolation",
      "production_smoke",
      "release_gates",
      "supabase_security",
      "required_migrations",
      "plaintext_provider_tokens",
      "auth_authorization",
    ],
    requiredChecklist: ["auth-confirmed", "rls-verified", "invite-flow", "crm-daily-command", "release-gates", "docs-complete"],
  },
  private_beta: {
    minimumScore: 85,
    requiredCategories: [
      "security",
      "authentication",
      "backend",
      "frontend",
      "testing",
      "deployment",
      "production_operations",
      "documentation",
      "customer_experience",
    ],
    requiredProviders: ["database", "internal_access", "app_domain", "email"],
    requiredVerifications: [
      "tenant_isolation",
      "production_smoke",
      "release_gates",
      "supabase_security",
      "required_migrations",
      "plaintext_provider_tokens",
      "auth_authorization",
    ],
    requiredChecklist: [
      "auth-confirmed",
      "rls-verified",
      "invite-flow",
      "crm-daily-command",
      "kira-recruit-addon",
      "release-gates",
      "docs-complete",
      "support-ready",
    ],
  },
  paying_pilot: {
    minimumScore: 88,
    requiredCategories: [
      "security",
      "authentication",
      "backend",
      "frontend",
      "billing",
      "testing",
      "deployment",
      "production_operations",
      "documentation",
      "customer_experience",
      "legal_compliance",
    ],
    requiredProviders: ["database", "internal_access", "app_domain", "email", "billing"],
    requiredVerifications: [
      "tenant_isolation",
      "production_smoke",
      "release_gates",
      "supabase_security",
      "billing_live_path",
      "required_migrations",
      "plaintext_provider_tokens",
      "auth_authorization",
    ],
    requiredChecklist: [
      "auth-confirmed",
      "rls-verified",
      "billing-trial",
      "billing-cancel",
      "invite-flow",
      "crm-daily-command",
      "kira-recruit-addon",
      "release-gates",
      "monitoring-ready",
      "data-export",
      "legal-ready",
      "support-ready",
    ],
  },
  public_launch: {
    minimumScore: 92,
    requiredCategories: launchReadinessCategories.map((category) => category.key),
    requiredProviders: ["database", "internal_access", "app_domain", "email", "billing"],
    requiredVerifications: [
      "tenant_isolation",
      "production_smoke",
      "release_gates",
      "supabase_security",
      "billing_live_path",
      "required_migrations",
      "plaintext_provider_tokens",
      "auth_authorization",
    ],
    requiredChecklist: [
      "auth-confirmed",
      "rls-verified",
      "billing-trial",
      "billing-cancel",
      "invite-flow",
      "crm-daily-command",
      "kira-recruit-addon",
      "provider-labels",
      "release-gates",
      "monitoring-ready",
      "data-export",
      "legal-ready",
      "self-service-onboarding",
      "docs-complete",
      "support-ready",
    ],
  },
};

export const launchVerificationDefinitions = [
  { key: "tenant_isolation", label: "Tenant isolation verification" },
  { key: "production_smoke", label: "Production smoke test" },
  { key: "release_gates", label: "Release gates" },
  { key: "supabase_security", label: "Supabase security verification" },
  { key: "billing_live_path", label: "Billing live path" },
  { key: "required_migrations", label: "Required DB migrations" },
  { key: "plaintext_provider_tokens", label: "Plaintext provider token scan" },
  { key: "auth_authorization", label: "Auth and workspace authorization" },
];

export const launchProviderDefinitions = [
  {
    key: "database",
    label: "Supabase database and auth",
    env: ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    required: true,
    category: "backend",
  },
  {
    key: "internal_access",
    label: "Founder allowlist",
    env: ["INTERNAL_ADMIN_EMAILS"],
    required: true,
    category: "security",
  },
  {
    key: "app_domain",
    label: "Production app domain",
    env: ["APP_BASE_URL"],
    required: true,
    category: "deployment",
  },
  {
    key: "email",
    label: "Resend email delivery",
    env: ["RESEND_API_KEY", "INVITE_FROM_EMAIL"],
    required: true,
    category: "customer_experience",
  },
  {
    key: "sms",
    label: "Twilio SMS",
    env: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
    required: false,
    category: "customer_experience",
  },
  {
    key: "calendar",
    label: "Google Calendar OAuth",
    env: ["GOOGLE_CALENDAR_CLIENT_ID", "GOOGLE_CALENDAR_CLIENT_SECRET"],
    required: false,
    category: "customer_experience",
  },
  {
    key: "ai",
    label: "OpenAI",
    env: ["OPENAI_API_KEY"],
    required: false,
    category: "frontend",
  },
  {
    key: "billing",
    label: "Stripe billing",
    env: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    anyEnv: ["STRIPE_PRICE_STARTER", "STRIPE_PRODUCT_STARTER"],
    required: false,
    category: "billing",
  },
  {
    key: "ci_status",
    label: "CI workflow status feed",
    env: ["CI_STATUS_PROVIDER"],
    required: false,
    category: "deployment",
    disconnectedLabel: "Not connected",
  },
  {
    key: "error_monitoring",
    label: "Error monitoring",
    env: ["SENTRY_DSN"],
    required: false,
    category: "production_operations",
  },
];

export const launchChecklistTemplate = [
  { key: "auth-confirmed", label: "Auth, email confirmation, and role gates verified", category: "Security", requiredStages: launchStageOrder },
  { key: "rls-verified", label: "Supabase RLS and tenant isolation checks passed", category: "Security", requiredStages: launchStageOrder.slice(1) },
  { key: "billing-trial", label: "7-day trial and billing checkout verified", category: "Revenue", requiredStages: ["paying_pilot", "public_launch"] },
  { key: "billing-cancel", label: "Cancellation and billing support path verified", category: "Revenue", requiredStages: ["paying_pilot", "public_launch"] },
  { key: "invite-flow", label: "Owner/admin invite flow verified end-to-end", category: "Customer onboarding", requiredStages: launchStageOrder.slice(2) },
  { key: "crm-daily-command", label: "Customer daily command center validated with live workspace data", category: "Product", requiredStages: launchStageOrder.slice(2) },
  { key: "kira-recruit-addon", label: "Kira Recruit add-on gates and CRM handoff validated", category: "Product", requiredStages: launchStageOrder.slice(3) },
  { key: "provider-labels", label: "Missing providers show honest setup states", category: "Provider setup", requiredStages: ["public_launch"] },
  { key: "release-gates", label: "Build, security tests, route inventory, and browser smoke pass", category: "Release", requiredStages: launchStageOrder.slice(2) },
  { key: "monitoring-ready", label: "Production monitoring and escalation path verified", category: "Operations", requiredStages: ["paying_pilot", "public_launch"] },
  { key: "data-export", label: "Customer data export and support process verified", category: "Operations", requiredStages: ["paying_pilot", "public_launch"] },
  { key: "legal-ready", label: "Legal, privacy, and compliance docs ready", category: "Legal", requiredStages: ["paying_pilot", "public_launch"] },
  { key: "self-service-onboarding", label: "Self-service onboarding path verified", category: "Customer onboarding", requiredStages: ["public_launch"] },
  { key: "docs-complete", label: "Beta docs, status docs, and setup docs are current", category: "Operations", requiredStages: launchStageOrder.slice(2) },
  { key: "support-ready", label: "Support contact, escalation path, and beta feedback loop ready", category: "Operations", requiredStages: launchStageOrder.slice(3) },
];

export const defaultDailyGoals = {
  calls: 30,
  contacts_reached: 20,
  follow_ups_completed: 20,
  appointments_booked: 3,
  new_leads: 5,
  tasks_completed: 20,
  proposals_sent: 5,
  sales_closed: 2,
  revenue_won: 25000,
  emails_sent: 20,
  sms_sent: 20,
};

export const dailyGoalDefinitions = [
  { key: "calls", label: "Calls", source: "calls table plus call activities/communications", valueType: "number" },
  { key: "contacts_reached", label: "Contacts reached", source: "successful outgoing non-demo communications", valueType: "number" },
  { key: "follow_ups_completed", label: "Follow-ups completed", source: "completed tasks or follow-up activities", valueType: "number" },
  { key: "appointments_booked", label: "Appointments booked", source: "appointments created/booked in the date range", valueType: "number" },
  { key: "new_leads", label: "New leads", source: "lead created_at in the date range", valueType: "number" },
  { key: "tasks_completed", label: "Tasks completed", source: "done tasks completed or updated in the date range", valueType: "number" },
  { key: "proposals_sent", label: "Proposals sent", source: "proposal activities or successful proposal communications", valueType: "number" },
  { key: "sales_closed", label: "Sales closed", source: "won leads updated in the date range", valueType: "number" },
  { key: "revenue_won", label: "Revenue won", source: "value of won leads updated in the date range", valueType: "currency" },
  { key: "emails_sent", label: "Emails sent", source: "successful outgoing non-demo email communications", valueType: "number" },
  { key: "sms_sent", label: "SMS sent", source: "successful outgoing non-demo SMS communications", valueType: "number" },
];

export const teamMetricDefinitions = [
  "leads assigned: leads.assigned_to",
  "leads contacted: communications and call activities with sent_by/recorded_by/created_by/user_id metadata",
  "tasks assigned: tasks.assigned_to",
  "tasks completed: tasks.completed_by, falling back to tasks.assigned_to",
  "overdue tasks: tasks.assigned_to with due before workspace day",
  "appointments booked: appointments.booked_by, created_by, assigned_user_id, or assigned_to",
  "calls logged: calls.recorded_by/created_by/user_id plus call activities with actor fields",
  "emails sent: communications.channel=email with sent_by/created_by/user_id and non-demo successful status",
  "SMS sent: communications.channel=sms with sent_by/created_by/user_id and non-demo successful status",
  "revenue won: won lead value attributed to leads.assigned_to",
];

const severityWeights = {
  critical: 100,
  high: 70,
  medium: 35,
  low: 15,
};

const stageWeights = {
  new: 0.15,
  qualified: 0.35,
  proposal: 0.65,
  won: 1,
};

const passingStatuses = new Set(["connected", "healthy", "configured", "passed", "pass", "ready", "complete", "completed", "ok"]);
const failingStatuses = new Set(["failed", "failing", "failure", "degraded", "blocked", "error", "down", "unavailable"]);
const unknownStatuses = new Set(["", "unknown", "not_connected", "setup_required", "missing", "not_configured", "pending"]);

export function providerStatusesFromEnv(env = {}) {
  return launchProviderDefinitions.map((provider) => {
    const requiredConfigured = provider.env.every((key) => Boolean(env[key]));
    const optionalConfigured = provider.anyEnv ? provider.anyEnv.some((key) => Boolean(env[key])) : true;
    const configured = requiredConfigured && optionalConfigured;
    return normalizeLaunchProvider({
      key: provider.key,
      label: provider.label,
      category: provider.category,
      required: provider.required,
      configured,
      status: configured ? "connected" : provider.disconnectedLabel ? "not_connected" : "setup_required",
      displayStatus: configured ? "Connected" : provider.disconnectedLabel || "Setup required",
      source: "env",
    });
  });
}

export function mergeProviderRows(providerStatuses, providerRows = []) {
  const rowsByKey = new Map(providerRows.map((row) => [String(row.provider_key || row.key || "").trim(), row]));
  return providerStatuses.map((provider) => {
    const row = rowsByKey.get(provider.key);
    if (!row) return provider;
    const status = normalizeStatus(row.status || provider.status);
    const configured = passingStatuses.has(status);
    return normalizeLaunchProvider({
      ...provider,
      status,
      configured,
      displayStatus: row.display_status || statusLabel(status),
      checkedAt: row.checked_at || row.updated_at || "",
      updatedAt: row.updated_at || "",
      detail: row.detail || "",
      source: row.source || provider.source || "manual",
      evidence: parseJsonObject(row.evidence),
    });
  });
}

export function buildLaunchReadiness(categories = [], providers = []) {
  const categoryRows = new Map(categories.map((category) => [String(category.category_key || category.key || "").trim(), category]));
  const providersByKey = new Map(providers.map((provider) => [provider.key, provider]));
  const output = launchReadinessCategories.map((category) => {
    const row = categoryRows.get(category.key);
    const providerScores = providers
      .filter((provider) => provider.category === category.key || (Array.isArray(category.providerKeys) && category.providerKeys.includes(provider.key)))
      .map((provider) => (provider.configured ? 100 : providerStatusClass(provider.status) === "failed" ? 0 : 50));
    const defaultScore = providerScores.length ? Math.round(providerScores.reduce((sum, score) => sum + score, 0) / providerScores.length) : 0;
    const score = row ? clampPercent(row.score ?? row.score_override ?? defaultScore) : 0;
    const rawStatus = normalizeReadinessStatus(row?.status || row?.readiness_status);
    const status = row ? rawStatus || readinessStatus(score, category.threshold) : "unknown";
    const source = row?.source || (row ? "manual" : "missing");
    return {
      key: category.key,
      label: category.label,
      weight: Number(row?.weight ?? category.weight),
      required: Boolean(category.required),
      threshold: category.threshold,
      score,
      status,
      statusClass: status === "unknown" ? "unknown" : score >= category.threshold ? "passing" : status === "fail" ? "failed" : "warning",
      source,
      detail: row?.detail || "",
      evidence: parseJsonObject(row?.evidence),
      checkedAt: row?.checked_at || row?.updated_at || "",
      updatedAt: row?.updated_at || "",
      missing: !row,
    };
  });

  const weightTotal = output.reduce((sum, category) => sum + category.weight, 0) || 1;
  const score = Math.round(output.reduce((sum, category) => sum + category.score * category.weight, 0) / weightTotal);
  return {
    score,
    categories: output,
    missingCategories: output.filter((category) => category.missing).map((category) => category.key),
    supportedCategories: launchReadinessCategories.map((category) => category.key),
  };
}

export function launchRecommendation(input = {}) {
  const evaluatedStage = normalizeLaunchStage(input.launchStage || input.stage || input.statusSnapshot?.launchStage || input.statusSnapshot?.stage);
  const requirements = launchStageRequirements[evaluatedStage];
  const readiness = input.readiness || { score: input.readinessScore || 0, categories: [] };
  const readinessScore = clampPercent(readiness.score ?? input.readinessScore ?? 0);
  const categories = readiness.categories?.length ? readiness.categories : buildLaunchReadiness([], input.providers || []).categories;
  const categoriesByKey = new Map(categories.map((category) => [category.key, category]));
  const providers = (input.providers || []).map(normalizeLaunchProvider);
  const providersByKey = new Map(providers.map((provider) => [provider.key, provider]));
  const blockers = (input.blockers || []).map(normalizeLaunchBlocker);
  const checklist = (input.checklist || []).map(normalizeLaunchChecklistItem);
  const checklistByKey = new Map(checklist.map((item) => [item.key, item]));
  const statusSnapshot = latestSnapshot(input.statusSnapshot || input.statusSnapshots || input.snapshot);
  const verifications = buildVerificationMap(statusSnapshot, providers);
  const blockingReasons = [];
  const warnings = [];
  const passedRequirements = [];
  const unknownRequirements = [];
  const acceptedRisks = [];
  const seenCodes = new Set();

  const block = (code, message, detail = {}) => addReason(blockingReasons, seenCodes, code, message, detail);
  const warn = (code, message, detail = {}) => warnings.push({ code, message, ...detail });
  const pass = (code, message, detail = {}) => passedRequirements.push({ code, message, ...detail });
  const unknown = (code, message, detail = {}) => {
    unknownRequirements.push({ code, message, ...detail });
    block(code, message, detail);
  };

  for (const blocker of blockers) {
    const unresolved = blocker.status !== "resolved";
    if (!unresolved) continue;
    if (blocker.status === "accepted_risk") {
      acceptedRisks.push({
        id: blocker.id,
        title: blocker.title,
        severity: blocker.severity,
        reason: blocker.acceptedRiskReason,
      });
      if (!blocker.acceptedRiskReason) {
        block("ACCEPTED_RISK_REASON_MISSING", "Accepted risks must include an accepted-risk reason.", { blockerId: blocker.id });
      } else if (blocker.severity === "critical") {
        warn("CRITICAL_ACCEPTED_RISK", `Critical accepted risk remains visible: ${blocker.title}`, { blockerId: blocker.id });
      } else {
        warn("ACCEPTED_RISK_RECORDED", `Accepted risk remains documented: ${blocker.title}`, { blockerId: blocker.id });
      }
      continue;
    }
    if (blocker.severity === "critical") {
      block("CRITICAL_BLOCKER_OPEN", `Critical blocker is unresolved: ${blocker.title}`, { blockerId: blocker.id });
    } else if (blocker.severity === "high") {
      if (evaluatedStage === "public_launch" && blocker.launchBlocking) {
        block("HIGH_LAUNCH_BLOCKER_OPEN", `High launch-blocking item remains unresolved for public launch: ${blocker.title}`, { blockerId: blocker.id });
      } else {
        warn("HIGH_BLOCKER_OPEN", `High blocker remains unresolved: ${blocker.title}`, { blockerId: blocker.id });
      }
    }
  }

  for (const categoryKey of requirements.requiredCategories) {
    const category = categoriesByKey.get(categoryKey);
    const definition = launchReadinessCategories.find((item) => item.key === categoryKey);
    if (!category || category.status === "unknown") {
      unknown("REQUIRED_CATEGORY_UNKNOWN", `${definition?.label || categoryKey} readiness is unknown.`, { categoryKey });
      continue;
    }
    const threshold = Number(category.threshold ?? definition?.threshold ?? 80);
    if (Number(category.score) < threshold) {
      const code =
        categoryKey === "security"
          ? "SECURITY_SCORE_BELOW_80"
          : categoryKey === "authentication"
            ? "AUTHENTICATION_SCORE_BELOW_85"
            : "CATEGORY_SCORE_BELOW_THRESHOLD";
      block(code, `${definition?.label || categoryKey} score is ${category.score}; required threshold is ${threshold}.`, {
        categoryKey,
        score: category.score,
        threshold,
      });
    } else {
      pass("CATEGORY_THRESHOLD_PASSED", `${definition?.label || categoryKey} meets threshold.`, { categoryKey });
    }
  }

  for (const verificationKey of requirements.requiredVerifications) {
    const verification = verifications.get(verificationKey) || { status: "unknown", label: labelForVerification(verificationKey) };
    const statusClass = providerStatusClass(verification.status);
    if (statusClass === "passed") {
      pass("VERIFICATION_PASSED", `${verification.label} passed.`, { verificationKey });
    } else if (statusClass === "failed") {
      block(codeForVerificationFailure(verificationKey), `${verification.label} is failing.`, { verificationKey, status: verification.status });
    } else {
      const code = verificationKey === "tenant_isolation" ? "TENANT_ISOLATION_UNKNOWN" : "REQUIRED_STATUS_UNKNOWN";
      unknown(code, `${verification.label} is unknown and is required for ${stageLabel(evaluatedStage)}.`, {
        verificationKey,
        status: verification.status,
      });
    }
  }

  const payingLaunch = ["paying_pilot", "public_launch"].includes(evaluatedStage) || Boolean(statusSnapshot.launchTargetHasPayingCustomers);
  if (payingLaunch && !requirements.requiredVerifications.includes("billing_live_path")) {
    const billing = verifications.get("billing_live_path") || { status: "unknown", label: labelForVerification("billing_live_path") };
    const statusClass = providerStatusClass(billing.status);
    if (statusClass === "failed") block("BILLING_LIVE_PATH_FAILED", "Billing live path is failing for a paid launch target.", { verificationKey: "billing_live_path" });
    if (statusClass === "unknown") unknown("BILLING_LIVE_PATH_UNKNOWN", "Billing live path is unknown for a paid launch target.", { verificationKey: "billing_live_path" });
  }

  for (const providerKey of requirements.requiredProviders) {
    const provider = providersByKey.get(providerKey);
    if (!provider) {
      unknown("REQUIRED_PROVIDER_UNKNOWN", `${providerKey} provider status is missing.`, { providerKey });
      continue;
    }
    const statusClass = providerStatusClass(provider.status);
    if (statusClass === "failed") {
      block("REQUIRED_PROVIDER_FAILED", `${provider.label} is actively failing.`, { providerKey, status: provider.status });
    } else if (statusClass === "passed" && provider.configured) {
      pass("REQUIRED_PROVIDER_CONNECTED", `${provider.label} is configured.`, { providerKey });
    } else {
      unknown("REQUIRED_PROVIDER_NOT_CONFIGURED", `${provider.label} is required and is not configured.`, { providerKey, status: provider.status });
    }
  }

  for (const provider of providers) {
    if (!requirements.requiredProviders.includes(provider.key) && providerStatusClass(provider.status) !== "passed") {
      warn("OPTIONAL_PROVIDER_NOT_CONFIGURED", `${provider.label} is optional for this stage and is not fully configured.`, { providerKey: provider.key });
    }
  }

  for (const checklistKey of requirements.requiredChecklist) {
    const item = checklistByKey.get(checklistKey) || normalizeLaunchChecklistItem(launchChecklistTemplate.find((template) => template.key === checklistKey) || { key: checklistKey });
    if (item.status === "failed") {
      block("REQUIRED_CHECKLIST_FAILED", `Required checklist item failed: ${item.label || checklistKey}`, { itemKey: checklistKey });
    } else if (item.completed || item.status === "passed" || item.status === "complete") {
      pass("CHECKLIST_ITEM_PASSED", `Checklist item complete: ${item.label || checklistKey}`, { itemKey: checklistKey });
    } else {
      unknown("REQUIRED_CHECKLIST_UNKNOWN", `Required checklist item is incomplete: ${item.label || checklistKey}`, { itemKey: checklistKey });
    }
  }

  if (readinessScore < requirements.minimumScore) {
    warn("WEIGHTED_SCORE_BELOW_STAGE_THRESHOLD", `Weighted score is ${readinessScore}; ${stageLabel(evaluatedStage)} target is ${requirements.minimumScore}.`, {
      score: readinessScore,
      threshold: requirements.minimumScore,
    });
  }

  const status = blockingReasons.length ? "NO_GO" : warnings.length || readinessScore < requirements.minimumScore ? "CONDITIONAL_GO" : "GO";
  const label = status === "NO_GO" ? "NO-GO" : status === "CONDITIONAL_GO" ? "CONDITIONAL GO" : "GO";
  const reason = blockingReasons[0]?.message || warnings[0]?.message || "All required launch gates are passing for the evaluated stage.";

  return {
    status,
    recommendation: status,
    label,
    reason,
    overallScore: readinessScore,
    score: readinessScore,
    blockingReasons,
    warnings,
    passedRequirements,
    unknownRequirements,
    acceptedRisks,
    evaluatedStage,
    evaluatedStageLabel: stageLabel(evaluatedStage),
    timestamp: new Date().toISOString(),
  };
}

export function normalizeLaunchBlocker(blocker = {}) {
  const severity = normalizeOneOf(blocker.severity, ["critical", "high", "medium", "low"], "medium");
  const status = normalizeOneOf(blocker.status === "accepted" ? "accepted_risk" : blocker.status, ["open", "in_progress", "blocked", "resolved", "accepted_risk"], "open");
  const acceptedRiskReason = String(blocker.accepted_risk_reason || blocker.acceptedRiskReason || "").trim();
  return {
    id: blocker.id || "",
    title: String(blocker.title || "Untitled blocker").trim(),
    detail: String(blocker.detail || "").trim(),
    category: String(blocker.category || "").trim(),
    evidenceUrl: String(blocker.evidence_url || blocker.evidenceUrl || "").trim(),
    evidenceText: String(blocker.evidence_text || blocker.evidenceText || "").trim(),
    resolutionNotes: String(blocker.resolution_notes || blocker.resolutionNotes || "").trim(),
    acceptedRiskReason,
    acceptedRiskBy: String(blocker.accepted_risk_by || blocker.acceptedRiskBy || "").trim(),
    acceptedRiskAt: blocker.accepted_risk_at || blocker.acceptedRiskAt || null,
    severity,
    status,
    launchBlocking: blocker.launch_blocking === undefined ? blocker.launchBlocking !== false : Boolean(blocker.launch_blocking),
    targetStage: normalizeLaunchStage(blocker.target_stage || blocker.targetStage || "private_beta"),
    owner: String(blocker.owner || "").trim(),
    ownerUserId: blocker.owner_user_id || blocker.ownerUserId || "",
    resolvedBy: String(blocker.resolved_by || blocker.resolvedBy || "").trim(),
    resolvedAt: blocker.resolved_at || blocker.resolvedAt || null,
    dueAt: blocker.due_at || blocker.dueAt || null,
    createdAt: blocker.created_at || blocker.createdAt || "",
    updatedAt: blocker.updated_at || blocker.updatedAt || "",
    weight: severityWeights[severity],
  };
}

export function normalizeLaunchChecklistItem(item = {}) {
  const completed = Boolean(item.completed);
  const status = normalizeOneOf(item.status || (completed ? "complete" : "unknown"), ["unknown", "passed", "failed", "complete", "skipped"], completed ? "complete" : "unknown");
  const template = launchChecklistTemplate.find((templateItem) => templateItem.key === (item.item_key || item.key));
  return {
    key: String(item.item_key || item.key || "").trim(),
    label: String(item.label || template?.label || "").trim(),
    category: String(item.category || template?.category || "").trim(),
    completed,
    required: Boolean(item.required ?? template?.requiredStages?.length),
    requiredStages: item.required_stages || item.requiredStages || template?.requiredStages || [],
    status,
    note: String(item.note || "").trim(),
    evidence: parseJsonObject(item.evidence),
    completedAt: item.completed_at || item.completedAt || null,
    updatedAt: item.updated_at || item.updatedAt || "",
  };
}

export function mergeLaunchChecklist(rows = []) {
  const rowMap = new Map(rows.map((row) => [String(row.item_key || row.key || "").trim(), row]));
  return launchChecklistTemplate.map((template) => normalizeLaunchChecklistItem({ ...template, ...(rowMap.get(template.key) || {}) }));
}

export function checklistProgressPercent(checklist = []) {
  if (!checklist.length) return 0;
  return Math.round((checklist.filter((item) => item.completed || ["passed", "complete"].includes(item.status)).length / checklist.length) * 100);
}

export function buildDailyCommandCenterSnapshot(input = {}) {
  const now = input.now ? new Date(input.now) : new Date();
  const timezone = input.timezone || input.workspaceTimezone || "UTC";
  const leads = (input.leads || []).map(normalizeLead);
  const tasks = (input.tasks || []).map(normalizeTask);
  const appointments = (input.appointments || []).map(normalizeAppointment);
  const activities = (input.activities || []).map(normalizeActivity);
  const communications = (input.communications || []).map(normalizeCommunication);
  const calls = (input.calls || []).map(normalizeCall);
  const notifications = (input.notifications || []).map(normalizeNotification);
  const goals = normalizeDailyGoals(input.goals);
  const role = normalizeRole(input.role);
  const members = Array.isArray(input.members) ? input.members.map(normalizeMember) : [];
  const currentUser = normalizeIdentity({
    userId: input.currentUserId || input.userId,
    email: input.currentUserEmail || input.email,
  });
  const todayTasks = tasks.filter((task) => !task.done && isTodayLike(task.due, now, timezone));
  const overdueTasks = tasks.filter((task) => !task.done && isPastDate(task.due, now, timezone));
  const appointmentsToday = appointments.filter((appointment) => isSameZonedDay(appointment.startsAt, now, timezone));
  const openLeads = leads.filter((lead) => lead.stage !== "won");
  const hotLeads = openLeads.filter((lead) => lead.score >= 80).sort(sortLeadPriority);
  const staleLeads = openLeads.filter((lead) => daysBetween(lead.updatedAt || lead.createdAt, now) >= 7 || !lead.nextAction);
  const atRiskLeads = openLeads.filter((lead) => lead.score < 60 || staleLeads.some((stale) => stale.id && stale.id === lead.id));
  const activitiesToday = activities.filter((activity) => isSameZonedDay(activity.createdAt, now, timezone));
  const communicationsToday = communications.filter((communication) => isSameZonedDay(communication.createdAt, now, timezone));
  const wonThisMonth = leads.filter((lead) => lead.stage === "won" && isSameZonedMonth(lead.updatedAt || lead.createdAt, now, timezone));
  const pipelineValue = openLeads.reduce((sum, lead) => sum + lead.value, 0);
  const weightedPipelineValue = openLeads.reduce((sum, lead) => sum + lead.value * (stageWeights[lead.stage] || 0.2), 0);
  const wonRevenueMonth = wonThisMonth.reduce((sum, lead) => sum + lead.value, 0);
  const dateRange = dailyDateRange(now, timezone);
  const goalProgress = calculateDailyGoalProgress({
    goals,
    leads,
    tasks,
    appointments,
    activities,
    communications,
    calls,
    now,
    timezone,
    role,
    currentUser,
  });
  const priorities = buildDailyPriorities({ hotLeads, todayTasks, overdueTasks, appointmentsToday, atRiskLeads, goals, activitiesToday });
  const pipelineHealth = buildPipelineHealth(leads, atRiskLeads);
  const teamPerformance = ["owner", "admin", "manager"].includes(role)
    ? buildTeamPerformance({ leads, tasks, appointments, activities, communications, calls, members, now, timezone })
    : {
        locked: true,
        message: "Team performance is visible to Owners, Admins, and Managers.",
        members: [],
        totals: {},
      };

  return {
    generatedAt: now.toISOString(),
    mode: input.mode || "live",
    role,
    timezone,
    dateRange,
    goals,
    goalProgress,
    priorities,
    kpis: [
      { key: "pipeline_value", label: "Open pipeline", value: Math.round(pipelineValue), format: "currency" },
      { key: "weighted_pipeline", label: "Weighted forecast", value: Math.round(weightedPipelineValue), format: "currency" },
      { key: "won_month", label: "Won this month", value: Math.round(wonRevenueMonth), format: "currency", goal: goals.revenue_won },
      { key: "hot_leads", label: "Hot leads", value: hotLeads.length, format: "number" },
      { key: "due_today", label: "Due today", value: todayTasks.length + overdueTasks.length, format: "number", goal: goals.follow_ups_completed },
      { key: "appointments_today", label: "Appointments today", value: appointmentsToday.length, format: "number", goal: goals.appointments_booked },
    ],
    today: {
      tasksDue: todayTasks,
      tasksOverdue: overdueTasks,
      appointments: appointmentsToday,
      hotLeads: hotLeads.slice(0, 8),
      atRiskLeads: atRiskLeads.slice(0, 8),
      alerts: notifications.filter((notification) => !notification.readAt).slice(0, 8),
    },
    pipelineHealth,
    teamPerformance,
    activity: {
      activitiesToday: activitiesToday.length,
      communicationsToday: communicationsToday.length,
      recent: [...activities, ...communications].sort((left, right) => String(right.createdAt).localeCompare(String(left.createdAt))).slice(0, 10),
    },
  };
}

export function normalizeDailyGoals(goals = {}) {
  const output = {};
  for (const definition of dailyGoalDefinitions) {
    output[definition.key] = nonNegativeInteger(goalValue(goals, definition.key), defaultDailyGoals[definition.key]);
  }
  output.followUps = output.follow_ups_completed;
  output.appointments = output.appointments_booked;
  output.newLeads = output.new_leads;
  output.revenue = output.revenue_won;
  return output;
}

export function calculateDailyGoalProgress(input = {}) {
  const goals = normalizeDailyGoals(input.goals || {});
  const known = dailyGoalDefinitions.map((definition) => calculateDailyGoal(definition, goals[definition.key], input));
  const unsupported = Object.keys(input.goals || {})
    .filter((key) => !dailyGoalDefinitions.some((definition) => definition.key === key) && !["followUps", "follow_ups", "followups", "appointments", "newLeads", "revenue", "emails", "sms"].includes(key))
    .map((key) =>
      goalResult({ key, label: statusLabel(key), valueType: "number" }, Number(input.goals[key] || 0), 0, {
        status: "unsupported",
        calculationSource: "unsupported goal type",
        now: input.now ? new Date(input.now) : new Date(),
        timezone: input.timezone || "UTC",
        scope: input.role === "member" ? "personal" : "team",
      }),
    );
  return [...known, ...unsupported];
}

export const GOAL_CALCULATORS = {
  calls: countCalls,
  contacts_reached: countContactsReached,
  follow_ups_completed: countFollowUpsCompleted,
  appointments_booked: countAppointmentsBooked,
  new_leads: countNewLeads,
  tasks_completed: countTasksCompleted,
  proposals_sent: countProposalsSent,
  sales_closed: countSalesClosed,
  revenue_won: countRevenueWon,
  emails_sent: countEmailsSent,
  sms_sent: countSmsSent,
};

export function buildTeamPerformance({ leads = [], tasks = [], appointments = [], activities = [], communications = [], calls = [], members = [], now = new Date(), timezone = "UTC" }) {
  const normalizedMembers = members.map(normalizeMember);
  const buckets = new Map();
  const ensureBucket = (identity, label) => {
    const key = identity?.key || label || "unknown";
    if (!buckets.has(key)) {
      buckets.set(key, {
        key,
        userId: identity?.userId || "",
        email: identity?.email || "",
        label: identity?.label || label || "Unknown",
        openLeads: 0,
        leadsContacted: 0,
        openTasks: 0,
        tasksCompleted: 0,
        overdueTasks: 0,
        appointmentsBooked: 0,
        callsLogged: 0,
        emailsSent: 0,
        smsSent: 0,
        followUpsCompleted: 0,
        stageChanges: 0,
        communicationActivity: 0,
        wonValue: 0,
        revenueWon: 0,
        newOpportunities: 0,
        dailyGoalProgress: {},
        activityToday: 0,
      });
    }
    return buckets.get(key);
  };
  const memberIdentities = normalizedMembers.map((member) => normalizeIdentity(member));
  for (const identity of memberIdentities) ensureBucket(identity, identity.label);
  const resolveBucket = (value, fallback = "unknown") => ensureBucket(resolveIdentity(value, memberIdentities, fallback), fallback);

  for (const lead of leads) {
    const bucket = resolveBucket(lead.assignedTo || lead.ownerId, "unassigned");
    if (lead.stage !== "won") bucket.openLeads += 1;
    if (lead.stage === "won") {
      bucket.wonValue += lead.value;
      bucket.revenueWon += lead.value;
    }
    if (isSameZonedDay(lead.createdAt, now, timezone)) bucket.newOpportunities += 1;
  }
  for (const task of tasks) {
    const assignedBucket = resolveBucket(task.assignedTo || task.createdBy, "unassigned");
    if (!task.done) assignedBucket.openTasks += 1;
    if (!task.done && isPastDate(task.due, now, timezone)) assignedBucket.overdueTasks += 1;
    if (task.done && isSameZonedDay(task.completedAt || task.updatedAt || task.createdAt, now, timezone)) {
      const completedBucket = resolveBucket(task.completedBy || task.assignedTo || task.createdBy, "unknown");
      completedBucket.tasksCompleted += 1;
      completedBucket.followUpsCompleted += 1;
      completedBucket.activityToday += 1;
    }
  }
  for (const appointment of appointments) {
    const bucket = resolveBucket(appointment.bookedBy || appointment.createdBy || appointment.assignedUserId || appointment.assignedTo, "unassigned");
    if (isSameZonedDay(appointment.createdAt || appointment.startsAt, now, timezone)) {
      bucket.appointmentsBooked += 1;
      bucket.activityToday += 1;
    }
  }
  for (const call of calls) {
    const bucket = resolveBucket(call.recordedBy || call.createdBy || call.userId, call.provider === "system" ? "system" : "unknown");
    if (isSameZonedDay(call.createdAt, now, timezone)) {
      bucket.callsLogged += 1;
      bucket.activityToday += 1;
    }
  }
  for (const activity of activities) {
    const metadata = parseJsonObject(activity.metadata);
    const actor = activity.actorUserId || activity.actor_user_id || activity.createdBy || activity.created_by || activity.userId || activity.user_id || activity.memberId || activity.member_id || metadata.actor_user_id || metadata.actorUserId;
    const bucket = resolveBucket(actor, activity.type === "system" ? "system" : "unknown");
    if (!isSameZonedDay(activity.createdAt, now, timezone)) continue;
    bucket.activityToday += 1;
    if (activity.type === "call") bucket.callsLogged += 1;
    if (/follow.?up/i.test(`${activity.type} ${activity.message}`)) bucket.followUpsCompleted += 1;
    if (/stage/i.test(`${activity.type} ${activity.message}`)) bucket.stageChanges += 1;
  }
  for (const communication of communications) {
    if (!isSameZonedDay(communication.createdAt, now, timezone)) continue;
    const metadata = parseJsonObject(communication.metadata);
    const bucket = resolveBucket(communication.sentBy || communication.sent_by || communication.createdBy || communication.created_by || communication.userId || communication.user_id || communication.memberId || communication.member_id || metadata.actor_user_id, "unknown");
    if (!isSuccessfulHumanCommunication(communication)) continue;
    bucket.communicationActivity += 1;
    bucket.activityToday += 1;
    if (communication.channel === "email") bucket.emailsSent += 1;
    if (communication.channel === "sms") bucket.smsSent += 1;
    if (communication.channel === "call") bucket.callsLogged += 1;
    bucket.leadsContacted += 1;
  }

  const membersOutput = [...buckets.values()].sort((left, right) => left.label.localeCompare(right.label));
  return {
    locked: false,
    members: membersOutput.map((member) => ({
      ...member,
      email: member.email || member.label,
      wonValue: Math.round(member.wonValue),
      revenueWon: Math.round(member.revenueWon),
    })),
    totals: membersOutput.reduce((totals, member) => {
      for (const [key, value] of Object.entries(member)) {
        if (typeof value === "number") totals[key] = (totals[key] || 0) + value;
      }
      return totals;
    }, {}),
  };
}

function buildDailyPriorities({ hotLeads, todayTasks, overdueTasks, appointmentsToday, atRiskLeads, goals, activitiesToday }) {
  const priorities = [];
  if (overdueTasks.length) {
    priorities.push({
      key: "overdue-tasks",
      label: "Clear overdue follow-ups",
      urgency: "critical",
      count: overdueTasks.length,
      reason: "Overdue work is the fastest way to lose active opportunities.",
      action: "Open task list",
    });
  }
  if (hotLeads.length) {
    priorities.push({
      key: "hot-leads",
      label: "Call highest-intent leads",
      urgency: "high",
      count: hotLeads.length,
      reason: `${hotLeads[0].name} is the top scored open opportunity.`,
      action: "Open best lead",
    });
  }
  if (appointmentsToday.length) {
    priorities.push({
      key: "appointments",
      label: "Prepare today's appointments",
      urgency: "high",
      count: appointmentsToday.length,
      reason: "Booked appointments need notes, ownership, and next steps before the call.",
      action: "Open calendar",
    });
  }
  if (todayTasks.length) {
    priorities.push({
      key: "due-today",
      label: "Finish today's follow-up queue",
      urgency: "medium",
      count: todayTasks.length,
      reason: `Daily follow-up target is ${goals.follow_ups_completed}; complete due tasks before adding new work.`,
      action: "Open follow-up queue",
    });
  }
  if (atRiskLeads.length) {
    priorities.push({
      key: "risk",
      label: "Review at-risk pipeline",
      urgency: "medium",
      count: atRiskLeads.length,
      reason: "Low-score or stale leads need a manager decision before they age out.",
      action: "Open pipeline health",
    });
  }
  if (!priorities.length) {
    priorities.push({
      key: "steady-state",
      label: "Create new momentum",
      urgency: "normal",
      count: activitiesToday.length,
      reason: "No urgent blockers are open. Add new leads or schedule proactive follow-ups.",
      action: "Add lead",
    });
  }
  return priorities.slice(0, 5);
}

function buildPipelineHealth(leads, atRiskLeads) {
  const stages = ["new", "qualified", "proposal", "won"].map((stage) => {
    const stageLeads = leads.filter((lead) => lead.stage === stage);
    const value = stageLeads.reduce((sum, lead) => sum + lead.value, 0);
    const averageScore = stageLeads.length
      ? Math.round(stageLeads.reduce((sum, lead) => sum + lead.score, 0) / stageLeads.length)
      : 0;
    return { stage, count: stageLeads.length, value: Math.round(value), averageScore };
  });
  const openCount = leads.filter((lead) => lead.stage !== "won").length;
  const wonCount = leads.filter((lead) => lead.stage === "won").length;
  return {
    stages,
    atRiskCount: atRiskLeads.length,
    conversionRate: leads.length ? Math.round((wonCount / leads.length) * 100) : 0,
    riskRatio: openCount ? Math.round((atRiskLeads.length / openCount) * 100) : 0,
  };
}

function calculateDailyGoal(definition, target, input) {
  const calculator = GOAL_CALCULATORS[definition.key];
  const now = input.now ? new Date(input.now) : new Date();
  const timezone = input.timezone || "UTC";
  const scope = input.role === "member" ? "personal" : "team";
  const actual = calculator ? calculator(input) : null;
  if (!calculator) {
    return goalResult(definition, target, 0, {
      status: "unsupported",
      calculationSource: "unsupported goal type",
      now,
      timezone,
      scope,
    });
  }
  const rowsAvailable = hasRowsForGoal(definition.key, input);
  const status = rowsAvailable || actual > 0 ? goalStatus(actual, target) : "no_data";
  return goalResult(definition, target, actual, {
    status,
    calculationSource: definition.source,
    now,
    timezone,
    scope,
  });
}

function goalResult(definition, target, actual, options) {
  const safeTarget = Number(target || 0);
  const safeActual = Number(actual || 0);
  const completionPercentage = safeTarget > 0 ? Math.round(Math.min(999, (safeActual / safeTarget) * 100)) : null;
  return {
    key: definition.key,
    label: definition.label,
    target: safeTarget,
    actual: safeActual,
    remaining: Math.max(0, safeTarget - safeActual),
    completionPercentage,
    status: safeTarget === 0 ? "no_target" : options.status,
    calculationSource: options.calculationSource,
    dateRange: dailyDateRange(options.now, options.timezone),
    timezone: options.timezone,
    scope: options.scope,
    valueType: definition.valueType,
  };
}

function goalStatus(actual, target) {
  if (target === 0) return "no_target";
  if (actual >= target) return "met";
  if (actual > 0) return "in_progress";
  return "behind";
}

function countCalls(input) {
  return today(input.calls || [], input).filter((call) => !isDemoRecord(call)).length + today(input.activities || [], input).filter((activity) => activity.type === "call").length;
}

function countContactsReached(input) {
  return today(input.communications || [], input).filter(isSuccessfulHumanCommunication).length;
}

function countFollowUpsCompleted(input) {
  return (
    today(input.tasks || [], input, (task) => task.completedAt || task.updatedAt || task.createdAt).filter((task) => task.done).length +
    today(input.activities || [], input).filter((activity) => /follow.?up/i.test(`${activity.type} ${activity.message}`)).length
  );
}

function countAppointmentsBooked(input) {
  return today(input.appointments || [], input, (appointment) => appointment.createdAt || appointment.startsAt).length;
}

function countNewLeads(input) {
  return today(input.leads || [], input, (lead) => lead.createdAt).length;
}

function countTasksCompleted(input) {
  return today(input.tasks || [], input, (task) => task.completedAt || task.updatedAt || task.createdAt).filter((task) => task.done).length;
}

function countProposalsSent(input) {
  return (
    today(input.activities || [], input).filter((activity) => /proposal/i.test(`${activity.type} ${activity.message}`)).length +
    today(input.communications || [], input).filter((communication) => isSuccessfulHumanCommunication(communication) && /proposal/i.test(`${communication.subject} ${communication.body} ${communication.message}`)).length
  );
}

function countSalesClosed(input) {
  return today(input.leads || [], input, (lead) => lead.updatedAt || lead.createdAt).filter((lead) => lead.stage === "won").length;
}

function countRevenueWon(input) {
  return today(input.leads || [], input, (lead) => lead.updatedAt || lead.createdAt)
    .filter((lead) => lead.stage === "won")
    .reduce((sum, lead) => sum + lead.value, 0);
}

function countEmailsSent(input) {
  return today(input.communications || [], input).filter((communication) => communication.channel === "email" && isSuccessfulHumanCommunication(communication)).length;
}

function countSmsSent(input) {
  return today(input.communications || [], input).filter((communication) => communication.channel === "sms" && isSuccessfulHumanCommunication(communication)).length;
}

function today(rows, input, dateSelector = (row) => row.createdAt) {
  const now = input.now ? new Date(input.now) : new Date();
  const timezone = input.timezone || "UTC";
  const identity = normalizeIdentity(input.currentUser || {});
  const personal = input.role === "member" && identity.key;
  return rows.filter((row) => {
    if (!isSameZonedDay(dateSelector(row), now, timezone)) return false;
    if (!personal) return true;
    const actor = normalizeActorValue(row.assignedTo || row.createdBy || row.completedBy || row.sentBy || row.recordedBy || row.bookedBy || row.userId || row.actorUserId);
    return actor && [identity.key, identity.userId, identity.email].includes(actor);
  });
}

function hasRowsForGoal(key, input) {
  const map = {
    calls: ["calls", "activities"],
    contacts_reached: ["communications"],
    follow_ups_completed: ["tasks", "activities"],
    appointments_booked: ["appointments"],
    new_leads: ["leads"],
    tasks_completed: ["tasks"],
    proposals_sent: ["activities", "communications"],
    sales_closed: ["leads"],
    revenue_won: ["leads"],
    emails_sent: ["communications"],
    sms_sent: ["communications"],
  };
  return (map[key] || []).some((field) => Array.isArray(input[field]) && input[field].length > 0);
}

function normalizeLead(row = {}) {
  return {
    id: row.id || "",
    name: row.name || "Unnamed lead",
    company: row.company || "",
    stage: normalizeOneOf(row.stage, ["new", "qualified", "proposal", "won"], "new"),
    value: Number(row.value || 0),
    score: clampPercent(row.score ?? 0),
    notes: row.notes || "",
    nextAction: row.next_action || row.nextAction || "",
    assignedTo: row.assigned_to || row.assignedTo || "",
    ownerId: row.owner_id || row.ownerId || "",
    createdBy: row.created_by || row.createdBy || "",
    createdAt: row.created_at || row.createdAt || "",
    updatedAt: row.updated_at || row.updatedAt || row.created_at || row.createdAt || "",
  };
}

function normalizeTask(row = {}) {
  return {
    id: row.id || "",
    text: row.text || "",
    done: Boolean(row.done),
    due: row.due || "",
    assignedTo: row.assigned_to || row.assignedTo || "",
    createdBy: row.created_by || row.createdBy || "",
    completedBy: row.completed_by || row.completedBy || "",
    completedAt: row.completed_at || row.completedAt || "",
    createdAt: row.created_at || row.createdAt || "",
    updatedAt: row.updated_at || row.updatedAt || "",
  };
}

function normalizeAppointment(row = {}) {
  return {
    id: row.id || "",
    title: row.title || "",
    startsAt: row.starts_at || row.startsAt || "",
    assignedTo: row.assigned_to || row.assignedTo || "",
    assignedUserId: row.assigned_user_id || row.assignedUserId || "",
    bookedBy: row.booked_by || row.bookedBy || "",
    createdBy: row.created_by || row.createdBy || "",
    status: row.status || "booked",
    createdAt: row.created_at || row.createdAt || row.starts_at || row.startsAt || "",
  };
}

function normalizeActivity(row = {}) {
  return {
    id: row.id || "",
    type: String(row.type || "activity").toLowerCase(),
    message: row.message || "",
    actorUserId: row.actor_user_id || row.actorUserId || "",
    userId: row.user_id || row.userId || "",
    memberId: row.member_id || row.memberId || "",
    createdBy: row.created_by || row.createdBy || "",
    metadata: parseJsonObject(row.metadata),
    createdAt: row.created_at || row.createdAt || "",
  };
}

function normalizeCommunication(row = {}) {
  return {
    id: row.id || "",
    channel: String(row.channel || row.type || "communication").toLowerCase(),
    type: String(row.channel || row.type || "communication").toLowerCase(),
    direction: String(row.direction || "outgoing").toLowerCase(),
    status: String(row.status || "logged").toLowerCase(),
    subject: row.subject || "",
    body: row.body || "",
    message: row.subject || row.body || "",
    provider: String(row.provider || "").toLowerCase(),
    sentBy: row.sent_by || row.sentBy || "",
    createdBy: row.created_by || row.createdBy || "",
    userId: row.user_id || row.userId || "",
    memberId: row.member_id || row.memberId || "",
    metadata: parseJsonObject(row.metadata),
    createdAt: row.created_at || row.createdAt || "",
  };
}

function normalizeCall(row = {}) {
  return {
    id: row.id || "",
    outcome: row.outcome || "logged",
    provider: String(row.provider || "").toLowerCase(),
    recordedBy: row.recorded_by || row.recordedBy || "",
    createdBy: row.created_by || row.createdBy || "",
    userId: row.user_id || row.userId || "",
    metadata: parseJsonObject(row.metadata),
    createdAt: row.created_at || row.createdAt || "",
  };
}

function normalizeNotification(row = {}) {
  return {
    id: row.id || "",
    title: row.title || "",
    detail: row.detail || "",
    readAt: row.read_at || row.readAt || null,
    createdAt: row.created_at || row.createdAt || "",
  };
}

function normalizeMember(row = {}) {
  return {
    userId: row.user_id || row.userId || "",
    email: row.email || "",
    role: row.role || "",
    teamFunction: row.team_function || row.teamFunction || "",
    label: row.email || row.user_id || row.userId || "Unassigned",
  };
}

function isSuccessfulHumanCommunication(communication = {}) {
  if (communication.direction && communication.direction !== "outgoing") return false;
  if (!["email", "sms", "call"].includes(communication.channel)) return false;
  if (["failed", "error", "bounced", "undelivered", "canceled"].includes(communication.status)) return false;
  if (isDemoRecord(communication)) return false;
  return true;
}

function isDemoRecord(record = {}) {
  const metadata = parseJsonObject(record.metadata);
  return record.provider === "demo" || metadata.demo === true || metadata.simulated === true || metadata.test === true;
}

function resolveIdentity(value, identities = [], fallback = "unknown") {
  const actor = normalizeActorValue(value);
  if (!actor) return normalizeIdentity({ label: fallback });
  return identities.find((identity) => identity.key === actor || identity.userId === actor || identity.email === actor) || normalizeIdentity({ label: actor, userId: looksUuid(actor) ? actor : "", email: actor.includes("@") ? actor : "" });
}

function normalizeIdentity(value = {}) {
  if (typeof value === "string") {
    const actor = normalizeActorValue(value);
    return {
      key: actor || "unknown",
      userId: looksUuid(actor) ? actor : "",
      email: actor.includes("@") ? actor : "",
      label: actor || "Unknown",
    };
  }
  const userId = normalizeActorValue(value.userId || value.user_id || "");
  const email = normalizeActorValue(value.email || "");
  const label = value.label || value.name || email || userId || "Unknown";
  return {
    key: userId || email || normalizeActorValue(label),
    userId,
    email,
    label,
  };
}

function normalizeActorValue(value) {
  return String(value || "").trim().toLowerCase();
}

function buildVerificationMap(statusSnapshot = {}, providers = []) {
  const map = new Map();
  for (const definition of launchVerificationDefinitions) {
    const raw = readNestedStatus(statusSnapshot, definition.key);
    map.set(definition.key, {
      key: definition.key,
      label: definition.label,
      status: normalizeStatusFromValue(raw),
      detail: typeof raw === "object" && raw ? raw.detail || raw.message || "" : "",
    });
  }
  for (const provider of providers) {
    if (launchVerificationDefinitions.some((definition) => definition.key === provider.key)) {
      map.set(provider.key, {
        key: provider.key,
        label: provider.label,
        status: normalizeStatus(provider.status),
        detail: provider.detail || "",
      });
    }
  }
  return map;
}

function readNestedStatus(snapshot = {}, key) {
  if (!snapshot || typeof snapshot !== "object") return undefined;
  if (snapshot[key] !== undefined) return snapshot[key];
  const nested = [
    snapshot.verifications,
    snapshot.checks,
    snapshot.release,
    snapshot.security,
    snapshot.status,
    snapshot.results,
  ];
  for (const item of nested) {
    if (item && typeof item === "object" && item[key] !== undefined) return item[key];
  }
  if (key === "required_migrations" && Array.isArray(snapshot.requiredMigrations)) {
    return snapshot.requiredMigrations.every((migration) => migration.applied !== false && migration.status !== "missing") ? "passed" : "failed";
  }
  return undefined;
}

function normalizeStatusFromValue(value) {
  if (value === true) return "passed";
  if (value === false) return "failed";
  if (value && typeof value === "object") return normalizeStatus(value.status || value.result || value.state || value.value);
  return normalizeStatus(value);
}

function latestSnapshot(value) {
  if (Array.isArray(value)) return parseJsonObject(value[0]?.snapshot || value[0] || {});
  return parseJsonObject(value);
}

function normalizeLaunchProvider(provider = {}) {
  const status = normalizeStatus(provider.status);
  return {
    key: String(provider.provider_key || provider.key || "").trim(),
    label: provider.label || statusLabel(provider.provider_key || provider.key || ""),
    category: provider.category || "",
    required: Boolean(provider.required),
    configured: Boolean(provider.configured ?? passingStatuses.has(status)),
    status,
    statusClass: providerStatusClass(status),
    displayStatus: provider.displayStatus || provider.display_status || statusLabel(status),
    checkedAt: provider.checkedAt || provider.checked_at || "",
    updatedAt: provider.updatedAt || provider.updated_at || "",
    detail: provider.detail || "",
    source: provider.source || "configuration",
    evidence: parseJsonObject(provider.evidence),
  };
}

function providerStatusClass(status) {
  const normalized = normalizeStatus(status);
  if (passingStatuses.has(normalized)) return "passed";
  if (failingStatuses.has(normalized)) return "failed";
  if (unknownStatuses.has(normalized)) return "unknown";
  return "unknown";
}

function normalizeStatus(status) {
  return String(status || "unknown").trim().toLowerCase();
}

function normalizeReadinessStatus(status) {
  const normalized = normalizeStatus(status);
  if (["ready", "pass", "passed", "passing", "complete", "completed"].includes(normalized)) return "passed";
  if (["watch", "warning", "conditional"].includes(normalized)) return "warning";
  if (["blocked", "fail", "failed", "failing"].includes(normalized)) return "fail";
  if (["unknown", "pending", "missing", ""].includes(normalized)) return "unknown";
  return "";
}

function codeForVerificationFailure(key) {
  const codes = {
    tenant_isolation: "TENANT_ISOLATION_FAILED",
    production_smoke: "PRODUCTION_SMOKE_FAILED",
    release_gates: "RELEASE_GATES_FAILED",
    supabase_security: "SUPABASE_SECURITY_FAILED",
    billing_live_path: "BILLING_LIVE_PATH_FAILED",
    required_migrations: "REQUIRED_MIGRATION_NOT_APPLIED",
    plaintext_provider_tokens: "PLAINTEXT_PROVIDER_TOKENS_REMAIN",
    auth_authorization: "AUTHORIZATION_DEGRADED",
  };
  return codes[key] || "REQUIRED_STATUS_FAILED";
}

function labelForVerification(key) {
  return launchVerificationDefinitions.find((definition) => definition.key === key)?.label || statusLabel(key);
}

function addReason(list, seenCodes, code, message, detail) {
  const dedupeKey = `${code}:${detail.categoryKey || detail.providerKey || detail.verificationKey || detail.itemKey || detail.blockerId || ""}`;
  if (seenCodes.has(dedupeKey)) return;
  seenCodes.add(dedupeKey);
  list.push({ code, message, ...detail });
}

function normalizeLaunchStage(stage) {
  const normalized = String(stage || process.env.LAUNCH_STAGE || "private_beta").trim().toLowerCase().replace(/-/g, "_");
  return launchStageOrder.includes(normalized) ? normalized : "private_beta";
}

function stageLabel(stage) {
  return String(stage || "").replace(/_/g, " ");
}

function sortLeadPriority(left, right) {
  return right.score - left.score || right.value - left.value || left.name.localeCompare(right.name);
}

function normalizeRole(role) {
  const value = String(role || "").toLowerCase();
  return ["owner", "admin", "manager", "member"].includes(value) ? value : "member";
}

function normalizeOneOf(value, allowed, fallback) {
  const normalized = String(value || "").toLowerCase();
  return allowed.includes(normalized) ? normalized : fallback;
}

function goalValue(goals, key) {
  const alias = {
    follow_ups_completed: ["followUps", "follow_ups", "followups"],
    appointments_booked: ["appointments"],
    new_leads: ["newLeads"],
    revenue_won: ["revenue"],
    emails_sent: ["emails"],
    sms_sent: ["sms"],
  };
  if (goals[key] !== undefined) return goals[key];
  for (const candidate of alias[key] || []) if (goals[candidate] !== undefined) return goals[candidate];
  return undefined;
}

function nonNegativeInteger(value, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) return fallback;
  return Math.round(number);
}

function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function readinessStatus(score, threshold = 80) {
  if (score >= threshold) return "passed";
  if (score >= Math.max(60, threshold - 10)) return "warning";
  return "fail";
}

function statusLabel(status) {
  return String(status || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function parseJsonObject(value) {
  if (!value) return {};
  if (typeof value === "object") return value;
  try {
    const parsed = JSON.parse(String(value));
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function isTodayLike(value, now, timezone) {
  const text = String(value || "").toLowerCase();
  if (["today", "now"].includes(text)) return true;
  return isSameZonedDay(value, now, timezone);
}

function isPastDate(value, now, timezone) {
  const text = String(value || "").toLowerCase();
  if (!text || text === "today" || text === "now") return false;
  const parsed = parseDate(value);
  if (!parsed) return false;
  return zonedDateKey(parsed, timezone) < zonedDateKey(now, timezone);
}

function isSameZonedDay(value, now, timezone) {
  const parsed = parseDate(value);
  if (!parsed) return false;
  return zonedDateKey(parsed, timezone) === zonedDateKey(now, timezone);
}

function isSameZonedMonth(value, now, timezone) {
  const parsed = parseDate(value);
  if (!parsed) return false;
  return zonedDateKey(parsed, timezone).slice(0, 7) === zonedDateKey(now, timezone).slice(0, 7);
}

function daysBetween(value, now) {
  const parsed = parseDate(value);
  if (!parsed) return 999;
  return Math.floor((now.getTime() - parsed.getTime()) / 86400000);
}

function parseDate(value) {
  if (!value) return null;
  const parsed = value instanceof Date ? value : new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function zonedDateKey(value, timezone = "UTC") {
  const date = value instanceof Date ? value : new Date(value);
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(date);
    const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
    return `${byType.year}-${byType.month}-${byType.day}`;
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

function dailyDateRange(now, timezone) {
  const date = zonedDateKey(now, timezone);
  return { start: date, end: date, granularity: "day" };
}

function looksUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ""));
}
