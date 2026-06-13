import fs from "node:fs";
import path from "node:path";
import { findSafeAutoTemplateReply, hasRiskSignals, isSimpleGreeting } from "../lib/safe-template-replies.js";

const DEFAULT_OUTPUT_DIR = "tmp/livechat-flow-mining";
const DEFAULT_INPUTS = [
  "tmp/livechat-response-mining/livechat_archives_2026-05-28T20-36-41_2026-06-04T20-36-41_gerardo_raw.json",
  "tmp/livechat-response-mining/livechat_archives_2026-05-28T20-36-40_2026-06-04T20-36-40_anahy_raw.json"
];

const AGENTS = {
  "gerardo.cruz@betxico.mx": "Gerardo",
  "anahy.haro@betxico.mx": "Anahy"
};

const args = parseArgs(process.argv.slice(2));
const inputPaths = (args.input || args.inputs)
  ? String(args.input || args.inputs).split(",").map((item) => item.trim()).filter(Boolean)
  : DEFAULT_INPUTS;
const outputDir = String(args.outputDir || args["output-dir"] || DEFAULT_OUTPUT_DIR);

const CATEGORY_RULES = [
  {
    category: "bonos_promociones",
    intent: "bono_consulta_general",
    riskLevel: "low",
    autoPotential: "suggest_first",
    keywords: ["bono", "bonos", "promocion", "promoción", "promo", "cashback", "primer deposito", "sin deposito", "10%", "beneficio", "oferta"]
  },
  {
    category: "acceso_cuenta",
    intent: "acceso_login_password",
    riskLevel: "low",
    autoPotential: "auto_safe_if_template",
    keywords: ["no puedo entrar", "contraseña", "contrasena", "password", "login", "iniciar sesion", "iniciar sesión", "pin", "correo"]
  },
  {
    category: "depositos",
    intent: "deposito_no_reflejado",
    riskLevel: "medium",
    autoPotential: "partial_auto_data_request",
    keywords: ["deposito", "depósito", "transferencia", "spei", "cep", "clave de rastreo", "saldo", "reflejado", "abono", "comprobante"]
  },
  {
    category: "retiros",
    intent: "retiro_revision",
    riskLevel: "high",
    autoPotential: "agent_only",
    keywords: ["retiro", "retirar", "clabe", "banco", "failed", "congelado", "pendiente", "pago"]
  },
  {
    category: "kyc_documentos",
    intent: "kyc_documentos_verificacion",
    riskLevel: "high",
    autoPotential: "agent_only",
    keywords: ["ine", "selfie", "documentos", "verificacion", "verificación", "validacion", "validación", "identidad"]
  },
  {
    category: "juegos_saldo_proveedor",
    intent: "juego_saldo_error",
    riskLevel: "medium",
    autoPotential: "agent_only",
    keywords: ["juego", "slot", "casino", "ganancia", "premio", "tirada", "giro", "proveedor", "apuesta"]
  },
  {
    category: "cliente_molesto_quejas",
    intent: "cliente_molesto_queja",
    riskLevel: "high",
    autoPotential: "agent_only",
    keywords: ["robo", "robaron", "fraude", "estafa", "demanda", "queja", "molesto", "ratero"]
  }
];

main();

function main() {
  fs.mkdirSync(outputDir, { recursive: true });
  const loaded = inputPaths.flatMap((inputPath) => {
    const raw = readJson(inputPath);
    return normalizeChats(raw).map((chat) => ({ chat, inputPath }));
  });
  const flows = loaded.flatMap(({ chat, inputPath }) => extractFlows(chat, inputPath));
  const grouped = groupFlows(flows);
  const report = buildOutput(flows, grouped);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const jsonPath = path.join(outputDir, `flujos_conversacionales_anahy_gerardo_${stamp}.json`);
  const mdPath = path.join(outputDir, `flujos_conversacionales_anahy_gerardo_${stamp}.md`);
  fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2) + "\n");
  fs.writeFileSync(mdPath, toMarkdown(report));

  console.log(`Chats fuente: ${loaded.length}`);
  console.log(`Flujos detectados: ${flows.length}`);
  console.log(`Grupos de flujo: ${grouped.length}`);
  console.log(`Documento: ${mdPath}`);
  console.log(`JSON: ${jsonPath}`);
}

function extractFlows(chat, inputPath) {
  const events = getChatEvents(chat);
  const users = new Map((chat.users || []).map((user) => [String(user.id || "").trim(), user]));
  const customerIds = new Set((chat.users || [])
    .filter((user) => user.type === "customer")
    .map((user) => String(user.id || "").trim())
    .filter(Boolean));
  const turns = events
    .filter((event) => event.type === "message" && event.visibility === "all" && cleanText(event.text))
    .map((event) => ({
      id: event.id || "",
      at: event.created_at || "",
      text: cleanText(event.text),
      authorId: String(event.author_id || "").trim(),
      role: classifyAuthor(event, users, customerIds),
      agentName: AGENTS[String(event.author_id || "").trim().toLowerCase()] || users.get(String(event.author_id || "").trim())?.name || ""
    }))
    .filter((turn) => turn.role !== "bot" || isWelcomeText(turn.text));

  const flows = [];
  for (let index = 0; index < turns.length; index += 1) {
    const turn = turns[index];
    if (turn.role !== "customer" || !isUsefulCustomerTurn(turn.text)) continue;

    const previousCustomerUseful = turns.slice(0, index).some((item) => item.role === "customer" && isUsefulCustomerTurn(item.text));
    const agentReply = turns.slice(index + 1).find((item) => item.role === "target_agent" && isUsefulAgentTurn(item.text));
    if (!agentReply) continue;

    const nextCustomer = turns
      .slice(turns.indexOf(agentReply) + 1)
      .find((item) => item.role === "customer" && isUsefulCustomerTurn(item.text));
    const classification = classifyFlow(`${turn.text}\n${agentReply.text}`);
    const safeMatch = findSafeAutoTemplateReply(turn.text, "", { requireAutoSendAllowed: true });
    const riskBlocked = hasRiskSignals(turn.text, agentReply.text);
    const automation = recommendAutomation({
      firstUseful: !previousCustomerUseful,
      safeMatch,
      riskBlocked,
      classification
    });

    flows.push({
      flowId: `flow_${String(flows.length + 1).padStart(4, "0")}`,
      agentName: agentReply.agentName || "Agente",
      sourceInput: path.basename(inputPath),
      category: safeMatch.matched ? safeMatch.category : classification.category,
      intent: safeMatch.matched ? safeMatch.intent : classification.intent,
      riskLevel: riskBlocked ? "high" : classification.riskLevel,
      automationMode: automation.mode,
      automationReason: automation.reason,
      firstUsefulCustomerMessage: sanitize(turn.text),
      currentAgentResponse: sanitize(agentReply.text),
      recommendedBotResponse: sanitize(safeMatch.matched ? safeMatch.reply : cleanAgentResponse(agentReply.text)),
      nextCustomerMessage: nextCustomer ? sanitize(nextCustomer.text) : "",
      firstUsefulMessage: !previousCustomerUseful,
      safeTemplateIntent: safeMatch.matched ? safeMatch.intent : "",
      customerConfirmed: nextCustomer ? isConfirmation(nextCustomer.text) : false
    });
  }
  return flows;
}

function groupFlows(flows) {
  const map = new Map();
  for (const flow of flows) {
    const key = `${flow.category}:${flow.intent}:${flow.automationMode}`;
    if (!map.has(key)) {
      map.set(key, {
        category: flow.category,
        intent: flow.intent,
        automationMode: flow.automationMode,
        riskLevel: flow.riskLevel,
        count: 0,
        agents: {},
        triggerExamples: [],
        responseExamples: [],
        followUpExamples: [],
        recommendation: ""
      });
    }
    const group = map.get(key);
    group.count += 1;
    group.agents[flow.agentName] = (group.agents[flow.agentName] || 0) + 1;
    pushUnique(group.triggerExamples, flow.firstUsefulCustomerMessage, 5);
    pushUnique(group.responseExamples, flow.recommendedBotResponse, 3);
    if (flow.nextCustomerMessage) pushUnique(group.followUpExamples, flow.nextCustomerMessage, 3);
    group.recommendation = buildGroupRecommendation(group);
  }
  return [...map.values()].sort((a, b) => b.count - a.count || a.category.localeCompare(b.category));
}

function buildOutput(flows, grouped) {
  const autoReady = grouped.filter((group) => group.automationMode === "auto_send_safe_candidate");
  const suggestOnly = grouped.filter((group) => group.automationMode === "suggest_only_candidate");
  const agentOnly = grouped.filter((group) => group.automationMode === "agent_only");
  return {
    version: "1.0.0",
    generatedAt: new Date().toISOString(),
    purpose: "Revision operativa de flujos conversacionales Anahy + Gerardo. No modifica KV ni plantillas productivas.",
    summary: {
      totalFlows: flows.length,
      totalGroups: grouped.length,
      autoReadyGroups: autoReady.length,
      suggestOnlyGroups: suggestOnly.length,
      agentOnlyGroups: agentOnly.length,
      byCategory: countBy(flows, "category"),
      byAgent: countBy(flows, "agentName")
    },
    recommendedNextSteps: [
      "Aprobar primero flujos auto_send_safe_candidate con conteo alto y sin senales de riesgo.",
      "Convertir suggest_only_candidate en sugerencias para agente antes de automatizar.",
      "Mantener agent_only fuera de auto-respuesta y usarlo para mejorar GPT o checklists internos.",
      "Agregar cada semana 10-20 flujos nuevos depurados, no todo el historial completo."
    ],
    groups: grouped,
    flows: flows.slice(0, 250)
  };
}

function recommendAutomation({ firstUseful, safeMatch, riskBlocked, classification }) {
  if (riskBlocked || classification.riskLevel === "high") {
    return { mode: "agent_only", reason: "riesgo operativo o caso delicado" };
  }
  if (!firstUseful) {
    return { mode: "suggest_only_candidate", reason: "no es el primer mensaje util del cliente" };
  }
  if (safeMatch.matched) {
    return { mode: "auto_send_safe_candidate", reason: "ya existe plantilla segura aprobada con auto_send_allowed" };
  }
  if (classification.riskLevel === "low") {
    return { mode: "suggest_only_candidate", reason: "flujo de bajo riesgo, requiere curacion antes de auto-send" };
  }
  return { mode: "agent_only", reason: "requiere validacion o evidencia antes de responder" };
}

function classifyFlow(text) {
  const normalized = normalize(text);
  let best = { score: 0, category: "general", intent: "general_soporte", riskLevel: "medium", autoPotential: "suggest_only" };
  for (const rule of CATEGORY_RULES) {
    const score = rule.keywords.reduce((acc, keyword) => acc + (normalized.includes(normalize(keyword)) ? 1 : 0), 0);
    if (score > best.score) best = { ...rule, score };
  }
  return best.score > 0 ? best : { category: "general", intent: "general_soporte", riskLevel: "medium", autoPotential: "suggest_only" };
}

function toMarkdown(report) {
  const lines = [
    "# Flujos Conversacionales Anahy + Gerardo",
    "",
    `Generado: ${report.generatedAt}`,
    "",
    "## Resumen",
    "",
    `- Flujos detectados: ${report.summary.totalFlows}`,
    `- Grupos detectados: ${report.summary.totalGroups}`,
    `- Grupos candidatos auto-send seguro: ${report.summary.autoReadyGroups}`,
    `- Grupos candidatos suggest-only: ${report.summary.suggestOnlyGroups}`,
    `- Grupos solo agente: ${report.summary.agentOnlyGroups}`,
    "",
    "### Por categoria",
    "",
    ...Object.entries(report.summary.byCategory).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "### Por agente",
    "",
    ...Object.entries(report.summary.byAgent).map(([key, value]) => `- ${key}: ${value}`),
    "",
    "## Flujos recomendados",
    ""
  ];

  for (const group of report.groups.slice(0, 30)) {
    lines.push(`### ${group.intent}`);
    lines.push("");
    lines.push(`- categoria: ${group.category}`);
    lines.push(`- modo recomendado: ${group.automationMode}`);
    lines.push(`- riesgo: ${group.riskLevel}`);
    lines.push(`- casos detectados: ${group.count}`);
    lines.push(`- agentes: ${Object.entries(group.agents).map(([agent, count]) => `${agent} (${count})`).join(", ")}`);
    lines.push(`- recomendacion: ${group.recommendation}`);
    lines.push("");
    lines.push("**Disparadores reales del cliente**");
    lines.push("");
    group.triggerExamples.forEach((item) => lines.push(`- ${item}`));
    lines.push("");
    lines.push("**Respuesta candidata**");
    lines.push("");
    lines.push(group.responseExamples[0] || "Sin respuesta candidata.");
    if (group.followUpExamples.length) {
      lines.push("");
      lines.push("**Seguimientos reales del cliente**");
      lines.push("");
      group.followUpExamples.forEach((item) => lines.push(`- ${item}`));
    }
    lines.push("");
  }

  lines.push("## Siguientes pasos");
  lines.push("");
  report.recommendedNextSteps.forEach((item) => lines.push(`- ${item}`));
  lines.push("");
  return lines.join("\n");
}

function buildGroupRecommendation(group) {
  if (group.automationMode === "auto_send_safe_candidate") {
    return "Puede probarse como auto-respuesta cuando safeTemplateMode este activo, manteniendo memoria de una sola respuesta por chat.";
  }
  if (group.automationMode === "suggest_only_candidate") {
    return "Conviene dejarlo primero como sugerencia para agente y curar una plantilla antes de auto-enviar.";
  }
  return "No automatizar; usar para entrenamiento, checklist interno o respuesta asistida por agente.";
}

function normalizeChats(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.chats)) return raw.chats;
  throw new Error("invalid_livechat_raw");
}

function getChatEvents(chat) {
  const events = [];
  if (Array.isArray(chat.thread?.events)) events.push(...chat.thread.events);
  if (Array.isArray(chat.threads)) {
    for (const thread of chat.threads) {
      if (Array.isArray(thread.events)) events.push(...thread.events);
    }
  }
  return events.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
}

function classifyAuthor(event, users, customerIds) {
  const id = String(event.author_id || "").trim();
  if (customerIds.has(id)) return "customer";
  if (AGENTS[id.toLowerCase()]) return "target_agent";
  const user = users.get(id);
  if (user?.type === "agent") return "agent";
  return "bot";
}

function isWelcomeText(text) {
  return /bienvenido|en que te puedo ayudar|en qué te puedo ayudar|hola\. ¿en qué/i.test(text);
}

function isUsefulCustomerTurn(text) {
  const clean = cleanText(text);
  if (clean.length < 5) return false;
  if (/^(hola|buenas|buenos dias|buenos días|buenas tardes|buenas noches|abrir chat|💬\s*hablar con agente|hablar con agente|ok|si|sí|gracias|muchas gracias)$/i.test(clean)) return false;
  if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/iu.test(clean)) return false;
  if (/^\d{4,}$/u.test(clean)) return false;
  if (/^\[?correo\]?$/iu.test(clean)) return false;
  return !isSimpleGreeting(clean);
}

function isUsefulAgentTurn(text) {
  const clean = cleanText(text);
  if (clean.length < 35) return false;
  if (/^(hola|buenas|dame un momento|un momento|permiteme revisar|permíteme revisar)/i.test(clean)) return false;
  if (/por mi parte fue todo|calificar|cerrar[aá] en breve|estamos para servirte/i.test(clean)) return false;
  return true;
}

function isConfirmation(text) {
  return /ya qued[oó]|ya pude|ya aparece|ya se reflej[oó]|listo|gracias/i.test(text);
}

function cleanAgentResponse(text) {
  return sanitize(text)
    .replace(/(contrase(?:ñ|n)a\s*:?)\s*\S+/gi, "$1 [contraseña_temporal]")
    .replace(/(contrase(?:ñ|n)a\s+(?:temporal\s+)?(?:sera|será|es)\s*:?)\s*\S+/gi, "$1 [contraseña_temporal]")
    .replace(/\s{2,}/gu, " ")
    .trim();
}

function sanitize(text) {
  return cleanText(text)
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/giu, "[correo]")
    .replace(/https:\/\/my\.livechatinc\.com\/chats\/[A-Z0-9]+/giu, "[chat]")
    .replace(/\bT[A-Z0-9]{6,}\b/gu, "[chat_id]")
    .replace(/(contrase(?:ñ|n)a\s*:?)\s*\S+/gi, "$1 [contraseña_temporal]")
    .replace(/(password\s*:?)\s*\S+/gi, "$1 [contraseña_temporal]")
    .replace(/\b\d{5,}\b/gu, "[numero]");
}

function pushUnique(list, value, limit) {
  const clean = cleanText(value);
  if (!clean || list.includes(clean)) return;
  if (list.length < limit) list.push(clean);
}

function countBy(items, key) {
  return items.reduce((acc, item) => {
    const value = item[key] || "sin_dato";
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function cleanText(value) {
  return String(value || "").replace(/\s+/gu, " ").trim();
}

function normalize(value) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase();
}

function parseArgs(argv) {
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--input" || arg === "--inputs" || arg === "--output-dir" || arg === "--outputDir") {
      parsed[arg.replace(/^--/, "")] = argv[++index];
    } else {
      throw new Error(`Argumento no soportado: ${arg}`);
    }
  }
  return parsed;
}
