import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { handleClosePilotApiRequest, isClosePilotApiPath } from "./api-handlers.js";
import { handleBusinessEnrichmentRequest } from "./business-enrichment-service.js";

const root = fileURLToPath(new URL(".", import.meta.url));
const host = process.env.HOST || "127.0.0.1";
const port = Number(process.env.PORT || 4173);

const types = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const startupWarnings = [
  ["SUPABASE_URL", "Supabase live database is not configured; demo/localStorage fallback remains active."],
  ["SUPABASE_ANON_KEY", "Supabase anon/publishable key is missing; browser auth cannot start cloud mode."],
  ["SUPABASE_SERVICE_ROLE_KEY", "Supabase service role is missing; backend sync/invite acceptance cannot persist."],
  ["STRIPE_SECRET_KEY", "Stripe billing is in setup mode."],
  ["RESEND_API_KEY", "Email delivery is in setup mode."],
  ["OPENAI_API_KEY", "AI endpoints will use deterministic fallback responses."],
  ["TWILIO_ACCOUNT_SID", "SMS endpoints will log demo responses only."],
].filter(([key]) => !process.env[key]);

createServer((request, response) => {
  const url = new URL(request.url || "/", `http://${request.headers.host}`);

  response.setHeader("X-Content-Type-Options", "nosniff");
  response.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  response.setHeader("X-Frame-Options", "SAMEORIGIN");
  response.setHeader(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=()",
  );

  if (url.pathname === "/api/business-enrichment") {
    handleBusinessEnrichmentRequest(request, response);
    return;
  }

  if (isClosePilotApiPath(url.pathname)) {
    handleClosePilotApiRequest(request, response);
    return;
  }

  const requestedPath = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.[/\\])+/, "");
  let filePath = join(root, requestedPath);

  if (!existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(root, "index.html");
  }

  response.setHeader("Content-Type", types[extname(filePath)] || "application/octet-stream");
  createReadStream(filePath).pipe(response);
}).listen(port, host, () => {
  console.log(`ClosePilot CRM running at http://${host}:${port}`);
  startupWarnings.forEach(([, warning]) => console.warn(`Setup warning: ${warning}`));
});
