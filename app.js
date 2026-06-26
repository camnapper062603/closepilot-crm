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
let contactFilter = "all";

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
const insightList = document.querySelector("#insightList");
const leadBrief = document.querySelector("#leadBrief");
const contactTable = document.querySelector("#contactTable");
const taskList = document.querySelector("#taskList");
const automationList = document.querySelector("#automationList");
const activityFeed = document.querySelector("#activityFeed");
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
const leadDetailModal = document.querySelector("#leadDetailModal");
const leadDetailContent = document.querySelector("#leadDetailContent");
const closeLeadDetailModalButton = document.querySelector("#closeLeadDetailModal");

const config = window.ClosePilotConfig || {};
const hasSupabaseConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey);

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

searchInput.addEventListener("input", render);

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

document.querySelectorAll("[data-contact-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    contactFilter = button.dataset.contactFilter;
    renderPipeline();
    renderContacts();
  });
});

async function boot() {
  if (!hasSupabaseConfig) {
    store = createLocalStore();
    state = await store.load();
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
    setCloudMode(false, "Demo mode - cloud unavailable");
    render();
  }
}

async function startCloudWorkspace() {
  hideAuth();
  setCloudMode(true);
  store = createSupabaseStore(supabaseClient, currentUser);
  await store.ensureWorkspace();
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
    state.selectedLeadId = created.id;
  }

  leadForm.reset();
  closeLeadModal();
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
  document.querySelector("#leadSource").value = lead?.source || "Manual";
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
  render();
}

function filteredLeads() {
  const query = searchInput.value.trim().toLowerCase();
  return state.leads.filter((lead) => {
    const matchesStage = contactFilter === "all" || lead.stage === contactFilter;
    const matchesSearch =
      !query ||
      [lead.name, lead.company, lead.notes, lead.source].some((field) =>
        field.toLowerCase().includes(query),
      );
    return matchesStage && matchesSearch;
  });
}

function render() {
  renderWorkspaceIdentity();
  renderMetrics();
  renderOnboarding();
  renderInsights();
  renderPipeline();
  renderLeadBrief();
  renderAutomations();
  renderActivityFeed();
  renderContacts();
  renderTasks();
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

function renderPipeline() {
  const leads = filteredLeads();
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
      const cards = stageLeads.map(renderDealCard).join("");
      return `
        <div class="stage-column" data-stage="${stage.id}">
          <div class="stage-heading">
            <strong>${stage.label}</strong>
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
      render();
    });
  });

  board.querySelectorAll("[data-move]").forEach((button) => {
    button.addEventListener("click", () => {
      moveLead(button.dataset.leadId, Number(button.dataset.move));
    });
  });
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
          <span class="score-pill">${lead.score}</span>
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

  const index = stages.findIndex((stage) => stage.id === lead.stage);
  const nextStage = stages[Math.min(stages.length - 1, Math.max(0, index + direction))];
  if (lead.stage === nextStage.id) return;

  const updatedLead = {
    ...lead,
    stage: nextStage.id,
    score: Math.min(99, Math.max(0, lead.score + (direction > 0 ? 4 : -2))),
  };

  state.selectedLeadId = lead.id;
  await store.updateLead(updatedLead);
  await store.createActivity({
    leadId,
    type: "stage",
    message: `Stage changed to ${nextStage.label}.`,
  });
  await addAutomatedTask(`Follow up with ${lead.name} after moving to ${nextStage.label}`);
  await reloadState();
}

function renderLeadBrief() {
  const lead = state.leads.find((item) => item.id === state.selectedLeadId) || state.leads[0];
  if (!lead) {
    leadBrief.innerHTML = "<p>No lead selected.</p>";
    return;
  }

  leadBrief.innerHTML = `
    <div>
      <h3>${escapeHtml(lead.company)}</h3>
      <p>${escapeHtml(lead.name)} · ${stageLabel(lead.stage)}</p>
    </div>
    <div class="brief-grid">
      <div><span>Value</span><strong>${formatter.format(lead.value)}</strong></div>
      <div><span>Lead score</span><strong>${lead.score}/100</strong></div>
      <div><span>Source</span><strong>${escapeHtml(lead.source)}</strong></div>
      <div><span>Status</span><strong>${lead.score >= 80 ? "Hot" : "Nurture"}</strong></div>
    </div>
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
        <span>Lead score</span>
        <strong>${lead.score}/100</strong>
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
      </article>
    `,
    )
    .join("");
}

function renderActivityFeed() {
  const activities = (state.activities || [])
    .slice()
    .sort((left, right) => activityTime(right) - activityTime(left))
    .slice(0, 8);

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
      render();
    });
  });
}

function renderContacts() {
  const leads = filteredLeads();
  document.querySelectorAll("[data-contact-filter]").forEach((button) => {
    button.classList.toggle("active", button.dataset.contactFilter === contactFilter);
  });

  contactTable.innerHTML = leads.length
    ? leads
      .map(
        (lead) => `
      <article class="contact-row" data-contact-row="${lead.id}">
        <p><strong>${escapeHtml(lead.name)}</strong><span>${escapeHtml(lead.company)}</span></p>
        <p>${escapeHtml(lead.source)}</p>
        <p>${stageLabel(lead.stage)}</p>
        <p>${formatter.format(lead.value)}</p>
        <div class="contact-actions">
          <button class="secondary-button" data-contact-select="${lead.id}" type="button">View</button>
          <button class="secondary-button" data-contact-next="${lead.id}" type="button">Next stage</button>
          <button class="primary-button" data-contact-detail="${lead.id}" type="button">Details</button>
        </div>
      </article>
    `,
      )
      .join("")
    : "<p class=\"empty-state\">No contacts in this view.</p>";

  contactTable.querySelectorAll("[data-contact-select]").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedLeadId = button.dataset.contactSelect;
      render();
    });
  });

  contactTable.querySelectorAll("[data-contact-detail]").forEach((button) => {
    button.addEventListener("click", () => {
      openLeadDetailModal(button.dataset.contactDetail);
    });
  });

  contactTable.querySelectorAll("[data-contact-next]").forEach((button) => {
    button.addEventListener("click", async () => {
      await moveLead(button.dataset.contactNext, 1);
    });
  });
}

function renderTasks() {
  renderTaskFilterCounts();
  const tasks = filteredTasks();
  taskList.innerHTML = tasks.length
    ? tasks
    .map(
      (task) => `
      <article class="task-item ${task.done ? "done" : ""}" data-task-row="${task.id}">
        <input data-task-done="${task.id}" type="checkbox" ${task.done ? "checked" : ""} aria-label="Mark task complete" />
        <p>${escapeHtml(task.text)}<span>${task.due}</span></p>
        <div class="task-actions">
          <button data-edit-task="${task.id}" type="button">Edit</button>
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

  taskList.querySelectorAll("[data-edit-task]").forEach((button) => {
    button.addEventListener("click", () => {
      renderTaskEditForm(button.dataset.editTask);
    });
  });
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
  if (taskFilter === "all") return state.tasks;
  if (taskFilter === "done") return state.tasks.filter((task) => task.done);
  if (taskFilter === "upcoming") return state.tasks.filter((task) => !task.done && task.due !== "today");
  return state.tasks.filter((task) => !task.done && task.due === "today");
}

function renderTaskFilterCounts() {
  const openTasks = state.tasks.filter((task) => !task.done);
  document.querySelector("#taskCountToday").textContent = openTasks.filter(
    (task) => task.due === "today",
  ).length;
  document.querySelector("#taskCountUpcoming").textContent = openTasks.filter(
    (task) => task.due !== "today",
  ).length;
  document.querySelector("#taskCountDone").textContent = state.tasks.filter((task) => task.done).length;
  document.querySelector("#taskCountAll").textContent = state.tasks.length;
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

function workspaceSetupSettings() {
  const fallback = {
    name: state.workspaceName || "Personal workspace",
    type: "Personal",
    goal: "Close more follow-ups",
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
  const settings = {
    name: setupBusinessName.value.trim() || "Personal workspace",
    type: setupWorkspaceType.value,
    goal: setupSalesGoal.value,
  };
  localStorage.setItem(workspaceSetupKey(), JSON.stringify(settings));
  await store.updateWorkspaceSettings(settings);
}

async function addAutomatedTask(text) {
  const automation = state.automations.find((item) => item.key === "next-step-tasks");
  if (!automation?.enabled) return;
  await store.createTask({ text, done: false, due: "today" });
}

async function createFollowUpFromLead(leadId) {
  const lead = state.leads.find((item) => item.id === leadId);
  if (!lead) return;

  await store.createTask({
    text: `${lead.nextAction} (${lead.company})`,
    done: false,
    due: "today",
  });
  await store.createActivity({
    leadId,
    type: "task",
    message: "Follow-up task added.",
  });
  await reloadState();
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
    leadId,
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
  state.selectedLeadId = lead.id;
  await reloadState();
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
  const headers = ["name", "company", "stage", "value", "score", "source", "nextAction", "notes"];
  const rows = state.leads.map((lead) => headers.map((header) => csvEscape(lead[header])).join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "closepilot-leads.csv";
  link.click();
  URL.revokeObjectURL(url);
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
  state.selectedLeadId = created[0]?.id || state.selectedLeadId;
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
    async updateWorkspaceSettings(settings) {
      state.workspaceName = settings.name;
      this.save(state);
      return settings;
    },
    async clearWorkspaceData() {
      state.leads = [];
      state.tasks = [];
      state.activities = [];
      state.selectedLeadId = null;
      this.save(state);
    },
    async seedStarterData() {
      state.leads = structuredClone(seedState.leads);
      state.tasks = structuredClone(seedState.tasks);
      state.activities = structuredClone(seedState.activities);
      state.selectedLeadId = seedState.selectedLeadId;
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
      ] = await Promise.all([
        client.from("leads").select("*").eq("workspace_id", workspaceId).order("created_at"),
        client.from("tasks").select("*").eq("workspace_id", workspaceId).order("created_at", {
          ascending: false,
        }),
        this.loadAutomations(),
        this.loadActivities(),
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
      };
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
    async updateWorkspaceSettings(settings) {
      workspaceName = settings.name;
      const { error } = await client
        .from("workspaces")
        .update({ name: settings.name })
        .eq("id", workspaceId);
      throwIf(error);
      return settings;
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

function isMissingActivitiesTable(error) {
  return error?.code === "42P01" || error?.message?.includes("activities");
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
