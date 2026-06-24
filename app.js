const stages = [
  { id: "new", label: "New" },
  { id: "qualified", label: "Qualified" },
  { id: "proposal", label: "Proposal" },
  { id: "won", label: "Won" },
];

const seedState = {
  selectedLeadId: "lead-1",
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
  automations: [
    {
      id: "auto-1",
      title: "Create next-step tasks",
      detail: "Every lead gets a follow-up task when it changes stage.",
      enabled: true,
      savedHours: 4,
    },
    {
      id: "auto-2",
      title: "Score hot opportunities",
      detail: "Scores rise with deal value, urgency, and buyer engagement.",
      enabled: true,
      savedHours: 3,
    },
    {
      id: "auto-3",
      title: "Win-back reminders",
      detail: "Dormant leads surface after seven quiet days.",
      enabled: false,
      savedHours: 2,
    },
  ],
};

let state = loadState();

const formatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const board = document.querySelector("#pipelineBoard");
const leadBrief = document.querySelector("#leadBrief");
const contactTable = document.querySelector("#contactTable");
const taskList = document.querySelector("#taskList");
const automationList = document.querySelector("#automationList");
const searchInput = document.querySelector("#searchInput");
const leadModal = document.querySelector("#leadModal");
const leadForm = document.querySelector("#leadForm");
const taskForm = document.querySelector("#taskForm");

document.querySelector("#openLeadModal").addEventListener("click", () => {
  leadModal.hidden = false;
  document.querySelector("#leadName").focus();
});

document.querySelector("#closeLeadModal").addEventListener("click", () => {
  closeLeadModal();
});

leadForm.addEventListener("submit", (event) => {
  event.preventDefault();
  createLeadFromForm();
});

document.querySelector("#createLeadButton").addEventListener("click", () => {
  createLeadFromForm();
});

function createLeadFromForm() {
  const name = document.querySelector("#leadName").value.trim();
  const company = document.querySelector("#leadCompany").value.trim();
  if (!name || !company) return;

  const lead = {
    id: crypto.randomUUID(),
    name,
    company,
    value: Number(document.querySelector("#leadValue").value),
    stage: document.querySelector("#leadStage").value,
    notes: document.querySelector("#leadNotes").value.trim() || "New lead created from the CRM workspace.",
    nextAction: "Review lead details and choose the best follow-up.",
    source: "Manual",
    score: 65,
  };

  state.leads.unshift(lead);
  state.selectedLeadId = lead.id;
  addAutomatedTask(`Follow up with ${lead.name} at ${lead.company}`);
  leadForm.reset();
  closeLeadModal();
  persistAndRender();
}

function closeLeadModal() {
  leadModal.hidden = true;
}

taskForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.querySelector("#taskInput");
  const text = input.value.trim();
  if (!text) return;
  state.tasks.unshift({ id: crypto.randomUUID(), text, done: false, due: "today" });
  input.value = "";
  persistAndRender();
});

searchInput.addEventListener("input", render);

function loadState() {
  const saved = localStorage.getItem("closepilot-state");
  if (!saved) {
    return structuredClone(seedState);
  }

  try {
    return JSON.parse(saved);
  } catch {
    return structuredClone(seedState);
  }
}

function saveState() {
  localStorage.setItem("closepilot-state", JSON.stringify(state));
}

function persistAndRender() {
  saveState();
  render();
}

function filteredLeads() {
  const query = searchInput.value.trim().toLowerCase();
  if (!query) return state.leads;
  return state.leads.filter((lead) => {
    return [lead.name, lead.company, lead.notes, lead.source].some((field) =>
      field.toLowerCase().includes(query),
    );
  });
}

function render() {
  renderMetrics();
  renderPipeline();
  renderLeadBrief();
  renderAutomations();
  renderContacts();
  renderTasks();
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

function renderPipeline() {
  const leads = filteredLeads();
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
      persistAndRender();
    });
  });

  board.querySelectorAll("[data-move]").forEach((button) => {
    button.addEventListener("click", () => {
      moveLead(button.dataset.leadId, Number(button.dataset.move));
    });
  });
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

function moveLead(leadId, direction) {
  const lead = state.leads.find((item) => item.id === leadId);
  const index = stages.findIndex((stage) => stage.id === lead.stage);
  const nextStage = stages[Math.min(stages.length - 1, Math.max(0, index + direction))];
  if (!lead || lead.stage === nextStage.id) return;

  lead.stage = nextStage.id;
  lead.score = Math.min(99, lead.score + (direction > 0 ? 4 : -2));
  state.selectedLeadId = lead.id;
  addAutomatedTask(`Follow up with ${lead.name} after moving to ${nextStage.label}`);
  persistAndRender();
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
    <p>${escapeHtml(lead.notes)}</p>
    <strong>${escapeHtml(lead.nextAction)}</strong>
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
    button.addEventListener("click", () => {
      const automation = state.automations.find((item) => item.id === button.dataset.toggleAuto);
      automation.enabled = !automation.enabled;
      persistAndRender();
    });
  });
}

function renderContacts() {
  const leads = filteredLeads();
  contactTable.innerHTML = leads
    .map(
      (lead) => `
      <article class="contact-row">
        <p><strong>${escapeHtml(lead.name)}</strong><span>${escapeHtml(lead.company)}</span></p>
        <p>${escapeHtml(lead.source)}</p>
        <p>${stageLabel(lead.stage)}</p>
        <p>${formatter.format(lead.value)}</p>
      </article>
    `,
    )
    .join("");
}

function renderTasks() {
  taskList.innerHTML = state.tasks
    .map(
      (task) => `
      <article class="task-item ${task.done ? "done" : ""}">
        <input data-task-done="${task.id}" type="checkbox" ${task.done ? "checked" : ""} aria-label="Mark task complete" />
        <p>${escapeHtml(task.text)}<span>${task.due}</span></p>
        <button data-delete-task="${task.id}" type="button">Delete</button>
      </article>
    `,
    )
    .join("");

  taskList.querySelectorAll("[data-task-done]").forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const task = state.tasks.find((item) => item.id === checkbox.dataset.taskDone);
      task.done = checkbox.checked;
      persistAndRender();
    });
  });

  taskList.querySelectorAll("[data-delete-task]").forEach((button) => {
    button.addEventListener("click", () => {
      state.tasks = state.tasks.filter((task) => task.id !== button.dataset.deleteTask);
      persistAndRender();
    });
  });
}

function addAutomatedTask(text) {
  const automation = state.automations.find((item) => item.id === "auto-1");
  if (!automation?.enabled) return;
  state.tasks.unshift({ id: crypto.randomUUID(), text, done: false, due: "today" });
}

function stageLabel(stageId) {
  return stages.find((stage) => stage.id === stageId)?.label || "Unknown";
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[char];
  });
}

render();
