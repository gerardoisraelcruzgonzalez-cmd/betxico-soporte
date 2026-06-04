export async function readJson(req) {
  if (req.body && typeof req.body === "object") {
    return req.body;
  }

  const chunks = [];
  for await (const chunk of req) {
    chunks.push(Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error("invalid_json");
    error.statusCode = 400;
    throw error;
  }
}

export function sendJson(res, statusCode, payload) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

export function requireWidgetAccess(req) {
  const allowUnauthenticated = String(process.env.ALLOW_UNAUTHENTICATED_WIDGET || "").toLowerCase() === "true";
  if (allowUnauthenticated) {
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

