const defaultLevelOrder = ["debug", "info", "warn", "error"];

export function redactLogValue(value) {
  const secretKeys = [
    "authorization",
    "access_token",
    "refresh_token",
    "token",
    "token_hash",
    "invite_token",
    "temporary_password",
    "password",
    "secret",
    "api_key",
    "apikey",
    "auth_token",
    "webhook_secret",
    "encryption_key",
    "signature",
    "dsn",
  ];

  const redactText = (text) =>
    String(text)
      .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
      .replace(/\b(sk_live|sk_test|rk_live|SG|xox[baprs]|AIza|ya29|sb_secret|sb_publishable)_[A-Za-z0-9._-]+/g, "[redacted-secret]")
      .replace(/\b[A-Za-z0-9+/]{32,}={0,2}\b/g, "[redacted-token]");

  const walk = (entry, key = "") => {
    if (entry === null || entry === undefined) return entry;
    if (secretKeys.some((secretKey) => key.toLowerCase().includes(secretKey))) return "[redacted]";
    if (typeof entry === "string") return redactText(entry);
    if (Array.isArray(entry)) return entry.map((item) => walk(item, key));
    if (typeof entry === "object") {
      return Object.fromEntries(Object.entries(entry).map(([childKey, childValue]) => [childKey, walk(childValue, childKey)]));
    }
    return entry;
  };

  return walk(value);
}

export function logServerEvent(level, event, context = {}, env = process.env) {
  const configuredLevel = String(env.LOG_LEVEL || "info").toLowerCase();
  const activeIndex = defaultLevelOrder.includes(configuredLevel) ? defaultLevelOrder.indexOf(configuredLevel) : 1;
  const eventIndex = defaultLevelOrder.includes(level) ? defaultLevelOrder.indexOf(level) : 1;
  if (eventIndex < activeIndex) return;
  const payload = redactLogValue({
    level,
    event,
    timestamp: new Date().toISOString(),
    environment: env.SENTRY_ENVIRONMENT || env.VERCEL_ENV || env.APP_MODE || "development",
    release: env.SENTRY_RELEASE || env.APP_RELEASE || env.APP_COMMIT_SHA || "",
    ...context,
  });
  const line = JSON.stringify(payload);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
