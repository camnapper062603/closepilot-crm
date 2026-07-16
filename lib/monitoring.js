import { logServerEvent, redactLogValue } from "./logger.js";

const capturedEvents = [];

export function monitoringStatus(env = process.env) {
  const explicitlyEnabled = String(env.MONITORING_ENABLED || "").toLowerCase() === "true";
  const dsnConfigured = Boolean(env.SENTRY_DSN);
  const browserDsnConfigured = Boolean(env.PUBLIC_SENTRY_DSN);
  const configured = explicitlyEnabled && dsnConfigured;
  return {
    provider: dsnConfigured || browserDsnConfigured ? "sentry-compatible" : "provider-neutral",
    enabled: configured,
    configured,
    serverConfigured: dsnConfigured,
    browserConfigured: browserDsnConfigured,
    status: configured ? "healthy" : "not_configured",
    displayStatus: configured ? "Monitoring configured" : "Monitoring not configured",
    detail: configured
      ? "Server-side monitoring hooks are enabled."
      : "Set MONITORING_ENABLED=true and SENTRY_DSN to enable provider-backed monitoring.",
  };
}

export function captureMonitoringEvent(event, env = process.env) {
  const status = monitoringStatus(env);
  const safeEvent = redactLogValue({
    ...event,
    monitoringProvider: status.provider,
    environment: env.SENTRY_ENVIRONMENT || env.VERCEL_ENV || env.APP_MODE || "development",
    release: env.SENTRY_RELEASE || env.APP_RELEASE || env.APP_COMMIT_SHA || "",
    capturedAt: new Date().toISOString(),
  });
  capturedEvents.push(safeEvent);
  if (capturedEvents.length > 100) capturedEvents.shift();
  logServerEvent(status.enabled ? "error" : "warn", "monitoring.event", {
    configured: status.configured,
    event: safeEvent,
  }, env);
  return { captured: status.enabled, status: status.status, event: safeEvent };
}

export function recentMonitoringEvents() {
  return [...capturedEvents];
}
