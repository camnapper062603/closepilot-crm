import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";

const config = {
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: normalizeJwt(process.env.SUPABASE_ANON_KEY || ""),
  stripeCheckoutUrl: process.env.STRIPE_CHECKOUT_URL || "",
  stripePortalUrl: process.env.STRIPE_PORTAL_URL || "",
  supportEmail: process.env.SUPPORT_EMAIL || "support@kira.local",
  inviteFromEmail: process.env.INVITE_FROM_EMAIL || "",
  productUrl: process.env.PRODUCT_URL || "",
  appBaseUrl: process.env.APP_BASE_URL || "",
};

const configText = `window.ClosePilotConfig = ${JSON.stringify(config, null, 2)};\n`;
writeFileSync("config.js", configText);

rmSync("dist", { force: true, recursive: true });
mkdirSync("dist", { recursive: true });

[
  "index.html",
  "app.js",
  "styles.css",
  "config.js",
  "manifest.webmanifest",
  "service-worker.js",
  "app-store.js",
  "recruiting.html",
  "recruiting.css",
  "recruiting.js",
  "SafeLeadGenerator-Standalone.html",
].forEach(copyToDist);

["assets", "lead-generator-outputs"].forEach(copyToDist);

console.log(
  config.supabaseUrl && config.supabaseAnonKey
    ? "Generated Supabase runtime config."
    : "Generated demo runtime config. Add SUPABASE_URL and SUPABASE_ANON_KEY for cloud mode.",
);

function normalizeJwt(value) {
  if (!value || value.split(".").length === 3) {
    return value;
  }

  const secondSegmentStart = value.indexOf("eyJ", 10);
  if (secondSegmentStart === -1) {
    return value;
  }

  const header = value.slice(0, secondSegmentStart);
  const rest = value.slice(secondSegmentStart);

  for (let index = 8; index < rest.length - 12; index += 1) {
    const payload = rest.slice(0, index);
    const signature = rest.slice(index);
    const parsed = parseBase64UrlJson(payload);

    if (parsed?.iss === "supabase" && parsed?.role === "anon" && parsed?.ref) {
      return `${header}.${payload}.${signature}`;
    }
  }

  return value;
}

function copyToDist(path) {
  if (!existsSync(path)) return;
  cpSync(path, `dist/${path}`, { recursive: true });
}

function parseBase64UrlJson(value) {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}
