import { writeFileSync } from "node:fs";

const config = {
  supabaseUrl: process.env.SUPABASE_URL || "",
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "",
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
