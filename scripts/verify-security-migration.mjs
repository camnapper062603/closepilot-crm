import "../local-env.js";

const jsonMode = process.argv.includes("--json");
const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const checks = [];

if (!supabaseUrl || !serviceKey) {
  checks.push({
    name: "configuration",
    status: "not_configured",
    detail: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for live verification.",
  });
  finish(2);
}

await verifySelect(
  "calendar token encryption columns",
  "calendar_connections?select=workspace_id,access_token_ciphertext,access_token_iv,access_token_tag,refresh_token_ciphertext,refresh_token_iv,refresh_token_tag,token_key_version&limit=1",
);
await verifySelect(
  "calendar status view",
  "calendar_connection_status?select=workspace_id,provider,status,google_account_email,calendar_id,has_refresh_token,has_access_token,expires_at&limit=1",
  { optional: true },
);
await verifySelect(
  "recruiting app state",
  "recruiting_app_state?select=workspace_id,job,postings,integrations_public,connector_settings,interviews,onboarding_workers,payroll_provider_public,payroll_runs,recruiter_notes,hiring_outcomes,crm_handoffs&limit=1",
  { optional: true },
);
await verifySelect(
  "recruiting candidate handoff columns",
  "recruiting_candidates?select=workspace_id,external_id,assigned_recruiter,assigned_manager,hiring_outcome,recruiter_notes,converted_member_invitation_id,follow_up_task_id,activity_note_id,last_handoff_at&limit=1",
  { optional: true },
);
await verifySelect("workspace add-ons", "workspace_addons?select=workspace_id,addon_key,status,trial_ends_at,metadata&limit=1", { optional: true });
await verifySelect(
  "launch readiness policy columns",
  "launch_readiness_categories?select=category_key,score,weight,status,source,evidence,checked_at&limit=1",
  { optional: true },
);
await verifySelect(
  "launch checklist policy columns",
  "launch_checklist_items?select=item_key,status,required,required_stages,evidence&limit=1",
  { optional: true },
);
await verifySelect(
  "launch blocker operational columns",
  "launch_blockers?select=id,category,evidence_url,evidence_text,resolution_notes,accepted_risk_reason,accepted_risk_by,accepted_risk_at,launch_blocking,target_stage,owner_user_id,resolved_by,resolved_at&limit=1",
  { optional: true },
);
await verifySelect(
  "launch beta operational columns",
  "launch_beta_accounts?select=id,contact_name,contact_email,contact_phone,industry,onboarding_stage,beta_status,start_date,last_activity_at,open_issue_count,feedback_count,conversion_likelihood,pilot_price,expected_conversion_date,assigned_owner,next_action,next_action_due_at&limit=1",
  { optional: true },
);
await verifySelect(
  "team attribution columns",
  "communications?select=workspace_id,created_by,sent_by,user_id,member_id&limit=1",
  { optional: true },
);

await verifyPlaintextTokenState();

finish(checks.some((check) => check.status === "failed") ? 1 : 0);

async function verifySelect(name, path, options = {}) {
  try {
    await supabaseRequest(path, { method: "GET" });
    checks.push({ name, status: "passed", detail: "select succeeded" });
  } catch (error) {
    checks.push({
      name,
      status: options.optional ? "warning" : "failed",
      detail: scrub(error.message),
    });
  }
}

async function verifyPlaintextTokenState() {
  try {
    const rows = await supabaseRequest("calendar_connections?select=workspace_id,access_token,refresh_token&limit=1000", { method: "GET" });
    const plaintextRows = (Array.isArray(rows) ? rows : []).filter((row) => row.access_token || row.refresh_token).length;
    checks.push({
      name: "plaintext google tokens",
      status: plaintextRows ? "warning" : "passed",
      detail: plaintextRows
        ? `${plaintextRows} calendar connection row(s) still have plaintext token columns populated.`
        : "No sampled plaintext tokens found.",
    });
  } catch (error) {
    checks.push({ name: "plaintext google tokens", status: "warning", detail: scrub(error.message) });
  }
}

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
    },
  });
  const text = await response.text();
  if (!response.ok) throw new Error(text || `Supabase request failed with ${response.status}`);
  return text ? JSON.parse(text) : null;
}

function finish(exitCode) {
  if (jsonMode) {
    console.log(JSON.stringify({ ok: exitCode === 0, checks }, null, 2));
  } else {
    for (const check of checks) console.log(`${check.status.toUpperCase()} ${check.name}: ${check.detail}`);
  }
  process.exit(exitCode);
}

function scrub(value) {
  return String(value || "")
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .replace(/\b[A-Za-z0-9+/]{32,}={0,2}\b/g, "[redacted-token]");
}
