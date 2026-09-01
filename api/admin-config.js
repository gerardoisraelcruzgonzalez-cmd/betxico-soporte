import { authenticateAccount, createOrUpdateAccount, getAccount, getCurrentAccount, publicAccount } from "../lib/account-store.js";
import { readJson, sendJson, optionalEnv } from "../lib/http.js";
import { getSupportConfig, isSupportAdmin, saveSupportConfig } from "../lib/remote-config.js";
import { listAiExamples, saveAiExamples } from "../lib/ai-training.js";
import { getAlertAcknowledgementSummary } from "../lib/alert-acks.js";
import { getAiRuntimeState, setAiRuntimeEnabled } from "../lib/ai-runtime-toggle.js";
import { verifySimulatorPreviewPin } from "../lib/simulator-policy.js";

export default async function handler(req, res) {
  try {
    await requireAdminAccess(req);
    const action = String(req.query?.action || "").trim();

    if (action === "ai-examples") {
      if (req.method === "GET") {
        const examples = await listAiExamples();
        return sendJson(res, 200, { ok: true, examples });
      }
      if (req.method === "POST") {
        const payload = await readJson(req);
        const examples = await saveAiExamples(payload.examples || []);
        return sendJson(res, 200, { ok: true, examples });
      }
    }

    if (action === "ai-runtime") {
      if (req.method === "GET") {
        return sendJson(res, 200, { ok: true, runtime: await getAiRuntimeState() });
      }
      if (req.method === "POST") {
        const account = await requireAdminSession(req);
        const payload = await readJson(req);
        await authenticateAdminPin(account, payload.pin);
        const runtime = await setAiRuntimeEnabled(payload.enabled === true, account);
        return sendJson(res, 200, { ok: true, runtime });
      }
    }

    if (action === "provision-account") {
      if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
      const admin = await requireAdminSession(req);
      const payload = await readJson(req);
      const account = await provisionAccount(payload, admin);
      return sendJson(res, 200, { ok: true, account: publicAccount(account, account.email) });
    }

    if (req.method === "GET") {
      const config = await getSupportConfig();
      return sendJson(res, 200, {
        ok: true,
        config,
        alertAcknowledgements: await getAlertAcknowledgementSummary(config.supportAlerts, config.authorizedUsers)
      });
    }

    if (req.method === "POST") {
      const payload = await readJson(req);
      const session = await getCurrentAccount(req).catch(() => null);
      const config = await saveSupportConfig(preserveSessionAdmin(payload.config || payload, session));
      return sendJson(res, 200, {
        ok: true,
        config,
        alertAcknowledgements: await getAlertAcknowledgementSummary(config.supportAlerts, config.authorizedUsers)
      });
    }

    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "admin_config_failed",
      details: error.details || undefined
    });
  }
}

async function provisionAccount(payload = {}, admin) {
  const email = normalizeEmail(payload.email);
  const pin = String(payload.pin || "").trim();
  if (!email || !pin) {
    const error = new Error("invalid_account_provisioning");
    error.statusCode = 400;
    throw error;
  }

  const config = await getSupportConfig();
  const users = [...(config.authorizedUsers || [])];
  const index = users.findIndex((user) => user.email === email);
  if (index === -1) {
    users.push({ email, displayName: String(payload.displayName || "").trim(), role: "agent", accessGroup: "basic", enabled: true });
  } else {
    users[index] = {
      ...users[index],
      displayName: String(payload.displayName || users[index].displayName || "").trim(),
      enabled: true
    };
  }

  await saveSupportConfig(preserveSessionAdmin({ ...config, authorizedUsers: users }, admin));
  const existing = await getAccount(email);
  return createOrUpdateAccount(
    { email, displayName: String(payload.displayName || "").trim(), pin },
    existing || {},
    { allowPasswordless: Boolean(existing) }
  );
}

export function preserveSessionAdmin(config = {}, session) {
  const email = normalizeEmail(session?.email || session?.userId);
  if (!email) return config;
  const users = Array.isArray(config.authorizedUsers || config.users) ? [...(config.authorizedUsers || config.users)] : [];
  const index = users.findIndex((user) => normalizeEmail(typeof user === "string" ? user : user?.email) === email);
  const current = index === -1 ? {} : (typeof users[index] === "string" ? { email: users[index] } : users[index]);
  const adminUser = { ...current, email, role: "admin", enabled: true };
  if (index === -1) users.push(adminUser);
  else users[index] = adminUser;
  const adminEmails = new Set([...(config.adminEmails || []), email].map(normalizeEmail).filter(Boolean));
  return { ...config, authorizedUsers: users, adminEmails: [...adminEmails] };
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

async function authenticateAdminPin(sessionAccount, pin) {
  try {
    await authenticateAccount(sessionAccount.email, pin);
    return;
  } catch (error) {
    if (error?.message !== "invalid_login") throw error;
    const email = String(sessionAccount.email || "").trim().toLowerCase();
    const account = email ? await getAccount(email) : null;
    if (verifySimulatorPreviewPin({ email, pin, account })) return;
    throw error;
  }
}

async function requireAdminSession(req) {
  const account = await getCurrentAccount(req).catch(() => null);
  if (account?.email && await isSupportAdmin(account.email)) return account;
  const error = new Error("admin_not_authorized");
  error.statusCode = 403;
  throw error;
}

async function requireAdminAccess(req) {
  const expected = optionalEnv("INTERNAL_API_KEY");
  const received = String(req.headers["x-internal-api-key"] || "").trim();
  if (expected && received && expected === received) {
    return;
  }

  const account = await getCurrentAccount(req).catch(() => null);
  if (account?.email && await isSupportAdmin(account.email)) {
    return;
  }

  const error = new Error("admin_not_authorized");
  error.statusCode = 403;
  throw error;
}
