import { createJiraIssue, searchJiraTickets } from "./jira.js";

const PROVIDERS = [
  ["PG SOFT GAMING", /\b(?:PG\s*SOFT|POCKET\s*GAMES)\b/i],
  ["PRAGMATIC PLAY", /\bPRAGMATIC\b/i],
  ["PLAYTECH", /\bPLAYTECH\b/i],
  ["EVOLUTION", /\bEVOLUTION\b/i],
  ["VIBRA GAMING", /\bVIBRA\b/i],
  ["NETENT", /\bNETENT\b/i],
  ["RED TIGER", /\bRED\s*TIGER\b/i],
  ["HABANERO", /\bHABANERO\b/i],
  ["AMATIC", /\bAMATIC\b/i]
];
const BOB_AMPLIFY_URL = "https://backoffice-kyc.paybridge.com.mx/dashboard/";

export async function createBobClosureJiraTicket({ job, account, dependencies = {} }) {
  if (!account?.configured || !account.jiraEmail || !account.jiraApiToken) {
    throw new Error("bob_jira_agent_not_configured");
  }
  if (!String(job?.customer?.name || "").trim() || !String(job?.customer?.email || "").trim()) {
    throw new Error("bob_jira_customer_data_required");
  }
  const searchIssues = dependencies.searchIssues || searchJiraTickets;
  const createIssue = dependencies.createIssue || createJiraIssue;
  const reference = bobClosureReference(job?.id);
  const existing = await searchIssues(reference, account);
  const match = (Array.isArray(existing) ? existing : []).find((issue) => {
    return String(issue?.description || "").includes(reference)
      || (Array.isArray(issue?.labels) && issue.labels.includes(bobClosureLabel(job?.id)));
  });
  if (match?.key) {
    return { status: "created", reused: true, key: match.key, id: match.id || "", url: match.url || "" };
  }

  const report = buildBobClosureJiraReport({ job, account });
  const created = await createIssue(report);
  return { status: "created", reused: false, key: created.key || "", id: created.id || "", url: created.url || "" };
}

export function buildBobClosureJiraReport({ job, account }) {
  const result = job?.result || {};
  const sessions = Array.isArray(result.closedSessions) ? result.closedSessions : [];
  const pending = Array.isArray(result.remainingSessions) ? result.remainingSessions : [];
  const pendingWins = result.pendingWins || {};
  const provider = providerLabel(sessions);
  const titleReference = clean(job?.reportedGame || "") || provider;
  const reference = bobClosureReference(job?.id);

  return {
    source: "bob_session_close",
    destination: "jira",
    workflow: { id: "cierre-sesiones-jira", label: "Cierre de sesiones - Jira" },
    livechat: { chatId: String(job?.chatId || ""), threadId: "", groupId: "", customerId: "", source: "bob" },
    customer: {
      name: String(job?.customer?.name || "").trim(),
      email: String(job?.customer?.email || "").trim().toLowerCase(),
      authId: String(job?.customerId || job?.customer?.authId || "")
    },
    ticket: {
      issueType: "Servicio al Cliente",
      priority: "Media",
      summary: `ID ${String(job?.customerId || "")}_CIERRE DE SESIONES_${titleReference}`.slice(0, 250),
      description: buildDescription({ job, account, sessions, pending, pendingWins, provider, reference }),
      category: "Servicio al Cliente",
      labels: ["cierre_sesiones", "bob", bobClosureLabel(job?.id)],
      amplifyUrl: BOB_AMPLIFY_URL,
      notes: ""
    },
    jiraFields: buildRequiredCustomerFields(job),
    slackFields: {},
    attachments: jiraEvidenceAttachments(result.jiraEvidence),
    accountSettings: account
  };
}

function jiraEvidenceAttachments(evidence) {
  return (Array.isArray(evidence) ? evidence : [])
    .filter((item) => item && String(item.dataBase64 || "").trim())
    .slice(0, 2)
    .map((item, index) => ({
      filename: String(item.filename || `bob-evidencia-${index + 1}.jpg`).slice(0, 120),
      contentType: String(item.contentType || "image/jpeg"),
      dataBase64: String(item.dataBase64)
    }));
}

function buildRequiredCustomerFields(job) {
  const customer = job?.customer || {};
  const schema = { type: "string" };
  return {
    customfield_10071: { name: "Email Cliente", value: String(customer.email || "").trim().toLowerCase(), schema },
    customfield_10073: { name: "Nombre Cliente", value: String(customer.name || "").trim(), schema },
    customfield_10072: { name: "AUTH ID", value: String(job?.customerId || customer.authId || "").trim(), schema },
    customfield_10070: { name: "Amplify URL", value: BOB_AMPLIFY_URL, schema },
    customfield_10015: { name: "Fecha de inicio", value: jiraDate(job?.createdAt || job?.completedAt), schema }
  };
}

export function bobClosureReference(jobId) {
  return `BOB-CIERRE-${String(jobId || "sin-referencia")}`;
}

export function bobClosureLabel(jobId) {
  return `bob_close_${String(jobId || "sin_referencia").replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 48)}`;
}

export function summarizeBobJiraError(error) {
  const status = Number(error?.statusCode || 0);
  const details = error?.details && typeof error.details === "object" ? error.details : {};
  const messages = [
    ...(Array.isArray(details.errorMessages) ? details.errorMessages : []),
    ...Object.entries(details.errors && typeof details.errors === "object" ? details.errors : {}).map(([field, message]) => `${field}: ${message}`)
  ].map(safeJiraErrorText).filter(Boolean);
  const suffix = messages.length ? `_${messages.join(" | ").slice(0, 130)}` : "";
  return `jira_create_failed${status ? `_${status}` : ""}${suffix}`.slice(0, 180);
}

function buildDescription({ job, account, sessions, pending, pendingWins, provider, reference }) {
  const foundWins = Array.isArray(pendingWins.foundBeforeClosure) ? pendingWins.foundBeforeClosure : [];
  const reportedGame = clean(job?.reportedGame || "") || "no especificado";
  return [
    `Cliente solicitó cierre de sesiones del juego ${reportedGame}`,
    `Referencia interna: ${reference}`,
    `Cerrado y verificado: ${formatDate(job?.completedAt || resultDate(job))}`,
    "",
    `Sesiones cerradas: ${sessions.length}`,
    sessionLines(sessions, "CERRADA"),
    "",
    `Pending Win detectado antes del cierre: ${foundWins.length}`,
    winLines(foundWins)
  ].filter((line) => line !== "").join("\n");
}

function resultDate(job) {
  return job?.result?.checkedAt || "";
}

function sessionLines(sessions, state) {
  if (!sessions.length) return "- Ninguna";
  return sessions.map((session) => {
    const pending = session?.pendingWin?.hasValue ? ` | Pending Win: ${clean(session.pendingWin.amount)}` : "";
    return `- ${state}: ${clean(session?.game || "Juego sin codigo")} | Sesion: ${clean(session?.sessionId || "Sin ID")} | Inicio: ${formatDate(session?.createdAt)} | Cierre: ${formatDate(session?.closedAt || session?.finalizedAt)}${pending}`;
  }).join("\n");
}

function winLines(wins) {
  if (!wins.length) return "- Ninguno";
  return wins.map((win) => `- ${clean(win?.game || "Juego sin codigo")} | Sesion: ${clean(win?.sessionId || "Sin ID")} | Monto: ${clean(win?.amount || "Reportado")}`).join("\n");
}

function providerLabel(sessions) {
  const providers = [...new Set(sessions.map(providerFromSession).filter(Boolean))];
  if (providers.length === 1) return providers[0];
  if (providers.length > 1) return "VARIOS PROVEEDORES";
  return "PROVEEDOR NO IDENTIFICADO";
}

function providerFromSession(session) {
  const direct = clean(session?.provider || session?.providerName || "");
  if (direct) return direct.toUpperCase();
  const game = clean(session?.game || "");
  return PROVIDERS.find(([, pattern]) => pattern.test(game))?.[0] || "";
}

function clean(value) {
  return String(value || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
}

function safeJiraErrorText(value) {
  return String(value || "")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[correo oculto]")
    .replace(/(?:bearer|token|password)\s+[^\s,;]+/gi, "[dato oculto]")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return clean(value) || "Sin fecha";
  return date.toLocaleString("es-MX", { timeZone: "America/Mexico_City", dateStyle: "short", timeStyle: "short" });
}

function jiraDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}
