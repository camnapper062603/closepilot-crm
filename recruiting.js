const storageKey = "kiraRecruitingState-v1";
const crmFeedKey = "kiraRecruitingFeed-v1";
const sharedRecruitingFeedKey = "kiraRecruitingSharedFeed-v1";
const recruitSubpages = [
  { id: "dashboard", label: "Dashboard" },
  { id: "job", label: "Job details" },
  { id: "boards", label: "Job board connectors" },
  { id: "applicants", label: "Single candidate location" },
  { id: "interviews", label: "Monday, Wednesday, Friday calls" },
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
elements.jobForm.addEventListener("input", () => {
  state.job = readJobForm();
  saveState();
  renderFeed();
});

hydrateJobForm();
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
    recruits: state.candidates.map(candidateToRecruitRecord),
    interviews: state.interviews,
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
  elements.jobMessage.textContent = "Demo reset.";
  elements.feedMessage.textContent = "";
  render();
}

function render() {
  renderMetrics();
  renderBoards();
  renderCandidates();
  renderInterviews();
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

function renderCandidates() {
  const candidates = filteredCandidates();
  elements.candidateList.innerHTML = candidates.length
    ? candidates
        .map(
          (candidate) => `
            <article class="candidate-card">
              <div class="candidate-head">
                <div>
                  <strong>${escapeHtml(candidate.name)}</strong>
                  <span>${escapeHtml(candidate.source)} - ${escapeHtml(candidate.email)}</span>
                </div>
                <b>${candidate.score}</b>
              </div>
              <p>${escapeHtml(candidate.experience)}</p>
              <div class="tag-row">
                ${candidate.skills.map((skill) => `<span>${escapeHtml(skill)}</span>`).join("")}
              </div>
              <div class="candidate-foot">
                <span>${escapeHtml(candidate.phone)}</span>
                <strong>${escapeHtml(candidate.status)}</strong>
              </div>
            </article>
          `,
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
