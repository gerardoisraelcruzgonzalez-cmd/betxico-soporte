import { sendJson } from "../lib/http.js";
import { readJson } from "../lib/http.js";
import { acknowledgeAlert, getAlertAcknowledgements } from "../lib/alert-acks.js";
import { getCurrentAccount, requireCurrentAccount } from "../lib/account-store.js";
import { getSupportConfig, isSupportAdmin } from "../lib/remote-config.js";

export default async function handler(req, res) {
  try {
    const action = String(req.query?.action || "").trim();
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

function selectPublicLiveChatAutomation(config, account) {
  const automation = config.liveChatAutomation || {};
  const autoWelcome = automation.autoWelcome || {};
  const email = String(account?.email || "").trim().toLowerCase();
  const allowedAgents = Array.isArray(autoWelcome.onlyForAgents) ? autoWelcome.onlyForAgents : [];
  const allowed = Boolean(email) && (!allowedAgents.length || allowedAgents.includes(email));
  return {
    enabled: automation.enabled !== false,
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
