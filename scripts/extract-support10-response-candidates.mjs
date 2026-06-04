import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const LIVECHAT_ARCHIVES_URL = "https://api.livechatinc.com/v3.6/agent/action/list_archives";
const DEFAULT_AGENT_ID = "gerardo.cruz@betxico.mx";
const DEFAULT_AGENT_NAME = "Soporte 10";
const DEFAULT_DAYS = 7;
const DEFAULT_OUTPUT_DIR = "tmp/livechat-response-mining";

const CATEGORY_RULES = [
  {
    category: "acceso_cuenta",
    intent: "acceso_cuenta_login_password",
    riskLevel: "low",
    canAutoRespond: true,
    keywords: ["contraseña", "contrasena", "password", "no puedo entrar", "iniciar sesion", "iniciar sesión", "login", "acceso", "bloqueada", "bloqueado", "correo", "pin"],
    requiredData: ["correo registrado", "captura del error", "navegador o dispositivo"],
    doNotUseWhen: "No usar si el problema es retiro, KYC, saldo restringido o bloqueo confirmado por seguridad."
  },
  {
    category: "bonos_promociones",
    intent: "bono_promocion_consulta_basica",
    riskLevel: "medium",
    canAutoRespond: true,
    keywords: ["bono", "promocion", "promoción", "promo", "primer deposito", "primer depósito", "10%", "rollover", "beneficio"],
    requiredData: ["tipo de bono consultado", "si ya depositó", "si ya jugó o apostó"],
    doNotUseWhen: "No prometer bono si no aparece disponible o si requiere validacion interna."
  },
  {
    category: "depositos",
    intent: "deposito_no_reflejado_o_consulta",
    riskLevel: "medium",
    canAutoRespond: false,
    keywords: ["deposito", "depósito", "saldo", "spei", "cep", "clave de rastreo", "transferencia", "mexpago", "spin", "oxxo", "reflejado", "abono"],
    requiredData: ["correo registrado", "AUTH ID", "monto", "fecha y hora", "clave de rastreo", "CEP o evidencia"],
    doNotUseWhen: "No confirmar acreditacion sin validar sistema, CEP o evidencia completa."
  },
  {
    category: "retiros",
    intent: "retiro_consulta_revision",
    riskLevel: "high",
    canAutoRespond: false,
    keywords: ["retiro", "retirar", "retiré", "retire", "pago", "clabe", "banco", "failed", "congelado", "pendiente", "documentos para retirar"],
    requiredData: ["correo registrado", "AUTH ID", "monto", "fecha de solicitud", "estado actual en sistema"],
    doNotUseWhen: "No prometer pago, aprobacion, devolucion o tiempo exacto sin validacion interna."
  },
  {
    category: "kyc_documentos",
    intent: "kyc_verificacion_documentos",
    riskLevel: "high",
    canAutoRespond: false,
    keywords: ["ine", "documento", "documentos", "selfie", "verificacion", "verificación", "validacion", "validación", "kyc", "identidad"],
    requiredData: ["tipo de documento solicitado", "estado de validacion", "captura o evidencia si hay error"],
    doNotUseWhen: "No aprobar KYC ni prometer liberacion inmediata."
  },
  {
    category: "juegos_saldo_proveedor",
    intent: "problema_tecnico_juego_o_saldo",
    riskLevel: "medium",
    canAutoRespond: false,
    keywords: ["juego", "casino", "slot", "tirada", "giro", "ganancia", "premio", "proveedor", "historial", "apuesta"],
    requiredData: ["nombre exacto del juego", "hora aproximada", "captura o video", "dispositivo", "conexion usada"],
    doNotUseWhen: "No prometer reposicion si no hay evidencia y validacion del proveedor."
  },
  {
    category: "perfil_datos",
    intent: "perfil_error_actualizacion",
    riskLevel: "medium",
    canAutoRespond: false,
    keywords: ["perfil", "datos", "actualizar", "nombre", "apellido", "telefono", "teléfono", "numero", "número", "fecha de nacimiento"],
    requiredData: ["correo registrado", "AUTH ID", "dato a corregir", "captura del error"],
    doNotUseWhen: "No cambiar datos sensibles sin validacion de identidad."
  },
  {
    category: "cliente_molesto_quejas",
    intent: "cliente_molesto_general",
    riskLevel: "high",
    canAutoRespond: false,
    keywords: ["robo", "fraude", "estafa", "molesto", "molesta", "queja", "demanda", "ratero", "nunca", "siempre pierdo", "me robaron"],
    requiredData: ["motivo concreto de la queja", "evidencia si reclama error", "ticket o caso relacionado"],
    doNotUseWhen: "No aceptar culpa, no prometer compensacion, bono, pago ni resultado inmediato."
  }
];

const NOISE_PATTERNS = [
  /^hola[.!¡ ]*$/i,
  /^buen[oa]s?\s+(dias|días|tardes|noches)[.! ]*$/i,
  /^abrir chat$/i,
  /^hablar con agente$/i,
  /^💬\s*hablar con agente$/i,
  /^¡?en breve ser[aá]s transferido a un agente/i,
  /^ok$/i,
  /^si$/i,
  /^sí$/i,
  /^gracias$/i,
  /^azu$/i,
  /^eu$/i
];

const CLOSING_PATTERNS = [
  /por mi parte fue todo/i,
  /que tengas (excelente|bonit[ao])/i,
  /calificar/i,
  /cerrar[aá] en breve/i,
  /estamos para servirte/i,
  /fue un placer atenderte/i
];

const AGENT_GENERIC_PATTERNS = [
  /bienvenido a betxico/i,
  /^dame un momento/i,
  /^un momento/i,
  /^perm[ií]teme revisar/i,
  /^muy bien,? ya tengo el contexto/i,
  /^correcto,? puedes usarla/i,
  /^env[ií]alas a \[?correo/i,
  /^tu correo es /i,
  /nueva contraseña ser[aá]:?\s*\S+/i,
  /tienes algun problema$/i,
  /tienes algún problema$/i
];

const CONFIRMATION_PATTERNS = [
  /ya qued[oó]/i,
  /ya pude/i,
  /ya me apareci[oó]/i,
  /ya se reflej[oó]/i,
  /listo/i,
  /solucionad[oa]/i,
  /muchas gracias/i,
  /gracias/i
];

const args = parseArgs(process.argv.slice(2));
loadLocalEnv();

const now = new Date();
let to = args.to ? new Date(args.to) : now;
let from = args.from ? new Date(args.from) : new Date(to.getTime() - (Number(args.days || DEFAULT_DAYS) * 24 * 60 * 60 * 1000));
const agentId = String(args.agent || DEFAULT_AGENT_ID).trim();
const agentName = String(args.agentName || args["agent-name"] || DEFAULT_AGENT_NAME).trim();
const outputDir = String(args.outputDir || args["output-dir"] || DEFAULT_OUTPUT_DIR).trim();

main().catch((error) => {
  console.error(`extract-support10-response-candidates failed: ${error.message}`);
  if (error.details) console.error(JSON.stringify(error.details, null, 2));
  process.exit(1);
});

async function main() {
  fs.mkdirSync(outputDir, { recursive: true });

  const raw = args.input
    ? readJsonFile(args.input)
    : await fetchLiveChatArchives({ from, to, agentId, limit: Number(args.limit || 100) || 100 });
  if (args.input && raw?.from && !args.from) from = new Date(raw.from);
  if (args.input && raw?.to && !args.to) to = new Date(raw.to);
  const chats = normalizeChats(raw);
  const groupedChats = groupChatsById(chats);
  const analysis = analyzeChats(groupedChats, { agentId, agentName, from, to });
  const stamp = `${formatDatePart(from)}_${formatDatePart(to)}_${slug(agentName)}`;
  const rawPath = path.join(outputDir, `livechat_archives_${stamp}_raw.json`);
  const jsonPath = path.join(outputDir, `respuestas_candidatas_${stamp}.json`);
  const csvPath = path.join(outputDir, `respuestas_candidatas_${stamp}.csv`);
  const mdPath = path.join(outputDir, `revision_respuestas_${stamp}.md`);

  if (!args.input || args.saveRaw) {
    writeJson(rawPath, raw);
  }
  writeJson(jsonPath, analysis);
  fs.writeFileSync(csvPath, toCsv(analysis.candidates), "utf8");
  fs.writeFileSync(mdPath, toMarkdown(analysis), "utf8");

  console.log(`Chats revisados: ${analysis.summary.totalChats}`);
  console.log(`Chats con respuesta visible de ${agentName}: ${analysis.summary.chatsWithAgentResponses}`);
  console.log(`Respuestas candidatas: ${analysis.summary.totalCandidates}`);
  console.log(`Documento de revision: ${mdPath}`);
  console.log(`JSON: ${jsonPath}`);
  console.log(`CSV: ${csvPath}`);
}

async function fetchLiveChatArchives({ from, to, agentId, limit }) {
  const token = process.env.LIVECHAT_BASIC_TOKEN || process.env.LIVECHAT_BASIC_AUTH_TOKEN || process.env.TEXT_BASIC_TOKEN;
  if (!token) {
    throw new Error("missing_livechat_token: define LIVECHAT_BASIC_TOKEN o ejecuta con --input <raw.json>");
  }

  const allChats = [];
  let pageId = "";
  do {
    const payload = pageId ? { page_id: pageId } : {
      filters: {
        from: toLiveChatDate(from),
        to: toLiveChatDate(to),
        event_types: { values: ["message", "filled_form", "file", "rich_message"] },
        agent_response: { first: true, agents: { values: [agentId] } }
      },
      sort_order: "asc",
      limit: Math.min(100, Math.max(1, limit))
    };

    const response = await fetch(LIVECHAT_ARCHIVES_URL, {
      method: "POST",
      headers: {
        authorization: `Basic ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = new Error(data?.error?.message || data?.error || "livechat_list_archives_failed");
      error.details = data;
      throw error;
    }
    allChats.push(...(data.chats || []));
    pageId = data.next_page_id || "";
  } while (pageId);

  return {
    from: toLiveChatDate(from),
    to: toLiveChatDate(to),
    count: allChats.length,
    chats: allChats
  };
}

function analyzeChats(chats, options) {
  const candidates = [];
  const categoryCounts = new Map();
  let chatsWithAgentResponses = 0;

  for (const chat of chats) {
    const events = getChatEvents(chat);
    const customerIds = new Set((chat.users || []).filter((user) => user.type === "customer").map((user) => String(user.id || "").trim()).filter(Boolean));
    const agentEvents = events.filter((event) => isAgentMessage(event, options.agentId));
    if (!agentEvents.length) continue;
    chatsWithAgentResponses += 1;

    for (const agentEvent of agentEvents) {
      const response = cleanText(agentEvent.text);
      if (!isUsefulAgentResponse(response)) continue;
      const situation = findCustomerSituation(events, agentEvent, customerIds);
      if (!situation) continue;

      const category = classifyConversation(`${situation.text}\n${response}\n${chat.thread?.summary?.text || ""}`);
      const confirmation = findCustomerConfirmation(events, agentEvent, customerIds);
      const candidate = {
        category: category.category,
        suggestedIntent: category.intent,
        riskLevel: category.riskLevel,
        canAutoRespond: category.canAutoRespond,
        chatId: chat.id || "",
        chatLink: chat.id ? `https://my.livechatinc.com/chats/${chat.id}` : "",
        threadId: chat.thread?.id || "",
        dateMx: formatMxDate(agentEvent.created_at),
        customerSituation: sanitizeText(situation.text),
        realAgentResponse: sanitizeText(response),
        cleanRecommendedResponse: cleanRecommendedResponse(response),
        requiredData: category.requiredData,
        doNotUseWhen: category.doNotUseWhen,
        customerConfirmed: Boolean(confirmation),
        confirmationFragment: confirmation ? sanitizeText(confirmation.text) : "Sin confirmacion encontrada",
        source: {
          agentId: options.agentId,
          agentName: options.agentName,
          agentEventAt: agentEvent.created_at || "",
          customerEventAt: situation.created_at || ""
        }
      };

      candidates.push(candidate);
      categoryCounts.set(category.category, (categoryCounts.get(category.category) || 0) + 1);
    }
  }

  const deduped = dedupeCandidates(candidates);
  const recommendations = buildRecommendations(deduped);
  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      agentId: options.agentId,
      agentName: options.agentName,
      from: options.from.toISOString(),
      to: options.to.toISOString(),
      outputPurpose: "Documento de revision. No carga KV ni modifica la base del asistente."
    },
    summary: {
      totalChats: chats.length,
      chatsWithAgentResponses,
      totalCandidates: deduped.length,
      categoryCounts: Object.fromEntries([...categoryCounts.entries()].sort((a, b) => b[1] - a[1]))
    },
    recommendations,
    candidates: deduped
  };
}

function buildRecommendations(candidates) {
  const byCategory = new Map();
  for (const candidate of candidates) {
    if (!byCategory.has(candidate.category)) byCategory.set(candidate.category, []);
    byCategory.get(candidate.category).push(candidate);
  }

  return [...byCategory.entries()]
    .map(([category, items]) => ({
      category,
      total: items.length,
      approveFirst: items
        .filter((item) => item.canAutoRespond || item.customerConfirmed || item.riskLevel === "low")
        .slice(0, 5)
        .map((item) => ({
          suggestedIntent: item.suggestedIntent,
          reason: item.canAutoRespond ? "plantilla simple reutilizable" : item.customerConfirmed ? "caso con confirmacion del cliente" : "riesgo bajo",
          cleanRecommendedResponse: item.cleanRecommendedResponse,
          chatId: item.chatId
        }))
    }))
    .sort((a, b) => b.total - a.total);
}

function normalizeChats(raw) {
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw?.chats)) return raw.chats;
  throw new Error("invalid_livechat_raw: se esperaba un arreglo o un objeto con chats[]");
}

function groupChatsById(chats) {
  const grouped = new Map();
  for (const chat of chats) {
    const id = String(chat.id || chat.chat_id || "").trim();
    if (!id) continue;
    const existing = grouped.get(id);
    if (!existing) {
      grouped.set(id, { ...chat, thread: { ...(chat.thread || {}), events: [...getChatEvents(chat)] } });
      continue;
    }
    existing.users = mergeUsers(existing.users || [], chat.users || []);
    existing.thread.events.push(...getChatEvents(chat));
    existing.thread.events.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
  }
  return [...grouped.values()];
}

function mergeUsers(a, b) {
  const byId = new Map();
  for (const user of [...a, ...b]) {
    const key = String(user.id || user.email || user.name || "").trim();
    if (key && !byId.has(key)) byId.set(key, user);
  }
  return [...byId.values()];
}

function getChatEvents(chat) {
  const events = [];
  if (Array.isArray(chat.thread?.events)) events.push(...chat.thread.events);
  if (Array.isArray(chat.threads)) {
    for (const thread of chat.threads) {
      if (Array.isArray(thread.events)) events.push(...thread.events);
    }
  }
  return events
    .filter((event) => event && event.type)
    .sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
}

function isAgentMessage(event, agentId) {
  return event.type === "message"
    && event.visibility === "all"
    && String(event.author_id || "").trim().toLowerCase() === agentId.toLowerCase()
    && cleanText(event.text);
}

function findCustomerSituation(events, agentEvent, customerIds) {
  const before = events
    .filter((event) => new Date(event.created_at || 0) < new Date(agentEvent.created_at || 0))
    .filter((event) => event.type === "message" && event.visibility === "all" && customerIds.has(String(event.author_id || "").trim()))
    .map((event) => ({ ...event, text: cleanText(event.text) }))
    .filter((event) => isUsefulCustomerMessage(event.text));
  return before.slice(-3).reduce((acc, event) => {
    if (!acc) return { ...event };
    return {
      ...event,
      text: `${acc.text}\n${event.text}`
    };
  }, null);
}

function findCustomerConfirmation(events, agentEvent, customerIds) {
  return events
    .filter((event) => new Date(event.created_at || 0) > new Date(agentEvent.created_at || 0))
    .filter((event) => event.type === "message" && event.visibility === "all" && customerIds.has(String(event.author_id || "").trim()))
    .map((event) => ({ ...event, text: cleanText(event.text) }))
    .find((event) => CONFIRMATION_PATTERNS.some((pattern) => pattern.test(event.text)));
}

function isUsefulCustomerMessage(text) {
  const clean = cleanText(text);
  if (clean.length < 8) return false;
  if (NOISE_PATTERNS.some((pattern) => pattern.test(clean))) return false;
  return true;
}

function isUsefulAgentResponse(text) {
  const clean = cleanText(text);
  if (clean.length < 45) return false;
  if (NOISE_PATTERNS.some((pattern) => pattern.test(clean))) return false;
  if (CLOSING_PATTERNS.some((pattern) => pattern.test(clean))) return false;
  if (AGENT_GENERIC_PATTERNS.some((pattern) => pattern.test(clean))) return false;
  return true;
}

function classifyConversation(text) {
  const normalized = normalizeText(text);
  let best = null;
  for (const rule of CATEGORY_RULES) {
    const score = rule.keywords.reduce((acc, keyword) => acc + (normalized.includes(normalizeText(keyword)) ? 1 : 0), 0);
    if (!best || score > best.score) best = { ...rule, score };
  }
  if (!best || best.score === 0) {
    return {
      category: "general",
      intent: "general_soporte",
      riskLevel: "medium",
      canAutoRespond: false,
      requiredData: ["correo registrado", "AUTH ID", "descripcion del problema", "evidencia si aplica"],
      doNotUseWhen: "No usar como respuesta automatica si el caso requiere validacion interna."
    };
  }
  return best;
}

function dedupeCandidates(candidates) {
  const seen = new Set();
  const result = [];
  for (const candidate of candidates) {
    const key = `${candidate.category}:${normalizeText(candidate.cleanRecommendedResponse).slice(0, 180)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(candidate);
  }
  return result.sort((a, b) => {
    const cat = String(a.category).localeCompare(String(b.category));
    if (cat) return cat;
    return String(a.dateMx).localeCompare(String(b.dateMx));
  });
}

function cleanRecommendedResponse(text) {
  return sanitizeText(text)
    .replace(/\b(disculpa|hola|buenas noches|buenos dias|buenos días|buenas tardes)\s+[^,\n]+,?/i, "")
    .replace(/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+,\s+/, "")
    .replace(/(contrase(?:ñ|n)a\s+(?:sera|será|es|temporal)\s*:?)\s*\S+/gi, "$1 [contraseña_temporal]")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function sanitizeText(text) {
  return cleanText(text)
    .replace(/^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+,\s+/, "")
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi, "[correo_cliente]")
    .replace(/\b[A-Z0-9]{8,}\b/g, "[id_referencia]")
    .replace(/\b\d{6,}\b/g, "[numero_referencia]")
    .replace(/(contrase(?:ñ|n)a\s+(?:sera|será|es|temporal)\s*:?)\s*\S+/gi, "$1 [contraseña_temporal]")
    .replace(/https?:\/\/\S+/gi, "[link]");
}

function toMarkdown(analysis) {
  const lines = [];
  lines.push(`# Revision de respuestas candidatas - ${analysis.metadata.agentName}`);
  lines.push("");
  lines.push(`Generado: ${formatMxDate(analysis.metadata.generatedAt)}`);
  lines.push(`Rango: ${formatMxDate(analysis.metadata.from)} a ${formatMxDate(analysis.metadata.to)}`);
  lines.push(`Agente: ${analysis.metadata.agentName} (${analysis.metadata.agentId})`);
  lines.push("");
  lines.push("## Resumen");
  lines.push("");
  lines.push(`- Chats revisados: ${analysis.summary.totalChats}`);
  lines.push(`- Chats con respuestas visibles del agente: ${analysis.summary.chatsWithAgentResponses}`);
  lines.push(`- Respuestas candidatas depuradas: ${analysis.summary.totalCandidates}`);
  lines.push("");
  lines.push("### Conteo por categoria");
  lines.push("");
  for (const [category, count] of Object.entries(analysis.summary.categoryCounts)) {
    lines.push(`- ${category}: ${count}`);
  }
  lines.push("");
  lines.push("## Recomendadas para aprobar primero");
  lines.push("");
  for (const group of analysis.recommendations.filter((item) => item.approveFirst.length)) {
    lines.push(`### ${group.category} (${group.total})`);
    lines.push("");
    for (const item of group.approveFirst) {
      lines.push(`- ${item.suggestedIntent} | ${item.reason} | chat ${item.chatId}`);
      lines.push(`  - Respuesta limpia: ${item.cleanRecommendedResponse}`);
    }
    lines.push("");
  }
  lines.push("## Respuestas candidatas por categoria");
  lines.push("");
  const byCategory = new Map();
  for (const candidate of analysis.candidates) {
    if (!byCategory.has(candidate.category)) byCategory.set(candidate.category, []);
    byCategory.get(candidate.category).push(candidate);
  }
  for (const [category, items] of byCategory.entries()) {
    lines.push(`## ${category}`);
    lines.push("");
    items.forEach((candidate, index) => {
      lines.push(`### ${index + 1}. ${candidate.suggestedIntent}`);
      lines.push("");
      lines.push(`- Riesgo: ${candidate.riskLevel}`);
      lines.push(`- Modo: ${candidate.canAutoRespond ? "plantilla automatizable si coincide el contexto" : "sugerencia para agente"}`);
      lines.push(`- Chat ID: ${candidate.chatId}`);
      lines.push(`- Fecha MX: ${candidate.dateMx}`);
      lines.push(`- Confirmacion del cliente: ${candidate.customerConfirmed ? candidate.confirmationFragment : "Sin confirmacion encontrada"}`);
      lines.push(`- Link: ${candidate.chatLink}`);
      lines.push("");
      lines.push("**Situacion del cliente**");
      lines.push("");
      lines.push(blockquote(candidate.customerSituation));
      lines.push("");
      lines.push("**Respuesta real usada por Soporte 10**");
      lines.push("");
      lines.push(blockquote(candidate.realAgentResponse));
      lines.push("");
      lines.push("**Version limpia recomendada**");
      lines.push("");
      lines.push(blockquote(candidate.cleanRecommendedResponse));
      lines.push("");
      lines.push(`**Datos que debe pedir:** ${candidate.requiredData.join(", ")}`);
      lines.push("");
      lines.push(`**Cuando no usarla:** ${candidate.doNotUseWhen}`);
      lines.push("");
    });
  }
  return `${lines.join("\n")}\n`;
}

function blockquote(text) {
  return cleanText(text).split("\n").map((line) => `> ${line}`).join("\n");
}

function toCsv(items) {
  const headers = [
    "category",
    "suggestedIntent",
    "riskLevel",
    "canAutoRespond",
    "chatId",
    "dateMx",
    "customerSituation",
    "realAgentResponse",
    "cleanRecommendedResponse",
    "requiredData",
    "doNotUseWhen",
    "customerConfirmed",
    "confirmationFragment",
    "chatLink"
  ];
  return [
    headers.join(","),
    ...items.map((item) => headers.map((header) => csvCell(Array.isArray(item[header]) ? item[header].join("; ") : item[header])).join(","))
  ].join("\n");
}

function csvCell(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = true;
    } else {
      parsed[key] = next;
      i += 1;
    }
  }
  return parsed;
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function loadLocalEnv() {
  for (const file of [".env.local", ".env.vercel.local", ".env"]) {
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.startsWith("#")) continue;
      const equalsIndex = cleanLine.indexOf("=");
      if (equalsIndex <= 0) continue;
      const key = cleanLine.slice(0, equalsIndex).trim();
      let rawValue = cleanLine.slice(equalsIndex + 1).trim();
      if (!/^[A-Z0-9_]+$/.test(key)) continue;
      if (process.env[key]) continue;
      rawValue = rawValue.replace(/^['"]|['"]$/g, "");
      if (key === "LIVECHAT_BASIC_TOKEN" && !looksLikeBasicToken(rawValue)) {
        rawValue = extractTokenCandidate(rawValue);
      }
      process.env[key] = rawValue;
    }
  }
}

function looksLikeBasicToken(value) {
  return /^[A-Za-z0-9+/=_-]{40,}$/.test(String(value || "").trim());
}

function extractTokenCandidate(value) {
  const candidates = [...String(value || "").matchAll(/[A-Za-z0-9+/=:_-]{40,}/g)]
    .map((match) => match[0])
    .filter((candidate) => /^[A-Za-z0-9+/=_-]{40,}$/.test(candidate));
  return candidates.sort((a, b) => b.length - a.length)[0] || "";
}

function cleanText(value) {
  return String(value || "")
    .replace(/\u0000/g, "")
    .replace(/\u200e/g, "")
    .replace(/\u00a0/g, " ")
    .trim();
}

function normalizeText(value) {
  return cleanText(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function formatMxDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-MX", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  }).format(date);
}

function formatDatePart(value) {
  return new Date(value).toISOString().replace(/[:.]/g, "-").slice(0, 19);
}

function toLiveChatDate(value) {
  return new Date(value).toISOString().replace(/\.(\d{3})Z$/, ".$1000+00:00");
}

function slug(value) {
  return normalizeText(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "agente";
}
