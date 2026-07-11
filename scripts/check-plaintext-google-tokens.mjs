import "../local-env.js";

const jsonMode = process.argv.includes("--json");
const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!supabaseUrl || !serviceKey) {
  report({ status: "not_configured", plaintextRows: null, message: "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required." }, 2);
}

const rows = await supabaseRequest("calendar_connections?select=workspace_id,access_token,refresh_token&limit=1000");
const plaintextRows = (rows || []).filter((row) => row.access_token || row.refresh_token).length;
report(
  {
    status: plaintextRows ? "failed" : "passed",
    plaintextRows,
    message: plaintextRows
      ? `${plaintextRows} calendar connection row(s) still have plaintext Google tokens.`
      : "No sampled plaintext Google Calendar tokens remain.",
  },
  plaintextRows ? 1 : 0,
);

async function supabaseRequest(path) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
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

function report(payload, exitCode) {
  if (jsonMode) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(`${payload.status.toUpperCase()}: ${payload.message}`);
  }
  process.exit(exitCode);
}
