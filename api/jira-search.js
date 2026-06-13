import { requireCurrentAccount } from "../lib/account-store.js";
import { addJiraIssueComment, searchDevWalletTickets, searchJiraTickets } from "../lib/jira.js";
import { getSlackListPanelItems } from "../lib/slack.js";
import { getSupportConfig } from "../lib/remote-config.js";
import { optionalEnv, readJson, requireWidgetAccess, sendJson } from "../lib/http.js";

export default async function handler(req, res) {
  if (!["GET", "POST"].includes(req.method)) {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  try {
    if (req.method === "GET" && String(req.query?.mode || "") === "devwallet") {
      requireDevWalletBridge(req);
      const tickets = await searchDevWalletTickets({ maxResults: req.query?.maxResults });
      return sendJson(res, 200, { ok: true, tickets });
    }
    if (req.method === "GET" && String(req.query?.mode || "") === "devwallet-slack") {
      requireDevWalletBridge(req);
      const emails = String(req.query?.emails || "")
        .split(",")
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 25);
      const matches = await searchDevWalletSlackPanels(emails);
      return sendJson(res, 200, { ok: true, matches });
    }

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

async function searchDevWalletSlackPanels(emails) {
  if (!emails.length) return [];
  const config = await getSupportConfig();
  const panels = (config.listPanels || [])
    .filter((panel) => panel.enabled !== false)
    .filter((panel) => /revision|retiro|transaccion|slack/i.test(`${panel.id} ${panel.label || ""}`));
  const selectedPanels = panels.length ? panels : (config.listPanels || []).filter((panel) => panel.enabled !== false);
  const matches = [];

  for (const email of emails) {
    for (const panel of selectedPanels) {
      const result = await getSlackListPanelItems(panel.id, { email, limit: 5 }).catch((error) => ({
        error: error.message || "slack_panel_failed",
        items: []
      }));
      for (const item of result.items || []) {
        if (!isDevWalletSlackItem(item)) continue;
        matches.push({
          email,
          panelId: panel.id,
          panelLabel: panel.label || panel.id,
          item
        });
      }
    }
  }
  return matches;
}

function isDevWalletSlackItem(item = {}) {
  return String(`${item.reviewTopic || ""} ${item.reviewTopicValue || ""} ${item.detail || ""}`)
    .trim()
    .toLowerCase()
    .includes("devwallet");
}

function requireDevWalletBridge(req) {
  const expected = optionalEnv("DEVWALLET_BRIDGE_TOKEN");
  const received = String(req.headers["x-devwallet-token"] || "").trim();
  if (!expected || !received || expected !== received) {
    const error = new Error("devwallet_bridge_unauthorized");
    error.statusCode = expected ? 401 : 503;
    throw error;
  }
}
