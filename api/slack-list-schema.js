import { sendJson, requireWidgetAccess } from "../lib/http.js";
import { getSlackListPanelItems, getSlackListSchema } from "../lib/slack.js";
import { requireCurrentAccount } from "../lib/account-store.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  try {
    requireWidgetAccess(req);
    await requireCurrentAccount(req);
    const requestUrl = new URL(req.url, "http://localhost");
    const mode = requestUrl.searchParams.get("mode") || "";
    const panelId = requestUrl.searchParams.get("panel") || "";
    if (mode === "items" || panelId) {
      const panelItems = await getSlackListPanelItems(panelId, {
        email: requestUrl.searchParams.get("email") || "",
        query: requestUrl.searchParams.get("query") || "",
        limit: requestUrl.searchParams.get("limit") || ""
      });
      return sendJson(res, 200, { ok: true, ...panelItems });
    }

    const listId = requestUrl.searchParams.get("listId") || "";
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
