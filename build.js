import { writeFileSync } from "node:fs";

const config = {
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: normalizeJwt(process.env.SUPABASE_ANON_KEY || ""),
};

writeFileSync(
  "config.js",
  `window.ClosePilotConfig = ${JSON.stringify(config, null, 2)};\n`,
);

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

function parseBase64UrlJson(value) {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}
