import crypto from "node:crypto";
import { sendJson } from "../lib/http.js";
import { optionalEnv, readJson } from "../lib/http.js";
import { acknowledgeAlert, getAlertAcknowledgements } from "../lib/alert-acks.js";
import { getCurrentAccount, requireCurrentAccount } from "../lib/account-store.js";
import { getSupportConfig, isSupportAdmin } from "../lib/remote-config.js";
import { createKycReviewStore, KYC_REVIEW_MAX_RECORDS } from "../lib/kyc-review-store.js";

const kycReviewStore = createKycReviewStore();

export default async function handler(req, res) {
  try {
    const action = String(req.query?.action || "").trim();
    if (action === "assistant-alerts") {
      return await handleAssistantAlerts(req, res);
    }

    if (action === "kyc-review-status") {
      return await handleKycReviewStatus(req, res);
    }

    if (action === "ack-alert") {
      if (req.method !== "POST") {
        return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
      }
      const account = await requireCurrentAccount(req);
      const payload = await readJson(req);
      await acknowledgeAlert(account.email, payload.alertId, payload.version);
      return sendJson(res, 200, { ok: true });
    }


    if (req.method !== "GET") {
      return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
    }

    const config = await getSupportConfig();
    const account = await getCurrentAccount(req).catch(() => null);
    const activeAlerts = account?.email ? await selectPendingAlerts(config, account) : [];
    return sendJson(res, 200, {
      ok: true,
      reportWorkflows: config.reportWorkflows.filter((workflow) => workflow.enabled !== false),
      listPanels: config.listPanels
        .filter((panel) => panel.enabled !== false)
        .map((panel) => ({
          id: panel.id,
          label: panel.label,
          limit: panel.limit
        })),
      slackRoutes: config.slackRoutes.map((route) => ({
        id: route.id,
        name: route.name,
        mode: route.mode,
        channelId: route.channelId,
        listId: route.listId,
        match: route.match,
        listColumns: route.listColumns
      })),
      liveChatAutomation: selectPublicLiveChatAutomation(config, account),
      traceability: selectPublicTraceability(config, account),
      activeAlerts
    });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "support_config_failed",
      details: error.details || undefined
    });
  }
}


const ASSISTANT_ALERTS_KEY = "support:assistant-alerts:v1";
const MAX_ASSISTANT_ALERTS = 50;

async function handleAssistantAlerts(req, res) {
  if (req.method === "POST") {
    const account = await requireCurrentAccount(req);
    const payload = await readJson(req);
    const alert = normalizeAssistantAlert(payload, account);
    const alerts = await readAssistantAlerts();
    await writeAssistantAlerts([alert, ...alerts].slice(0, MAX_ASSISTANT_ALERTS));
    return sendJson(res, 201, { ok: true, alert });
  }

  requireAssistantAlertsToken(req);

  if (req.method === "GET") {
    const limit = clampInt(req.query?.limit, 10, 1, MAX_ASSISTANT_ALERTS);
    return sendJson(res, 200, { ok: true, alerts: (await readAssistantAlerts()).slice(0, limit) });
  }

  if (req.method === "DELETE") {
    const id = String(req.query?.id || "").trim();
    if (!id) return sendJson(res, 400, { ok: false, error: "missing_alert_id" });
    const alerts = await readAssistantAlerts();
    const next = alerts.filter((alert) => alert.id !== id);
    await writeAssistantAlerts(next);
    return sendJson(res, 200, { ok: true, dismissed: next.length !== alerts.length });
  }

  return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
}

function normalizeAssistantAlert(payload, account) {
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

async function handleKycReviewStatus(req, res) {
  if (req.method === "GET") {
    const account = await requireCurrentAccount(req);
    if (!(await isSupportAdmin(account.email))) {
      const error = new Error("admin_not_authorized");
      error.statusCode = 403;
      throw error;
    }
    const limit = clampInt(req.query?.limit, 100, 1, KYC_REVIEW_MAX_RECORDS);
    return sendJson(res, 200, { ok: true, reviews: await kycReviewStore.list(limit) });
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  const account = await requireCurrentAccount(req);
  const payload = await readJson(req);
  const review = await kycReviewStore.save(payload, account);
  return sendJson(res, 201, { ok: true, review });
}

async function readAssistantAlerts() {
  return normalizeAssistantAlerts(await assistantKvGet(ASSISTANT_ALERTS_KEY).catch(() => []));
}

async function writeAssistantAlerts(alerts) {
  await assistantKvSet(ASSISTANT_ALERTS_KEY, normalizeAssistantAlerts(alerts).slice(0, MAX_ASSISTANT_ALERTS));
}

function normalizeAssistantAlerts(value) {
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

async function assistantKvGet(key) {
  const response = await assistantKvRequest(["GET", key]);
  return response?.result ? JSON.parse(response.result) : null;
}

async function assistantKvSet(key, value) {
  await assistantKvRequest(["SET", key, JSON.stringify(value)]);
}

async function assistantKvRequest(command) {
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

function selectPublicTraceability(config, account = null) {
  const traceability = config.traceability || {};
  // Los depositos contienen datos sensibles (CLABE, nombre del depositante).
  // Solo se exponen a una cuenta autenticada; sin sesion valida se omiten.
  const hasAuthenticatedAccount = Boolean(account?.email);
  return {
    enabled: traceability.enabled !== false,
    updatedAt: traceability.updatedAt || "",
    deposits: hasAuthenticatedAccount && Array.isArray(traceability.deposits)
      ? traceability.deposits.map((deposit) => ({
          email: deposit.email,
          depositAmount: deposit.depositAmount,
          depositClabe: deposit.depositClabe,
          depositDate: deposit.depositDate,
          depositorName: deposit.depositorName,
          dateTs: deposit.dateTs || 0
        }))
      : []
  };
}

function selectPublicLiveChatAutomation(config, account) {
  const automation = config.liveChatAutomation || {};
  const autoWelcome = automation.autoWelcome || {};
  const email = String(account?.email || "").trim().toLowerCase();
  const allowedAgents = Array.isArray(autoWelcome.onlyForAgents) ? autoWelcome.onlyForAgents : [];
  const allowed = Boolean(email) && (!allowedAgents.length || allowedAgents.includes(email));
  return {
    enabled: automation.enabled !== false,
    safeTemplateMode: automation.safeTemplateMode || "suggest_only",
    evidenceResponseMode: automation.evidenceResponseMode || "auto_send_verified",
    autoWelcome: {
      enabled: autoWelcome.enabled !== false && allowed,
      message: autoWelcome.message || "",
      oncePerChat: autoWelcome.oncePerChat !== false
    }
  };
}

async function selectPendingAlerts(config, account) {
  const admin = await isSupportAdmin(account.email);
  const acknowledgements = await getAlertAcknowledgements(account.email).catch(() => ({}));
  return (config.supportAlerts || [])
    .filter((alert) => alert.enabled !== false && alert.requireAcknowledgement !== false)
    .filter((alert) => shouldShowAlert(alert, account, admin))
    .filter((alert) => acknowledgements[alert.id] !== alert.updatedAt)
    .map((alert) => ({
      id: alert.id,
      title: alert.title,
      message: alert.message,
      severity: alert.severity,
      updatedAt: alert.updatedAt
    }));
}

function shouldShowAlert(alert, account, admin) {
  if (alert.target === "all") return true;
  if (alert.target === "admins") return admin;
  if (alert.target === "agents") return !admin;
  if (alert.target === "emails") {
    return (alert.targetEmails || []).includes(String(account.email || "").toLowerCase());
  }
  return !admin;
}
