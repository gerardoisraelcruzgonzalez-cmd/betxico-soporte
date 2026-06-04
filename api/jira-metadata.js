import { getJiraIssueTypes, getJiraIssueTypeFields } from "../lib/jira.js";
import { sendJson, requireWidgetAccess } from "../lib/http.js";
import { requireCurrentAccount } from "../lib/account-store.js";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  try {
    requireWidgetAccess(req);
    await requireCurrentAccount(req);

    const issueTypeId = String(req.query?.issueTypeId || "").trim();
    if (issueTypeId) {
      const meta = await getJiraIssueTypeFields(issueTypeId);
      return sendJson(res, 200, { ok: true, ...meta });
    }

    const issueTypes = await getJiraIssueTypes();
    return sendJson(res, 200, { ok: true, issueTypes });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "jira_metadata_failed",
      details: error.details || undefined
    });
  }
}
