const storageKey = "kiraRecruitingState-v1";
const crmFeedKey = "kiraRecruitingFeed-v1";
const sharedRecruitingFeedKey = "kiraRecruitingSharedFeed-v1";
const recruitSubpages = [
  { id: "dashboard", label: "Dashboard" },
  { id: "job", label: "Job details" },
  { id: "boards", label: "Job board connectors" },
  { id: "integrations", label: "Integrations" },
  { id: "applicants", label: "Single candidate location" },
  { id: "interviews", label: "Monday, Wednesday, Friday calls" },
  { id: "onboarding", label: "W-2/W-9" },
  { id: "payroll", label: "Payroll" },
  { id: "crm", label: "Recruiting feed" },
];
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

const elements = {
  subpageNav: document.querySelector("#recruitSubpageNav"),
  livePostings: document.querySelector("#livePostings"),
  applicantCount: document.querySelector("#applicantCount"),
  qualifiedCount: document.querySelector("#qualifiedCount"),
  bookedCount: document.querySelector("#bookedCount"),
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
  payrollList: document.querySelector("#payrollList"),
  payrollMessage: document.querySelector("#payrollMessage"),
  markPayrollPaid: document.querySelector("#markPayrollPaid"),
};

elements.subpageNav.addEventListener("click", (event) => {
  const button = event.target.closest("[data-recruit-subpage]");
  if (!button) return;
  setRecruitSubpage(button.dataset.recruitSubpage);
});
elements.publishJob.addEventListener("click", publishJob);
elements.refreshBoards.addEventListener("click", refreshBoards);
elements.syncApplicants.addEventListener("click", syncApplicants);
elements.bookInterviews.addEventListener("click", bookInterviews);
elements.syncToCrm.addEventListener("click", syncCrmFeed);
elements.resetRecruiting.addEventListener("click", resetRecruiting);
elements.downloadFeed.addEventListener("click", downloadFeed);
elements.candidateFilter.addEventListener("change", render);
elements.candidateSort.addEventListener("change", render);
elements.integrationProvider.addEventListener("change", hydrateIntegrationForm);
elements.integrationForm.addEventListener("submit", saveIntegration);
elements.testIntegration.addEventListener("click", testIntegrationConnection);
elements.onboardingForm.addEventListener("submit", createOnboardingPacket);
elements.sendOnboardingPacket.addEventListener("click", sendLatestOnboardingPacket);
elements.payrollProviderForm.addEventListener("submit", savePayrollProvider);
elements.payrollRunForm.addEventListener("submit", stagePayrollRun);
elements.markPayrollPaid.addEventListener("click", markLatestPayrollPaid);
[elements.payrollHours, elements.payrollRate, elements.payrollBonus, elements.payrollReimbursement].forEach((input) => {
  input.addEventListener("input", renderPayrollTotal);
});
elements.jobForm.addEventListener("input", () => {
  state.job = readJobForm();
  saveState();
  renderFeed();
});

hydrateJobForm();
hydrateIntegrationForm();
hydratePayrollProviderForm();
hydrateDefaultDates();
routeFromHash();
render();

window.addEventListener("hashchange", () => {
  routeFromHash();
  renderSubpages();
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
    onboardingWorkers: [],
    payrollProvider: {
      provider: "gusto",
      companyId: "",
      tokenConfigured: false,
      tokenLast4: "",
      savedAt: "",
    },
    payrollRuns: [],
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
      onboardingWorkers: Array.isArray(stored.onboardingWorkers) ? stored.onboardingWorkers : [],
      payrollProvider: { ...defaultState().payrollProvider, ...(stored.payrollProvider || {}) },
      payrollRuns: Array.isArray(stored.payrollRuns) ? stored.payrollRuns : [],
    };
  } catch {
    return defaultState();
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state));
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

function saveIntegration(event) {
  event.preventDefault();
  const provider = elements.integrationProvider.value;
  const existing = state.integrations[provider] || emptyIntegration(provider);
  const tokenValue = elements.integrationApiToken.value.trim();
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
  elements.integrationApiToken.value = "";
  elements.integrationMessage.textContent = `${providerLabel(provider)} connector saved. Token is masked for demo storage.`;
  saveState();
  render();
}

function testIntegrationConnection() {
  const provider = elements.integrationProvider.value;
  const integration = state.integrations[provider] || emptyIntegration(provider);
  if (!integration.accountId || !integration.email || !integration.tokenConfigured) {
    elements.integrationMessage.textContent = `Add ${providerLabel(provider)} account ID, employer email, and API token before testing.`;
    return;
  }
  state.integrations[provider] = {
    ...integration,
    status: "Demo connected",
    lastTestedAt: new Date().toISOString(),
  };
  elements.integrationMessage.textContent = `${providerLabel(provider)} connection test passed in demo mode. Live API calls can be wired server-side.`;
  saveState();
  render();
}

function refreshBoards() {
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
  const existingEmails = new Set(state.candidates.map((candidate) => candidate.email));
  const nextCandidates = candidatePool
    .filter((candidate) => !existingEmails.has(candidate.email))
    .slice(0, state.candidates.length ? 2 : 4)
    .map((candidate, index) => ({
      ...candidate,
      id: `candidate-${Date.now()}-${index}`,
      jobTitle: state.job.title,
      status: candidate.score >= 75 ? "Qualified" : "New",
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

function syncCrmFeed() {
  const feed = buildFeed();
  localStorage.setItem(crmFeedKey, JSON.stringify(feed));
  localStorage.setItem(sharedRecruitingFeedKey, JSON.stringify(feed));
  state.feedSyncedAt = feed.syncedAt;
  elements.feedMessage.textContent = "CRM feed synced locally.";
  saveState();
  render();
}

function buildFeed() {
  return {
    app: "Kira Recruit",
    version: 1,
    syncedAt: new Date().toISOString(),
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
    recruits: state.candidates.map(candidateToRecruitRecord),
    interviews: state.interviews,
    onboardingWorkers: state.onboardingWorkers,
    payrollRuns: state.payrollRuns,
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
    experience: candidate.experience,
    skills: candidate.skills,
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
  renderMetrics();
  renderBoards();
  renderIntegrations();
  renderCandidates();
  renderInterviews();
  renderOnboarding();
  renderPayroll();
  renderFeed();
  renderSubpages();
}

function routeFromHash() {
  const requested = window.location.hash.replace("#", "");
  if (recruitSubpages.some((page) => page.id === requested)) activeSubpage = requested;
}

function setRecruitSubpage(subpage) {
  if (!recruitSubpages.some((page) => page.id === subpage)) return;
  activeSubpage = subpage;
  if (window.location.hash !== `#${subpage}`) history.replaceState(null, "", `#${subpage}`);
  renderSubpages();
}

function renderSubpages() {
  elements.subpageNav.innerHTML = recruitSubpages
    .map(
      (page) => `
        <button class="${page.id === activeSubpage ? "active" : ""}" data-recruit-subpage="${page.id}" type="button">
          ${escapeHtml(page.label)}
        </button>
      `,
    )
    .join("");

  document.querySelectorAll("section[data-recruit-subpage]").forEach((section) => {
    section.hidden = section.dataset.recruitSubpage !== activeSubpage;
  });
}

function renderMetrics() {
  elements.livePostings.textContent = state.postings.filter((posting) => posting.status === "Live").length;
  elements.applicantCount.textContent = state.candidates.length;
  elements.qualifiedCount.textContent = state.candidates.filter((candidate) => candidate.score >= 75).length;
  elements.bookedCount.textContent = state.interviews.length;
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
                <strong>${escapeHtml(candidate.status)}</strong>
              </div>
            </article>
          `;
          },
        )
        .join("")
    : '<p class="empty-state">No applicants synced yet.</p>';
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

function sendLatestOnboardingPacket() {
  if (!state.onboardingWorkers.length) {
    elements.onboardingMessage.textContent = "Create a worker packet before sending an onboarding link.";
    return;
  }
  const [worker] = state.onboardingWorkers;
  worker.packetStatus = "Sent";
  worker.taxStatus = worker.taxStatus === "Not sent" ? "Sent" : worker.taxStatus;
  worker.updatedAt = new Date().toISOString();
  elements.onboardingMessage.textContent = `Demo onboarding link staged for ${worker.email}. Live delivery should use a secure payroll/onboarding provider.`;
  saveState();
  render();
}

function renderOnboarding() {
  elements.workerList.innerHTML = state.onboardingWorkers.length
    ? state.onboardingWorkers.map(renderWorkerCard).join("")
    : '<p class="empty-state">No W-2/W-9 packets created yet.</p>';
}

function renderWorkerCard(worker) {
  const formLabel = worker.type === "w2" ? "W-2 employee" : "W-9 contractor";
  return `
    <article class="worker-card">
      <div>
        <strong>${escapeHtml(worker.name)}</strong>
        <span>${escapeHtml(formLabel)} • ${escapeHtml(worker.role)}</span>
        <small>${escapeHtml(worker.email)} • starts ${escapeHtml(worker.startDate || "TBD")}</small>
      </div>
      <div class="worker-status-grid">
        <span>Tax packet: ${escapeHtml(worker.taxStatus)}</span>
        <span>Direct deposit: ${escapeHtml(worker.depositStatus)}</span>
        <span>Pay: ${escapeHtml(worker.payRate)}</span>
      </div>
      <p>${escapeHtml(worker.notes || "No notes yet.")}</p>
    </article>
  `;
}

function savePayrollProvider(event) {
  event.preventDefault();
  const tokenValue = elements.payrollApiToken.value.trim();
  state.payrollProvider = {
    provider: elements.payrollProvider.value,
    companyId: elements.payrollCompanyId.value.trim(),
    tokenConfigured: Boolean(tokenValue) || state.payrollProvider.tokenConfigured,
    tokenLast4: tokenValue ? tokenValue.slice(-4) : state.payrollProvider.tokenLast4,
    savedAt: new Date().toISOString(),
  };
  elements.payrollApiToken.value = "";
  elements.payrollMessage.textContent = `${payrollProviderLabel(state.payrollProvider.provider)} payroll provider saved. Token is masked for demo storage.`;
  saveState();
  render();
}

function stagePayrollRun(event) {
  event.preventDefault();
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

function renderPayroll() {
  hydratePayrollWorkerOptions();
  renderPayrollTotal();
  elements.payrollList.innerHTML = state.payrollRuns.length
    ? state.payrollRuns.map(renderPayrollRun).join("")
    : '<p class="empty-state">No payroll runs staged yet.</p>';
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
  return `
    <article class="payroll-run ${run.status.toLowerCase()}">
      <div>
        <strong>${escapeHtml(run.workerName)}</strong>
        <span>${escapeHtml(run.period)} • ${escapeHtml(payrollProviderLabel(run.provider))}</span>
        <small>${run.workerType === "w2" ? "W-2 payroll" : "W-9 contractor payout"} • ${escapeHtml(run.status)}</small>
      </div>
      <div class="payroll-run-total">${formatMoney(run.total)}</div>
    </article>
  `;
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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
