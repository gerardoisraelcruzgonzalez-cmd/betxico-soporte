import crypto from "node:crypto";
import { evolveSupportCase } from "./case-orchestrator.js";
import { evaluateCaseResponsePolicy } from "./case-response-policy.js";
import { detectCustomerIdentityCorrection } from "./case-investigation-trace.js";
import { deterministicCaseReply } from "./case-decision-engine.js";

const MAX_MESSAGE_LENGTH = 2000;

export function createSimulatorCase({ customer = {}, ownerEmail = "", now, chatId } = {}) {
  const createdAt = validIso(now) || new Date().toISOString();
  const id = cleanChatId(chatId) || `simulator:${crypto.randomUUID()}`;
  const supportCase = evolveSupportCase(null, {
    chatId: id,
    customer: normalizeCustomer(customer),
    events: [{
      eventId: `simulator-welcome:${crypto.randomUUID()}`,
      role: "bot",
      text: "Hola, soy el asistente de prueba de Betxico. ¿En qué te puedo ayudar?",
      createdAt
    }],
    source: {
      type: "support_simulator",
      synthetic: true,
      ownerEmail: normalizeEmail(ownerEmail)
    },
    now: createdAt
  });
  return supportCase;
}

export function appendSimulatorEvent(caseRecord, input = {}) {
  requireSimulatorCase(caseRecord);
  const role = String(input.role || "").trim().toLowerCase();
  if (!new Set(["customer", "agent", "bot"]).has(role)) throw simulatorError("invalid_simulator_role", 400);
  const text = cleanText(input.text, MAX_MESSAGE_LENGTH);
  const attachments = normalizeAttachmentInput(input.attachments);
  if (!text && !attachments.length) throw simulatorError("empty_simulator_message", 400);
  const createdAt = validIso(input.now) || new Date().toISOString();
  const correction = role === "customer"
    ? detectCustomerIdentityCorrection(text, caseRecord.customer)
    : null;
  const baseCase = correction ? applyIdentityCorrection(caseRecord, correction, createdAt) : caseRecord;
  return evolveSupportCase(baseCase, {
    chatId: caseRecord.chatId,
    customer: baseCase.customer,
    events: [{
      eventId: `simulator:${crypto.randomUUID()}`,
      role,
      text,
      createdAt,
      ...(attachments.length ? { attachments } : {})
    }],
    source: baseCase.source,
    now: createdAt
  });
}

export function selectSimulatorReply(caseRecord, draft = {}, options = {}) {
  requireSimulatorCase(caseRecord);
  const operationalRoute = String(caseRecord.operationalDecision?.route || "");
  // The model may improve an explanation, but it must not replace an already
  // verified operational next step with a vague or contradictory answer.
  const prescribed = new Set([
    "kyc_document_required",
    "kyc_updated_withdrawal_ready",
    "identify_withdrawal",
    "withdrawal_awaiting_approval"
  ])
    .has(operationalRoute)
    ? deterministicCaseReply(caseRecord)
    : "";
  const candidate = cleanText(prescribed || draft.customerDraft, 1600)
    || progressiveFallback(caseRecord);
  const customerText = containsInternalOperations(candidate)
    ? customerSafeReply(caseRecord)
    : candidate;
  const policy = evaluateCaseResponsePolicy(caseRecord, customerText, { now: options.now });
  if (policy.ok) return {
    text: customerText,
    policy,
    replaced: customerText !== candidate,
    reason: customerText !== candidate ? "internal_operations_not_customer_facing" : "allowed"
  };
  return {
    text: progressiveFallback(caseRecord),
    policy,
    replaced: true
  };
}

function containsInternalOperations(text = "") {
  return /\b(?:atena|jira|slack|lista\s*7|ticket(?:s)?|fuente(?:s)?\s+operativa(?:s)?|consulta(?:s)?\s+interna(?:s)?|expediente|transacciones\s+debo|debere\s+revisar|voy\s+a\s+revisar\s+(?:en|las)\s+(?:lista|fuente|herramienta)|datos?\s+no\s+disponible(?:s)?\s+en\s+(?:jira|slack))\b/iu.test(text);
}

function customerSafeReply(caseRecord = {}) {
  const route = String(caseRecord.operationalDecision?.route || "");
  if (route === "withdrawal_awaiting_approval") return deterministicCaseReply(caseRecord);
  if (route === "withdrawal_in_analysis") {
    return "Tu retiro continúa en revisión. Por ahora no necesitas realizar ninguna acción adicional; cuando finalice la validación, seguirá el proceso correspondiente. El tiempo puede variar, por lo que no podemos indicarte una hora exacta de acreditación.";
  }
  if (route === "withdrawal_paid") {
    return "Tu retiro ya se encuentra en proceso de pago. La acreditación puede depender de los tiempos de la institución receptora; si no se refleja después del plazo habitual, vuelve a escribirnos para revisarlo contigo.";
  }
  if (route === "kyc_document_required" || route === "kyc_updated_withdrawal_ready") {
    return deterministicCaseReply(caseRecord);
  }
  return progressiveFallback(caseRecord);
}

function progressiveFallback(caseRecord = {}) {
  const question = cleanText(caseRecord.missingData?.[0]?.question, 260);
  if (question) return `Para revisarlo sin adivinar, ${question.charAt(0).toLowerCase()}${question.slice(1)}`;
  const known = cleanText(caseRecord.operationalDecision?.customerMessage, 1000);
  if (known) return `${known} Si tienes el monto, la fecha o el mensaje mostrado en la plataforma, compártemelo para continuar la revisión.`;
  return "Ya inicié la revisión con las fuentes disponibles. Para avanzar sin adivinar, compárteme el monto, la fecha y el mensaje que te muestra la plataforma.";
}

export function prepareSimulatorManualReply(caseRecord, text, options = {}) {
  const candidate = cleanText(text, MAX_MESSAGE_LENGTH);
  if (!candidate) throw simulatorError("empty_simulator_message", 400);
  const reply = selectSimulatorReply(caseRecord, { customerDraft: candidate }, options);
  if (reply.replaced) throw simulatorError("simulator_agent_message_not_verified", 409);
  return reply;
}

export function assertSimulatorOwner(caseRecord, accountEmail) {
  requireSimulatorCase(caseRecord);
  if (normalizeEmail(caseRecord.source?.ownerEmail) !== normalizeEmail(accountEmail)) {
    throw simulatorError("simulator_case_not_owned", 403);
  }
  return true;
}

export function simulatorConversationView(caseRecord = {}) {
  requireSimulatorCase(caseRecord);
  return {
    chatId: caseRecord.chatId,
    revision: Number(caseRecord.revision || 0),
    customer: {
      email: normalizeEmail(caseRecord.customer?.email),
      authId: cleanText(caseRecord.customer?.authId, 80),
      name: cleanText(caseRecord.customer?.name, 120)
    },
    state: cleanText(caseRecord.state, 80),
    workflow: caseRecord.workflow || {},
    nextAction: caseRecord.nextAction || {},
    evidence: caseRecord.evidence || {},
    aiUsage: normalizeAiUsageLedger(caseRecord.aiUsage),
    identityCorrections: Array.isArray(caseRecord.identityCorrections) ? caseRecord.identityCorrections : [],
    transcript: (Array.isArray(caseRecord.events) ? caseRecord.events : []).map((event) => ({
      id: cleanText(event.eventKey || event.eventId, 180),
      role: simulatorPublicRole(event.role),
      text: cleanText(event.text, MAX_MESSAGE_LENGTH),
      createdAt: validIso(event.createdAt),
      attachments: (Array.isArray(event.attachments) ? event.attachments : []).map((attachment) => ({
        id: cleanText(attachment.id, 180),
        kind: cleanText(attachment.kind, 20),
        name: cleanText(attachment.name, 180),
        mimeType: cleanText(attachment.mimeType, 120),
        size: Number.isSafeInteger(attachment.size) ? attachment.size : null
      }))
    }))
  };
}

export function appendSimulatorAiUsage(caseRecord, usage = {}, now) {
  requireSimulatorCase(caseRecord);
  const previous = normalizeAiUsageLedger(caseRecord.aiUsage);
  const call = {
    provider: cleanText(usage.provider, 40),
    model: cleanText(usage.model, 100),
    inputTokens: nonNegativeInteger(usage.inputTokens),
    outputTokens: nonNegativeInteger(usage.outputTokens),
    cachedInputTokens: nonNegativeInteger(usage.cachedInputTokens),
    reasoningTokens: nonNegativeInteger(usage.reasoningTokens),
    totalTokens: nonNegativeInteger(usage.totalTokens),
    estimatedCostUsd: nullableCost(usage.estimatedCostUsd),
    createdAt: validIso(now) || new Date().toISOString()
  };
  return {
    ...caseRecord,
    aiUsage: {
      calls: previous.calls + 1,
      inputTokens: previous.inputTokens + call.inputTokens,
      outputTokens: previous.outputTokens + call.outputTokens,
      cachedInputTokens: previous.cachedInputTokens + call.cachedInputTokens,
      reasoningTokens: previous.reasoningTokens + call.reasoningTokens,
      totalTokens: previous.totalTokens + call.totalTokens,
      estimatedCostUsd: roundCost(previous.estimatedCostUsd + (call.estimatedCostUsd || 0)),
      history: [...previous.history, call].slice(-30)
    }
  };
}

function applyIdentityCorrection(caseRecord, correction, changedAt) {
  const customer = { ...caseRecord.customer, [correction.field]: correction.nextValue };
  return {
    ...caseRecord,
    customer,
    systemFacts: {
      ...(caseRecord.systemFacts || {}),
      caseJiraLookup: null,
      caseSlackLookup: null,
      caseKycReview: null,
      caseAtenaLookup: null,
      caseKycLookup: null,
      caseKnowledgeLookup: null
    },
    operationalDecision: null,
    identityCorrections: [
      ...(Array.isArray(caseRecord.identityCorrections) ? caseRecord.identityCorrections : []),
      { ...correction, changedAt }
    ].slice(-10)
  };
}

function simulatorPublicRole(value) {
  const role = String(value || "").trim().toLowerCase();
  if (["customer", "visitor"].includes(role)) return "customer";
  if (role === "agent") return "agent";
  return "assistant";
}

function normalizeCustomer(customer) {
  const email = normalizeEmail(customer.email);
  if (!email) throw simulatorError("invalid_customer_email", 400);
  return {
    email,
    authId: cleanText(customer.authId, 80),
    name: cleanText(customer.name, 120),
    liveChatCustomerId: ""
  };
}

function normalizeAttachmentInput(value) {
  return (Array.isArray(value) ? value : []).slice(0, 6).map((attachment) => ({
    id: `simulator:${crypto.randomBytes(12).toString("hex")}`,
    type: String(attachment?.mimeType || "").startsWith("image/") ? "image" : "file",
    name: cleanText(attachment?.name, 180),
    mimeType: cleanText(attachment?.mimeType, 120),
    size: Number.isSafeInteger(Number(attachment?.size)) ? Number(attachment.size) : null,
    source: "support_simulator"
  }));
}

function requireSimulatorCase(caseRecord) {
  if (caseRecord?.source?.type !== "support_simulator" || caseRecord?.source?.synthetic !== true) {
    throw simulatorError("simulator_case_required", 409);
  }
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) ? email : "";
}

function cleanChatId(value) {
  const id = String(value || "").trim().slice(0, 180);
  return /^simulator:[A-Za-z0-9_.:-]+$/u.test(id) ? id : "";
}

function cleanText(value, maxLength) {
  return String(value || "").replace(/\u0000/gu, "").replace(/\s+/gu, " ").trim().slice(0, maxLength);
}

function validIso(value) {
  const text = String(value || "").trim();
  return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : "";
}

function normalizeAiUsageLedger(value = {}) {
  return {
    calls: nonNegativeInteger(value.calls),
    inputTokens: nonNegativeInteger(value.inputTokens),
    outputTokens: nonNegativeInteger(value.outputTokens),
    cachedInputTokens: nonNegativeInteger(value.cachedInputTokens),
    reasoningTokens: nonNegativeInteger(value.reasoningTokens),
    totalTokens: nonNegativeInteger(value.totalTokens),
    estimatedCostUsd: roundCost(value.estimatedCostUsd),
    history: Array.isArray(value.history) ? value.history.slice(-30) : []
  };
}

function nonNegativeInteger(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : 0;
}

function nullableCost(value) {
  return Number.isFinite(Number(value)) ? roundCost(value) : null;
}

function roundCost(value) {
  return Math.round(Math.max(0, Number(value) || 0) * 1_000_000) / 1_000_000;
}

function simulatorError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
