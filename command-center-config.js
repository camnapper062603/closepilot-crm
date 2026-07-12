export const launchReadinessCategories = [
  {
    key: "auth_security",
    label: "Auth, tenant security, and access control",
    weight: 24,
    required: true,
    providerKeys: ["database", "internal_access"],
  },
  {
    key: "core_crm",
    label: "Core CRM workflows",
    weight: 18,
    required: true,
    providerKeys: ["database", "app_domain"],
  },
  {
    key: "providers",
    label: "Provider integrations",
    weight: 16,
    required: false,
    providerKeys: ["email", "sms", "calendar", "ai"],
  },
  {
    key: "billing",
    label: "Billing and trials",
    weight: 14,
    required: true,
    providerKeys: ["billing"],
  },
  {
    key: "recruiting",
    label: "Kira Recruit beta add-on",
    weight: 10,
    required: false,
    providerKeys: ["database", "email"],
  },
  {
    key: "release_ops",
    label: "Release operations and monitoring",
    weight: 18,
    required: true,
    providerKeys: ["ci_status", "error_monitoring", "app_domain"],
  },
];

export const launchProviderDefinitions = [
  {
    key: "database",
    label: "Supabase database and auth",
    env: ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"],
    required: true,
    category: "core",
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
    category: "release",
  },
  {
    key: "email",
    label: "Resend email delivery",
    env: ["RESEND_API_KEY", "INVITE_FROM_EMAIL"],
    required: true,
    category: "provider",
  },
  {
    key: "sms",
    label: "Twilio SMS",
    env: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
    required: false,
    category: "provider",
  },
  {
    key: "calendar",
    label: "Google Calendar OAuth",
    env: ["GOOGLE_CALENDAR_CLIENT_ID", "GOOGLE_CALENDAR_CLIENT_SECRET"],
    required: false,
    category: "provider",
  },
  {
    key: "ai",
    label: "OpenAI",
    env: ["OPENAI_API_KEY"],
    required: false,
    category: "provider",
  },
  {
    key: "billing",
    label: "Stripe billing",
    env: ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"],
    anyEnv: ["STRIPE_PRICE_STARTER", "STRIPE_PRODUCT_STARTER"],
    required: true,
    category: "billing",
  },
  {
    key: "ci_status",
    label: "CI workflow status feed",
    env: ["CI_STATUS_PROVIDER"],
    required: true,
    category: "release",
    disconnectedLabel: "Not connected",
  },
  {
    key: "error_monitoring",
    label: "Error monitoring",
    env: ["SENTRY_DSN"],
    required: false,
    category: "release",
  },
];

export const launchChecklistTemplate = [
  { key: "auth-confirmed", label: "Auth, email confirmation, and role gates verified", category: "Security" },
  { key: "rls-verified", label: "Supabase RLS and tenant isolation checks passed", category: "Security" },
  { key: "billing-trial", label: "7-day trial and billing checkout verified", category: "Revenue" },
  { key: "invite-flow", label: "Owner/admin invite flow verified end-to-end", category: "Customer onboarding" },
  { key: "crm-daily-command", label: "Customer daily command center validated with live workspace data", category: "Product" },
  { key: "kira-recruit-addon", label: "Kira Recruit add-on gates and CRM handoff validated", category: "Product" },
  { key: "provider-labels", label: "Missing providers show honest setup states", category: "Provider setup" },
  { key: "docs-complete", label: "Beta docs, status docs, and setup docs are current", category: "Operations" },
  { key: "release-gates", label: "Build, security tests, route inventory, and browser smoke pass", category: "Release" },
  { key: "support-ready", label: "Support contact, escalation path, and beta feedback loop ready", category: "Operations" },
];

export const defaultDailyGoals = {
  calls: 30,
  followUps: 20,
  appointments: 3,
  newLeads: 5,
  revenue: 25000,
};

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

export function providerStatusesFromEnv(env = {}) {
  return launchProviderDefinitions.map((provider) => {
    const requiredConfigured = provider.env.every((key) => Boolean(env[key]));
    const optionalConfigured = provider.anyEnv ? provider.anyEnv.some((key) => Boolean(env[key])) : true;
    const configured = requiredConfigured && optionalConfigured;
    return {
      key: provider.key,
      label: provider.label,
      category: provider.category,
      required: provider.required,
      configured,
      status: configured ? "connected" : provider.disconnectedLabel ? "not_connected" : "setup_required",
      displayStatus: configured ? "Connected" : provider.disconnectedLabel || "Setup required",
    };
  });
}

export function mergeProviderRows(providerStatuses, providerRows = []) {
  const rowsByKey = new Map(providerRows.map((row) => [String(row.provider_key || row.key || "").trim(), row]));
  return providerStatuses.map((provider) => {
    const row = rowsByKey.get(provider.key);
    if (!row) return provider;
    const status = String(row.status || provider.status || "").trim() || provider.status;
    return {
      ...provider,
      status,
      configured: ["connected", "healthy", "configured"].includes(status),
      displayStatus: row.display_status || statusLabel(status),
      checkedAt: row.checked_at || row.updated_at || "",
      detail: row.detail || "",
    };
  });
}

export function buildLaunchReadiness(categories = [], providers = []) {
  const categoryRows = new Map(categories.map((category) => [String(category.category_key || category.key || "").trim(), category]));
  const providersByKey = new Map(providers.map((provider) => [provider.key, provider]));
  const output = launchReadinessCategories.map((category) => {
    const row = categoryRows.get(category.key);
    const providerScores = category.providerKeys.map((key) => (providersByKey.get(key)?.configured ? 100 : 0));
    const defaultScore = providerScores.length ? Math.round(providerScores.reduce((sum, score) => sum + score, 0) / providerScores.length) : 0;
    const score = clampPercent(row?.score ?? row?.score_override ?? defaultScore);
    return {
      key: category.key,
      label: category.label,
      weight: category.weight,
      required: category.required,
      score,
      status: readinessStatus(score),
      detail: row?.detail || "",
      updatedAt: row?.updated_at || "",
    };
  });

  const weightTotal = output.reduce((sum, category) => sum + category.weight, 0) || 1;
  const score = Math.round(output.reduce((sum, category) => sum + category.score * category.weight, 0) / weightTotal);
  return { score, categories: output };
}

export function launchRecommendation({ readinessScore = 0, blockers = [], checklist = [], providers = [] } = {}) {
  const openBlockers = blockers.filter((blocker) => !["resolved", "accepted"].includes(String(blocker.status || "").toLowerCase()));
  const criticalBlockers = openBlockers.filter((blocker) => String(blocker.severity || "").toLowerCase() === "critical");
  const highBlockers = openBlockers.filter((blocker) => String(blocker.severity || "").toLowerCase() === "high");
  const requiredProviderMissing = providers.filter((provider) => provider.required && !provider.configured);
  const checklistProgress = checklistProgressPercent(checklist);

  if (criticalBlockers.length || readinessScore < 65 || requiredProviderMissing.some((provider) => provider.key !== "ci_status")) {
    return {
      status: "NO_GO",
      label: "NO-GO",
      reason: criticalBlockers.length
        ? "Critical blockers are still open."
        : requiredProviderMissing.length
          ? "Required providers still need setup."
          : "Readiness score is below the beta floor.",
    };
  }

  if (readinessScore >= 85 && checklistProgress >= 80 && highBlockers.length === 0 && requiredProviderMissing.length === 0) {
    return {
      status: "GO",
      label: "GO",
      reason: "Weighted readiness, beta checklist, providers, and blockers are inside the launch threshold.",
    };
  }

  return {
    status: "CONDITIONAL_GO",
    label: "CONDITIONAL GO",
    reason: highBlockers.length
      ? "High blockers remain, but no critical blocker prevents a controlled beta."
      : "Core launch gates are usable, but beta checklist or release operations need follow-up.",
  };
}

export function normalizeLaunchBlocker(blocker = {}) {
  const severity = normalizeOneOf(blocker.severity, ["critical", "high", "medium", "low"], "medium");
  const status = normalizeOneOf(blocker.status, ["open", "in_progress", "resolved", "accepted"], "open");
  return {
    id: blocker.id || "",
    title: String(blocker.title || "Untitled blocker").trim(),
    detail: String(blocker.detail || "").trim(),
    severity,
    status,
    owner: String(blocker.owner || "").trim(),
    dueAt: blocker.due_at || blocker.dueAt || null,
    createdAt: blocker.created_at || blocker.createdAt || "",
    updatedAt: blocker.updated_at || blocker.updatedAt || "",
    weight: severityWeights[severity],
  };
}

export function normalizeLaunchChecklistItem(item = {}) {
  return {
    key: String(item.item_key || item.key || "").trim(),
    label: String(item.label || "").trim(),
    category: String(item.category || "").trim(),
    completed: Boolean(item.completed),
    note: String(item.note || "").trim(),
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
  return Math.round((checklist.filter((item) => item.completed).length / checklist.length) * 100);
}

export function buildDailyCommandCenterSnapshot(input = {}) {
  const now = input.now ? new Date(input.now) : new Date();
  const leads = (input.leads || []).map(normalizeLead);
  const tasks = (input.tasks || []).map(normalizeTask);
  const appointments = (input.appointments || []).map(normalizeAppointment);
  const activities = (input.activities || []).map(normalizeActivity);
  const communications = (input.communications || []).map(normalizeCommunication);
  const notifications = (input.notifications || []).map(normalizeNotification);
  const goals = normalizeDailyGoals(input.goals);
  const role = normalizeRole(input.role);
  const members = Array.isArray(input.members) ? input.members : [];
  const todayTasks = tasks.filter((task) => !task.done && isTodayLike(task.due, now));
  const overdueTasks = tasks.filter((task) => !task.done && isPastDate(task.due, now));
  const appointmentsToday = appointments.filter((appointment) => isSameDay(appointment.startsAt, now));
  const openLeads = leads.filter((lead) => lead.stage !== "won");
  const hotLeads = openLeads.filter((lead) => lead.score >= 80).sort(sortLeadPriority);
  const staleLeads = openLeads.filter((lead) => daysBetween(lead.updatedAt || lead.createdAt, now) >= 7 || !lead.nextAction);
  const atRiskLeads = openLeads.filter((lead) => lead.score < 60 || staleLeads.some((stale) => stale.id && stale.id === lead.id));
  const activitiesToday = activities.filter((activity) => isSameDay(activity.createdAt, now));
  const communicationsToday = communications.filter((communication) => isSameDay(communication.createdAt, now));
  const wonThisMonth = leads.filter((lead) => lead.stage === "won" && isSameMonth(lead.updatedAt || lead.createdAt, now));
  const pipelineValue = openLeads.reduce((sum, lead) => sum + lead.value, 0);
  const weightedPipelineValue = openLeads.reduce((sum, lead) => sum + lead.value * (stageWeights[lead.stage] || 0.2), 0);
  const wonRevenueMonth = wonThisMonth.reduce((sum, lead) => sum + lead.value, 0);
  const priorities = buildDailyPriorities({ hotLeads, todayTasks, overdueTasks, appointmentsToday, atRiskLeads, goals, activitiesToday });
  const pipelineHealth = buildPipelineHealth(leads, atRiskLeads);
  const teamPerformance = ["owner", "admin", "manager"].includes(role)
    ? buildTeamPerformance({ leads, tasks, activities, communications, members, now })
    : {
        locked: true,
        message: "Team performance is visible to Owners, Admins, and Managers.",
        members: [],
      };

  return {
    generatedAt: now.toISOString(),
    mode: input.mode || "live",
    role,
    goals,
    priorities,
    kpis: [
      { key: "pipeline_value", label: "Open pipeline", value: Math.round(pipelineValue), format: "currency" },
      { key: "weighted_pipeline", label: "Weighted forecast", value: Math.round(weightedPipelineValue), format: "currency" },
      { key: "won_month", label: "Won this month", value: Math.round(wonRevenueMonth), format: "currency", goal: goals.revenue },
      { key: "hot_leads", label: "Hot leads", value: hotLeads.length, format: "number" },
      { key: "due_today", label: "Due today", value: todayTasks.length + overdueTasks.length, format: "number", goal: goals.followUps },
      { key: "appointments_today", label: "Appointments today", value: appointmentsToday.length, format: "number", goal: goals.appointments },
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
  return {
    calls: positiveInteger(goals.calls, defaultDailyGoals.calls),
    followUps: positiveInteger(goals.followUps ?? goals.follow_ups, defaultDailyGoals.followUps),
    appointments: positiveInteger(goals.appointments, defaultDailyGoals.appointments),
    newLeads: positiveInteger(goals.newLeads ?? goals.new_leads, defaultDailyGoals.newLeads),
    revenue: positiveInteger(goals.revenue, defaultDailyGoals.revenue),
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
      reason: `Daily follow-up target is ${goals.followUps}; complete due tasks before adding new work.`,
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

function buildTeamPerformance({ leads, tasks, activities, communications, members, now }) {
  const emails = new Set([
    ...members.map((member) => String(member.email || "").toLowerCase()).filter(Boolean),
    ...leads.map((lead) => String(lead.assignedTo || "").toLowerCase()).filter(Boolean),
  ]);
  const memberEmails = [...emails].length ? [...emails] : ["unassigned"];
  return {
    locked: false,
    members: memberEmails.map((email) => {
      const assignedLeads = leads.filter((lead) => String(lead.assignedTo || "unassigned").toLowerCase() === email);
      const openTasks = tasks.filter((task) => !task.done && String(task.assignedTo || email).toLowerCase() === email);
      const activityCount = activities.filter((activity) => isSameDay(activity.createdAt, now)).length;
      const communicationCount = communications.filter((communication) => isSameDay(communication.createdAt, now)).length;
      return {
        email,
        openLeads: assignedLeads.filter((lead) => lead.stage !== "won").length,
        wonValue: assignedLeads.filter((lead) => lead.stage === "won").reduce((sum, lead) => sum + lead.value, 0),
        openTasks: openTasks.length,
        activityToday: activityCount + communicationCount,
      };
    }),
  };
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
    createdAt: row.created_at || row.createdAt || "",
  };
}

function normalizeAppointment(row = {}) {
  return {
    id: row.id || "",
    title: row.title || "",
    startsAt: row.starts_at || row.startsAt || "",
    assignedTo: row.assigned_to || row.assignedTo || "",
    status: row.status || "booked",
  };
}

function normalizeActivity(row = {}) {
  return {
    id: row.id || "",
    type: row.type || "activity",
    message: row.message || "",
    createdAt: row.created_at || row.createdAt || "",
  };
}

function normalizeCommunication(row = {}) {
  return {
    id: row.id || "",
    type: row.channel || row.type || "communication",
    message: row.subject || row.body || "",
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

function positiveInteger(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number) : fallback;
}

function clampPercent(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(100, Math.round(number)));
}

function readinessStatus(score) {
  if (score >= 85) return "ready";
  if (score >= 70) return "watch";
  return "blocked";
}

function statusLabel(status) {
  return String(status || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isTodayLike(value, now) {
  const text = String(value || "").toLowerCase();
  if (["today", "now"].includes(text)) return true;
  return isSameDay(value, now);
}

function isPastDate(value, now) {
  const parsed = parseDate(value);
  if (!parsed) return false;
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  return parsed < startOfToday;
}

function isSameDay(value, now) {
  const parsed = parseDate(value);
  if (!parsed) return false;
  return parsed.getFullYear() === now.getFullYear() && parsed.getMonth() === now.getMonth() && parsed.getDate() === now.getDate();
}

function isSameMonth(value, now) {
  const parsed = parseDate(value);
  if (!parsed) return false;
  return parsed.getFullYear() === now.getFullYear() && parsed.getMonth() === now.getMonth();
}

function daysBetween(value, now) {
  const parsed = parseDate(value);
  if (!parsed) return 999;
  return Math.floor((now.getTime() - parsed.getTime()) / 86400000);
}

function parseDate(value) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
