import { optionalEnv } from "./http.js";

const CONFIG_KEY = "support:config";

const DEFAULT_TRANSACTION_LIST_COLUMNS = {
  email: "Col0B1W6936RZ",
  reviewTopic: "Col0B1M3UNA3H",
  amount: "Col0B2FE7QM1P",
  detail: "Col0B20FUMPT8",
  attachments: "Col0B265RE0E8",
  withdrawalClabe: "Col0B99EJPNUQ",
  authId: "Col0B1Z5RKD0V",
  assignedPerson: "Col01",
  approvalStatus: "Col0B1Z5RGAVB",
  jiraKey: "Col0B1M3V26NT",
  jiraUrl: "Col0B2FE84J73",
  validas: "Col0B20FV1UNA",
  noPasan: "Col0B265RLSSY",
  total: "Col0B2WRP3LTA",
  kycCompleto: "Col0B22HGSK8A",
  createdAt: "Col0B5T61A2GJ"
};

const DEFAULT_TRANSACTION_LIST_ID = "F0B1Z5R527P";

const DEFAULT_LIST_PANELS = [
  {
    id: "revision",
    label: "Lista completa",
    listId: DEFAULT_TRANSACTION_LIST_ID,
    columns: DEFAULT_TRANSACTION_LIST_COLUMNS,
    filter: {},
    limit: 8,
    readLimit: 1000,
    enabled: true
  }
];

const DEFAULT_REPORT_WORKFLOWS = [
  {
    id: "deposito-no-reflejado",
    label: "Deposito no reflejado",
    destination: "both",
    jiraIssueType: "Transacciones",
    slackRouteId: "deposito-no-reflejado",
    slackTemplate: "deposit",
    requiredSlackFields: ["agentName", "customerId", "customerEmail", "trackingKey", "amount"],
    enabled: true
  },
  {
    id: "cierre-sesiones",
    label: "Cierre de sesiones",
    destination: "slack",
    jiraIssueType: "",
    slackRouteId: "cierre-sesiones",
    slackTemplate: "session-close",
    requiredSlackFields: ["game", "customerId", "customerEmail"],
    enabled: true
  },
  {
    id: "cierre-sesiones-jira",
    label: "Cierre de sesiones - Jira",
    destination: "jira",
    jiraIssueType: "Servicio al Cliente",
    slackRouteId: "",
    slackTemplate: "",
    requiredSlackFields: [],
    enabled: true
  },
  {
    id: "jira",
    label: "Jira",
    destination: "jira",
    jiraIssueType: "",
    slackRouteId: "",
    slackTemplate: "",
    requiredSlackFields: [],
    enabled: true
  }
];

const DEFAULT_AI_ASSISTANT = {
  enabled: true,
  baseInstructions: [
    "Eres el asistente interno de soporte de Betxico para agentes humanos.",
    "Responde en espanol claro, directo y operativo.",
    "Ayuda a consultar dudas, redactar respuestas para clientes, resumir casos y ordenar pasos de seguimiento.",
    "No sustituyes al agente: das criterio operativo y texto listo para revisar/copiar.",
    "Antes de crear una respuesta, consulta la base de conocimiento operativa. No crees nuevos diagnosticos si el caso puede pertenecer a un intent universal existente. Usa subdiagnosticos y variantes para evitar duplicidad."
  ].join("\n"),
  businessContext: [
    "Betxico opera soporte de clientes con LiveChat, Jira y Slack.",
    "Los casos frecuentes incluyen depositos no reflejados, retiros, KYC/documentos, bonos, juegos, cierres de sesiones, cierres de cuenta y escalaciones.",
    "El asistente debe trabajar con trazabilidad: pedir datos completos, evitar promesas no aprobadas y sugerir escalacion cuando falte evidencia."
  ].join("\n"),
  toneRules: [
    "Usa tono empatico, profesional y breve.",
    "Cuando el agente pida una respuesta al cliente, entrega texto listo para copiar.",
    "Evita sonar generico; usa lenguaje operativo de soporte Betxico."
  ].join("\n"),
  safetyRules: [
    "No prometas abonos, retiros, bonos, desbloqueos, validaciones KYC ni cierres si el agente no confirma evidencia o aprobacion interna.",
    "No inventes datos de Jira, Slack, pagos, KYC, Banxico, bancos, juegos, saldos ni estados.",
    "Cuando falten datos, pide solo la informacion necesaria: correo, AUTH ID, monto, fecha, clave de rastreo, evidencia, juego, error o ticket."
  ].join("\n"),
  defaultResponseFormat: [
    "Si es respuesta al cliente: entrega solo el mensaje final para copiar.",
    "Si es analisis interno: usa pasos concretos y marca datos faltantes.",
    "Si hay riesgo operativo: indica que debe validarse internamente antes de prometer algo."
  ].join("\n"),
  vectorStoreId: "",
  maxExamples: 5,
  fileSearchMaxResults: 3
};

const DEFAULT_LIVECHAT_AUTOMATION = {
  enabled: true,
  safeTemplateMode: "suggest_only",
  autoWelcome: {
    enabled: true,
    onlyForAgents: ["gerardo.cruz@betxico.mx"],
    message: "Buenas noches, bienvenido a Betxico💚\n¿En que te puedo ayudar? 🙂‍↔️",
    oncePerChat: true
  }
};

const DEFAULT_TRACEABILITY = {
  enabled: true,
  deposits: [],
  updatedAt: ""
};

export async function getSupportConfig() {
  const remote = await kvGet(CONFIG_KEY).catch(() => null);
  return normalizeConfig(remote || parseJsonEnv("SUPPORT_REMOTE_CONFIG_JSON", {}));
}

export async function saveSupportConfig(config) {
  const normalized = normalizeConfig(config);
  await kvSet(CONFIG_KEY, normalized);
  return normalized;
}

export async function isSupportUserAuthorized(email) {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return false;

  const config = await getSupportConfig();
  const users = config.authorizedUsers;
  if (!users.length) return true;

  return users.some((user) => user.email === cleanEmail && user.enabled !== false);
}

export async function isSupportAdmin(email) {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return false;

  const config = await getSupportConfig();
  const roleAdmin = config.authorizedUsers.some((user) =>
    user.email === cleanEmail &&
    user.enabled !== false &&
    String(user.role || "").trim().toLowerCase() === "admin"
  );
  if (roleAdmin) return true;

  const admins = new Set([
    ...config.adminEmails,
    ...String(optionalEnv("SUPPORT_ADMIN_EMAILS"))
      .split(",")
      .map(normalizeEmail)
      .filter(Boolean)
  ]);

  return admins.has(cleanEmail);
}

function normalizeConfig(config = {}) {
  return {
    reportWorkflows: normalizeWorkflows(config.reportWorkflows || config.workflows || DEFAULT_REPORT_WORKFLOWS),
    slackRoutes: normalizeRoutes(config.slackRoutes || config.routes || []),
    listPanels: normalizeListPanels(config.listPanels || config.panels || DEFAULT_LIST_PANELS),
    authorizedUsers: normalizeUsers(config.authorizedUsers || config.users || []),
    adminEmails: normalizeEmailList(config.adminEmails || []),
    aiAssistant: normalizeAiAssistant(config.aiAssistant || {}),
    liveChatAutomation: normalizeLiveChatAutomation(config.liveChatAutomation || config.livechatAutomation || {}),
    traceability: normalizeTraceability(config.traceability || config.accountTraceability || {}),
    supportAlerts: normalizeAlerts(config.supportAlerts || config.alerts || []),
    updatedAt: config.updatedAt || ""
  };
}

function normalizeAiAssistant(input = {}) {
  return {
    enabled: input.enabled !== false,
    baseInstructions: normalizeMultiline(input.baseInstructions, DEFAULT_AI_ASSISTANT.baseInstructions),
    businessContext: normalizeMultiline(input.businessContext, DEFAULT_AI_ASSISTANT.businessContext),
    toneRules: normalizeMultiline(input.toneRules, DEFAULT_AI_ASSISTANT.toneRules),
    safetyRules: normalizeMultiline(input.safetyRules, DEFAULT_AI_ASSISTANT.safetyRules),
    defaultResponseFormat: normalizeMultiline(input.defaultResponseFormat, DEFAULT_AI_ASSISTANT.defaultResponseFormat),
    vectorStoreId: String(input.vectorStoreId || "").trim(),
    maxExamples: clampNumber(input.maxExamples, 1, 8, DEFAULT_AI_ASSISTANT.maxExamples),
    fileSearchMaxResults: clampNumber(input.fileSearchMaxResults, 1, 8, DEFAULT_AI_ASSISTANT.fileSearchMaxResults)
  };
}

function normalizeLiveChatAutomation(input = {}) {
  const autoWelcome = input.autoWelcome || input.welcome || {};
  return {
    enabled: input.enabled !== false,
    safeTemplateMode: normalizeSafeTemplateMode(input.safeTemplateMode || input.safe_template_mode),
    autoWelcome: {
      enabled: autoWelcome.enabled !== false,
      onlyForAgents: normalizeEmailList(autoWelcome.onlyForAgents || autoWelcome.agents || DEFAULT_LIVECHAT_AUTOMATION.autoWelcome.onlyForAgents),
      message: normalizeMultiline(autoWelcome.message, DEFAULT_LIVECHAT_AUTOMATION.autoWelcome.message),
      oncePerChat: autoWelcome.oncePerChat !== false
    }
  };
}

function normalizeSafeTemplateMode(value) {
  const clean = String(value || "").trim().toLowerCase();
  return ["disabled", "suggest_only", "auto_send_safe"].includes(clean)
    ? clean
    : DEFAULT_LIVECHAT_AUTOMATION.safeTemplateMode;
}

function normalizeTraceability(input = {}) {
  return {
    enabled: input.enabled !== false,
    deposits: normalizeTraceabilityDeposits(input.deposits || input.latestDeposits || []),
    updatedAt: String(input.updatedAt || "").trim()
  };
}

function normalizeTraceabilityDeposits(deposits) {
  if (!Array.isArray(deposits)) return [];
  return deposits.map((deposit) => ({
    email: normalizeEmail(deposit.email),
    depositAmount: String(deposit.depositAmount || deposit.amount || "").trim(),
    depositClabe: normalizeClabe(deposit.depositClabe || deposit.clabe || deposit.sourceClabe),
    depositDate: String(deposit.depositDate || deposit.createdAt || deposit.date || "").trim(),
    depositorName: String(deposit.depositorName || deposit.name || "").trim(),
    dateTs: Number(deposit.dateTs || 0) || 0
  })).filter((deposit) => deposit.email && deposit.depositClabe).slice(0, 5000);
}

function normalizeClabe(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 18 ? digits : "";
}

function normalizeMultiline(value, fallback) {
  const clean = String(value || "").trim();
  return clean || fallback;
}

function normalizeWorkflows(workflows) {
  return Array.isArray(workflows) ? workflows.map((workflow) => ({
    id: String(workflow.id || workflow.label || "").trim(),
    label: String(workflow.label || workflow.name || workflow.id || "").trim(),
    destination: normalizeDestination(workflow.destination),
    jiraIssueType: String(workflow.jiraIssueType || workflow.issueType || "").trim(),
    slackRouteId: String(workflow.slackRouteId || workflow.routeId || "").trim(),
    slackTemplate: String(workflow.slackTemplate || workflow.template || "").trim(),
    requiredSlackFields: normalizeStringList(workflow.requiredSlackFields || workflow.requiredFields || []),
    enabled: workflow.enabled !== false
  })).filter((workflow) => workflow.id && workflow.label) : [];
}

function normalizeRoutes(routes) {
  return Array.isArray(routes) ? routes.map((route) => ({
    id: String(route.id || route.name || "").trim(),
    name: String(route.name || route.id || "").trim(),
    mode: String(route.mode || "both").trim().toLowerCase(),
    channelId: String(route.channelId || route.channel || "").trim(),
    listId: String(route.listId || route.list || "").trim(),
    match: route.match || {},
    listColumns: route.listColumns || route.columns || {},
    listColumnTypes: route.listColumnTypes || route.columnTypes || {}
  })).filter((route) => route.id && (route.channelId || route.listId)) : [];
}

function normalizeListPanels(panels) {
  return Array.isArray(panels) ? panels.map((panel) => ({
    id: String(panel.id || panel.label || "").trim(),
    label: String(panel.label || panel.name || panel.id || "").trim(),
    listId: String(panel.listId || panel.list || "").trim(),
    columns: {
      ...DEFAULT_TRANSACTION_LIST_COLUMNS,
      ...removeEmptyValues(panel.columns || panel.listColumns || {})
    },
    filter: panel.filter || {},
    limit: clampNumber(panel.limit, 1, 25, 8),
    readLimit: clampNumber(panel.readLimit, 25, 1000, 250),
    enabled: panel.enabled !== false
  })).filter((panel) => panel.id && panel.label && panel.listId) : [];
}

function removeEmptyValues(values) {
  return Object.fromEntries(
    Object.entries(values || {}).filter(([, value]) => String(value || "").trim())
  );
}

function normalizeUsers(users) {
  if (!Array.isArray(users)) return [];
  return users.map((user) => {
    if (typeof user === "string") {
      return { email: normalizeEmail(user), displayName: "", role: "agent", enabled: true };
    }
    return {
      email: normalizeEmail(user.email),
      displayName: String(user.displayName || user.name || "").trim(),
      role: String(user.role || "agent").trim(),
      enabled: user.enabled !== false
    };
  }).filter((user) => user.email);
}

function normalizeAlerts(alerts) {
  if (!Array.isArray(alerts)) return [];
  return alerts.map((alert, index) => {
    const createdAt = String(alert.createdAt || alert.updatedAt || new Date().toISOString()).trim();
    const updatedAt = String(alert.updatedAt || createdAt).trim();
    return {
      id: String(alert.id || `alert-${Date.now()}-${index}`).trim(),
      title: String(alert.title || "").trim(),
      message: String(alert.message || "").trim(),
      severity: normalizeAlertSeverity(alert.severity),
      target: normalizeAlertTarget(alert.target),
      targetEmails: normalizeEmailList(alert.targetEmails || []),
      enabled: alert.enabled !== false,
      requireAcknowledgement: alert.requireAcknowledgement !== false,
      createdAt,
      updatedAt
    };
  }).filter((alert) => alert.id && alert.title && alert.message);
}

function normalizeAlertSeverity(value) {
  const clean = String(value || "info").trim().toLowerCase();
  return ["info", "warning", "critical"].includes(clean) ? clean : "info";
}

function normalizeAlertTarget(value) {
  const clean = String(value || "agents").trim().toLowerCase();
  return ["agents", "admins", "all", "emails"].includes(clean) ? clean : "agents";
}

function normalizeEmailList(values) {
  return Array.isArray(values)
    ? values.map(normalizeEmail).filter(Boolean)
    : String(values || "").split(",").map(normalizeEmail).filter(Boolean);
}

function normalizeStringList(values) {
  return Array.isArray(values)
    ? values.map((value) => String(value || "").trim()).filter(Boolean)
    : String(values || "").split(",").map((value) => value.trim()).filter(Boolean);
}

function normalizeDestination(value) {
  const clean = String(value || "jira").trim().toLowerCase();
  return ["jira", "slack", "both"].includes(clean) ? clean : "jira";
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, Math.trunc(number)));
}

async function kvGet(key) {
  const response = await kvRequest(["GET", key]);
  return response?.result ? JSON.parse(response.result) : null;
}

async function kvSet(key, value) {
  await kvRequest(["SET", key, JSON.stringify({
    ...value,
    updatedAt: new Date().toISOString()
  })]);
}

async function kvRequest(command) {
  const url = optionalEnv("KV_REST_API_URL") || optionalEnv("UPSTASH_REDIS_REST_URL");
  const token = optionalEnv("KV_REST_API_TOKEN") || optionalEnv("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) {
    const error = new Error("missing_kv_config");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch(`${url.replace(/\/+$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify([command])
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error("kv_request_failed");
    error.statusCode = response.status;
    error.details = data;
    throw error;
  }

  return Array.isArray(data) ? data[0] : data;
}

function parseJsonEnv(name, fallback) {
  const raw = optionalEnv(name);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}
