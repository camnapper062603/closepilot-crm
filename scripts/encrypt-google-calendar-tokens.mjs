import { createCipheriv, randomBytes } from "node:crypto";
import "../local-env.js";

const supabaseUrl = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
const key = encryptionKey();
const keyVersion = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY_VERSION || "v1";
const shouldClearPlaintext = process.argv.includes("--clear-plaintext");

if (!supabaseUrl || !serviceKey || !key) {
  console.error("Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and a 32-byte GOOGLE_TOKEN_ENCRYPTION_KEY before running.");
  process.exit(1);
}

const rows = await supabaseRequest(
  "calendar_connections?select=workspace_id,access_token,refresh_token,access_token_ciphertext,refresh_token_ciphertext",
);

let migrated = 0;
for (const row of rows || []) {
  if ((!row.access_token || row.access_token_ciphertext) && (!row.refresh_token || row.refresh_token_ciphertext)) continue;
  const body = {
    ...encryptedFields("access_token", row.access_token),
    ...encryptedFields("refresh_token", row.refresh_token),
    token_key_version: keyVersion,
    updated_at: new Date().toISOString(),
  };
  if (shouldClearPlaintext) {
    body.access_token = "";
    body.refresh_token = "";
  }
  await supabaseRequest(`calendar_connections?workspace_id=eq.${encodeURIComponent(row.workspace_id)}`, {
    method: "PATCH",
    body,
  });
  migrated += 1;
}

console.log(
  `Encrypted Google Calendar tokens for ${migrated} workspace(s).` +
    (shouldClearPlaintext ? " Legacy plaintext columns were cleared." : " Rerun with --clear-plaintext after verification."),
);

async function supabaseRequest(path, options = {}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
    method: options.method || "GET",
    headers: {
      apikey: serviceKey,
      authorization: `Bearer ${serviceKey}`,
      "content-type": "application/json",
      prefer: "return=minimal",
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || `Supabase request failed with ${response.status}`);
  }
  return text ? JSON.parse(text) : null;
}

function encryptedFields(prefix, value) {
  if (!value) {
    return {
      [`${prefix}_ciphertext`]: "",
      [`${prefix}_iv`]: "",
      [`${prefix}_tag`]: "",
    };
  }
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  return {
    [`${prefix}_ciphertext`]: ciphertext.toString("base64"),
    [`${prefix}_iv`]: iv.toString("base64"),
    [`${prefix}_tag`]: cipher.getAuthTag().toString("base64"),
  };
}

function encryptionKey() {
  const raw = process.env.GOOGLE_TOKEN_ENCRYPTION_KEY || "";
  const candidates = [];
  if (/^[0-9a-f]{64}$/i.test(raw)) candidates.push(Buffer.from(raw, "hex"));
  candidates.push(Buffer.from(raw, "base64"));
  candidates.push(Buffer.from(raw, "utf8"));
  return candidates.find((candidate) => candidate.length === 32) || null;
}
