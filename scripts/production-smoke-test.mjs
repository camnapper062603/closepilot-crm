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
  if (!/sign in/i.test(text)) throw new Error("Login entry was not visible in the shipped HTML.");
  if (!/Support|Report a problem/i.test(text)) throw new Error("Support entry was not present in the shipped HTML.");
});

await check("main static assets are available", async () => {
  for (const asset of ["/styles.css", "/app.js", "/config.js"]) {
    const response = await fetch(`${baseUrl}${asset}`);
    assertStatus(response, 200);
    const text = await response.text();
    if (text.length < 100) throw new Error(`${asset} looked unexpectedly small.`);
  }
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

await check("health live endpoint responds with no-store JSON", async () => {
  const response = await fetch(`${baseUrl}/api/health/live`);
  assertStatus(response, 200);
  assertSecurityHeaders(response);
  const body = await response.json();
  if (body.status !== "ok") throw new Error("Liveness endpoint did not return ok.");
});

await check("health ready endpoint returns coarse non-secret readiness", async () => {
  const response = await fetch(`${baseUrl}/api/health/ready`);
  assertStatus(response, 200);
  assertSecurityHeaders(response);
  const text = await response.text();
  if (/SUPABASE_SERVICE_ROLE_KEY|STRIPE_SECRET_KEY|SENTRY_DSN/.test(text)) throw new Error("Readiness leaked protected env names.");
  const body = JSON.parse(text);
  if (!Array.isArray(body.checks)) throw new Error("Readiness did not include checks.");
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

await check("invalid JSON fails safely without stack trace", async () => {
  const response = await fetch(`${baseUrl}/api/system/readiness`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: baseUrl },
    body: "{not-json",
  });
  assertStatus(response, 400);
  const text = await response.text();
  if (/at\s+\w+\s+\(|stack|node:internal/i.test(text)) throw new Error("Invalid JSON response exposed stack details.");
});

await check("CORS rejects disallowed origins", async () => {
  const response = await fetch(`${baseUrl}/api/health/ready`, {
    method: "OPTIONS",
    headers: { origin: "https://invalid.example" },
  });
  assertStatus(response, 403);
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

function assertSecurityHeaders(response) {
  if (!response.headers.get("x-request-id")) throw new Error("Missing X-Request-ID header.");
  if (response.headers.get("x-content-type-options") !== "nosniff") throw new Error("Missing nosniff header.");
  if (!/no-store/i.test(response.headers.get("cache-control") || "")) throw new Error("Missing no-store cache control.");
}
