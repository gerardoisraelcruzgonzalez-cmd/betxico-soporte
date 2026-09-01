import { optionalEnv, requiredEnv } from "./http.js";

const SUPPORT_USERS = [
  { name: "Blanca Azucena Gutierrez Hernandez", accountId: "712020:dff65510-256b-49e7-9e7f-9dea32717596" },
  { name: "Azucena Rodriguez", accountId: "712020:316b09c7-6a78-4968-a914-a9326f919548" },
  { name: "Patricio Maldonado", accountId: "712020:06aaebbd-4864-447a-904e-1ef39e2b80a3" },
  { name: "Ivonne Cruz Rodríguez", accountId: "712020:775830ac-56f4-4eef-8374-b8f60e037b49" },
  { name: "anahy.haro", accountId: "712020:a0083027-2e98-439c-ad08-631afb25421a" },
  { name: "adriana.lobato", accountId: "712020:c3c9b5ad-cd16-41ad-a737-f901739ff56d" },
  { name: "gerardo.cruz", accountId: "712020:c330b151-8b29-4676-a5cc-8165abcae0a1" },
  { name: "patricio.garza", accountId: "712020:f119b6ea-bc3c-4f3b-98f2-9de54d998a4e" },
  { name: "Montserrat Quirarte", accountId: "712020:dd5dfea4-7c8c-4c99-a72a-f24fde300c76" },
  { name: "Valeria Garza Salazar", accountId: "712020:92b1e269-febe-4fb7-a422-14e86620eb5e" },
  { name: "luis.salazar", accountId: "712020:1f4047d0-6dfc-4313-bac9-6703a04e4fe9" },
  { name: "Pedro Salazar Arreozola", accountId: "712020:15303948-edb0-4ec3-9b3a-8181c1a2d436" },
  { name: "Miriam Vazquez", accountId: "712020:b6f6cc6b-7158-424f-a7e1-c5726e720272" },
  { name: "Admin Betxico", accountId: "712020:a17f5dc0-c7c2-4ea6-a782-3167cc03e376" }
];

export async function createJiraIssue(report) {
  const accountSettings = report.accountSettings || {};
  const { baseUrl, projectKey } = getJiraConfig(accountSettings);
  const issueType = report.ticket.issueTypeId
    ? { id: report.ticket.issueTypeId }
    : { name: report.ticket.issueType || optionalEnv("JIRA_ISSUE_TYPE", "Servicio al Cliente") };

  const fields = {
    project: { key: projectKey },
    issuetype: issueType,
    summary: report.ticket.summary,
    description: toAtlassianDoc(report.ticket.description || buildDescriptionText(report)),
    labels: normalizeLabels(report.ticket.labels)
  };

  const reporterAccountId =
    accountSettings.reporterAccountId || optionalEnv("JIRA_REPORTER_ACCOUNT_ID") || (await getJiraCurrentUserAccountId(accountSettings));
  if (reporterAccountId) {
    fields.reporter = { accountId: reporterAccountId };
  }

  const assigneeAccountId = await resolveDefaultAssigneeAccountId(accountSettings);
  if (assigneeAccountId) {
    fields.assignee = { accountId: assigneeAccountId };
  }

  const defaultTeamId = optionalEnv("JIRA_DEFAULT_TEAM_ID");
  if (defaultTeamId && !fields.customfield_10001) {
    fields.customfield_10001 = defaultTeamId;
  }

  if (report.ticket.amplifyUrl) {
    fields[getKycUrlFieldId()] = report.ticket.amplifyUrl;
  }

  Object.assign(fields, buildJiraFields(report));

  const response = await jiraFetch("/rest/api/3/issue", {
    method: "POST",
    body: JSON.stringify({ fields })
  }, accountSettings);

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error("jira_create_failed");
    error.statusCode = response.status;
    error.details = data;
    throw error;
  }

  return {
    key: data.key,
    id: data.id,
    url: data.key ? `${baseUrl}/browse/${data.key}` : "",
    attachments: data.key ? await attachJiraIssueAttachments(data.key, report.attachments || [], accountSettings) : []
  };
}

export async function getJiraIssueTypes() {
  const { projectKey } = getJiraConfig();
  const data = await jiraFetchJson(`/rest/api/3/issue/createmeta/${encodeURIComponent(projectKey)}/issuetypes`);

  return (data.issueTypes || [])
    .filter((issueType) => !issueType.subtask)
    .map((issueType) => ({
      id: issueType.id,
      name: issueType.name,
      description: issueType.description || ""
    }));
}

export async function getJiraIssueTypeFields(issueTypeId) {
  const { projectKey } = getJiraConfig();
  const data = await jiraFetchJson(
    `/rest/api/3/issue/createmeta/${encodeURIComponent(projectKey)}/issuetypes/${encodeURIComponent(issueTypeId)}`
  );

  const fields = (data.fields || [])
    .map(normalizeJiraField)
    .filter((field) => field.supported || field.required);

  return {
    issueType: data.issueType
      ? { id: data.issueType.id, name: data.issueType.name }
      : { id: issueTypeId, name: "" },
    defaults: await getJiraDefaults(),
    fields
  };
}

export async function searchJiraTickets(query, accountSettings = {}) {
  const { baseUrl, projectKey } = getJiraConfig(accountSettings);
  const cleanQuery = String(query || "").trim().slice(0, 120);
  if (!cleanQuery) {
    return [];
  }

  const jql = `project = ${projectKey} AND text ~ "${escapeJqlText(cleanQuery)}" ORDER BY updated DESC`;
  const fields = [
    "summary",
    "status",
    "labels",
    "priority",
    "reporter",
    "assignee",
    "created",
    "updated",
    "description",
    "comment",
    "customfield_10070",
    "customfield_10071",
    "customfield_10072",
    "customfield_10073"
  ].join(",");

  const data = await jiraFetchJson(
    `/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=8&fields=${encodeURIComponent(fields)}`,
    accountSettings
  );

  return (data.issues || []).map((issue) => {
    const fields = issue.fields || {};
    const ticket = {
      key: issue.key || "",
      id: issue.id || "",
      url: issue.key ? `${baseUrl}/browse/${issue.key}` : "",
      summary: fields.summary || "",
      status: fields.status?.name || "",
      labels: Array.isArray(fields.labels) ? fields.labels : [],
      priority: fields.priority?.name || "",
      reporter: fields.reporter?.displayName || "",
      assignee: fields.assignee?.displayName || "",
      created: fields.created || "",
      updated: fields.updated || "",
      description: normalizeJiraText(fields.description),
      comments: normalizeJiraComments(fields.comment),
      commentsTotal: Number(fields.comment?.total || 0),
      customer: {
        name: normalizeJiraSearchValue(fields.customfield_10073),
        email: normalizeJiraSearchValue(fields.customfield_10071),
        authId: normalizeJiraSearchValue(fields.customfield_10072),
        kycUrl: normalizeJiraSearchValue(fields.customfield_10070)
      }
    };
    return { ...ticket, devwallet: inferDevWalletStatus(ticket) };
  });
}

export async function searchDevWalletTickets({ maxResults = 50 } = {}) {
  const { baseUrl, projectKey } = getJiraConfig();
  const limit = Math.min(Math.max(Number(maxResults || 50), 1), 100);
  const jql = `project = ${projectKey} AND statusCategory != Done AND (summary ~ "Devolución Wallet" OR summary ~ "DEVOLUCION WALLET" OR labels = devolucion_wallet) ORDER BY updated ASC`;
  const fields = [
    "summary",
    "status",
    "labels",
    "created",
    "updated",
    "comment",
    "customfield_10071",
    "customfield_10072"
  ].join(",");

  const data = await jiraFetchJson(
    `/rest/api/3/search/jql?jql=${encodeURIComponent(jql)}&maxResults=${limit}&fields=${encodeURIComponent(fields)}`
  );

  return (data.issues || []).map((issue) => {
    const fields = issue.fields || {};
    const comments = normalizeJiraComments(fields.comment);
    const ticket = {
      key: issue.key || "",
      id: issue.id || "",
      url: issue.key ? `${baseUrl}/browse/${issue.key}` : "",
      summary: fields.summary || "",
      status: fields.status?.name || "",
      labels: Array.isArray(fields.labels) ? fields.labels : [],
      created: fields.created || "",
      updated: fields.updated || "",
      comments: comments.map((comment) => comment.body).filter(Boolean),
      commentsTotal: Number(fields.comment?.total || 0),
      identity: {
        email: normalizeJiraSearchValue(fields.customfield_10071).toLowerCase(),
        authId: normalizeJiraSearchValue(fields.customfield_10072),
        userId: ""
      }
    };
    return { ...ticket, devwallet: inferDevWalletStatus({ ...ticket, comments }) };
  });
}

export async function addJiraIssueComment(issueKey, commentBody, accountSettings = {}) {
  const key = String(issueKey || "").trim().toUpperCase();
  const body = String(commentBody || "").trim();
  if (!key || !body) {
    const error = new Error("invalid_jira_comment");
    error.statusCode = 400;
    throw error;
  }

  const response = await jiraFetch(`/rest/api/3/issue/${encodeURIComponent(key)}/comment`, {
    method: "POST",
    body: JSON.stringify({ body: toAtlassianDoc(body) })
  }, accountSettings);

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error("jira_comment_failed");
    error.statusCode = response.status;
    error.details = data;
    throw error;
  }

  return {
    id: data.id || "",
    author: data.author?.displayName || "",
    created: data.created || "",
    body: normalizeJiraText(data.body) || body
  };
}

export async function verifyJiraIssueComment(issueKey, commentId, expectedBody = "", accountSettings = {}) {
  const key = String(issueKey || "").trim().toUpperCase();
  const id = String(commentId || "").trim();
  const body = normalizeComparableText(expectedBody);
  if (!key || !id || !body) return false;

  const response = await jiraFetch(
    `/rest/api/3/issue/${encodeURIComponent(key)}/comment/${encodeURIComponent(id)}`,
    {},
    accountSettings
  );
  if (response.status === 404) return false;
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error("jira_comment_verification_failed");
    error.statusCode = response.status;
    throw error;
  }
  return String(data.id || "") === id
    && normalizeComparableText(normalizeJiraText(data.body)) === body;
}

export async function findJiraIssueComment({
  issueKey,
  body,
  since,
  accountSettings = {}
} = {}) {
  const key = String(issueKey || "").trim().toUpperCase();
  const expectedBody = normalizeComparableText(body);
  const sinceMs = parseTimestamp(since);
  if (!key || !expectedBody || !sinceMs) return null;

  const response = await jiraFetch(
    `/rest/api/3/issue/${encodeURIComponent(key)}/comment?orderBy=-created&maxResults=20`,
    {},
    accountSettings
  );
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error("jira_comment_reconciliation_failed");
    error.statusCode = response.status;
    throw error;
  }

  const lowerBoundMs = sinceMs - 60_000;
  const comments = Array.isArray(data.comments) ? data.comments : [];
  const match = comments.find((comment) => {
    const createdMs = parseTimestamp(comment?.created);
    return createdMs >= lowerBoundMs
      && normalizeComparableText(normalizeJiraText(comment?.body)) === expectedBody;
  });

  return match?.id ? { id: String(match.id) } : null;
}

function buildDescriptionText(report) {
  const lines = [
    `Tipo de incidencia: ${report.ticket.issueType || "Servicio al Cliente"}`,
    `Prioridad: ${report.ticket.priority || "Media"}`,
    "",
    `Cliente: ${report.customer.name || "Sin nombre"}`,
    `Correo: ${report.customer.email || "Sin correo"}`,
    `AUTH ID: ${report.customer.authId || "Sin AUTH ID"}`,
    `KYC URL: ${report.ticket.amplifyUrl || "Sin URL"}`,
    `Team solicitado: ${optionalEnv("JIRA_DEFAULT_TEAM_NAME", "Betxico - Servicio al Cliente")}`,
    `LiveChat customer ID: ${report.livechat.customerId || "Sin customer ID"}`,
    "",
    "Descripcion:",
    report.ticket.description || report.ticket.notes || "Sin descripcion"
  ];

  return lines.join("\n");
}

function toAtlassianDoc(value) {
  const lines = String(value || "").split(/\r?\n/);
  return {
    type: "doc",
    version: 1,
    content: lines.map((line) => ({
      type: "paragraph",
      content: line ? [{ type: "text", text: line }] : []
    }))
  };
}

function buildJiraFields(report) {
  const fields = {};
  for (const [fieldId, field] of Object.entries(report.jiraFields || {})) {
    if (!fieldId || isReservedField(fieldId) || ["summary", "description", "attachment"].includes(fieldId)) {
      continue;
    }

    const value = normalizeJiraValue(field.value, field.schema);
    const resolvedFieldId = shouldRemapLegacyKycUrlField(fieldId, field)
      ? getKycUrlFieldId()
      : fieldId;
    if (value !== undefined) {
      fields[resolvedFieldId] = value;
    }
  }

  const rawMap = optionalEnv("JIRA_FIELD_MAP_JSON", "{}");
  let fieldMap = {};

  try {
    fieldMap = JSON.parse(rawMap);
  } catch {
    return {};
  }

  const values = {
    customerName: report.customer.name,
    customerEmail: report.customer.email,
    authId: report.customer.authId,
    amplifyUrl: report.ticket.amplifyUrl,
    livechatChatId: report.livechat.chatId,
    priority: report.ticket.priority
  };

  for (const [key, fieldId] of Object.entries(fieldMap)) {
    if (fieldId && values[key] && !fields[fieldId]) {
      fields[fieldId] = values[key];
    }
  }

  return fields;
}

function getKycUrlFieldId() {
  return String(optionalEnv("JIRA_KYC_URL_FIELD_ID", "customfield_10070")).trim() || "customfield_10070";
}

function shouldRemapLegacyKycUrlField(fieldId, field = {}) {
  if (fieldId !== "customfield_10070") return false;
  const name = String(field?.name || "").trim().toLowerCase();
  return !name || /(?:kyc|amplify)\s*url/.test(name);
}

function normalizeJiraField(field) {
  const schema = field.schema || {};
  const fieldId = field.fieldId || field.key || "";
  const supported = isSupportedField(fieldId, schema);

  return {
    id: fieldId,
    name: field.name,
    required: Boolean(field.required),
    supported,
    type: getInputType(fieldId, schema),
    schema: {
      type: schema.type || "",
      items: schema.items || "",
      system: schema.system || "",
      custom: schema.custom || ""
    },
    allowedValues: (field.allowedValues || []).map((value) => ({
      id: value.id || "",
      name: value.name || value.value || value.key || value.id || ""
    }))
  };
}

function isSupportedField(fieldId, schema) {
  if (["summary", "description", "labels", "priority", "assignee", "reporter"].includes(fieldId)) {
    return true;
  }

  if (["project", "issuetype", "attachment", "parent"].includes(fieldId)) {
    return false;
  }

  if (schema.type === "string" || schema.type === "date" || schema.type === "user" || schema.type === "team") {
    return true;
  }

  return schema.type === "array" && schema.items === "string";
}

function getInputType(fieldId, schema) {
  if (fieldId === "description") return "textarea";
  if (fieldId === "labels") return "labels";
  if (fieldId === "priority") return "select";
  if (schema.type === "user") return "user";
  if (schema.type === "team") return "team";
  if (schema.type === "date") return "date";
  if (schema.custom?.includes("url")) return "url";
  return "text";
}

function normalizeJiraValue(value, schema = {}) {
  const raw = String(value || "").trim();
  if (!raw) return undefined;

  if (schema.type === "array" && schema.items === "string") {
    return normalizeLabels(raw);
  }

  if (schema.type === "priority") {
    return { name: raw };
  }

  if (schema.type === "user") {
    return { accountId: raw };
  }

  if (schema.type === "team") {
    if (!looksLikeJiraTeamId(raw)) {
      return undefined;
    }
    return raw;
  }

  return raw;
}

function normalizeLabels(value) {
  const labels = Array.isArray(value)
    ? value
    : String(value || "")
        .split(/[,\s]+/)
        .filter(Boolean);

  const normalized = labels
    .map((label) => String(label).trim().replace(/[^A-Za-z0-9_-]/g, "-"))
    .filter(Boolean);

  return [...new Set(["livechat", "soporte", ...normalized])];
}

function isReservedField(fieldId) {
  return ["project", "issuetype", "attachment", "parent"].includes(fieldId);
}

async function getJiraDefaults() {
  const reporterAccountId = optionalEnv("JIRA_REPORTER_ACCOUNT_ID") || (await getJiraCurrentUserAccountId());
  const assigneeAccountId = await resolveDefaultAssigneeAccountId();

  return {
    reporterAccountId,
    reporterName: optionalEnv("JIRA_REPORTER_NAME") || optionalEnv("JIRA_EMAIL").split("@")[0],
    assigneeAccountId,
    assigneeName: optionalEnv("JIRA_DEFAULT_ASSIGNEE_NAME", "Ivonne Cruz Rodriguez"),
    teamId: optionalEnv("JIRA_DEFAULT_TEAM_ID"),
    teamName: optionalEnv("JIRA_DEFAULT_TEAM_NAME", "Betxico - Servicio al Cliente"),
    labels: optionalEnv("JIRA_DEFAULT_LABELS", "livechat soporte"),
    supportUsers: SUPPORT_USERS
  };
}

async function getJiraCurrentUserAccountId(accountSettings = {}) {
  const data = await jiraFetchJson("/rest/api/3/myself", accountSettings).catch(() => null);
  return data?.accountId || "";
}

async function resolveDefaultAssigneeAccountId(accountSettings = {}) {
  const configured = accountSettings.defaultAssigneeAccountId || optionalEnv("JIRA_DEFAULT_ASSIGNEE_ACCOUNT_ID");
  if (configured) return configured;

  const name = optionalEnv("JIRA_DEFAULT_ASSIGNEE_NAME", "Ivonne Cruz Rodríguez");
  const projectKey = optionalEnv("JIRA_PROJECT_KEY");
  const result = await jiraFetchJson(
    `/rest/api/3/user/assignable/search?project=${encodeURIComponent(projectKey)}&query=${encodeURIComponent(name)}&maxResults=10`
  , accountSettings).catch(() => []);

  const normalizedName = normalizeSearchText(name);
  const matched = (Array.isArray(result) ? result : []).find((user) => {
    return normalizeSearchText(user.displayName || "") === normalizedName;
  }) || (Array.isArray(result) ? result[0] : null);

  return matched?.accountId || "";
}

async function attachJiraIssueAttachments(issueKey, attachments, accountSettings = {}) {
  const safeAttachments = Array.isArray(attachments) ? attachments.filter(Boolean).slice(0, 6) : [];
  const uploaded = [];

  for (const attachment of safeAttachments) {
    const filename = sanitizeFilename(attachment.filename || attachment.name || "adjunto");
    const contentType = String(attachment.contentType || attachment.type || "application/octet-stream").trim();
    const dataBase64 = String(attachment.dataBase64 || "").trim();
    if (!dataBase64) continue;

    const bytes = Buffer.from(dataBase64, "base64");
    const formData = new FormData();
    formData.append("file", new Blob([bytes], { type: contentType }), filename);

    const response = await jiraFetch(`/rest/api/3/issue/${encodeURIComponent(issueKey)}/attachments`, {
      method: "POST",
      headers: {
        "X-Atlassian-Token": "no-check"
      },
      body: formData
    }, accountSettings);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error("jira_attachment_failed");
      error.statusCode = response.status;
      error.details = data;
      throw error;
    }
    uploaded.push(...(Array.isArray(data) ? data : [data]));
  }

  return uploaded.map((item) => ({
    id: item.id || "",
    filename: item.filename || "",
    size: item.size || 0
  }));
}

function sanitizeFilename(value) {
  const clean = String(value || "adjunto")
    .trim()
    .replace(/[^\w.\-() ]+/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 120);
  return clean || "adjunto";
}

function looksLikeJiraTeamId(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(value || "").trim()
  );
}

function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function escapeJqlText(value) {
  return String(value || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function normalizeJiraSearchValue(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (Array.isArray(value)) return value.map(normalizeJiraSearchValue).filter(Boolean).join(", ");
  if (typeof value === "object") return String(value.value || value.name || value.displayName || "").trim();
  return "";
}

function inferDevWalletStatus(ticket = {}) {
  const labels = Array.isArray(ticket.labels) ? ticket.labels.map(normalizeSearchText) : [];
  const searchable = [
    ticket.summary,
    ticket.description,
    ...(ticket.comments || []).map((comment) => typeof comment === "string" ? comment : comment.body)
  ].filter(Boolean).join("\n");
  const normalized = normalizeSearchText(searchable);
  const isDevWallet = /\bdevwallet\b|\bdevolucion wallet\b|\bdevolucion de wallet\b|\bwallet\b/.test(normalized)
    || labels.includes("devolucion_wallet");
  if (!isDevWallet) return null;

  const matches = [
    {
      intent: "devwallet1",
      label: "DEVWALLET1",
      description: "Misma cuenta o mismo titular. Solicitar aprobación por única ocasión.",
      score: scorePatterns(normalized, [
        /\b#?devwallet\s*1\b/,
        /\bcaso 2\b/,
        /\bmisma cuenta\b/,
        /\bmismo titular\b/,
        /\bclabe(?:s)? coinciden\b/,
        /\bcoinciden las clabes\b/,
        /\bmismo nombre ambas\b/,
        /\bambas del propietario\b/,
        /\baprobacion por unica ocasion\b/
      ])
    },
    {
      intent: "devwallet2",
      label: "DEVWALLET2",
      description: "Cuenta o titular diferente. Devolución a cuenta origen y retiro manual.",
      score: scorePatterns(normalized, [
        /\b#?devwallet\s*2\b/,
        /\bcaso 1\b/,
        /\bcuentas? (?:y )?titulares? diferentes?\b/,
        /\btitular(?:es)? diferentes?\b/,
        /\bcuenta origen\b/,
        /\bdevolucion a cuenta origen\b/,
        /\bretiro manual\b/,
        /\btercero\b/,
        /\botra cuenta clabe\b/,
        /\bcuenta de otro casino\b/
      ])
    },
    {
      intent: "devwallet3",
      label: "DEVWALLET3",
      description: "CLABEs diferentes sin beneficiario confiable. Pedir prueba bancaria.",
      score: scorePatterns(normalized, [
        /\b#?devwallet\s*3\b/,
        /\bcaso 3\b/,
        /\bbeneficiario no disponible\b/,
        /\bsin beneficiario\b/,
        /\bprueba bancaria\b/,
        /\bbeneficiario no confirmado\b/,
        /\bcuentas? diferentes? sin beneficiario\b/
      ])
    }
  ].sort((a, b) => b.score - a.score);

  if (!matches[0]?.score) {
    return {
      intent: "",
      label: "Pendiente de clasificar",
      description: "Ticket de Devolución Wallet sin clasificación clara en comentarios.",
      confidence: "low",
      source: "jira"
    };
  }

  return {
    intent: matches[0].intent,
    label: matches[0].label,
    description: matches[0].description,
    confidence: matches[0].score >= 2 ? "high" : "medium",
    source: new RegExp(`#?${matches[0].intent.replace("wallet", "wallet\\\\s*")}`).test(normalized) ? "jira_template" : "jira_comments"
  };
}

function scorePatterns(value, patterns) {
  return patterns.reduce((score, pattern) => score + (pattern.test(value) ? 1 : 0), 0);
}

function normalizeJiraComments(commentField) {
  const comments = Array.isArray(commentField?.comments) ? commentField.comments : [];
  return comments
    .slice(-8)
    .reverse()
    .map((comment) => ({
      author: comment.author?.displayName || "",
      created: comment.created || "",
      body: normalizeJiraText(comment.body)
    }))
    .filter((comment) => comment.body);
}

function normalizeJiraText(value) {
  if (value == null) return "";
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map(normalizeJiraText).filter(Boolean).join("\n");
  if (typeof value !== "object") return String(value).trim();

  if (value.type === "text") return String(value.text || "");
  if (value.type === "hardBreak") return "\n";

  const content = Array.isArray(value.content) ? value.content.map(normalizeJiraText).join("") : "";
  if (["paragraph", "heading", "blockquote", "listItem", "bulletList", "orderedList"].includes(value.type)) {
    return `${content}\n`;
  }
  return content.trim();
}

function normalizeComparableText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function parseTimestamp(value) {
  const timestamp = Date.parse(String(value || ""));
  return Number.isFinite(timestamp) ? timestamp : 0;
}

async function jiraFetchJson(path, accountSettings = {}) {
  const response = await jiraFetch(path, {}, accountSettings);
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error("jira_metadata_failed");
    error.statusCode = response.status;
    error.details = data;
    throw error;
  }
  return data;
}

async function jiraFetch(path, options = {}, accountSettings = {}) {
  const { baseUrl, email, apiToken } = getJiraConfig(accountSettings);
  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  return fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      authorization: `Basic ${Buffer.from(`${email}:${apiToken}`).toString("base64")}`,
      accept: "application/json",
      ...(isFormData ? {} : { "content-type": "application/json" }),
      ...(options.headers || {})
    }
  });
}

function getJiraConfig(accountSettings = {}) {
  const baseUrl = (accountSettings.jiraBaseUrl || optionalEnv("JIRA_BASE_URL")).replace(/\/+$/, "");
  const email = accountSettings.jiraEmail || optionalEnv("JIRA_EMAIL");
  const apiToken = accountSettings.jiraApiToken || optionalEnv("JIRA_API_TOKEN");
  const projectKey = optionalEnv("JIRA_PROJECT_KEY");

  if (!baseUrl || !email || !apiToken || !projectKey) {
    const error = new Error("missing_jira_config");
    error.statusCode = 500;
    throw error;
  }

  return { baseUrl, email, apiToken, projectKey };
}
