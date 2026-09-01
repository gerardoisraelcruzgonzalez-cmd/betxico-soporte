import { updateSupportCase } from "./case-store.js";
import {
  SUPPORT_CASE_WORKFLOWS,
  UNKNOWN_SUPPORT_CASE_WORKFLOW,
  classifySupportCase,
  deriveCaseFacts,
  normalizeForSearch,
  normalizeSystemCheckKey
} from "./case-workflows.js";
import {
  extractLiveChatCaseInput,
  isCustomerCaseRole,
  mergeCaseEvents
} from "./livechat-case-parser.js";
import {
  caseDecisionNextAction,
  evaluateOperationalCase
} from "./case-decision-engine.js";

const CASE_SCHEMA_VERSION = 2;
const MAX_DECISION_HISTORY = 30;

export { classifySupportCase, extractLiveChatCaseInput };

export const CASE_STATES = Object.freeze({
  NEW: "new",
  IDENTIFIED: "identified",
  CLASSIFIED: "classified",
  WAITING_EVIDENCE: "waiting_evidence",
  INVESTIGATING: "investigating",
  WAITING_CUSTOMER: "waiting_customer",
  WAITING_APPROVAL: "waiting_approval",
  ESCALATED: "escalated",
  RESOLVED: "resolved"
});

export async function orchestrateLiveChatCase(event, options = {}) {
  const input = extractLiveChatCaseInput(event, options);
  if (!input.chatId || (!input.events.length && !hasIdentity(input.customer))) {
    return null;
  }

  return updateSupportCase(input.chatId, (existing) => evolveSupportCase(existing, input));
}

export function evolveSupportCase(existing, input = {}) {
  const now = validIso(input.now) || new Date().toISOString();
  const chatId = clean(input.chatId || existing?.chatId).slice(0, 180);
  if (!chatId) throw new Error("missing_chat_id");

  const previous = normalizeExistingCase(existing, chatId, now);
  const events = mergeCaseEvents(previous.events, input.events || []);
  const evidence = summarizeCaseEvidence(events, previous.evidence);
  const customer = mergeCustomer(previous.customer, input.customer || {});
  const identityChanged = caseIdentityChanged(previous.customer, customer);
  const customerText = events
    .filter((event) => isCustomerCaseRole(event.role))
    .map((event) => event.text)
    .join("\n")
    .replace(/\s+/gu, " ")
    .trim();

  if (!customerText) {
    return finalizeCase(previous, {
      chatId,
      customer,
      events,
      evidence,
      state: hasIdentity(customer) ? CASE_STATES.IDENTIFIED : CASE_STATES.NEW,
      workflow: emptyWorkflowSummary(),
      facts: previous.facts,
      systemFacts: previous.systemFacts,
      missingData: [],
      pendingChecks: [],
      nextAction: {
        type: "await_customer_message",
        message: "Esperar a que el cliente describa el problema.",
        requiresHumanApproval: false
      },
      now,
      source: input.source
    });
  }

  const classification = selectClassification(previous, customerText);
  const facts = {
    ...normalizeFacts(previous.facts),
    ...deriveCaseFacts(customerText, customer),
    ...normalizeFacts(input.facts)
  };
  const systemFacts = {
    ...(identityChanged ? {} : normalizeFacts(previous.systemFacts)),
    ...normalizeFacts(input.systemFacts)
  };
  const missingData = findMissingCustomerData(classification.workflow, facts);
  const riskLevel = elevateRisk(classification.workflow.riskLevel, customerText);
  const workflow = {
    id: classification.workflow.id,
    category: classification.workflow.category,
    confidence: classification.confidence,
    riskLevel,
    matchedSignals: classification.matchedSignals,
    requiresHumanApproval: classification.workflow.humanApproval,
    preserved: classification.preserved === true
  };
  const decisionInput = {
    ...previous,
    customer,
    workflow,
    facts,
    systemFacts,
    missingData,
    evidence
  };
  const operationalDecision = evaluateOperationalCase(decisionInput, { now });
  const decisionAction = caseDecisionNextAction(decisionInput, operationalDecision);
  const pendingChecks = decisionAction
    ? (decisionAction.checks || [])
    : classification.workflow.systemChecks
      .filter((check) => systemFacts[normalizeSystemCheckKey(check)] !== true);
  const nextAction = decisionAction || chooseNextAction({
    workflow: classification.workflow,
    missingData,
    pendingChecks,
    riskLevel
  });
  const state = chooseCaseState({
    missingData,
    pendingChecks,
    nextAction,
    customer
  });
  return finalizeCase(previous, {
    chatId,
    customer,
    events,
    evidence,
    state,
    workflow,
    facts,
    systemFacts,
    missingData,
    pendingChecks,
    operationalDecision,
    nextAction,
    now,
    source: input.source
  });
}

export function publicCaseSummary(caseRecord) {
  if (!caseRecord) return null;
  return {
    chatId: caseRecord.chatId || "",
    state: caseRecord.state || CASE_STATES.NEW,
    workflow: caseRecord.workflow || emptyWorkflowSummary(),
    missingData: Array.isArray(caseRecord.missingData) ? caseRecord.missingData : [],
    pendingChecks: Array.isArray(caseRecord.pendingChecks) ? caseRecord.pendingChecks : [],
    operationalDecision: caseRecord.operationalDecision || null,
    nextAction: caseRecord.nextAction || null,
    evidence: publicEvidenceSummary(caseRecord.evidence),
    responseAutomation: publicResponseAutomation(caseRecord.responseAutomation),
    revision: Number(caseRecord.revision || 0),
    updatedAt: caseRecord.updatedAt || ""
  };
}

export function reviewCaseEvidence(caseRecord, { attachmentIds = [], reviewedBy = "", now } = {}) {
  if (!caseRecord?.chatId) throw caseEvidenceError("invalid_support_case");
  const reviewedAt = validIso(now) || new Date().toISOString();
  const requestedIds = [...new Set(
    (Array.isArray(attachmentIds) ? attachmentIds : [])
      .map((id) => clean(id).slice(0, 180))
      .filter(Boolean)
  )];
  if (!requestedIds.length) throw caseEvidenceError("missing_attachment_ids");

  const availableIds = new Set(
    (Array.isArray(caseRecord.evidence?.attachments) ? caseRecord.evidence.attachments : [])
      .map((attachment) => clean(attachment?.id).slice(0, 180))
      .filter(Boolean)
  );
  const unknownIds = requestedIds.filter((id) => !availableIds.has(id));
  if (unknownIds.length) throw caseEvidenceError("case_attachment_not_found", 404);

  const previousReviews = normalizeEvidenceReviews(caseRecord.evidence?.reviews);
  const reviewer = normalizeEmail(reviewedBy);
  const reviews = { ...previousReviews };
  for (const id of requestedIds) {
    reviews[id] = {
      reviewedAt,
      reviewedBy: reviewer
    };
  }
  const reviewedAttachmentIds = [...new Set([
    ...(caseRecord.evidence?.reviewedAttachmentIds || []),
    ...requestedIds
  ])];

  return {
    ...caseRecord,
    evidence: summarizeCaseEvidence(caseRecord.events || [], {
      ...caseRecord.evidence,
      reviewedAttachmentIds,
      reviews
    }),
    revision: Number(caseRecord.revision || 0) + 1,
    updatedAt: reviewedAt
  };
}

function selectClassification(previous, customerText) {
  const classification = classifySupportCase(customerText);
  // A customer often answers a withdrawal request with just "INE" or
  // "documento". That is evidence for the active withdrawal branch, not a
  // new standalone KYC case.
  if (previous.workflow?.id === "withdrawal" && classification.workflow.id === "kyc_identity") {
    const previousDefinition = SUPPORT_CASE_WORKFLOWS.find((item) => item.id === previous.workflow.id);
    if (previousDefinition) {
      return {
        workflow: previousDefinition,
        confidence: previous.workflow.confidence || 0.6,
        matchedSignals: previous.workflow.matchedSignals || [],
        preserved: true
      };
    }
  }
  if (classification.workflow.id !== "unknown" || !previous.workflow?.id || previous.workflow.id === "unknown") {
    return classification;
  }

  const previousDefinition = SUPPORT_CASE_WORKFLOWS.find((item) => item.id === previous.workflow.id);
  if (!previousDefinition) return classification;

  return {
    workflow: previousDefinition,
    confidence: previous.workflow.confidence || 0.6,
    matchedSignals: previous.workflow.matchedSignals || [],
    preserved: true
  };
}

function normalizeExistingCase(existing, chatId, now) {
  if (!existing || typeof existing !== "object") {
    return {
      schemaVersion: CASE_SCHEMA_VERSION,
      chatId,
      state: CASE_STATES.NEW,
      customer: {},
      workflow: emptyWorkflowSummary(),
      facts: {},
      systemFacts: {},
      events: [],
      evidence: emptyEvidenceSummary(),
      operationalDecision: null,
      decisionHistory: [],
      revision: 0,
      automation: safeAutomationPolicy(),
      createdAt: now,
      updatedAt: now
    };
  }

  return {
    ...existing,
    schemaVersion: CASE_SCHEMA_VERSION,
    chatId,
    customer: existing.customer || {},
    workflow: existing.workflow || emptyWorkflowSummary(),
    facts: normalizeFacts(existing.facts),
    systemFacts: normalizeFacts(existing.systemFacts),
    events: Array.isArray(existing.events) ? existing.events : [],
    evidence: normalizeEvidence(existing.evidence, existing.events),
    operationalDecision: normalizeOperationalDecision(existing.operationalDecision),
    decisionHistory: Array.isArray(existing.decisionHistory) ? existing.decisionHistory : [],
    revision: Number(existing.revision || 0),
    automation: safeAutomationPolicy(),
    createdAt: validIso(existing.createdAt) || now,
    updatedAt: validIso(existing.updatedAt) || now
  };
}

function finalizeCase(previous, update) {
  const decision = {
    state: update.state,
    workflowId: update.workflow.id,
    riskLevel: update.workflow.riskLevel,
    missingData: update.missingData,
    pendingChecks: update.pendingChecks,
    operationalRoute: update.operationalDecision?.route || "",
    nextActionType: update.nextAction?.type || "",
    decidedAt: update.now
  };
  const previousDecision = previous.decisionHistory.at(-1);
  const decisionHistory = sameDecision(previousDecision, decision)
    ? previous.decisionHistory
    : [...previous.decisionHistory, decision].slice(-MAX_DECISION_HISTORY);

  return {
    ...previous,
    schemaVersion: CASE_SCHEMA_VERSION,
    chatId: update.chatId,
    state: update.state,
    customer: update.customer,
    workflow: update.workflow,
    facts: normalizeFacts(update.facts),
    systemFacts: normalizeFacts(update.systemFacts),
    events: update.events,
    evidence: normalizeEvidence(update.evidence, update.events),
    missingData: update.missingData,
    pendingChecks: update.pendingChecks,
    operationalDecision: normalizeOperationalDecision(update.operationalDecision),
    nextAction: update.nextAction,
    decisionHistory,
    automation: safeAutomationPolicy(),
    source: update.source || previous.source || {},
    revision: Number(previous.revision || 0) + 1,
    updatedAt: update.now
  };
}

function chooseCaseState({ missingData, pendingChecks, nextAction, customer }) {
  if (!hasIdentity(customer)) return CASE_STATES.WAITING_EVIDENCE;
  if (nextAction?.type === "clarify_issue") return CASE_STATES.WAITING_EVIDENCE;
  if (nextAction?.type === "request_human_approval") return CASE_STATES.WAITING_APPROVAL;
  if (nextAction?.type === "prepare_verified_response") return CASE_STATES.WAITING_APPROVAL;
  if (["investigate", "review_kyc"].includes(nextAction?.type)) return CASE_STATES.INVESTIGATING;
  if (nextAction?.type === "verify_withdrawal") return CASE_STATES.WAITING_EVIDENCE;
  if (missingData.length) return CASE_STATES.WAITING_EVIDENCE;
  if (pendingChecks.length) return CASE_STATES.INVESTIGATING;
  return CASE_STATES.CLASSIFIED;
}

function chooseNextAction({ workflow, missingData, pendingChecks, riskLevel }) {
  if (workflow.id === "unknown") {
    return {
      type: "clarify_issue",
      message: UNKNOWN_SUPPORT_CASE_WORKFLOW.requiredCustomerData[0].question,
      requiresHumanApproval: false
    };
  }
  if (missingData.length) {
    return {
      type: "collect_evidence",
      message: missingData[0].question,
      requiredField: missingData[0].key,
      requiresHumanApproval: false
    };
  }
  if (pendingChecks.length) {
    return {
      type: "investigate",
      message: `Revisar: ${pendingChecks.join(", ")}.`,
      checks: pendingChecks,
      requiresHumanApproval: false
    };
  }
  if (workflow.humanApproval || riskLevel === "high") {
    return {
      type: "request_human_approval",
      message: "La investigacion esta completa, pero cualquier accion requiere aprobacion humana.",
      requiresHumanApproval: true
    };
  }
  return {
    type: "prepare_response",
    message: "Preparar una respuesta sustentada por las fuentes consultadas.",
    requiresHumanApproval: false
  };
}

function findMissingCustomerData(workflow, facts) {
  return workflow.requiredCustomerData
    .filter((field) => !factPresent(facts[field.key]))
    .map((field) => ({ ...field }));
}

function mergeCustomer(existing, incoming) {
  return {
    liveChatCustomerId: clean(incoming.liveChatCustomerId || existing.liveChatCustomerId).slice(0, 180),
    authId: firstNumericId([incoming.authId, existing.authId]),
    email: normalizeEmail(incoming.email || existing.email),
    name: clean(incoming.name || existing.name).slice(0, 180)
  };
}

function caseIdentityChanged(previous = {}, current = {}) {
  const previousEmail = normalizeEmail(previous.email);
  const currentEmail = normalizeEmail(current.email);
  const previousAuthId = firstNumericId([previous.authId, previous.liveChatCustomerId]);
  const currentAuthId = firstNumericId([current.authId, current.liveChatCustomerId]);
  return Boolean(
    (previousEmail && currentEmail && previousEmail !== currentEmail)
    || (previousAuthId && currentAuthId && previousAuthId !== currentAuthId)
  );
}

function normalizeFacts(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => /^[A-Za-z][A-Za-z0-9_]{0,80}$/.test(key))
      .map(([key, item]) => [key, normalizeFactValue(item)])
  );
}

function normalizeOperationalDecision(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return {
    version: Number(value.version || 1),
    route: clean(value.route).slice(0, 100),
    title: clean(value.title).slice(0, 180),
    source: clean(value.source).slice(0, 100),
    sourceReference: clean(value.sourceReference).slice(0, 120),
    reason: clean(value.reason).slice(0, 1200),
    documentRequirements: (Array.isArray(value.documentRequirements) ? value.documentRequirements : [])
      .slice(0, 8)
      .map((item) => ({
        key: clean(item?.key).slice(0, 80),
        label: clean(item?.label).slice(0, 180)
      }))
      .filter((item) => item.key && item.label),
    requiredSources: cleanStringList(value.requiredSources, 8, 80),
    completedSources: cleanStringList(value.completedSources, 8, 80),
    unavailableSources: cleanStringList(value.unavailableSources, 8, 80),
    conflicting: value.conflicting === true,
    customerMessage: clean(value.customerMessage).slice(0, 1000),
    evaluatedAt: validIso(value.evaluatedAt)
  };
}

function cleanStringList(value, limit, maxLength) {
  return (Array.isArray(value) ? value : [])
    .map((item) => clean(item).slice(0, maxLength))
    .filter(Boolean)
    .slice(0, limit);
}

function normalizeFactValue(value) {
  if (typeof value === "boolean" || typeof value === "number") return value;
  if (Array.isArray(value)) return value.map(normalizeFactValue).slice(0, 30);
  if (value && typeof value === "object") return normalizeFacts(value);
  return clean(value).slice(0, 500);
}

function factPresent(value) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return Number.isFinite(value);
  if (Array.isArray(value)) return value.length > 0;
  return Boolean(clean(value));
}

function summarizeCaseEvidence(events = [], existing = {}) {
  const reviewedIds = new Set(
    Array.isArray(existing.reviewedAttachmentIds)
      ? existing.reviewedAttachmentIds.map((id) => clean(id)).filter(Boolean)
      : []
  );
  const reviews = normalizeEvidenceReviews(existing.reviews);
  const seen = new Set();
  const attachments = [];
  for (const event of events) {
    for (const attachment of Array.isArray(event?.attachments) ? event.attachments : []) {
      const id = clean(attachment?.id).slice(0, 180);
      if (!id || seen.has(id)) continue;
      seen.add(id);
      attachments.push({
        id,
        kind: ["image", "file"].includes(attachment.kind) ? attachment.kind : "file",
        name: clean(attachment.name).slice(0, 180),
        mimeType: clean(attachment.mimeType).slice(0, 120),
        size: Number.isSafeInteger(attachment.size) && attachment.size >= 0 ? attachment.size : null,
        source: attachment.source === "support_simulator" ? "support_simulator" : "livechat",
        receivedAt: validIso(attachment.receivedAt) || validIso(event.createdAt) || "",
        reviewStatus: reviewedIds.has(id) ? "reviewed" : "received",
        reviewedAt: reviewedIds.has(id) ? validIso(reviews[id]?.reviewedAt) : "",
        reviewedBy: reviewedIds.has(id) ? normalizeEmail(reviews[id]?.reviewedBy) : ""
      });
    }
  }
  const reviewedCount = attachments.filter((attachment) => attachment.reviewStatus === "reviewed").length;
  return {
    attachments: attachments.slice(-30),
    reviewedAttachmentIds: [...reviewedIds].filter((id) => seen.has(id)).slice(-30),
    reviews: Object.fromEntries(
      [...reviewedIds]
        .filter((id) => seen.has(id) && reviews[id])
        .slice(-30)
        .map((id) => [id, reviews[id]])
    ),
    receivedCount: attachments.length,
    reviewedCount,
    pendingReviewCount: Math.max(0, attachments.length - reviewedCount)
  };
}

function normalizeEvidence(evidence, events) {
  return summarizeCaseEvidence(events, evidence || {});
}

function publicEvidenceSummary(evidence = {}) {
  const attachments = Array.isArray(evidence.attachments) ? evidence.attachments : [];
  return {
    receivedCount: Number(evidence.receivedCount || attachments.length || 0),
    reviewedCount: Number(evidence.reviewedCount || 0),
    pendingReviewCount: Number(evidence.pendingReviewCount || 0),
    kinds: [...new Set(attachments.map((attachment) => attachment.kind).filter(Boolean))]
  };
}

function publicResponseAutomation(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return {
    state: clean(value.state).slice(0, 80),
    route: clean(value.route).slice(0, 100),
    source: clean(value.source).slice(0, 80),
    reason: clean(value.reason).slice(0, 180),
    sentAt: validIso(value.sentAt),
    verified: value.verified === true,
    updatedAt: validIso(value.updatedAt)
  };
}

function emptyEvidenceSummary() {
  return {
    attachments: [],
    reviewedAttachmentIds: [],
    reviews: {},
    receivedCount: 0,
    reviewedCount: 0,
    pendingReviewCount: 0
  };
}

function normalizeEvidenceReviews(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value)
      .slice(-30)
      .map(([id, review]) => [clean(id).slice(0, 180), {
        reviewedAt: validIso(review?.reviewedAt),
        reviewedBy: normalizeEmail(review?.reviewedBy)
      }])
      .filter(([id]) => Boolean(id))
  );
}

function caseEvidenceError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function safeAutomationPolicy() {
  return {
    mode: "suggest_only",
    canSendAutomatically: false,
    canExecuteSensitiveAction: false,
    requiresVerifiedToolResult: true
  };
}

function emptyWorkflowSummary() {
  return {
    id: "",
    category: "",
    confidence: 0,
    riskLevel: "medium",
    matchedSignals: [],
    requiresHumanApproval: false,
    preserved: false
  };
}

function sameDecision(left, right) {
  if (!left || !right) return false;
  return JSON.stringify({
    state: left.state,
    workflowId: left.workflowId,
    riskLevel: left.riskLevel,
    missingData: left.missingData,
    pendingChecks: left.pendingChecks,
    operationalRoute: left.operationalRoute,
    nextActionType: left.nextActionType
  }) === JSON.stringify({
    state: right.state,
    workflowId: right.workflowId,
    riskLevel: right.riskLevel,
    missingData: right.missingData,
    pendingChecks: right.pendingChecks,
    operationalRoute: right.operationalRoute,
    nextActionType: right.nextActionType
  });
}

function elevateRisk(baseRisk, text) {
  const normalized = normalizeForSearch(text);
  if (/\b(?:fraude|robo|estafa|demanda|profeco|condusef|abogado|suplantacion)\b/u.test(normalized)) {
    return "high";
  }
  return ["low", "medium", "high"].includes(baseRisk) ? baseRisk : "medium";
}

function normalizeEmail(value) {
  const email = clean(value).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email.slice(0, 254) : "";
}

function firstNumericId(values) {
  for (const value of values || []) {
    const candidate = clean(value);
    if (/^\d{3,20}$/.test(candidate)) return candidate;
  }
  return "";
}

function hasIdentity(customer) {
  return Boolean(customer?.email || customer?.authId || customer?.liveChatCustomerId);
}

function validIso(value) {
  const cleanValue = clean(value);
  return cleanValue && Number.isFinite(Date.parse(cleanValue)) ? new Date(cleanValue).toISOString() : "";
}

function clean(value) {
  return String(value || "").replace(/\u0000/gu, "").replace(/\s+/gu, " ").trim();
}
