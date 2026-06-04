import { getCurrentAccount } from "../lib/account-store.js";
import { readJson, sendJson, optionalEnv } from "../lib/http.js";
import { getSupportConfig, isSupportAdmin, saveSupportConfig } from "../lib/remote-config.js";
import { listAiExamples, saveAiExamples } from "../lib/ai-training.js";
import { getAlertAcknowledgementSummary } from "../lib/alert-acks.js";

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
      const config = await saveSupportConfig(payload.config || payload);
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
