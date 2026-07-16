import { randomBytes } from "node:crypto";

export function safeRequestId(value) {
  const text = String(value || "").trim();
  return /^[A-Za-z0-9._:-]{8,120}$/.test(text) ? text : randomBytes(12).toString("hex");
}

export function requestContextFrom(request, overrides = {}) {
  const url = new URL(request?.url || "/", `http://${request?.headers?.host || "localhost"}`);
  return {
    requestId: safeRequestId(request?.headers?.["x-request-id"]),
    method: request?.method || "GET",
    route: url.pathname,
    origin: safeOrigin(request?.headers?.origin),
    userAgent: safeText(request?.headers?.["user-agent"], 180),
    ...overrides,
  };
}

function safeOrigin(value) {
  try {
    const url = new URL(String(value || ""));
    return `${url.protocol}//${url.host}`;
  } catch {
    return "";
  }
}

function safeText(value, maxLength) {
  return String(value || "").trim().slice(0, maxLength);
}
