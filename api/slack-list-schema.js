import { readJson, sendJson, requireWidgetAccess } from "../lib/http.js";
import { requireSlackListReadsEnabled, requireSlackListSyncEnabled } from "../lib/integration-policy.js";
import { getSlackListPanelItems, getSlackListSchema, syncSlackListPanelCache } from "../lib/slack.js";
import { requireCurrentAccount } from "../lib/account-store.js";
import {
  SUPPORT_SLACK_LIST_ID,
  SUPPORT_SLACK_PANEL_ID,
  SUPPORT_SLACK_HISTORICAL_PANEL_ID,
  isSupportAdmin
} from "../lib/remote-config.js";

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  try {
    requireWidgetAccess(req);
    const account = await requireCurrentAccount(req);
    if (req.method === "POST") {
      requireSlackListSyncEnabled();
      if (!(await isSupportAdmin(account.email))) {
        return sendJson(res, 403, { ok: false, error: "admin_not_authorized" });
      }
      const payload = await readJson(req);
      const panelId = requireRevisionPanel(payload.panelId || payload.panel);
      const sync = await syncSlackListPanelCache(panelId, { accountEmail: account.email });
      return sendJson(res, 200, { ok: true, sync });
    }

    requireSlackListReadsEnabled();
    const requestUrl = new URL(req.url, "http://localhost");
    const mode = requestUrl.searchParams.get("mode") || "";
    const requestedPanelId = requestUrl.searchParams.get("panel") || "";
    if (mode === "items" || requestedPanelId) {
      const panelId = requireRevisionPanel(requestedPanelId);
      const panelItems = await getSlackListPanelItems(panelId, {
        email: requestUrl.searchParams.get("email") || "",
        query: requestUrl.searchParams.get("query") || "",
        limit: requestUrl.searchParams.get("limit") || ""
      });
      return sendJson(res, 200, { ok: true, ...panelItems });
    }

    const requestedListId = requestUrl.searchParams.get("listId") || SUPPORT_SLACK_LIST_ID;
    if (requestedListId !== SUPPORT_SLACK_LIST_ID) {
      return sendJson(res, 400, { ok: false, error: "slack_list_not_allowed" });
    }
    const listId = SUPPORT_SLACK_LIST_ID;
    const schema = await getSlackListSchema(listId);
    return sendJson(res, 200, { ok: true, ...schema });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "slack_schema_failed",
      details: error.details || undefined
    });
  }
}

function requireRevisionPanel(value) {
  const panelId = String(value || SUPPORT_SLACK_PANEL_ID).trim();
  if (![SUPPORT_SLACK_PANEL_ID, SUPPORT_SLACK_HISTORICAL_PANEL_ID].includes(panelId)) {
    const error = new Error("slack_panel_not_allowed");
    error.statusCode = 400;
    throw error;
  }
  return panelId;
}
