export async function readJson(req, options = {}) {
  const maxBytes = normalizeBodyLimit(options.maxBytes);
  assertDeclaredBodySize(req, maxBytes);

  if (typeof req.body === "string" || Buffer.isBuffer(req.body)) {
    assertBufferedBodySize(req.body, maxBytes);
    return parseJsonBody(req.body);
  }

  if (req.body && typeof req.body === "object") {
    assertBufferedBodySize(req.body, maxBytes);
    return req.body;
  }

  const chunks = [];
  let receivedBytes = 0;
  for await (const chunk of req) {
    const buffer = Buffer.from(chunk);
    receivedBytes += buffer.length;
    if (maxBytes && receivedBytes > maxBytes) throwBodyTooLarge();
    chunks.push(buffer);
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) {
    return {};
  }

  return parseJsonBody(raw);
}

function assertDeclaredBodySize(req, maxBytes) {
  if (!maxBytes) return;
  const rawLength = String(req?.headers?.["content-length"] || "").trim();
  if (!/^\d+$/u.test(rawLength)) return;
  if (Number(rawLength) > maxBytes) throwBodyTooLarge();
}

function assertBufferedBodySize(body, maxBytes) {
  if (!maxBytes) return;
  let bytes;
  try {
    bytes = Buffer.isBuffer(body)
      ? body.length
      : Buffer.byteLength(typeof body === "string" ? body : JSON.stringify(body), "utf8");
  } catch {
    const error = new Error("invalid_json");
    error.statusCode = 400;
    throw error;
  }
  if (bytes > maxBytes) throwBodyTooLarge();
}

function parseJsonBody(value) {
  const raw = Buffer.isBuffer(value) ? value.toString("utf8") : String(value || "");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("invalid_json");
    error.statusCode = 400;
    throw error;
  }
}

function normalizeBodyLimit(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0;
}

function throwBodyTooLarge() {
  const error = new Error("request_body_too_large");
  error.statusCode = 413;
  throw error;
}

export function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export function requireWidgetAccess(req) {
  const allowUnauthenticated = String(process.env.ALLOW_UNAUTHENTICATED_WIDGET || "").toLowerCase() === "true";
  if (isSameOriginBrowserRequest(req)) return;
  if (allowUnauthenticated && process.env.NODE_ENV !== "production") return;

  // Device clients (for example Raycast) authenticate with a personal bearer
  // token. The token is fully validated by requireCurrentAccount() immediately
  // after this perimeter check.
  const authorization = String(req.headers.authorization || "").trim();
  if (/^Bearer\s+btq_[A-Za-z0-9_-]{32,}$/i.test(authorization)) {
    return;
  }

  const expected = String(process.env.INTERNAL_API_KEY || "").trim();
  const received = String(req.headers["x-internal-api-key"] || "").trim();

  if (expected && received && expected === received) {
    return;
  }

  const error = new Error("unauthenticated_widget_call");
  error.statusCode = 401;
  throw error;
}

export function isSameOriginBrowserRequest(req) {
  const host = String(req?.headers?.host || req?.headers?.["x-forwarded-host"] || "").split(",")[0].trim().toLowerCase();
  if (!host) return false;
  const candidates = [req?.headers?.origin, req?.headers?.referer].filter(Boolean);
  for (const candidate of candidates) {
    try {
      if (new URL(String(candidate)).host.toLowerCase() === host) return true;
    } catch {}
  }
  return false;
}

export function requiredEnv(name) {
  const value = String(process.env[name] || "").trim();
  if (!value) {
    const error = new Error(`missing_env_${name}`);
    error.statusCode = 500;
    throw error;
  }
  return value;
}

export function optionalEnv(name, fallback = "") {
  return String(process.env[name] || fallback).trim();
}
