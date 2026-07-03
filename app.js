const stages = [
  { id: "new", label: "New" },
  { id: "qualified", label: "Qualified" },
  { id: "proposal", label: "Proposal" },
  { id: "won", label: "Won" },
];

const stageProbabilities = {
  new: 0.15,
  qualified: 0.4,
  proposal: 0.7,
  won: 1,
};

const planCatalog = {
  starter: {
    label: "Starter",
    price: 29,
    seatLimit: 3,
    detail: "Solo workflow, core CRM, exports, and backups.",
  },
  growth: {
    label: "Growth",
    price: 79,
    seatLimit: 10,
    detail: "Team seats, source reporting, automations, and forecasting.",
  },
  scale: {
    label: "Scale",
    price: 199,
    seatLimit: 25,
    detail: "Higher seat limits, admin controls, and priority rollout support.",
  },
};

const extensionCatalog = [
  {
    id: "recruiting",
    label: "Kira Recruit",
    price: 99,
    href: "/recruiting.html",
    detail: "Job intake, applicant feed, and interview booking.",
  },
  {
    id: "leadgen",
    label: "Residential Lead Gen",
    price: 149,
    href: "/SafeLeadGenerator-Standalone.html",
    detail: "Texas property imports, BatchLeads skip trace planning, and DNC-safe exports.",
  },
  {
    id: "bundle",
    label: "Recruit + Lead Gen bundle",
    price: 199,
    href: "",
    detail: "Both background apps connected through the CRM admin hub.",
  },
];

const defaultAutomations = [
  {
    key: "next-step-tasks",
    title: "Create next-step tasks",
    detail: "Every lead gets a follow-up task when it changes stage.",
    enabled: true,
    savedHours: 4,
  },
  {
    key: "lead-scoring",
    title: "Score hot opportunities",
    detail: "Scores rise with deal value, urgency, and buyer engagement.",
    enabled: true,
    savedHours: 3,
  },
  {
    key: "win-back-reminders",
    title: "Win-back reminders",
    detail: "Dormant leads surface after seven quiet days.",
    enabled: false,
    savedHours: 2,
  },
];

const automationTriggerLabels = {
  "new-lead": "New lead created",
  "stage-qualified": "Moved to Qualified",
  "stage-proposal": "Moved to Proposal",
  "won-deal": "Deal marked Won",
  "no-response": "No response reminder",
};

const defaultAutomationTemplates = [
  {
    id: "template-new-lead-speed",
    name: "Speed-to-lead starter",
    trigger: "new-lead",
    active: true,
    steps: [
      { due: "today", text: "Call {{name}} at {{company}} within 15 minutes." },
      { due: "today", text: "Send {{company}} a quick intro and booking link." },
      { due: "tomorrow", text: "Follow up with {{name}} on fit, budget, and timing." },
    ],
  },
  {
    id: "template-qualified-follow-up",
    name: "Qualified lead follow-up",
    trigger: "stage-qualified",
    active: true,
    steps: [
      { due: "today", text: "Send {{company}} a proposal recap and next-step summary." },
      { due: "tomorrow", text: "Ask {{name}} for timeline, blockers, and decision owner." },
      { due: "in 3 days", text: "Schedule a close-plan review with {{name}}." },
    ],
  },
  {
    id: "template-proposal-close-plan",
    name: "Proposal close plan",
    trigger: "stage-proposal",
    active: true,
    steps: [
      { due: "today", text: "Send {{company}} a proposal-stage close plan." },
      { due: "tomorrow", text: "Ask {{name}} for final objections and decision timing." },
      { due: "in 3 days", text: "Confirm the yes/no decision date with {{name}}." },
    ],
  },
  {
    id: "template-won-onboarding",
    name: "Won deal onboarding",
    trigger: "won-deal",
    active: true,
    steps: [
      { due: "today", text: "Send onboarding checklist to {{company}}." },
      { due: "tomorrow", text: "Schedule kickoff with {{name}}." },
      { due: "next week", text: "Ask {{name}} for referral or expansion opportunities." },
    ],
  },
  {
    id: "template-no-response-check-in",
    name: "No-response check-in",
    trigger: "no-response",
    active: true,
    steps: [
      { due: "today", text: "Send {{company}} a no-response check-in." },
      { due: "tomorrow", text: "Ask {{name}} if this should stay open or pause." },
    ],
  },
];

const timeSavedRates = {
  smartPrioritizedLead: 2,
  aiTalkingPointsGenerated: 3,
  flowFollowUpCompleted: 2,
  quickCallLogged: 4,
  flowAppointmentBooked: 5,
  leadIntelligenceViewed: 2,
};

const timeSavedSourceLabels = {
  smartPrioritization: "Smart Lead Prioritization",
  aiTalkingPoints: "AI Talking Points",
  automatedFollowUps: "Automated Follow-Ups",
  fastCallLogging: "Fast Call Logging",
  leadIntelligence: "Lead Intelligence",
};

const seedState = {
  selectedLeadId: "lead-1",
  workspaceName: "Personal workspace",
  leads: [
    {
      id: "lead-1",
      name: "Maya Johnson",
      company: "Northstar Roofing",
      stage: "qualified",
      value: 8400,
      score: 92,
      notes: "Owner wants a faster quote follow-up flow before storm season.",
      nextAction: "Send workflow proposal and ask for install calendar.",
      source: "Website",
    },
    {
      id: "lead-2",
      name: "Eli Ramirez",
      company: "Summit Auto Detail",
      stage: "new",
      value: 3200,
      score: 74,
      notes: "Interested in automated reminders for repeat customers.",
      nextAction: "Qualify budget and current CRM setup.",
      source: "Referral",
    },
    {
      id: "lead-3",
      name: "Nia Brooks",
      company: "Harbor Fitness",
      stage: "proposal",
      value: 12600,
      score: 88,
      notes: "Needs member retention campaign and missed-payment follow-up.",
      nextAction: "Review proposal pricing and implementation timeline.",
      source: "LinkedIn",
    },
    {
      id: "lead-4",
      name: "Caleb Stone",
      company: "Stone & Finch Realty",
      stage: "won",
      value: 5100,
      score: 81,
      notes: "Closed starter CRM setup. Expansion possible after onboarding.",
      nextAction: "Schedule onboarding and ask for first import file.",
      source: "Cold email",
    },
  ],
  tasks: [
    { id: "task-1", text: "Call Maya before 3 PM", done: false, due: "today" },
    { id: "task-2", text: "Draft Harbor Fitness proposal recap", done: false, due: "today" },
    { id: "task-3", text: "Send onboarding checklist to Stone & Finch", done: true, due: "today" },
  ],
  automations: defaultAutomations.map((automation, index) => ({
    id: `auto-${index + 1}`,
    ...automation,
  })),
  automationTemplates: structuredClone(defaultAutomationTemplates),
  automationRuns: [],
  appointments: [],
  schedule: {},
  account: {
    subscription: {
      plan: "starter",
      status: "trialing",
      seatLimit: 3,
      trialEndsAt: "2026-07-11T00:00:00.000Z",
    },
    members: [
      {
        id: "member-owner",
        email: "owner@kira.local",
        role: "owner",
        status: "active",
      },
    ],
    invites: [],
    auditEvents: [
      {
        id: "audit-seed",
        action: "Workspace created",
        detail: "Starter SaaS workspace initialized.",
        createdAt: "2026-06-20T15:00:00.000Z",
      },
    ],
  },
  activities: [
    {
      id: "activity-1",
      leadId: "lead-1",
      type: "created",
      message: "Lead created from Website.",
      createdAt: "2026-06-20T15:00:00.000Z",
    },
    {
      id: "activity-2",
      leadId: "lead-1",
      type: "stage",
      message: "Stage set to Qualified.",
      createdAt: "2026-06-21T15:00:00.000Z",
    },
  ],
};

let state = structuredClone(seedState);
let store;
let currentUser = null;
let supabaseClient = null;
let editingLeadId = null;
let pipelineView = "board";
let pendingImport = null;
let taskFilter = "today";
let taskSort = "recent";
let activityFilter = "all";
let contactFilter = "all";
let contactSort = "recent";
let selectedContactIds = new Set();
let selectedTaskIds = new Set();
let activePage = "pipeline";
let editingAutomationTemplateId = null;
let managerAnalyticsView = "revenue";
let managerInsightsVersion = 0;
let selectedConversationId = null;
let communicationFilter = "recent";
let communicationComposerMode = "text";
let communicationDrafts = {};
let communicationCallTimer = null;
let communicationCallState = {
  active: false,
  leadId: null,
  startedAt: null,
  muted: false,
  speaker: false,
  hold: false,
};

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const taskDueChoices = [
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "in 3 days", label: "In 3 days" },
  { value: "next week", label: "Next week" },
];

const board = document.querySelector("#pipelineBoard");
const pageTitle = document.querySelector(".topbar h1");
const subpageNav = document.querySelector("#subpageNav");
const pipelineHealth = document.querySelector("#pipelineHealth");
const insightList = document.querySelector("#insightList");
const startMyDayButton = document.querySelector("#startMyDayButton");
const dashboardRecommendations = document.querySelector("#dashboardRecommendations");
const dashboardActivityFeed = document.querySelector("#dashboardActivityFeed");
const dashboardSchedule = document.querySelector("#dashboardSchedule");
const dashboardFollowUpQueueCount = document.querySelector("#dashboardFollowUpQueueCount");
const dashboardFollowUpUrgency = document.querySelector("#dashboardFollowUpUrgency");
const openFollowUpQueueButton = document.querySelector("#openFollowUpQueueButton");
const dashboardTimeSavedToday = document.querySelector("#dashboardTimeSavedToday");
const dashboardTimeSavedWeek = document.querySelector("#dashboardTimeSavedWeek");
const dashboardTimeSavedMonth = document.querySelector("#dashboardTimeSavedMonth");
const dashboardTimeSavedSources = document.querySelector("#dashboardTimeSavedSources");
const teamTimeSavedTotal = document.querySelector("#teamTimeSavedTotal");
const teamTimeSavedContributors = document.querySelector("#teamTimeSavedContributors");
const flowModePanel = document.querySelector("#flowModePanel");
const flowProgressLabel = document.querySelector("#flowProgressLabel");
const flowCallsCompleted = document.querySelector("#flowCallsCompleted");
const flowFollowUpsCompleted = document.querySelector("#flowFollowUpsCompleted");
const flowAppointmentsBooked = document.querySelector("#flowAppointmentsBooked");
const flowTimeSavedToday = document.querySelector("#flowTimeSavedToday");
const flowActiveStep = document.querySelector("#flowActiveStep");
const flowActionTitle = document.querySelector("#flowActionTitle");
const flowActionWhy = document.querySelector("#flowActionWhy");
const flowTalkingPoints = document.querySelector("#flowTalkingPoints");
const flowLeadDetails = document.querySelector("#flowLeadDetails");
const flowActionButtons = document.querySelector("#flowActionButtons");
const flowActionStatus = document.querySelector("#flowActionStatus");
const flowTimeSavedMessage = document.querySelector("#flowTimeSavedMessage");
const flowCompletionState = document.querySelector("#flowCompletionState");
const flowCompletionSummary = document.querySelector("#flowCompletionSummary");
const flowCompletionResults = document.querySelector("#flowCompletionResults");
const flowCompleteNextButton = document.querySelector("#flowCompleteNext");
const restartFlowButton = document.querySelector("#restartFlowButton");
const sourceReportGrid = document.querySelector("#sourceReportGrid");
const exportSourceReportButton = document.querySelector("#exportSourceReport");
const followUpQueueSummary = document.querySelector("#followUpQueueSummary");
const followUpQueueList = document.querySelector("#followUpQueueList");
const followUpQueueMessage = document.querySelector("#followUpQueueMessage");
const aiSalesManagerPage = document.querySelector("#aiSalesManagerPage");
const managerRefreshInsightsButton = document.querySelector("#managerRefreshInsights");
const managerKpiGrid = document.querySelector("#managerKpiGrid");
const salesLeaderboard = document.querySelector("#salesLeaderboard");
const managerAIInsights = document.querySelector("#managerAIInsights");
const forecastCharts = document.querySelector("#forecastCharts");
const managerPipelineHealth = document.querySelector("#managerPipelineHealth");
const coachingPanel = document.querySelector("#coachingPanel");
const riskCenter = document.querySelector("#riskCenter");
const managerActionsPanel = document.querySelector("#managerActionsPanel");
const managerStatus = document.querySelector("#managerStatus");
const managerNotifications = document.querySelector("#managerNotifications");
const managerAnalyticsTabs = document.querySelector("#managerAnalyticsTabs");
const managerAnalyticsChart = document.querySelector("#managerAnalyticsChart");
const communicationsPage = document.querySelector("#communicationsPage");
const conversationCount = document.querySelector("#conversationCount");
const communicationSearchInput = document.querySelector("#communicationSearch");
const conversationList = document.querySelector("#conversationList");
const conversationWindowHeader = document.querySelector("#conversationWindowHeader");
const callControls = document.querySelector("#callControls");
const conversationTimeline = document.querySelector("#conversationTimeline");
const messageComposer = document.querySelector("#messageComposer");
const customerSidebar = document.querySelector("#customerSidebar");
const aiAssistantPanel = document.querySelector("#aiAssistantPanel");
const quickActionsPanel = document.querySelector("#quickActionsPanel");
const communicationNotificationFeed = document.querySelector("#communicationNotificationFeed");
const communicationsStatus = document.querySelector("#communicationsStatus");
const communicationToastRegion = document.querySelector("#communicationToastRegion");
const leadBrief = document.querySelector("#leadBrief");
const contactTable = document.querySelector("#contactTable");
const contactsPanel = document.querySelector("#contacts");
const contactProfilePanel = document.querySelector("#contactProfile");
const contactSummary = document.querySelector("#contactSummary");
const contactProfileContent = document.querySelector("#contactProfileContent");
const backToContactsButton = document.querySelector("#backToContacts");
const contactSortInput = document.querySelector("#contactSort");
const selectVisibleContactsButton = document.querySelector("#selectVisibleContacts");
const clearSelectedContactsButton = document.querySelector("#clearSelectedContacts");
const contactSelectionStatus = document.querySelector("#contactSelectionStatus");
const exportSelectedContactsButton = document.querySelector("#exportSelectedContacts");
const pullSafeLeadsButton = document.querySelector("#pullSafeLeadsButton");
const leadGeneratorStatus = document.querySelector("#leadGeneratorStatus");
const dialSummary = document.querySelector("#dialSummary");
const dialActiveLead = document.querySelector("#dialActiveLead");
const dialOutcomeForm = document.querySelector("#dialOutcomeForm");
const dialContactMethodInput = document.querySelector("#dialContactMethod");
const dialOutcomeInput = document.querySelector("#dialOutcome");
const dialNotesInput = document.querySelector("#dialNotes");
const dialTextLog = document.querySelector("#dialTextLog");
const dialTextMessageInput = document.querySelector("#dialTextMessage");
const appointmentFields = document.querySelector("#appointmentFields");
const appointmentDateInput = document.querySelector("#appointmentDate");
const appointmentTimePicker = document.querySelector("#appointmentTimePicker");
const appointmentCloserInput = document.querySelector("#appointmentCloser");
const dialMessage = document.querySelector("#dialMessage");
const appointmentList = document.querySelector("#appointmentList");
const dialScheduleGrid = document.querySelector("#dialScheduleGrid");
const scheduleMessage = document.querySelector("#scheduleMessage");
const calendarBoard = document.querySelector("#calendarBoard");
const bulkContactTaskButton = document.querySelector("#bulkContactTask");
const bulkContactWonButton = document.querySelector("#bulkContactWon");
const bulkContactNextButton = document.querySelector("#bulkContactNext");
const taskList = document.querySelector("#taskList");
const taskSummary = document.querySelector("#taskSummary");
const taskSearchInput = document.querySelector("#taskSearch");
const taskSortInput = document.querySelector("#taskSort");
const completeVisibleTasksButton = document.querySelector("#completeVisibleTasks");
const snoozeVisibleTasksButton = document.querySelector("#snoozeVisibleTasks");
const exportVisibleTasksButton = document.querySelector("#exportVisibleTasks");
const clearDoneTasksButton = document.querySelector("#clearDoneTasks");
const selectVisibleTasksButton = document.querySelector("#selectVisibleTasks");
const clearSelectedTasksButton = document.querySelector("#clearSelectedTasks");
const taskSelectionStatus = document.querySelector("#taskSelectionStatus");
const exportSelectedTasksButton = document.querySelector("#exportSelectedTasks");
const completeSelectedTasksButton = document.querySelector("#completeSelectedTasks");
const snoozeSelectedTasksButton = document.querySelector("#snoozeSelectedTasks");
const selectedTaskDueInput = document.querySelector("#selectedTaskDue");
const applySelectedTaskDueButton = document.querySelector("#applySelectedTaskDue");
const duplicateSelectedTasksButton = document.querySelector("#duplicateSelectedTasks");
const deleteSelectedTasksButton = document.querySelector("#deleteSelectedTasks");
const automationList = document.querySelector("#automationList");
const automationSummary = document.querySelector("#automationSummary");
const enableAllAutomationsButton = document.querySelector("#enableAllAutomations");
const resetAutomationsButton = document.querySelector("#resetAutomations");
const runNoResponseScanButton = document.querySelector("#runNoResponseScan");
const automationBuilderForm = document.querySelector("#automationBuilderForm");
const automationTemplateNameInput = document.querySelector("#automationTemplateName");
const automationTriggerInput = document.querySelector("#automationTrigger");
const automationStep1DueInput = document.querySelector("#automationStep1Due");
const automationStep1TextInput = document.querySelector("#automationStep1Text");
const automationStep2DueInput = document.querySelector("#automationStep2Due");
const automationStep2TextInput = document.querySelector("#automationStep2Text");
const automationStep3DueInput = document.querySelector("#automationStep3Due");
const automationStep3TextInput = document.querySelector("#automationStep3Text");
const resetAutomationBuilderButton = document.querySelector("#resetAutomationBuilder");
const automationPreview = document.querySelector("#automationPreview");
const automationBuilderMessage = document.querySelector("#automationBuilderMessage");
const automationTemplateList = document.querySelector("#automationTemplateList");
const automationRunList = document.querySelector("#automationRunList");
const activityFeed = document.querySelector("#activityFeed");
const activitySummary = document.querySelector("#activitySummary");
const activitySearchInput = document.querySelector("#activitySearch");
const exportVisibleActivityButton = document.querySelector("#exportVisibleActivity");
const searchInput = document.querySelector("#searchInput");
const leadModal = document.querySelector("#leadModal");
const leadForm = document.querySelector("#leadForm");
const taskForm = document.querySelector("#taskForm");
const authPanel = document.querySelector("#authPanel");
const authForm = document.querySelector("#authForm");
const authMessage = document.querySelector("#authMessage");
const modePill = document.querySelector("#modePill");
const appShell = document.querySelector(".app-shell");
const signOutButton = document.querySelector("#signOutButton");
const revenueGoalForm = document.querySelector("#revenueGoalForm");
const revenueTargetInput = document.querySelector("#revenueTargetInput");
const revenueProgressBar = document.querySelector("#revenueProgressBar");
const revenueGoalSummary = document.querySelector("#revenueGoalSummary");
const revenueGoalMessage = document.querySelector("#revenueGoalMessage");
const onboardingPanel = document.querySelector("#onboardingPanel");
const seedWorkspaceButton = document.querySelector("#seedWorkspaceButton");
const dismissOnboardingButton = document.querySelector("#dismissOnboardingButton");
const setupBusinessName = document.querySelector("#setupBusinessName");
const setupWorkspaceType = document.querySelector("#setupWorkspaceType");
const setupSalesGoal = document.querySelector("#setupSalesGoal");
const exportLeadsButton = document.querySelector("#exportLeadsButton");
const importLeadsButton = document.querySelector("#importLeadsButton");
const importLeadsInput = document.querySelector("#importLeadsInput");
const importModal = document.querySelector("#importModal");
const importPreview = document.querySelector("#importPreview");
const confirmImportButton = document.querySelector("#confirmImportButton");
const cancelImportButton = document.querySelector("#cancelImportButton");
const closeImportModalButton = document.querySelector("#closeImportModal");
const exportWorkspaceBackupButton = document.querySelector("#exportWorkspaceBackup");
const importWorkspaceBackupButton = document.querySelector("#importWorkspaceBackup");
const importWorkspaceBackupInput = document.querySelector("#importWorkspaceBackupInput");
const backupSummary = document.querySelector("#backupSummary");
const backupMessage = document.querySelector("#backupMessage");
const subscriptionStatus = document.querySelector("#subscriptionStatus");
const workspaceAdminForm = document.querySelector("#workspaceAdminForm");
const adminBusinessName = document.querySelector("#adminBusinessName");
const adminWorkspaceType = document.querySelector("#adminWorkspaceType");
const adminSalesGoal = document.querySelector("#adminSalesGoal");
const adminOwnerEmail = document.querySelector("#adminOwnerEmail");
const adminIndustry = document.querySelector("#adminIndustry");
const adminTimezone = document.querySelector("#adminTimezone");
const adminDefaultSource = document.querySelector("#adminDefaultSource");
const workspaceProfileSummary = document.querySelector("#workspaceProfileSummary");
const planSummary = document.querySelector("#planSummary");
const planAddonList = document.querySelector("#planAddonList");
const teamSummary = document.querySelector("#teamSummary");
const openCheckoutButton = document.querySelector("#openCheckout");
const openBillingPortalButton = document.querySelector("#openBillingPortal");
const inviteForm = document.querySelector("#inviteForm");
const inviteEmail = document.querySelector("#inviteEmail");
const inviteRole = document.querySelector("#inviteRole");
const teamList = document.querySelector("#teamList");
const launchChecklist = document.querySelector("#launchChecklist");
const auditList = document.querySelector("#auditList");
const adminMessage = document.querySelector("#adminMessage");
const leadDetailModal = document.querySelector("#leadDetailModal");
const leadDetailContent = document.querySelector("#leadDetailContent");
const closeLeadDetailModalButton = document.querySelector("#closeLeadDetailModal");

const config = window.KiraHomeConfig || window.ClosePilotConfig || {};
const hasSupabaseConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey);
const pageTitles = {
  pipeline: "Dashboard",
  manager: "AI Sales Manager",
  contacts: "Contacts",
  automation: "Automation",
  tasks: "Tasks",
  activity: "Activity",
  communications: "Communications",
  dial: "Dial floor",
  calendar: "Calendar",
  admin: "Workspace admin",
};
const subpageCatalog = {
  pipeline: [
    { id: "overview", label: "Dashboard" },
    { id: "setup", label: "First run" },
    { id: "target", label: "Monthly target" },
    { id: "insights", label: "Pipeline insights" },
    { id: "followups", label: "Follow-Up Queue" },
    { id: "channels", label: "Channel report" },
    { id: "brief", label: "Lead brief" },
  ],
  automation: [
    { id: "overview", label: "Automations" },
    { id: "builder", label: "Automation builder" },
    { id: "templates", label: "Automation templates" },
    { id: "runs", label: "Automation runs" },
  ],
  contacts: [
    { id: "list", label: "Contacts" },
    { id: "profile", label: "Contact profile" },
  ],
  tasks: [{ id: "list", label: "Tasks" }],
  activity: [{ id: "feed", label: "Activity feed" }],
  admin: [
    { id: "settings", label: "Workspace settings" },
    { id: "billing", label: "Plan and seats" },
    { id: "team", label: "Members and invites" },
    { id: "extensions", label: "Connected apps" },
    { id: "launch", label: "Production readiness" },
    { id: "audit", label: "Audit trail" },
    { id: "backup", label: "Backup center" },
  ],
};
const appointmentTimes = Array.from({ length: 12 }, (_item, index) => {
  const hour = index + 9;
  return {
    value: `${String(hour).padStart(2, "0")}:00`,
    label: hour < 12 ? `${hour} AM` : hour === 12 ? "12 PM" : `${hour - 12} PM`,
  };
});
const scheduleDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const scheduleHours = Array.from({ length: 16 }, (_item, index) => index + 6);
let selectedAppointmentTime = "09:00";
let contactProfileMode = false;
let dialView = "floor";
let calendarView = "calendar";
let flowSession = createFlowSession();
const subpageState = Object.fromEntries(Object.entries(subpageCatalog).map(([page, pages]) => [page, pages[0].id]));

document.querySelector("#openLeadModal").addEventListener("click", () => {
  openLeadModal();
});

document.querySelector("#closeLeadModal").addEventListener("click", closeLeadModal);

leadForm.addEventListener("submit", (event) => {
  event.preventDefault();
  createLeadFromForm();
});

document.querySelector("#createLeadButton").addEventListener("click", createLeadFromForm);

taskForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const input = document.querySelector("#taskInput");
  const dueInput = document.querySelector("#taskDue");
  const text = input.value.trim();
  if (!text) return;

  await store.createTask({ text, done: false, due: dueInput.value });
  input.value = "";
  dueInput.value = "today";
  await reloadState();
});

completeVisibleTasksButton.addEventListener("click", completeVisibleTasks);
snoozeVisibleTasksButton.addEventListener("click", snoozeVisibleTasks);
exportVisibleTasksButton.addEventListener("click", exportVisibleTasksCsv);
clearDoneTasksButton.addEventListener("click", clearDoneTasks);
selectVisibleTasksButton.addEventListener("click", selectVisibleTasks);
clearSelectedTasksButton.addEventListener("click", clearSelectedTasks);
exportSelectedTasksButton.addEventListener("click", exportSelectedTasksCsv);
completeSelectedTasksButton.addEventListener("click", completeSelectedTasks);
snoozeSelectedTasksButton.addEventListener("click", snoozeSelectedTasks);
applySelectedTaskDueButton.addEventListener("click", applySelectedTaskDue);
duplicateSelectedTasksButton.addEventListener("click", duplicateSelectedTasks);
deleteSelectedTasksButton.addEventListener("click", deleteSelectedTasks);
enableAllAutomationsButton.addEventListener("click", enableAllAutomations);
resetAutomationsButton.addEventListener("click", resetAutomationsToDefaults);
runNoResponseScanButton.addEventListener("click", runNoResponseScan);
automationBuilderForm.addEventListener("submit", saveAutomationTemplateFromBuilder);
resetAutomationBuilderButton.addEventListener("click", resetAutomationBuilder);
[
  automationTemplateNameInput,
  automationTriggerInput,
  automationStep1DueInput,
  automationStep1TextInput,
  automationStep2DueInput,
  automationStep2TextInput,
  automationStep3DueInput,
  automationStep3TextInput,
].forEach((input) => {
  input.addEventListener("input", renderAutomationPreview);
  input.addEventListener("change", renderAutomationPreview);
});
taskSearchInput.addEventListener("input", renderTasks);
taskSortInput.addEventListener("change", () => {
  taskSort = taskSortInput.value;
  renderTasks();
});
activitySearchInput.addEventListener("input", renderActivityFeed);
exportVisibleActivityButton.addEventListener("click", exportVisibleActivityCsv);
selectVisibleContactsButton.addEventListener("click", selectVisibleContacts);
clearSelectedContactsButton.addEventListener("click", clearSelectedContacts);
exportSelectedContactsButton.addEventListener("click", exportSelectedContactsCsv);
backToContactsButton.addEventListener("click", () => {
  contactProfileMode = false;
  subpageState.contacts = "list";
  renderContacts();
  renderRoute();
});
pullSafeLeadsButton.addEventListener("click", pullSafeLeadBatch);
dialOutcomeForm.addEventListener("submit", saveDialOutcome);
dialOutcomeInput.addEventListener("change", renderAppointmentFields);
dialContactMethodInput.addEventListener("change", renderDialTextLog);
bulkContactTaskButton.addEventListener("click", createTasksForSelectedContacts);
bulkContactWonButton.addEventListener("click", markSelectedContactsWon);
bulkContactNextButton.addEventListener("click", moveSelectedContactsNext);

searchInput.addEventListener("input", render);
exportSourceReportButton.addEventListener("click", exportSourceReportCsv);
revenueGoalForm.addEventListener("submit", saveRevenueTarget);
startMyDayButton.addEventListener("click", startMyDay);
openFollowUpQueueButton.addEventListener("click", openFollowUpQueue);
flowCompleteNextButton.addEventListener("click", completeCurrentFlowAction);
restartFlowButton.addEventListener("click", startMyDay);
document.querySelectorAll("[data-flow-outcome]").forEach((button) => {
  button.addEventListener("click", () => selectFlowOutcome(button.dataset.flowOutcome));
});

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await signIn();
});

document.querySelector("#signUpButton").addEventListener("click", signUp);
signOutButton.addEventListener("click", signOut);
seedWorkspaceButton.addEventListener("click", seedStarterWorkspace);
dismissOnboardingButton.addEventListener("click", dismissOnboarding);
exportLeadsButton.addEventListener("click", exportLeadsCsv);
importLeadsButton.addEventListener("click", () => importLeadsInput.click());
importLeadsInput.addEventListener("change", importLeadsCsv);
exportWorkspaceBackupButton.addEventListener("click", exportWorkspaceBackup);
importWorkspaceBackupButton.addEventListener("click", () => importWorkspaceBackupInput.click());
importWorkspaceBackupInput.addEventListener("change", importWorkspaceBackup);
workspaceAdminForm.addEventListener("submit", saveAdminWorkspaceSettings);
inviteForm.addEventListener("submit", inviteTeamMember);
openCheckoutButton.addEventListener("click", openCheckout);
openBillingPortalButton.addEventListener("click", openBillingPortal);
confirmImportButton.addEventListener("click", confirmLeadsImport);
cancelImportButton.addEventListener("click", closeImportModal);
closeImportModalButton.addEventListener("click", closeImportModal);
closeLeadDetailModalButton.addEventListener("click", closeLeadDetailModal);

document.querySelectorAll("[data-pipeline-view]").forEach((button) => {
  button.addEventListener("click", () => {
    pipelineView = button.dataset.pipelineView;
    renderPipeline();
  });
});

document.querySelectorAll("[data-task-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    taskFilter = button.dataset.taskFilter;
    renderTasks();
  });
});

document.querySelectorAll("[data-activity-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    activityFilter = button.dataset.activityFilter;
    renderActivityFeed();
  });
});

document.querySelectorAll("[data-contact-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    contactFilter = button.dataset.contactFilter;
    renderPipeline();
    renderContacts();
  });
});

contactSortInput.addEventListener("change", () => {
  contactSort = contactSortInput.value;
  renderContacts();
});

managerRefreshInsightsButton.addEventListener("click", () => {
  managerInsightsVersion += 1;
  renderAISalesManagerPage();
  managerStatus.textContent = "AI insights refreshed with the latest placeholder signals.";
});

communicationSearchInput.addEventListener("input", renderCommunicationsPage);

document.querySelectorAll("[data-communication-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    communicationFilter = button.dataset.communicationFilter;
    renderCommunicationsPage();
  });
});

document.querySelectorAll("[data-plan-choice]").forEach((button) => {
  button.addEventListener("click", () => {
    changeSubscriptionPlan(button.dataset.planChoice);
  });
});

document.querySelectorAll("[data-calendar-view]").forEach((button) => {
  button.addEventListener("click", () => {
    calendarView = button.dataset.calendarView;
    subpageState.calendar = calendarView;
    renderCalendar();
    renderSubpages();
  });
});

document.querySelectorAll("[data-dial-view]").forEach((button) => {
  button.addEventListener("click", () => {
    dialView = button.dataset.dialView;
    subpageState.dial = dialView;
    renderDialWorkspace();
  });
});

subpageNav.addEventListener("click", (event) => {
  const button = event.target.closest("[data-subpage-choice]");
  if (!button) return;
  setSubpage(activePage, button.dataset.subpageChoice);
});

window.addEventListener("hashchange", () => {
  routeFromHash();
  renderRoute();
});

async function boot() {
  if (!hasSupabaseConfig) {
    store = createLocalStore();
    state = await store.load();
    normalizeLoadedState();
    routeFromHash();
    setCloudMode(false);
    render();
    return;
  }

  try {
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
    const { data } = await supabaseClient.auth.getSession();
    currentUser = data.session?.user || null;

    supabaseClient.auth.onAuthStateChange(async (_event, session) => {
      currentUser = session?.user || null;
      if (currentUser) {
        await startCloudWorkspace();
      } else {
        showAuth();
      }
    });

    if (!currentUser) {
      showAuth();
      return;
    }

    await startCloudWorkspace();
  } catch (error) {
    console.error(error);
    store = createLocalStore();
    state = await store.load();
    normalizeLoadedState();
    routeFromHash();
    setCloudMode(false, "Demo mode - cloud unavailable");
    render();
  }
}

async function startCloudWorkspace() {
  hideAuth();
  setCloudMode(true);
  store = createSupabaseStore(supabaseClient, currentUser);
  await store.ensureWorkspace();
  routeFromHash();
  await reloadState();
}

function showAuth() {
  authPanel.hidden = false;
  appShell.hidden = true;
  signOutButton.hidden = true;
  modePill.textContent = "Cloud mode";
}

function hideAuth() {
  authPanel.hidden = true;
  appShell.hidden = false;
}

function setCloudMode(enabled, label) {
  modePill.textContent = label || (enabled ? "Cloud synced" : "Demo mode");
  signOutButton.hidden = !enabled;
}

async function signIn() {
  setAuthMessage("Signing in...");
  const email = document.querySelector("#authEmail").value.trim();
  const password = document.querySelector("#authPassword").value;
  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });
  setAuthMessage(error ? error.message : "Signed in.");
}

async function signUp() {
  setAuthMessage("Creating account...");
  const email = document.querySelector("#authEmail").value.trim();
  const password = document.querySelector("#authPassword").value;
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin,
    },
  });
  if (error) {
    setAuthMessage(error.message);
    return;
  }
  setAuthMessage(data.session ? "Account created." : "Check your email to confirm your account.");
}

async function signOut() {
  await supabaseClient.auth.signOut();
}

function setAuthMessage(message) {
  authMessage.textContent = message;
}

async function createLeadFromForm() {
  const name = document.querySelector("#leadName").value.trim();
  const company = document.querySelector("#leadCompany").value.trim();
  if (!name || !company) return;

  const lead = {
    name,
    company,
    value: Number(document.querySelector("#leadValue").value),
    stage: document.querySelector("#leadStage").value,
    notes: document.querySelector("#leadNotes").value.trim() || "New lead created from the CRM workspace.",
    nextAction:
      document.querySelector("#leadNextAction").value.trim() ||
      nextActionForStage(document.querySelector("#leadStage").value),
    source: document.querySelector("#leadSource").value.trim() || "Manual",
    score: calculateLeadScore({
      value: Number(document.querySelector("#leadValue").value),
      stage: document.querySelector("#leadStage").value,
      notes: document.querySelector("#leadNotes").value.trim(),
    }),
  };

  if (editingLeadId) {
    const existingLead = state.leads.find((item) => item.id === editingLeadId);
    const updated = await store.updateLead({
      ...existingLead,
      ...lead,
      id: editingLeadId,
    });
    await store.createActivity({
      leadId: updated.id,
      type: "edited",
      message: `Lead updated for ${updated.company}.`,
    });
    state.selectedLeadId = updated.id;
  } else {
    const created = await store.createLead(lead);
    await store.createActivity({
      leadId: created.id,
      type: "created",
      message: `Lead created from ${created.source}.`,
    });
    await addAutomatedTask(`Follow up with ${created.name} at ${created.company}`);
    await runAutomationTrigger("new-lead", created);
    state.selectedLeadId = created.id;
  }

  leadForm.reset();
  closeLeadModal();
  setActivePage("pipeline");
  await reloadState();
}

function openLeadModal(lead = null) {
  editingLeadId = lead?.id || null;
  document.querySelector("#addLeadHeading").textContent = lead ? "Edit lead" : "Add lead";
  document.querySelector("#createLeadButton").textContent = lead ? "Save lead" : "Create lead";
  document.querySelector("#leadName").value = lead?.name || "";
  document.querySelector("#leadCompany").value = lead?.company || "";
  document.querySelector("#leadValue").value = lead?.value || 2500;
  document.querySelector("#leadStage").value = lead?.stage || "new";
  document.querySelector("#leadSource").value = lead?.source || workspaceSetupSettings().defaultSource || "Manual";
  document.querySelector("#leadNextAction").value = lead?.nextAction || "";
  document.querySelector("#leadNotes").value = lead?.notes || "";
  leadModal.hidden = false;
  document.querySelector("#leadName").focus();
}

function closeLeadModal() {
  editingLeadId = null;
  leadModal.hidden = true;
}

async function reloadState() {
  state = await store.load();
  normalizeLoadedState();
  render();
}

function filteredLeads() {
  return state.leads.filter((lead) => {
    const matchesStage = contactFilter === "all" || lead.stage === contactFilter;
    return matchesStage && contactSearchMatches(lead);
  });
}

function sortedContactLeads(leads) {
  const stageOrder = new Map(stages.map((stage, index) => [stage.id, index]));
  const sortable = [...leads];
  if (contactSort === "value-desc") {
    return sortable.sort((left, right) => right.value - left.value || left.company.localeCompare(right.company));
  }
  if (contactSort === "score-desc") {
    return sortable.sort((left, right) => right.score - left.score || left.company.localeCompare(right.company));
  }
  if (contactSort === "stage") {
    return sortable.sort(
      (left, right) =>
        (stageOrder.get(left.stage) ?? 0) - (stageOrder.get(right.stage) ?? 0) ||
        left.company.localeCompare(right.company),
    );
  }
  if (contactSort === "company") {
    return sortable.sort((left, right) => left.company.localeCompare(right.company));
  }
  return sortable;
}

function render() {
  renderWorkspaceIdentity();
  renderMetrics();
  renderDailyCommandCenter();
  renderRevenueGoal();
  renderOnboarding();
  renderInsights();
  renderSourceReport();
  renderFollowUpQueue();
  renderPipeline();
  renderLeadBrief();
  renderAISalesManagerPage();
  renderAutomations();
  renderActivityFeed();
  renderContacts();
  renderCommunicationsPage();
  renderDialWorkspace();
  renderCalendar();
  renderTasks();
  renderWorkspaceBackup();
  renderSaasAdmin();
  renderRoute();
}

function routeFromHash() {
  const requested = window.location.hash.replace("#", "");
  activePage = pageTitles[requested] ? requested : "pipeline";
}

function renderRoute() {
  document.querySelectorAll("[data-page]").forEach((section) => {
    const visible = section.dataset.page === activePage;
    section.hidden = !visible;
  });

  document.querySelectorAll("[data-page-group]").forEach((group) => {
    const pages = group.dataset.pageGroup.split(" ");
    group.hidden = !pages.includes(activePage);
  });

  renderDialView();
  renderSubpages();

  document.querySelectorAll("[data-nav-page]").forEach((link) => {
    link.classList.toggle("active", link.dataset.navPage === activePage);
  });

  document.body.dataset.activePage = activePage;
  pageTitle.textContent = pageTitles[activePage] || pageTitles.pipeline;
  applyContactPageMode();
  if (window.location.hash !== `#${activePage}`) {
    history.replaceState(null, "", `#${activePage}`);
  }
}

function setSubpage(page, subpage) {
  if (!subpageCatalog[page]?.some((item) => item.id === subpage)) return;
  subpageState[page] = subpage;
  if (page === "dial") dialView = subpage;
  if (page === "calendar") calendarView = subpage;
  if (page === "contacts") contactProfileMode = subpage === "profile";
  renderRoute();
  if (page === "dial") renderDialWorkspace();
  if (page === "calendar") renderCalendar();
}

function renderSubpages() {
  const pages = availableSubpages(activePage);
  let activeSubpage = subpageState[activePage] || pages[0]?.id;
  if (!pages.some((page) => page.id === activeSubpage)) {
    activeSubpage = pages[0]?.id;
    subpageState[activePage] = activeSubpage;
  }
  subpageNav.hidden = pages.length <= 1;
  subpageNav.innerHTML = pages
    .map(
      (page) => `
        <button class="${page.id === activeSubpage ? "active" : ""}" data-subpage-choice="${page.id}" type="button">
          ${escapeHtml(page.label)}
        </button>
      `,
    )
    .join("");

  renderPipelineSubpage(activeSubpage);
  renderAutomationSubpage(activeSubpage);
  renderContactSubpage(activeSubpage);
  renderAdminSubpage(activeSubpage);
}

function availableSubpages(page) {
  const pages = subpageCatalog[page] || [];
  if (page !== "pipeline") return pages;
  return pages.filter((subpage) => subpage.id !== "setup" || !onboardingPanel.hidden);
}

function showOnly(selectors, visibleSelector) {
  selectors.forEach((selector) => {
    document.querySelectorAll(selector).forEach((element) => {
      element.hidden = selector !== visibleSelector;
    });
  });
}

function setHidden(selector, hidden) {
  document.querySelectorAll(selector).forEach((element) => {
    element.hidden = hidden;
  });
}

function renderPipelineSubpage(activeSubpage) {
  const pipelineSelectors = {
    overview: ["#dailyCommandCenter", "#pipeline"],
    target: ["#revenueGoal"],
    setup: ["#onboardingPanel"],
    insights: ["#insightsPanel"],
    followups: ["#followUpQueue"],
    channels: ["#sourceReport"],
    brief: ['.selected-panel[data-page="pipeline"]'],
  };
  if (activePage !== "pipeline") return;
  Object.values(pipelineSelectors)
    .flat()
    .forEach((selector) => setHidden(selector, true));
  Object.entries(pipelineSelectors).forEach(([subpage, selectors]) => {
    selectors.forEach((selector) => setHidden(selector, subpage !== activeSubpage));
  });
  document.querySelector('.workspace-grid[data-page-group~="pipeline"]')?.toggleAttribute("hidden", !["overview", "brief"].includes(activeSubpage));
}

function renderAutomationSubpage(activeSubpage) {
  const selectors = [
    "#automation .automation-summary",
    "#automation .automation-actions",
    "#automationList",
    "#automation .automation-builder",
    "#automation .automation-template-section",
    "#automation .automation-run-section",
  ];
  if (activePage !== "automation") return;
  selectors.forEach((selector) => setHidden(selector, true));
  const visible = {
    overview: ["#automation .automation-summary", "#automation .automation-actions", "#automationList"],
    builder: ["#automation .automation-builder"],
    templates: ["#automation .automation-template-section"],
    runs: ["#automation .automation-run-section"],
  }[activeSubpage] || [];
  visible.forEach((selector) => setHidden(selector, false));
}

function renderContactSubpage(activeSubpage) {
  if (activePage !== "contacts") return;
  contactProfileMode = activeSubpage === "profile" && state.selectedLeadId;
  applyContactPageMode();
}

function renderAdminSubpage(activeSubpage) {
  if (activePage !== "admin") return;
  workspaceBackupPanelVisibility(activeSubpage);
  setHidden("#saasAdmin", activeSubpage === "backup");
  document.querySelectorAll("[data-admin-subpage]").forEach((card) => {
    card.hidden = card.dataset.adminSubpage !== activeSubpage;
  });
}

function workspaceBackupPanelVisibility(activeSubpage) {
  setHidden("#workspaceBackup", activeSubpage !== "backup");
}

function applyContactPageMode() {
  if (activePage !== "contacts") return;
  contactsPanel.hidden = contactProfileMode;
  contactProfilePanel.hidden = !contactProfileMode;
}

function setActivePage(page) {
  activePage = pageTitles[page] ? page : "pipeline";
  if (window.location.hash !== `#${activePage}`) {
    history.replaceState(null, "", `#${activePage}`);
  }
}

function renderOnboarding() {
  const dismissed = localStorage.getItem(onboardingDismissalKey()) === "true";
  onboardingPanel.hidden = dismissed || state.leads.length > 0;
  if (!onboardingPanel.hidden) {
    const settings = workspaceSetupSettings();
    setupBusinessName.value = settings.name;
    setupWorkspaceType.value = settings.type;
    setupSalesGoal.value = settings.goal;
  }
}

function renderWorkspaceIdentity() {
  const settings = workspaceSetupSettings();
  document.querySelector("#workspaceNameLabel").textContent = settings.name;
  document.querySelector("#workspaceModeLabel").textContent = `${settings.type} workspace - ${settings.goal}.`;
}

function renderMetrics() {
  const value = state.leads.reduce((sum, lead) => sum + lead.value, 0);
  const hotLeads = state.leads.filter((lead) => lead.score >= 80).length;
  const saved = state.automations
    .filter((automation) => automation.enabled)
    .reduce((sum, automation) => sum + automation.savedHours, 0);
  const dueToday = state.tasks.filter((task) => task.due === "today" && !task.done).length;

  document.querySelector("#pipelineValue").textContent = formatter.format(value);
  document.querySelector("#hotLeadCount").textContent = hotLeads;
  document.querySelector("#automationSaved").textContent = `${saved}h`;
  document.querySelector("#dueToday").textContent = dueToday;
}

function renderDailyCommandCenter() {
  const stats = dailyCommandStats();
  const now = new Date();

  document.querySelector("#dashboardDate").textContent = formatDashboardDate(now);
  document.querySelector("#dashboardWeather").textContent = "72°F · clear";
  document.querySelector("#dailyMessage").textContent = dailyMotivation(stats);
  document.querySelector("#todayFocusSummary").textContent = dailyFocusSummary(stats);
  document.querySelector("#dashboardFollowUpsDue").textContent = stats.followUpsDue;
  document.querySelector("#dashboardAppointmentsToday").textContent = stats.appointmentsToday.length;
  document.querySelector("#dashboardDealsAtRisk").textContent = stats.dealsAtRisk.length;
  document.querySelector("#dashboardRevenueGoal").textContent = formatter.format(stats.revenueGoal);
  document.querySelector("#dashboardProjectedRevenue").textContent = formatter.format(stats.projectedRevenue);
  document.querySelector("#dashboardClosedMonth").textContent = formatter.format(stats.closedThisMonth);
  document.querySelector("#dashboardCallsMade").textContent = stats.callsMade;
  document.querySelector("#dashboardAppointmentsBooked").textContent = stats.appointmentsBooked;
  document.querySelector("#dashboardCloseRate").textContent = `${stats.closeRate}%`;
  document.querySelector("#dashboardWinRate").textContent = `${stats.winRate}%`;

  renderDashboardFollowUpCard(stats.followUpQueue);
  renderDashboardRecommendations(stats);
  renderDashboardTimeSaved(stats);
  renderDashboardActivity(stats);
  renderDashboardSchedule(stats);
  renderFlowMode();
}

function dailyCommandStats() {
  const openLeads = state.leads.filter((lead) => lead.stage !== "won");
  const hotLeads = openLeads
    .filter((lead) => lead.score >= 80)
    .sort((left, right) => right.score - left.score || right.value - left.value);
  const tasksDueToday = state.tasks.filter((task) => task.due === "today" && !task.done);
  const followUpQueue = buildSmartFollowUpQueue();
  const followUpsDue = followUpQueue.length;
  const appointments = state.appointments || [];
  const appointmentsToday = appointments.filter((appointment) => isToday(appointment.startsAt));
  const dealsAtRisk = openLeads
    .filter((lead) => lead.score < 80 || !latestLeadActivity(lead.id))
    .sort((left, right) => left.score - right.score || right.value - left.value);
  const pipelineValue = state.leads.reduce((sum, lead) => sum + lead.value, 0);
  const closedThisMonth = state.leads
    .filter((lead) => lead.stage === "won")
    .reduce((sum, lead) => sum + lead.value, 0);
  const projectedRevenue =
    closedThisMonth +
    state.leads
      .filter((lead) => lead.stage !== "won")
      .reduce((sum, lead) => sum + weightedLeadValue(lead), 0);
  const callsMade = (state.activities || []).filter((activity) =>
    /call|dial|voicemail|text logged/i.test(`${activity.type} ${activity.message}`),
  ).length;
  const appointmentsBooked = appointments.length;
  const closeRate = callsMade ? Math.min(100, Math.round((appointmentsBooked / callsMade) * 100)) : 0;
  const winRate = state.leads.length
    ? Math.round((state.leads.filter((lead) => lead.stage === "won").length / state.leads.length) * 100)
    : 0;

  return {
    openLeads,
    hotLeads,
    tasksDueToday,
    followUpQueue,
    followUpsDue,
    appointmentsToday,
    dealsAtRisk,
    pipelineValue,
    closedThisMonth,
    projectedRevenue,
    revenueGoal: revenueTarget(),
    callsMade,
    appointmentsBooked,
    closeRate,
    winRate,
  };
}

function renderDashboardFollowUpCard(queue = buildSmartFollowUpQueue()) {
  const critical = queue.filter((item) => item.priorityLevel === "Critical").length;
  const high = queue.filter((item) => item.priorityLevel === "High").length;
  dashboardFollowUpQueueCount.textContent = queue.length;
  dashboardFollowUpUrgency.textContent = queue.length
    ? `${critical ? `${critical} critical · ` : ""}${high} high priority · ${queue[0].reason}`
    : "No follow-ups need action right now.";
  openFollowUpQueueButton.disabled = queue.length === 0;
}

function buildSmartFollowUpQueue() {
  const queueState = followUpQueueState();
  return state.leads
    .filter((lead) => lead.stage !== "won")
    .map(createSmartFollowUpItem)
    .filter(Boolean)
    .filter((item) => !isFollowUpItemSuppressed(item, queueState))
    .sort((left, right) => right.priorityScore - left.priorityScore || right.lead.value - left.lead.value);
}

function createSmartFollowUpItem(lead) {
  const intelligence = calculateLeadIntelligence(lead);
  const lastActivity = latestLeadActivity(lead.id);
  const daysQuiet = daysSinceActivity(lastActivity);
  const appointment = appointmentTomorrow(lead.id);
  const reasons = followUpReasonsForLead(lead, intelligence, lastActivity, daysQuiet, appointment);
  if (!reasons.length) return null;

  const dominant = reasons[0];
  const recommendedAction = recommendedFollowUpAction(dominant.key, lead);
  const priorityLevel = followUpPriorityLevel(dominant.weight, intelligence.score, lead.value);
  const suggestedMessage = suggestedFollowUpMessage(lead, dominant.key, appointment);

  return {
    id: `follow-up-${lead.id}`,
    lead,
    intelligence,
    reason: dominant.label,
    reasons,
    recommendedAction,
    suggestedMessage,
    priorityLevel,
    lastContactedAt: lastActivity?.createdAt || "",
    lastContactedLabel: lastActivity ? formatShortDate(lastActivity.createdAt) : "No contact logged",
    priorityScore: dominant.weight * 100 + intelligence.score + lead.value / 100,
    defaultOutcome: followUpDefaultOutcome(recommendedAction),
  };
}

function followUpReasonsForLead(lead, intelligence, lastActivity, daysQuiet, appointment) {
  const reasons = [];
  const estimateSent = lead.stage === "proposal" || /estimate|proposal|quote/i.test(`${lead.notes} ${lead.nextAction}`);

  if (!lastActivity || daysQuiet >= 3) {
    reasons.push({
      key: "no-contact",
      label: "No contact in 3+ days",
      weight: 72 + Math.min(daysQuiet, 10),
    });
  }
  if (estimateSent && lead.stage !== "won") {
    reasons.push({
      key: "estimate-follow-up",
      label: "Estimate sent but not closed",
      weight: 88,
    });
  }
  if (appointment) {
    reasons.push({
      key: "appointment-tomorrow",
      label: "Appointment tomorrow",
      weight: 94,
    });
  }
  if (leadHasMissedCallSignal(lead.id)) {
    reasons.push({
      key: "missed-call",
      label: "Missed call",
      weight: 86,
    });
  }
  if (intelligence.score >= 85 && (!lastActivity || daysQuiet >= 1)) {
    reasons.push({
      key: "hot-lead",
      label: "Hot lead not contacted",
      weight: 91,
    });
  }
  if (lead.score < 80 || daysQuiet >= 7) {
    reasons.push({
      key: "deal-at-risk",
      label: "Deal at risk",
      weight: lead.value >= 8000 ? 90 : 78,
    });
  }
  if (estimateSent && lead.score >= 80) {
    reasons.push({
      key: "opened-estimate",
      label: "Customer opened estimate placeholder",
      weight: 92,
    });
  }

  return reasons.sort((left, right) => right.weight - left.weight);
}

function recommendedFollowUpAction(reasonKey, lead) {
  const actions = {
    "appointment-tomorrow": "Send appointment confirmation",
    "estimate-follow-up": "Send estimate follow-up",
    "opened-estimate": "Call now",
    "missed-call": "Call now",
    "hot-lead": lead.score >= 90 ? "Call now" : "Send hot lead check-in",
    "deal-at-risk": "Send re-engagement message",
    "no-contact": "Send follow-up text",
  };
  return actions[reasonKey] || "Send follow-up text";
}

function followUpPriorityLevel(reasonWeight, intelligenceScore, dealValue) {
  if (reasonWeight >= 92 || intelligenceScore >= 92 || dealValue >= 12000) return "Critical";
  if (reasonWeight >= 84 || intelligenceScore >= 80) return "High";
  if (reasonWeight >= 72) return "Medium";
  return "Low";
}

function suggestedFollowUpMessage(lead, reasonKey, appointment) {
  const firstName = lead.name.split(" ")[0] || lead.name;
  const messages = {
    "appointment-tomorrow": `Hi ${firstName}, confirming tomorrow's appointment for ${lead.company}. Does the same time still work?`,
    "estimate-follow-up": `Hi ${firstName}, quick follow-up on the estimate for ${lead.company}. Any questions I can answer before we lock in the next step?`,
    "opened-estimate": `Hi ${firstName}, saw the estimate is back on your radar. Want me to walk through the numbers and timing today?`,
    "missed-call": `Hi ${firstName}, sorry I missed you. I can help with ${lead.company}'s next step whenever you have a minute.`,
    "hot-lead": `Hi ${firstName}, wanted to catch you while this is still fresh. Is today a good day to talk through next steps for ${lead.company}?`,
    "deal-at-risk": `Hi ${firstName}, checking back in on ${lead.company}. Should we keep this moving, adjust the plan, or pause it for now?`,
    "no-contact": `Hi ${firstName}, quick check-in on ${lead.company}. Are you still open to moving forward with the next step?`,
  };
  if (reasonKey === "appointment-tomorrow" && appointment?.startsAt) {
    return `Hi ${firstName}, confirming our appointment tomorrow at ${formatAppointmentTime(appointment.startsAt)} for ${lead.company}. Does that still work?`;
  }
  return messages[reasonKey] || messages["no-contact"];
}

function followUpDefaultOutcome(recommendedAction) {
  if (/call/i.test(recommendedAction)) return "call";
  if (/email/i.test(recommendedAction)) return "follow-up";
  return "text";
}

function appointmentTomorrow(leadId) {
  return (state.appointments || []).find((appointment) => appointment.leadId === leadId && isTomorrow(appointment.startsAt));
}

function leadHasMissedCallSignal(leadId) {
  return (state.activities || []).some(
    (activity) =>
      activity.leadId === leadId &&
      /missed call|no answer|voicemail|left voicemail/i.test(`${activity.type} ${activity.message}`),
  );
}

function followUpQueueState() {
  try {
    return JSON.parse(localStorage.getItem(followUpQueueStateKey()) || "{}");
  } catch (_error) {
    return {};
  }
}

function saveFollowUpQueueState(stateValue) {
  localStorage.setItem(followUpQueueStateKey(), JSON.stringify(stateValue));
}

function followUpQueueStateKey() {
  return `closepilot-follow-up-queue:${workspaceSetupSettings().name}`;
}

function isFollowUpItemSuppressed(item, queueState = followUpQueueState()) {
  const completedAt = queueState.completed?.[item.id];
  const snoozedUntil = queueState.snoozed?.[item.id];
  if (completedAt && isToday(completedAt)) return true;
  if (snoozedUntil && new Date(snoozedUntil).getTime() > Date.now()) return true;
  return false;
}

function setFollowUpItemComplete(itemId) {
  const queueState = followUpQueueState();
  queueState.completed ||= {};
  queueState.completed[itemId] = new Date().toISOString();
  saveFollowUpQueueState(queueState);
}

function snoozeFollowUpItem(itemId) {
  const queueState = followUpQueueState();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(8, 0, 0, 0);
  queueState.snoozed ||= {};
  queueState.snoozed[itemId] = tomorrow.toISOString();
  saveFollowUpQueueState(queueState);
}

function renderDashboardTimeSaved(stats) {
  const summary = calculateTimeSavedSummary(stats);
  const teamSummary = calculateTeamTimeSaved(summary);

  dashboardTimeSavedToday.textContent = formatSavedMinutes(summary.todayMinutes);
  dashboardTimeSavedWeek.textContent = formatSavedMinutes(summary.weekMinutes);
  dashboardTimeSavedMonth.textContent = formatSavedMinutes(summary.monthMinutes);
  teamTimeSavedTotal.textContent = formatSavedMinutes(teamSummary.totalMinutes);

  dashboardTimeSavedSources.innerHTML = summary.sources
    .slice(0, 5)
    .map(
      (source) => `
        <article class="time-saved-source">
          <div>
            <strong>${escapeHtml(source.label)}</strong>
            <span>${source.detail}</span>
          </div>
          <b>${formatSavedMinutes(source.minutes)}</b>
        </article>
      `,
    )
    .join("");

  teamTimeSavedContributors.innerHTML = teamSummary.contributors
    .map(
      (member) => `
        <article class="team-time-saved-row">
          <span>${escapeHtml(member.name)}</span>
          <strong>${formatSavedMinutes(member.minutes)}</strong>
        </article>
      `,
    )
    .join("");
}

function calculateTimeSavedSummary(stats = dailyCommandStats()) {
  const sourceMinutes = new Map();
  const recordedToday = recordedTimeSavedSources((activity) => isToday(activity.createdAt));
  const recordedWeek = recordedTimeSavedTotal((activity) => isWithinPastDays(activity.createdAt, 7));
  const recordedMonth = recordedTimeSavedTotal((activity) => isWithinPastDays(activity.createdAt, 30));
  const activeAutomations = state.automations.filter((automation) => automation.enabled);
  const activeTemplates = normalizedAutomationTemplates(state.automationTemplates).filter((template) => template.active);

  addSource(
    "smartPrioritization",
    Math.min(stats.openLeads.length, 5) * timeSavedRates.smartPrioritizedLead +
      Math.min(stats.hotLeads.length, 3) * timeSavedRates.smartPrioritizedLead,
  );
  addSource("aiTalkingPoints", Math.min(stats.openLeads.length, 4) * timeSavedRates.aiTalkingPointsGenerated);
  addSource(
    "automatedFollowUps",
    activeAutomations.length * 6 +
      Math.min(10, activeTemplates.reduce((sum, template) => sum + template.steps.length, 0)) *
        timeSavedRates.flowFollowUpCompleted,
  );
  addSource("fastCallLogging", stats.callsMade * timeSavedRates.quickCallLogged);
  addSource("leadIntelligence", Math.min(stats.openLeads.length, 6) * timeSavedRates.leadIntelligenceViewed);

  recordedToday.forEach((minutes, source) => addSource(source, minutes));

  const sources = [...sourceMinutes.entries()]
    .map(([source, minutes]) => ({
      source,
      label: timeSavedSourceLabels[source] || "Guided Workflow",
      minutes,
      detail: timeSavedSourceDetail(source),
    }))
    .filter((source) => source.minutes > 0)
    .sort((left, right) => right.minutes - left.minutes);
  const todayMinutes = sources.reduce((sum, source) => sum + source.minutes, 0);
  const weekMinutes = Math.max(todayMinutes, todayMinutes * 5 + Math.max(0, recordedWeek - recordedTimeSavedTotal((activity) => isToday(activity.createdAt))));
  const monthMinutes = Math.max(weekMinutes, todayMinutes * 22 + Math.max(0, recordedMonth - recordedTimeSavedTotal((activity) => isToday(activity.createdAt))));

  return {
    todayMinutes,
    weekMinutes,
    monthMinutes,
    sources,
  };

  function addSource(source, minutes) {
    sourceMinutes.set(source, (sourceMinutes.get(source) || 0) + Math.max(0, Math.round(minutes)));
  }
}

function timeSavedSourceDetail(source) {
  const details = {
    smartPrioritization: "Best leads rise to the top without manual sorting.",
    aiTalkingPoints: "Prep notes are generated before the call starts.",
    automatedFollowUps: "Tasks and follow-up steps are created automatically.",
    fastCallLogging: "Completed outreach gets logged without admin drag.",
    leadIntelligence: "Scores and reasons replace manual lead research.",
  };
  return details[source] || "Guided workflow actions are reducing admin time.";
}

function calculateTeamTimeSaved(summary) {
  const totalMinutes = summary.weekMinutes + 185;
  return {
    totalMinutes,
    contributors: [
      { name: "Cameron", minutes: Math.round(totalMinutes * 0.42) },
      { name: "Dial team", minutes: Math.round(totalMinutes * 0.34) },
      { name: "Closers", minutes: Math.round(totalMinutes * 0.24) },
    ],
  };
}

function recordedTimeSavedSources(filterFn) {
  const sources = new Map();
  (state.activities || [])
    .filter(filterFn)
    .forEach((activity) => {
      if (Array.isArray(activity.timeSavedSources)) {
        activity.timeSavedSources.forEach((source) => {
          sources.set(source.source, (sources.get(source.source) || 0) + Math.max(0, Number(source.minutes) || 0));
        });
      } else if (activity.timeSavedSource && timeSavedActivityMinutes(activity)) {
        sources.set(activity.timeSavedSource, (sources.get(activity.timeSavedSource) || 0) + timeSavedActivityMinutes(activity));
      }
    });
  return sources;
}

function recordedTimeSavedTotal(filterFn) {
  return (state.activities || [])
    .filter(filterFn)
    .reduce((sum, activity) => sum + timeSavedActivityMinutes(activity), 0);
}

function timeSavedActivityMinutes(activity) {
  return Math.max(0, Math.round(Number(activity?.savedMinutes || activity?.timeSavedMinutes || 0)));
}

function calculateFlowActionTimeSaved(action, outcome) {
  if (!action || outcome === "skip") return { minutes: 0, sources: [] };

  const sources = [
    {
      source: "smartPrioritization",
      minutes: timeSavedRates.smartPrioritizedLead,
    },
    {
      source: "aiTalkingPoints",
      minutes: timeSavedRates.aiTalkingPointsGenerated,
    },
    {
      source: "leadIntelligence",
      minutes: timeSavedRates.leadIntelligenceViewed,
    },
  ];

  if (outcome === "call") {
    sources.push({ source: "fastCallLogging", minutes: timeSavedRates.quickCallLogged });
  }
  if (["text", "follow-up", "score", "risk"].includes(outcome)) {
    sources.push({ source: "automatedFollowUps", minutes: timeSavedRates.flowFollowUpCompleted });
  }
  if (outcome === "appointment") {
    sources.push({ source: "automatedFollowUps", minutes: timeSavedRates.flowAppointmentBooked });
  }

  return {
    minutes: sources.reduce((sum, source) => sum + source.minutes, 0),
    sources,
  };
}

function renderDashboardRecommendations(stats) {
  const recommendations = dashboardRecommendationCards(stats);
  dashboardRecommendations.innerHTML = recommendations.map(renderRecommendationCard).join("");
  dashboardRecommendations.querySelectorAll("[data-dashboard-lead]").forEach((button) => {
    button.addEventListener("click", () => openDashboardLead(button.dataset.dashboardLead));
  });
}

function dashboardRecommendationCards(stats) {
  const firstCall = stats.hotLeads[0] || stats.openLeads[0];
  const likelyClose = [...stats.openLeads].sort((left, right) => weightedLeadValue(right) - weightedLeadValue(left))[0];
  const staleLead = stats.dealsAtRisk[0] || stats.openLeads.find((lead) => !latestLeadActivity(lead.id));
  const scoreLead = [...state.leads].sort((left, right) => right.score - left.score || right.value - left.value)[0];

  return [
    {
      title: "Call this homeowner first",
      lead: firstCall,
      value: firstCall ? `${firstCall.score}/100` : "No lead",
      detail: firstCall ? `${firstCall.name} at ${firstCall.company}` : "Pull or import leads to build today's call list.",
    },
    {
      title: "This estimate is likely to close",
      lead: likelyClose,
      value: likelyClose ? formatter.format(weightedLeadValue(likelyClose)) : "$0",
      detail: likelyClose ? `${stageLabel(likelyClose.stage)} deal with ${Math.round((stageProbabilities[likelyClose.stage] || 0) * 100)}% odds.` : "No open estimates yet.",
    },
    {
      title: "This customer hasn't been contacted",
      lead: staleLead,
      value: staleLead ? stageLabel(staleLead.stage) : "Clear",
      detail: staleLead ? staleLead.nextAction : "Every open lead has a recent touch.",
    },
    {
      title: "This lead score increased",
      lead: scoreLead,
      value: scoreLead ? `+${Math.max(1, Math.round(scoreLead.score / 12))}` : "+0",
      detail: scoreLead ? `${scoreLead.company} is showing the strongest buying signal.` : "Scores will appear once leads are active.",
    },
  ];
}

function renderRecommendationCard(recommendation, index) {
  const content = `
    <span>0${index + 1}</span>
    <strong>${escapeHtml(recommendation.title)}</strong>
    <b>${escapeHtml(recommendation.value)}</b>
    <p>${escapeHtml(recommendation.detail)}</p>
  `;

  if (!recommendation.lead) {
    return `<article class="ai-card">${content}</article>`;
  }

  return `
    <button class="ai-card" data-dashboard-lead="${recommendation.lead.id}" type="button">
      ${content}
    </button>
  `;
}

function renderDashboardActivity() {
  const activities = [...(state.activities || [])]
    .sort((left, right) => activityTime(right) - activityTime(left))
    .slice(0, 5);

  if (!activities.length) {
    dashboardActivityFeed.innerHTML = "<p class=\"empty-state\">No team activity yet.</p>";
    return;
  }

  dashboardActivityFeed.innerHTML = activities
    .map((activity) => {
      const lead = state.leads.find((item) => item.id === activity.leadId);
      return `
        <article class="dashboard-feed-item">
          <span>${formatActivityDate(activity.createdAt)}</span>
          <strong>${escapeHtml(activity.message)}</strong>
          ${renderTimeSavedActivityBadge(activity)}
          <p>${escapeHtml(lead?.company || "Workspace update")}</p>
        </article>
      `;
    })
    .join("");
}

function renderDashboardSchedule(stats) {
  const appointmentRows = stats.appointmentsToday.map((appointment) => {
    const lead = state.leads.find((item) => item.id === appointment.leadId);
    return {
      time: formatAppointmentTime(appointment.startsAt),
      title: lead?.company || appointment.leadName || "Appointment",
      detail: `${appointment.contactName || "Customer"} · ${appointment.assignedTo || "Unassigned"}`,
    };
  });
  const taskRows = stats.tasksDueToday.slice(0, Math.max(0, 5 - appointmentRows.length)).map((task, index) => ({
    time: `${9 + index}:00`,
    title: task.text,
    detail: "Focus block",
  }));
  const rows = [...appointmentRows, ...taskRows];

  if (!rows.length) {
    dashboardSchedule.innerHTML = "<p class=\"empty-state\">No scheduled work today.</p>";
    return;
  }

  dashboardSchedule.innerHTML = rows
    .map(
      (row) => `
        <article class="dashboard-schedule-item">
          <time>${escapeHtml(row.time)}</time>
          <div>
            <strong>${escapeHtml(row.title)}</strong>
            <span>${escapeHtml(row.detail)}</span>
          </div>
        </article>
      `,
    )
    .join("");
}

function dailyMotivation(stats) {
  if (stats.appointmentsToday.length) return "Protect the calendar. Every booked slot is a closeable moment.";
  if (stats.hotLeads.length) return "Speed wins today. Start with the warmest lead before the window cools.";
  if (stats.tasksDueToday.length) return "Clear the open loops. Momentum comes from clean follow-through.";
  return "Quiet board, clear head. Build tomorrow's pipeline before noon.";
}

function dailyFocusSummary(stats) {
  const lead = stats.hotLeads[0] || stats.openLeads[0];
  if (!lead) return "No open leads yet. Add a lead or pull a fresh batch to start the day.";
  return `Start with ${lead.name} at ${lead.company}, then clear ${stats.tasksDueToday.length} due ${stats.tasksDueToday.length === 1 ? "task" : "tasks"}.`;
}

function startMyDay() {
  const actions = buildPriorityFlowActions();
  flowSession = createFlowSession(actions);
  flowSession.active = true;
  state.selectedLeadId = actions[0]?.leadId || state.selectedLeadId;
  subpageState.pipeline = "overview";
  setActivePage("pipeline");
  render();
  flowModePanel.scrollIntoView({ behavior: "smooth", block: "start" });
}

function createFlowSession(actions = []) {
  return {
    active: false,
    actions,
    currentIndex: 0,
    pendingOutcome: "",
    status: "",
    savingsStatus: "",
    results: {
      calls: 0,
      followUps: 0,
      appointments: 0,
      skipped: 0,
      completed: 0,
      timeSaved: 0,
      lastSaved: 0,
      revenueInfluenced: 0,
      influencedLeadIds: [],
    },
  };
}

function renderFlowMode() {
  flowModePanel.hidden = !flowSession.active;
  if (!flowSession.active) return;

  const isComplete = flowSession.currentIndex >= flowSession.actions.length || flowSession.actions.length === 0;
  flowCallsCompleted.textContent = flowSession.results.calls;
  flowFollowUpsCompleted.textContent = flowSession.results.followUps;
  flowAppointmentsBooked.textContent = flowSession.results.appointments;
  flowTimeSavedToday.textContent = formatSavedMinutes(flowSession.results.timeSaved);
  flowActiveStep.hidden = isComplete;
  flowActionButtons.hidden = isComplete;
  flowCompletionState.hidden = !isComplete;

  if (isComplete) {
    renderFlowCompletion();
    return;
  }

  const action = currentFlowAction();
  flowProgressLabel.textContent = `${flowSession.currentIndex + 1} of ${flowSession.actions.length} priority actions`;
  flowActionTitle.textContent = action.title;
  flowActionWhy.textContent = action.why;
  flowTalkingPoints.innerHTML = action.talkingPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join("");
  flowLeadDetails.innerHTML = renderFlowLeadDetails(action);
  flowActionStatus.textContent =
    flowSession.status || `${action.recommendedOutcomeLabel} is recommended. Choose an action, then complete it when done.`;
  flowTimeSavedMessage.textContent =
    flowSession.savingsStatus || "Estimated time saved will update as you complete guided actions.";

  document.querySelectorAll("[data-flow-outcome]").forEach((button) => {
    button.classList.toggle("active", button.dataset.flowOutcome === flowSession.pendingOutcome);
  });
}

function renderFlowCompletion() {
  const total = flowSession.actions.length;
  flowProgressLabel.textContent = `${total} of ${total} priority actions`;
  flowTimeSavedToday.textContent = formatSavedMinutes(flowSession.results.timeSaved);
  flowTimeSavedMessage.textContent =
    flowSession.results.timeSaved > 0
      ? `${formatSavedMinutes(flowSession.results.timeSaved)} estimated time saved today.`
      : "No time saved tracked in this run yet.";
  flowCompletionSummary.textContent =
    total > 0
      ? `You cleared ${flowSession.results.completed} priority actions and skipped ${flowSession.results.skipped}.`
      : "No priority actions are open right now. Add fresh leads or tasks to build the next flow.";
  flowCompletionResults.innerHTML = `
    <article>
      <span>Calls completed</span>
      <strong>${flowSession.results.calls}</strong>
    </article>
    <article>
      <span>Follow-ups completed</span>
      <strong>${flowSession.results.followUps}</strong>
    </article>
    <article>
      <span>Appointments booked</span>
      <strong>${flowSession.results.appointments}</strong>
    </article>
    <article>
      <span>Total estimated time saved</span>
      <strong>${formatSavedMinutes(flowSession.results.timeSaved)}</strong>
    </article>
    <article>
      <span>Estimated revenue influenced</span>
      <strong>${formatter.format(flowSession.results.revenueInfluenced)}</strong>
    </article>
    <article>
      <span>Skipped</span>
      <strong>${flowSession.results.skipped}</strong>
    </article>
  `;
  flowActionStatus.textContent = "Mission Complete";
}

function currentFlowAction() {
  return flowSession.actions[flowSession.currentIndex];
}

function selectFlowOutcome(outcome) {
  if (!flowSession.active || !currentFlowAction()) return;
  if (outcome === "skip") {
    completeFlowAction("skip");
    return;
  }

  flowSession.pendingOutcome = outcome;
  flowSession.status = `${flowOutcomeLabel(outcome)} selected. Finish the step, then press Complete & Next.`;
  renderFlowMode();
}

async function completeCurrentFlowAction() {
  if (!flowSession.active || !currentFlowAction()) return;
  await completeFlowAction(flowSession.pendingOutcome || currentFlowAction().defaultOutcome);
}

async function completeFlowAction(outcome) {
  const action = currentFlowAction();
  if (!action) return;

  if (outcome === "skip") {
    flowSession.results.skipped += 1;
    flowSession.status = `Skipped ${action.lead.name}. Moving to the next best action.`;
    flowSession.savingsStatus = "No new time saved added for skipped actions.";
  } else {
    const savings = calculateFlowActionTimeSaved(action, outcome);
    flowSession.results.completed += 1;
    flowSession.results.lastSaved = savings.minutes;
    flowSession.results.timeSaved += savings.minutes;
    trackFlowRevenueInfluence(action);
    incrementFlowResult(outcome);
    if (action.followUpItem) setFollowUpItemComplete(action.followUpItem.id);
    await logFlowCompletion(action, outcome, savings);
    if (outcome === "appointment") {
      await bookFlowAppointment(action);
    }
    flowSession.status = `${flowOutcomeLabel(outcome)} completed for ${action.lead.name}.`;
    flowSession.savingsStatus = `+${formatSavedMinutes(savings.minutes)} saved • ${formatSavedMinutes(
      flowSession.results.timeSaved,
    )} saved today.`;
  }

  flowSession.currentIndex += 1;
  flowSession.pendingOutcome = "";
  const nextAction = currentFlowAction();
  if (nextAction) state.selectedLeadId = nextAction.leadId;
  render();
}

function incrementFlowResult(outcome) {
  if (outcome === "call") flowSession.results.calls += 1;
  if (outcome === "appointment") flowSession.results.appointments += 1;
  if (["text", "follow-up", "score", "risk"].includes(outcome)) flowSession.results.followUps += 1;
}

function trackFlowRevenueInfluence(action) {
  if (flowSession.results.influencedLeadIds.includes(action.leadId)) return;
  flowSession.results.influencedLeadIds.push(action.leadId);
  flowSession.results.revenueInfluenced += Math.round(weightedLeadValue(action.lead));
}

async function logFlowCompletion(action, outcome, savings) {
  await store.createActivity({
    leadId: action.leadId,
    type: `flow-${outcome}`,
    message: `Flow Mode ${flowOutcomeLabel(outcome).toLowerCase()} - ${action.title}.`,
    savedMinutes: savings.minutes,
    timeSavedSource: "guidedWorkflow",
    timeSavedSources: savings.sources,
  });
}

async function bookFlowAppointment(action) {
  const assignedTo = nextRoundRobinCloser().email;
  await store.createAppointment({
    leadId: action.leadId,
    leadName: action.lead.company,
    contactName: action.lead.name,
    assignedTo,
    startsAt: flowAppointmentStartsAt().toISOString(),
    notes: `Booked from Flow Mode: ${action.title}`,
    outcome: "Appointment set",
  });
}

function flowAppointmentStartsAt() {
  const date = new Date();
  date.setHours(Math.min(20, date.getHours() + 2), 0, 0, 0);
  return date;
}

function buildPriorityFlowActions() {
  const openLeads = state.leads.filter((lead) => lead.stage !== "won");
  const leads = openLeads.length ? openLeads : state.leads;
  const followUpActions = buildSmartFollowUpQueue().map(createFollowUpFlowAction);
  const actions = [
    ...followUpActions,
    ...leads.flatMap((lead) => flowActionProfiles().map((profile) => createFlowAction(lead, profile))),
  ];

  return actions
    .sort((left, right) => right.priorityScore - left.priorityScore || right.lead.score - left.lead.score)
    .slice(0, 18);
}

function createFollowUpFlowAction(item) {
  return {
    id: `flow-${item.id}`,
    leadId: item.lead.id,
    lead: item.lead,
    type: "smart-follow-up",
    defaultOutcome: item.defaultOutcome,
    recommendedOutcomeLabel: item.recommendedAction,
    priorityScore: 12000 + item.priorityScore,
    title: `Follow up with ${item.lead.name}`,
    why: `Follow-up reason: ${item.reason}. ${item.recommendedAction} is recommended so this deal does not sit untouched today.`,
    talkingPoints: [
      item.suggestedMessage,
      `Lead score is ${item.intelligence.score}/100 (${item.intelligence.label}).`,
      `Reference the reason: ${item.reason.toLowerCase()}.`,
      "Ask for the next concrete step before ending the conversation.",
    ],
    intelligence: item.intelligence,
    dueToday: true,
    daysQuiet: daysSinceActivity(latestLeadActivity(item.lead.id)),
    appointmentUrgency: item.reason === "Appointment tomorrow" ? 100 : 0,
    followUpItem: item,
  };
}

function flowActionProfiles() {
  return [
    {
      key: "call",
      defaultOutcome: "call",
      label: "Call Lead",
      weight: 80,
      title: (lead) => `Call ${lead.name} first`,
      why: (lead) => `${lead.company} is a ${lead.score}/100 lead with an open next step. A fast call protects the buying window.`,
    },
    {
      key: "follow-up",
      defaultOutcome: "follow-up",
      label: "Mark Followed Up",
      weight: 72,
      title: (lead) => `Complete today's follow-up for ${lead.company}`,
      why: (lead) => `This account has work due today. Clearing it keeps the deal from going quiet.`,
    },
    {
      key: "text",
      defaultOutcome: "text",
      label: "Send Text",
      weight: 58,
      title: (lead) => `Send ${lead.name} a short text`,
      why: (lead) => `A concise text gives ${lead.name} an easy way to respond before the next call block.`,
    },
    {
      key: "appointment",
      defaultOutcome: "appointment",
      label: "Book Appointment",
      weight: 42,
      title: (lead) => `Book the next appointment for ${lead.company}`,
      why: (lead) => `A calendar hold turns interest into a committed next step and gives the closer a clean handoff.`,
    },
    {
      key: "risk",
      defaultOutcome: "risk",
      label: "Mark Followed Up",
      weight: 34,
      title: (lead) => `Rescue the at-risk deal with ${lead.name}`,
      why: (lead) => `This deal needs a fresh touch based on score, stage, or contact recency.`,
    },
    {
      key: "score",
      defaultOutcome: "score",
      label: "Mark Followed Up",
      weight: 24,
      title: (lead) => `Review the score jump for ${lead.company}`,
      why: (lead) => `Lead score changes are buying signals. Confirm the signal before it cools off.`,
    },
  ];
}

function createFlowAction(lead, profile) {
  const dueToday = leadHasTaskDueToday(lead);
  const lastActivity = latestLeadActivity(lead.id);
  const daysQuiet = daysSinceActivity(lastActivity);
  const appointmentUrgency = profile.key === "appointment" ? leadAppointmentUrgency(lead) : 0;
  const intelligence = calculateLeadIntelligence(lead);
  const priorityScore =
    intelligence.score * 100 +
    lead.value / 500 +
    (dueToday ? 140 : 0) +
    Math.min(daysQuiet, 30) * 2 +
    appointmentUrgency +
    profile.weight;

  return {
    id: `${lead.id}-${profile.key}`,
    leadId: lead.id,
    lead,
    type: profile.key,
    defaultOutcome: profile.defaultOutcome,
    recommendedOutcomeLabel: profile.label,
    priorityScore,
    title: profile.title(lead),
    why: `${profile.why(lead)} Intelligence says ${intelligence.recommendedAction.toLowerCase()} because ${
      intelligence.factors[0]?.label.toLowerCase() || "this lead has active sales signals"
    }.`,
    talkingPoints: flowTalkingPointsFor(lead, profile.key, dueToday, daysQuiet, intelligence),
    intelligence,
    dueToday,
    daysQuiet,
    appointmentUrgency,
  };
}

function leadHasTaskDueToday(lead) {
  return leadTasks(lead).some((task) => task.due === "today" && !task.done);
}

function leadAppointmentUrgency(lead) {
  const appointment = (state.appointments || []).find((item) => item.leadId === lead.id);
  if (appointment && isToday(appointment.startsAt)) return 120;
  if (lead.stage === "proposal") return 20;
  if (lead.stage === "qualified") return 10;
  return 0;
}

function daysSinceActivity(activity) {
  if (!activity?.createdAt) return 30;
  const elapsed = Date.now() - new Date(activity.createdAt).getTime();
  if (!Number.isFinite(elapsed)) return 30;
  return Math.max(0, Math.floor(elapsed / 86400000));
}

function flowTalkingPointsFor(lead, type, dueToday, daysQuiet, intelligence = calculateLeadIntelligence(lead)) {
  const points = [
    `${intelligence.recommendedAction}: open with the reason for the touch - ${lead.nextAction}`,
    `Anchor the value: ${formatter.format(lead.value)} potential deal in ${stageLabel(lead.stage)}.`,
    `Lead Intelligence is ${intelligence.score}/100 (${intelligence.label}); mention ${
      intelligence.factors[0]?.label.toLowerCase() || "the strongest buying signal"
    }.`,
    "Ask for the next concrete step before ending the conversation.",
  ];

  if (type === "text") {
    points[0] = `Text opener: "Hi ${lead.name}, quick follow-up on ${lead.company}. Is today still good to talk next steps?"`;
  }
  if (type === "appointment") {
    points[0] = `Offer two appointment windows and confirm who needs to be on the call.`;
  }
  if (type === "risk") {
    points.push(`It has been ${daysQuiet} days since the last logged touch, so keep the message direct.`);
  }
  if (dueToday) {
    points.push("There is a due-today follow-up tied to this account.");
  }

  return points.slice(0, 4);
}

function renderFlowLeadDetails(action) {
  const details = dialLeadDetails(action.lead);
  const lastActivity = latestLeadActivity(action.leadId);
  const dueTasks = leadTasks(action.lead).filter((task) => task.due === "today" && !task.done);
  const intelligence = action.intelligence || calculateLeadIntelligence(action.lead);

  return `
    <div class="flow-lead-hero">
      <div>
        <span>${escapeHtml(stageLabel(action.lead.stage))}</span>
        <strong>${escapeHtml(action.lead.company)}</strong>
        <p>${escapeHtml(action.lead.name)}</p>
      </div>
      ${leadIntelligenceBadge(action.lead, "flow-badge")}
    </div>
    <section class="flow-intelligence-summary">
      <div>
        <span>Lead Intelligence Score</span>
        <strong>${intelligence.score}/100</strong>
        <small>${escapeHtml(intelligence.label)}</small>
      </div>
      <div>
        <span>Recommended action</span>
        <strong>${escapeHtml(intelligence.recommendedAction)}</strong>
        <small>Based on score factors</small>
      </div>
      <ul aria-label="Top score factors">
        ${intelligence.factors.slice(0, 3).map((factor) => `<li>${escapeHtml(factor.label)}</li>`).join("")}
      </ul>
    </section>
    <div class="flow-lead-grid">
      <article>
        <span>Deal value</span>
        <strong>${formatter.format(action.lead.value)}</strong>
      </article>
      <article>
        <span>Last contact</span>
        <strong>${lastActivity ? formatShortDate(lastActivity.createdAt) : "No touch"}</strong>
      </article>
      <article>
        <span>Due today</span>
        <strong>${dueTasks.length}</strong>
      </article>
      <article>
        <span>Phone</span>
        <strong>${escapeHtml(details.phone || "Not logged")}</strong>
      </article>
    </div>
    <div class="flow-score-breakdown">
      <p class="eyebrow">Top score factors</p>
      <ul>
        ${intelligence.factors.slice(0, 3).map(renderScoreFactor).join("")}
      </ul>
    </div>
    <p>${escapeHtml(action.lead.notes || "No notes yet.")}</p>
  `;
}

function flowOutcomeLabel(outcome) {
  const labels = {
    call: "Call Lead",
    text: "Send Text",
    appointment: "Book Appointment",
    "follow-up": "Mark Followed Up",
    risk: "Mark Followed Up",
    score: "Mark Followed Up",
    skip: "Skip",
  };
  return labels[outcome] || "Complete";
}

function primaryDashboardLead() {
  const stats = dailyCommandStats();
  return stats.hotLeads[0] || stats.openLeads[0] || null;
}

function openFollowUpQueue() {
  setActivePage("pipeline");
  subpageState.pipeline = "followups";
  render();
  document.querySelector("#followUpQueue")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function openDashboardLead(leadId) {
  if (!leadId) return;
  state.selectedLeadId = leadId;
  subpageState.pipeline = "brief";
  setActivePage("pipeline");
  render();
}

function renderRevenueGoal() {
  const target = revenueTarget();
  const wonValue = state.leads
    .filter((lead) => lead.stage === "won")
    .reduce((sum, lead) => sum + lead.value, 0);
  const openWeighted = state.leads
    .filter((lead) => lead.stage !== "won")
    .reduce((sum, lead) => sum + weightedLeadValue(lead), 0);
  const projected = wonValue + openWeighted;
  const remaining = Math.max(0, target - wonValue);
  const wonProgress = target ? Math.min(100, Math.round((wonValue / target) * 100)) : 0;
  const projectedProgress = target ? Math.min(100, Math.round((projected / target) * 100)) : 0;

  revenueTargetInput.value = target;
  revenueProgressBar.style.width = `${projectedProgress}%`;
  revenueProgressBar.dataset.progress = `${projectedProgress}%`;
  revenueGoalSummary.innerHTML = `
    <article>
      <span>Closed</span>
      <strong>${formatter.format(wonValue)}</strong>
      <small>${wonProgress}% booked</small>
    </article>
    <article>
      <span>Projected</span>
      <strong>${formatter.format(projected)}</strong>
      <small>${projectedProgress}% weighted</small>
    </article>
    <article>
      <span>Gap</span>
      <strong>${formatter.format(remaining)}</strong>
      <small>${formatter.format(target)} target</small>
    </article>
  `;
}

function renderWorkspaceBackup() {
  backupSummary.innerHTML = `
    <article>
      <span>Leads</span>
      <strong>${state.leads.length}</strong>
    </article>
    <article>
      <span>Tasks</span>
      <strong>${state.tasks.length}</strong>
    </article>
    <article>
      <span>Activity</span>
      <strong>${(state.activities || []).length}</strong>
    </article>
    <article>
      <span>Automations</span>
      <strong>${state.automations.length}</strong>
    </article>
  `;
}

function renderSaasAdmin() {
  const account = accountState();
  const settings = workspaceSetupSettings();
  const subscription = account.subscription;
  const plan = planCatalog[subscription.plan] || planCatalog.starter;
  const activeMembers = account.members.filter((member) => member.status === "active");
  const pendingInvites = account.invites.filter((invite) => invite.status === "pending");
  const usedSeats = activeMembers.length + pendingInvites.length;

  adminBusinessName.value = settings.name;
  adminWorkspaceType.value = settings.type;
  adminSalesGoal.value = settings.goal;
  adminOwnerEmail.value = settings.ownerEmail;
  adminIndustry.value = settings.industry;
  adminTimezone.value = settings.timezone;
  adminDefaultSource.value = settings.defaultSource;
  subscriptionStatus.textContent = `${plan.label} ${subscription.status === "trialing" ? "trial" : "plan"}`;

  workspaceProfileSummary.innerHTML = `
    <article>
      <span>Owner</span>
      <strong>${escapeHtml(settings.ownerEmail)}</strong>
    </article>
    <article>
      <span>Industry</span>
      <strong>${escapeHtml(settings.industry)}</strong>
    </article>
    <article>
      <span>Time zone</span>
      <strong>${escapeHtml(timezoneLabel(settings.timezone))}</strong>
    </article>
    <article>
      <span>Default source</span>
      <strong>${escapeHtml(settings.defaultSource)}</strong>
    </article>
  `;

  planSummary.innerHTML = `
    <article>
      <span>Plan</span>
      <strong>${plan.label}</strong>
      <small>${formatter.format(plan.price)}/mo</small>
    </article>
    <article>
      <span>Seats</span>
      <strong>${usedSeats}/${subscription.seatLimit}</strong>
      <small>${pendingInvites.length} pending</small>
    </article>
    <article>
      <span>Trial ends</span>
      <strong>${formatShortDate(subscription.trialEndsAt)}</strong>
      <small>${plan.detail}</small>
    </article>
    <article class="plan-addon-summary">
      <span>App add-ons</span>
      <strong>${formatter.format(plan.price + extensionCatalog[2].price)}/mo</strong>
      <small>CRM + both apps estimate</small>
    </article>
  `;

  const extensionPricing = extensionCatalog
    .map((extension) => `${escapeHtml(extension.label)} ${formatter.format(extension.price)}/mo`)
    .join(" · ");

  planAddonList.innerHTML = extensionPricing;

  document.querySelectorAll("[data-plan-choice]").forEach((button) => {
    const planId = button.dataset.planChoice;
    const option = planCatalog[planId];
    button.classList.toggle("active", planId === subscription.plan);
    button.textContent = `${option.label} ${formatter.format(option.price)}/mo`;
  });

  teamSummary.innerHTML = `
    <article>
      <span>Active members</span>
      <strong>${activeMembers.length}</strong>
    </article>
    <article>
      <span>Pending invites</span>
      <strong>${pendingInvites.length}</strong>
    </article>
    <article>
      <span>Seats left</span>
      <strong>${Math.max(0, subscription.seatLimit - usedSeats)}</strong>
    </article>
  `;

  teamList.innerHTML = [
    ...activeMembers.map(renderTeamMember),
    ...pendingInvites.map(renderTeamInvite),
  ].join("");

  teamList.querySelectorAll("[data-send-invite]").forEach((button) => {
    button.addEventListener("click", () => sendInviteEmail(button.dataset.sendInvite));
  });

  launchChecklist.innerHTML = launchChecks().map(renderLaunchCheck).join("");
  auditList.innerHTML = account.auditEvents.length
    ? account.auditEvents
        .slice(0, 6)
        .map(
          (event) => `
            <article class="audit-row">
              <div>
                <strong>${escapeHtml(event.action)}</strong>
                <span>${escapeHtml(event.detail)}</span>
              </div>
              <time>${formatShortDate(event.createdAt)}</time>
            </article>
          `,
        )
        .join("")
    : "<p class=\"empty-state\">No admin activity yet.</p>";
}

function renderTeamMember(member) {
  return `
    <article class="team-row">
      <div>
        <strong>${escapeHtml(member.email)}</strong>
        <span>${escapeHtml(member.role)} · active</span>
      </div>
      <span class="status-pill">Member</span>
    </article>
  `;
}

function renderTeamInvite(invite) {
  return `
    <article class="team-row">
      <div>
        <strong>${escapeHtml(invite.email)}</strong>
        <span>${escapeHtml(invite.role)} · invited ${formatShortDate(invite.createdAt)}</span>
      </div>
      <button class="secondary-button" data-send-invite="${invite.id}" type="button">Send email</button>
    </article>
  `;
}

function renderLaunchCheck(check) {
  return `
    <article class="launch-check ${check.ready ? "ready" : ""}">
      <span>${check.ready ? "Ready" : "Setup"}</span>
      <div>
        <strong>${escapeHtml(check.title)}</strong>
        <small>${escapeHtml(check.detail)}</small>
      </div>
    </article>
  `;
}

function launchChecks() {
  return [
    {
      title: "Cloud database",
      detail: hasSupabaseConfig ? "Supabase is configured." : "Add SUPABASE_URL and SUPABASE_ANON_KEY.",
      ready: hasSupabaseConfig,
    },
    {
      title: "Stripe checkout",
      detail: config.stripeCheckoutUrl ? "Checkout URL is configured." : "Add STRIPE_CHECKOUT_URL.",
      ready: Boolean(config.stripeCheckoutUrl),
    },
    {
      title: "Billing portal",
      detail: config.stripePortalUrl ? "Customer portal URL is configured." : "Add STRIPE_PORTAL_URL.",
      ready: Boolean(config.stripePortalUrl),
    },
    {
      title: "Support inbox",
      detail: config.supportEmail ? `${config.supportEmail} is set.` : "Add SUPPORT_EMAIL.",
      ready: Boolean(config.supportEmail),
    },
  ];
}

function renderInsights() {
  if (!state.leads.length) {
    insightList.innerHTML = "<p class=\"empty-state\">Add leads to unlock pipeline insights.</p>";
    return;
  }

  const sourceInsight = sourcePerformanceInsight();
  const hotLead = [...state.leads].sort((left, right) => right.score - left.score)[0];
  const atRiskLead = [...state.leads]
    .filter((lead) => lead.stage !== "won")
    .sort((left, right) => left.score - right.score || right.value - left.value)[0];
  const weighted = state.leads.reduce((sum, lead) => sum + weightedLeadValue(lead), 0);
  const total = state.leads.reduce((sum, lead) => sum + lead.value, 0);
  const gap = Math.max(0, total - weighted);

  insightList.innerHTML = `
    ${renderInsightCard({
      eyebrow: "Best source",
      title: sourceInsight.source,
      value: formatter.format(sourceInsight.value),
      detail: `${sourceInsight.count} ${sourceInsight.count === 1 ? "deal" : "deals"} in pipeline`,
      leadId: sourceInsight.lead?.id,
    })}
    ${renderInsightCard({
      eyebrow: "Hot focus",
      title: hotLead.company,
      value: `${hotLead.score}/100`,
      detail: `${stageLabel(hotLead.stage)} - ${formatter.format(hotLead.value)}`,
      leadId: hotLead.id,
    })}
    ${renderInsightCard({
      eyebrow: "Needs attention",
      title: atRiskLead.company,
      value: `${atRiskLead.score}/100`,
      detail: atRiskLead.nextAction,
      leadId: atRiskLead.id,
    })}
    ${renderInsightCard({
      eyebrow: "Forecast gap",
      title: formatter.format(gap),
      value: `${total ? Math.round((weighted / total) * 100) : 0}% weighted`,
      detail: "Unweighted revenue still needs conversion work",
    })}
  `;

  insightList.querySelectorAll("[data-insight-lead]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedLeadId = button.dataset.insightLead;
      setActivePage("pipeline");
      render();
    });
  });
}

function renderInsightCard(insight) {
  const content = `
    <span>${escapeHtml(insight.eyebrow)}</span>
    <strong>${escapeHtml(insight.title)}</strong>
    <b>${escapeHtml(insight.value)}</b>
    <p>${escapeHtml(insight.detail)}</p>
  `;

  if (!insight.leadId) {
    return `<article class="insight-card">${content}</article>`;
  }

  return `
    <button class="insight-card" data-insight-lead="${insight.leadId}" type="button">
      ${content}
    </button>
  `;
}

function sourcePerformanceInsight() {
  const sourceMap = new Map();
  state.leads.forEach((lead) => {
    const current = sourceMap.get(lead.source) || { source: lead.source, value: 0, count: 0, lead: lead };
    current.value += lead.value;
    current.count += 1;
    if (lead.value > current.lead.value) current.lead = lead;
    sourceMap.set(lead.source, current);
  });

  return [...sourceMap.values()].sort((left, right) => right.value - left.value || right.count - left.count)[0];
}

function renderSourceReport() {
  const rows = sourcePerformanceRows();
  exportSourceReportButton.disabled = rows.length === 0;

  if (!rows.length) {
    sourceReportGrid.innerHTML = "<p class=\"empty-state\">Add leads to compare sources.</p>";
    return;
  }

  sourceReportGrid.innerHTML = rows
    .map(
      (row) => `
        <article class="source-card">
          <button class="source-card-main" data-source-lead="${row.topLead.id}" type="button">
            <span>${escapeHtml(row.source)}</span>
            <strong>${formatter.format(row.value)}</strong>
            <small>${row.count} ${row.count === 1 ? "lead" : "leads"} · ${formatter.format(row.weighted)} weighted</small>
          </button>
          <div class="source-card-meta">
            <span>Avg score <strong>${row.averageScore}</strong></span>
            <span>Top lead <strong>${escapeHtml(row.topLead.company)}</strong></span>
          </div>
        </article>
      `,
    )
    .join("");

  sourceReportGrid.querySelectorAll("[data-source-lead]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedLeadId = button.dataset.sourceLead;
      setActivePage("pipeline");
      render();
    });
  });
}

function renderFollowUpQueue() {
  const items = buildSmartFollowUpQueue();
  const critical = items.filter((item) => item.priorityLevel === "Critical").length;
  const high = items.filter((item) => item.priorityLevel === "High").length;

  followUpQueueSummary.innerHTML = `
    <article>
      <span>Due today</span>
      <strong>${items.length}</strong>
    </article>
    <article>
      <span>Critical</span>
      <strong>${critical}</strong>
    </article>
    <article>
      <span>High priority</span>
      <strong>${high}</strong>
    </article>
  `;

  if (!items.length) {
    followUpQueueList.innerHTML = "<p class=\"empty-state\">No smart follow-ups are due right now.</p>";
    followUpQueueMessage.textContent = "Queue is clear.";
    return;
  }

  followUpQueueList.innerHTML = items.map(renderFollowUpQueueItem).join("");
  followUpQueueMessage.textContent = `${items.length} ${items.length === 1 ? "follow-up needs" : "follow-ups need"} action today.`;

  followUpQueueList.querySelectorAll("[data-follow-up-action]").forEach((button) => {
    button.addEventListener("click", async () => {
      await handleFollowUpQueueAction(button.dataset.followUpAction, button.dataset.followUpItem);
    });
  });
}

function renderFollowUpQueueItem(item) {
  return `
    <article class="follow-up-item ${item.priorityLevel.toLowerCase()}">
      <div class="follow-up-item-main">
        <div>
          <span class="priority-pill ${item.priorityLevel.toLowerCase()}">${escapeHtml(item.priorityLevel)}</span>
          <h3>${escapeHtml(item.lead.name)}</h3>
          <p>${escapeHtml(item.lead.company)} · ${formatter.format(item.lead.value)}</p>
        </div>
        ${leadIntelligenceBadge(item.lead, "follow-up-score")}
      </div>
      <div class="follow-up-item-grid">
        <article>
          <span>Last contacted</span>
          <strong>${escapeHtml(item.lastContactedLabel)}</strong>
        </article>
        <article>
          <span>Follow-up reason</span>
          <strong>${escapeHtml(item.reason)}</strong>
        </article>
        <article>
          <span>Recommended action</span>
          <strong>${escapeHtml(item.recommendedAction)}</strong>
        </article>
        <article>
          <span>Lead score</span>
          <strong>${item.intelligence.score}/100 ${escapeHtml(item.intelligence.label)}</strong>
        </article>
      </div>
      <div class="follow-up-reasons" aria-label="Follow-up reasons">
        ${item.reasons.map((reason) => `<span>${escapeHtml(reason.label)}</span>`).join("")}
      </div>
      <section class="suggested-message" aria-label="Suggested message">
        <span>Suggested message</span>
        <p>${escapeHtml(item.suggestedMessage)}</p>
      </section>
      <div class="follow-up-actions">
        <button class="secondary-button" data-follow-up-action="text" data-follow-up-item="${item.id}" type="button">Send Text</button>
        <button class="secondary-button" data-follow-up-action="email" data-follow-up-item="${item.id}" type="button">Send Email</button>
        <button class="primary-button" data-follow-up-action="complete" data-follow-up-item="${item.id}" type="button">Mark Complete</button>
        <button class="secondary-button" data-follow-up-action="snooze" data-follow-up-item="${item.id}" type="button">Snooze</button>
        <button class="secondary-button" data-follow-up-action="call" data-follow-up-item="${item.id}" type="button">Call Now</button>
        <button class="secondary-button" data-follow-up-action="open" data-follow-up-item="${item.id}" type="button">Open Lead</button>
      </div>
    </article>
  `;
}

async function handleFollowUpQueueAction(actionType, itemId) {
  const item = buildSmartFollowUpQueue().find((queueItem) => queueItem.id === itemId);
  if (!item) {
    followUpQueueMessage.textContent = "That follow-up is no longer due.";
    renderFollowUpQueue();
    return;
  }

  if (actionType === "open") {
    state.selectedLeadId = item.lead.id;
    subpageState.pipeline = "brief";
    setActivePage("pipeline");
    render();
    return;
  }

  if (actionType === "snooze") {
    snoozeFollowUpItem(item.id);
    await store.createActivity({
      leadId: item.lead.id,
      type: "follow-up-snoozed",
      message: `Smart follow-up snoozed - ${item.reason}.`,
    });
    const status = `${item.lead.name} snoozed until tomorrow.`;
    await reloadState();
    followUpQueueMessage.textContent = status;
    return;
  }

  const completed = ["complete", "text", "email", "call"].includes(actionType);
  const activityLabels = {
    complete: "marked complete",
    text: "text sent",
    email: "email sent",
    call: "call started",
  };
  const savedMinutes = timeSavedRates.flowFollowUpCompleted + timeSavedRates.aiTalkingPointsGenerated;
  await store.createActivity({
    leadId: item.lead.id,
    type: `smart-follow-up-${actionType}`,
    message: `Smart follow-up ${activityLabels[actionType]} - ${item.reason}.`,
    savedMinutes,
    timeSavedSource: "automatedFollowUps",
    timeSavedSources: [
      { source: "automatedFollowUps", minutes: timeSavedRates.flowFollowUpCompleted },
      { source: "aiTalkingPoints", minutes: timeSavedRates.aiTalkingPointsGenerated },
    ],
  });

  if (completed) setFollowUpItemComplete(item.id);
  const status = `${item.lead.name} follow-up ${activityLabels[actionType]}. +${formatSavedMinutes(savedMinutes)} saved.`;
  await reloadState();
  followUpQueueMessage.textContent = status;
}

function sourcePerformanceRows() {
  const sourceMap = new Map();
  state.leads.forEach((lead) => {
    const source = lead.source || "Unknown";
    const current = sourceMap.get(source) || {
      source,
      count: 0,
      value: 0,
      weighted: 0,
      scoreTotal: 0,
      topLead: lead,
    };
    current.count += 1;
    current.value += lead.value;
    current.weighted += weightedLeadValue(lead);
    current.scoreTotal += lead.score;
    if (lead.value > current.topLead.value) current.topLead = lead;
    sourceMap.set(source, current);
  });

  return [...sourceMap.values()]
    .map((row) => ({
      ...row,
      averageScore: Math.round(row.scoreTotal / row.count),
    }))
    .sort((left, right) => right.value - left.value || right.weighted - left.weighted || left.source.localeCompare(right.source));
}

function renderPipeline() {
  const leads = filteredLeads();
  renderPipelineHealth(leads);
  document.querySelectorAll("[data-pipeline-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.pipelineView === pipelineView);
  });

  if (pipelineView === "forecast") {
    renderForecast(leads);
    return;
  }

  board.innerHTML = stages
    .map((stage) => {
      const stageLeads = leads.filter((lead) => lead.stage === stage.id);
      const stageValue = stageLeads.reduce((sum, lead) => sum + lead.value, 0);
      const cards = stageLeads.map(renderDealCard).join("");
      return `
        <div class="stage-column" data-stage="${stage.id}">
          <div class="stage-heading">
            <div>
              <strong>${stage.label}</strong>
              <span class="stage-value">${formatter.format(stageValue)} · ${Math.round(stageProbabilities[stage.id] * 100)}% close odds</span>
            </div>
            <span class="count-pill">${stageLeads.length}</span>
          </div>
          ${cards || "<p class=\"empty-state\">No leads yet</p>"}
        </div>
      `;
    })
    .join("");

  board.querySelectorAll("[data-select-lead]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedLeadId = button.dataset.selectLead;
      setActivePage("pipeline");
      render();
    });
  });

  board.querySelectorAll("[data-move]").forEach((button) => {
    button.addEventListener("click", () => {
      moveLead(button.dataset.leadId, Number(button.dataset.move));
    });
  });
}

function renderPipelineHealth(leads) {
  const openLeads = leads.filter((lead) => lead.stage !== "won");
  const wonLeads = leads.filter((lead) => lead.stage === "won");
  const openValue = openLeads.reduce((sum, lead) => sum + lead.value, 0);
  const wonValue = wonLeads.reduce((sum, lead) => sum + lead.value, 0);
  const weightedOpen = openLeads.reduce((sum, lead) => sum + weightedLeadValue(lead), 0);
  const totalValue = openValue + wonValue;
  const closeMix = totalValue ? Math.round((wonValue / totalValue) * 100) : 0;

  pipelineHealth.innerHTML = `
    <article>
      <span>Open value</span>
      <strong>${formatter.format(openValue)}</strong>
    </article>
    <article>
      <span>Weighted open</span>
      <strong>${formatter.format(weightedOpen)}</strong>
    </article>
    <article>
      <span>Won value</span>
      <strong>${formatter.format(wonValue)}</strong>
    </article>
    <article>
      <span>Close mix</span>
      <strong>${closeMix}%</strong>
    </article>
  `;
}

function renderForecast(leads) {
  const totalValue = leads.reduce((sum, lead) => sum + lead.value, 0);
  const weightedValue = leads.reduce((sum, lead) => sum + weightedLeadValue(lead), 0);
  const closeRate = totalValue ? Math.round((weightedValue / totalValue) * 100) : 0;
  const bestLead = [...leads].sort((left, right) => weightedLeadValue(right) - weightedLeadValue(left))[0];

  board.innerHTML = `
    <div class="forecast-view">
      <div class="forecast-summary">
        <article>
          <span>Weighted forecast</span>
          <strong>${formatter.format(weightedValue)}</strong>
        </article>
        <article>
          <span>Open pipeline</span>
          <strong>${formatter.format(totalValue)}</strong>
        </article>
        <article>
          <span>Projected close</span>
          <strong>${closeRate}%</strong>
        </article>
        <article>
          <span>Best next deal</span>
          <strong>${bestLead ? escapeHtml(bestLead.company) : "No leads"}</strong>
        </article>
      </div>
      <div class="forecast-table">
        ${stages.map((stage) => renderForecastRow(stage, leads)).join("")}
      </div>
    </div>
  `;

  board.querySelectorAll("[data-select-lead]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedLeadId = button.dataset.selectLead;
      setActivePage("pipeline");
      render();
    });
  });
}

function renderForecastRow(stage, leads) {
  const stageLeads = leads.filter((lead) => lead.stage === stage.id);
  const stageValue = stageLeads.reduce((sum, lead) => sum + lead.value, 0);
  const weightedValue = stageLeads.reduce((sum, lead) => sum + weightedLeadValue(lead), 0);
  const probability = Math.round(stageProbabilities[stage.id] * 100);
  const topLead = [...stageLeads].sort((left, right) => weightedLeadValue(right) - weightedLeadValue(left))[0];

  return `
    <article class="forecast-row">
      <div>
        <strong>${stage.label}</strong>
        <span>${stageLeads.length} ${stageLeads.length === 1 ? "deal" : "deals"}</span>
      </div>
      <div>
        <span>Value</span>
        <strong>${formatter.format(stageValue)}</strong>
      </div>
      <div>
        <span>Weighted</span>
        <strong>${formatter.format(weightedValue)}</strong>
      </div>
      <div>
        <span>Close odds</span>
        <strong>${probability}%</strong>
      </div>
      ${
        topLead
          ? `<button class="secondary-button" data-select-lead="${topLead.id}" type="button">${escapeHtml(topLead.company)}</button>`
          : "<span class=\"empty-state\">No deal</span>"
      }
    </article>
  `;
}

function renderDealCard(lead) {
  const active = lead.id === state.selectedLeadId ? " active" : "";
  return `
    <article class="deal-card${active}">
      <button class="deal-summary" data-select-lead="${lead.id}" type="button">
        <strong>${escapeHtml(lead.company)}</strong>
        <span>${escapeHtml(lead.name)}</span>
        <div class="deal-meta">
          <b>${formatter.format(lead.value)}</b>
          ${leadIntelligenceBadge(lead, "compact")}
        </div>
      </button>
      <div class="card-actions">
        <button data-move="-1" data-lead-id="${lead.id}" type="button">Back</button>
        <button data-move="1" data-lead-id="${lead.id}" type="button">Next</button>
      </div>
    </article>
  `;
}

async function moveLead(leadId, direction) {
  const lead = state.leads.find((item) => item.id === leadId);
  if (!lead) return;

  state.selectedLeadId = lead.id;
  setActivePage("pipeline");
  await applyStageMove(lead, direction);
  await reloadState();
}

async function applyStageMove(lead, direction) {
  const index = stages.findIndex((stage) => stage.id === lead.stage);
  const nextStage = stages[Math.min(stages.length - 1, Math.max(0, index + direction))];
  if (lead.stage === nextStage.id) return;

  const updatedLead = {
    ...lead,
    stage: nextStage.id,
    score: Math.min(99, Math.max(0, lead.score + (direction > 0 ? 4 : -2))),
  };

  await store.updateLead(updatedLead);
  await store.createActivity({
    leadId: lead.id,
    type: "stage",
    message: `Stage changed to ${nextStage.label}.`,
  });
  await addAutomatedTask(`Follow up with ${lead.name} after moving to ${nextStage.label}`);
  await runAutomationTrigger(triggerForStage(nextStage.id), updatedLead);
}

function renderLeadBrief() {
  const lead = state.leads.find((item) => item.id === state.selectedLeadId) || state.leads[0];
  if (!lead) {
    leadBrief.innerHTML = "<p>No lead selected.</p>";
    return;
  }
  const intelligence = calculateLeadIntelligence(lead);

  leadBrief.innerHTML = `
    <div>
      <h3>${escapeHtml(lead.company)}</h3>
      <p>${escapeHtml(lead.name)} · ${stageLabel(lead.stage)} · ${escapeHtml(lead.source)}</p>
    </div>
    <div class="brief-grid">
      <div><span>Value</span><strong>${formatter.format(lead.value)}</strong></div>
      <div><span>Lead Intelligence</span><strong>${intelligence.score}/100</strong></div>
      <div><span>Score label</span><strong>${escapeHtml(intelligence.label)}</strong></div>
      <div><span>Recommended</span><strong>${escapeHtml(intelligence.recommendedAction)}</strong></div>
    </div>
    ${renderLeadIntelligencePanel(lead, "compact")}
    <div class="brief-actions">
      <button class="primary-button" data-follow-up-lead="${lead.id}" type="button">Add follow-up</button>
      <button class="secondary-button" data-open-lead-detail="${lead.id}" type="button">Open details</button>
      <button class="secondary-button" data-sequence-lead="${lead.id}" type="button">Start sequence</button>
      <button class="secondary-button" data-outcome-lead="${lead.id}" data-outcome="${lead.stage === "won" ? "reopen" : "won"}" type="button">${lead.stage === "won" ? "Reopen deal" : "Mark won"}</button>
      <button class="secondary-button" data-edit-selected-lead="${lead.id}" type="button">Edit lead</button>
      <button class="danger-button" data-delete-selected-lead="${lead.id}" type="button">Delete lead</button>
    </div>
    ${renderAssistantCard(lead, "compact")}
    ${renderSequencePreview(lead)}
    <p>${escapeHtml(lead.notes)}</p>
    <strong>${escapeHtml(lead.nextAction)}</strong>
    <div class="activity-timeline">
      <p class="eyebrow">Activity</p>
      ${renderLeadActivities(lead.id)}
    </div>
  `;

  leadBrief.querySelector("[data-follow-up-lead]")?.addEventListener("click", async () => {
    await createFollowUpFromLead(lead.id);
  });

  leadBrief.querySelector("[data-open-lead-detail]")?.addEventListener("click", () => {
    openLeadDetailModal(lead.id);
  });

  leadBrief.querySelector("[data-sequence-lead]")?.addEventListener("click", async () => {
    await startFollowUpSequence(lead.id);
  });

  leadBrief.querySelector("[data-apply-assistant]")?.addEventListener("click", async () => {
    await applyAssistantSuggestion(lead.id);
  });

  leadBrief.querySelector("[data-outcome-lead]")?.addEventListener("click", async (event) => {
    await updateLeadOutcome(lead.id, event.currentTarget.dataset.outcome);
  });

  leadBrief.querySelector("[data-edit-selected-lead]")?.addEventListener("click", () => {
    const selectedLead = state.leads.find((item) => item.id === lead.id);
    openLeadModal(selectedLead);
  });

  leadBrief.querySelector("[data-delete-selected-lead]")?.addEventListener("click", async () => {
    await deleteLead(lead.id);
  });
}

function openLeadDetailModal(leadId = state.selectedLeadId) {
  const lead = state.leads.find((item) => item.id === leadId);
  if (!lead) return;

  state.selectedLeadId = lead.id;
  renderLeadDetail(lead);
  leadDetailModal.hidden = false;
}

function closeLeadDetailModal() {
  leadDetailModal.hidden = true;
}

function renderLeadDetail(lead) {
  const intelligence = calculateLeadIntelligence(lead);
  document.querySelector("#leadDetailHeading").textContent = lead.company;
  leadDetailContent.innerHTML = `
    <div class="detail-hero">
      <div>
        <p class="eyebrow">${escapeHtml(stageLabel(lead.stage))} deal</p>
        <h3>${escapeHtml(lead.name)}</h3>
        <span>${escapeHtml(lead.company)} · ${escapeHtml(lead.source)}</span>
      </div>
      <strong>${formatter.format(lead.value)}</strong>
    </div>
    <div class="detail-grid">
      <article>
        <span>Lead Intelligence</span>
        <strong>${intelligence.score}/100</strong>
      </article>
      <article>
        <span>Score label</span>
        <strong>${escapeHtml(intelligence.label)}</strong>
      </article>
      <article>
        <span>Forecast value</span>
        <strong>${formatter.format(weightedLeadValue(lead))}</strong>
      </article>
      <article>
        <span>Close odds</span>
        <strong>${Math.round((stageProbabilities[lead.stage] || 0) * 100)}%</strong>
      </article>
    </div>
    ${renderLeadIntelligencePanel(lead)}
    <div class="detail-actions">
      <button class="primary-button" data-detail-follow-up="${lead.id}" type="button">Add follow-up</button>
      <button class="secondary-button" data-detail-sequence="${lead.id}" type="button">Start sequence</button>
      <button class="secondary-button" data-detail-outcome="${lead.id}" data-outcome="${lead.stage === "won" ? "reopen" : "won"}" type="button">${lead.stage === "won" ? "Reopen deal" : "Mark won"}</button>
      <button class="secondary-button" data-detail-edit="${lead.id}" type="button">Edit lead</button>
    </div>
    ${renderAssistantCard(lead, "detail")}
    <section class="detail-section">
      <p class="eyebrow">Next action</p>
      <strong>${escapeHtml(lead.nextAction)}</strong>
    </section>
    <section class="detail-section">
      <p class="eyebrow">Notes</p>
      <p>${escapeHtml(lead.notes)}</p>
    </section>
    <section class="detail-section">
      <p class="eyebrow">Open work</p>
      ${renderLeadTaskList(lead)}
    </section>
    <section class="detail-section">
      ${renderSequencePreview(lead)}
    </section>
    <section class="detail-section">
      <p class="eyebrow">Activity</p>
      <form class="note-form" data-note-form="${lead.id}">
        <textarea data-note-input="${lead.id}" rows="3" placeholder="Log a call, objection, or update"></textarea>
        <button class="primary-button" type="submit">Add note</button>
      </form>
      <div class="activity-timeline detail-activity">
        ${renderLeadActivities(lead.id)}
      </div>
    </section>
  `;

  leadDetailContent.querySelector("[data-detail-follow-up]")?.addEventListener("click", async () => {
    await createFollowUpFromLead(lead.id);
    renderLeadDetail(state.leads.find((item) => item.id === lead.id) || lead);
  });

  leadDetailContent.querySelector("[data-detail-sequence]")?.addEventListener("click", async () => {
    await startFollowUpSequence(lead.id);
    renderLeadDetail(state.leads.find((item) => item.id === lead.id) || lead);
  });

  leadDetailContent.querySelector("[data-apply-assistant]")?.addEventListener("click", async () => {
    await applyAssistantSuggestion(lead.id);
    renderLeadDetail(state.leads.find((item) => item.id === lead.id) || lead);
  });

  leadDetailContent.querySelector("[data-detail-outcome]")?.addEventListener("click", async (event) => {
    await updateLeadOutcome(lead.id, event.currentTarget.dataset.outcome);
    renderLeadDetail(state.leads.find((item) => item.id === lead.id) || lead);
  });

  leadDetailContent.querySelector("[data-detail-edit]")?.addEventListener("click", () => {
    closeLeadDetailModal();
    openLeadModal(lead);
  });

  leadDetailContent.querySelector("[data-note-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = leadDetailContent.querySelector(`[data-note-input="${lead.id}"]`);
    await addLeadNote(lead.id, input.value);
    renderLeadDetail(state.leads.find((item) => item.id === lead.id) || lead);
  });
}

function renderAssistantCard(lead, variant = "compact") {
  const insight = salesAssistantForLead(lead);
  const reasons = variant === "detail" ? insight.reasons : insight.reasons.slice(0, 2);
  return `
    <section class="assistant-card ${variant === "detail" ? "detail-section" : ""}">
      <div>
        <p class="eyebrow">Sales assistant</p>
        <strong>${escapeHtml(insight.title)}</strong>
      </div>
      <p>${escapeHtml(insight.action)}</p>
      <ul>
        ${reasons.map((reason) => `<li>${escapeHtml(reason)}</li>`).join("")}
      </ul>
      <button class="secondary-button" data-apply-assistant="${lead.id}" type="button">Apply suggestion</button>
    </section>
  `;
}

function renderSequencePreview(lead) {
  const steps = sequenceStepsForLead(lead);
  return `
    <div class="sequence-preview">
      <p class="eyebrow">Suggested sequence</p>
      ${steps
        .map(
          (step) => `
          <article>
            <span>${escapeHtml(step.due)}</span>
            <strong>${escapeHtml(step.text)}</strong>
          </article>
        `,
        )
        .join("")}
    </div>
  `;
}

function renderAutomations() {
  renderAutomationSummary();
  renderAutomationBuilder();
  automationList.innerHTML = state.automations
    .map((automation) => {
      const status = automation.enabled ? "on" : "off";
      return `
        <article class="automation-row">
          <div>
            <p><strong>${escapeHtml(automation.title)}</strong></p>
            <span>${escapeHtml(automation.detail)}</span>
          </div>
          <button data-toggle-auto="${automation.id}" type="button">
            <span class="status-pill ${status}">${automation.enabled ? "On" : "Off"}</span>
          </button>
        </article>
      `;
    })
    .join("");

  automationList.querySelectorAll("[data-toggle-auto]").forEach((button) => {
    button.addEventListener("click", async () => {
      const automation = state.automations.find((item) => item.id === button.dataset.toggleAuto);
      await store.updateAutomation({ ...automation, enabled: !automation.enabled });
      await reloadState();
    });
  });
}

function renderAutomationBuilder() {
  renderAutomationPreview();
  renderAutomationTemplates();
  renderAutomationRuns();
}

function renderAutomationPreview() {
  const lead = selectedLead();
  const draft = automationTemplateDraft();
  const steps = automationTemplateStepsForLead(draft, lead);
  automationPreview.innerHTML = `
    <article>
      <span>Trigger</span>
      <strong>${escapeHtml(automationTriggerLabels[draft.trigger] || draft.trigger)}</strong>
    </article>
    <div>
      ${steps.length
        ? steps
            .map(
              (step) => `
                <article>
                  <span>${escapeHtml(step.due)}</span>
                  <strong>${escapeHtml(step.text)}</strong>
                </article>
              `,
            )
            .join("")
        : "<p class=\"empty-state\">Add at least one task step to preview the sequence.</p>"}
    </div>
  `;
}

function renderAutomationTemplates() {
  const templates = normalizedAutomationTemplates(state.automationTemplates);
  if (!templates.length) {
    automationTemplateList.innerHTML = "<p class=\"empty-state\">No saved automation templates yet.</p>";
    return;
  }

  automationTemplateList.innerHTML = templates
    .map(
      (template) => `
        <article class="automation-template-card ${template.active ? "" : "paused"}">
          <div>
            <span class="status-pill ${template.active ? "on" : "off"}">${template.active ? "Active" : "Paused"}</span>
            <strong>${escapeHtml(template.name)}</strong>
            <p>${escapeHtml(automationTriggerLabels[template.trigger] || template.trigger)} · ${template.steps.length} ${template.steps.length === 1 ? "step" : "steps"}</p>
          </div>
          <ol>
            ${template.steps
              .map((step) => `<li><span>${escapeHtml(step.due)}</span>${escapeHtml(step.text)}</li>`)
              .join("")}
          </ol>
          <div class="automation-template-actions">
            <button class="secondary-button" data-edit-template="${template.id}" type="button">Edit</button>
            <button class="secondary-button" data-toggle-template="${template.id}" type="button">${template.active ? "Pause" : "Enable"}</button>
            <button class="primary-button" data-run-template="${template.id}" type="button">Run on selected lead</button>
            <button class="danger-button" data-delete-template="${template.id}" type="button">Delete</button>
          </div>
        </article>
      `,
    )
    .join("");

  automationTemplateList.querySelectorAll("[data-edit-template]").forEach((button) => {
    button.addEventListener("click", () => editAutomationTemplate(button.dataset.editTemplate));
  });

  automationTemplateList.querySelectorAll("[data-toggle-template]").forEach((button) => {
    button.addEventListener("click", () => toggleAutomationTemplate(button.dataset.toggleTemplate));
  });

  automationTemplateList.querySelectorAll("[data-run-template]").forEach((button) => {
    button.addEventListener("click", () => runAutomationTemplate(button.dataset.runTemplate));
  });

  automationTemplateList.querySelectorAll("[data-delete-template]").forEach((button) => {
    button.addEventListener("click", () => deleteAutomationTemplate(button.dataset.deleteTemplate));
  });
}

function renderAutomationRuns() {
  const runs = normalizedAutomationRuns(state.automationRuns)
    .slice()
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 8);

  if (!runs.length) {
    automationRunList.innerHTML = "<p class=\"empty-state\">Automation runs will appear here when templates fire.</p>";
    return;
  }

  automationRunList.innerHTML = runs
    .map(
      (run) => `
        <article class="automation-run-row">
          <div>
            <strong>${escapeHtml(run.templateName)}</strong>
            <span>${escapeHtml(run.leadName)} · ${escapeHtml(automationTriggerLabels[run.trigger] || run.trigger)}</span>
          </div>
          <div>
            <span>${run.stepCount} ${run.stepCount === 1 ? "task" : "tasks"}</span>
            <time>${formatShortDate(run.createdAt)}</time>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderAutomationSummary() {
  const active = state.automations.filter((automation) => automation.enabled);
  const savedHours = active.reduce((sum, automation) => sum + automation.savedHours, 0);
  const paused = state.automations.length - active.length;
  const activeTemplates = normalizedAutomationTemplates(state.automationTemplates).filter((template) => template.active);
  const runs = normalizedAutomationRuns(state.automationRuns);

  automationSummary.innerHTML = `
    <article>
      <span>Active</span>
      <strong>${active.length}/${state.automations.length}</strong>
    </article>
    <article>
      <span>Saved</span>
      <strong>${savedHours}h</strong>
    </article>
    <article>
      <span>Paused</span>
      <strong>${paused}</strong>
    </article>
    <article>
      <span>Templates</span>
      <strong>${activeTemplates.length}</strong>
    </article>
    <article>
      <span>Runs</span>
      <strong>${runs.length}</strong>
    </article>
  `;
}

async function saveAutomationTemplateFromBuilder(event) {
  event.preventDefault();
  const draft = automationTemplateDraft();
  if (!draft.name || !draft.steps.length) return;

  if (editingAutomationTemplateId) {
    await store.updateAutomationTemplate({
      ...draft,
      id: editingAutomationTemplateId,
      active: state.automationTemplates.find((template) => template.id === editingAutomationTemplateId)?.active ?? true,
    });
    automationBuilderMessage.textContent = "Automation template updated.";
  } else {
    await store.createAutomationTemplate({
      ...draft,
      active: true,
    });
    automationBuilderMessage.textContent = "Automation template saved.";
  }

  resetAutomationBuilderFields();
  await reloadState();
}

function automationTemplateDraft() {
  return {
    name: automationTemplateNameInput.value.trim(),
    trigger: automationTriggerInput.value,
    steps: [
      { due: automationStep1DueInput.value, text: automationStep1TextInput.value.trim() },
      { due: automationStep2DueInput.value, text: automationStep2TextInput.value.trim() },
      { due: automationStep3DueInput.value, text: automationStep3TextInput.value.trim() },
    ].filter((step) => step.text),
  };
}

function editAutomationTemplate(templateId) {
  const template = state.automationTemplates.find((item) => item.id === templateId);
  if (!template) return;

  editingAutomationTemplateId = template.id;
  automationTemplateNameInput.value = template.name;
  automationTriggerInput.value = template.trigger;
  [0, 1, 2].forEach((index) => {
    const step = template.steps[index] || { due: taskDueChoices[Math.min(index, taskDueChoices.length - 1)].value, text: "" };
    automationStepDueInputs()[index].value = step.due;
    automationStepTextInputs()[index].value = step.text;
  });
  automationBuilderMessage.textContent = `Editing ${template.name}.`;
  renderAutomationPreview();
  automationTemplateNameInput.focus();
}

async function toggleAutomationTemplate(templateId) {
  const template = state.automationTemplates.find((item) => item.id === templateId);
  if (!template) return;

  await store.updateAutomationTemplate({ ...template, active: !template.active });
  automationBuilderMessage.textContent = `${template.name} ${template.active ? "paused" : "enabled"}.`;
  await reloadState();
}

async function deleteAutomationTemplate(templateId) {
  const template = state.automationTemplates.find((item) => item.id === templateId);
  if (!template) return;

  await store.deleteAutomationTemplate(templateId);
  if (editingAutomationTemplateId === templateId) resetAutomationBuilderFields();
  automationBuilderMessage.textContent = `${template.name} deleted.`;
  await reloadState();
}

async function runAutomationTemplate(templateId) {
  const template = state.automationTemplates.find((item) => item.id === templateId);
  const lead = selectedLead();
  if (!template || !lead) return;

  await runAutomationTemplateForLead(template, lead, { force: true });
  setActivePage("tasks");
  await reloadState();
}

async function runAutomationTrigger(trigger, lead, options = {}) {
  if (!trigger || !lead) return [];
  const templates = normalizedAutomationTemplates(state.automationTemplates).filter(
    (template) => template.active && template.trigger === trigger,
  );

  const runs = [];
  for (const template of templates) {
    const run = await runAutomationTemplateForLead(template, lead, options);
    if (run) runs.push(run);
  }
  return runs;
}

async function runAutomationTemplateForLead(template, lead, options = {}) {
  const normalized = normalizedAutomationTemplate(template);
  if (!options.force && automationRunExists(normalized.id, lead.id, normalized.trigger)) return null;

  const steps = automationTemplateStepsForLead(normalized, lead);
  if (!steps.length) return null;

  await Promise.all(
    steps.map((step) =>
      store.createTask({
        text: step.text,
        done: false,
        due: step.due,
      }),
    ),
  );
  await store.createActivity({
    leadId: lead.id,
    type: "automation",
    message: `${normalized.name} automation ran and created ${steps.length} ${steps.length === 1 ? "task" : "tasks"}.`,
  });
  const run = await store.createAutomationRun({
    templateId: normalized.id,
    templateName: normalized.name,
    trigger: normalized.trigger,
    leadId: lead.id,
    leadName: lead.company,
    stepCount: steps.length,
  });
  state.selectedLeadId = lead.id;
  return run;
}

function automationRunExists(templateId, leadId, trigger) {
  return normalizedAutomationRuns(state.automationRuns).some(
    (run) => run.templateId === templateId && run.leadId === leadId && run.trigger === trigger,
  );
}

async function runNoResponseScan() {
  const openLeads = state.leads.filter((lead) => lead.stage !== "won");
  const runs = [];
  for (const lead of openLeads) {
    const leadRuns = await runAutomationTrigger("no-response", lead);
    runs.push(...leadRuns);
  }

  automationBuilderMessage.textContent = runs.length
    ? `No-response scan queued ${runs.reduce((sum, run) => sum + run.stepCount, 0)} tasks for ${runs.length} ${runs.length === 1 ? "lead" : "leads"}.`
    : "No-response scan is already up to date.";
  await reloadState();
}

function resetAutomationBuilder() {
  resetAutomationBuilderFields();
  automationBuilderMessage.textContent = "Ready for a new automation template.";
  renderAutomationPreview();
}

function resetAutomationBuilderFields() {
  editingAutomationTemplateId = null;
  automationTemplateNameInput.value = "Proposal rescue sequence";
  automationTriggerInput.value = "stage-proposal";
  automationStep1DueInput.value = "today";
  automationStep1TextInput.value = "Send {{company}} a short proposal recap.";
  automationStep2DueInput.value = "tomorrow";
  automationStep2TextInput.value = "Ask {{name}} for blockers and decision timing.";
  automationStep3DueInput.value = "in 3 days";
  automationStep3TextInput.value = "Book a close-plan review with {{name}}.";
}

function automationTemplateStepsForLead(template, lead = selectedLead()) {
  return normalizedAutomationTemplate(template).steps.map((step) => ({
    due: step.due,
    text: personalizeAutomationText(step.text, lead),
  }));
}

function personalizeAutomationText(text, lead = selectedLead()) {
  if (!lead) return text;
  return text
    .replaceAll("{{name}}", lead.name)
    .replaceAll("{{company}}", lead.company)
    .replaceAll("{{stage}}", stageLabel(lead.stage))
    .replaceAll("{{nextAction}}", lead.nextAction);
}

function automationStepDueInputs() {
  return [automationStep1DueInput, automationStep2DueInput, automationStep3DueInput];
}

function automationStepTextInputs() {
  return [automationStep1TextInput, automationStep2TextInput, automationStep3TextInput];
}

function selectedLead() {
  return state.leads.find((item) => item.id === state.selectedLeadId) || state.leads[0] || null;
}

function triggerForStage(stageId) {
  const triggers = {
    qualified: "stage-qualified",
    proposal: "stage-proposal",
  };
  return triggers[stageId] || null;
}

async function enableAllAutomations() {
  const disabled = state.automations.filter((automation) => !automation.enabled);
  if (!disabled.length) return;

  await Promise.all(disabled.map((automation) => store.updateAutomation({ ...automation, enabled: true })));
  await reloadState();
}

async function resetAutomationsToDefaults() {
  const defaultsByKey = new Map(defaultAutomations.map((automation) => [automation.key, automation]));
  await Promise.all(
    state.automations.map((automation) => {
      const defaults = defaultsByKey.get(automation.key);
      return store.updateAutomation({
        ...automation,
        enabled: defaults ? defaults.enabled : automation.enabled,
      });
    }),
  );
  await reloadState();
}

function renderLeadActivities(leadId) {
  const activities = (state.activities || [])
    .filter((activity) => activity.leadId === leadId)
    .sort((left, right) => activityTime(right) - activityTime(left))
    .slice(0, 5);

  if (!activities.length) {
    return "<p>No activity yet.</p>";
  }

  return activities
    .map(
      (activity) => `
      <article>
        <strong>${escapeHtml(activity.message)}</strong>
        <span>${formatActivityDate(activity.createdAt)}</span>
        ${renderTimeSavedActivityBadge(activity)}
      </article>
    `,
    )
    .join("");
}

function latestLeadActivity(leadId) {
  return (state.activities || [])
    .filter((activity) => activity.leadId === leadId)
    .sort((left, right) => activityTime(right) - activityTime(left))[0];
}

function leadTasks(lead) {
  const company = lead.company.toLowerCase();
  const name = lead.name.toLowerCase();
  return state.tasks.filter((task) => {
    const text = task.text.toLowerCase();
    return text.includes(company) || text.includes(name);
  });
}

function calculateLeadIntelligence(lead, context = leadIntelligenceContext(lead)) {
  const factors = [];
  const input = leadScoringInput(lead, context);
  let score = Math.round((input.engagementLevel || 0) * 42) + 24;

  if (input.status === "won") addFactor("Closed deal", 10, "Account is already won and ready for expansion follow-up.");
  if (input.status === "proposal") addFactor("Proposal stage", 10, "Proposal-stage deals usually need fast objection handling.");
  if (input.status === "qualified") addFactor("Hot lead status", 12, "Qualified lead with enough context for a direct sales touch.");
  if (input.followUpDueAt === "today") addFactor("Follow-up due today", 14, "There is open work tied to this lead today.");
  if (input.dealValue >= 10000) addFactor("High estimated deal value", 13, `${formatter.format(input.dealValue)} estimated deal value.`);
  else if (input.dealValue >= 7500) addFactor("Meaningful deal value", 9, `${formatter.format(input.dealValue)} estimated deal value.`);
  if (input.appointmentAt && isWithinDays(input.appointmentAt, 2)) addFactor("Appointment scheduled soon", 15, "There is an appointment window coming up soon.");
  if (input.lastContactedAt && daysSinceDate(input.lastContactedAt) <= 3) addFactor("Recent contact activity", 8, "The lead has been touched recently.");
  if (!input.lastContactedAt || daysSinceDate(input.lastContactedAt) >= 7) {
    addFactor("Long time since last contact", -7, "This lead needs a fresh touch before it cools off.");
  }
  if (input.estimateSent) addFactor("Estimate sent", 8, "The buyer has a concrete offer to react to.");
  if (input.customerOpenedEstimate) addFactor("Customer opened estimate placeholder", 6, "Mock engagement signal suggests buying interest.");
  if (input.referralSignal) addFactor("Neighbor/customer referral placeholder", 5, "Referral-style sources tend to convert with warmer outreach.");

  score += factors.reduce((sum, factor) => sum + factor.impact, 0);
  score = clampScore(score);

  return {
    score,
    label: intelligenceLabel(score),
    factors: factors.sort((left, right) => Math.abs(right.impact) - Math.abs(left.impact)),
    recommendedAction: recommendedLeadAction(score, input),
    input,
  };

  function addFactor(label, impact, detail) {
    factors.push({ label, impact, detail });
  }
}

function leadIntelligenceContext(lead) {
  const lastActivity = latestLeadActivity(lead.id);
  const tasks = leadTasks(lead);
  const appointment = upcomingLeadAppointment(lead.id);
  return {
    lastActivity,
    tasks,
    appointment,
  };
}

function leadScoringInput(lead, context) {
  const dueToday = context.tasks.some((task) => task.due === "today" && !task.done);
  const source = String(lead.source || "");
  const notes = String(lead.notes || "");
  const estimateSent = lead.stage === "proposal" || /estimate|proposal|quote/i.test(`${notes} ${lead.nextAction}`);
  const engagementLevel = Math.max(0, Math.min(1, Number(lead.score || 0) / 100));

  return {
    status: lead.stage,
    dealValue: Number(lead.value || 0),
    lastContactedAt: context.lastActivity?.createdAt || "",
    followUpDueAt: dueToday ? "today" : "",
    appointmentAt: context.appointment?.startsAt || "",
    estimateSent,
    source,
    engagementLevel,
    customerOpenedEstimate: estimateSent && lead.score >= 80,
    referralSignal: /referral|neighbor|customer/i.test(source),
  };
}

function recommendedLeadAction(score, input) {
  if (score >= 90 && input.followUpDueAt === "today") return "Call now";
  if (input.appointmentAt && isWithinDays(input.appointmentAt, 2)) return "Book appointment";
  if (input.status === "qualified" && !input.appointmentAt) return "Book appointment";
  if (input.status === "proposal" || input.estimateSent) return "Send follow-up text";
  if (input.status === "new" && input.dealValue >= 7000) return "Send estimate";
  if (score < 40) return "Nurture later";
  return "Send follow-up text";
}

function intelligenceLabel(score) {
  if (score >= 90) return "Hot";
  if (score >= 70) return "Warm";
  if (score >= 40) return "Nurture";
  return "Cold";
}

function leadIntelligenceBadge(lead, className = "") {
  const intelligence = calculateLeadIntelligence(lead);
  return `
    <span class="intelligence-badge ${intelligence.label.toLowerCase()} ${className}" aria-label="Lead Intelligence ${intelligence.score} ${intelligence.label}">
      <strong>${intelligence.score}</strong>
      <span>${intelligence.label}</span>
    </span>
  `;
}

function renderLeadIntelligencePanel(lead, variant = "full") {
  const intelligence = calculateLeadIntelligence(lead);
  const factors = intelligence.factors.slice(0, variant === "compact" ? 3 : 5);
  return `
    <section class="lead-intelligence-panel ${variant}">
      <div class="lead-intelligence-header">
        <div>
          <p class="eyebrow">Lead intelligence</p>
          <h3>${intelligence.score}/100 <span>${escapeHtml(intelligence.label)}</span></h3>
        </div>
        <div class="lead-intelligence-action">
          <span>Recommended action</span>
          <strong>${escapeHtml(intelligence.recommendedAction)}</strong>
        </div>
      </div>
      <div class="score-breakdown">
        <p class="eyebrow">Why this score?</p>
        ${factors.length ? `<ul>${factors.map(renderScoreFactor).join("")}</ul>` : "<p>No score factors yet.</p>"}
      </div>
    </section>
  `;
}

function renderScoreFactor(factor) {
  const sign = factor.impact >= 0 ? "+" : "";
  return `
    <li>
      <span>${escapeHtml(factor.label)}</span>
      <strong>${sign}${factor.impact}</strong>
      <small>${escapeHtml(factor.detail)}</small>
    </li>
  `;
}

function upcomingLeadAppointment(leadId) {
  return [...(state.appointments || [])]
    .filter((appointment) => appointment.leadId === leadId)
    .sort((left, right) => String(left.startsAt).localeCompare(String(right.startsAt)))[0];
}

function daysSinceDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 30;
  return Math.max(0, Math.floor((Date.now() - date.getTime()) / 86400000));
}

function isWithinDays(value, days) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const distance = date.getTime() - Date.now();
  return distance >= -86400000 && distance <= days * 86400000;
}

function renderLeadTaskList(lead) {
  const tasks = leadTasks(lead).slice(0, 5);
  if (!tasks.length) {
    return "<p class=\"empty-state\">No linked tasks yet.</p>";
  }

  return `
    <div class="linked-task-list">
      ${tasks
        .map(
          (task) => `
            <article class="${task.done ? "done" : ""}">
              <strong>${escapeHtml(task.text)}</strong>
              <span>${task.done ? "Done" : task.due}</span>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderActivityFeed() {
  const activities = visibleActivities();

  document.querySelectorAll("[data-activity-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.activityFilter === activityFilter);
  });
  activitySummary.textContent = `${activities.length} ${activities.length === 1 ? "activity" : "activities"} shown`;
  exportVisibleActivityButton.disabled = activities.length === 0;

  if (!activities.length) {
    activityFeed.innerHTML = "<p class=\"empty-state\">No activity yet.</p>";
    return;
  }

  activityFeed.innerHTML = activities
    .map((activity) => {
      const lead = state.leads.find((item) => item.id === activity.leadId);
      const company = lead?.company || "Archived lead";
      return `
        <article class="activity-feed-item">
          <div>
            <span>${escapeHtml(company)}</span>
            <strong>${escapeHtml(activity.message)}</strong>
            ${renderTimeSavedActivityBadge(activity)}
            <time>${formatActivityDate(activity.createdAt)}</time>
          </div>
          ${lead ? `<button class="secondary-button" data-activity-lead="${lead.id}" type="button">View</button>` : ""}
        </article>
      `;
    })
    .join("");

  activityFeed.querySelectorAll("[data-activity-lead]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedLeadId = button.dataset.activityLead;
      setActivePage("pipeline");
      render();
    });
  });
}

function visibleActivities() {
  return (state.activities || [])
    .filter((activity) => (activityFilter === "all" || activity.type === activityFilter) && activityMatchesSearch(activity))
    .slice()
    .sort((left, right) => activityTime(right) - activityTime(left))
    .slice(0, 8);
}

function activityMatchesSearch(activity) {
  const query = activitySearchInput.value.trim().toLowerCase();
  if (!query) return true;

  const lead = state.leads.find((item) => item.id === activity.leadId);
  const company = lead?.company || "Archived lead";
  return [activity.message, activity.type, company].some((field) =>
    String(field || "").toLowerCase().includes(query),
  );
}

function exportVisibleActivityCsv() {
  const activities = visibleActivities();
  if (!activities.length) return;

  const headers = ["company", "type", "message", "createdAt"];
  const rows = activities.map((activity) => {
    const lead = state.leads.find((item) => item.id === activity.leadId);
    const company = lead?.company || "Archived lead";
    return [company, activity.type, activity.message, activity.createdAt]
      .map(csvEscape)
      .join(",");
  });
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "closepilot-visible-activity.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function renderContacts() {
  const filtered = filteredLeads();
  const leads = sortedContactLeads(filtered);
  renderContactFilterCounts();
  document.querySelectorAll("[data-contact-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.contactFilter === contactFilter);
  });
  contactSortInput.value = contactSort;
  renderContactSummary(filtered);
  syncSelectedContacts(leads);
  updateBulkContactTaskButton();
  renderContactProfile(leads);

  contactTable.innerHTML = leads.length
    ? leads
      .map(
        (lead) => `
      <article class="contact-row ${lead.id === state.selectedLeadId ? "active" : ""}" data-contact-row="${lead.id}">
        <label class="contact-select">
          <input data-contact-checkbox="${lead.id}" type="checkbox" ${selectedContactIds.has(lead.id) ? "checked" : ""} aria-label="Select ${escapeHtml(lead.company)}" />
        </label>
        <p><strong>${escapeHtml(lead.name)}</strong><span>${escapeHtml(lead.company)}</span></p>
        <p>${escapeHtml(lead.source)}</p>
        <p>${stageLabel(lead.stage)}</p>
        <p>${leadIntelligenceBadge(lead, "contact-score")}</p>
        <p>${formatter.format(lead.value)}</p>
        <div class="contact-actions">
          <button class="secondary-button" data-contact-profile="${lead.id}" type="button">Profile</button>
          <button class="secondary-button" data-contact-select="${lead.id}" type="button">View</button>
          <button class="secondary-button" data-contact-task="${lead.id}" type="button">Task</button>
          <button class="secondary-button" data-contact-outcome="${lead.id}" data-outcome="${lead.stage === "won" ? "reopen" : "won"}" type="button">${lead.stage === "won" ? "Reopen" : "Won"}</button>
          <button class="secondary-button" data-contact-next="${lead.id}" type="button">Next stage</button>
          <button class="primary-button" data-contact-detail="${lead.id}" type="button">Details</button>
        </div>
      </article>
    `,
      )
      .join("")
    : "<p class=\"empty-state\">No contacts in this view.</p>";

  contactTable.querySelectorAll("[data-contact-checkbox]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selectedContactIds.add(checkbox.dataset.contactCheckbox);
      } else {
        selectedContactIds.delete(checkbox.dataset.contactCheckbox);
      }
      updateBulkContactTaskButton();
    });
  });

  contactTable.querySelectorAll("[data-contact-profile]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedLeadId = button.dataset.contactProfile;
      contactProfileMode = true;
      subpageState.contacts = "profile";
      renderContacts();
      renderRoute();
    });
  });

  contactTable.querySelectorAll("[data-contact-select]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedLeadId = button.dataset.contactSelect;
      setActivePage("pipeline");
      render();
    });
  });

  contactTable.querySelectorAll("[data-contact-detail]").forEach((button) => {
    button.addEventListener("click", () => {
      openLeadDetailModal(button.dataset.contactDetail);
    });
  });

  contactTable.querySelectorAll("[data-contact-task]").forEach((button) => {
    button.addEventListener("click", async () => {
      await createFollowUpFromLead(button.dataset.contactTask);
    });
  });

  contactTable.querySelectorAll("[data-contact-outcome]").forEach((button) => {
    button.addEventListener("click", async () => {
      await updateLeadOutcome(button.dataset.contactOutcome, button.dataset.outcome);
    });
  });

  contactTable.querySelectorAll("[data-contact-next]").forEach((button) => {
    button.addEventListener("click", async () => {
      await moveLead(button.dataset.contactNext, 1);
    });
  });
}

function renderContactProfile(leads) {
  const lead =
    leads.find((item) => item.id === state.selectedLeadId) ||
    leads[0] ||
    state.leads.find((item) => item.id === state.selectedLeadId);

  if (!lead) {
    contactProfileContent.innerHTML = "<p class=\"empty-state\">Add or import contacts to build an account profile.</p>";
    return;
  }

  const tasks = leadTasks(lead);
  const openTasks = tasks.filter((task) => !task.done);
  const lastActivity = latestLeadActivity(lead.id);
  const intelligence = calculateLeadIntelligence(lead);

  contactProfileContent.innerHTML = `
    <div class="contact-profile-hero">
      <div>
        <p class="eyebrow">${escapeHtml(stageLabel(lead.stage))} account</p>
        <h3>${escapeHtml(lead.company)}</h3>
        <span>${escapeHtml(lead.name)} · ${escapeHtml(lead.source)}</span>
      </div>
      <strong>${formatter.format(lead.value)}</strong>
    </div>
    <div class="contact-profile-stats">
      <article>
        <span>Intelligence</span>
        <strong>${intelligence.score}/100</strong>
      </article>
      <article>
        <span>Label</span>
        <strong>${escapeHtml(intelligence.label)}</strong>
      </article>
      <article>
        <span>Open tasks</span>
        <strong>${openTasks.length}</strong>
      </article>
      <article>
        <span>Weighted</span>
        <strong>${formatter.format(weightedLeadValue(lead))}</strong>
      </article>
      <article>
        <span>Last touch</span>
        <strong>${lastActivity ? formatShortDate(lastActivity.createdAt) : "None"}</strong>
      </article>
    </div>
    ${renderLeadIntelligencePanel(lead, "compact")}
    <form class="contact-next-form" data-contact-next-form="${lead.id}">
      <label>
        Next action
        <input data-contact-next-input="${lead.id}" type="text" value="${escapeHtml(lead.nextAction)}" required />
      </label>
      <button class="secondary-button" type="submit">Save next action</button>
    </form>
    <form class="note-form contact-note-form" data-contact-note-form="${lead.id}">
      <textarea data-contact-note-input="${lead.id}" rows="3" placeholder="Log a call, objection, or update"></textarea>
      <button class="primary-button" type="submit">Log note</button>
    </form>
    <div class="contact-profile-actions">
      <button class="secondary-button" data-profile-pipeline="${lead.id}" type="button">Open pipeline</button>
      <button class="secondary-button" data-profile-detail="${lead.id}" type="button">Open details</button>
      <button class="primary-button" data-profile-task="${lead.id}" type="button">Add follow-up</button>
    </div>
    <section class="contact-profile-section">
      <p class="eyebrow">Open work</p>
      ${renderLeadTaskList(lead)}
    </section>
    <section class="contact-profile-section">
      <p class="eyebrow">Timeline</p>
      <div class="activity-timeline contact-profile-timeline">
        ${renderLeadActivities(lead.id)}
      </div>
    </section>
    <p class="profile-message" id="contactProfileMessage" role="status"></p>
  `;

  contactProfileContent.querySelector("[data-contact-next-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = contactProfileContent.querySelector(`[data-contact-next-input="${lead.id}"]`);
    await updateLeadNextAction(lead.id, input.value);
  });

  contactProfileContent.querySelector("[data-contact-note-form]")?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const input = contactProfileContent.querySelector(`[data-contact-note-input="${lead.id}"]`);
    await addLeadNote(lead.id, input.value);
  });

  contactProfileContent.querySelector("[data-profile-pipeline]")?.addEventListener("click", () => {
    state.selectedLeadId = lead.id;
    setActivePage("pipeline");
    render();
  });

  contactProfileContent.querySelector("[data-profile-detail]")?.addEventListener("click", () => {
    openLeadDetailModal(lead.id);
  });

  contactProfileContent.querySelector("[data-profile-task]")?.addEventListener("click", async () => {
    await createFollowUpFromLead(lead.id);
  });
}

function syncSelectedContacts(leads) {
  const visibleIds = new Set(leads.map((lead) => lead.id));
  selectedContactIds = new Set([...selectedContactIds].filter((id) => visibleIds.has(id)));
}

function selectVisibleContacts() {
  sortedContactLeads(filteredLeads()).forEach((lead) => selectedContactIds.add(lead.id));
  renderContacts();
}

function clearSelectedContacts() {
  selectedContactIds.clear();
  renderContacts();
}

function updateBulkContactTaskButton() {
  const count = selectedContactIds.size;
  const hasSelection = count > 0;
  clearSelectedContactsButton.disabled = !hasSelection;
  contactSelectionStatus.textContent = `${count} selected`;
  exportSelectedContactsButton.disabled = !hasSelection;
  exportSelectedContactsButton.textContent = `Export selected (${count})`;
  bulkContactTaskButton.disabled = count === 0;
  bulkContactTaskButton.textContent = `Task selected (${count})`;
  bulkContactWonButton.disabled = count === 0;
  bulkContactWonButton.textContent = `Mark won selected (${count})`;
  bulkContactNextButton.disabled = count === 0;
  bulkContactNextButton.textContent = `Next stage selected (${count})`;
}

function contactSearchMatches(lead) {
  const query = searchInput.value.trim().toLowerCase();
  return (
    !query ||
    [lead.name, lead.company, lead.notes, lead.source].some((field) =>
      field.toLowerCase().includes(query),
    )
  );
}

function renderContactFilterCounts() {
  const searchableLeads = state.leads.filter(contactSearchMatches);
  document.querySelector("#contactCountAll").textContent = searchableLeads.length;
  document.querySelector("#contactCountNew").textContent = searchableLeads.filter(
    (lead) => lead.stage === "new",
  ).length;
  document.querySelector("#contactCountQualified").textContent = searchableLeads.filter(
    (lead) => lead.stage === "qualified",
  ).length;
  document.querySelector("#contactCountProposal").textContent = searchableLeads.filter(
    (lead) => lead.stage === "proposal",
  ).length;
  document.querySelector("#contactCountWon").textContent = searchableLeads.filter(
    (lead) => lead.stage === "won",
  ).length;
}

function renderContactSummary(leads) {
  const value = leads.reduce((sum, lead) => sum + lead.value, 0);
  const hot = leads.filter((lead) => lead.score >= 80).length;
  const weighted = leads.reduce((sum, lead) => sum + weightedLeadValue(lead), 0);

  contactSummary.innerHTML = `
    <article>
      <span>Accounts shown</span>
      <strong>${leads.length}</strong>
    </article>
    <article>
      <span>Filtered value</span>
      <strong>${formatter.format(value)}</strong>
    </article>
    <article>
      <span>Hot leads</span>
      <strong>${hot}</strong>
    </article>
    <article>
      <span>Weighted value</span>
      <strong>${formatter.format(weighted)}</strong>
    </article>
  `;
}

const managerAnalyticsViews = [
  { id: "revenue", label: "Revenue" },
  { id: "appointments", label: "Appointments" },
  { id: "close-rate", label: "Close Rate" },
  { id: "lead-sources", label: "Lead Sources" },
  { id: "rep-performance", label: "Rep Performance" },
  { id: "response-time", label: "Customer Response Time" },
];

function renderAISalesManagerPage() {
  if (!aiSalesManagerPage) return;
  const report = buildAISalesManagerReport();
  renderExecutiveDashboard(report);
  renderSalesLeaderboard(report);
  renderManagerAIInsights(report);
  renderForecastCharts(report);
  renderManagerPipelineHealth(report);
  renderCoachingPanel(report);
  renderRiskCenter(report);
  renderManagerActions(report);
  renderManagerNotifications(report);
  renderAnalyticsSection(report);
}

function buildAISalesManagerReport() {
  const leads = state.leads || [];
  const appointments = state.appointments || [];
  const activities = state.activities || [];
  const followUps = buildSmartFollowUpQueue();
  const reps = managerSalesReps(leads, appointments, activities);
  const pipelineValue = leads.reduce((sum, lead) => sum + Number(lead.value || 0), 0);
  const weighted = leads.reduce((sum, lead) => sum + weightedLeadValue(lead), 0);
  const wonLeads = leads.filter((lead) => lead.stage === "won");
  const activeDeals = leads.filter((lead) => lead.stage !== "won");
  const atRisk = followUps.filter((item) => ["Critical", "High"].includes(item.priorityLevel));
  const revenueMonth = wonLeads.reduce((sum, lead) => sum + Number(lead.value || 0), 0) + 18500;
  const appointmentsSet = appointments.length + reps.reduce((sum, rep) => sum + rep.appointmentsSet, 0);
  const closingRate = Math.round(
    (wonLeads.length + reps.reduce((sum, rep) => sum + rep.closeRate, 0) / 100) /
      Math.max(1, activeDeals.length + wonLeads.length + reps.length) *
      100,
  );
  const averageDealSize = Math.round((pipelineValue + revenueMonth) / Math.max(1, leads.length + wonLeads.length));
  const averageResponseTime = Math.round(reps.reduce((sum, rep) => sum + rep.leadResponseMinutes, 0) / Math.max(1, reps.length));

  return {
    leads,
    appointments,
    activities,
    followUps,
    reps,
    pipelineValue,
    weighted,
    revenueMonth,
    todayRevenue: Math.max(4200, Math.round(weighted * 0.18)),
    appointmentsSet,
    closingRate,
    averageDealSize,
    dealsAtRisk: atRisk.length,
    averageResponseTime,
    forecast: managerForecastValues(pipelineValue, weighted, revenueMonth),
    pipelineHealth: managerPipelineHealthData(leads, followUps),
    risks: managerRisks(leads, followUps, appointments, reps),
    notifications: managerNotificationsData(leads, reps, pipelineValue, revenueMonth),
  };
}

function renderExecutiveDashboard(report) {
  const kpis = [
    ["Today's Revenue", formatter.format(report.todayRevenue), "Live booked and influenced revenue"],
    ["Revenue This Month", formatter.format(report.revenueMonth), "Closed and projected month-to-date"],
    ["Appointments Set", String(report.appointmentsSet), "Team booked estimates and sales calls"],
    ["Closing Rate", `${report.closingRate}%`, "Weighted close rate across reps"],
    ["Average Deal Size", formatter.format(report.averageDealSize), "Average residential project value"],
    ["Pipeline Value", formatter.format(report.pipelineValue), "Total open and won opportunity value"],
    ["Deals at Risk", String(report.dealsAtRisk), "AI-flagged deals needing manager attention"],
    ["Average Response Time", `${report.averageResponseTime}m`, "Lead response time across the team"],
  ];

  managerKpiGrid.innerHTML = kpis
    .map(
      ([label, value, detail], index) => `
        <article class="manager-kpi-card" style="--delay:${index * 24}ms">
          <span>${escapeHtml(label)}</span>
          <strong>${escapeHtml(value)}</strong>
          <small>${escapeHtml(detail)}</small>
        </article>
      `,
    )
    .join("");
}

function renderSalesLeaderboard(report) {
  salesLeaderboard.innerHTML = report.reps
    .map(
      (rep, index) => `
        <article class="leaderboard-row" style="--delay:${index * 28}ms">
          <div class="rep-profile">
            <span class="rep-photo">${escapeHtml(initialsForName(rep.name))}</span>
            <div>
              <strong>${escapeHtml(rep.name)}</strong>
              <span>${escapeHtml(rep.role)}</span>
            </div>
          </div>
          <div><span>Revenue Closed</span><strong>${formatter.format(rep.revenueClosed)}</strong></div>
          <div><span>Appointments Set</span><strong>${rep.appointmentsSet}</strong></div>
          <div><span>Close Rate</span><strong>${rep.closeRate}%</strong></div>
          <div><span>Calls Made</span><strong>${rep.callsMade}</strong></div>
          <div><span>Texts Sent</span><strong>${rep.textsSent}</strong></div>
          <div><span>Emails Sent</span><strong>${rep.emailsSent}</strong></div>
          <div><span>Lead Response Time</span><strong>${rep.leadResponseMinutes}m</strong></div>
          <div><span>AI Performance Score</span><strong>${rep.performanceScore}/100</strong></div>
          <div class="trend ${rep.trend}">
            <span>Trend Indicator</span>
            <strong>${escapeHtml(trendLabel(rep.trend))}</strong>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderManagerAIInsights(report) {
  const untouchedCount = Math.max(14, report.followUps.filter((item) => item.daysQuiet >= 3).length);
  const sarahLead = report.leads.find((lead) => /johnson/i.test(lead.name)) || report.leads[0];
  const insights = [
    "John has a 92% close rate this week.",
    `${untouchedCount} leads have gone untouched for 3 days.`,
    `Sarah should follow up with the ${sarahLead?.name?.split(" ").at(-1) || "Johnson"} project today.`,
    "Roofing pipeline is slowing.",
    "Bathroom remodels are closing 21% higher this month.",
    report.dealsAtRisk
      ? `${report.dealsAtRisk} high-priority deals need manager review before end of day.`
      : "No critical follow-up risks are currently open.",
  ];
  const rotated = insights.slice(managerInsightsVersion % insights.length).concat(insights.slice(0, managerInsightsVersion % insights.length));

  managerAIInsights.innerHTML = rotated
    .slice(0, 6)
    .map(
      (insight, index) => `
        <article class="manager-insight-card" style="--delay:${index * 26}ms">
          <span>AI</span>
          <p>${escapeHtml(insight)}</p>
        </article>
      `,
    )
    .join("");
}

function renderForecastCharts(report) {
  const forecast = report.forecast;
  const maxValue = Math.max(...forecast.map((item) => item.value), 1);
  forecastCharts.innerHTML = forecast
    .map(
      (item, index) => `
        <article class="forecast-chart-card" style="--delay:${index * 30}ms">
          <div>
            <span>${escapeHtml(item.label)}</span>
            <strong>${formatter.format(item.value)}</strong>
            <small>${escapeHtml(item.window)}</small>
          </div>
          <div class="manager-bar" aria-label="${escapeHtml(item.label)} ${formatter.format(item.value)}">
            <span style="width:${Math.max(8, Math.round((item.value / maxValue) * 100))}%"></span>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderManagerPipelineHealth(report) {
  const total = report.pipelineHealth.reduce((sum, item) => sum + item.count, 0) || 1;
  managerPipelineHealth.innerHTML = report.pipelineHealth
    .map(
      (stage) => `
        <article class="manager-stage-card ${stage.id}">
          <div>
            <span>${escapeHtml(stage.label)}</span>
            <strong>${stage.count}</strong>
          </div>
          <small>${formatter.format(stage.value)}</small>
          <div class="manager-stage-bar"><span style="width:${Math.max(7, Math.round((stage.count / total) * 100))}%"></span></div>
        </article>
      `,
    )
    .join("");
}

function renderCoachingPanel(report) {
  coachingPanel.innerHTML = report.reps
    .map(
      (rep) => `
        <article class="coaching-card">
          <div class="coaching-header">
            <div class="rep-profile">
              <span class="rep-photo">${escapeHtml(initialsForName(rep.name))}</span>
              <div>
                <strong>${escapeHtml(rep.name)}</strong>
                <span>Follow-up Score ${rep.followUpScore}/100</span>
              </div>
            </div>
            <span class="performance-pill">${rep.performanceScore}/100</span>
          </div>
          <div class="coaching-grid">
            <section>
              <span>Strengths</span>
              <p>${escapeHtml(rep.strengths)}</p>
            </section>
            <section>
              <span>Weaknesses</span>
              <p>${escapeHtml(rep.weaknesses)}</p>
            </section>
            <section>
              <span>Recommended Focus</span>
              <p>${escapeHtml(rep.recommendedFocus)}</p>
            </section>
            <section>
              <span>Suggested Script Improvements</span>
              <p>${escapeHtml(rep.scriptImprovements)}</p>
            </section>
            <section>
              <span>Objection Coaching</span>
              <p>${escapeHtml(rep.objectionCoaching)}</p>
            </section>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderRiskCenter(report) {
  riskCenter.innerHTML = report.risks
    .map(
      (risk) => `
        <article class="risk-card ${risk.level.toLowerCase()}">
          <span>${escapeHtml(risk.category)}</span>
          <strong>${escapeHtml(risk.title)}</strong>
          <p>${escapeHtml(risk.detail)}</p>
        </article>
      `,
    )
    .join("");
}

function renderManagerActions() {
  const actions = [
    ["assign-leads", "Assign Leads"],
    ["reassign-leads", "Reassign Leads"],
    ["send-coaching-message", "Send Coaching Message"],
    ["create-team-challenge", "Create Team Challenge"],
    ["schedule-meeting", "Schedule Meeting"],
  ];
  managerActionsPanel.innerHTML = actions
    .map(
      ([id, label], index) => `
        <button class="${index === 0 ? "primary-button" : "secondary-button"}" data-manager-action="${id}" type="button">
          ${escapeHtml(label)}
        </button>
      `,
    )
    .join("");

  managerActionsPanel.querySelectorAll("[data-manager-action]").forEach((button) => {
    button.addEventListener("click", () => handleManagerAction(button.dataset.managerAction));
  });
}

function renderManagerNotifications(report) {
  managerNotifications.innerHTML = report.notifications
    .map(
      (notification) => `
        <article class="manager-notification ${notification.level}">
          <strong>${escapeHtml(notification.title)}</strong>
          <span>${escapeHtml(notification.detail)}</span>
        </article>
      `,
    )
    .join("");
}

function renderAnalyticsSection(report) {
  managerAnalyticsTabs.innerHTML = managerAnalyticsViews
    .map(
      (view) => `
        <button class="${view.id === managerAnalyticsView ? "active" : ""}" data-manager-analytics="${view.id}" type="button">
          ${escapeHtml(view.label)}
        </button>
      `,
    )
    .join("");

  managerAnalyticsTabs.querySelectorAll("[data-manager-analytics]").forEach((button) => {
    button.addEventListener("click", () => {
      managerAnalyticsView = button.dataset.managerAnalytics;
      renderAnalyticsSection(report);
    });
  });

  const chart = managerAnalyticsData(report, managerAnalyticsView);
  const maxValue = Math.max(...chart.points.map((point) => point.value), 1);
  managerAnalyticsChart.innerHTML = `
    <div class="analytics-chart-heading">
      <div>
        <span>${escapeHtml(chart.label)}</span>
        <strong>${escapeHtml(chart.summary)}</strong>
      </div>
      <small>Interactive placeholder chart</small>
    </div>
    <div class="analytics-bars">
      ${chart.points
        .map(
          (point) => `
            <article>
              <div class="analytics-bar-track">
                <span style="height:${Math.max(10, Math.round((point.value / maxValue) * 100))}%"></span>
              </div>
              <strong>${escapeHtml(String(point.valueLabel || point.value))}</strong>
              <small>${escapeHtml(point.label)}</small>
            </article>
          `,
        )
        .join("")}
    </div>
  `;
}

function managerSalesReps(leads, appointments, activities) {
  const openPipeline = leads.reduce((sum, lead) => sum + Number(lead.value || 0), 0);
  const activityCount = activities.length;
  return [
    {
      name: "John Carter",
      role: "Senior closer",
      revenueClosed: 42800 + Math.round(openPipeline * 0.18),
      appointmentsSet: 18 + appointments.length,
      closeRate: 92,
      callsMade: 86 + activityCount,
      textsSent: 143,
      emailsSent: 54,
      leadResponseMinutes: 7,
      performanceScore: 96,
      trend: "up",
      strengths: "Turns booked estimates into clear close plans.",
      weaknesses: "Needs cleaner notes after long calls.",
      recommendedFocus: "Document objections before moving deals to quoted.",
      scriptImprovements: "Ask for the decision date before discussing discounts.",
      objectionCoaching: "When price comes up, anchor against project urgency and warranty value.",
      followUpScore: 94,
    },
    {
      name: "Sarah Miller",
      role: "Field sales",
      revenueClosed: 31400 + Math.round(openPipeline * 0.12),
      appointmentsSet: 21,
      closeRate: 76,
      callsMade: 72,
      textsSent: 118,
      emailsSent: 61,
      leadResponseMinutes: 12,
      performanceScore: 88,
      trend: "up",
      strengths: "Strong appointment confirmation and referral ask.",
      weaknesses: "Lets older quotes sit too long.",
      recommendedFocus: "Follow up with quoted jobs inside 24 hours.",
      scriptImprovements: "Lead with the homeowner's stated timeline, then ask for the next commitment.",
      objectionCoaching: "Respond to timing stalls with two concrete scheduling options.",
      followUpScore: 82,
    },
    {
      name: "Mia Brooks",
      role: "Appointment setter",
      revenueClosed: 22600 + Math.round(openPipeline * 0.09),
      appointmentsSet: 27,
      closeRate: 64,
      callsMade: 104,
      textsSent: 176,
      emailsSent: 38,
      leadResponseMinutes: 5,
      performanceScore: 84,
      trend: "flat",
      strengths: "Fast first response and consistent text follow-up.",
      weaknesses: "Needs stronger qualification before booking.",
      recommendedFocus: "Confirm budget, decision maker, and project timeline.",
      scriptImprovements: "Add one budget range question before offering appointment windows.",
      objectionCoaching: "If the homeowner says they are just shopping, ask what would make the quote worth comparing.",
      followUpScore: 89,
    },
    {
      name: "Luis Ortega",
      role: "Junior closer",
      revenueClosed: 18400 + Math.round(openPipeline * 0.06),
      appointmentsSet: 13,
      closeRate: 48,
      callsMade: 61,
      textsSent: 84,
      emailsSent: 29,
      leadResponseMinutes: 24,
      performanceScore: 71,
      trend: "down",
      strengths: "Builds rapport quickly on warm referrals.",
      weaknesses: "Slow response time and inconsistent quote follow-up.",
      recommendedFocus: "Call hot leads first and use Flow Mode before checking low-priority work.",
      scriptImprovements: "Open with the project pain, then ask one direct closing question.",
      objectionCoaching: "Practice price objection handling with two warranty and financing anchors.",
      followUpScore: 63,
    },
  ];
}

function managerForecastValues(pipelineValue, weighted, revenueMonth) {
  return [
    { label: "Expected Revenue", value: Math.round(weighted + revenueMonth * 0.24), window: "Next 30 Days" },
    { label: "Likely Revenue", value: Math.round(weighted * 0.82 + revenueMonth * 0.32), window: "Next 30 Days" },
    { label: "Best Case", value: Math.round(pipelineValue * 0.78 + revenueMonth * 0.42), window: "Next 90 Days" },
    { label: "Worst Case", value: Math.round(weighted * 0.42 + revenueMonth * 0.18), window: "Next 30 Days" },
    { label: "Next 30 Days", value: Math.round(weighted * 0.9 + 14500), window: "Short-range forecast" },
    { label: "Next 90 Days", value: Math.round(pipelineValue * 1.4 + 38600), window: "Quarter forecast" },
  ];
}

function managerPipelineHealthData(leads, followUps) {
  const quoted = leads.filter((lead) => lead.stage === "proposal");
  const negotiating = leads.filter((lead) => lead.stage === "qualified" && lead.score >= 80);
  const stalled = followUps.filter((item) => item.daysQuiet >= 3);
  const lostValue = Math.round(leads.reduce((sum, lead) => sum + Number(lead.value || 0), 0) * 0.08);
  return [
    { id: "new", label: "New Leads", count: leads.filter((lead) => lead.stage === "new").length, value: stageValue(leads, "new") },
    { id: "qualified", label: "Qualified", count: leads.filter((lead) => lead.stage === "qualified").length, value: stageValue(leads, "qualified") },
    { id: "quoted", label: "Quoted", count: quoted.length, value: quoted.reduce((sum, lead) => sum + Number(lead.value || 0), 0) },
    { id: "negotiating", label: "Negotiating", count: negotiating.length, value: negotiating.reduce((sum, lead) => sum + Number(lead.value || 0), 0) },
    { id: "won", label: "Won", count: leads.filter((lead) => lead.stage === "won").length + 3, value: stageValue(leads, "won") + 18500 },
    { id: "lost", label: "Lost", count: 2, value: lostValue },
    { id: "stalled", label: "Stalled", count: Math.max(1, stalled.length), value: stalled.reduce((sum, item) => sum + item.lead.value, 0) },
  ];
}

function managerRisks(leads, followUps, appointments, reps) {
  const topRisk = followUps[0];
  const inactive = followUps.filter((item) => item.daysQuiet >= 3);
  const decliningRep = reps.find((rep) => rep.trend === "down");
  const missingEstimate = leads.find((lead) => lead.stage === "qualified" && !/estimate|quote|proposal/i.test(`${lead.notes} ${lead.nextAction}`));
  return [
    {
      category: "Deals likely to be lost",
      title: topRisk ? topRisk.lead.company : "No critical deals",
      detail: topRisk ? topRisk.reason : "AI does not see a critical lost-deal signal right now.",
      level: topRisk?.priorityLevel || "Medium",
    },
    {
      category: "Inactive leads",
      title: `${Math.max(14, inactive.length)} leads need a touch`,
      detail: "Mock AI scan found leads quiet for 3+ days.",
      level: "High",
    },
    {
      category: "Overdue follow-ups",
      title: `${followUps.length} follow-ups due`,
      detail: "Smart Follow-Up Engine has open work for today.",
      level: followUps.length ? "High" : "Medium",
    },
    {
      category: "Missed appointments",
      title: `${Math.max(1, Math.max(0, 3 - appointments.length))} appointment recovery needed`,
      detail: "Placeholder calendar signal flags missed or unconfirmed estimate windows.",
      level: "Medium",
    },
    {
      category: "Declining sales reps",
      title: decliningRep ? `${decliningRep.name} is trending down` : "No declining reps",
      detail: decliningRep ? decliningRep.recommendedFocus : "Team trend indicators are stable.",
      level: decliningRep ? "High" : "Medium",
    },
    {
      category: "Missing estimates",
      title: missingEstimate ? `${missingEstimate.company} needs an estimate` : "Estimate coverage looks healthy",
      detail: missingEstimate ? "Qualified lead has no clear quote or estimate language." : "No missing estimates detected.",
      level: missingEstimate ? "Medium" : "Low",
    },
  ];
}

function managerNotificationsData(leads, reps, pipelineValue, revenueMonth) {
  const largestDeal = [...leads].sort((left, right) => right.value - left.value)[0];
  const laggingRep = reps.find((rep) => rep.trend === "down") || reps.at(-1);
  return [
    {
      title: "Large deal created",
      detail: `${largestDeal?.company || "Johnson Project"} is now valued at ${formatter.format(largestDeal?.value || 18500)}.`,
      level: "positive",
    },
    {
      title: "High-value lead inactive",
      detail: "A high-value homeowner lead has been quiet for 3+ days.",
      level: "warning",
    },
    {
      title: "Sales rep falling behind",
      detail: `${laggingRep?.name || "A rep"} needs coaching on response time today.`,
      level: "danger",
    },
    {
      title: "Pipeline goal reached",
      detail: `Pipeline value is now ${formatter.format(pipelineValue)}.`,
      level: "positive",
    },
    {
      title: "Revenue milestone",
      detail: `${formatter.format(revenueMonth)} month-to-date revenue tracked.`,
      level: "positive",
    },
  ];
}

function managerAnalyticsData(report, view) {
  const sourceCounts = sourcePerformanceRows().slice(0, 5);
  const repPoints = report.reps.map((rep) => ({ label: rep.name.split(" ")[0], value: rep.performanceScore, valueLabel: `${rep.performanceScore}` }));
  const charts = {
    revenue: {
      label: "Revenue",
      summary: `${formatter.format(report.revenueMonth)} this month`,
      points: [
        { label: "Week 1", value: 12400, valueLabel: "$12k" },
        { label: "Week 2", value: 18300, valueLabel: "$18k" },
        { label: "Week 3", value: 22100, valueLabel: "$22k" },
        { label: "Week 4", value: Math.max(24000, report.todayRevenue + 17600), valueLabel: "$24k+" },
      ],
    },
    appointments: {
      label: "Appointments",
      summary: `${report.appointmentsSet} appointments set`,
      points: report.reps.map((rep) => ({ label: rep.name.split(" ")[0], value: rep.appointmentsSet })),
    },
    "close-rate": {
      label: "Close Rate",
      summary: `${report.closingRate}% blended close rate`,
      points: report.reps.map((rep) => ({ label: rep.name.split(" ")[0], value: rep.closeRate, valueLabel: `${rep.closeRate}%` })),
    },
    "lead-sources": {
      label: "Lead Sources",
      summary: "Best source mix by pipeline value",
      points: sourceCounts.length
        ? sourceCounts.map((source) => ({ label: source.source, value: source.value, valueLabel: formatter.format(source.value) }))
        : [{ label: "Website", value: 1 }],
    },
    "rep-performance": {
      label: "Rep Performance",
      summary: "AI performance score by rep",
      points: repPoints,
    },
    "response-time": {
      label: "Customer Response Time",
      summary: `${report.averageResponseTime}m team average`,
      points: report.reps.map((rep) => ({ label: rep.name.split(" ")[0], value: rep.leadResponseMinutes, valueLabel: `${rep.leadResponseMinutes}m` })),
    },
  };
  return charts[view] || charts.revenue;
}

function handleManagerAction(action) {
  const labels = {
    "assign-leads": "Assign Leads",
    "reassign-leads": "Reassign Leads",
    "send-coaching-message": "Send Coaching Message",
    "create-team-challenge": "Create Team Challenge",
    "schedule-meeting": "Schedule Meeting",
  };
  managerStatus.textContent = `${labels[action] || "Manager action"} queued with placeholder workflow data.`;
  showCommunicationToast(labels[action] || "Manager action", "AI Sales Manager placeholder workflow queued.");
}

function stageValue(leads, stage) {
  return leads.filter((lead) => lead.stage === stage).reduce((sum, lead) => sum + Number(lead.value || 0), 0);
}

function trendLabel(trend) {
  if (trend === "up") return "Up";
  if (trend === "down") return "Down";
  return "Flat";
}

const communicationMessageTypeLabels = {
  "incoming-text": "Incoming Text",
  "outgoing-text": "Outgoing Text",
  "call-log": "Call Log",
  voicemail: "Voicemail",
  email: "Email",
  appointment: "Appointment",
  "system-note": "System Notes",
};

const communicationComposerTabs = [
  { id: "text", label: "Text" },
  { id: "email", label: "Email" },
  { id: "note", label: "Internal Note" },
];

const communicationTemplates = {
  text: [
    "Quick estimate check-in",
    "Appointment confirmation",
    "Missed call follow-up",
  ],
  email: [
    "Estimate recap email",
    "Project scope summary",
    "Deposit request email",
  ],
  note: [
    "Objection summary",
    "Decision maker note",
    "Follow-up context",
  ],
};

const communicationTemplateCopy = {
  "Quick estimate check-in": "Hi {{name}}, wanted to check in on the estimate for {{projectType}}. Any questions I can clear up today?",
  "Appointment confirmation": "Hi {{name}}, confirming your estimate appointment. Does the current time still work for you?",
  "Missed call follow-up": "Hi {{name}}, sorry I missed you. I can help with {{projectType}} when you have a minute.",
  "Estimate recap email": "Hi {{name}},\n\nHere is a quick recap for {{projectType}} at {{address}}. The projected value is {{value}} and the next step is {{nextAction}}.\n\nBest,\nCameron",
  "Project scope summary": "Hi {{name}},\n\nI captured the project scope, timeline, and next steps for {{projectType}}. Reply with anything you want adjusted before we move forward.",
  "Deposit request email": "Hi {{name}},\n\nTo reserve the project window, you can place the deposit today. I can resend the secure payment link if helpful.",
  "Objection summary": "{{name}} raised questions about pricing, timing, and project scope. Next best move: {{nextAction}}",
  "Decision maker note": "{{name}} appears to be the primary contact. Confirm if anyone else needs to approve the project.",
  "Follow-up context": "Follow-up should reference {{projectType}}, the quoted value of {{value}}, and the current stage: {{stage}}.",
};

const communicationQuickReplies = [
  "Can I call you now?",
  "Want me to resend the quote?",
  "What time works best today?",
  "I can get that scheduled.",
];

function renderCommunicationsPage() {
  if (!communicationsPage) return;

  const conversations = communicationConversations();
  const filtered = filteredCommunicationConversations(conversations);
  if (!selectedConversationId || !conversations.some((conversation) => conversation.id === selectedConversationId)) {
    selectedConversationId = filtered[0]?.id || conversations[0]?.id || null;
  }
  const selected =
    conversations.find((conversation) => conversation.id === selectedConversationId) ||
    filtered[0] ||
    conversations[0] ||
    null;

  if (selected) selectedConversationId = selected.id;

  renderConversationList(filtered);
  renderConversationWindow(selected);
  renderCustomerSidebar(selected);
  renderAIAssistantPanel(selected);
  renderQuickActionsPanel(selected);
  renderCommunicationNotifications(selected);

  document.querySelectorAll("[data-communication-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.communicationFilter === communicationFilter);
  });
}

function communicationConversations() {
  const savedMessages = communicationMessageState();
  return state.leads
    .map((lead, index) => {
      const profile = communicationCustomerProfile(lead, index);
      const messages = [
        ...defaultCommunicationMessages(lead, profile, index),
        ...(savedMessages[lead.id] || []).map(normalizedCommunicationMessage),
      ].sort((left, right) => new Date(left.createdAt) - new Date(right.createdAt));
      const lastMessage = messages[messages.length - 1];
      const unreadCount = messages.filter((message) => !message.read && message.direction === "incoming").length;
      const intelligence = calculateLeadIntelligence(lead);
      return {
        id: lead.id,
        lead,
        profile,
        messages,
        lastMessage,
        unreadCount,
        intelligence,
        pinned: ["lead-1", "lead-3"].includes(lead.id) || lead.score >= 88,
      };
    })
    .sort((left, right) => {
      if (left.pinned !== right.pinned) return left.pinned ? -1 : 1;
      return new Date(right.lastMessage?.createdAt || 0) - new Date(left.lastMessage?.createdAt || 0);
    });
}

function filteredCommunicationConversations(conversations) {
  const query = communicationSearchInput.value.trim().toLowerCase();
  return conversations.filter((conversation) => {
    const searchable = [
      conversation.lead.name,
      conversation.lead.company,
      conversation.profile.phone,
      conversation.profile.email,
      conversation.profile.address,
      conversation.lastMessage?.body,
    ]
      .join(" ")
      .toLowerCase();
    const matchesSearch = !query || searchable.includes(query);
    if (!matchesSearch) return false;
    if (communicationFilter === "unread") return conversation.unreadCount > 0;
    if (communicationFilter === "calls") return conversation.messages.some((message) => ["call-log", "voicemail"].includes(message.type));
    if (communicationFilter === "texts") return conversation.messages.some((message) => ["incoming-text", "outgoing-text"].includes(message.type));
    if (communicationFilter === "emails") return conversation.messages.some((message) => message.type === "email");
    if (communicationFilter === "appointments") return conversation.messages.some((message) => message.type === "appointment");
    if (communicationFilter === "pinned") return conversation.pinned;
    return true;
  });
}

function renderConversationList(conversations) {
  conversationCount.textContent = `${conversations.length} shown`;
  if (!conversations.length) {
    conversationList.innerHTML = "<p class=\"empty-state\">No conversations match this view.</p>";
    return;
  }

  conversationList.innerHTML = conversations
    .map((conversation) => {
      const lastMessage = conversation.lastMessage;
      const typeLabel = lastMessage ? communicationMessageTypeLabels[lastMessage.type] : "No messages";
      return `
        <button class="conversation-item ${conversation.id === selectedConversationId ? "active" : ""}" data-conversation-id="${conversation.id}" type="button">
          <span class="conversation-avatar">${escapeHtml(initialsForName(conversation.lead.name))}</span>
          <span class="conversation-preview">
            <span>
              <strong>${escapeHtml(conversation.lead.name)}</strong>
              <time>${lastMessage ? formatConversationTime(lastMessage.createdAt) : "New"}</time>
            </span>
            <small>${escapeHtml(conversation.lead.company)}</small>
            <em>${escapeHtml(typeLabel)} · ${escapeHtml(lastMessage?.body || "Start the conversation.")}</em>
          </span>
          <span class="conversation-meta">
            ${conversation.unreadCount ? `<b class="unread-badge">${conversation.unreadCount}</b>` : ""}
            <span class="stage-dot stage-${conversation.lead.stage}" aria-label="${escapeHtml(stageLabel(conversation.lead.stage))} stage"></span>
            ${conversation.pinned ? "<span class=\"pin-badge\">Pinned</span>" : ""}
          </span>
        </button>
      `;
    })
    .join("");

  conversationList.querySelectorAll("[data-conversation-id]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedConversationId = button.dataset.conversationId;
      renderCommunicationsPage();
    });
  });
}

function renderConversationWindow(conversation) {
  if (!conversation) {
    conversationWindowHeader.innerHTML = `
      <div>
        <p class="eyebrow">Conversation window</p>
        <h2>Conversation Timeline</h2>
        <span>No customer selected.</span>
      </div>
    `;
    callControls.innerHTML = "";
    conversationTimeline.innerHTML = "<p class=\"empty-state\">Add leads to start communicating from one place.</p>";
    messageComposer.innerHTML = "";
    return;
  }

  conversationWindowHeader.innerHTML = `
    <div>
      <p class="eyebrow">Conversation window</p>
      <h2>${escapeHtml(conversation.lead.name)}</h2>
      <span>${escapeHtml(conversation.profile.phone)} · ${escapeHtml(conversation.profile.email)}</span>
    </div>
    <div class="conversation-header-meta">
      ${leadIntelligenceBadge(conversation.lead, "conversation-score")}
      <span class="stage-pill stage-${conversation.lead.stage}">${escapeHtml(stageLabel(conversation.lead.stage))}</span>
    </div>
  `;

  renderCallControls(conversation);
  renderConversationTimeline(conversation);
  renderMessageComposer(conversation);
}

function renderConversationTimeline(conversation) {
  conversationTimeline.innerHTML = `
    <div class="conversation-timeline-heading">
      <div>
        <p class="eyebrow">History</p>
        <h3>Conversation Timeline</h3>
      </div>
      <span>${conversation.messages.length} events</span>
    </div>
    <div class="message-thread">
      ${conversation.messages.map(renderConversationMessage).join("")}
    </div>
  `;
}

function renderConversationMessage(message) {
  const attachments = normalizedMessageAttachments(message.attachments);
  return `
    <article class="message-bubble ${message.type} ${message.direction || "system"}">
      <div class="message-bubble-header">
        <span>${escapeHtml(communicationMessageTypeLabels[message.type] || "Message")}</span>
        <time>${formatActivityDate(message.createdAt)}</time>
      </div>
      <p>${escapeHtml(message.body)}</p>
      <div class="message-bubble-footer">
        <span>Status: ${escapeHtml(message.status || "Logged")}</span>
        <span>${message.read ? "Read" : "Unread"}</span>
        ${attachments.length ? `<span>Attachments: ${attachments.map(escapeHtml).join(", ")}</span>` : "<span>Attachments: none</span>"}
      </div>
    </article>
  `;
}

function renderMessageComposer(conversation) {
  const draft = communicationDraftValue(conversation.lead.id, communicationComposerMode);
  const templates = communicationTemplates[communicationComposerMode] || [];
  const sendLabel =
    communicationComposerMode === "email"
      ? "Send Email"
      : communicationComposerMode === "note"
        ? "Save Internal Note"
        : "Send Text";

  messageComposer.innerHTML = `
    <div class="composer-tabs" role="tablist" aria-label="Composer type">
      ${communicationComposerTabs
        .map(
          (tab) => `
            <button class="${tab.id === communicationComposerMode ? "active" : ""}" data-composer-mode="${tab.id}" type="button">
              ${escapeHtml(tab.label)}
            </button>
          `,
        )
        .join("")}
    </div>
    <label class="composer-input-label">
      ${escapeHtml(communicationComposerTabs.find((tab) => tab.id === communicationComposerMode)?.label || "Message")}
      <textarea id="communicationComposerInput" rows="4" placeholder="Write a message, email, or internal note">${escapeHtml(draft)}</textarea>
    </label>
    <div class="composer-tool-grid">
      <div class="composer-tool">
        <span>Emoji picker</span>
        <div class="emoji-picker" aria-label="Emoji picker">
          <button data-communication-emoji="👍" type="button">👍</button>
          <button data-communication-emoji="😊" type="button">😊</button>
          <button data-communication-emoji="✅" type="button">✅</button>
        </div>
      </div>
      <label class="composer-tool">
        Templates
        <select id="communicationTemplateSelect">
          <option value="">Choose template</option>
          ${templates.map((template) => `<option value="${escapeHtml(template)}">${escapeHtml(template)}</option>`).join("")}
        </select>
      </label>
      <div class="composer-tool">
        <span>Quick replies</span>
        <div class="quick-replies">
          ${communicationQuickReplies
            .map((reply) => `<button data-quick-reply="${escapeHtml(reply)}" type="button">${escapeHtml(reply)}</button>`)
            .join("")}
        </div>
      </div>
    </div>
    <div class="composer-actions">
      <button class="secondary-button" data-composer-action="attach" type="button">Attachments</button>
      <button class="secondary-button" data-composer-action="schedule" type="button">Schedule message</button>
      <button class="secondary-button" data-composer-action="draft" type="button">Save draft</button>
      <button class="primary-button" data-composer-action="send" type="button">${escapeHtml(sendLabel)}</button>
    </div>
    <p class="composer-status" id="communicationComposerStatus" role="status"></p>
  `;

  messageComposer.querySelectorAll("[data-composer-mode]").forEach((button) => {
    button.addEventListener("click", () => {
      communicationComposerMode = button.dataset.composerMode;
      renderMessageComposer(conversation);
    });
  });

  const input = messageComposer.querySelector("#communicationComposerInput");
  input.addEventListener("input", () => {
    setCommunicationDraftValue(conversation.lead.id, communicationComposerMode, input.value);
  });

  messageComposer.querySelector("#communicationTemplateSelect").addEventListener("change", (event) => {
    const template = event.target.value;
    if (!template) return;
    setComposerText(conversation, personalizeCommunicationCopy(communicationTemplateCopy[template], conversation));
  });

  messageComposer.querySelectorAll("[data-communication-emoji]").forEach((button) => {
    button.addEventListener("click", () => {
      appendComposerText(conversation, button.dataset.communicationEmoji);
    });
  });

  messageComposer.querySelectorAll("[data-quick-reply]").forEach((button) => {
    button.addEventListener("click", () => {
      setComposerText(conversation, button.dataset.quickReply);
    });
  });

  messageComposer.querySelectorAll("[data-composer-action]").forEach((button) => {
    button.addEventListener("click", () => {
      handleComposerAction(button.dataset.composerAction, conversation);
    });
  });
}

function renderCallControls(conversation) {
  const isActive = communicationCallState.active && communicationCallState.leadId === conversation.lead.id;
  callControls.innerHTML = `
    <div class="call-primary">
      <button class="call-button" id="communicationCallButton" type="button">${isActive ? "Calling" : "Call"}</button>
      <div>
        <span>Call Timer</span>
        <strong id="communicationCallTimer">${isActive ? activeCallDurationLabel() : "00:00"}</strong>
      </div>
    </div>
    <div class="call-control-grid">
      <button class="${communicationCallState.muted ? "active" : ""}" data-call-control="mute" type="button">Mute</button>
      <button class="${communicationCallState.speaker ? "active" : ""}" data-call-control="speaker" type="button">Speaker</button>
      <button class="${communicationCallState.hold ? "active" : ""}" data-call-control="hold" type="button">Hold</button>
      <button data-call-control="transfer" type="button">Transfer</button>
      <button data-call-control="record" type="button">Record</button>
      <button class="end-call-button" id="communicationEndCallButton" type="button" ${isActive ? "" : "disabled"}>End Call</button>
    </div>
  `;

  callControls.querySelector("#communicationCallButton").addEventListener("click", () => {
    if (isActive) return;
    startCommunicationCall(conversation);
  });

  callControls.querySelector("#communicationEndCallButton").addEventListener("click", () => {
    endCommunicationCall(conversation);
  });

  callControls.querySelectorAll("[data-call-control]").forEach((button) => {
    button.addEventListener("click", () => handleCallControl(button.dataset.callControl, conversation));
  });

  syncCommunicationCallTimer();
}

function renderCustomerSidebar(conversation) {
  if (!conversation) {
    customerSidebar.innerHTML = `
      <p class="eyebrow">Customer information</p>
      <h2>Customer Information</h2>
      <p class="empty-state">Select a conversation to view customer details.</p>
    `;
    return;
  }

  const lastContact = conversation.lastMessage ? formatShortDate(conversation.lastMessage.createdAt) : "None";
  const nextFollowUp = nextCommunicationFollowUp(conversation);
  customerSidebar.innerHTML = `
    <p class="eyebrow">Customer information</p>
    <h2>Customer Information</h2>
    <div class="customer-profile-card">
      <span class="customer-photo">${escapeHtml(initialsForName(conversation.lead.name))}</span>
      <div>
        <strong>${escapeHtml(conversation.lead.name)}</strong>
        <span>${escapeHtml(conversation.lead.company)}</span>
      </div>
    </div>
    <div class="customer-detail-grid">
      <article><span>Lead Score</span><strong>${conversation.intelligence.score}/100 ${escapeHtml(conversation.intelligence.label)}</strong></article>
      <article><span>Phone</span><strong>${escapeHtml(conversation.profile.phone)}</strong></article>
      <article><span>Email</span><strong>${escapeHtml(conversation.profile.email)}</strong></article>
      <article><span>Address</span><strong>${escapeHtml(conversation.profile.address)}</strong></article>
      <article><span>Project Type</span><strong>${escapeHtml(conversation.profile.projectType)}</strong></article>
      <article><span>Pipeline Stage</span><strong>${escapeHtml(stageLabel(conversation.lead.stage))}</strong></article>
      <article><span>Revenue Value</span><strong>${formatter.format(conversation.lead.value)}</strong></article>
      <article><span>Last Contact</span><strong>${escapeHtml(lastContact)}</strong></article>
      <article><span>Next Follow-Up</span><strong>${escapeHtml(nextFollowUp)}</strong></article>
    </div>
    <div class="customer-tags" aria-label="Tags">
      ${conversation.profile.tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}
    </div>
    <button class="primary-button" data-open-customer-profile="${conversation.lead.id}" type="button">Open Full Profile</button>
  `;

  customerSidebar.querySelector("[data-open-customer-profile]").addEventListener("click", () => {
    state.selectedLeadId = conversation.lead.id;
    contactProfileMode = true;
    subpageState.contacts = "profile";
    setActivePage("contacts");
    render();
  });
}

function renderAIAssistantPanel(conversation) {
  if (!conversation) {
    aiAssistantPanel.innerHTML = `
      <p class="eyebrow">AI assistant</p>
      <h2>AI Assistant Panel</h2>
      <p class="empty-state">AI suggestions appear when a customer is selected.</p>
    `;
    return;
  }

  const ai = communicationAssistantForConversation(conversation);
  aiAssistantPanel.innerHTML = `
    <p class="eyebrow">AI assistant</p>
    <h2>AI Assistant Panel</h2>
    <div class="ai-assistant-grid">
      <article>
        <span>Suggested Reply</span>
        <p>${escapeHtml(ai.suggestedReply)}</p>
      </article>
      <article>
        <span>Suggested Next Step</span>
        <p>${escapeHtml(ai.nextStep)}</p>
      </article>
      <article>
        <span>Objection Handling Tips</span>
        <ul>${ai.objectionTips.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}</ul>
      </article>
      <article>
        <span>Recommended Questions</span>
        <ul>${ai.questions.map((question) => `<li>${escapeHtml(question)}</li>`).join("")}</ul>
      </article>
      <article>
        <span>Sentiment Analysis</span>
        <strong>${escapeHtml(ai.sentiment)}</strong>
      </article>
    </div>
  `;
}

function renderQuickActionsPanel(conversation) {
  if (!conversation) {
    quickActionsPanel.innerHTML = `
      <p class="eyebrow">Quick actions</p>
      <h2>Quick Actions</h2>
      <p class="empty-state">Select a customer to use quick actions.</p>
    `;
    return;
  }

  const actions = [
    ["schedule-estimate", "Schedule Estimate"],
    ["create-task", "Create Task"],
    ["send-quote", "Send Quote"],
    ["request-review", "Request Review"],
    ["collect-deposit", "Collect Deposit"],
  ];
  quickActionsPanel.innerHTML = `
    <p class="eyebrow">Quick actions</p>
    <h2>Quick Actions</h2>
    <div class="quick-action-grid">
      ${actions
        .map(([id, label], index) => {
          const buttonClass = index === 0 ? "primary-button" : "secondary-button";
          return `<button class="${buttonClass}" data-communication-quick-action="${id}" type="button">${label}</button>`;
        })
        .join("")}
    </div>
  `;

  quickActionsPanel.querySelectorAll("[data-communication-quick-action]").forEach((button) => {
    button.addEventListener("click", () => handleCommunicationQuickAction(button.dataset.communicationQuickAction, conversation));
  });
}

function renderCommunicationNotifications(conversation) {
  const name = conversation?.lead.name || "Maya Johnson";
  communicationNotificationFeed.innerHTML = [
    ["Incoming message", `${name} replied about the estimate.`],
    ["Missed call", "A homeowner called while the line was busy."],
    ["New voicemail", "Voicemail transcribed and attached to the timeline."],
    ["Appointment reminder", "Estimate appointment starts in 2 hours."],
  ]
    .map(
      ([title, detail]) => `
        <article>
          <strong>${escapeHtml(title)}</strong>
          <span>${escapeHtml(detail)}</span>
        </article>
      `,
    )
    .join("");
}

function communicationCustomerProfile(lead, index = 0) {
  const phones = ["(214) 555-0192", "(512) 555-0174", "(713) 555-0148", "(817) 555-0133"];
  const addresses = [
    "4821 Maple Ridge Dr, Dallas, TX",
    "11808 Oak Bend Ln, Austin, TX",
    "903 Harbor Point Ct, Houston, TX",
    "64 Finch Trail, Fort Worth, TX",
  ];
  const projectTypes = ["Roof replacement", "Solar consultation", "Window upgrade", "HVAC estimate"];
  const emailName = lead.name.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/^\.+|\.+$/g, "");
  const tags = [
    stageLabel(lead.stage),
    lead.source || "Manual",
    lead.value >= 8000 ? "High value" : "Standard value",
  ];

  return {
    phone: phones[index % phones.length],
    email: `${emailName || "customer"}@example.com`,
    address: addresses[index % addresses.length],
    projectType: projectTypes[index % projectTypes.length],
    tags,
  };
}

function defaultCommunicationMessages(lead, profile, index = 0) {
  const offset = index % 3;
  return [
    {
      id: `default-${lead.id}-system`,
      type: "system-note",
      direction: "system",
      body: `${lead.company} moved into ${stageLabel(lead.stage)}. ${lead.nextAction}`,
      createdAt: communicationTimestamp(5 + offset, 9, 15),
      status: "Logged",
      attachments: [],
      read: true,
    },
    {
      id: `default-${lead.id}-incoming`,
      type: "incoming-text",
      direction: "incoming",
      body: `Hi Cameron, I am looking at ${profile.projectType.toLowerCase()} options and want to understand timing.`,
      createdAt: communicationTimestamp(3 + offset, 10, 20),
      status: "Received",
      attachments: [],
      read: index !== 1,
    },
    {
      id: `default-${lead.id}-outgoing`,
      type: "outgoing-text",
      direction: "outgoing",
      body: `Thanks ${lead.name}. I can help with ${profile.projectType.toLowerCase()} and send next steps today.`,
      createdAt: communicationTimestamp(3 + offset, 10, 28),
      status: "Delivered",
      attachments: [],
      read: true,
    },
    {
      id: `default-${lead.id}-call`,
      type: "call-log",
      direction: "outgoing",
      body: `Call logged with ${lead.name}. Discussed scope, budget, and next follow-up.`,
      createdAt: communicationTimestamp(2 + offset, 14, 5),
      status: "Completed",
      attachments: [],
      read: true,
    },
    {
      id: `default-${lead.id}-voicemail`,
      type: "voicemail",
      direction: "incoming",
      body: `${lead.name} left a voicemail asking for appointment windows.`,
      createdAt: communicationTimestamp(1 + offset, 8, 42),
      status: "Transcribed",
      attachments: [`voicemail-${lead.id}.mp3`],
      read: index !== 2,
    },
    {
      id: `default-${lead.id}-email`,
      type: "email",
      direction: "outgoing",
      body: `Estimate recap sent for ${profile.projectType.toLowerCase()} at ${profile.address}.`,
      createdAt: communicationTimestamp(1, 15, 10 + offset),
      status: "Opened",
      attachments: [`estimate-${lead.id}.pdf`],
      read: true,
    },
    {
      id: `default-${lead.id}-appointment`,
      type: "appointment",
      direction: "system",
      body: `Appointment placeholder: ${profile.projectType} review with ${lead.name}.`,
      createdAt: communicationTimestamp(0, 9 + offset, 0),
      status: "Scheduled",
      attachments: [],
      read: true,
    },
  ].map(normalizedCommunicationMessage);
}

function communicationAssistantForConversation(conversation) {
  const topFactor = conversation.intelligence.factors[0]?.label || "Follow-up context";
  const sentiment = conversation.intelligence.score >= 85 ? "Positive buying intent" : conversation.intelligence.score >= 70 ? "Curious but needs clarity" : "Needs nurturing";
  return {
    suggestedReply: `Hi ${conversation.lead.name}, I can help with ${conversation.profile.projectType.toLowerCase()}. Want me to confirm the next available estimate window?`,
    nextStep: conversation.intelligence.recommendedAction,
    objectionTips: [
      `Anchor the reply around ${topFactor.toLowerCase()}.`,
      "Ask for one clear next commitment.",
      "Keep pricing answers tied to project scope.",
    ],
    questions: [
      "What timeline are you hoping for?",
      "Is anyone else helping make the decision?",
      "Would a morning or afternoon estimate work better?",
    ],
    sentiment,
  };
}

function nextCommunicationFollowUp(conversation) {
  const linkedTask = leadTasks(conversation.lead).find((task) => !task.done);
  if (linkedTask) return linkedTask.due;
  const followUp = buildSmartFollowUpQueue().find((item) => item.lead.id === conversation.lead.id);
  return followUp?.reason || "Tomorrow 9:00 AM";
}

function normalizedCommunicationMessage(message = {}) {
  const type = communicationMessageTypeLabels[message.type] ? message.type : "system-note";
  return {
    id: message.id || crypto.randomUUID(),
    type,
    direction: message.direction || communicationDirectionForType(type),
    body: String(message.body || "").trim() || "Communication logged.",
    createdAt: message.createdAt || new Date().toISOString(),
    status: message.status || "Logged",
    attachments: normalizedMessageAttachments(message.attachments),
    read: message.read !== false,
  };
}

function normalizedMessageAttachments(attachments) {
  return Array.isArray(attachments) ? attachments.map((attachment) => String(attachment)).filter(Boolean) : [];
}

function communicationDirectionForType(type) {
  if (type === "incoming-text" || type === "voicemail") return "incoming";
  if (type === "outgoing-text" || type === "email" || type === "call-log") return "outgoing";
  return "system";
}

function communicationMessageState() {
  const saved = localStorage.getItem(communicationMessagesKey());
  if (!saved) return {};
  try {
    return JSON.parse(saved);
  } catch {
    localStorage.removeItem(communicationMessagesKey());
    return {};
  }
}

function saveCommunicationMessageState(value) {
  localStorage.setItem(communicationMessagesKey(), JSON.stringify(value));
}

function communicationDraftState() {
  const saved = localStorage.getItem(communicationDraftsKey());
  if (!saved) return {};
  try {
    return JSON.parse(saved);
  } catch {
    localStorage.removeItem(communicationDraftsKey());
    return {};
  }
}

function saveCommunicationDraftState(value) {
  communicationDrafts = value;
  localStorage.setItem(communicationDraftsKey(), JSON.stringify(value));
}

function communicationDraftKey(leadId, mode) {
  return `${leadId}:${mode}`;
}

function communicationDraftValue(leadId, mode) {
  communicationDrafts = { ...communicationDraftState(), ...communicationDrafts };
  return communicationDrafts[communicationDraftKey(leadId, mode)] || "";
}

function setCommunicationDraftValue(leadId, mode, value) {
  const drafts = { ...communicationDraftState(), ...communicationDrafts };
  drafts[communicationDraftKey(leadId, mode)] = value;
  saveCommunicationDraftState(drafts);
}

function addCommunicationMessage(leadId, message) {
  const saved = communicationMessageState();
  const created = normalizedCommunicationMessage({
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...message,
  });
  saved[leadId] = [...(saved[leadId] || []), created].slice(-60);
  saveCommunicationMessageState(saved);
  return created;
}

async function handleComposerAction(action, conversation) {
  const input = messageComposer.querySelector("#communicationComposerInput");
  const status = messageComposer.querySelector("#communicationComposerStatus");
  const body = input?.value.trim() || "";

  if (action === "attach") {
    status.textContent = "Attachment placeholder added. Files will connect when storage is live.";
    showCommunicationToast("Attachment ready", "Placeholder attachment added to the draft.");
    return;
  }

  if (action === "draft") {
    setCommunicationDraftValue(conversation.lead.id, communicationComposerMode, body);
    status.textContent = "Draft saved.";
    showCommunicationToast("Draft saved", `${conversation.lead.name}'s draft is saved locally.`);
    return;
  }

  if (action === "schedule") {
    const scheduledBody = body || personalizeCommunicationCopy("Hi {{name}}, following up on {{projectType}} tomorrow morning.", conversation);
    addCommunicationMessage(conversation.lead.id, {
      type: communicationComposerMode === "email" ? "email" : "outgoing-text",
      direction: "outgoing",
      body: `Scheduled for tomorrow at 9:00 AM: ${scheduledBody}`,
      status: "Scheduled",
      attachments: [],
      read: true,
    });
    clearCommunicationDraft(conversation.lead.id, communicationComposerMode);
    communicationsStatus.textContent = "Message scheduled for tomorrow at 9:00 AM.";
    showCommunicationToast("Message scheduled", `${conversation.lead.name} will receive it tomorrow morning.`);
    renderCommunicationsPage();
    return;
  }

  if (action === "send") {
    if (!body) {
      status.textContent = "Write a message before sending.";
      return;
    }

    const messageType =
      communicationComposerMode === "email"
        ? "email"
        : communicationComposerMode === "note"
          ? "system-note"
          : "outgoing-text";
    const sent = addCommunicationMessage(conversation.lead.id, {
      type: messageType,
      direction: communicationComposerMode === "note" ? "system" : "outgoing",
      body,
      status: communicationComposerMode === "note" ? "Logged" : "Sent",
      attachments: communicationComposerMode === "email" ? [`${conversation.lead.company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-attachment.pdf`] : [],
      read: true,
    });
    clearCommunicationDraft(conversation.lead.id, communicationComposerMode);
    await store.createActivity({
      leadId: conversation.lead.id,
      type: "communication",
      message: `${communicationMessageTypeLabels[sent.type]} logged from Communications.`,
    });
    communicationsStatus.textContent = `${communicationMessageTypeLabels[sent.type]} sent for ${conversation.lead.name}.`;
    showCommunicationToast(`${communicationMessageTypeLabels[sent.type]} sent`, `${conversation.lead.name}'s timeline was updated.`);
    renderCommunicationsPage();
  }
}

function setComposerText(conversation, value) {
  const text = value || "";
  const input = messageComposer.querySelector("#communicationComposerInput");
  input.value = text;
  setCommunicationDraftValue(conversation.lead.id, communicationComposerMode, text);
}

function appendComposerText(conversation, value) {
  const input = messageComposer.querySelector("#communicationComposerInput");
  const next = `${input.value}${input.value ? " " : ""}${value}`;
  input.value = next;
  setCommunicationDraftValue(conversation.lead.id, communicationComposerMode, next);
}

function clearCommunicationDraft(leadId, mode) {
  const drafts = { ...communicationDraftState(), ...communicationDrafts };
  delete drafts[communicationDraftKey(leadId, mode)];
  saveCommunicationDraftState(drafts);
}

function personalizeCommunicationCopy(copy, conversation) {
  return String(copy || "")
    .replaceAll("{{name}}", conversation.lead.name)
    .replaceAll("{{company}}", conversation.lead.company)
    .replaceAll("{{projectType}}", conversation.profile.projectType.toLowerCase())
    .replaceAll("{{address}}", conversation.profile.address)
    .replaceAll("{{value}}", formatter.format(conversation.lead.value))
    .replaceAll("{{nextAction}}", conversation.lead.nextAction)
    .replaceAll("{{stage}}", stageLabel(conversation.lead.stage));
}

function startCommunicationCall(conversation) {
  communicationCallState = {
    active: true,
    leadId: conversation.lead.id,
    startedAt: Date.now(),
    muted: false,
    speaker: false,
    hold: false,
  };
  communicationsStatus.textContent = `Calling ${conversation.lead.name}.`;
  showCommunicationToast("Call started", `${conversation.profile.phone} is dialing.`);
  renderCallControls(conversation);
}

function endCommunicationCall(conversation) {
  if (!communicationCallState.active) return;
  const seconds = Math.max(1, Math.round((Date.now() - communicationCallState.startedAt) / 1000));
  addCommunicationMessage(conversation.lead.id, {
    type: "call-log",
    direction: "outgoing",
    body: `Call completed with ${conversation.lead.name}. Duration ${formatCallDuration(seconds)}.`,
    status: "Completed",
    attachments: [],
    read: true,
  });
  communicationCallState = {
    active: false,
    leadId: null,
    startedAt: null,
    muted: false,
    speaker: false,
    hold: false,
  };
  clearCommunicationCallTimer();
  communicationsStatus.textContent = `Call with ${conversation.lead.name} logged.`;
  showCommunicationToast("Call logged", `${formatCallDuration(seconds)} call added to the timeline.`);
  renderCommunicationsPage();
}

function handleCallControl(control, conversation) {
  if (control === "transfer") {
    communicationsStatus.textContent = "Transfer placeholder ready for connected phone provider.";
    showCommunicationToast("Transfer placeholder", "Transfer will connect once telephony is live.");
    return;
  }
  if (control === "record") {
    communicationsStatus.textContent = "Recording placeholder ready. Consent controls will be required before launch.";
    showCommunicationToast("Recording placeholder", "Call recording is displayed as a future integration.");
    return;
  }
  if (!communicationCallState.active || communicationCallState.leadId !== conversation.lead.id) return;
  communicationCallState = {
    ...communicationCallState,
    [control]: !communicationCallState[control],
  };
  renderCallControls(conversation);
}

async function handleCommunicationQuickAction(action, conversation) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(10, 0, 0, 0);

  if (action === "schedule-estimate") {
    await store.createAppointment({
      leadId: conversation.lead.id,
      leadName: conversation.lead.name,
      company: conversation.lead.company,
      startsAt: tomorrow.toISOString(),
      closer: "Avery Brooks",
      notes: `${conversation.profile.projectType} estimate from Communications quick action.`,
    });
    addCommunicationMessage(conversation.lead.id, {
      type: "appointment",
      direction: "system",
      body: `Schedule Estimate created for ${formatActivityDate(tomorrow.toISOString())}.`,
      status: "Booked",
    });
    communicationsStatus.textContent = "Estimate appointment scheduled.";
    showCommunicationToast("Estimate scheduled", `${conversation.lead.name} is booked for tomorrow.`);
  }

  if (action === "create-task") {
    await store.createTask({
      text: `Follow up with ${conversation.lead.name} about ${conversation.profile.projectType.toLowerCase()}`,
      done: false,
      due: "today",
    });
    addCommunicationMessage(conversation.lead.id, {
      type: "system-note",
      direction: "system",
      body: "Create Task quick action added a follow-up task for today.",
      status: "Logged",
    });
    communicationsStatus.textContent = "Task created from Communications.";
    showCommunicationToast("Task created", "Follow-up task added for today.");
  }

  if (action === "send-quote") {
    addCommunicationMessage(conversation.lead.id, {
      type: "email",
      direction: "outgoing",
      body: `Quote sent for ${conversation.profile.projectType.toLowerCase()} at ${conversation.profile.address}.`,
      status: "Sent",
      attachments: [`quote-${conversation.lead.id}.pdf`],
    });
    communicationsStatus.textContent = "Quote sent.";
    showCommunicationToast("Quote sent", `${conversation.lead.name}'s quote was added to the timeline.`);
  }

  if (action === "request-review") {
    addCommunicationMessage(conversation.lead.id, {
      type: "outgoing-text",
      direction: "outgoing",
      body: `Hi ${conversation.lead.name}, when the project wraps up, would you be open to leaving us a quick review?`,
      status: "Sent",
    });
    communicationsStatus.textContent = "Review request sent.";
    showCommunicationToast("Review requested", "Review request text sent.");
  }

  if (action === "collect-deposit") {
    addCommunicationMessage(conversation.lead.id, {
      type: "email",
      direction: "outgoing",
      body: `Deposit request sent for ${formatter.format(Math.round(conversation.lead.value * 0.2))}.`,
      status: "Sent",
      attachments: ["deposit-link-placeholder.txt"],
    });
    communicationsStatus.textContent = "Deposit request sent.";
    showCommunicationToast("Deposit request sent", "Payment collection placeholder logged.");
  }

  renderCommunicationsPage();
}

function syncCommunicationCallTimer() {
  clearCommunicationCallTimer();
  if (!communicationCallState.active) return;
  communicationCallTimer = window.setInterval(updateCommunicationCallTimerDisplay, 1000);
  updateCommunicationCallTimerDisplay();
}

function clearCommunicationCallTimer() {
  if (communicationCallTimer) {
    window.clearInterval(communicationCallTimer);
    communicationCallTimer = null;
  }
}

function updateCommunicationCallTimerDisplay() {
  const timer = document.querySelector("#communicationCallTimer");
  if (!timer || !communicationCallState.active) return;
  timer.textContent = activeCallDurationLabel();
}

function activeCallDurationLabel() {
  if (!communicationCallState.startedAt) return "00:00";
  return formatCallDuration(Math.max(0, Math.round((Date.now() - communicationCallState.startedAt) / 1000)));
}

function formatCallDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(2, "0")}`;
}

function showCommunicationToast(title, detail) {
  if (!communicationToastRegion) return;
  const toast = document.createElement("article");
  toast.className = "communication-toast";
  toast.innerHTML = `
    <strong>${escapeHtml(title)}</strong>
    <span>${escapeHtml(detail)}</span>
  `;
  communicationToastRegion.append(toast);
  window.setTimeout(() => {
    toast.classList.add("leaving");
    window.setTimeout(() => toast.remove(), 180);
  }, 4200);
}

function communicationTimestamp(daysAgo, hour, minute) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function formatConversationTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Now";
  if (isToday(value)) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }).format(date);
  }
  return formatShortDate(value);
}

function initialsForName(name) {
  return String(name || "CP")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function renderDialWorkspace() {
  const queue = dialQueueLeads();
  const unattempted = unattemptedDialLeads();
  const lead = activeDialLead();
  const appointments = state.appointments || [];
  const blocked = unattempted.length > 0;

  pullSafeLeadsButton.disabled = blocked;
  if (blocked) {
    leadGeneratorStatus.textContent = `Finish ${unattempted.length} pulled ${unattempted.length === 1 ? "lead" : "leads"} before pulling 5 more.`;
  }

  dialSummary.innerHTML = `
    <article>
      <span>Ready to call</span>
      <strong>${queue.length}</strong>
    </article>
    <article>
      <span>Needs attempt</span>
      <strong>${unattempted.length}</strong>
    </article>
    <article>
      <span>Appointments</span>
      <strong>${appointments.length}</strong>
    </article>
    <article>
      <span>Closers</span>
      <strong>${closerOptions().length}</strong>
    </article>
  `;

  renderAppointmentFields();
  renderDialTextLog();
  renderAppointmentTimePicker();
  renderCloserOptions();
  renderDialLead(lead);
  renderAppointments();
  renderDialSchedule();
  renderDialView();
}

function renderDialView() {
  document.querySelectorAll("[data-dial-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.dialView === dialView);
  });

  document.querySelectorAll("[data-dial-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.dialPanel !== dialView || activePage !== "dial";
  });
}

function renderDialLead(lead) {
  if (!lead) {
    dialActiveLead.innerHTML = `
      <div class="empty-state">
        <strong>No dialer lead selected.</strong>
        <span>Pull a safe lead batch or choose a new safe-generator lead from Contacts.</span>
      </div>
    `;
    dialOutcomeForm.querySelectorAll("input, select, textarea, button").forEach((field) => {
      field.disabled = true;
    });
    return;
  }

  dialOutcomeForm.querySelectorAll("input, select, textarea, button").forEach((field) => {
    field.disabled = false;
  });

  const details = dialLeadDetails(lead);
  dialActiveLead.innerHTML = `
    <div class="dial-lead-hero">
      <div>
        <p class="eyebrow">Active call</p>
        <h3>${escapeHtml(lead.name)}</h3>
        <span>${escapeHtml(lead.company)}</span>
      </div>
      <strong>${lead.score}/100</strong>
    </div>
    <div class="dial-info-grid">
      <article>
        <span>Phone</span>
        <strong>${escapeHtml(details.phone || "No phone")}</strong>
      </article>
      <article>
        <span>Email</span>
        <strong>${escapeHtml(details.email || "No email")}</strong>
      </article>
      <article>
        <span>Source</span>
        <strong>${escapeHtml(lead.source)}</strong>
      </article>
      <article>
        <span>Status</span>
        <strong>${escapeHtml(stageLabel(lead.stage))}</strong>
      </article>
      <article>
        <span>County</span>
        <strong>${escapeHtml(details.county || "Unknown")}</strong>
      </article>
      <article>
        <span>Parcel</span>
        <strong>${escapeHtml(details.parcel || "Unknown")}</strong>
      </article>
    </div>
    <section class="dial-script-card">
      <p class="eyebrow">Call prep</p>
      <p>${escapeHtml(lead.nextAction || "Call and qualify interest, timing, and decision maker.")}</p>
      <small>${escapeHtml(details.compliance || "Use approved calling rules and internal opt-out process.")}</small>
    </section>
    <section class="dial-script-card">
      <p class="eyebrow">Lead notes</p>
      <pre>${escapeHtml(lead.notes || "No notes yet.")}</pre>
    </section>
  `;
}

function renderAppointmentFields() {
  appointmentFields.hidden = dialOutcomeInput.value !== "Appointment set";
}

function renderDialTextLog() {
  const needsText = dialContactMethodInput.value.includes("Text");
  dialTextLog.hidden = !needsText;
  dialTextMessageInput.required = needsText;
}

function renderAppointmentTimePicker() {
  appointmentTimePicker.innerHTML = appointmentTimes
    .map(
      (time) => `
        <button class="time-button ${time.value === selectedAppointmentTime ? "active" : ""}" data-appointment-time="${time.value}" type="button">
          ${time.label}
        </button>
      `,
    )
    .join("");

  appointmentTimePicker.querySelectorAll("[data-appointment-time]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedAppointmentTime = button.dataset.appointmentTime;
      renderAppointmentTimePicker();
    });
  });
}

function renderCloserOptions() {
  const closers = closerOptions();
  appointmentCloserInput.innerHTML = closers
    .map((closer) => `<option value="${escapeHtml(closer.email)}">${escapeHtml(closer.email)}</option>`)
    .join("");
}

function renderAppointments() {
  const appointments = [...(state.appointments || [])].sort((left, right) =>
    String(left.startsAt).localeCompare(String(right.startsAt)),
  );

  appointmentList.innerHTML = appointments.length
    ? appointments
        .map((appointment) => {
          const lead = state.leads.find((item) => item.id === appointment.leadId);
          return `
            <article class="appointment-row">
              <div>
                <strong>${escapeHtml(lead?.company || appointment.leadName || "Appointment")}</strong>
                <span>${escapeHtml(appointment.contactName)} · ${escapeHtml(appointment.assignedTo)}</span>
              </div>
              <time>${formatAppointmentDate(appointment.startsAt)}</time>
            </article>
          `;
        })
        .join("")
    : "<p class=\"empty-state\">No appointments booked yet.</p>";
}

function renderDialSchedule() {
  const schedule = normalizedSchedule(state.schedule);
  dialScheduleGrid.innerHTML = `
    <div class="schedule-corner">Day</div>
    ${scheduleHours.map((hour) => `<div class="schedule-hour">${scheduleHourLabel(hour)}</div>`).join("")}
    ${scheduleDays
      .map(
        (day) => `
          <div class="schedule-day">${day}</div>
          ${scheduleHours
            .map((hour) => {
              const key = scheduleKey(day, hour);
              const active = schedule[key];
              return `<button class="schedule-cell ${active ? "active" : ""}" data-schedule-key="${key}" type="button" aria-label="${day} ${scheduleHourLabel(hour)}">${active ? "On" : ""}</button>`;
            })
            .join("")}
        `,
      )
      .join("")}
  `;

  dialScheduleGrid.querySelectorAll("[data-schedule-key]").forEach((button) => {
    button.addEventListener("click", async () => {
      const key = button.dataset.scheduleKey;
      const next = normalizedSchedule(state.schedule);
      next[key] = !next[key];
      await store.updateSchedule(next);
      scheduleMessage.textContent = "Schedule updated.";
      await reloadState();
    });
  });
}

function renderCalendar() {
  document.querySelectorAll("[data-calendar-view]").forEach((button) => {
    button.classList.toggle("active", button.dataset.calendarView === calendarView);
  });

  const appointments = calendarAppointments();
  if (!appointments.length) {
    calendarBoard.innerHTML = "<p class=\"empty-state\">No appointments booked yet.</p>";
    return;
  }

  calendarBoard.innerHTML = appointments
    .map((appointment) => {
      const lead = state.leads.find((item) => item.id === appointment.leadId);
      return `
        <article class="calendar-appointment">
          <time>${formatAppointmentDate(appointment.startsAt)}</time>
          <div>
            <strong>${escapeHtml(lead?.company || appointment.leadName || "Appointment")}</strong>
            <span>${escapeHtml(appointment.contactName)} · ${escapeHtml(appointment.assignedTo)}</span>
            ${appointment.notes ? `<p>${escapeHtml(appointment.notes)}</p>` : ""}
          </div>
        </article>
      `;
    })
    .join("");
}

function calendarAppointments() {
  const appointments = [...(state.appointments || [])].sort((left, right) =>
    String(left.startsAt).localeCompare(String(right.startsAt)),
  );
  if (calendarView !== "mine") return appointments;
  const mine = currentCloserEmail();
  return appointments.filter((appointment) => appointment.assignedTo === mine);
}

function currentCloserEmail() {
  return currentUser?.email || workspaceSetupSettings().ownerEmail || accountState().members[0]?.email || "owner@kira.local";
}

function scheduleHourLabel(hour) {
  if (hour === 12) return "12 PM";
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
}

function scheduleKey(day, hour) {
  return `${day}-${hour}`;
}

function dialQueueLeads() {
  return state.leads.filter((lead) => lead.source === "Safe lead generator" && lead.stage === "new");
}

function unattemptedDialLeads() {
  const attempted = attemptedDialLeadIds();
  return dialQueueLeads().filter((lead) => !attempted.has(lead.id));
}

function attemptedDialLeadIds() {
  return new Set(
    (state.activities || [])
      .filter((activity) => ["call", "text", "outcome"].includes(activity.type))
      .map((activity) => activity.leadId)
      .filter(Boolean),
  );
}

function activeDialLead() {
  return (
    unattemptedDialLeads().find((lead) => lead.id === state.selectedLeadId) ||
    unattemptedDialLeads()[0] ||
    state.leads.find((lead) => lead.id === state.selectedLeadId && lead.source === "Safe lead generator") ||
    state.leads.find((lead) => lead.source === "Safe lead generator") ||
    null
  );
}

function dialLeadDetails(lead) {
  const lines = String(lead.notes || "").split(/\n+/);
  return Object.fromEntries(
    ["phone", "email", "county", "parcel", "compliance"].map((key) => [
      key,
      lines
        .find((line) => line.toLowerCase().startsWith(`${key}:`))
        ?.replace(/^[^:]+:\s*/, "")
        .trim() || "",
    ]),
  );
}

async function saveDialOutcome(event) {
  event.preventDefault();
  const lead = activeDialLead();
  if (!lead) return;

  const outcome = dialOutcomeInput.value;
  const method = dialContactMethodInput.value;
  const note = dialNotesInput.value.trim();
  const exactText = dialTextMessageInput.value.trim();
  const message = note ? `${outcome}: ${note}` : outcome;

  if (method.includes("Text") && !exactText) {
    dialMessage.textContent = "Log the exact text message before saving a text attempt.";
    return;
  }

  if (outcome === "Appointment set" && !appointmentDateInput.value) {
    dialMessage.textContent = "Choose an appointment date.";
    return;
  }

  const activities = [];
  if (method.includes("Call")) {
    activities.push({
      leadId: lead.id,
      type: "call",
      message: `Call logged - ${message}`,
    });
  }
  if (method.includes("Text")) {
    activities.push({
      leadId: lead.id,
      type: "text",
      message: `Text logged - ${exactText}`,
    });
  }
  if (outcome === "Appointment set") {
    activities.push({
      leadId: lead.id,
      type: "outcome",
      message: `Appointment set - ${note || "No extra notes."}`,
    });
  }

  for (const activity of activities) {
    await store.createActivity(activity);
  }

  let updatedLead = {
    ...lead,
    nextAction: nextDialAction(outcome),
    notes: [
      lead.notes,
      `Dial method: ${method}`,
      `Dial outcome: ${message}`,
      exactText ? `Exact text sent: ${exactText}` : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };

  if (outcome === "Appointment set") {
    const assignedTo = nextRoundRobinCloser().email;
    await store.createAppointment({
      leadId: lead.id,
      leadName: lead.company,
      contactName: lead.name,
      assignedTo,
      startsAt: appointmentStartsAt().toISOString(),
      notes: note,
      outcome,
    });
    updatedLead = {
      ...updatedLead,
      stage: "qualified",
      nextAction: `Appointment booked with ${assignedTo}.`,
    };
    await store.createTask({
      text: `Prepare appointment with ${lead.name} at ${lead.company}`,
      done: false,
      due: "today",
    });
  }

  await store.updateLead(updatedLead);
  const nextLead = unattemptedDialLeads().find((item) => item.id !== updatedLead.id);
  state.selectedLeadId = nextLead?.id || updatedLead.id;
  dialNotesInput.value = "";
  dialTextMessageInput.value = "";
  appointmentDateInput.value = "";
  dialContactMethodInput.value = "Call";
  dialOutcomeInput.value = "No answer";
  dialMessage.textContent =
    outcome === "Appointment set" ? "Appointment booked and assigned round robin." : "Outcome saved.";
  await reloadState();
}

function appointmentStartsAt() {
  return new Date(`${appointmentDateInput.value}T${selectedAppointmentTime}:00`);
}

function nextDialAction(outcome) {
  const actions = {
    "No answer": "Try another call attempt later today.",
    "Left voicemail": "Follow up after voicemail.",
    "Call back requested": "Call back at the requested time.",
    "Not interested": "Review for nurture or close out.",
    "Bad number": "Verify contact info before another call.",
    "Appointment set": "Appointment booked.",
  };
  return actions[outcome] || "Follow up from dial outcome.";
}

function closerOptions() {
  const active = accountState().members.filter((member) => member.status === "active");
  return active.length
    ? active.map((member) => ({ email: member.email, role: member.role }))
    : [{ email: workspaceSetupSettings().ownerEmail, role: "owner" }];
}

function nextRoundRobinCloser() {
  const closers = closerOptions();
  const key = roundRobinKey();
  const index = Number(localStorage.getItem(key) || 0);
  const closer = closers[index % closers.length];
  localStorage.setItem(key, String((index + 1) % closers.length));
  return closer;
}

function roundRobinKey() {
  return `closepilot-round-robin:${workspaceSetupSettings().name}`;
}

function formatAppointmentDate(value) {
  if (!value) return "Unscheduled";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unscheduled";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function renderTasks() {
  renderTaskFilterCounts();
  const tasks = sortedTasks(filteredTasks());
  syncSelectedTasks(tasks);
  updateTaskSelectionControls();
  taskSortInput.value = taskSort;
  completeVisibleTasksButton.disabled = !tasks.some((task) => !task.done);
  snoozeVisibleTasksButton.disabled = !tasks.some((task) => !task.done && task.due !== "tomorrow");
  taskList.innerHTML = tasks.length
    ? tasks
    .map(
      (task) => `
      <article class="task-item ${task.done ? "done" : ""}" data-task-row="${task.id}">
        <label class="task-select">
          <input data-task-select="${task.id}" type="checkbox" ${selectedTaskIds.has(task.id) ? "checked" : ""} aria-label="Select task ${escapeHtml(task.text)}" />
        </label>
        <input data-task-done="${task.id}" type="checkbox" ${task.done ? "checked" : ""} aria-label="Mark task complete" />
        <p>${escapeHtml(task.text)}<span>${task.due}</span></p>
        <div class="task-actions">
          <button data-edit-task="${task.id}" type="button">Edit</button>
          <button data-duplicate-task="${task.id}" type="button">Duplicate</button>
          <button data-delete-task="${task.id}" type="button">Delete</button>
        </div>
      </article>
    `,
    )
    .join("")
    : "<p class=\"empty-state\">No tasks in this view.</p>";

  document.querySelectorAll("[data-task-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.taskFilter === taskFilter);
  });

  taskList.querySelectorAll("[data-task-select]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selectedTaskIds.add(checkbox.dataset.taskSelect);
      } else {
        selectedTaskIds.delete(checkbox.dataset.taskSelect);
      }
      updateTaskSelectionControls();
    });
  });

  taskList.querySelectorAll("[data-task-done]").forEach((checkbox) => {
    checkbox.addEventListener("change", async () => {
      const task = state.tasks.find((item) => item.id === checkbox.dataset.taskDone);
      await store.updateTask({ ...task, done: checkbox.checked });
      await reloadState();
    });
  });

  taskList.querySelectorAll("[data-delete-task]").forEach((button) => {
    button.addEventListener("click", async () => {
      await store.deleteTask(button.dataset.deleteTask);
      await reloadState();
    });
  });

  taskList.querySelectorAll("[data-duplicate-task]").forEach((button) => {
    button.addEventListener("click", async () => {
      await duplicateTask(button.dataset.duplicateTask);
    });
  });

  taskList.querySelectorAll("[data-edit-task]").forEach((button) => {
    button.addEventListener("click", () => {
      renderTaskEditForm(button.dataset.editTask);
    });
  });
}

async function clearDoneTasks() {
  const doneTasks = state.tasks.filter((task) => task.done);
  if (!doneTasks.length) return;

  await Promise.all(doneTasks.map((task) => store.deleteTask(task.id)));
  await reloadState();
}

function syncSelectedTasks(tasks) {
  const visibleIds = new Set(tasks.map((task) => task.id));
  selectedTaskIds = new Set([...selectedTaskIds].filter((id) => visibleIds.has(id)));
}

function updateTaskSelectionControls() {
  const count = selectedTaskIds.size;
  const hasSelection = count > 0;
  const tasks = selectedTasks();
  const hasOpenSelection = tasks.some((task) => !task.done);
  const hasSnoozableSelection = tasks.some((task) => !task.done && task.due !== "tomorrow");
  clearSelectedTasksButton.disabled = !hasSelection;
  exportSelectedTasksButton.disabled = !hasSelection;
  completeSelectedTasksButton.disabled = !hasOpenSelection;
  snoozeSelectedTasksButton.disabled = !hasSnoozableSelection;
  selectedTaskDueInput.disabled = !hasSelection;
  applySelectedTaskDueButton.disabled = !hasSelection;
  duplicateSelectedTasksButton.disabled = !hasSelection;
  deleteSelectedTasksButton.disabled = !hasSelection;
  taskSelectionStatus.textContent = `${count} selected`;
  exportSelectedTasksButton.textContent = `Export selected tasks (${count})`;
  completeSelectedTasksButton.textContent = `Complete selected (${count})`;
  snoozeSelectedTasksButton.textContent = `Snooze selected (${count})`;
  applySelectedTaskDueButton.textContent = `Apply due date (${count})`;
  duplicateSelectedTasksButton.textContent = `Duplicate selected (${count})`;
  deleteSelectedTasksButton.textContent = `Delete selected (${count})`;
}

function selectVisibleTasks() {
  sortedTasks(filteredTasks()).forEach((task) => selectedTaskIds.add(task.id));
  renderTasks();
}

function clearSelectedTasks() {
  selectedTaskIds.clear();
  renderTasks();
}

async function completeVisibleTasks() {
  const openTasks = filteredTasks().filter((task) => !task.done);
  if (!openTasks.length) return;

  await Promise.all(openTasks.map((task) => store.updateTask({ ...task, done: true })));
  await reloadState();
}

async function snoozeVisibleTasks() {
  const openTasks = filteredTasks().filter((task) => !task.done && task.due !== "tomorrow");
  if (!openTasks.length) return;

  await Promise.all(openTasks.map((task) => store.updateTask({ ...task, due: "tomorrow" })));
  await reloadState();
}

async function completeSelectedTasks() {
  const tasks = selectedTasks().filter((task) => !task.done);
  if (!tasks.length) return;

  await Promise.all(tasks.map((task) => store.updateTask({ ...task, done: true })));
  selectedTaskIds.clear();
  await reloadState();
}

async function snoozeSelectedTasks() {
  const tasks = selectedTasks().filter((task) => !task.done && task.due !== "tomorrow");
  if (!tasks.length) return;

  await Promise.all(tasks.map((task) => store.updateTask({ ...task, due: "tomorrow" })));
  selectedTaskIds.clear();
  await reloadState();
}

async function applySelectedTaskDue() {
  const tasks = selectedTasks();
  if (!tasks.length) return;

  await Promise.all(tasks.map((task) => store.updateTask({ ...task, due: selectedTaskDueInput.value })));
  selectedTaskIds.clear();
  await reloadState();
}

async function duplicateTask(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  if (!task) return;

  await store.createTask({ text: task.text, done: false, due: task.due });
  await reloadState();
}

async function duplicateSelectedTasks() {
  const tasks = selectedTasks();
  if (!tasks.length) return;

  await Promise.all(tasks.map((task) => store.createTask({ text: task.text, done: false, due: task.due })));
  selectedTaskIds.clear();
  await reloadState();
}

async function deleteSelectedTasks() {
  const tasks = selectedTasks();
  if (!tasks.length) return;

  await Promise.all(tasks.map((task) => store.deleteTask(task.id)));
  selectedTaskIds.clear();
  await reloadState();
}

function selectedTasks() {
  return [...selectedTaskIds]
    .map((taskId) => state.tasks.find((task) => task.id === taskId))
    .filter(Boolean);
}

function exportVisibleTasksCsv() {
  const tasks = sortedTasks(filteredTasks());
  if (!tasks.length) return;
  downloadTasksCsv(tasks, "closepilot-visible-tasks.csv");
}

function exportSelectedTasksCsv() {
  const tasks = selectedTasks();
  if (!tasks.length) return;
  downloadTasksCsv(tasks, "closepilot-selected-tasks.csv");
}

function downloadTasksCsv(tasks, filename) {
  const headers = ["text", "due", "done"];
  const rows = tasks.map((task) => headers.map((header) => csvEscape(task[header])).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function renderTaskEditForm(taskId) {
  const task = state.tasks.find((item) => item.id === taskId);
  const taskRow = taskList.querySelector(`[data-task-row="${taskId}"]`);
  if (!task || !taskRow) return;

  taskRow.className = "task-item editing";
  taskRow.innerHTML = `
    <form class="task-edit-form" data-task-edit-form="${task.id}">
      <input data-task-edit-text="${task.id}" type="text" value="${escapeHtml(task.text)}" aria-label="Task text" required />
      <select data-task-edit-due="${task.id}" aria-label="Edit task due date">
        ${renderTaskDueOptions(task.due)}
      </select>
      <button class="primary-button" type="submit">Save</button>
      <button class="secondary-button" data-cancel-task-edit="${task.id}" type="button">Cancel</button>
    </form>
  `;

  const editForm = taskRow.querySelector("[data-task-edit-form]");
  editForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const text = taskRow.querySelector("[data-task-edit-text]").value.trim();
    const due = taskRow.querySelector("[data-task-edit-due]").value;
    if (!text) return;

    await store.updateTask({ ...task, text, due });
    await reloadState();
  });

  taskRow.querySelector("[data-cancel-task-edit]").addEventListener("click", renderTasks);
}

function renderTaskDueOptions(selectedDue) {
  return taskDueChoices
    .map(
      (choice) => `
        <option value="${choice.value}" ${choice.value === selectedDue ? "selected" : ""}>${choice.label}</option>
      `,
    )
    .join("");
}

function filteredTasks() {
  const tasks = state.tasks.filter(taskSearchMatches);
  if (taskFilter === "all") return tasks;
  if (taskFilter === "done") return tasks.filter((task) => task.done);
  if (taskFilter === "upcoming") return tasks.filter((task) => !task.done && task.due !== "today");
  return tasks.filter((task) => !task.done && task.due === "today");
}

function sortedTasks(tasks) {
  const sortable = [...tasks];
  const dueOrder = new Map(taskDueChoices.map((choice, index) => [choice.value, index]));
  if (taskSort === "due") {
    return sortable.sort(
      (left, right) =>
        (dueOrder.get(left.due) ?? taskDueChoices.length) -
          (dueOrder.get(right.due) ?? taskDueChoices.length) ||
        left.text.localeCompare(right.text),
    );
  }
  if (taskSort === "text") {
    return sortable.sort((left, right) => left.text.localeCompare(right.text));
  }
  if (taskSort === "status") {
    return sortable.sort((left, right) => Number(left.done) - Number(right.done) || left.text.localeCompare(right.text));
  }
  return sortable;
}

function taskSearchMatches(task) {
  const query = taskSearchInput.value.trim().toLowerCase();
  return !query || task.text.toLowerCase().includes(query);
}

function renderTaskFilterCounts() {
  const searchableTasks = state.tasks.filter(taskSearchMatches);
  const openTasks = searchableTasks.filter((task) => !task.done);
  const doneTasks = searchableTasks.filter((task) => task.done);
  const todayTasks = openTasks.filter((task) => task.due === "today");
  const upcomingTasks = openTasks.filter((task) => task.due !== "today");

  document.querySelector("#taskCountToday").textContent = todayTasks.length;
  document.querySelector("#taskCountUpcoming").textContent = upcomingTasks.length;
  document.querySelector("#taskCountDone").textContent = doneTasks.length;
  document.querySelector("#taskCountAll").textContent = searchableTasks.length;
  clearDoneTasksButton.disabled = state.tasks.filter((task) => task.done).length === 0;
  renderTaskSummary({
    today: todayTasks.length,
    upcoming: upcomingTasks.length,
    done: doneTasks.length,
    total: searchableTasks.length,
  });
}

function renderTaskSummary(summary) {
  taskSummary.innerHTML = `
    <article>
      <span>Due today</span>
      <strong>${summary.today}</strong>
    </article>
    <article>
      <span>Upcoming</span>
      <strong>${summary.upcoming}</strong>
    </article>
    <article>
      <span>Completed</span>
      <strong>${summary.done}</strong>
    </article>
    <article>
      <span>Total tasks</span>
      <strong>${summary.total}</strong>
    </article>
  `;
}

async function seedStarterWorkspace() {
  seedWorkspaceButton.disabled = true;
  seedWorkspaceButton.textContent = "Loading...";
  await saveWorkspaceSetup();
  await store.seedStarterData();
  localStorage.removeItem(onboardingDismissalKey());
  await reloadState();
  seedWorkspaceButton.disabled = false;
  seedWorkspaceButton.textContent = "Load starter pipeline";
}

async function dismissOnboarding() {
  await saveWorkspaceSetup();
  if (state.leads.length === 0) {
    await store.clearWorkspaceData();
    state.selectedLeadId = null;
  }
  localStorage.setItem(onboardingDismissalKey(), "true");
  await reloadState();
}

function onboardingDismissalKey() {
  return currentUser ? `closepilot-onboarding-dismissed-${currentUser.id}` : "closepilot-onboarding-dismissed-demo";
}

function workspaceSetupKey() {
  return currentUser ? `closepilot-workspace-setup-${currentUser.id}` : "closepilot-workspace-setup-demo";
}

function revenueTargetKey() {
  return currentUser ? `closepilot-revenue-target-${currentUser.id}` : "closepilot-revenue-target-demo";
}

function communicationMessagesKey() {
  return currentUser ? `closepilot-communication-messages-${currentUser.id}` : "closepilot-communication-messages-demo";
}

function communicationDraftsKey() {
  return currentUser ? `closepilot-communication-drafts-${currentUser.id}` : "closepilot-communication-drafts-demo";
}

function cloudSaasAccountKey(workspaceId) {
  return `closepilot-saas-account-${workspaceId}`;
}

function cloudAutomationTemplatesKey(workspaceId) {
  return `closepilot-automation-templates-${workspaceId}`;
}

function cloudAutomationRunsKey(workspaceId) {
  return `closepilot-automation-runs-${workspaceId}`;
}

function cloudAppointmentsKey(workspaceId) {
  return `closepilot-appointments-${workspaceId}`;
}

function cloudScheduleKey(workspaceId) {
  return `closepilot-schedule-${workspaceId}`;
}

function revenueTarget() {
  const saved = Number(localStorage.getItem(revenueTargetKey()));
  return Number.isFinite(saved) && saved > 0 ? saved : 30000;
}

function workspaceSetupSettings() {
  const account = accountState();
  const fallback = {
    name: state.workspaceName || "Personal workspace",
    type: "Personal",
    goal: "Close more follow-ups",
    ownerEmail: currentUser?.email || account.members[0]?.email || "owner@kira.local",
    industry: "Local services",
    timezone: "America/Chicago",
    defaultSource: "Website",
  };
  const saved = localStorage.getItem(workspaceSetupKey());
  if (!saved) return fallback;
  try {
    return { ...fallback, ...JSON.parse(saved) };
  } catch {
    return fallback;
  }
}

async function saveWorkspaceSetup() {
  const existing = workspaceSetupSettings();
  const settings = {
    ...existing,
    name: setupBusinessName.value.trim() || "Personal workspace",
    type: setupWorkspaceType.value,
    goal: setupSalesGoal.value,
  };
  await persistWorkspaceSetup(settings);
}

async function persistWorkspaceSetup(settings) {
  localStorage.setItem(workspaceSetupKey(), JSON.stringify(settings));
  await store.updateWorkspaceSettings(settings);
}

async function saveAdminWorkspaceSettings(event) {
  event.preventDefault();
  const settings = {
    ...workspaceSetupSettings(),
    name: adminBusinessName.value.trim() || "Personal workspace",
    type: adminWorkspaceType.value,
    goal: adminSalesGoal.value,
    ownerEmail: adminOwnerEmail.value.trim() || "owner@kira.local",
    industry: adminIndustry.value.trim() || "Local services",
    timezone: adminTimezone.value,
    defaultSource: adminDefaultSource.value.trim() || "Website",
  };
  setupBusinessName.value = settings.name;
  setupWorkspaceType.value = settings.type;
  setupSalesGoal.value = settings.goal;
  await persistWorkspaceSetup(settings);
  await logAuditEvent("Workspace updated", `${settings.name} profile saved for ${settings.industry}.`);
  adminMessage.textContent = "Workspace settings saved.";
  await reloadState();
}

async function changeSubscriptionPlan(planId) {
  const plan = planCatalog[planId];
  if (!plan) return;

  const account = accountState();
  await store.updateSaasAccount({
    ...account,
    subscription: {
      ...account.subscription,
      plan: planId,
      status: "active",
      seatLimit: plan.seatLimit,
    },
  });
  await logAuditEvent("Plan changed", `${plan.label} plan selected.`);
  adminMessage.textContent = `${plan.label} plan selected. Connect Stripe before charging customers.`;
  await reloadState();
}

async function openCheckout() {
  if (config.stripeCheckoutUrl) {
    window.open(config.stripeCheckoutUrl, "_blank", "noopener");
    adminMessage.textContent = "Stripe checkout opened.";
    await logAuditEvent("Checkout opened", "Billing checkout link opened.");
    await reloadState();
    return;
  }

  adminMessage.textContent = "Add STRIPE_CHECKOUT_URL to enable live checkout.";
}

async function openBillingPortal() {
  if (config.stripePortalUrl) {
    window.open(config.stripePortalUrl, "_blank", "noopener");
    adminMessage.textContent = "Billing portal opened.";
    await logAuditEvent("Billing portal opened", "Customer portal link opened.");
    await reloadState();
    return;
  }

  adminMessage.textContent = "Add STRIPE_PORTAL_URL to enable the customer portal.";
}

async function inviteTeamMember(event) {
  event.preventDefault();
  const email = inviteEmail.value.trim().toLowerCase();
  if (!email) return;

  const account = accountState();
  const usedSeats =
    account.members.filter((member) => member.status === "active").length +
    account.invites.filter((invite) => invite.status === "pending").length;
  if (usedSeats >= account.subscription.seatLimit) {
    adminMessage.textContent = "Seat limit reached. Upgrade the plan before inviting more people.";
    return;
  }

  await store.createTeamInvite({
    email,
    role: inviteRole.value,
    status: "pending",
  });
  await logAuditEvent("Invite staged", `${email} invited as ${inviteRole.value}.`);
  inviteEmail.value = "";
  inviteRole.value = "member";
  adminMessage.textContent = `Invite staged for ${email}. Connect email delivery before sending live invites.`;
  await reloadState();
}

async function sendInviteEmail(inviteId) {
  const invite = accountState().invites.find((item) => item.id === inviteId);
  if (!invite) return;

  const subject = encodeURIComponent("You're invited to Kira Home");
  const body = encodeURIComponent(
    `You've been invited as a ${invite.role} in Kira Home.\n\nOpen the app and create your account to join the workspace.`,
  );
  const mailto = `mailto:${invite.email}?subject=${subject}&body=${body}`;
  window.location.href = mailto;
  await logAuditEvent("Invite email prepared", `${invite.email} mail link opened.`);
  adminMessage.textContent = `Email draft opened for ${invite.email}.`;
  await reloadState();
}

async function logAuditEvent(action, detail) {
  await store.createAuditEvent({
    action,
    detail,
  });
}

function saveRevenueTarget(event) {
  event.preventDefault();
  const value = Math.max(0, Number(revenueTargetInput.value || 0));
  const target = Number.isFinite(value) && value > 0 ? Math.round(value) : 30000;
  localStorage.setItem(revenueTargetKey(), String(target));
  revenueGoalMessage.textContent = `Monthly target saved at ${formatter.format(target)}.`;
  renderRevenueGoal();
}

async function addAutomatedTask(text) {
  const automation = state.automations.find((item) => item.key === "next-step-tasks");
  if (!automation?.enabled) return;
  await store.createTask({ text, done: false, due: "today" });
}

async function createFollowUpFromLead(leadId) {
  const lead = state.leads.find((item) => item.id === leadId);
  if (!lead) return;

  state.selectedLeadId = leadId;
  setActivePage("pipeline");
  await createFollowUpTaskForLead(lead);
  await reloadState();
}

async function createTasksForSelectedContacts() {
  const selectedLeads = [...selectedContactIds]
    .map((leadId) => state.leads.find((lead) => lead.id === leadId))
    .filter(Boolean);
  if (!selectedLeads.length) return;

  state.selectedLeadId = selectedLeads[selectedLeads.length - 1].id;
  setActivePage("pipeline");
  await Promise.all(selectedLeads.map(createFollowUpTaskForLead));
  selectedContactIds.clear();
  await reloadState();
}

async function markSelectedContactsWon() {
  const selectedLeads = [...selectedContactIds]
    .map((leadId) => state.leads.find((lead) => lead.id === leadId))
    .filter(Boolean);
  if (!selectedLeads.length) return;

  state.selectedLeadId = selectedLeads[selectedLeads.length - 1].id;
  setActivePage("pipeline");
  await Promise.all(selectedLeads.map((lead) => applyLeadOutcome(lead, "won")));
  selectedContactIds.clear();
  await reloadState();
}

async function moveSelectedContactsNext() {
  const selectedLeads = [...selectedContactIds]
    .map((leadId) => state.leads.find((lead) => lead.id === leadId))
    .filter(Boolean);
  if (!selectedLeads.length) return;

  state.selectedLeadId = selectedLeads[selectedLeads.length - 1].id;
  setActivePage("pipeline");
  await Promise.all(selectedLeads.map((lead) => applyStageMove(lead, 1)));
  selectedContactIds.clear();
  await reloadState();
}

async function createFollowUpTaskForLead(lead) {
  await store.createTask({
    text: `${lead.nextAction} (${lead.company})`,
    done: false,
    due: "today",
  });
  await store.createActivity({
    leadId: lead.id,
    type: "task",
    message: "Follow-up task added.",
  });
}

async function startFollowUpSequence(leadId) {
  const lead = state.leads.find((item) => item.id === leadId);
  if (!lead) return;

  const steps = sequenceStepsForLead(lead);
  await Promise.all(
    steps.map((step) =>
      store.createTask({
        text: step.text,
        done: false,
        due: step.due,
      }),
    ),
  );
  await store.createActivity({
    leadId,
    type: "sequence",
    message: `${steps.length}-step follow-up sequence started.`,
  });
  await reloadState();
}

async function applyAssistantSuggestion(leadId) {
  const lead = state.leads.find((item) => item.id === leadId);
  if (!lead) return;

  const insight = salesAssistantForLead(lead);
  await store.updateLead({
    ...lead,
    nextAction: insight.action,
  });
  await store.createTask({
    text: `${insight.action} (${lead.company})`,
    done: false,
    due: insight.due,
  });
  await store.createActivity({
    leadId,
    type: "assistant",
    message: "Sales assistant suggestion applied.",
  });
  state.selectedLeadId = lead.id;
  await reloadState();
}

async function updateLeadOutcome(leadId, outcome) {
  const lead = state.leads.find((item) => item.id === leadId);
  if (!lead) return;

  state.selectedLeadId = lead.id;
  setActivePage("pipeline");
  await applyLeadOutcome(lead, outcome);
  await reloadState();
}

async function applyLeadOutcome(lead, outcome) {
  const won = outcome === "won";
  const updatedLead = {
    ...lead,
    stage: won ? "won" : "proposal",
    score: won ? 99 : Math.max(70, lead.score - 8),
    nextAction: won
      ? "Send onboarding checklist and request kickoff details."
      : `Reconfirm timeline and pricing with ${lead.name}.`,
  };

  await store.updateLead(updatedLead);
  await store.createActivity({
    leadId: lead.id,
    type: "outcome",
    message: won ? "Deal marked Won." : "Deal reopened to Proposal.",
  });
  await store.createTask({
    text: won
      ? `Send onboarding checklist to ${lead.company}`
      : `Reconfirm next steps with ${lead.name} at ${lead.company}`,
    done: false,
    due: "today",
  });
  await runAutomationTrigger(won ? "won-deal" : "stage-proposal", updatedLead);
}

async function addLeadNote(leadId, note) {
  const text = note.trim();
  if (!text) return;

  await store.createActivity({
    leadId,
    type: "note",
    message: `Note: ${text}`,
  });
  state.selectedLeadId = leadId;
  await reloadState();
}

async function updateLeadNextAction(leadId, nextAction) {
  const text = nextAction.trim();
  const lead = state.leads.find((item) => item.id === leadId);
  if (!lead || !text) return;

  await store.updateLead({
    ...lead,
    nextAction: text,
    score: clampScore(lead.score + 2),
  });
  await store.createActivity({
    leadId,
    type: "edited",
    message: `Next action updated: ${text}`,
  });
  state.selectedLeadId = leadId;
  await reloadState();
}

async function deleteLead(leadId) {
  const lead = state.leads.find((item) => item.id === leadId);
  if (lead) {
    await store.createActivity({
      leadId,
      type: "deleted",
      message: `Lead deleted for ${lead.company}.`,
    });
  }
  await store.deleteLead(leadId);
  state.selectedLeadId = state.leads.find((lead) => lead.id !== leadId)?.id || null;
  await reloadState();
}

function exportLeadsCsv() {
  downloadLeadsCsv(state.leads, "closepilot-leads.csv");
}

function exportSelectedContactsCsv() {
  const leads = selectedContactLeads();
  if (!leads.length) return;
  downloadLeadsCsv(leads, "closepilot-selected-leads.csv");
}

function exportSourceReportCsv() {
  const rows = sourcePerformanceRows();
  if (!rows.length) return;

  const headers = ["source", "leads", "value", "weighted", "averageScore", "topLead"];
  const csvRows = rows.map((row) =>
    [
      row.source,
      row.count,
      row.value,
      Math.round(row.weighted),
      row.averageScore,
      row.topLead.company,
    ]
      .map(csvEscape)
      .join(","),
  );
  const csv = [headers.join(","), ...csvRows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "closepilot-source-report.csv";
  link.click();
  URL.revokeObjectURL(url);
}

function exportWorkspaceBackup() {
  const payload = {
    app: "Kira Home",
    version: 1,
    exportedAt: new Date().toISOString(),
    workspace: workspaceSetupSettings(),
    data: {
      leads: state.leads,
      tasks: state.tasks,
      automations: state.automations,
      automationTemplates: state.automationTemplates,
      automationRuns: state.automationRuns || [],
      appointments: state.appointments || [],
      schedule: normalizedSchedule(state.schedule),
      activities: state.activities || [],
      account: accountState(),
    },
  };

  downloadJson(payload, `closepilot-backup-${new Date().toISOString().slice(0, 10)}.json`);
  backupMessage.textContent = "Backup exported.";
}

async function importWorkspaceBackup(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  importWorkspaceBackupButton.disabled = true;
  backupMessage.textContent = "Importing backup...";

  try {
    const backup = normalizeWorkspaceBackup(JSON.parse(await file.text()));
    await restoreWorkspaceBackup(backup);
    backupMessage.textContent = `Imported ${backup.leads.length} leads, ${backup.tasks.length} tasks, and ${backup.activities.length} activities.`;
  } catch (error) {
    console.error(error);
    backupMessage.textContent = "Backup import failed. Check that the file came from Kira Home.";
  } finally {
    importWorkspaceBackupInput.value = "";
    importWorkspaceBackupButton.disabled = false;
  }
}

async function restoreWorkspaceBackup(backup) {
  await store.clearWorkspaceData();
  setupBusinessName.value = backup.workspace.name;
  setupWorkspaceType.value = backup.workspace.type;
  setupSalesGoal.value = backup.workspace.goal;
  await persistWorkspaceSetup(backup.workspace);

  const leadIdMap = new Map();
  for (const lead of backup.leads) {
    const created = await store.createLead(withoutId(lead));
    if (lead.id) leadIdMap.set(lead.id, created.id);
  }

  for (const task of backup.tasks) {
    await store.createTask(withoutId(task));
  }

  const defaultsByKey = new Map(defaultAutomations.map((automation) => [automation.key, automation]));
  for (const automation of state.automations) {
    const imported = backup.automations.find((item) => item.key === automation.key);
    const defaults = defaultsByKey.get(automation.key);
    await store.updateAutomation({
      ...automation,
      enabled: imported ? imported.enabled : Boolean(defaults?.enabled),
    });
  }

  for (const activity of backup.activities) {
    await store.createActivity({
      leadId: leadIdMap.get(activity.leadId) || null,
      type: activity.type,
      message: activity.message,
    });
  }

  for (const appointment of backup.appointments) {
    await store.createAppointment({
      ...appointment,
      leadId: leadIdMap.get(appointment.leadId) || appointment.leadId,
    });
  }
  await store.updateSchedule(backup.schedule);

  await store.replaceAutomationTemplates(backup.automationTemplates);
  await store.replaceAutomationRuns(
    backup.automationRuns.map((run) => ({
      ...run,
      leadId: leadIdMap.get(run.leadId) || run.leadId,
    })),
  );

  await store.updateSaasAccount(backup.account);
  localStorage.removeItem(onboardingDismissalKey());
  await reloadState();
}

function normalizeWorkspaceBackup(payload) {
  const data = payload?.data || {};
  const workspace = payload?.workspace || {};
  const leads = Array.isArray(data.leads) ? data.leads.map(normalizeBackupLead).filter(Boolean) : [];
  const tasks = Array.isArray(data.tasks) ? data.tasks.map(normalizeBackupTask).filter(Boolean) : [];
  const automations = Array.isArray(data.automations)
    ? data.automations.map(normalizeBackupAutomation).filter(Boolean)
    : [];
  const automationTemplates = Array.isArray(data.automationTemplates)
    ? normalizedAutomationTemplates(data.automationTemplates)
    : structuredClone(defaultAutomationTemplates);
  const automationRuns = Array.isArray(data.automationRuns)
    ? normalizedAutomationRuns(data.automationRuns)
    : [];
  const appointments = Array.isArray(data.appointments)
    ? data.appointments.map(normalizeBackupAppointment).filter(Boolean)
    : [];
  const schedule = normalizedSchedule(data.schedule);
  const activities = Array.isArray(data.activities)
    ? data.activities.map(normalizeBackupActivity).filter(Boolean)
    : [];
  const account = normalizedAccount(data.account);

  if (!leads.length && !tasks.length && !activities.length) {
    throw new Error("Backup file has no workspace data.");
  }

  return {
    workspace: {
      name: String(workspace.name || state.workspaceName || "Personal workspace").trim() || "Personal workspace",
      type: workspace.type === "Team" ? "Team" : "Personal",
      goal: String(workspace.goal || "Close more follow-ups").trim() || "Close more follow-ups",
      ownerEmail: String(workspace.ownerEmail || "owner@kira.local").trim() || "owner@kira.local",
      industry: String(workspace.industry || "Local services").trim() || "Local services",
      timezone: String(workspace.timezone || "America/Chicago"),
      defaultSource: String(workspace.defaultSource || "Website").trim() || "Website",
    },
    leads,
    tasks,
    automations,
    automationTemplates,
    automationRuns,
    appointments,
    schedule,
    activities,
    account,
  };
}

function normalizeBackupLead(lead) {
  if (!lead?.name || !lead?.company) return null;
  const stage = stages.some((item) => item.id === lead.stage) ? lead.stage : "new";
  const value = Number(lead.value || 0);
  const notes = String(lead.notes || "");
  return {
    id: lead.id,
    name: String(lead.name).trim(),
    company: String(lead.company).trim(),
    stage,
    value: Number.isFinite(value) ? value : 0,
    score: clampScore(Number(lead.score) || calculateLeadScore({ value, stage, notes })),
    source: String(lead.source || "Backup import"),
    nextAction: String(lead.nextAction || nextActionForStage(stage)),
    notes,
  };
}

function normalizeBackupTask(task) {
  if (!task?.text) return null;
  return {
    text: String(task.text),
    done: Boolean(task.done),
    due: String(task.due || "today"),
  };
}

function normalizeBackupAutomation(automation) {
  if (!automation?.key) return null;
  return {
    key: String(automation.key),
    enabled: Boolean(automation.enabled),
  };
}

function normalizeBackupActivity(activity) {
  if (!activity?.message) return null;
  return {
    leadId: activity.leadId || null,
    type: String(activity.type || "note"),
    message: String(activity.message),
  };
}

function normalizeBackupAppointment(appointment) {
  if (!appointment?.leadName || !appointment?.startsAt) return null;
  return {
    leadId: appointment.leadId || null,
    leadName: String(appointment.leadName),
    contactName: String(appointment.contactName || "Contact"),
    assignedTo: String(appointment.assignedTo || workspaceSetupSettings().ownerEmail),
    startsAt: String(appointment.startsAt),
    notes: String(appointment.notes || ""),
    outcome: String(appointment.outcome || "Appointment set"),
  };
}

function selectedContactLeads() {
  return [...selectedContactIds]
    .map((leadId) => state.leads.find((lead) => lead.id === leadId))
    .filter(Boolean);
}

function downloadLeadsCsv(leads, filename) {
  const headers = ["name", "company", "stage", "value", "score", "source", "nextAction", "notes"];
  const rows = leads.map((lead) => headers.map((header) => csvEscape(lead[header])).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadJson(payload, filename) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function pullSafeLeadBatch() {
  const pending = unattemptedDialLeads();
  if (pending.length) {
    leadGeneratorStatus.textContent = `Finish ${pending.length} pulled ${pending.length === 1 ? "lead" : "leads"} before pulling 5 more.`;
    return;
  }

  pullSafeLeadsButton.disabled = true;
  leadGeneratorStatus.textContent = "Pulling phone-ready leads...";

  try {
    const response = await fetch("lead-generator-outputs/safe-leads.csv", { cache: "no-store" });
    if (!response.ok) throw new Error("Safe lead output was not found.");

    const safeLeads = parseSafeLeadOutput(await response.text()).filter((lead) => lead.phone);
    if (!safeLeads.length) {
      leadGeneratorStatus.textContent = "No phone-ready safe leads found. Generate safe-leads.csv first.";
      return;
    }

    const pulled = nextSafeLeadBatch(safeLeads, 5);
    if (!pulled.length) {
      leadGeneratorStatus.textContent = "No new safe leads available. The current file has already been pulled.";
      return;
    }

    const created = await store.createLeads(pulled.map(safeLeadToCrmLead));
    await Promise.all(
      created.map((lead) =>
        store.createTask({
          text: `${lead.nextAction} (${lead.company})`,
          done: false,
          due: "today",
        }),
      ),
    );
    await Promise.all(
      created.map((lead) =>
        store.createActivity({
          leadId: lead.id,
          type: "imported",
          message: `Dialer lead pulled from safe lead generator for ${lead.company}.`,
        }),
      ),
    );
    for (const lead of created) {
      await runAutomationTrigger("new-lead", lead);
    }

    state.selectedLeadId = created[0]?.id || state.selectedLeadId;
    store.save?.(state);
    leadGeneratorStatus.textContent = `Pulled ${created.length} safe leads for calling.`;
    contactFilter = "new";
    setActivePage("dial");
    await reloadState();
  } catch (error) {
    console.error(error);
    leadGeneratorStatus.textContent = "Could not pull safe leads. Run the generator and check safe-leads.csv.";
  } finally {
    pullSafeLeadsButton.disabled = unattemptedDialLeads().length > 0;
  }
}

function parseSafeLeadOutput(text) {
  const rows = parseCsvRows(text).filter((row) => row.some((cell) => cell.trim()));
  if (rows.length < 2) return [];

  const headers = rows[0].map((header) => header.trim().toLowerCase());
  return rows
    .slice(1)
    .map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index] || ""])))
    .map((record) => ({
      ownerName: readCsvField(record, ["owner_name", "owner", "name"]),
      propertyAddress: readCsvField(record, ["property_address", "address"]),
      mailingAddress: readCsvField(record, ["mailing_address"]),
      phone: readCsvField(record, ["phone", "phone_number"]),
      email: readCsvField(record, ["email", "email_address"]),
      score: clampScore(Number(readCsvField(record, ["score"])) || 70),
      confidence: readCsvField(record, ["confidence"]),
      source: readCsvField(record, ["source"]) || "Safe lead generator",
      county: readCsvField(record, ["county"]),
      parcelId: readCsvField(record, ["parcel_id", "parcel"]),
      channels: readCsvField(record, ["channels"]),
      compliance: readCsvField(record, ["compliance"]),
      fingerprint: safeLeadFingerprint(record),
    }))
    .filter((lead) => lead.ownerName && lead.propertyAddress && lead.fingerprint);
}

function nextSafeLeadBatch(safeLeads, size) {
  const pulled = [];
  const existing = new Set(state.leads.map(existingSafeLeadFingerprint).filter(Boolean));
  let cursor = Number(localStorage.getItem(safeLeadCursorKey()) || 0);
  if (!Number.isFinite(cursor) || cursor < 0) cursor = 0;

  for (let step = 0; step < safeLeads.length && pulled.length < size; step += 1) {
    const index = (cursor + step) % safeLeads.length;
    const lead = safeLeads[index];
    if (existing.has(lead.fingerprint)) continue;
    pulled.push(lead);
    existing.add(lead.fingerprint);
  }

  localStorage.setItem(safeLeadCursorKey(), String((cursor + Math.max(pulled.length, 1)) % safeLeads.length));
  return pulled;
}

function safeLeadToCrmLead(lead) {
  const phoneLine = lead.phone ? `Phone: ${lead.phone}` : "";
  const emailLine = lead.email ? `Email: ${lead.email}` : "";
  const countyLine = lead.county ? `County: ${lead.county}` : "";
  const parcelLine = lead.parcelId ? `Parcel: ${lead.parcelId}` : "";
  const complianceLine = lead.compliance ? `Compliance: ${lead.compliance}` : "";

  return {
    name: lead.ownerName,
    company: lead.propertyAddress,
    stage: "new",
    value: 0,
    score: lead.score,
    source: "Safe lead generator",
    nextAction: `Call ${lead.phone}`,
    notes: [
      "Pulled from safe-leads.csv for a dialer call block.",
      phoneLine,
      emailLine,
      countyLine,
      parcelLine,
      complianceLine,
      `Safe lead fingerprint: ${lead.fingerprint}`,
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

function safeLeadFingerprint(record) {
  const phone = normalizeFingerprint(readCsvField(record, ["phone", "phone_number"]));
  const parcel = normalizeFingerprint(readCsvField(record, ["parcel_id", "parcel"]));
  const ownerAddress = normalizeFingerprint(
    `${readCsvField(record, ["owner_name", "owner", "name"])} ${readCsvField(record, ["property_address", "address"])}`,
  );
  return phone || parcel || ownerAddress;
}

function existingSafeLeadFingerprint(lead) {
  const match = String(lead.notes || "").match(/Safe lead fingerprint:\s*([a-z0-9]+)/i);
  return match?.[1] || "";
}

function readCsvField(record, names) {
  for (const name of names) {
    const value = record[name];
    if (value != null && String(value).trim()) return String(value).trim();
  }
  return "";
}

function normalizeFingerprint(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function safeLeadCursorKey() {
  return `closepilot-safe-lead-cursor:${workspaceSetupSettings().name}`;
}

async function importLeadsCsv(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const text = await file.text();
  pendingImport = parseLeadsCsv(text);
  renderImportPreview();
  openImportModal();
  event.target.value = "";
}

function openImportModal() {
  importModal.hidden = false;
}

function closeImportModal() {
  pendingImport = null;
  importModal.hidden = true;
}

function renderImportPreview() {
  const leads = pendingImport?.leads || [];
  const errors = pendingImport?.errors || [];
  confirmImportButton.disabled = leads.length === 0;
  confirmImportButton.textContent = leads.length === 1 ? "Import 1 lead" : `Import ${leads.length} leads`;

  importPreview.innerHTML = `
    <div class="import-summary">
      <article>
        <span>Ready</span>
        <strong>${leads.length}</strong>
      </article>
      <article>
        <span>Needs review</span>
        <strong>${errors.length}</strong>
      </article>
    </div>
    <div class="import-preview-list">
      ${
        leads.length
          ? leads
              .slice(0, 5)
              .map(
                (lead) => `
          <article>
            <div>
              <strong>${escapeHtml(lead.name)}</strong>
              <span>${escapeHtml(lead.company)}</span>
            </div>
            <span>${stageLabel(lead.stage)}</span>
            <span>${formatter.format(lead.value)}</span>
          </article>
        `,
              )
              .join("")
          : "<p>No valid leads found.</p>"
      }
    </div>
    ${
      errors.length
        ? `<div class="import-errors">
            <p class="eyebrow">Skipped rows</p>
            ${errors.map((error) => `<p>Row ${error.row}: ${escapeHtml(error.message)}</p>`).join("")}
          </div>`
        : ""
    }
  `;
}

async function confirmLeadsImport() {
  const importedLeads = pendingImport?.leads || [];
  if (!importedLeads.length) return;

  confirmImportButton.disabled = true;
  confirmImportButton.textContent = "Importing...";
  const created = await store.createLeads(importedLeads);
  await Promise.all(
    created.map((lead) =>
      store.createActivity({
        leadId: lead.id,
        type: "imported",
        message: `Lead imported from CSV for ${lead.company}.`,
      }),
    ),
  );
  for (const lead of created) {
    await runAutomationTrigger("new-lead", lead);
  }
  state.selectedLeadId = created[0]?.id || state.selectedLeadId;
  setActivePage("pipeline");
  closeImportModal();
  await reloadState();
}

function parseLeadsCsv(text) {
  const rows = parseCsvRows(text).filter((row) => row.some((cell) => cell.trim()));
  if (rows.length < 2) {
    return { leads: [], errors: [{ row: 1, message: "CSV needs a header row and at least one lead." }] };
  }

  const headers = rows[0].map((header) => header.trim());
  const leads = [];
  const errors = [];

  rows.slice(1).forEach((row, index) => {
    const record = Object.fromEntries(headers.map((header, index) => [header, row[index] || ""]));
    const rowNumber = index + 2;
    if (!record.name?.trim() || !record.company?.trim()) {
      errors.push({ row: rowNumber, message: "Name and company are required." });
      return;
    }

    const stage = stages.some((item) => item.id === record.stage) ? record.stage : "new";
    const value = Number(record.value || 0);
    const notes = record.notes || "Imported from CSV.";
    leads.push({
      name: record.name.trim(),
      company: record.company.trim(),
      stage,
      value: Number.isFinite(value) ? value : 0,
      score: Number(record.score) || calculateLeadScore({ value, stage, notes }),
      source: record.source || "CSV import",
      nextAction: record.nextAction || nextActionForStage(stage),
      notes,
    });
  });

  return { leads, errors };
}

function parseCsvRows(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (quoted && char === '"' && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ",") {
      row.push(cell);
      cell = "";
    } else if (!quoted && (char === "\n" || char === "\r")) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function createLocalStore() {
  return {
    async load() {
      const saved = localStorage.getItem("closepilot-state");
      if (!saved) return structuredClone(seedState);
      try {
        return JSON.parse(saved);
      } catch {
        return structuredClone(seedState);
      }
    },
    save(nextState) {
      localStorage.setItem("closepilot-state", JSON.stringify(nextState));
    },
    async createLead(lead) {
      const created = { id: crypto.randomUUID(), ...lead };
      state.leads.unshift(created);
      state.selectedLeadId = created.id;
      this.save(state);
      return created;
    },
    async createLeads(leads) {
      const created = leads.map((lead) => ({ id: crypto.randomUUID(), ...lead }));
      state.leads = [...created, ...state.leads];
      state.selectedLeadId = created[0]?.id || state.selectedLeadId;
      this.save(state);
      return created;
    },
    async updateLead(lead) {
      state.leads = state.leads.map((item) => (item.id === lead.id ? lead : item));
      this.save(state);
      return lead;
    },
    async deleteLead(leadId) {
      state.leads = state.leads.filter((lead) => lead.id !== leadId);
      if (state.selectedLeadId === leadId) {
        state.selectedLeadId = state.leads[0]?.id || null;
      }
      this.save(state);
    },
    async createActivity(activity) {
      const created = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...activity,
      };
      state.activities = [created, ...(state.activities || [])];
      this.save(state);
      return created;
    },
    async createAppointment(appointment) {
      const created = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...appointment,
      };
      state.appointments = [created, ...(state.appointments || [])];
      this.save(state);
      return created;
    },
    async createTask(task) {
      const created = { id: crypto.randomUUID(), ...task };
      state.tasks.unshift(created);
      this.save(state);
      return created;
    },
    async updateTask(task) {
      state.tasks = state.tasks.map((item) => (item.id === task.id ? task : item));
      this.save(state);
      return task;
    },
    async deleteTask(taskId) {
      state.tasks = state.tasks.filter((task) => task.id !== taskId);
      this.save(state);
    },
    async updateAutomation(automation) {
      state.automations = state.automations.map((item) =>
        item.id === automation.id ? automation : item,
      );
      this.save(state);
      return automation;
    },
    async createAutomationTemplate(template) {
      const created = {
        ...normalizedAutomationTemplate(template),
        id: crypto.randomUUID(),
      };
      state.automationTemplates = [created, ...normalizedAutomationTemplates(state.automationTemplates)];
      this.save(state);
      return created;
    },
    async updateAutomationTemplate(template) {
      const updated = normalizedAutomationTemplate(template);
      state.automationTemplates = normalizedAutomationTemplates(state.automationTemplates).map((item) =>
        item.id === updated.id ? updated : item,
      );
      this.save(state);
      return updated;
    },
    async deleteAutomationTemplate(templateId) {
      state.automationTemplates = normalizedAutomationTemplates(state.automationTemplates).filter(
        (template) => template.id !== templateId,
      );
      this.save(state);
    },
    async replaceAutomationTemplates(templates) {
      state.automationTemplates = normalizedAutomationTemplates(templates);
      this.save(state);
      return state.automationTemplates;
    },
    async createAutomationRun(run) {
      const created = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...run,
      };
      state.automationRuns = [created, ...normalizedAutomationRuns(state.automationRuns)].slice(0, 100);
      this.save(state);
      return created;
    },
    async replaceAutomationRuns(runs) {
      state.automationRuns = normalizedAutomationRuns(runs);
      this.save(state);
      return state.automationRuns;
    },
    async updateWorkspaceSettings(settings) {
      state.workspaceName = settings.name;
      this.save(state);
      return settings;
    },
    async updateSaasAccount(account) {
      state.account = normalizedAccount(account);
      this.save(state);
      return state.account;
    },
    async updateSchedule(schedule) {
      state.schedule = normalizedSchedule(schedule);
      this.save(state);
      return state.schedule;
    },
    async createTeamInvite(invite) {
      const created = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...invite,
      };
      state.account = accountState();
      state.account.invites = [created, ...state.account.invites];
      this.save(state);
      return created;
    },
    async createAuditEvent(event) {
      const created = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...event,
      };
      state.account = accountState();
      state.account.auditEvents = [created, ...(state.account.auditEvents || [])].slice(0, 25);
      this.save(state);
      return created;
    },
    async clearWorkspaceData() {
      state.leads = [];
      state.tasks = [];
      state.activities = [];
      state.appointments = [];
      state.schedule = {};
      state.automationRuns = [];
      state.selectedLeadId = null;
      this.save(state);
    },
    async seedStarterData() {
      state.leads = structuredClone(seedState.leads);
      state.tasks = structuredClone(seedState.tasks);
      state.activities = structuredClone(seedState.activities);
      state.appointments = structuredClone(seedState.appointments);
      state.schedule = structuredClone(seedState.schedule);
      state.selectedLeadId = seedState.selectedLeadId;
      state.account = normalizedAccount(state.account);
      state.automationTemplates = structuredClone(seedState.automationTemplates);
      state.automationRuns = [];
      this.save(state);
    },
  };
}

function createSupabaseStore(client, user) {
  let workspaceId = null;
  let workspaceName = "Personal workspace";

  return {
    async ensureWorkspace() {
      const { data: membership, error: memberError } = await client
        .from("workspace_members")
        .select("workspace_id, workspaces(name)")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();
      throwIf(memberError);

      if (membership?.workspace_id) {
        workspaceId = membership.workspace_id;
        workspaceName = membership.workspaces?.name || workspaceName;
        await this.seedDefaults();
        return;
      }

      const { data: workspace, error: workspaceError } = await client
        .from("workspaces")
        .insert({ owner_id: user.id, name: "Personal workspace" })
        .select("id, name")
        .single();
      throwIf(workspaceError);

      const { error: insertMemberError } = await client
        .from("workspace_members")
        .insert({ workspace_id: workspace.id, user_id: user.id, role: "owner" });
      throwIf(insertMemberError);

      workspaceId = workspace.id;
      workspaceName = workspace.name;
      await this.seedDefaults();
    },
    async seedDefaults() {
      const { count, error } = await client
        .from("automations")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId);
      throwIf(error);

      if (count === 0) {
        const { error: automationError } = await client.from("automations").insert(
          defaultAutomations.map((automation) => ({
            workspace_id: workspaceId,
            automation_key: automation.key,
            title: automation.title,
            detail: automation.detail,
            enabled: automation.enabled,
            saved_hours: automation.savedHours,
          })),
        );
        throwIf(automationError);
      }
    },
    async load() {
      const [
        { data: leads, error: leadError },
        { data: tasks, error: taskError },
        automations,
        activities,
        account,
        automationTemplates,
        automationRuns,
        appointments,
        schedule,
      ] = await Promise.all([
        client.from("leads").select("*").eq("workspace_id", workspaceId).order("created_at"),
        client.from("tasks").select("*").eq("workspace_id", workspaceId).order("created_at", {
          ascending: false,
        }),
        this.loadAutomations(),
        this.loadActivities(),
        this.loadSaasAccount(),
        this.loadAutomationTemplates(),
        this.loadAutomationRuns(),
        this.loadAppointments(),
        this.loadSchedule(),
      ]);
      throwIf(leadError);
      throwIf(taskError);

      return {
        selectedLeadId: state.selectedLeadId,
        workspaceName,
        leads: leads.map(fromLeadRow),
        tasks: tasks.map(fromTaskRow),
        automations,
        activities,
        account,
        automationTemplates,
        automationRuns,
        appointments,
        schedule,
      };
    },
    loadAppointments() {
      const saved = localStorage.getItem(cloudAppointmentsKey(workspaceId));
      if (!saved) return [];
      try {
        return normalizedAppointments(JSON.parse(saved));
      } catch {
        localStorage.removeItem(cloudAppointmentsKey(workspaceId));
        return [];
      }
    },
    saveAppointments(appointments) {
      localStorage.setItem(cloudAppointmentsKey(workspaceId), JSON.stringify(normalizedAppointments(appointments)));
    },
    loadSchedule() {
      const saved = localStorage.getItem(cloudScheduleKey(workspaceId));
      if (!saved) return {};
      try {
        return normalizedSchedule(JSON.parse(saved));
      } catch {
        localStorage.removeItem(cloudScheduleKey(workspaceId));
        return {};
      }
    },
    saveSchedule(schedule) {
      localStorage.setItem(cloudScheduleKey(workspaceId), JSON.stringify(normalizedSchedule(schedule)));
    },
    async loadSaasAccount() {
      const fallback = normalizedAccount({
        members: [
          {
            id: user.id,
            email: user.email || "owner@kira.local",
            role: "owner",
            status: "active",
          },
        ],
      });
      const savedFallback = localStorage.getItem(cloudSaasAccountKey(workspaceId));
      if (savedFallback) {
        try {
          return normalizedAccount(JSON.parse(savedFallback));
        } catch {
          localStorage.removeItem(cloudSaasAccountKey(workspaceId));
        }
      }
      const [
        { data: subscription, error: subscriptionError },
        { data: members, error: memberError },
        { data: invites, error: inviteError },
        { data: auditEvents, error: auditError },
      ] =
        await Promise.all([
          client.from("workspace_subscriptions").select("*").eq("workspace_id", workspaceId).maybeSingle(),
          client.from("workspace_members").select("user_id, role").eq("workspace_id", workspaceId),
          client.from("workspace_invitations").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }),
          client.from("workspace_audit_events").select("*").eq("workspace_id", workspaceId).order("created_at", { ascending: false }).limit(25),
        ]);

      if (isMissingSaasTable(subscriptionError) || isMissingSaasTable(inviteError) || isMissingSaasTable(auditError)) return fallback;
      throwIf(subscriptionError);
      throwIf(memberError);
      throwIf(inviteError);
      throwIf(auditError);

      return normalizedAccount({
        subscription: subscription
          ? {
              plan: subscription.plan,
              status: subscription.status,
              seatLimit: subscription.seat_limit,
              trialEndsAt: subscription.trial_ends_at,
            }
          : fallback.subscription,
        members: (members || []).map((member) => ({
          id: member.user_id,
          email: member.user_id === user.id ? user.email || "Current user" : `member-${member.user_id.slice(0, 8)}@workspace.local`,
          role: member.role,
          status: "active",
        })),
        invites: (invites || []).map(fromInviteRow),
        auditEvents: (auditEvents || []).map(fromAuditRow),
      });
    },
    async loadActivities() {
      const { data, error } = await client
        .from("activities")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false })
        .limit(100);
      if (isMissingActivitiesTable(error)) return [];
      throwIf(error);
      return data.map(fromActivityRow);
    },
    async loadAutomations() {
      const { data, error } = await client
        .from("automations")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at");
      throwIf(error);
      return data.map(fromAutomationRow);
    },
    loadAutomationTemplates() {
      const saved = localStorage.getItem(cloudAutomationTemplatesKey(workspaceId));
      if (!saved) return structuredClone(defaultAutomationTemplates);
      try {
        return normalizedAutomationTemplates(JSON.parse(saved));
      } catch {
        localStorage.removeItem(cloudAutomationTemplatesKey(workspaceId));
        return structuredClone(defaultAutomationTemplates);
      }
    },
    saveAutomationTemplates(templates) {
      localStorage.setItem(
        cloudAutomationTemplatesKey(workspaceId),
        JSON.stringify(normalizedAutomationTemplates(templates)),
      );
    },
    loadAutomationRuns() {
      const saved = localStorage.getItem(cloudAutomationRunsKey(workspaceId));
      if (!saved) return [];
      try {
        return normalizedAutomationRuns(JSON.parse(saved));
      } catch {
        localStorage.removeItem(cloudAutomationRunsKey(workspaceId));
        return [];
      }
    },
    saveAutomationRuns(runs) {
      localStorage.setItem(
        cloudAutomationRunsKey(workspaceId),
        JSON.stringify(normalizedAutomationRuns(runs)),
      );
    },
    async createLead(lead) {
      const { data, error } = await client
        .from("leads")
        .insert(toLeadRow({ ...lead, workspaceId }))
        .select("*")
        .single();
      throwIf(error);
      return fromLeadRow(data);
    },
    async createLeads(leads) {
      const { data, error } = await client
        .from("leads")
        .insert(leads.map((lead) => toLeadRow({ ...lead, workspaceId })))
        .select("*")
        .order("created_at", { ascending: false });
      throwIf(error);
      return data.map(fromLeadRow);
    },
    async updateLead(lead) {
      const { data, error } = await client
        .from("leads")
        .update(toLeadRow({ ...lead, workspaceId }))
        .eq("id", lead.id)
        .eq("workspace_id", workspaceId)
        .select("*")
        .single();
      throwIf(error);
      return fromLeadRow(data);
    },
    async deleteLead(leadId) {
      const { error } = await client
        .from("leads")
        .delete()
        .eq("id", leadId)
        .eq("workspace_id", workspaceId);
      throwIf(error);
    },
    async createActivity(activity) {
      const { data, error } = await client
        .from("activities")
        .insert({
          workspace_id: workspaceId,
          lead_id: activity.leadId,
          type: activity.type,
          message: activity.message,
        })
        .select("*")
        .single();
      if (isMissingActivitiesTable(error)) return null;
      throwIf(error);
      return fromActivityRow(data);
    },
    async createAppointment(appointment) {
      const created = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...appointment,
      };
      const appointments = [created, ...this.loadAppointments()];
      this.saveAppointments(appointments);
      state.appointments = appointments;
      return created;
    },
    async createTask(task) {
      const { data, error } = await client
        .from("tasks")
        .insert({ workspace_id: workspaceId, text: task.text, done: task.done, due: task.due })
        .select("*")
        .single();
      throwIf(error);
      return fromTaskRow(data);
    },
    async updateTask(task) {
      const { data, error } = await client
        .from("tasks")
        .update({ text: task.text, done: task.done, due: task.due })
        .eq("id", task.id)
        .eq("workspace_id", workspaceId)
        .select("*")
        .single();
      throwIf(error);
      return fromTaskRow(data);
    },
    async deleteTask(taskId) {
      const { error } = await client
        .from("tasks")
        .delete()
        .eq("id", taskId)
        .eq("workspace_id", workspaceId);
      throwIf(error);
    },
    async updateAutomation(automation) {
      const { data, error } = await client
        .from("automations")
        .update({ enabled: automation.enabled })
        .eq("id", automation.id)
        .eq("workspace_id", workspaceId)
        .select("*")
        .single();
      throwIf(error);
      return fromAutomationRow(data);
    },
    async createAutomationTemplate(template) {
      const created = {
        ...normalizedAutomationTemplate(template),
        id: crypto.randomUUID(),
      };
      const templates = [created, ...this.loadAutomationTemplates()];
      this.saveAutomationTemplates(templates);
      return created;
    },
    async updateAutomationTemplate(template) {
      const updated = normalizedAutomationTemplate(template);
      const templates = this.loadAutomationTemplates().map((item) =>
        item.id === updated.id ? updated : item,
      );
      this.saveAutomationTemplates(templates);
      return updated;
    },
    async deleteAutomationTemplate(templateId) {
      const templates = this.loadAutomationTemplates().filter((template) => template.id !== templateId);
      this.saveAutomationTemplates(templates);
    },
    async replaceAutomationTemplates(templates) {
      const normalized = normalizedAutomationTemplates(templates);
      this.saveAutomationTemplates(normalized);
      return normalized;
    },
    async createAutomationRun(run) {
      const created = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...run,
      };
      const runs = [created, ...this.loadAutomationRuns()].slice(0, 100);
      this.saveAutomationRuns(runs);
      state.automationRuns = runs;
      return created;
    },
    async replaceAutomationRuns(runs) {
      const normalized = normalizedAutomationRuns(runs);
      this.saveAutomationRuns(normalized);
      state.automationRuns = normalized;
      return normalized;
    },
    async updateWorkspaceSettings(settings) {
      workspaceName = settings.name;
      const { error } = await client
        .from("workspaces")
        .update({ name: settings.name })
        .eq("id", workspaceId);
      throwIf(error);
      return settings;
    },
    async updateSaasAccount(account) {
      const normalized = normalizedAccount(account);
      const { error } = await client.from("workspace_subscriptions").upsert({
        workspace_id: workspaceId,
        plan: normalized.subscription.plan,
        status: normalized.subscription.status,
        seat_limit: normalized.subscription.seatLimit,
        trial_ends_at: normalized.subscription.trialEndsAt,
      });
      if (isMissingSaasTable(error)) {
        state.account = normalized;
        localStorage.setItem(cloudSaasAccountKey(workspaceId), JSON.stringify(normalized));
        return normalized;
      }
      throwIf(error);
      return normalized;
    },
    async updateSchedule(schedule) {
      const normalized = normalizedSchedule(schedule);
      this.saveSchedule(normalized);
      state.schedule = normalized;
      return normalized;
    },
    async createTeamInvite(invite) {
      const { data, error } = await client
        .from("workspace_invitations")
        .insert({
          workspace_id: workspaceId,
          email: invite.email,
          role: invite.role,
          status: invite.status,
        })
        .select("*")
        .single();
      if (isMissingSaasTable(error)) {
        const account = normalizedAccount(state.account);
        const created = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          ...invite,
        };
        account.invites = [created, ...account.invites];
        state.account = account;
        localStorage.setItem(cloudSaasAccountKey(workspaceId), JSON.stringify(account));
        return created;
      }
      throwIf(error);
      return fromInviteRow(data);
    },
    async createAuditEvent(event) {
      const { data, error } = await client
        .from("workspace_audit_events")
        .insert({
          workspace_id: workspaceId,
          action: event.action,
          detail: event.detail,
        })
        .select("*")
        .single();
      if (isMissingSaasTable(error)) {
        const account = normalizedAccount(state.account);
        const created = {
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          ...event,
        };
        account.auditEvents = [created, ...(account.auditEvents || [])].slice(0, 25);
        state.account = account;
        localStorage.setItem(cloudSaasAccountKey(workspaceId), JSON.stringify(account));
        return created;
      }
      throwIf(error);
      return fromAuditRow(data);
    },
    async clearWorkspaceData() {
      const [{ error: taskError }, { error: leadError }] = await Promise.all([
        client.from("tasks").delete().eq("workspace_id", workspaceId),
        client.from("leads").delete().eq("workspace_id", workspaceId),
      ]);
      throwIf(taskError);
      throwIf(leadError);
      const { error: activityError } = await client
        .from("activities")
        .delete()
        .eq("workspace_id", workspaceId);
      if (!isMissingActivitiesTable(activityError)) throwIf(activityError);
      localStorage.removeItem(cloudAppointmentsKey(workspaceId));
      localStorage.removeItem(cloudScheduleKey(workspaceId));
      state.appointments = [];
      state.schedule = {};
    },
    async seedStarterData() {
      const { count, error } = await client
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("workspace_id", workspaceId);
      throwIf(error);
      if (count > 0) return;

      const { data: leads, error: leadError } = await client
        .from("leads")
        .insert(seedState.leads.map((lead) => toLeadRow({ ...lead, workspaceId })))
        .select("*")
        .order("created_at");
      throwIf(leadError);

      const { error: taskError } = await client.from("tasks").insert(
        seedState.tasks.map((task) => ({
          workspace_id: workspaceId,
          text: task.text,
          done: task.done,
          due: task.due,
        })),
      );
      throwIf(taskError);

      state.selectedLeadId = leads[0]?.id || state.selectedLeadId;
      await Promise.all(
        leads.map((lead) =>
          this.createActivity({
            leadId: lead.id,
            type: "created",
            message: `Starter lead added for ${lead.company}.`,
          }),
        ),
      );
    },
  };
}

function toLeadRow(lead) {
  return {
    workspace_id: lead.workspaceId,
    name: lead.name,
    company: lead.company,
    stage: lead.stage,
    value: lead.value,
    score: lead.score,
    notes: lead.notes,
    next_action: lead.nextAction,
    source: lead.source,
    updated_at: new Date().toISOString(),
  };
}

function fromLeadRow(row) {
  return {
    id: row.id,
    name: row.name,
    company: row.company,
    stage: row.stage,
    value: Number(row.value),
    score: row.score,
    notes: row.notes,
    nextAction: row.next_action,
    source: row.source,
  };
}

function fromTaskRow(row) {
  return {
    id: row.id,
    text: row.text,
    done: row.done,
    due: row.due,
  };
}

function fromAutomationRow(row) {
  return {
    id: row.id,
    key: row.automation_key,
    title: row.title,
    detail: row.detail,
    enabled: row.enabled,
    savedHours: row.saved_hours,
  };
}

function fromActivityRow(row) {
  return {
    id: row.id,
    leadId: row.lead_id,
    type: row.type,
    message: row.message,
    createdAt: row.created_at,
  };
}

function fromInviteRow(row) {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
  };
}

function fromAuditRow(row) {
  return {
    id: row.id,
    action: row.action,
    detail: row.detail,
    createdAt: row.created_at,
  };
}

function normalizeLoadedState() {
  state.leads ||= [];
  state.tasks ||= [];
  state.automations ||= defaultAutomations.map((automation, index) => ({
    id: `auto-${index + 1}`,
    ...automation,
  }));
  state.automationTemplates = normalizedAutomationTemplates(state.automationTemplates);
  state.automationRuns = normalizedAutomationRuns(state.automationRuns);
  state.appointments = normalizedAppointments(state.appointments);
  state.schedule = normalizedSchedule(state.schedule);
  state.activities ||= [];
  state.account = normalizedAccount(state.account);
}

function normalizedAutomationTemplates(templates) {
  const source = Array.isArray(templates) && templates.length ? templates : defaultAutomationTemplates;
  return source.map(normalizedAutomationTemplate).filter((template) => template.steps.length);
}

function normalizedAutomationTemplate(template = {}) {
  const trigger = automationTriggerLabels[template.trigger] ? template.trigger : "stage-qualified";
  const steps = Array.isArray(template.steps)
    ? template.steps
        .map((step, index) => ({
          due: taskDueChoices.some((choice) => choice.value === step?.due)
            ? step.due
            : taskDueChoices[Math.min(index, taskDueChoices.length - 1)].value,
          text: String(step?.text || "").trim(),
        }))
        .filter((step) => step.text)
    : [];

  return {
    id: template.id || crypto.randomUUID(),
    name: String(template.name || "Untitled automation").trim() || "Untitled automation",
    trigger,
    active: template.active !== false,
    steps,
  };
}

function normalizedAutomationRuns(runs) {
  return Array.isArray(runs) ? runs.map(normalizedAutomationRun).filter(Boolean) : [];
}

function normalizedAutomationRun(run = {}) {
  if (!run.templateId || !run.leadId) return null;
  return {
    id: run.id || crypto.randomUUID(),
    templateId: String(run.templateId),
    templateName: String(run.templateName || "Automation template"),
    trigger: automationTriggerLabels[run.trigger] ? run.trigger : "new-lead",
    leadId: String(run.leadId),
    leadName: String(run.leadName || "Lead"),
    stepCount: Math.max(0, Number(run.stepCount) || 0),
    createdAt: run.createdAt || new Date().toISOString(),
  };
}

function normalizedAppointments(appointments) {
  return Array.isArray(appointments) ? appointments.map(normalizedAppointment).filter(Boolean) : [];
}

function normalizedAppointment(appointment = {}) {
  if (!appointment.leadName || !appointment.startsAt) return null;
  return {
    id: appointment.id || crypto.randomUUID(),
    leadId: appointment.leadId || null,
    leadName: String(appointment.leadName),
    contactName: String(appointment.contactName || "Contact"),
    assignedTo: String(appointment.assignedTo || workspaceSetupSettings().ownerEmail),
    startsAt: String(appointment.startsAt),
    notes: String(appointment.notes || ""),
    outcome: String(appointment.outcome || "Appointment set"),
    createdAt: appointment.createdAt || new Date().toISOString(),
  };
}

function normalizedSchedule(schedule = {}) {
  const normalized = {};
  if (!schedule || typeof schedule !== "object") return normalized;
  Object.entries(schedule).forEach(([key, value]) => {
    if (!value) return;
    const [day, hourText] = String(key).split("-");
    const hour = Number(hourText);
    if (scheduleDays.includes(day) && scheduleHours.includes(hour)) {
      normalized[`${day}-${hour}`] = true;
    }
  });
  return normalized;
}

function accountState() {
  state.account = normalizedAccount(state.account);
  return state.account;
}

function normalizedAccount(account = {}) {
  const plan = planCatalog[account.subscription?.plan] ? account.subscription.plan : "starter";
  const ownerEmail = currentUser?.email || account.members?.[0]?.email || "owner@kira.local";
  return {
    subscription: {
      plan,
      status: account.subscription?.status || "trialing",
      seatLimit: Number(account.subscription?.seatLimit) || planCatalog[plan].seatLimit,
      trialEndsAt: account.subscription?.trialEndsAt || "2026-07-11T00:00:00.000Z",
    },
    members: Array.isArray(account.members) && account.members.length
      ? account.members
      : [
          {
            id: "member-owner",
            email: ownerEmail,
            role: "owner",
            status: "active",
          },
    ],
    invites: Array.isArray(account.invites) ? account.invites : [],
    auditEvents: Array.isArray(account.auditEvents) ? account.auditEvents : [],
  };
}

function isMissingActivitiesTable(error) {
  return error?.code === "42P01" || error?.message?.includes("activities");
}

function isMissingSaasTable(error) {
  return (
    error?.code === "42P01" ||
    error?.message?.includes("workspace_subscriptions") ||
    error?.message?.includes("workspace_invitations") ||
    error?.message?.includes("workspace_audit_events")
  );
}

function throwIf(error) {
  if (error) throw error;
}

function stageLabel(stageId) {
  return stages.find((stage) => stage.id === stageId)?.label || "Unknown";
}

function nextActionForStage(stageId) {
  const actions = {
    new: "Qualify budget, fit, and timing.",
    qualified: "Send proposal and confirm decision timeline.",
    proposal: "Follow up on proposal objections and close date.",
    won: "Schedule onboarding and collect setup details.",
  };
  return actions[stageId] || "Choose the next best follow-up.";
}

function sequenceStepsForLead(lead) {
  const plans = {
    new: [
      ["today", `Call ${lead.name} to qualify budget, fit, and timing.`],
      ["tomorrow", `Send ${lead.company} a quick value recap and booking link.`],
      ["in 3 days", `Check whether ${lead.name} is still evaluating a CRM workflow.`],
    ],
    qualified: [
      ["today", lead.nextAction],
      ["tomorrow", `Send ${lead.company} a short proposal recap.`],
      ["in 3 days", `Ask ${lead.name} for timeline, blockers, and decision owner.`],
    ],
    proposal: [
      ["today", `Follow up on proposal questions with ${lead.name}.`],
      ["tomorrow", `Send ${lead.company} a close-plan checklist.`],
      ["in 2 days", `Ask ${lead.name} for a yes/no decision date.`],
    ],
    won: [
      ["today", `Send onboarding checklist to ${lead.company}.`],
      ["tomorrow", `Schedule kickoff with ${lead.name}.`],
      ["in 7 days", `Ask ${lead.name} for expansion or referral opportunities.`],
    ],
  };

  return (plans[lead.stage] || plans.new).map(([due, text]) => ({
    due,
    text: text.includes(lead.company) ? text : `${text} (${lead.company})`,
  }));
}

function salesAssistantForLead(lead) {
  const reasons = [];
  if (lead.score >= 85) reasons.push("High lead score signals strong fit or urgency.");
  if (lead.value >= 8000) reasons.push("Deal value is meaningful enough to prioritize today.");
  if (lead.stage === "proposal") reasons.push("Proposal-stage deals benefit from a clear decision date.");
  if (lead.stage === "qualified") reasons.push("Qualified leads need a proposal recap and next commitment.");
  if (lead.source === "Website") reasons.push("Website leads are often warmer because they initiated contact.");
  if (lead.notes.length > 55) reasons.push("Detailed notes show a specific need to anchor follow-up.");
  if (!reasons.length) reasons.push("Lead has enough context for a structured next step.");

  const actions = {
    new: {
      title: "Qualify this lead before it cools",
      action: `Call ${lead.name} to confirm budget, fit, and timeline.`,
      due: "today",
    },
    qualified: {
      title: "Convert interest into a decision path",
      action: `Send ${lead.company} a proposal recap and ask for the decision timeline.`,
      due: "today",
    },
    proposal: {
      title: "Push the proposal toward a close date",
      action: `Ask ${lead.name} for a yes/no decision date and final objection list.`,
      due: "today",
    },
    won: {
      title: "Turn the win into expansion",
      action: `Ask ${lead.name} for onboarding goals and one referral opportunity.`,
      due: "tomorrow",
    },
  };

  return {
    ...actions[lead.stage],
    reasons,
  };
}

function calculateLeadScore(lead) {
  const stageScores = { new: 8, qualified: 18, proposal: 28, won: 36 };
  const valueScore = Math.min(34, Math.floor(Number(lead.value || 0) / 500));
  const notesScore = lead.notes?.length > 30 ? 12 : 4;
  return Math.min(99, 35 + (stageScores[lead.stage] || 0) + valueScore + notesScore);
}

function clampScore(score) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function withoutId(record) {
  const { id, ...rest } = record;
  return rest;
}

function weightedLeadValue(lead) {
  return lead.value * (stageProbabilities[lead.stage] || 0);
}

function formatActivityDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatShortDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatDashboardDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  }).format(value);
}

function formatSavedMinutes(minutes) {
  const total = Math.max(0, Math.round(Number(minutes) || 0));
  const hours = Math.floor(total / 60);
  const remaining = total % 60;
  if (hours && remaining) return `${hours}h ${remaining}m`;
  if (hours) return `${hours}h`;
  return `${remaining}m`;
}

function renderTimeSavedActivityBadge(activity) {
  const minutes = timeSavedActivityMinutes(activity);
  return minutes ? `<span class="time-saved-activity-badge">+${formatSavedMinutes(minutes)} saved</span>` : "";
}

function formatAppointmentTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Anytime";
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function isToday(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function isTomorrow(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return (
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate()
  );
}

function isWithinPastDays(value, days) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;
  const elapsed = Date.now() - date.getTime();
  return elapsed >= 0 && elapsed <= days * 86400000;
}

function timezoneLabel(value) {
  const labels = {
    "America/Chicago": "Central",
    "America/New_York": "Eastern",
    "America/Denver": "Mountain",
    "America/Los_Angeles": "Pacific",
  };
  return labels[value] || value || "Central";
}

function activityTime(activity) {
  return new Date(activity.createdAt || 0).getTime();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[char];
  });
}

boot();
