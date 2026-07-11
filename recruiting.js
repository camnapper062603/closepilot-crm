const storageKey = "kiraRecruitingState-v1";
const crmFeedKey = "kiraRecruitingFeed-v1";
const sharedRecruitingFeedKey = "kiraRecruitingSharedFeed-v1";
const config = window.ClosePilotConfig || window.KiraHomeConfig || {};
const hasSupabaseConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey);
const isBetaMode = ["beta", "production"].includes(config.appMode || "");
let supabaseClient = null;
let currentSession = null;
let liveAccess = null;
let liveSaveTimer = 0;
let liveLoading = false;
const recruitSubpages = [
  {
    id: "dashboard",
    label: "Dashboard",
    title: "Dashboard",
    eyebrow: "Kira Recruit / Command center",
  },
  { id: "job", label: "Job details", title: "Job details", eyebrow: "Kira Recruit / Job intake" },
  {
    id: "boards",
    label: "Job board connectors",
    title: "Job board connectors",
    eyebrow: "Kira Recruit / Distribution",
  },
  { id: "integrations", label: "Integrations", title: "Integrations", eyebrow: "Kira Recruit / Provider setup" },
  {
    id: "applicants",
    label: "Single candidate location",
    title: "Applicants",
    eyebrow: "Kira Recruit / Candidate inbox",
  },
  {
    id: "interviews",
    label: "Monday, Wednesday, Friday calls",
    title: "Interview calls",
    eyebrow: "Kira Recruit / Auto scheduler",
  },
  {
    id: "onboarding",
    label: "W-2/W-9",
    title: "W-2 / W-9 onboarding",
    eyebrow: "Kira Recruit / Worker setup",
  },
  { id: "payroll", label: "Payroll", title: "Payroll", eyebrow: "Kira Recruit / Pay operations" },
  { id: "crm", label: "Recruiting feed", title: "Recruiting feed", eyebrow: "Kira Recruit / CRM handoff" },
];
const recruitSubpageIds = new Set(recruitSubpages.map((page) => page.id));
const boards = [
  { id: "indeed", name: "Indeed", type: "Sponsored job API" },
  { id: "linkedin", name: "LinkedIn", type: "Company page connector" },
  { id: "ziprecruiter", name: "ZipRecruiter", type: "Distribution partner" },
  { id: "glassdoor", name: "Glassdoor", type: "Employer profile" },
  { id: "google", name: "Google Jobs", type: "Structured job feed" },
  { id: "facebook", name: "Facebook Jobs", type: "Social listing" },
];

const integrationProviders = {
  indeed: {
    label: "Indeed",
    accountLabel: "Advertiser / employer account",
    detail: "Use this for sponsored job posting, applicant import, campaign budgets, and apply webhook handoff.",
  },
  monsterzip: {
    label: "Monster / ZipRecruiter",
    accountLabel: "MonsterZip employer account",
    detail: "Use this for Monster or ZipRecruiter distribution, candidate sync, posting budgets, and apply URL routing.",
  },
};

const hiringOutcomeOptions = [
  ["screening", "Screening"],
  ["interviewing", "Interviewing"],
  ["offer", "Offer"],
  ["hired", "Hired"],
  ["not_selected", "Not selected"],
  ["nurture", "Nurture"],
];

const pipelineStages = [
  { id: "new", label: "New", status: "New" },
  { id: "screened", label: "Screened", status: "Qualified" },
  { id: "interview", label: "Interview", status: "Interview" },
  { id: "offer", label: "Offer", status: "Offer" },
  { id: "hired", label: "Hired", status: "Converted" },
  { id: "onboarding", label: "Onboarding", status: "Onboarding" },
];
const pipelineStageIds = new Set(pipelineStages.map((stage) => stage.id));

const candidatePool = [
  {
    name: "Alyssa Moreno",
    email: "alyssa.moreno@example.com",
    phone: "(512) 555-0142",
    source: "Indeed",
    experience: "2 years appointment setting, Spanish bilingual",
    skills: ["Phone confidence", "CRM notes", "Bilingual"],
    score: 94,
  },
  {
    name: "Derek Shaw",
    email: "derek.shaw@example.com",
    phone: "(214) 555-0188",
    source: "LinkedIn",
    experience: "Former SDR with outbound sales and daily CRM logging",
    skills: ["Outbound", "CRM experience", "Follow-up"],
    score: 89,
  },
  {
    name: "Nina Brooks",
    email: "nina.brooks@example.com",
    phone: "(817) 555-0194",
    source: "ZipRecruiter",
    experience: "Customer service rep moving into sales",
    skills: ["Customer service", "Scheduling", "Text follow-up"],
    score: 81,
  },
  {
    name: "Caleb Price",
    email: "caleb.price@example.com",
    phone: "(737) 555-0130",
    source: "Google Jobs",
    experience: "Part-time caller, weekend availability",
    skills: ["Weekend availability", "Phone confidence"],
    score: 76,
  },
  {
    name: "Maya Reed",
    email: "maya.reed@example.com",
    phone: "(469) 555-0167",
    source: "Facebook Jobs",
    experience: "Retail sales lead with consistent follow-up habits",
    skills: ["Follow-up", "Objection handling"],
    score: 72,
  },
  {
    name: "Jordan Lee",
    email: "jordan.lee@example.com",
    phone: "(281) 555-0111",
    source: "Glassdoor",
    experience: "Remote assistant with calendar management",
    skills: ["Calendar management", "Written notes"],
    score: 68,
  },
];

let state = loadState();
let activeSubpage = "dashboard";
let activeMobileTab = "overview";
let activeMobileStage = "new";
let activeCandidateId = "";
let selectedWorkerIds = new Set();
let selectedPayrollRunIds = new Set();
let accessContext = recruitingAccessContext();

const elements = {
  pageTitle: document.querySelector("#recruitingPageTitle"),
  pageEyebrow: document.querySelector("#recruitingPageEyebrow"),
  pageArea: document.querySelector("#recruitPageArea"),
  subpageNav: document.querySelector("#recruitSubpageNav"),
  accessBanner: document.querySelector("#recruitingAccessBanner"),
  accessMessage: document.querySelector("#recruitingAccessMessage"),
  syncMode: document.querySelector("#syncMode"),
  heroModeBadge: document.querySelector("#heroModeBadge"),
  heroBestCandidate: document.querySelector("#heroBestCandidate"),
  heroBestAction: document.querySelector("#heroBestAction"),
  hiringVelocity: document.querySelector("#hiringVelocity"),
  aiModeLabel: document.querySelector("#aiModeLabel"),
  aiModeDetail: document.querySelector("#aiModeDetail"),
  livePostings: document.querySelector("#livePostings"),
  applicantCount: document.querySelector("#applicantCount"),
  qualifiedCount: document.querySelector("#qualifiedCount"),
  bookedCount: document.querySelector("#bookedCount"),
  hiresInProgress: document.querySelector("#hiresInProgress"),
  addCandidateCta: document.querySelector("#addCandidateCta"),
  postJobCta: document.querySelector("#postJobCta"),
  mobileRecruitTabs: document.querySelector("#mobileRecruitTabs"),
  mobilePipelineStages: document.querySelector("#mobilePipelineStages"),
  dashboard: document.querySelector("#dashboard"),
  nextBestHire: document.querySelector("#nextBestHire"),
  pipelineBoard: document.querySelector("#pipelineBoard"),
  aiRecruiterPanel: document.querySelector("#aiRecruiterPanel"),
  dashboardBookInterviews: document.querySelector("#dashboardBookInterviews"),
  dashboardSyncCrm: document.querySelector("#dashboardSyncCrm"),
  upcomingInterviews: document.querySelector("#upcomingInterviews"),
  recruitingTasks: document.querySelector("#recruitingTasks"),
  candidateDetailSheet: document.querySelector("#candidateDetailSheet"),
  candidateDetailBody: document.querySelector("#candidateDetailBody"),
  closeCandidateDetail: document.querySelector("#closeCandidateDetail"),
  jobForm: document.querySelector("#jobForm"),
  jobTitle: document.querySelector("#jobTitle"),
  jobLocation: document.querySelector("#jobLocation"),
  jobPay: document.querySelector("#jobPay"),
  jobSchedule: document.querySelector("#jobSchedule"),
  interviewTime: document.querySelector("#interviewTime"),
  jobPriority: document.querySelector("#jobPriority"),
  jobSummary: document.querySelector("#jobSummary"),
  jobRequirements: document.querySelector("#jobRequirements"),
  publishJob: document.querySelector("#publishJob"),
  refreshBoards: document.querySelector("#refreshBoards"),
  syncApplicants: document.querySelector("#syncApplicants"),
  bookInterviews: document.querySelector("#bookInterviews"),
  syncToCrm: document.querySelector("#syncToCrm"),
  resetRecruiting: document.querySelector("#resetRecruiting"),
  downloadFeed: document.querySelector("#downloadFeed"),
  candidateFilter: document.querySelector("#candidateFilter"),
  candidateSort: document.querySelector("#candidateSort"),
  jobMessage: document.querySelector("#jobMessage"),
  candidateMessage: document.querySelector("#candidateMessage"),
  feedMessage: document.querySelector("#feedMessage"),
  boardList: document.querySelector("#boardList"),
  candidateList: document.querySelector("#candidateList"),
  interviewList: document.querySelector("#interviewList"),
  feedPreview: document.querySelector("#feedPreview"),
  integrationForm: document.querySelector("#integrationForm"),
  integrationProvider: document.querySelector("#integrationProvider"),
  integrationAccountId: document.querySelector("#integrationAccountId"),
  integrationEmail: document.querySelector("#integrationEmail"),
  integrationApiToken: document.querySelector("#integrationApiToken"),
  integrationWebhookUrl: document.querySelector("#integrationWebhookUrl"),
  integrationBudget: document.querySelector("#integrationBudget"),
  integrationNotes: document.querySelector("#integrationNotes"),
  integrationGrid: document.querySelector("#integrationGrid"),
  integrationMessage: document.querySelector("#integrationMessage"),
  testIntegration: document.querySelector("#testIntegration"),
  onboardingForm: document.querySelector("#onboardingForm"),
  workerName: document.querySelector("#workerName"),
  workerEmail: document.querySelector("#workerEmail"),
  workerType: document.querySelector("#workerType"),
  workerRole: document.querySelector("#workerRole"),
  workerPayRate: document.querySelector("#workerPayRate"),
  workerStartDate: document.querySelector("#workerStartDate"),
  workerTaxStatus: document.querySelector("#workerTaxStatus"),
  workerDepositStatus: document.querySelector("#workerDepositStatus"),
  workerNotes: document.querySelector("#workerNotes"),
  onboardingSummary: document.querySelector("#onboardingSummary"),
  selectedWorkerCount: document.querySelector("#selectedWorkerCount"),
  onboardingEmailTemplate: document.querySelector("#onboardingEmailTemplate"),
  selectAllWorkers: document.querySelector("#selectAllWorkers"),
  clearWorkerSelection: document.querySelector("#clearWorkerSelection"),
  bulkSendOnboarding: document.querySelector("#bulkSendOnboarding"),
  workerList: document.querySelector("#workerList"),
  onboardingMessage: document.querySelector("#onboardingMessage"),
  sendOnboardingPacket: document.querySelector("#sendOnboardingPacket"),
  payrollProviderForm: document.querySelector("#payrollProviderForm"),
  payrollProvider: document.querySelector("#payrollProvider"),
  payrollCompanyId: document.querySelector("#payrollCompanyId"),
  payrollApiToken: document.querySelector("#payrollApiToken"),
  payrollRunForm: document.querySelector("#payrollRunForm"),
  payrollWorker: document.querySelector("#payrollWorker"),
  payrollPeriod: document.querySelector("#payrollPeriod"),
  payrollHours: document.querySelector("#payrollHours"),
  payrollRate: document.querySelector("#payrollRate"),
  payrollBonus: document.querySelector("#payrollBonus"),
  payrollReimbursement: document.querySelector("#payrollReimbursement"),
  payrollTotal: document.querySelector("#payrollTotal"),
  payrollSummary: document.querySelector("#payrollSummary"),
  selectedPayrollCount: document.querySelector("#selectedPayrollCount"),
  payrollEmailTemplate: document.querySelector("#payrollEmailTemplate"),
  selectAllPayrollRuns: document.querySelector("#selectAllPayrollRuns"),
  clearPayrollSelection: document.querySelector("#clearPayrollSelection"),
  emailPayrollRuns: document.querySelector("#emailPayrollRuns"),
  markSelectedPayrollPaid: document.querySelector("#markSelectedPayrollPaid"),
  payrollList: document.querySelector("#payrollList"),
  payrollMessage: document.querySelector("#payrollMessage"),
  markPayrollPaid: document.querySelector("#markPayrollPaid"),
  enableAddon: document.querySelector("#enableRecruitingAddon"),
  requestAddon: document.querySelector("#requestRecruitingAddon"),
};

elements.subpageNav.addEventListener("click", (event) => {
  const link = event.target.closest("[data-recruit-subpage]");
  if (!link) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
  event.preventDefault();
  setRecruitSubpage(link.dataset.recruitSubpage, { push: true });
});
elements.mobileRecruitTabs?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-mobile-recruit-tab]");
  if (!button) return;
  activeMobileTab = button.dataset.mobileRecruitTab || "overview";
  renderMobileTabs();
});
elements.mobilePipelineStages?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-mobile-pipeline-stage]");
  if (!button) return;
  activeMobileStage = button.dataset.mobilePipelineStage || "new";
  renderMobileStageTabs();
});
elements.addCandidateCta?.addEventListener("click", () => {
  if (!guardRecruitingAccess("add candidates")) return;
  syncApplicants();
  setRecruitSubpage("applicants", { push: true });
});
elements.postJobCta?.addEventListener("click", () => setRecruitSubpage("job", { push: true }));
elements.pipelineBoard?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-pipeline-action]");
  if (!button) return;
  handlePipelineAction(button.dataset.candidateId, button.dataset.pipelineAction);
});
elements.nextBestHire?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-pipeline-action]");
  if (!button) return;
  handlePipelineAction(button.dataset.candidateId, button.dataset.pipelineAction);
});
elements.recruitingTasks?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-pipeline-action]");
  if (!button) return;
  handlePipelineAction(button.dataset.candidateId, button.dataset.pipelineAction);
});
elements.aiRecruiterPanel?.addEventListener("click", (event) => {
  const button = event.target.closest("[data-ai-candidate-action]");
  if (!button) return;
  handlePipelineAction(button.dataset.candidateId, button.dataset.aiCandidateAction);
});
elements.dashboardBookInterviews?.addEventListener("click", bookInterviews);
elements.dashboardSyncCrm?.addEventListener("click", syncCrmFeed);
elements.closeCandidateDetail?.addEventListener("click", closeCandidateDetail);
elements.candidateDetailSheet?.addEventListener("click", (event) => {
  if (event.target.closest("[data-detail-close]")) closeCandidateDetail();
  const button = event.target.closest("[data-detail-stage]");
  if (button) {
    setCandidateStage(button.dataset.candidateId, button.dataset.detailStage);
  }
});
elements.publishJob.addEventListener("click", publishJob);
elements.refreshBoards.addEventListener("click", refreshBoards);
elements.syncApplicants.addEventListener("click", syncApplicants);
elements.bookInterviews.addEventListener("click", bookInterviews);
elements.syncToCrm.addEventListener("click", syncCrmFeed);
elements.resetRecruiting.addEventListener("click", resetRecruiting);
elements.downloadFeed.addEventListener("click", downloadFeed);
elements.enableAddon?.addEventListener("click", enableRecruitingAddon);
elements.requestAddon?.addEventListener("click", () => {
  if (elements.candidateMessage) {
    elements.candidateMessage.textContent = "Ask an owner or admin to enable Kira Recruit for this CRM workspace.";
  }
  if (elements.accessMessage) {
    elements.accessMessage.textContent = "Ask an owner or admin to enable Kira Recruit for this CRM workspace.";
  }
});
elements.candidateFilter.addEventListener("change", render);
elements.candidateSort.addEventListener("change", render);
elements.integrationProvider.addEventListener("change", hydrateIntegrationForm);
elements.integrationForm.addEventListener("submit", saveIntegration);
elements.testIntegration.addEventListener("click", testIntegrationConnection);
elements.onboardingForm.addEventListener("submit", createOnboardingPacket);
elements.sendOnboardingPacket.addEventListener("click", sendLatestOnboardingPacket);
elements.selectAllWorkers.addEventListener("click", selectAllWorkers);
elements.clearWorkerSelection.addEventListener("click", clearWorkerSelection);
elements.bulkSendOnboarding.addEventListener("click", bulkSendOnboardingPackets);
elements.payrollProviderForm.addEventListener("submit", savePayrollProvider);
elements.payrollRunForm.addEventListener("submit", stagePayrollRun);
elements.markPayrollPaid.addEventListener("click", markLatestPayrollPaid);
elements.selectAllPayrollRuns.addEventListener("click", selectAllPayrollRuns);
elements.clearPayrollSelection.addEventListener("click", clearPayrollSelection);
elements.emailPayrollRuns.addEventListener("click", emailSelectedPayrollRuns);
elements.markSelectedPayrollPaid.addEventListener("click", markSelectedPayrollRunsPaid);
[elements.payrollHours, elements.payrollRate, elements.payrollBonus, elements.payrollReimbursement].forEach((input) => {
  input.addEventListener("input", renderPayrollTotal);
});
elements.jobForm.addEventListener("input", () => {
  state.job = readJobForm();
  saveState();
  renderFeed();
});

bootRecruiting();

window.addEventListener("hashchange", () => {
  routeFromLocation();
  renderSubpages();
});

window.addEventListener("popstate", () => {
  routeFromLocation();
  renderSubpages();
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && !elements.candidateDetailSheet?.hidden) {
    closeCandidateDetail();
  }
});

function defaultState() {
  return {
    job: {
      title: "Inside Sales Dialer",
      location: "Remote - Texas",
      pay: "$18/hr + bonus",
      schedule: "Monday-Friday, flexible shifts",
      interviewTime: "10:00",
      priority: "Normal",
      summary: "Call warm homeowner leads, qualify motivation, log outcomes, and book appointments for closers.",
      requirements: "Phone confidence, reliable follow-up, clear written notes, CRM experience, weekend availability preferred.",
      status: "Draft",
    },
    postings: boards.map((board) => ({ ...board, status: "Not listed", applicants: 0, lastSync: "" })),
    candidates: [],
    interviews: [],
    feedSyncedAt: "",
    integrations: {
      indeed: emptyIntegration("indeed"),
      monsterzip: emptyIntegration("monsterzip"),
    },
    connectorSettings: {
      crmApp: "ClosePilot CRM",
      module: "Kira Recruit",
      allowedRoles: ["owner", "admin", "manager"],
    },
    onboardingWorkers: [],
    payrollProvider: {
      provider: "gusto",
      companyId: "",
      tokenConfigured: false,
      tokenLast4: "",
      savedAt: "",
    },
    payrollRuns: [],
    recruiterNotes: [],
    hiringOutcomes: [],
    crmHandoffs: [],
  };
}

function emptyIntegration(provider) {
  return {
    provider,
    accountId: "",
    email: "",
    tokenConfigured: false,
    tokenLast4: "",
    webhookUrl: "",
    budget: "",
    notes: "",
    status: "Not connected",
    lastTestedAt: "",
    savedAt: "",
  };
}

function loadState() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey));
    if (!stored || typeof stored !== "object") return defaultState();
    return {
      ...defaultState(),
      ...stored,
      job: { ...defaultState().job, ...(stored.job || {}) },
      postings: Array.isArray(stored.postings) && stored.postings.length ? stored.postings : defaultState().postings,
      candidates: Array.isArray(stored.candidates) ? stored.candidates : [],
      interviews: Array.isArray(stored.interviews) ? stored.interviews : [],
      integrations: {
        indeed: { ...emptyIntegration("indeed"), ...(stored.integrations?.indeed || {}) },
        monsterzip: { ...emptyIntegration("monsterzip"), ...(stored.integrations?.monsterzip || {}) },
      },
      connectorSettings: { ...defaultState().connectorSettings, ...(stored.connectorSettings || {}) },
      onboardingWorkers: Array.isArray(stored.onboardingWorkers) ? stored.onboardingWorkers : [],
      payrollProvider: { ...defaultState().payrollProvider, ...(stored.payrollProvider || {}) },
      payrollRuns: Array.isArray(stored.payrollRuns) ? stored.payrollRuns : [],
      recruiterNotes: Array.isArray(stored.recruiterNotes) ? stored.recruiterNotes : [],
      hiringOutcomes: Array.isArray(stored.hiringOutcomes) ? stored.hiringOutcomes : [],
      crmHandoffs: Array.isArray(stored.crmHandoffs) ? stored.crmHandoffs : [],
    };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
  queueLiveSave();
}

async function bootRecruiting() {
  routeFromLocation();
  accessContext = recruitingAccessContext();
  renderAccessState();
  if (shouldUseLiveRecruiting()) {
    await initializeLiveRecruiting();
  }
  hydrateJobForm();
  hydrateIntegrationForm();
  hydratePayrollProviderForm();
  hydrateDefaultDates();
  render();
}

function shouldUseLiveRecruiting() {
  const params = new URLSearchParams(window.location.search);
  return hasSupabaseConfig && params.get("demo") !== "1" && !params.has("role") && !params.has("addon");
}

async function initializeLiveRecruiting() {
  liveLoading = true;
  try {
    const { createClient } = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm");
    supabaseClient = createClient(config.supabaseUrl, config.supabaseAnonKey);
    const { data } = await supabaseClient.auth.getSession();
    currentSession = data.session || null;
    if (!currentSession) {
      liveAccess = {
        mode: "locked",
        locked: true,
        label: "Locked paid add-on",
        message: "Sign in to the CRM first, then open Kira Recruit from the same browser session.",
      };
      return;
    }

    liveAccess = await postRecruitingBackend("/api/recruiting/access", {});
    if (liveAccess?.locked) return;
    const result = await postRecruitingBackend("/api/recruiting/load", {});
    liveAccess = result.access || liveAccess;
    applyLiveRecruitingState(result.state || {}, result.candidates || []);
  } catch (error) {
    liveAccess = {
      mode: "locked",
      locked: true,
      label: "Locked paid add-on",
      message: `Kira Recruit live access needs attention: ${error.message}`,
    };
  } finally {
    liveLoading = false;
  }
}

function applyLiveRecruitingState(liveState, candidates) {
  state = {
    ...state,
    ...liveState,
    job: { ...state.job, ...(liveState.job || {}) },
    postings: Array.isArray(liveState.postings) && liveState.postings.length ? liveState.postings : state.postings,
    integrations: {
      indeed: { ...state.integrations.indeed, ...(liveState.integrations?.indeed || {}) },
      monsterzip: { ...state.integrations.monsterzip, ...(liveState.integrations?.monsterzip || {}) },
    },
    connectorSettings: { ...state.connectorSettings, ...(liveState.connectorSettings || {}) },
    interviews: Array.isArray(liveState.interviews) ? liveState.interviews : state.interviews,
    onboardingWorkers: Array.isArray(liveState.onboardingWorkers) ? liveState.onboardingWorkers : state.onboardingWorkers,
    payrollProvider: { ...state.payrollProvider, ...(liveState.payrollProvider || {}) },
    payrollRuns: Array.isArray(liveState.payrollRuns) ? liveState.payrollRuns : state.payrollRuns,
    recruiterNotes: Array.isArray(liveState.recruiterNotes) ? liveState.recruiterNotes : state.recruiterNotes,
    hiringOutcomes: Array.isArray(liveState.hiringOutcomes) ? liveState.hiringOutcomes : state.hiringOutcomes,
    crmHandoffs: Array.isArray(liveState.crmHandoffs) ? liveState.crmHandoffs : state.crmHandoffs,
    candidates: mergeCandidates(state.candidates, candidates),
    feedSyncedAt: liveState.feedSyncedAt || state.feedSyncedAt,
  };
  localStorage.setItem(storageKey, JSON.stringify(state));
}

function isLiveUnlocked() {
  return Boolean(currentSession?.access_token && liveAccess && !liveAccess.locked);
}

function buildPersistedState() {
  return {
    job: state.job,
    postings: state.postings,
    integrations: state.integrations,
    connectorSettings: state.connectorSettings,
    interviews: state.interviews,
    onboardingWorkers: state.onboardingWorkers,
    payrollProvider: state.payrollProvider,
    payrollRuns: state.payrollRuns,
    recruiterNotes: state.recruiterNotes,
    hiringOutcomes: state.hiringOutcomes,
    crmHandoffs: state.crmHandoffs,
    feedSyncedAt: state.feedSyncedAt,
  };
}

function queueLiveSave() {
  if (liveLoading || !isLiveUnlocked()) return;
  clearTimeout(liveSaveTimer);
  liveSaveTimer = window.setTimeout(() => {
    syncLiveRecruitingState().catch((error) => {
      console.warn("Kira Recruit live save failed", error);
    });
  }, 650);
}

async function syncLiveRecruitingState() {
  if (!isLiveUnlocked()) return null;
  return postRecruitingBackend("/api/recruiting/save", {
    state: buildPersistedState(),
    candidates: state.candidates.map(candidateToRecruitRecord),
  });
}

async function enableRecruitingAddon() {
  if (!currentSession?.access_token) return;
  if (!accessContext.setupAllowed) {
    if (elements.candidateMessage) elements.candidateMessage.textContent = "Only Owners and Admins can enable Kira Recruit.";
    return;
  }
  liveLoading = true;
  renderAccessState();
  try {
    const result = await postRecruitingBackend("/api/recruiting/addon-settings", {
      status: "early_access",
      allowedRoles: ["owner", "admin", "manager"],
      metadata: {
        source: "kira-recruit-ui",
      },
    });
    liveAccess = result.access || liveAccess;
    const loaded = await postRecruitingBackend("/api/recruiting/load", {});
    liveAccess = loaded.access || liveAccess;
    applyLiveRecruitingState(loaded.state || {}, loaded.candidates || []);
    if (elements.candidateMessage) elements.candidateMessage.textContent = result.message || "Kira Recruit early access enabled.";
  } catch (error) {
    if (elements.candidateMessage) elements.candidateMessage.textContent = `Enable failed: ${error.message}`;
  } finally {
    liveLoading = false;
    render();
  }
}

async function postRecruitingBackend(path, payload = {}) {
  if (!currentSession?.access_token) throw new Error("CRM session is required.");
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${currentSession.access_token}`,
    },
    body: JSON.stringify({
      ...payload,
      workspaceId: payload.workspaceId || liveAccess?.workspaceId || "",
    }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      typeof body.error === "object" && body.error?.message
        ? body.error.message
        : body.error || body.message || `Request failed with ${response.status}`;
    throw new Error(message);
  }
  return body;
}

function mergeCandidates(localCandidates, liveCandidates) {
  const byKey = new Map();
  [...localCandidates, ...liveCandidates].forEach((candidate) => {
    const key = candidate.email || candidate.externalId || candidate.id || `${candidate.name}-${candidate.source}`;
    if (!key) return;
    byKey.set(String(key).toLowerCase(), {
      ...(byKey.get(String(key).toLowerCase()) || {}),
      ...candidate,
      id: candidate.id || candidate.externalId || `candidate-${Date.now()}-${byKey.size}`,
      jobTitle: candidate.jobTitle || candidate.role || state.job.title,
      status: candidate.status || candidate.interviewStatus || "New",
      skills: Array.isArray(candidate.skills) ? candidate.skills : [],
      experience: candidate.experience || candidate.nextAction || "",
      pipelineStage: normalizePipelineStage(candidate.pipelineStage || candidate.stage || candidate.status || candidate.interviewStatus),
      assignedRecruiter: candidate.assignedRecruiter || "",
      assignedManager: candidate.assignedManager || "",
      hiringOutcome: normalizeHiringOutcome(candidate.hiringOutcome),
      pipelineStage: normalizePipelineStage(candidate.pipelineStage || candidate.status || candidate.interviewStatus),
      recruiterNotes: candidate.recruiterNotes || "",
      convertedMemberInvitationId: candidate.convertedMemberInvitationId || "",
      followUpTaskId: candidate.followUpTaskId || "",
      activityNoteId: candidate.activityNoteId || "",
      lastHandoffAt: candidate.lastHandoffAt || "",
      syncedAt: candidate.syncedAt || new Date().toISOString(),
    });
  });
  return [...byKey.values()];
}

function hydrateJobForm() {
  elements.jobTitle.value = state.job.title;
  elements.jobLocation.value = state.job.location;
  elements.jobPay.value = state.job.pay;
  elements.jobSchedule.value = state.job.schedule;
  elements.interviewTime.value = state.job.interviewTime;
  elements.jobPriority.value = state.job.priority;
  elements.jobSummary.value = state.job.summary;
  elements.jobRequirements.value = state.job.requirements;
}

function hydrateIntegrationForm() {
  const provider = elements.integrationProvider.value;
  const integration = state.integrations[provider] || emptyIntegration(provider);
  elements.integrationAccountId.value = integration.accountId || "";
  elements.integrationEmail.value = integration.email || "";
  elements.integrationApiToken.value = "";
  elements.integrationWebhookUrl.value = integration.webhookUrl || "";
  elements.integrationBudget.value = integration.budget || "";
  elements.integrationNotes.value = integration.notes || "";
}

function hydratePayrollProviderForm() {
  elements.payrollProvider.value = state.payrollProvider.provider || "gusto";
  elements.payrollCompanyId.value = state.payrollProvider.companyId || "";
  elements.payrollApiToken.value = "";
}

function hydrateDefaultDates() {
  if (!elements.workerStartDate.value) {
    elements.workerStartDate.value = new Date().toISOString().slice(0, 10);
  }
  if (!elements.payrollPeriod.value) {
    const now = new Date();
    elements.payrollPeriod.value = `${now.toLocaleString("en-US", { month: "short" })} 1-${now.toLocaleString("en-US", {
      month: "short",
    })} 15`;
  }
}

function readJobForm() {
  return {
    ...state.job,
    title: elements.jobTitle.value.trim(),
    location: elements.jobLocation.value.trim(),
    pay: elements.jobPay.value.trim(),
    schedule: elements.jobSchedule.value.trim(),
    interviewTime: elements.interviewTime.value,
    priority: elements.jobPriority.value,
    summary: elements.jobSummary.value.trim(),
    requirements: elements.jobRequirements.value.trim(),
  };
}

function publishJob() {
  if (!guardRecruitingAccess("list jobs")) return;
  if (!elements.jobForm.reportValidity()) return;
  const now = new Date().toISOString();
  state.job = { ...readJobForm(), status: "Live", listedAt: now };
  state.postings = boards.map((board, index) => ({
    ...board,
    status: index < 5 ? "Live" : "Queued",
    applicants: index < 5 ? index + 1 : 0,
    lastSync: now,
  }));
  elements.jobMessage.textContent = "Job listed to active board connectors.";
  saveState();
  render();
}

async function saveIntegration(event) {
  event.preventDefault();
  if (!guardRecruitingAccess("save job board integrations", { adminOnly: true })) return;
  const provider = elements.integrationProvider.value;
  const existing = state.integrations[provider] || emptyIntegration(provider);
  const tokenValue = accessContext.demo || accessContext.locked ? "" : elements.integrationApiToken.value.trim();
  state.integrations[provider] = {
    ...existing,
    provider,
    accountId: elements.integrationAccountId.value.trim(),
    email: elements.integrationEmail.value.trim(),
    tokenConfigured: Boolean(tokenValue) || existing.tokenConfigured,
    tokenLast4: tokenValue ? tokenValue.slice(-4) : existing.tokenLast4,
    webhookUrl: elements.integrationWebhookUrl.value.trim(),
    budget: elements.integrationBudget.value.trim(),
    notes: elements.integrationNotes.value.trim(),
    status: "Saved",
    savedAt: new Date().toISOString(),
  };
  state.connectorSettings = {
    ...state.connectorSettings,
    [`jobboard:${provider}`]: {
      provider,
      accountId: state.integrations[provider].accountId,
      email: state.integrations[provider].email,
      webhookUrl: state.integrations[provider].webhookUrl,
      budget: state.integrations[provider].budget,
      status: state.integrations[provider].status,
      tokenConfigured: state.integrations[provider].tokenConfigured,
      tokenLast4: state.integrations[provider].tokenLast4,
      savedAt: state.integrations[provider].savedAt,
      secrets: "server-side only",
    },
  };
  elements.integrationApiToken.value = "";
  elements.integrationMessage.textContent = accessContext.demo
    ? `${providerLabel(provider)} connector metadata saved. Secrets are disabled in demo mode.`
    : `${providerLabel(provider)} connector metadata saved. Live secrets must be stored server-side.`;
  saveState();
  if (isLiveUnlocked()) {
    try {
      await postRecruitingBackend("/api/recruiting/integration-status", {
        provider,
        publicConfig: state.integrations[provider],
      });
      elements.integrationMessage.textContent = `${providerLabel(provider)} connector status saved to the live workspace.`;
    } catch (error) {
      elements.integrationMessage.textContent = `Connector saved locally, but live status failed: ${error.message}`;
    }
  }
  render();
}

async function testIntegrationConnection() {
  if (!guardRecruitingAccess("test job board connections", { adminOnly: true })) return;
  const provider = elements.integrationProvider.value;
  const integration = state.integrations[provider] || emptyIntegration(provider);
  if (!integration.accountId || !integration.email || (!accessContext.demo && !integration.tokenConfigured)) {
    elements.integrationMessage.textContent = accessContext.demo
      ? `Add ${providerLabel(provider)} account ID and employer email before testing demo metadata.`
      : `Add ${providerLabel(provider)} account ID, employer email, and a server-side token before testing.`;
    return;
  }
  state.integrations[provider] = {
    ...integration,
    status: accessContext.demo ? "Demo connected" : "Live configured",
    lastTestedAt: new Date().toISOString(),
  };
  elements.integrationMessage.textContent = accessContext.demo
    ? `${providerLabel(provider)} connection test passed in demo mode.`
    : `${providerLabel(provider)} connector marked configured for the live workspace.`;
  saveState();
  if (isLiveUnlocked()) {
    try {
      await postRecruitingBackend("/api/recruiting/integration-status", {
        provider,
        publicConfig: state.integrations[provider],
      });
    } catch (error) {
      elements.integrationMessage.textContent = `Connection status updated locally, but live status failed: ${error.message}`;
    }
  }
  render();
}

function refreshBoards() {
  if (!guardRecruitingAccess("refresh job boards")) return;
  const now = new Date().toISOString();
  state.postings = state.postings.map((posting, index) => ({
    ...posting,
    status: posting.status === "Not listed" ? "Ready" : "Live",
    applicants: Math.max(posting.applicants, state.candidates.filter((candidate) => candidate.source === posting.name).length + index),
    lastSync: now,
  }));
  elements.jobMessage.textContent = "Board statuses refreshed.";
  saveState();
  render();
}

function syncApplicants() {
  if (!guardRecruitingAccess("sync applicants")) return;
  const existingEmails = new Set(state.candidates.map((candidate) => candidate.email));
  const nextCandidates = candidatePool
    .filter((candidate) => !existingEmails.has(candidate.email))
    .slice(0, state.candidates.length ? 2 : 4)
    .map((candidate, index) => ({
      ...candidate,
      id: `candidate-${Date.now()}-${index}`,
      jobTitle: state.job.title,
      status: candidate.score >= 75 ? "Qualified" : "New",
      pipelineStage: candidate.score >= 75 ? "screened" : "new",
      assignedRecruiter: "",
      assignedManager: "",
      hiringOutcome: "screening",
      recruiterNotes: "",
      convertedMemberInvitationId: "",
      followUpTaskId: "",
      activityNoteId: "",
      lastHandoffAt: "",
      syncedAt: new Date(Date.now() + index * 1000).toISOString(),
      bookedInterviewId: "",
    }));

  state.candidates = [...state.candidates, ...nextCandidates];
  state.postings = state.postings.map((posting) => ({
    ...posting,
    applicants: state.candidates.filter((candidate) => candidate.source === posting.name).length,
  }));
  elements.jobMessage.textContent = nextCandidates.length
    ? `${nextCandidates.length} applicants synced into one inbox.`
    : "Applicant inbox already has the current demo pool.";
  saveState();
  render();
}

function bookInterviews() {
  if (!guardRecruitingAccess("book interviews")) return;
  const qualified = [...state.candidates]
    .filter((candidate) => candidate.score >= 75 && !candidate.bookedInterviewId)
    .sort((left, right) => right.score - left.score);

  if (!qualified.length) {
    elements.jobMessage.textContent = "No unbooked qualified applicants available.";
    return;
  }

  const existingStarts = new Set(state.interviews.map((interview) => interview.startsAt));
  const slots = nextInterviewSlots(state.job.interviewTime, qualified.length + state.interviews.length).filter(
    (slot) => !existingStarts.has(slot),
  );

  qualified.forEach((candidate, index) => {
    const startsAt = slots[index];
    if (!startsAt) return;
    const interview = {
      id: `interview-${Date.now()}-${index}`,
      candidateId: candidate.id,
      candidateName: candidate.name,
      email: candidate.email,
      phone: candidate.phone,
      source: candidate.source,
      jobTitle: state.job.title,
      startsAt,
      status: "Booked",
    };
    state.interviews.push(interview);
    candidate.bookedInterviewId = interview.id;
    candidate.status = "Booked";
    candidate.pipelineStage = "interview";
  });

  elements.jobMessage.textContent = `${qualified.length} interview calls booked on Monday, Wednesday, and Friday.`;
  saveState();
  render();
}

function nextInterviewSlots(time, count) {
  const slots = [];
  const [hours, minutes] = time.split(":").map(Number);
  const cursor = new Date();
  cursor.setHours(hours, minutes, 0, 0);
  if (cursor < new Date()) cursor.setDate(cursor.getDate() + 1);

  while (slots.length < count + 12) {
    if ([1, 3, 5].includes(cursor.getDay())) {
      slots.push(cursor.toISOString());
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return slots;
}

async function syncCrmFeed() {
  if (!guardRecruitingAccess("sync CRM feed")) return;
  const feed = buildFeed();
  localStorage.setItem(crmFeedKey, JSON.stringify(feed));
  localStorage.setItem(sharedRecruitingFeedKey, JSON.stringify(feed));
  state.feedSyncedAt = feed.syncedAt;
  elements.feedMessage.textContent = accessContext.demo ? "CRM feed synced in the demo workspace." : "CRM feed synced locally.";
  saveState();
  if (isLiveUnlocked()) {
    try {
      await postRecruitingBackend("/api/recruiting/save", {
        state: buildPersistedState(),
        candidates: feed.recruits,
      });
      elements.feedMessage.textContent = "CRM feed synced to live recruiting_candidates.";
    } catch (error) {
      elements.feedMessage.textContent = `CRM feed saved locally, but live sync failed: ${error.message}`;
    }
  }
  render();
}

function buildFeed() {
  return {
    app: "Kira Recruit",
    crmApp: "ClosePilot CRM",
    version: 1,
    syncedAt: new Date().toISOString(),
    workspaceId: accessContext.workspaceId || "",
    accessMode: accessContext.mode,
    role: accessContext.role,
    job: state.job,
    postings: state.postings,
    integrations: Object.values(state.integrations).map((integration) => ({
      provider: integration.provider,
      status: integration.status,
      accountId: integration.accountId,
      email: integration.email,
      webhookUrl: integration.webhookUrl,
      budget: integration.budget,
      tokenConfigured: integration.tokenConfigured,
      lastTestedAt: integration.lastTestedAt,
    })),
    connectorSettings: state.connectorSettings,
    recruits: state.candidates.map(candidateToRecruitRecord),
    interviews: state.interviews,
    onboardingWorkers: state.onboardingWorkers,
    payrollRuns: state.payrollRuns,
    recruiterNotes: state.recruiterNotes,
    hiringOutcomes: state.hiringOutcomes,
    crmHandoffs: state.crmHandoffs,
  };
}

function candidateToRecruitRecord(candidate) {
  const interview = state.interviews.find((item) => item.candidateId === candidate.id);
  return {
    id: candidate.id,
    externalId: candidate.id,
    name: candidate.name,
    email: candidate.email,
    phone: candidate.phone,
    role: candidate.jobTitle || state.job.title || "Sales candidate",
    source: candidate.source,
    interviewStatus: interview?.status || candidate.status || "New",
    interviewAt: interview?.startsAt || "",
    score: candidate.score,
    nextAction: recruitNextAction(candidate, interview),
    pipelineStage: candidateStage(candidate),
    experience: candidate.experience,
    skills: candidate.skills,
    assignedRecruiter: candidate.assignedRecruiter || "",
    assignedManager: candidate.assignedManager || "",
    hiringOutcome: normalizeHiringOutcome(candidate.hiringOutcome),
    recruiterNotes: candidate.recruiterNotes || "",
    convertedMemberInvitationId: candidate.convertedMemberInvitationId || "",
    followUpTaskId: candidate.followUpTaskId || "",
    activityNoteId: candidate.activityNoteId || "",
    lastHandoffAt: candidate.lastHandoffAt || "",
    syncedAt: candidate.syncedAt || new Date().toISOString(),
    reviewed: false,
    convertedLeadId: "",
  };
}

function recruitNextAction(candidate, interview) {
  if (interview?.startsAt) return `Prep interview call for ${formatDate(interview.startsAt)}.`;
  if (candidate.score >= 85) return "Call candidate and confirm availability.";
  if (candidate.score >= 75) return "Book interview for Monday, Wednesday, or Friday.";
  return "Review candidate fit before outreach.";
}

function downloadFeed() {
  if (!guardRecruitingAccess("download the recruiting feed")) return;
  const feed = buildFeed();
  const blob = new Blob([JSON.stringify(feed, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "kira-recruiting-feed.json";
  link.click();
  URL.revokeObjectURL(url);
  elements.feedMessage.textContent = "Recruiting feed downloaded.";
}

function resetRecruiting() {
  state = defaultState();
  localStorage.removeItem(storageKey);
  localStorage.removeItem(crmFeedKey);
  localStorage.removeItem(sharedRecruitingFeedKey);
  hydrateJobForm();
  hydrateIntegrationForm();
  hydratePayrollProviderForm();
  hydrateDefaultDates();
  elements.jobMessage.textContent = "Demo reset.";
  elements.feedMessage.textContent = "";
  render();
}

function render() {
  accessContext = recruitingAccessContext();
  renderAccessState();
  renderMetrics();
  renderCommandCenter();
  renderBoards();
  renderIntegrations();
  renderCandidates();
  renderInterviews();
  renderOnboarding();
  renderPayroll();
  renderFeed();
  renderSubpages();
}

function recruitingAccessContext() {
  const params = new URLSearchParams(window.location.search);
  if (liveAccess) {
    const locked = Boolean(liveAccess.locked);
    const mode = liveAccess.mode || (locked ? "locked" : "live");
    return {
      role: liveAccess.role || "member",
      demo: false,
      enabled: !locked,
      locked,
      setupAllowed: Boolean(liveAccess.setupAllowed),
      workspaceId: liveAccess.workspaceId || "",
      mode,
      message: liveAccess.message || "",
      crmApp: liveAccess.crmApp || "ClosePilot CRM",
      module: liveAccess.module || "Kira Recruit",
      allowedRoles: Array.isArray(liveAccess.allowedRoles) ? liveAccess.allowedRoles : ["owner", "admin", "manager"],
      label: locked ? "Locked paid add-on" : "Live recruiting add-on",
    };
  }
  const role = String(params.get("role") || localStorage.getItem("closepilot-demo-role") || "admin").toLowerCase();
  const addon = params.get("addon");
  const demo = params.get("demo") === "1" || (!hasSupabaseConfig && !params.has("role") && !params.has("addon"));
  const enabled = addon === "enabled" || demo || (!hasSupabaseConfig && !params.has("addon") && ["owner", "admin", "manager"].includes(role));
  const locked = !demo && !enabled;
  return {
    role,
    demo,
    enabled,
    locked,
    setupAllowed: !locked && ["owner", "admin"].includes(role),
    workspaceId: "",
    mode: demo ? "demo" : locked ? "locked" : "preview",
    crmApp: "ClosePilot CRM",
    module: "Kira Recruit",
    allowedRoles: ["owner", "admin", "manager"],
    message: locked
      ? "This workspace does not have the Kira Recruit add-on enabled for your role."
      : demo
        ? "Demo recruiting workspace. Live secrets and paid add-on writes are disabled."
        : "Preview recruiting workspace.",
    label: demo ? "Demo recruiting workspace" : enabled ? "Live recruiting add-on" : "Locked paid add-on",
  };
}

function renderAccessState() {
  elements.syncMode.textContent = accessContext.label;
  if (elements.heroModeBadge) elements.heroModeBadge.textContent = recruitingStatusBadgeLabel(accessContext);
  if (elements.aiModeLabel) {
    elements.aiModeLabel.textContent = accessContext.demo ? "Fallback AI" : accessContext.locked ? "Locked" : "Live signals";
  }
  if (elements.aiModeDetail) {
    elements.aiModeDetail.textContent = accessContext.locked
      ? "Enable the paid add-on to run live recruiting actions."
      : accessContext.demo
        ? "Demo summaries use local applicant data only."
        : "Workspace data powers the recruiter panel.";
  }
  elements.accessBanner.hidden = !accessContext.locked;
  if (elements.accessMessage) elements.accessMessage.textContent = accessContext.message || "Ask an owner or admin to enable Kira Recruit.";
  if (elements.enableAddon) {
    elements.enableAddon.hidden = !(accessContext.locked && accessContext.setupAllowed && shouldUseLiveRecruiting() && currentSession?.access_token);
    elements.enableAddon.disabled = liveLoading;
  }
  if (elements.requestAddon) {
    elements.requestAddon.hidden = !(accessContext.locked && !accessContext.setupAllowed);
  }
  document.body.dataset.addonAccess = accessContext.locked ? "locked" : accessContext.demo ? "demo" : accessContext.mode === "live" ? "live" : "enabled";
  const secretsDisabled = accessContext.demo || accessContext.locked || !accessContext.setupAllowed;
  [elements.integrationApiToken, elements.payrollApiToken].forEach((input) => {
    input.disabled = secretsDisabled;
    input.placeholder = accessContext.demo
      ? "Disabled in demo; connect live provider server-side"
      : accessContext.locked
        ? "Enable Kira Recruit to configure"
        : accessContext.setupAllowed
          ? "Server-side token reference only"
          : "Owner/admin setup only";
  });
  [
    elements.integrationAccountId,
    elements.integrationEmail,
    elements.integrationWebhookUrl,
    elements.integrationBudget,
    elements.integrationNotes,
    elements.integrationProvider,
    elements.testIntegration,
    elements.payrollProvider,
    elements.payrollCompanyId,
  ].forEach((control) => {
    if (control) control.disabled = accessContext.locked || !accessContext.setupAllowed;
  });
}

function recruitingStatusBadgeLabel(context) {
  if (context.locked) return "Locked";
  if (context.demo) return "Demo";
  if (!context.setupAllowed && context.mode !== "live") return "Paid Add-on";
  if (context.mode === "live") return "Live";
  return context.setupAllowed ? "Setup Required" : "Paid Add-on";
}

function guardRecruitingAccess(action, options = {}) {
  if (!accessContext.locked && (!options.adminOnly || accessContext.setupAllowed)) return true;
  const message = accessContext.locked
    ? `Kira Recruit is a locked paid add-on for this workspace. Ask an owner or admin for access before you ${action}.`
    : `Only owners and admins can ${action}.`;
  elements.jobMessage.textContent = message;
  elements.integrationMessage.textContent = message;
  elements.feedMessage.textContent = message;
  if (elements.candidateMessage) elements.candidateMessage.textContent = message;
  elements.onboardingMessage.textContent = message;
  elements.payrollMessage.textContent = message;
  return false;
}

function routeFromLocation() {
  const requestedHash = window.location.hash.replace("#", "");
  const requestedPath = subpageFromPath(window.location.pathname);
  if (recruitSubpageIds.has(requestedHash)) {
    activeSubpage = requestedHash;
    return;
  }
  if (recruitSubpageIds.has(requestedPath)) {
    activeSubpage = requestedPath;
  }
}

function subpageFromPath(pathname) {
  const parts = String(pathname || "").replace(/\/+$/, "").split("/").filter(Boolean);
  if (!parts.length || parts[0] === "recruiting.html") return "dashboard";
  if (parts[0] !== "recruiting") return "";
  return parts[1] || "dashboard";
}

function recruitSubpageUrl(subpage) {
  const url = new URL(window.location.href);
  url.pathname = subpage === "dashboard" ? "/recruiting" : `/recruiting/${subpage}`;
  url.hash = "";
  return `${url.pathname}${url.search}`;
}

function setRecruitSubpage(subpage, options = {}) {
  if (!recruitSubpageIds.has(subpage)) return;
  activeSubpage = subpage;
  const nextUrl = recruitSubpageUrl(subpage);
  const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  if (currentUrl !== nextUrl) {
    history[options.push ? "pushState" : "replaceState"](null, "", nextUrl);
  }
  renderSubpages();
  if (options.push && elements.pageArea) {
    elements.pageArea.scrollIntoView({ block: "start", behavior: "auto" });
  }
}

function renderSubpages() {
  const pageMeta = recruitSubpages.find((page) => page.id === activeSubpage) || recruitSubpages[0];

  if (elements.pageTitle) {
    elements.pageTitle.textContent = pageMeta.title || pageMeta.label;
  }
  if (elements.pageEyebrow) {
    elements.pageEyebrow.textContent = pageMeta.eyebrow || "Kira Recruit";
  }
  if (elements.pageArea) {
    elements.pageArea.dataset.activeSubpage = pageMeta.id;
  }
  document.title =
    pageMeta.id === "dashboard" ? "Kira Recruit" : `${pageMeta.title || pageMeta.label} | Kira Recruit`;

  elements.subpageNav.innerHTML = recruitSubpages
    .map(
      (page) => `
        <a class="${page.id === activeSubpage ? "active" : ""}" data-recruit-subpage="${page.id}" href="${recruitSubpageUrl(page.id)}"${page.id === activeSubpage ? ' aria-current="page"' : ""}>
          ${escapeHtml(page.label)}
        </a>
      `,
    )
    .join("");

  document.querySelectorAll("section[data-recruit-subpage]").forEach((section) => {
    const isActive = section.dataset.recruitSubpage === activeSubpage;
    section.hidden = !isActive;
    section.classList.toggle("active-recruit-page", isActive);
    section.setAttribute("aria-hidden", isActive ? "false" : "true");
  });
}

function renderMetrics() {
  elements.livePostings.textContent = state.postings.filter((posting) => posting.status === "Live").length;
  elements.applicantCount.textContent = state.candidates.length;
  elements.qualifiedCount.textContent = state.candidates.filter((candidate) => candidate.score >= 85).length;
  elements.bookedCount.textContent = state.interviews.length;
  if (elements.hiresInProgress) {
    elements.hiresInProgress.textContent = state.candidates.filter((candidate) =>
      ["offer", "hired", "onboarding"].includes(candidateStage(candidate)),
    ).length;
  }
  if (elements.hiringVelocity) {
    elements.hiringVelocity.textContent = `${state.interviews.length} ${state.interviews.length === 1 ? "call" : "calls"}`;
  }
}

function renderCommandCenter() {
  renderHeroPriority();
  renderNextBestHire();
  renderPipelineBoard();
  renderAiRecruiterPanel();
  renderDashboardLists();
  renderMobileTabs();
  if (activeCandidateId && elements.candidateDetailSheet && !elements.candidateDetailSheet.hidden) {
    renderCandidateDetail();
  }
}

function renderHeroPriority() {
  const best = bestOpenCandidate();
  if (!elements.heroBestCandidate || !elements.heroBestAction) return;
  if (!best) {
    elements.heroBestCandidate.textContent = accessContext.locked ? "Locked" : "Sync applicants";
    elements.heroBestAction.textContent = accessContext.locked
      ? "Ask an owner or admin to enable Kira Recruit."
      : "Add candidate data to calculate the next best hire.";
    return;
  }
  elements.heroBestCandidate.textContent = best.name;
  elements.heroBestAction.textContent = dashboardNextAction(best);
}

function renderNextBestHire() {
  if (!elements.nextBestHire) return;
  const best = bestOpenCandidate();
  if (accessContext.locked) {
    elements.nextBestHire.innerHTML = `
      <article class="spotlight-card locked">
        <div>
          <p class="eyebrow">Locked paid add-on</p>
          <h2>Enable Kira Recruit to unlock hiring recommendations</h2>
          <p>${escapeHtml(accessContext.message || "Members can view demo states, but live recruiting actions require add-on access.")}</p>
        </div>
        <div class="spotlight-actions">
          <a class="secondary-button" href="/recruiting?demo=1">View Demo</a>
          <a class="primary-button" href="/#admin">Back to CRM</a>
        </div>
      </article>
    `;
    return;
  }
  if (!best) {
    elements.nextBestHire.innerHTML = `
      <article class="spotlight-card">
        <div>
          <p class="eyebrow">Next Best Hire</p>
          <h2>No candidate signal yet</h2>
          <p>Sync applicants or add candidate data to see who should get the next call, interview, or offer.</p>
        </div>
        <button class="primary-button" data-pipeline-action="sync-applicants" type="button">Add Candidate</button>
      </article>
    `;
    return;
  }
  const interview = candidateInterview(best);
  elements.nextBestHire.innerHTML = `
    <article class="spotlight-card">
      <div class="spotlight-score">
        ${scoreRing(best.score)}
        <span>${escapeHtml(scoreLabel(best))}</span>
      </div>
      <div>
        <p class="eyebrow">Next Best Hire</p>
        <h2>${escapeHtml(best.name)} for ${escapeHtml(best.jobTitle || state.job.title)}</h2>
        <p>${escapeHtml(candidateWhy(best))}</p>
        <div class="spotlight-meta">
          <span>${escapeHtml(best.source)}</span>
          <span>${escapeHtml(candidateStageLabel(best))}</span>
          <span>${interview ? escapeHtml(formatDate(interview.startsAt)) : "No call booked"}</span>
        </div>
      </div>
      <div class="spotlight-actions">
        <button class="secondary-button" data-pipeline-action="detail" data-candidate-id="${escapeHtml(best.id)}" type="button">View details</button>
        <button class="primary-button" data-pipeline-action="move" data-candidate-id="${escapeHtml(best.id)}" type="button">Move to next stage</button>
      </div>
    </article>
  `;
}

function renderPipelineBoard() {
  if (!elements.pipelineBoard) return;
  renderMobileStageTabs();
  const grouped = pipelineStages.reduce((memo, stage) => ({ ...memo, [stage.id]: [] }), {});
  state.candidates.forEach((candidate) => {
    grouped[candidateStage(candidate)].push(candidate);
  });
  Object.values(grouped).forEach((candidates) => candidates.sort((left, right) => right.score - left.score));
  elements.pipelineBoard.innerHTML = pipelineStages
    .map((stage) => {
      const candidates = grouped[stage.id] || [];
      return `
        <section class="pipeline-column" data-pipeline-stage="${stage.id}" aria-labelledby="pipeline-${stage.id}">
          <div class="pipeline-column-header">
            <h3 id="pipeline-${stage.id}">${escapeHtml(stage.label)}</h3>
            <span>${candidates.length}</span>
          </div>
          <p class="pipeline-hint">${escapeHtml(stageHint(stage.id))}</p>
          <div class="pipeline-card-stack">
            ${
              candidates.length
                ? candidates.map(renderPipelineCard).join("")
                : `<p class="pipeline-empty">No ${escapeHtml(stage.label.toLowerCase())} candidates yet.</p>`
            }
          </div>
        </section>
      `;
    })
    .join("");
}

function renderMobileStageTabs() {
  if (!elements.dashboard || !elements.mobilePipelineStages) return;
  if (!pipelineStageIds.has(activeMobileStage)) activeMobileStage = "new";
  elements.dashboard.dataset.mobileStage = activeMobileStage;
  const grouped = pipelineStages.reduce((memo, stage) => ({ ...memo, [stage.id]: 0 }), {});
  state.candidates.forEach((candidate) => {
    grouped[candidateStage(candidate)] += 1;
  });
  elements.mobilePipelineStages.innerHTML = pipelineStages
    .map(
      (stage) => `
        <button class="${stage.id === activeMobileStage ? "active" : ""}" type="button" data-mobile-pipeline-stage="${stage.id}"${stage.id === activeMobileStage ? ' aria-current="page"' : ""}>
          ${escapeHtml(stage.label)}
          <span>${grouped[stage.id]}</span>
        </button>
      `,
    )
    .join("");
}

function renderPipelineCard(candidate) {
  const stage = candidateStage(candidate);
  const interview = candidateInterview(candidate);
  const disabled = accessContext.locked ? "disabled" : "";
  const canMove = !accessContext.locked && stage !== "onboarding";
  const canSchedule = !accessContext.locked && !interview && !["hired", "onboarding"].includes(stage);
  const recentlyMoved = candidate.stageMovedAt && Date.now() - Number(candidate.stageMovedAt) < 2400;
  return `
    <article class="pipeline-card ${escapeHtml(scoreLabel(candidate).toLowerCase())} ${recentlyMoved ? "stage-moved" : ""}" data-candidate-card="${escapeHtml(candidate.id)}">
      <div class="pipeline-card-top">
        <button class="candidate-name-button" data-pipeline-action="detail" data-candidate-id="${escapeHtml(candidate.id)}" type="button">
          <strong>${escapeHtml(candidate.name)}</strong>
          <span>${escapeHtml(candidate.jobTitle || state.job.title)}</span>
        </button>
        <div class="pipeline-score-block">
          ${scoreRing(candidate.score)}
          <span class="status-chip">${escapeHtml(scoreLabel(candidate))}</span>
        </div>
      </div>
      <p>${escapeHtml(dashboardNextAction(candidate))}</p>
      <div class="tag-row">
        <span>${escapeHtml(candidate.source)}</span>
        <span>${escapeHtml(candidateStageLabel(candidate))}</span>
        <span>Last touch ${escapeHtml(formatShortDate(candidate.lastHandoffAt || candidate.syncedAt))}</span>
      </div>
      <div class="pipeline-quick-actions" aria-label="Quick actions for ${escapeHtml(candidate.name)}">
        <button class="secondary-button" data-pipeline-action="message" data-candidate-id="${escapeHtml(candidate.id)}" type="button" ${disabled}>Message</button>
        <button class="secondary-button" data-pipeline-action="schedule" data-candidate-id="${escapeHtml(candidate.id)}" type="button" ${canSchedule ? "" : "disabled"}>Schedule</button>
        <button class="secondary-button" data-pipeline-action="notes" data-candidate-id="${escapeHtml(candidate.id)}" type="button">Notes</button>
        <button class="primary-button" data-pipeline-action="move" data-candidate-id="${escapeHtml(candidate.id)}" type="button" ${canMove ? "" : "disabled"}>Move Stage</button>
      </div>
    </article>
  `;
}

function renderAiRecruiterPanel() {
  if (!elements.aiRecruiterPanel) return;
  const best = bestOpenCandidate();
  if (accessContext.locked) {
    elements.aiRecruiterPanel.innerHTML = `
      <div class="ai-panel-heading">
        <p class="eyebrow">AI Recruiter</p>
        <h2>Locked paid add-on</h2>
        <span class="mode-pill">Members see demo only</span>
      </div>
      <p class="ai-copy">Live candidate recommendations require the Kira Recruit add-on for this ClosePilot CRM workspace.</p>
      <a class="primary-button" href="/recruiting?demo=1">Open demo workspace</a>
    `;
    return;
  }
  if (!best) {
    elements.aiRecruiterPanel.innerHTML = `
      <div class="ai-panel-heading">
        <p class="eyebrow">AI Recruiter</p>
        <h2>Waiting for candidates</h2>
        <span class="mode-pill">${escapeHtml(accessContext.demo ? "Fallback/demo AI" : "Live signals")}</span>
      </div>
      <p class="ai-copy">Sync applicants to generate a best-candidate recommendation, interview prep, red flags, and outreach copy.</p>
      <button class="primary-button" data-ai-candidate-action="sync" type="button">Add Candidate</button>
    `;
    elements.aiRecruiterPanel.querySelector("[data-ai-candidate-action='sync']")?.addEventListener("click", () => syncApplicants());
    return;
  }
  const questions = interviewQuestions(best);
  const risks = candidateRedFlags(best);
  elements.aiRecruiterPanel.innerHTML = `
    <div class="ai-panel-heading">
      <p class="eyebrow">AI Recruiter</p>
      <h2>${escapeHtml(best.name)}</h2>
      <span class="mode-pill">${escapeHtml(accessContext.demo ? "Fallback/demo AI" : "Live workspace signals")}</span>
    </div>
    <div class="ai-callout">
      <span>Best candidate</span>
      <strong>${escapeHtml(candidateWhy(best))}</strong>
    </div>
    <section>
      <h3>Suggested next action</h3>
      <p>${escapeHtml(dashboardNextAction(best))}</p>
    </section>
    <section>
      <h3>Interview prep</h3>
      <ul>${questions.map((question) => `<li>${escapeHtml(question)}</li>`).join("")}</ul>
    </section>
    <section>
      <h3>Red flags to check</h3>
      <ul>${risks.map((risk) => `<li>${escapeHtml(risk)}</li>`).join("")}</ul>
    </section>
    <section>
      <h3>Outreach message</h3>
      <p class="message-draft">${escapeHtml(outreachMessage(best))}</p>
    </section>
    ${["hired", "onboarding"].includes(candidateStage(best)) ? `<section><h3>Onboarding reminder</h3><p>Confirm packet status, payroll provider setup, and CRM team invitation before start date.</p></section>` : ""}
    <div class="ai-actions">
      <button class="secondary-button" data-ai-candidate-action="detail" data-candidate-id="${escapeHtml(best.id)}" type="button">Open profile</button>
      <button class="secondary-button" data-ai-candidate-action="copy-message" data-candidate-id="${escapeHtml(best.id)}" type="button">Copy message</button>
      <button class="secondary-button" data-ai-candidate-action="schedule" data-candidate-id="${escapeHtml(best.id)}" type="button" ${candidateInterview(best) ? "disabled" : ""}>Schedule</button>
      <button class="primary-button" data-ai-candidate-action="move" data-candidate-id="${escapeHtml(best.id)}" type="button">Move stage</button>
    </div>
  `;
}

function renderDashboardLists() {
  if (elements.upcomingInterviews) {
    const interviews = [...state.interviews].sort((left, right) => String(left.startsAt).localeCompare(String(right.startsAt))).slice(0, 4);
    elements.upcomingInterviews.innerHTML = interviews.length
      ? interviews
          .map(
            (interview) => `
              <article class="mini-row">
                <div>
                  <strong>${escapeHtml(interview.candidateName)}</strong>
                  <span>${escapeHtml(interview.jobTitle)} · Screening call · ${escapeHtml(interview.interviewer || "Hiring manager")}</span>
                </div>
                <div class="mini-row-actions">
                  <time>${escapeHtml(formatDate(interview.startsAt))}</time>
                  <button class="secondary-button" data-pipeline-action="prep-interview" data-candidate-id="${escapeHtml(interview.candidateId)}" type="button">Prep Interview</button>
                </div>
              </article>
            `,
          )
          .join("")
      : '<p class="empty-state">No interviews booked. Use Schedule or Book calls to create Monday, Wednesday, Friday calls.</p>';
  }
  if (elements.recruitingTasks) {
    const tasks = recruitingTaskList();
    elements.recruitingTasks.innerHTML = tasks.length
      ? tasks
          .map(
            (task) => `
              <article class="mini-row">
                <div>
                  <strong>${escapeHtml(task.title)}</strong>
                  <span>${escapeHtml(task.detail)}</span>
                  <small>${escapeHtml(task.priority)} priority · Due ${escapeHtml(task.due)}</small>
                </div>
                <div class="mini-row-actions">
                  <button class="secondary-button" data-pipeline-action="complete-task" data-candidate-id="${escapeHtml(task.candidateId)}" type="button">Complete</button>
                  <button class="secondary-button" data-pipeline-action="detail" data-candidate-id="${escapeHtml(task.candidateId)}" type="button">Open</button>
                </div>
              </article>
            `,
          )
          .join("")
      : '<p class="empty-state">Recruiting tasks appear after candidates are synced.</p>';
  }
}

function renderMobileTabs() {
  if (!elements.dashboard || !elements.mobileRecruitTabs) return;
  elements.dashboard.dataset.mobileTab = activeMobileTab;
  elements.mobileRecruitTabs.querySelectorAll("[data-mobile-recruit-tab]").forEach((button) => {
    const active = button.dataset.mobileRecruitTab === activeMobileTab;
    button.classList.toggle("active", active);
    if (active) {
      button.setAttribute("aria-current", "page");
    } else {
      button.removeAttribute("aria-current");
    }
  });
}

function handlePipelineAction(candidateId, action) {
  if (action === "sync" || action === "sync-applicants") {
    syncApplicants();
    return;
  }
  const candidate = state.candidates.find((item) => item.id === candidateId);
  if (!candidate) return;
  if (action === "detail" || action === "notes") {
    openCandidateDetail(candidate.id);
    return;
  }
  if (action === "move") {
    moveCandidateToNextStage(candidate.id);
    return;
  }
  if (action === "schedule") {
    scheduleCandidateInterview(candidate.id);
    return;
  }
  if (action === "message") {
    if (!guardRecruitingAccess("message candidates")) return;
    candidate.lastHandoffAt = new Date().toISOString();
    candidate.recruiterNotes = candidate.recruiterNotes || outreachMessage(candidate);
    elements.candidateMessage.textContent = `Outreach draft staged for ${candidate.name}.`;
    saveState();
    render();
  }
  if (action === "copy-message") {
    const message = outreachMessage(candidate);
    navigator.clipboard?.writeText(message).catch(() => {});
    candidate.lastHandoffAt = new Date().toISOString();
    elements.candidateMessage.textContent = `Outreach message copied for ${candidate.name}.`;
    saveState();
    render();
  }
  if (action === "prep-interview") {
    openCandidateDetail(candidate.id);
    elements.candidateMessage.textContent = `Interview prep opened for ${candidate.name}.`;
  }
  if (action === "complete-task") {
    candidate.lastHandoffAt = new Date().toISOString();
    recordCandidateHandoff("complete-task", candidate, {
      action: "complete-task",
      performedAt: candidate.lastHandoffAt,
    });
    elements.candidateMessage.textContent = `Recruiting task completed for ${candidate.name}.`;
    saveState();
    render();
  }
}

function moveCandidateToNextStage(candidateId) {
  const candidate = state.candidates.find((item) => item.id === candidateId);
  if (!candidate) return;
  const nextStage = nextPipelineStage(candidateStage(candidate));
  if (!nextStage) {
    elements.candidateMessage.textContent = `${candidate.name} is already in the final onboarding stage.`;
    return;
  }
  setCandidateStage(candidateId, nextStage);
}

function setCandidateStage(candidateId, stageId) {
  if (!guardRecruitingAccess("move candidates through the hiring pipeline")) return;
  const candidate = state.candidates.find((item) => item.id === candidateId);
  if (!candidate || !pipelineStageIds.has(stageId)) return;
  const stage = pipelineStages.find((item) => item.id === stageId);
  const previousStage = candidateStage(candidate);
  candidate.pipelineStage = stage.id;
  candidate.status = stage.status;
  candidate.hiringOutcome = stage.id === "offer" ? "offer" : ["hired", "onboarding"].includes(stage.id) ? "hired" : candidate.hiringOutcome;
  candidate.lastHandoffAt = new Date().toISOString();
  candidate.stageMovedAt = Date.now();
  recordCandidateHandoff("stage-change", candidate, {
    action: "stage-change",
    fromStage: previousStage,
    toStage: stage.id,
    performedAt: candidate.lastHandoffAt,
  });
  elements.candidateMessage.textContent = `${candidate.name} moved to ${stage.label}.`;
  saveState();
  render();
}

function scheduleCandidateInterview(candidateId) {
  if (!guardRecruitingAccess("schedule interviews")) return;
  const candidate = state.candidates.find((item) => item.id === candidateId);
  if (!candidate) return;
  if (candidateInterview(candidate)) {
    elements.candidateMessage.textContent = `${candidate.name} already has an interview booked.`;
    return;
  }
  const existingStarts = new Set(state.interviews.map((interview) => interview.startsAt));
  const startsAt = nextInterviewSlots(state.job.interviewTime, state.interviews.length + 1).find((slot) => !existingStarts.has(slot));
  const interview = {
    id: `interview-${Date.now()}`,
    candidateId: candidate.id,
    candidateName: candidate.name,
    email: candidate.email,
    phone: candidate.phone,
    source: candidate.source,
    jobTitle: state.job.title,
    startsAt,
    status: "Booked",
  };
  state.interviews.push(interview);
  candidate.bookedInterviewId = interview.id;
  candidate.status = "Booked";
  candidate.pipelineStage = "interview";
  candidate.hiringOutcome = "interviewing";
  elements.candidateMessage.textContent = `${candidate.name} interview booked for ${formatDate(startsAt)}.`;
  saveState();
  render();
}

function openCandidateDetail(candidateId) {
  activeCandidateId = candidateId;
  renderCandidateDetail();
  if (elements.candidateDetailSheet) {
    elements.candidateDetailSheet.hidden = false;
    elements.closeCandidateDetail?.focus();
  }
}

function closeCandidateDetail() {
  activeCandidateId = "";
  if (elements.candidateDetailSheet) elements.candidateDetailSheet.hidden = true;
}

function renderCandidateDetail() {
  if (!elements.candidateDetailBody || !activeCandidateId) return;
  const candidate = state.candidates.find((item) => item.id === activeCandidateId);
  if (!candidate) {
    closeCandidateDetail();
    return;
  }
  const stage = candidateStage(candidate);
  const interview = candidateInterview(candidate);
  const checklist = onboardingChecklist(candidate);
  const completed = checklist.filter((item) => item.done).length;
  const progress = checklist.length ? Math.round((completed / checklist.length) * 100) : 0;
  document.querySelector("#candidateDetailTitle").textContent = candidate.name;
  elements.candidateDetailBody.innerHTML = `
    <section class="detail-profile">
      <div>
        <p class="eyebrow">${escapeHtml(candidate.source)} · ${escapeHtml(candidate.email)}</p>
        <h3>${escapeHtml(candidate.jobTitle || state.job.title)}</h3>
        <p>${escapeHtml(candidate.experience || "No resume summary yet.")}</p>
        <div class="tag-row">${candidate.skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join("")}</div>
      </div>
      <div class="detail-score">
        ${scoreRing(candidate.score)}
        <strong>${escapeHtml(scoreLabel(candidate))}</strong>
      </div>
    </section>
    <section class="detail-grid">
      <article>
        <h4>Score breakdown</h4>
        ${scoreBreakdown(candidate)
          .map((item) => `<div class="score-line"><span>${escapeHtml(item.label)}</span><strong>${item.value}</strong></div>`)
          .join("")}
      </article>
      <article>
        <h4>Resume placeholders</h4>
        <p>Resume parsing and job board attachments require provider API setup. Beta users can use notes, source, skills, and interview history today.</p>
      </article>
      <article>
        <h4>AI summary</h4>
        <p>${escapeHtml(candidateWhy(candidate))}</p>
        <p>${escapeHtml(dashboardNextAction(candidate))}</p>
      </article>
      <article>
        <h4>Timeline</h4>
        ${candidateTimeline(candidate, interview)
          .map((item) => `<div class="timeline-row"><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></div>`)
          .join("")}
      </article>
    </section>
    <section class="stage-control-panel">
      <h4>Stage controls</h4>
      <div class="stage-control-row">
        ${pipelineStages
          .map(
            (item) => `
              <button class="secondary-button ${item.id === stage ? "active-stage" : ""}" data-detail-stage="${item.id}" data-candidate-id="${escapeHtml(candidate.id)}" type="button" ${accessContext.locked ? "disabled" : ""}>
                ${escapeHtml(item.label)}
              </button>
            `,
          )
          .join("")}
      </div>
    </section>
    <section class="detail-grid">
      <article>
        <h4>Recruiter notes</h4>
        <p>${escapeHtml(candidate.recruiterNotes || "No recruiter notes saved yet.")}</p>
      </article>
      <article>
        <h4>Interviews</h4>
        <p>${interview ? escapeHtml(`${interview.status} for ${formatDate(interview.startsAt)}`) : "No interview booked yet."}</p>
      </article>
      <article class="onboarding-progress-card">
        <h4>Onboarding checklist</h4>
        <div class="progress-track"><span style="width: ${progress}%"></span></div>
        <p>${completed} of ${checklist.length} complete</p>
        <ul>${checklist.map((item) => `<li class="${item.done ? "done" : ""}">${escapeHtml(item.label)}</li>`).join("")}</ul>
      </article>
    </section>
  `;
}

function bestOpenCandidate() {
  return [...state.candidates]
    .filter((candidate) => !["hired", "onboarding"].includes(candidateStage(candidate)))
    .sort((left, right) => right.score - left.score || String(right.syncedAt).localeCompare(String(left.syncedAt)))[0];
}

function candidateStage(candidate) {
  if (candidate?.pipelineStage && pipelineStageIds.has(candidate.pipelineStage)) return candidate.pipelineStage;
  const outcome = normalizeHiringOutcome(candidate?.hiringOutcome);
  if (outcome === "offer") return "offer";
  if (outcome === "hired") return "hired";
  return normalizePipelineStage(candidate?.status || candidate?.interviewStatus || "new");
}

function normalizePipelineStage(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (pipelineStageIds.has(raw)) return raw;
  if (raw.includes("onboard")) return "onboarding";
  if (raw.includes("hired") || raw.includes("converted")) return "hired";
  if (raw.includes("offer")) return "offer";
  if (raw.includes("book") || raw.includes("interview")) return "interview";
  if (raw.includes("qualified") || raw.includes("screen")) return "screened";
  return "new";
}

function nextPipelineStage(stageId) {
  const index = pipelineStages.findIndex((stage) => stage.id === stageId);
  return index >= 0 && index < pipelineStages.length - 1 ? pipelineStages[index + 1].id : "";
}

function candidateStageLabel(candidate) {
  return pipelineStages.find((stage) => stage.id === candidateStage(candidate))?.label || "New";
}

function candidateInterview(candidate) {
  return state.interviews.find((interview) => interview.candidateId === candidate.id || interview.email === candidate.email);
}

function dashboardNextAction(candidate) {
  const stage = candidateStage(candidate);
  const interview = candidateInterview(candidate);
  if (stage === "onboarding") return "Finish onboarding packet, payroll setup, and first-week manager handoff.";
  if (stage === "hired") return "Convert to team member, send onboarding packet, and assign their manager.";
  if (stage === "offer") return "Send offer details and confirm start date.";
  if (stage === "interview") return interview ? `Prep interview call for ${formatDate(interview.startsAt)}.` : "Schedule interview and prep role-fit questions.";
  if (stage === "screened") return candidate.score >= 85 ? "Call candidate first and confirm availability." : "Book interview for Monday, Wednesday, or Friday.";
  return "Review resume, phone fit, and sales role alignment.";
}

function candidateWhy(candidate) {
  const skills = Array.isArray(candidate.skills) && candidate.skills.length ? candidate.skills.slice(0, 2).join(", ") : "relevant sales signals";
  return `${candidate.name} has a ${candidate.score} score with ${skills}, making them the strongest current fit for ${candidate.jobTitle || state.job.title}.`;
}

function candidateRedFlags(candidate) {
  const risks = [];
  if (candidate.score < 80) risks.push("Lower score. Confirm phone confidence before booking too much manager time.");
  if (!candidate.email || !candidate.phone) risks.push("Missing contact info. Confirm outreach details before follow-up.");
  if (!String(candidate.experience || "").toLowerCase().includes("crm")) risks.push("Ask how they document calls and update CRM records.");
  if (!risks.length) risks.push("Confirm schedule fit, compensation expectations, and ability to handle rejection.");
  return risks;
}

function interviewQuestions(candidate) {
  return [
    `Walk me through your best phone sales or appointment-setting day.`,
    `How do you document a call outcome in a CRM after a tough conversation?`,
    `What schedule and ramp expectations work for this ${candidate.jobTitle || state.job.title} role?`,
  ];
}

function outreachMessage(candidate) {
  return `Hi ${candidate.name}, this is Kira Recruit for ${state.job.title}. Your background stood out, especially ${candidate.skills?.[0] || "your sales experience"}. Are you open to a quick interview call this week?`;
}

function recruitingTaskList() {
  return [...state.candidates]
    .sort((left, right) => right.score - left.score)
    .slice(0, 5)
    .map((candidate) => ({
      candidateId: candidate.id,
      title: dashboardNextAction(candidate),
      detail: `${candidate.name} · ${candidateStageLabel(candidate)} · ${candidate.source}`,
      priority: candidate.score >= 90 ? "High" : candidate.score >= 80 ? "Medium" : "Normal",
      due: candidateStage(candidate) === "interview" ? "today" : "this week",
    }));
}

function onboardingChecklist(candidate) {
  const worker = state.onboardingWorkers.find((item) => item.email?.toLowerCase() === candidate.email?.toLowerCase() || item.name === candidate.name);
  const payrollRun = state.payrollRuns.find((run) => run.workerName === candidate.name || run.workerId === worker?.id);
  return [
    { label: "Team member invitation staged", done: Boolean(candidate.convertedMemberInvitationId || ["hired", "onboarding"].includes(candidateStage(candidate))) },
    { label: "Onboarding packet created", done: Boolean(worker) },
    { label: "Tax packet or provider status tracked", done: Boolean(worker && worker.taxStatus !== "Not sent") },
    { label: "Payroll workflow ready", done: Boolean(state.payrollProvider.companyId || payrollRun) },
  ];
}

function scoreBreakdown(candidate) {
  return [
    { label: "Sales fit", value: candidate.score },
    { label: "CRM readiness", value: Math.max(50, candidate.score - 6) },
    { label: "Availability confidence", value: Math.max(50, candidate.score - 10) },
  ];
}

function candidateTimeline(candidate, interview) {
  return [
    { label: "Synced", value: formatShortDate(candidate.syncedAt) },
    { label: "Last touch", value: formatShortDate(candidate.lastHandoffAt || candidate.syncedAt) },
    { label: "Interview", value: interview ? formatDate(interview.startsAt) : "Not booked" },
    { label: "Outcome", value: outcomeLabel(candidate.hiringOutcome) },
  ];
}

function scoreLabel(candidate) {
  if (candidate.score >= 90) return "Priority";
  if (candidate.score >= 80) return "Strong";
  if (candidate.score >= 70) return "Review";
  return "Watch";
}

function scoreRing(score) {
  const value = Math.max(0, Math.min(100, Number(score || 0)));
  return `<div class="score-ring" style="--score-angle: ${value * 3.6}deg" aria-label="Candidate score ${value}"><strong>${value}</strong><span>score</span></div>`;
}

function stageHint(stageId) {
  const hints = {
    new: "Review source and resume signal.",
    screened: "Call or schedule the strongest fits.",
    interview: "Prep scorecard and manager questions.",
    offer: "Confirm comp, start date, and manager fit.",
    hired: "Create CRM team member and onboarding packet.",
    onboarding: "Track packet, payroll, and first-week handoff.",
  };
  return hints[stageId] || "Move candidates with the stage buttons.";
}

function renderBoards() {
  elements.boardList.innerHTML = state.postings
    .map(
      (posting) => `
        <article class="board-row">
          <div>
            <strong>${escapeHtml(posting.name)}</strong>
            <span>${escapeHtml(posting.type)}</span>
          </div>
          <div class="board-stats">
            <span>${posting.applicants} applicants</span>
            <strong class="${posting.status === "Live" ? "live" : ""}">${escapeHtml(posting.status)}</strong>
          </div>
        </article>
      `,
    )
    .join("");
}

function renderIntegrations() {
  elements.integrationGrid.innerHTML = Object.entries(integrationProviders)
    .map(([providerId, provider]) => renderIntegrationCard(state.integrations[providerId] || emptyIntegration(providerId), provider))
    .join("");
}

function renderIntegrationCard(integration, provider) {
  const connected = integration?.status === "Demo connected";
  const saved = Boolean(integration?.savedAt);
  return `
    <article class="integration-card ${connected ? "connected" : ""}">
      <div>
        <span>${escapeHtml(provider.accountLabel)}</span>
        <strong>${escapeHtml(provider.label)}</strong>
        <p>${escapeHtml(provider.detail)}</p>
      </div>
      <div class="integration-facts">
        <span>${escapeHtml(integration?.accountId || "No account ID yet")}</span>
        <span>${integration?.tokenConfigured ? `Token configured ••••${escapeHtml(integration.tokenLast4 || "****")}` : "Token not configured"}</span>
        <span>${escapeHtml(integration?.budget || "No default budget")}</span>
      </div>
      <strong class="connection-status">${connected ? "Connected" : saved ? "Saved" : "Not connected"}</strong>
    </article>
  `;
}

function renderCandidates() {
  const candidates = filteredCandidates();
  elements.candidateList.innerHTML = candidates.length
    ? candidates
        .map(
          (candidate) => {
            const scoreLabel = candidate.score >= 85 ? "Priority" : candidate.score >= 75 ? "Qualified" : "Review";
            const nextAction =
              candidate.status === "Booked"
                ? "Prep interview questions"
                : candidate.score >= 85
                  ? "Call candidate first"
                  : candidate.score >= 75
                    ? "Book interview"
                    : "Review fit";
            return `
            <article class="candidate-card ${scoreLabel.toLowerCase()}">
              <div class="candidate-head">
                <div>
                  <strong>${escapeHtml(candidate.name)}</strong>
                  <span>${escapeHtml(candidate.source)} - ${escapeHtml(candidate.email)}</span>
                </div>
                <b aria-label="Candidate score ${candidate.score}">${candidate.score}</b>
              </div>
              <p>${escapeHtml(candidate.experience)}</p>
              <div class="tag-row">
                ${candidate.skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join("")}
              </div>
              <div class="candidate-insight-row">
                <span>${scoreLabel} candidate</span>
                <strong>${nextAction}</strong>
              </div>
              <div class="candidate-foot">
                <span>${escapeHtml(candidate.phone)}</span>
                <strong>${escapeHtml(candidate.status)} · ${escapeHtml(outcomeLabel(candidate.hiringOutcome))}</strong>
              </div>
              <div class="candidate-crm-controls" aria-label="CRM handoff controls for ${escapeHtml(candidate.name)}">
                <label>
                  Recruiter
                  <input data-candidate-field="assignedRecruiter" data-candidate-id="${escapeHtml(candidate.id)}" type="text" value="${escapeHtml(candidate.assignedRecruiter || "")}" placeholder="Recruiter owner" />
                </label>
                <label>
                  Manager
                  <input data-candidate-field="assignedManager" data-candidate-id="${escapeHtml(candidate.id)}" type="text" value="${escapeHtml(candidate.assignedManager || "")}" placeholder="Hiring manager" />
                </label>
                <label>
                  Outcome
                  <select data-candidate-field="hiringOutcome" data-candidate-id="${escapeHtml(candidate.id)}">
                    ${hiringOutcomeOptions
                      .map(
                        ([value, label]) =>
                          `<option value="${escapeHtml(value)}" ${normalizeHiringOutcome(candidate.hiringOutcome) === value ? "selected" : ""}>${escapeHtml(label)}</option>`,
                      )
                      .join("")}
                  </select>
                </label>
                <label class="candidate-note-field">
                  Recruiter note
                  <textarea data-candidate-field="recruiterNotes" data-candidate-id="${escapeHtml(candidate.id)}" rows="2" placeholder="Screening notes and next step">${escapeHtml(candidate.recruiterNotes || "")}</textarea>
                </label>
                <div class="candidate-action-row">
                  <button class="secondary-button" data-candidate-action="save-handoff" data-candidate-id="${escapeHtml(candidate.id)}" type="button">Save handoff</button>
                  <button class="secondary-button" data-candidate-action="create-follow-up-task" data-candidate-id="${escapeHtml(candidate.id)}" type="button">Create task</button>
                  <button class="secondary-button" data-candidate-action="add-activity-note" data-candidate-id="${escapeHtml(candidate.id)}" type="button">Add note</button>
                  <button class="primary-button" data-candidate-action="convert-team-member" data-candidate-id="${escapeHtml(candidate.id)}" type="button">Convert team</button>
                </div>
                <div class="handoff-facts">
                  ${candidate.followUpTaskId ? `<span>Task linked</span>` : ""}
                  ${candidate.activityNoteId ? `<span>Activity linked</span>` : ""}
                  ${candidate.convertedMemberInvitationId ? `<span>Invite staged</span>` : ""}
                  ${candidate.lastHandoffAt ? `<span>Last handoff ${escapeHtml(new Date(candidate.lastHandoffAt).toLocaleDateString())}</span>` : ""}
                </div>
              </div>
            </article>
          `;
          },
        )
        .join("")
    : '<p class="empty-state">No applicants synced yet.</p>';
  elements.candidateList.querySelectorAll("[data-candidate-field]").forEach((field) => {
    field.addEventListener("change", () => updateCandidateField(field.dataset.candidateId, field.dataset.candidateField, field.value));
    field.addEventListener("blur", () => updateCandidateField(field.dataset.candidateId, field.dataset.candidateField, field.value));
  });
  elements.candidateList.querySelectorAll("[data-candidate-action]").forEach((button) => {
    button.disabled = accessContext.locked || (button.dataset.candidateAction === "convert-team-member" && !accessContext.setupAllowed);
    button.addEventListener("click", () => {
      handleCandidateAction(button.dataset.candidateId, button.dataset.candidateAction).catch((error) => {
        if (elements.candidateMessage) elements.candidateMessage.textContent = `Candidate handoff failed: ${error.message}`;
      });
    });
  });
}

function updateCandidateField(candidateId, field, value) {
  const candidate = state.candidates.find((item) => item.id === candidateId);
  if (!candidate || !field) return;
  candidate[field] = field === "hiringOutcome" ? normalizeHiringOutcome(value) : String(value || "").trim();
  saveState();
}

async function handleCandidateAction(candidateId, action) {
  const candidate = state.candidates.find((item) => item.id === candidateId);
  if (!candidate) return;
  if (!guardRecruitingAccess("handoff candidates to the CRM", { adminOnly: action === "convert-team-member" })) return;

  applyCandidateControlValues(candidate);
  const now = new Date().toISOString();
  candidate.lastHandoffAt = now;
  if (action === "convert-team-member") {
    candidate.hiringOutcome = "hired";
    candidate.status = "Converted";
    candidate.pipelineStage = "hired";
  }

  if (isLiveUnlocked()) {
    const result = await postRecruitingBackend("/api/recruiting/crm-handoff", {
      action,
      candidate: candidateToRecruitRecord(candidate),
      assignedRecruiter: candidate.assignedRecruiter,
      assignedManager: candidate.assignedManager,
      hiringOutcome: candidate.hiringOutcome,
      recruiterNotes: candidate.recruiterNotes,
      taskText: `Follow up with ${candidate.name} about ${candidate.jobTitle || state.job.title}.`,
      note: candidate.recruiterNotes || `${candidate.name} reviewed in Kira Recruit.`,
      memberRole: "member",
    });
    state.candidates = mergeCandidates(state.candidates, [result.candidate || candidate]);
    recordCandidateHandoff(action, result.candidate || candidate, result.handoff || {});
    if (elements.candidateMessage) elements.candidateMessage.textContent = result.message || "Candidate handoff saved to the CRM.";
  } else {
    applyLocalCandidateHandoff(candidate, action, now);
    if (elements.candidateMessage) elements.candidateMessage.textContent = localCandidateActionMessage(candidate, action);
  }

  saveState();
  render();
}

function applyCandidateControlValues(candidate) {
  elements.candidateList.querySelectorAll(`[data-candidate-id="${candidate.id}"][data-candidate-field]`).forEach((field) => {
    candidate[field.dataset.candidateField] =
      field.dataset.candidateField === "hiringOutcome" ? normalizeHiringOutcome(field.value) : String(field.value || "").trim();
  });
}

function applyLocalCandidateHandoff(candidate, action, now) {
  if (action === "create-follow-up-task") {
    candidate.followUpTaskId = candidate.followUpTaskId || `demo-task-${Date.now()}`;
    candidate.taskCreatedAt = now;
  }
  if (action === "add-activity-note") {
    candidate.activityNoteId = candidate.activityNoteId || `demo-activity-${Date.now()}`;
    candidate.recruiterNotes = candidate.recruiterNotes || `${candidate.name} reviewed in Kira Recruit.`;
  }
  if (action === "convert-team-member") {
    candidate.convertedMemberInvitationId = candidate.convertedMemberInvitationId || `demo-invite-${Date.now()}`;
    candidate.hiringOutcome = "hired";
    candidate.status = "Converted";
    candidate.pipelineStage = "hired";
  }
  recordCandidateHandoff(action, candidate, {
    action,
    performedAt: now,
    performedBy: accessContext.demo ? "demo" : "local-preview",
  });
}

function recordCandidateHandoff(action, candidate, handoff = {}) {
  const now = handoff.performedAt || new Date().toISOString();
  const entry = {
    action,
    candidateExternalId: candidate.externalId || candidate.id,
    candidateName: candidate.name,
    candidateEmail: candidate.email,
    hiringOutcome: normalizeHiringOutcome(candidate.hiringOutcome),
    performedAt: now,
    performedBy: handoff.performedBy || currentSession?.user?.email || accessContext.role || "demo",
    ...handoff,
  };
  state.crmHandoffs = [entry, ...state.crmHandoffs].slice(0, 100);
  state.hiringOutcomes = [
    {
      candidateExternalId: candidate.externalId || candidate.id,
      candidateName: candidate.name,
      outcome: normalizeHiringOutcome(candidate.hiringOutcome),
      updatedAt: now,
    },
    ...state.hiringOutcomes,
  ].slice(0, 100);
  if (candidate.recruiterNotes) {
    state.recruiterNotes = [
      {
        candidateExternalId: candidate.externalId || candidate.id,
        candidateName: candidate.name,
        note: candidate.recruiterNotes,
        updatedAt: now,
      },
      ...state.recruiterNotes,
    ].slice(0, 100);
  }
}

function localCandidateActionMessage(candidate, action) {
  if (action === "create-follow-up-task") return `Demo follow-up task staged for ${candidate.name}.`;
  if (action === "add-activity-note") return `Demo activity note staged for ${candidate.name}.`;
  if (action === "convert-team-member") return `Demo team-member invite staged for ${candidate.name}.`;
  return `${candidate.name} handoff saved in the demo workspace.`;
}

function filteredCandidates() {
  const filter = elements.candidateFilter.value;
  const sortable = state.candidates.filter((candidate) => {
    if (filter === "qualified") return candidate.score >= 75;
    if (filter === "booked") return candidate.status === "Booked";
    if (filter === "new") return candidate.status === "New";
    return true;
  });

  if (elements.candidateSort.value === "recent") {
    return sortable.sort((left, right) => String(right.syncedAt).localeCompare(String(left.syncedAt)));
  }
  if (elements.candidateSort.value === "source") {
    return sortable.sort((left, right) => left.source.localeCompare(right.source) || right.score - left.score);
  }
  return sortable.sort((left, right) => right.score - left.score);
}

function renderInterviews() {
  const interviews = [...state.interviews].sort((left, right) => String(left.startsAt).localeCompare(String(right.startsAt)));
  elements.interviewList.innerHTML = interviews.length
    ? interviews
        .map(
          (interview) => `
            <article class="interview-row">
              <div>
                <strong>${escapeHtml(interview.candidateName)}</strong>
                <span>${escapeHtml(interview.jobTitle)} - ${escapeHtml(interview.source)}</span>
              </div>
              <time>${formatDate(interview.startsAt)}</time>
            </article>
          `,
        )
        .join("")
    : '<p class="empty-state">No interview calls booked yet.</p>';
}

function renderFeed() {
  const feed = buildFeed();
  elements.feedPreview.innerHTML = `
    <article>
      <span>Feed key</span>
      <strong>${sharedRecruitingFeedKey}</strong>
    </article>
    <article>
      <span>Current job</span>
      <strong>${escapeHtml(feed.job.title || "Untitled job")}</strong>
    </article>
    <article>
      <span>Recruit records</span>
      <strong>${feed.recruits.length}</strong>
    </article>
    <article>
      <span>Interview records</span>
      <strong>${feed.interviews.length}</strong>
    </article>
  `;
}

function createOnboardingPacket(event) {
  event.preventDefault();
  if (!guardRecruitingAccess("create onboarding packets")) return;
  if (!elements.onboardingForm.reportValidity()) return;
  const worker = readWorkerForm();
  const existingIndex = state.onboardingWorkers.findIndex((item) => item.email.toLowerCase() === worker.email.toLowerCase());
  if (existingIndex >= 0) {
    state.onboardingWorkers[existingIndex] = {
      ...state.onboardingWorkers[existingIndex],
      ...worker,
      updatedAt: new Date().toISOString(),
    };
    elements.onboardingMessage.textContent = `${worker.name} onboarding packet updated.`;
  } else {
    state.onboardingWorkers.unshift({
      id: `worker-${Date.now()}`,
      ...worker,
      packetStatus: "Created",
      createdAt: new Date().toISOString(),
      updatedAt: "",
    });
    elements.onboardingMessage.textContent = `${worker.name} onboarding packet created.`;
  }
  saveState();
  render();
}

function readWorkerForm() {
  return {
    name: elements.workerName.value.trim(),
    email: elements.workerEmail.value.trim(),
    type: elements.workerType.value,
    role: elements.workerRole.value.trim() || state.job.title,
    payRate: elements.workerPayRate.value.trim() || state.job.pay,
    startDate: elements.workerStartDate.value,
    taxStatus: elements.workerTaxStatus.value,
    depositStatus: elements.workerDepositStatus.value,
    notes: sanitizeSensitiveNotes(elements.workerNotes.value.trim()),
  };
}

function sanitizeSensitiveNotes(value) {
  return value.replace(/\b\d{3}-?\d{2}-?\d{4}\b/g, "[redacted tax id]").replace(/\b\d{9,17}\b/g, "[redacted sensitive number]");
}

async function sendLatestOnboardingPacket() {
  if (!guardRecruitingAccess("send onboarding packets")) return;
  if (!state.onboardingWorkers.length) {
    elements.onboardingMessage.textContent = "Create a worker packet before sending an onboarding link.";
    return;
  }
  const [worker] = state.onboardingWorkers;
  worker.packetStatus = "Sent";
  worker.taxStatus = worker.taxStatus === "Not sent" ? "Sent" : worker.taxStatus;
  worker.updatedAt = new Date().toISOString();
  elements.onboardingMessage.textContent = accessContext.demo
    ? `Demo onboarding link staged for ${worker.email}.`
    : `Onboarding email staged for ${worker.email}.`;
  saveState();
  if (isLiveUnlocked()) {
    try {
      await postRecruitingBackend("/api/recruiting/onboarding-email", {
        workers: [worker],
        template: "welcome",
      });
    } catch (error) {
      elements.onboardingMessage.textContent = `Onboarding packet updated locally, but email staging failed: ${error.message}`;
    }
  }
  render();
}

function selectAllWorkers() {
  selectedWorkerIds = new Set(state.onboardingWorkers.map((worker) => worker.id));
  renderOnboarding();
}

function clearWorkerSelection() {
  selectedWorkerIds.clear();
  renderOnboarding();
}

async function bulkSendOnboardingPackets() {
  if (!guardRecruitingAccess("bulk email onboarding packets")) return;
  const selected = selectedOnboardingWorkers();
  if (!selected.length) {
    elements.onboardingMessage.textContent = "Select at least one worker before emailing packets.";
    return;
  }
  const template = onboardingTemplateLabel(elements.onboardingEmailTemplate.value);
  const now = new Date().toISOString();
  const selectedIds = new Set(selected.map((worker) => worker.id));
  state.onboardingWorkers = state.onboardingWorkers.map((worker) => {
    if (!selectedIds.has(worker.id)) return worker;
    return {
      ...worker,
      packetStatus: "Email queued",
      taxStatus: worker.taxStatus === "Not sent" ? "Sent" : worker.taxStatus,
      lastEmailTemplate: template,
      lastEmailAt: now,
      updatedAt: now,
    };
  });
  elements.onboardingMessage.textContent = `${selected.length} ${selected.length === 1 ? "packet" : "packets"} queued with the ${template} email.`;
  saveState();
  if (isLiveUnlocked()) {
    try {
      await postRecruitingBackend("/api/recruiting/onboarding-email", {
        workers: selected,
        template,
      });
    } catch (error) {
      elements.onboardingMessage.textContent = `Packets updated locally, but email staging failed: ${error.message}`;
    }
  }
  render();
}

function selectedOnboardingWorkers() {
  return state.onboardingWorkers.filter((worker) => selectedWorkerIds.has(worker.id));
}

function onboardingTemplateLabel(value) {
  const labels = {
    welcome: "Welcome packet",
    tax: "Tax packet reminder",
    deposit: "Direct deposit setup",
  };
  return labels[value] || "Onboarding";
}

function renderOnboarding() {
  syncWorkerSelection();
  renderOnboardingSummary();
  elements.selectedWorkerCount.textContent = `${selectedWorkerIds.size} selected`;
  elements.workerList.innerHTML = state.onboardingWorkers.length
    ? state.onboardingWorkers.map(renderWorkerCard).join("")
    : '<p class="empty-state">No W-2/W-9 packets created yet.</p>';
  elements.workerList.querySelectorAll("[data-worker-select]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selectedWorkerIds.add(checkbox.dataset.workerSelect);
      } else {
        selectedWorkerIds.delete(checkbox.dataset.workerSelect);
      }
      renderOnboarding();
    });
  });
}

function syncWorkerSelection() {
  const ids = new Set(state.onboardingWorkers.map((worker) => worker.id));
  selectedWorkerIds = new Set([...selectedWorkerIds].filter((id) => ids.has(id)));
}

function renderOnboardingSummary() {
  const sent = state.onboardingWorkers.filter((worker) => ["Sent", "Email queued"].includes(worker.packetStatus) || worker.taxStatus === "Sent").length;
  const completed = state.onboardingWorkers.filter((worker) => worker.taxStatus === "Completed").length;
  const depositReady = state.onboardingWorkers.filter((worker) => worker.depositStatus === "Verified by provider").length;
  elements.onboardingSummary.innerHTML = `
    <article>
      <span>Workers</span>
      <strong>${state.onboardingWorkers.length}</strong>
    </article>
    <article>
      <span>Packets sent</span>
      <strong>${sent}</strong>
    </article>
    <article>
      <span>Completed</span>
      <strong>${completed}</strong>
    </article>
    <article>
      <span>Deposit ready</span>
      <strong>${depositReady}</strong>
    </article>
  `;
}

function renderWorkerCard(worker) {
  const formLabel = worker.type === "w2" ? "W-2 employee" : "W-9 contractor";
  const selected = selectedWorkerIds.has(worker.id);
  return `
    <article class="worker-card ${selected ? "selected" : ""}">
      <label class="select-card-control">
        <input type="checkbox" data-worker-select="${escapeHtml(worker.id)}" ${selected ? "checked" : ""} />
        <span>Select</span>
      </label>
      <div>
        <strong>${escapeHtml(worker.name)}</strong>
        <span>${escapeHtml(formLabel)} • ${escapeHtml(worker.role)}</span>
        <small>${escapeHtml(worker.email)} • starts ${escapeHtml(worker.startDate || "TBD")}</small>
      </div>
      <div class="worker-status-grid">
        <span>Packet: ${escapeHtml(worker.packetStatus || "Created")}</span>
        <span>Tax packet: ${escapeHtml(worker.taxStatus)}</span>
        <span>Direct deposit: ${escapeHtml(worker.depositStatus)}</span>
        <span>Pay: ${escapeHtml(worker.payRate)}</span>
        ${worker.lastEmailTemplate ? `<span>Email: ${escapeHtml(worker.lastEmailTemplate)}</span>` : ""}
      </div>
      <p>${escapeHtml(worker.notes || "No notes yet.")}</p>
    </article>
  `;
}

async function savePayrollProvider(event) {
  event.preventDefault();
  if (!guardRecruitingAccess("save payroll providers", { adminOnly: true })) return;
  const tokenValue = accessContext.demo || accessContext.locked ? "" : elements.payrollApiToken.value.trim();
  state.payrollProvider = {
    provider: elements.payrollProvider.value,
    companyId: elements.payrollCompanyId.value.trim(),
    tokenConfigured: Boolean(tokenValue) || state.payrollProvider.tokenConfigured,
    tokenLast4: tokenValue ? tokenValue.slice(-4) : state.payrollProvider.tokenLast4,
    savedAt: new Date().toISOString(),
  };
  state.connectorSettings = {
    ...state.connectorSettings,
    [`payroll:${state.payrollProvider.provider}`]: {
      provider: state.payrollProvider.provider,
      companyId: state.payrollProvider.companyId,
      tokenConfigured: state.payrollProvider.tokenConfigured,
      tokenLast4: state.payrollProvider.tokenLast4,
      savedAt: state.payrollProvider.savedAt,
      secrets: "server-side only",
    },
  };
  elements.payrollApiToken.value = "";
  elements.payrollMessage.textContent = accessContext.demo
    ? `${payrollProviderLabel(state.payrollProvider.provider)} payroll metadata saved. Secrets are disabled in demo mode.`
    : `${payrollProviderLabel(state.payrollProvider.provider)} payroll metadata saved. Live secrets must be stored server-side.`;
  saveState();
  if (isLiveUnlocked()) {
    try {
      await postRecruitingBackend("/api/recruiting/integration-status", {
        provider: `payroll:${state.payrollProvider.provider}`,
        publicConfig: state.payrollProvider,
      });
      elements.payrollMessage.textContent = `${payrollProviderLabel(state.payrollProvider.provider)} payroll status saved to the live workspace.`;
    } catch (error) {
      elements.payrollMessage.textContent = `Payroll provider saved locally, but live status failed: ${error.message}`;
    }
  }
  render();
}

function stagePayrollRun(event) {
  event.preventDefault();
  if (!guardRecruitingAccess("stage payroll runs")) return;
  if (!elements.payrollRunForm.reportValidity()) return;
  const worker = state.onboardingWorkers.find((item) => item.id === elements.payrollWorker.value);
  if (!worker) {
    elements.payrollMessage.textContent = "Create at least one W-2/W-9 worker before staging payroll.";
    return;
  }
  const total = payrollTotalValue();
  state.payrollRuns.unshift({
    id: `payroll-${Date.now()}`,
    workerId: worker.id,
    workerName: worker.name,
    workerType: worker.type,
    period: elements.payrollPeriod.value.trim(),
    hours: Number(elements.payrollHours.value || 0),
    rate: Number(elements.payrollRate.value || 0),
    bonus: Number(elements.payrollBonus.value || 0),
    reimbursement: Number(elements.payrollReimbursement.value || 0),
    total,
    status: "Staged",
    provider: state.payrollProvider.provider,
    createdAt: new Date().toISOString(),
    paidAt: "",
  });
  elements.payrollMessage.textContent = `Payroll run staged for ${worker.name}. Live payment requires ${payrollProviderLabel(state.payrollProvider.provider)} API wiring.`;
  saveState();
  render();
}

function markLatestPayrollPaid() {
  if (!guardRecruitingAccess("mark payroll paid")) return;
  const run = state.payrollRuns.find((item) => item.status !== "Paid");
  if (!run) {
    elements.payrollMessage.textContent = "No staged payroll run is waiting for payment.";
    return;
  }
  run.status = "Paid";
  run.paidAt = new Date().toISOString();
  elements.payrollMessage.textContent = `${run.workerName} marked paid in demo mode.`;
  saveState();
  render();
}

function selectAllPayrollRuns() {
  selectedPayrollRunIds = new Set(state.payrollRuns.map((run) => run.id));
  renderPayroll();
}

function clearPayrollSelection() {
  selectedPayrollRunIds.clear();
  renderPayroll();
}

function emailSelectedPayrollRuns() {
  if (!guardRecruitingAccess("email payroll summaries")) return;
  const selected = selectedPayrollRuns();
  if (!selected.length) {
    elements.payrollMessage.textContent = "Select at least one payroll run before emailing summaries.";
    return;
  }
  const template = payrollTemplateLabel(elements.payrollEmailTemplate.value);
  const now = new Date().toISOString();
  const selectedIds = new Set(selected.map((run) => run.id));
  state.payrollRuns = state.payrollRuns.map((run) =>
    selectedIds.has(run.id)
      ? {
          ...run,
          emailStatus: "Email queued",
          lastEmailTemplate: template,
          lastEmailAt: now,
        }
      : run,
  );
  elements.payrollMessage.textContent = `${selected.length} ${selected.length === 1 ? "summary" : "summaries"} queued with the ${template} email.`;
  saveState();
  render();
}

function markSelectedPayrollRunsPaid() {
  if (!guardRecruitingAccess("mark payroll runs paid")) return;
  const selected = selectedPayrollRuns().filter((run) => run.status !== "Paid");
  if (!selected.length) {
    elements.payrollMessage.textContent = "Select at least one unpaid payroll run.";
    return;
  }
  const selectedIds = new Set(selected.map((run) => run.id));
  const now = new Date().toISOString();
  state.payrollRuns = state.payrollRuns.map((run) =>
    selectedIds.has(run.id)
      ? {
          ...run,
          status: "Paid",
          paidAt: now,
        }
      : run,
  );
  elements.payrollMessage.textContent = `${selected.length} ${selected.length === 1 ? "payroll run" : "payroll runs"} marked paid in demo mode.`;
  saveState();
  render();
}

function selectedPayrollRuns() {
  return state.payrollRuns.filter((run) => selectedPayrollRunIds.has(run.id));
}

function payrollTemplateLabel(value) {
  const labels = {
    summary: "Payment summary",
    paid: "Payment sent",
    missing: "Missing payroll info",
  };
  return labels[value] || "Payroll";
}

function renderPayroll() {
  syncPayrollSelection();
  hydratePayrollWorkerOptions();
  renderPayrollTotal();
  renderPayrollSummary();
  elements.selectedPayrollCount.textContent = `${selectedPayrollRunIds.size} selected`;
  elements.payrollList.innerHTML = state.payrollRuns.length
    ? state.payrollRuns.map(renderPayrollRun).join("")
    : '<p class="empty-state">No payroll runs staged yet.</p>';
  elements.payrollList.querySelectorAll("[data-payroll-select]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selectedPayrollRunIds.add(checkbox.dataset.payrollSelect);
      } else {
        selectedPayrollRunIds.delete(checkbox.dataset.payrollSelect);
      }
      renderPayroll();
    });
  });
}

function syncPayrollSelection() {
  const ids = new Set(state.payrollRuns.map((run) => run.id));
  selectedPayrollRunIds = new Set([...selectedPayrollRunIds].filter((id) => ids.has(id)));
}

function renderPayrollSummary() {
  const total = state.payrollRuns.reduce((sum, run) => sum + Number(run.total || 0), 0);
  const staged = state.payrollRuns.filter((run) => run.status !== "Paid").length;
  const paid = state.payrollRuns.filter((run) => run.status === "Paid").length;
  const queuedEmails = state.payrollRuns.filter((run) => run.emailStatus === "Email queued").length;
  elements.payrollSummary.innerHTML = `
    <article>
      <span>Total staged</span>
      <strong>${formatMoney(total)}</strong>
    </article>
    <article>
      <span>Open runs</span>
      <strong>${staged}</strong>
    </article>
    <article>
      <span>Paid</span>
      <strong>${paid}</strong>
    </article>
    <article>
      <span>Emails queued</span>
      <strong>${queuedEmails}</strong>
    </article>
  `;
}

function hydratePayrollWorkerOptions() {
  elements.payrollWorker.innerHTML = state.onboardingWorkers.length
    ? state.onboardingWorkers
        .map((worker) => `<option value="${escapeHtml(worker.id)}">${escapeHtml(worker.name)} (${worker.type.toUpperCase()})</option>`)
        .join("")
    : '<option value="">Create a worker packet first</option>';
}

function renderPayrollTotal() {
  elements.payrollTotal.textContent = formatMoney(payrollTotalValue());
}

function payrollTotalValue() {
  const hours = Number(elements.payrollHours.value || 0);
  const rate = Number(elements.payrollRate.value || 0);
  const bonus = Number(elements.payrollBonus.value || 0);
  const reimbursement = Number(elements.payrollReimbursement.value || 0);
  return Math.max(0, hours * rate + bonus + reimbursement);
}

function renderPayrollRun(run) {
  const selected = selectedPayrollRunIds.has(run.id);
  return `
    <article class="payroll-run ${run.status.toLowerCase()} ${selected ? "selected" : ""}">
      <label class="select-card-control">
        <input type="checkbox" data-payroll-select="${escapeHtml(run.id)}" ${selected ? "checked" : ""} />
        <span>Select</span>
      </label>
      <div>
        <strong>${escapeHtml(run.workerName)}</strong>
        <span>${escapeHtml(run.period)} • ${escapeHtml(payrollProviderLabel(run.provider))}</span>
        <small>${run.workerType === "w2" ? "W-2 payroll" : "W-9 contractor payout"} • ${escapeHtml(run.status)}${run.emailStatus ? ` • ${escapeHtml(run.emailStatus)}` : ""}</small>
        ${run.lastEmailTemplate ? `<small>Email: ${escapeHtml(run.lastEmailTemplate)}</small>` : ""}
      </div>
      <div class="payroll-run-total">${formatMoney(run.total)}</div>
    </article>
  `;
}

function normalizeHiringOutcome(value) {
  const outcome = String(value || "").trim().toLowerCase();
  return hiringOutcomeOptions.some(([option]) => option === outcome) ? outcome : "screening";
}

function outcomeLabel(value) {
  return hiringOutcomeOptions.find(([option]) => option === normalizeHiringOutcome(value))?.[1] || "Screening";
}

function providerLabel(provider) {
  return integrationProviders[provider]?.label || "Job board";
}

function payrollProviderLabel(provider) {
  const labels = {
    gusto: "Gusto",
    adp: "ADP",
    quickbooks: "QuickBooks Payroll",
    "stripe-connect": "Stripe Connect",
    manual: "Manual export",
  };
  return labels[provider] || "Payroll provider";
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function formatDate(value) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatShortDate(value) {
  if (!value) return "none";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
