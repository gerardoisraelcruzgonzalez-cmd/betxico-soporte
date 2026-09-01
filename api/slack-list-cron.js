import { syncSlackListPanelCache } from "../lib/slack.js";
import { SUPPORT_SLACK_HISTORICAL_PANEL_ID, SUPPORT_SLACK_PANEL_ID } from "../lib/remote-config.js";
import { sendJson } from "../lib/http.js";

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }
  const expected = String(process.env.CRON_SECRET || "").trim();
  const received = String(req.headers.authorization || "").replace(/^Bearer\s+/i, "").trim();
  if (!expected || received !== expected) {
    return sendJson(res, 401, { ok: false, error: "cron_unauthorized" });
  }
  try {
    const sync = [];
    for (const panelId of [SUPPORT_SLACK_PANEL_ID, SUPPORT_SLACK_HISTORICAL_PANEL_ID]) {
      try {
        sync.push(await syncSlackListPanelCache(panelId));
      } catch (error) {
        if (error.message === "slack_panel_sync_cooldown") {
          sync.push({ panelId, skipped: true, reason: error.message });
          continue;
        }
        throw error;
      }
    }
    return sendJson(res, 200, { ok: true, sync });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "slack_list_cron_failed",
      details: error.details || undefined
    });
  }
}
