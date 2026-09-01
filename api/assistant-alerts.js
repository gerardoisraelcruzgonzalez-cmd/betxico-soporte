import crypto from "node:crypto";
import { requireCurrentAccount } from "../lib/account-store.js";
import { optionalEnv, readJson, sendJson } from "../lib/http.js";

const ALERTS_KEY = "support:assistant-alerts:v1";
const MAX_ALERTS = 50;

export default async function handler(req, res) {
  try {
    if (req.method === "POST") {
      const account = await requireCurrentAccount(req);
      const payload = await readJson(req);
      const alert = normalizeAlert(payload, account);
      const alerts = await readAlerts();
      await writeAlerts([alert, ...alerts].slice(0, MAX_ALERTS));
      return sendJson(res, 201, { ok: true, alert });
    }

    requireAssistantAlertsToken(req);

    if (req.method === "GET") {
      const limit = clampInt(req.query?.limit, 10, 1, MAX_ALERTS);
      return sendJson(res, 200, { ok: true, alerts: (await readAlerts()).slice(0, limit) });
    }

    if (req.method === "DELETE") {
      const id = String(req.query?.id || "").trim();
      if (!id) return sendJson(res, 400, { ok: false, error: "missing_alert_id" });
      const alerts = await readAlerts();
      const next = alerts.filter((alert) => alert.id !== id);
      await writeAlerts(next);
      return sendJson(res, 200, { ok: true, dismissed: next.length !== alerts.length });
    }

    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "assistant_alerts_failed"
    });
  }
}

function normalizeAlert(payload, account) {
  return {
    id: crypto.randomUUID(),
    title: clean(payload.title) || "Alerta de LiveChat",
    message: clean(payload.message) || "Revisar cliente desde Betxico Soporte.",
    severity: ["info", "warning", "critical"].includes(payload.severity) ? payload.severity : "critical",
    customerName: clean(payload.customerName),
    customerEmail: clean(payload.customerEmail).toLowerCase(),
    customerId: clean(payload.customerId),
    chatId: clean(payload.chatId),
    agentName: clean(payload.agentName) || account.displayName || account.email || "",
    source: "betxico-soporte",
    createdAt: new Date().toISOString()
  };
}

async function readAlerts() {
  return normalizeAlerts(await kvGet(ALERTS_KEY).catch(() => []));
}

async function writeAlerts(alerts) {
  await kvSet(ALERTS_KEY, normalizeAlerts(alerts).slice(0, MAX_ALERTS));
}

function normalizeAlerts(value) {
  return Array.isArray(value) ? value.filter((item) => item && typeof item === "object") : [];
}

function requireAssistantAlertsToken(req) {
  const expected = optionalEnv("ASSISTANT_ALERTS_TOKEN");
  const received = String(req.headers.authorization || "").trim().replace(/^Bearer\s+/i, "");
  if (!expected || !received || !timingSafeEqual(expected, received)) {
    const error = new Error("assistant_alerts_unauthorized");
    error.statusCode = 401;
    throw error;
  }
}

async function kvGet(key) {
  const response = await kvRequest(["GET", key]);
  return response?.result ? JSON.parse(response.result) : null;
}

async function kvSet(key, value) {
  await kvRequest(["SET", key, JSON.stringify(value)]);
}

async function kvRequest(command) {
  const url = optionalEnv("KV_REST_API_URL") || optionalEnv("UPSTASH_REDIS_REST_URL");
  const token = optionalEnv("KV_REST_API_TOKEN") || optionalEnv("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) {
    const error = new Error("missing_kv_config");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch(`${url.replace(/\/+$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify([command])
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error("kv_request_failed");
    error.statusCode = response.status;
    throw error;
  }

  return Array.isArray(data) ? data[0] : data;
}

function clean(value) {
  return String(value || "").trim();
}

function clampInt(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value || ""), 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

function timingSafeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}
