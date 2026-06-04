import { sendJson } from "../lib/http.js";

const REQUIRED = [
  "JIRA_BASE_URL",
  "JIRA_EMAIL",
  "JIRA_API_TOKEN",
  "JIRA_PROJECT_KEY",
  "JIRA_ISSUE_TYPE"
];

const OPTIONAL = [
  "JIRA_REPORTER_ACCOUNT_ID",
  "JIRA_DEFAULT_ASSIGNEE_ACCOUNT_ID",
  "JIRA_DEFAULT_TEAM_ID",
  "JIRA_DEFAULT_TEAM_NAME",
  "JIRA_DEFAULT_LABELS",
  "KV_REST_API_URL",
  "KV_REST_API_TOKEN",
  "SUPPORT_SESSION_SECRET",
  "SUPPORT_ENCRYPTION_KEY",
  "SLACK_BOT_TOKEN",
  "SLACK_CHANNEL_ID",
  "SLACK_LIST_ID",
  "SLACK_LIST_COLUMNS_JSON",
  "SLACK_LIST_COLUMN_TYPES_JSON",
  "SLACK_ROUTES_JSON",
  "SUPPORT_REMOTE_CONFIG_JSON",
  "SUPPORT_ADMIN_EMAILS",
  "OPENAI_API_KEY",
  "OPENAI_MODEL",
  "OPENAI_FALLBACK_MODEL",
  "OPENAI_MAX_OUTPUT_TOKENS",
  "OPENAI_REASONING_EFFORT",
  "OPENAI_VECTOR_STORE_ID",
  "LIVECHAT_BASIC_TOKEN",
  "INTERNAL_API_KEY"
];

export default function handler(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  const status = REQUIRED.reduce((acc, name) => {
    acc[name] = Boolean(String(process.env[name] || "").trim());
    return acc;
  }, {});

  const missing = REQUIRED.filter((name) => !status[name]);
  const optional = OPTIONAL.reduce((acc, name) => {
    acc[name] = Boolean(String(process.env[name] || "").trim());
    return acc;
  }, {});

  return sendJson(res, 200, {
    ok: missing.length === 0,
    ready: missing.length === 0,
    missing,
    configured: status,
    optional,
    unauthenticatedWidgetEnabled:
      String(process.env.ALLOW_UNAUTHENTICATED_WIDGET || "").toLowerCase() === "true"
  });
}
