import "../local-env.js";

const baseUrl = (process.env.PRODUCTION_SMOKE_URL || process.env.APP_BASE_URL || "").replace(/\/$/, "");
const failures = [];

if (!baseUrl) {
  console.error("Set PRODUCTION_SMOKE_URL or APP_BASE_URL to run the production smoke test.");
  process.exit(2);
}

await check("landing page serves HTML", async () => {
  const response = await fetch(`${baseUrl}/`);
  assertStatus(response, 200);
  const text = await response.text();
  if (!/<html/i.test(text)) throw new Error("Landing page did not look like HTML.");
});

await check("manifest is available", async () => {
  const response = await fetch(`${baseUrl}/manifest.webmanifest`);
  assertStatus(response, 200);
  const body = await response.text();
  if (!body.includes("Kira")) throw new Error("Manifest did not include app metadata.");
});

await check("service worker is available", async () => {
  const response = await fetch(`${baseUrl}/service-worker.js`);
  assertStatus(response, 200);
  const body = await response.text();
  if (!body.includes("self")) throw new Error("Service worker did not look executable.");
});

await check("public readiness returns non-secret summary", async () => {
  const { response, body } = await postJson("/api/system/readiness", {});
  assertStatus(response, 200);
  if (!body || typeof body !== "object") throw new Error("Readiness response was not JSON.");
  if (JSON.stringify(body.checks || []).includes("SUPABASE_SERVICE_ROLE_KEY")) {
    throw new Error("Public readiness leaked protected env names.");
  }
});

await check("protected API requires auth", async () => {
  const { response, body } = await postJson("/api/communications/save-draft", { workspaceId: "00000000-0000-4000-8000-000000000001" });
  assertStatus(response, 401);
  if (body?.error?.code !== "AUTH_REQUIRED") throw new Error(`Expected AUTH_REQUIRED, got ${body?.error?.code || "missing code"}.`);
});

await check("unknown API route returns JSON 404", async () => {
  const { response, body } = await postJson("/api/not-a-real-route", {});
  assertStatus(response, 404);
  if (!body?.error && !body?.message) throw new Error("Unknown API route did not return JSON error shape.");
});

if (failures.length) {
  console.error(`Production smoke failed with ${failures.length} issue(s):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Production smoke passed for ${baseUrl}.`);

async function check(label, fn) {
  try {
    await fn();
    console.log(`ok - ${label}`);
  } catch (error) {
    failures.push(`${label}: ${error.message}`);
  }
}

async function postJson(path, payload) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: baseUrl },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  return { response, body };
}

function assertStatus(response, expected) {
  if (response.status !== expected) throw new Error(`Expected HTTP ${expected}, got ${response.status}.`);
}
