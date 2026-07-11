import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const skipPatterns = [
  /^node_modules\//,
  /^dist\//,
  /^playwright-report\//,
  /^test-results\//,
  /^tests\/security\//,
  /^package-lock\.json$/,
];
const secretPatterns = [
  { name: "Supabase service key", regex: /\bsb_secret_[A-Za-z0-9_-]{20,}\b/g },
  { name: "Stripe secret key", regex: /\b(?:sk|rk)_(?:live|test)_[A-Za-z0-9]{16,}\b/g },
  { name: "GitHub token", regex: /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/g },
  { name: "Google OAuth token", regex: /\bya29\.[A-Za-z0-9_-]{20,}\b/g },
  { name: "Slack token", regex: /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/g },
  { name: "Postgres URL with password", regex: /postgres(?:ql)?:\/\/[^:\s]+:[^\s@]+@[^/\s]+\/[^\s"']+/g },
  { name: "Private key", regex: /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/g },
];
const allowText = [
  "postgresql://postgres:[YOUR-PASSWORD]@db.example.supabase.co:5432/postgres",
  "sk_live_1234567890abcdef",
];

const files = execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard"], { encoding: "utf8" })
  .split("\n")
  .map((file) => file.trim())
  .filter(Boolean)
  .filter((file) => !skipPatterns.some((pattern) => pattern.test(file)));
const findings = [];

for (const file of files) {
  const text = readFileSync(file, "utf8");
  for (const pattern of secretPatterns) {
    for (const match of text.matchAll(pattern.regex)) {
      if (allowText.some((allowed) => match[0].includes(allowed))) continue;
      findings.push({ file, name: pattern.name, line: lineNumber(text, match.index || 0) });
    }
  }
}

if (findings.length) {
  console.error(`Secret scan found ${findings.length} possible secret(s):`);
  for (const finding of findings) console.error(`- ${finding.file}:${finding.line} ${finding.name}`);
  process.exit(1);
}

console.log(`Secret scan passed across ${files.length} tracked/untracked file(s).`);

function lineNumber(text, index) {
  return text.slice(0, index).split("\n").length;
}
