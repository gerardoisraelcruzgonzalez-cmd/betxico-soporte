import { requireCurrentAccount } from "../lib/account-store.js";
import { addJiraIssueComment, searchJiraTickets } from "../lib/jira.js";
import { readJson, requireWidgetAccess, sendJson } from "../lib/http.js";

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  try {
    requireWidgetAccess(req);
    const account = await requireCurrentAccount(req);
    if (req.method === "POST") {
      const payload = await readJson(req);
      const issueKey = String(payload.issueKey || "").trim();
      const body = String(payload.body || "").trim();
      const comment = await addJiraIssueComment(issueKey, body, account);

      return sendJson(res, 200, { ok: true, comment });
    }

    const query = String(req.query?.query || "").trim();
    if (!query) {
      return sendJson(res, 200, { ok: true, tickets: [] });
    }

    const tickets = await searchJiraTickets(query);
    return sendJson(res, 200, { ok: true, tickets });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message === "jira_metadata_failed" ? "jira_search_failed" : error.message || (req.method === "POST" ? "jira_comment_failed" : "jira_search_failed"),
      details: error.details || undefined
    });
  }
}
