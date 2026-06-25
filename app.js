const stages = [
  { id: "new", label: "New" },
  { id: "qualified", label: "Qualified" },
  { id: "proposal", label: "Proposal" },
  { id: "won", label: "Won" },
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
};

let state = structuredClone(seedState);
let store;
let currentUser = null;
let supabaseClient = null;

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
const authPanel = document.querySelector("#authPanel");
const authForm = document.querySelector("#authForm");
const authMessage = document.querySelector("#authMessage");
const modePill = document.querySelector("#modePill");
const appShell = document.querySelector(".app-shell");
const signOutButton = document.querySelector("#signOutButton");

const config = window.ClosePilotConfig || {};
const hasSupabaseConfig = Boolean(config.supabaseUrl && config.supabaseAnonKey);

document.querySelector("#openLeadModal").addEventListener("click", () => {
  leadModal.hidden = false;
  document.querySelector("#leadName").focus();
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
  const text = input.value.trim();
  if (!text) return;

  await store.createTask({ text, done: false, due: "today" });
  input.value = "";
  await reloadState();
});

searchInput.addEventListener("input", render);

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await signIn();
});

document.querySelector("#signUpButton").addEventListener("click", signUp);
signOutButton.addEventListener("click", signOut);

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
    nextAction: "Review lead details and choose the best follow-up.",
    source: "Manual",
    score: 65,
  };

  const created = await store.createLead(lead);
  await addAutomatedTask(`Follow up with ${created.name} at ${created.company}`);
  state.selectedLeadId = created.id;
  leadForm.reset();
  closeLeadModal();
  await reloadState();
}

function closeLeadModal() {
  leadModal.hidden = true;
}

async function reloadState() {
  state = await store.load();
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
      render();
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

  await store.updateLead(updatedLead);
  await addAutomatedTask(`Follow up with ${lead.name} after moving to ${nextStage.label}`);
  state.selectedLeadId = lead.id;
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
    button.addEventListener("click", async () => {
      const automation = state.automations.find((item) => item.id === button.dataset.toggleAuto);
      await store.updateAutomation({ ...automation, enabled: !automation.enabled });
      await reloadState();
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
}

async function addAutomatedTask(text) {
  const automation = state.automations.find((item) => item.key === "next-step-tasks");
  if (!automation?.enabled) return;
  await store.createTask({ text, done: false, due: "today" });
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
    async updateLead(lead) {
      state.leads = state.leads.map((item) => (item.id === lead.id ? lead : item));
      this.save(state);
      return lead;
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
      const [{ data: leads, error: leadError }, { data: tasks, error: taskError }, automations] =
        await Promise.all([
          client.from("leads").select("*").eq("workspace_id", workspaceId).order("created_at"),
          client.from("tasks").select("*").eq("workspace_id", workspaceId).order("created_at", {
            ascending: false,
          }),
          this.loadAutomations(),
        ]);
      throwIf(leadError);
      throwIf(taskError);

      return {
        selectedLeadId: state.selectedLeadId,
        workspaceName,
        leads: leads.map(fromLeadRow),
        tasks: tasks.map(fromTaskRow),
        automations,
      };
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

function throwIf(error) {
  if (error) throw error;
}

function stageLabel(stageId) {
  return stages.find((stage) => stage.id === stageId)?.label || "Unknown";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return entities[char];
  });
}

boot();
