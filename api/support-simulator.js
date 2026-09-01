import crypto from "node:crypto";
import { readJson, sendJson } from "../lib/http.js";
import { authenticateAccount, requireCurrentAccount } from "../lib/account-store.js";
import { isSupportAdmin } from "../lib/remote-config.js";
import { writeAuditLog } from "../lib/audit.js";
import {
  addJiraIssueComment,
  findJiraIssueComment,
  searchJiraTickets,
  verifyJiraIssueComment
} from "../lib/jira.js";
import {
  findSlackApprovedMessage,
  lookupSlackListCache,
  sendSlackApprovedMessage,
  verifySlackApprovedMessage
} from "../lib/slack.js";
import { createKycReviewStore } from "../lib/kyc-review-store.js";
import { createCaseReadTools } from "../lib/case-read-tools.js";
import { createAtenaJob, getJob as getAtenaJob } from "../lib/atena-bridge-store.js";
import { createKycJob, getKycJob } from "../lib/kyc-bridge-store.js";
import { getSupportSimulatorCase, updateSupportSimulatorCase } from "../lib/case-store.js";
import { evolveSupportCase, reviewCaseEvidence } from "../lib/case-orchestrator.js";
import { generateCaseDraft } from "../lib/case-draft.js";
import { evaluateCaseActionContext } from "../lib/case-action-context.js";
import {
  approveCaseAction,
  createCaseActionProposal,
  publicCaseToolResult
} from "../lib/case-operation-contracts.js";
import { createCaseActionStore } from "../lib/case-action-store.js";
import {
  executeCaseAction,
  reconcileCaseActionExecution,
  verifyCaseActionExecution
} from "../lib/case-action-executor.js";
import { appendVerifiedCaseAction } from "../lib/case-verified-actions.js";
import { buildCaseInvestigationTrace } from "../lib/case-investigation-trace.js";
import { getCaseKnowledgeMetadata, lookupCaseKnowledge } from "../lib/case-knowledge.js";
import {
  deterministicCaseReply,
  isAcknowledgementWithoutNewEvidence,
  shouldLookupAtenaForCase,
  shouldLookupKycEvidenceForCase,
  shouldLookupKycForCase
} from "../lib/case-decision-engine.js";
import {
  appendSimulatorEvent,
  appendSimulatorAiUsage,
  assertSimulatorOwner,
  createSimulatorCase,
  prepareSimulatorManualReply,
  selectSimulatorReply,
  simulatorConversationView
} from "../lib/support-simulator.js";
import {
  requireSimulatorRealAction,
  requireSimulatorSameOrigin,
  requireSupportSimulatorAccess,
  isSimulatorKnowledgeEnabled,
  simulatorActionMarker,
  simulatorCapabilities
} from "../lib/simulator-policy.js";

const ACTIVE_ACTION_STATUSES = new Set(["proposed", "approved", "executing", "verification_pending"]);
const actionStore = createCaseActionStore({
  recordPrefix: "support:simulator-action:v1:",
  lockPrefix: "support:simulator-action-lock:v1:",
  latestPrefix: "support:simulator-action-latest:v1:",
  retentionSeconds: 60 * 60 * 24
});
const kycReviewStore = createKycReviewStore();

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  try {
    requireSimulatorSameOrigin(req);
    const account = await requireCurrentAccount(req);
    requireSupportSimulatorAccess(account, {
      isAdmin: await isSupportAdmin(account.email)
    });
    const payload = await readJson(req, { maxBytes: 64 * 1024 });
    const action = String(req.query?.action || payload.action || "status").trim();

    if (action === "status") return sendSimulatorStatus(res, account);
    if (action === "start") return await handleStart(res, account, payload);
    if (action === "state") return await handleState(res, account, payload);
    if (action === "message") return await handleMessage(res, account, payload);
    if (action === "refresh") return await handleRefresh(res, account, payload);
    if (action === "evidence-review") return await handleEvidenceReview(res, account, payload);
    if (action === "kyc-review") return await handleKycReview(res, account, payload);
    if (action === "action-propose") return await handleActionPropose(res, account, payload);
    if (action === "action-approve") return await handleActionApprove(res, account, payload);
    if (action === "action-execute") return await handleActionExecute(res, account, payload);

    return sendJson(res, 400, { ok: false, error: "unsupported_simulator_action" });
  } catch (error) {
    await writeAuditLog({
      type: "support_simulator_failed",
      status: "error",
      error: error.message || "support_simulator_failed"
    }).catch(() => null);
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "support_simulator_failed"
    });
  }
}

function sendSimulatorStatus(res, account) {
  return sendJson(res, 200, {
    ok: true,
    account: { email: account.email, displayName: account.displayName || account.email },
    capabilities: simulatorCapabilities()
  });
}

async function handleStart(res, account, payload) {
  const supportCase = createSimulatorCase({
    customer: {
      email: payload.email,
      authId: payload.authId,
      name: payload.name
    },
    ownerEmail: account.email
  });
  const stored = await updateSupportSimulatorCase(supportCase.chatId, () => supportCase);
  const refreshed = await refreshSimulatorSources(stored, account);
  await auditSimulator("support_simulator_started", account, refreshed);
  return sendJson(res, 201, await simulatorPayload(refreshed));
}

async function handleState(res, account, payload) {
  const supportCase = await requireOwnedSimulatorCase(payload.chatId, account);
  return sendJson(res, 200, await simulatorPayload(supportCase));
}

async function handleRefresh(res, account, payload) {
  const supportCase = await requireOwnedSimulatorCase(payload.chatId, account);
  const activeAction = await actionStore.getLatestByChat(supportCase.chatId);
  if (ACTIVE_ACTION_STATUSES.has(activeAction?.status)) {
    return sendJson(res, 409, { ok: false, error: "case_action_already_active", action: activeAction });
  }
  const refreshed = await refreshSimulatorSources(supportCase, account);
  await auditSimulator("support_simulator_refreshed", account, refreshed);
  return sendJson(res, 200, await simulatorPayload(refreshed));
}

async function handleMessage(res, account, payload) {
  const supportCase = await requireOwnedSimulatorCase(payload.chatId, account);
  const activeAction = await actionStore.getLatestByChat(supportCase.chatId);
  if (ACTIVE_ACTION_STATUSES.has(activeAction?.status)) {
    return sendJson(res, 409, { ok: false, error: "case_action_already_active", action: activeAction });
  }

  const role = String(payload.role || "customer").trim().toLowerCase();
  if (role === "agent") {
    const manualReply = prepareSimulatorManualReply(supportCase, payload.text);
    const answered = await updateSupportSimulatorCase(supportCase.chatId, (current) => appendSimulatorEvent(
      current || supportCase,
      { role: "agent", text: manualReply.text }
    ));
    await auditSimulator("support_simulator_agent_message_added", account, answered, {
      responsePolicy: manualReply.policy?.reason || "allowed"
    });
    return sendJson(res, 200, await simulatorPayload(answered));
  }
  if (role !== "customer") throw simulatorError("invalid_simulator_role", 400);

  const withCustomerMessage = await updateSupportSimulatorCase(supportCase.chatId, (current) => appendSimulatorEvent(
    current || supportCase,
    {
      role: "customer",
      text: payload.text,
      attachments: payload.attachments
    }
  ));
  const refreshed = await refreshSimulatorSources(withCustomerMessage, account, {
    waitForBridge: true
  });
  const acknowledgement = isAcknowledgementWithoutNewEvidence(payload.text, payload.attachments);
  const generated = acknowledgement
    ? {
        provider: "deterministic",
        model: "case-decision-engine-v1",
        usage: null,
        draft: {
          classification: refreshed.workflow?.id || "sin_clasificar",
          analysis: "El mensaje no agregó datos ni evidencia; se conservó la ruta vigente.",
          nextStep: refreshed.nextAction?.message || "Continuar la revisión vigente.",
          customerDraft: deterministicCaseReply(refreshed),
          suggestedAction: null,
          usedSources: [],
          warnings: [],
          requiresHumanReview: true,
          executable: false
        }
      }
    : await generateSimulatorDraft(refreshed);
  const reply = selectSimulatorReply(refreshed, generated.draft);
  const answered = await updateSupportSimulatorCase(refreshed.chatId, (current) => appendSimulatorEvent(
    generated.usage
      ? appendSimulatorAiUsage(current || refreshed, generated.usage, new Date().toISOString())
      : (current || refreshed),
    { role: "bot", text: reply.text }
  ));

  await auditSimulator("support_simulator_turn_completed", account, answered, {
    provider: generated.provider,
    model: generated.model,
    inputTokens: generated.usage?.inputTokens || 0,
    outputTokens: generated.usage?.outputTokens || 0,
    estimatedCostUsd: generated.usage?.estimatedCostUsd ?? null,
    responseReplaced: reply.replaced,
    suggestedActionType: generated.draft?.suggestedAction?.actionType || "",
    sourceStatus: sourceStatusSnapshot(answered)
  });
  return sendJson(res, 200, await simulatorPayload(answered, { draft: generated.draft }));
}

async function handleEvidenceReview(res, account, payload) {
  const supportCase = await requireOwnedSimulatorCase(payload.chatId, account);
  const attachmentIds = Array.isArray(payload.attachmentIds) ? payload.attachmentIds : [];
  const updated = await updateSupportSimulatorCase(supportCase.chatId, (current) => reviewCaseEvidence(current || supportCase, {
    attachmentIds,
    reviewedBy: account.email,
    now: new Date().toISOString()
  }));
  await auditSimulator("support_simulator_evidence_reviewed", account, updated, {
    attachmentCount: attachmentIds.length
  });
  return sendJson(res, 200, await simulatorPayload(updated));
}

async function handleKycReview(res, account, payload) {
  const supportCase = await requireOwnedSimulatorCase(payload.chatId, account);
  const status = String(payload.status || "").trim().toLowerCase();
  if (!new Set(["complete", "incomplete"]).has(status)) throw simulatorError("invalid_kyc_status", 400);
  if (status === "complete") {
    const received = Number(supportCase.evidence?.receivedCount || 0);
    const reviewed = Number(supportCase.evidence?.reviewedCount || 0);
    if (!received || reviewed < received) {
      throw simulatorError("kyc_evidence_review_required", 409);
    }
  }
  const review = await kycReviewStore.save({
    email: supportCase.customer?.email,
    status,
    customerName: supportCase.customer?.name,
    customerId: supportCase.customer?.authId,
    chatId: supportCase.chatId
  }, account);
  const refreshed = await refreshSimulatorSources(supportCase, account);
  await auditSimulator("support_simulator_kyc_review_recorded", account, refreshed, {
    kycStatus: review.status,
    reviewId: review.id
  });
  return sendJson(res, 200, await simulatorPayload(refreshed));
}

async function handleActionPropose(res, account, payload) {
  const supportCase = await requireOwnedSimulatorCase(payload.chatId, account);
  const existingAction = await actionStore.getLatestByChat(supportCase.chatId);
  if (ACTIVE_ACTION_STATUSES.has(existingAction?.status)) {
    return sendJson(res, 409, { ok: false, error: "case_action_already_active", action: existingAction });
  }
  const actionType = String(payload.actionType || "").trim().toLowerCase();
  const actionPayload = normalizeSimulatorActionPayload(actionType, payload, supportCase.chatId);
  const context = evaluateCaseActionContext(supportCase, actionType, actionPayload);
  if (!context.ok) throw simulatorError(context.reason, 409);
  const proposal = createCaseActionProposal({
    caseRecord: supportCase,
    actionType,
    payload: actionPayload,
    proposedBy: { type: "assistant", id: "support-simulator" },
    reason: "Acción de prueba propuesta por el simulador y pendiente de aprobación humana."
  });
  const record = await actionStore.propose(proposal);
  await auditSimulator("support_simulator_action_proposed", account, supportCase, {
    proposalId: proposal.proposalId,
    actionType
  });
  return sendJson(res, 200, await simulatorPayload(supportCase, { action: record }));
}

async function handleActionApprove(res, account, payload) {
  const record = await requireSimulatorAction(payload.proposalId, account);
  const approval = approveCaseAction(record.proposal, { email: account.email, role: "admin" });
  const approved = await actionStore.approve(record.proposalId, approval);
  const supportCase = await requireOwnedSimulatorCase(record.proposal.chatId, account);
  await auditSimulator("support_simulator_action_approved", account, supportCase, {
    proposalId: record.proposalId,
    actionType: record.proposal.actionType
  });
  return sendJson(res, 200, await simulatorPayload(supportCase, { action: approved }));
}

async function handleActionExecute(res, account, payload) {
  let record = await requireSimulatorAction(payload.proposalId, account);
  let supportCase = await requireOwnedSimulatorCase(record.proposal.chatId, account);
  requireSimulatorRealAction({
    caseRecord: supportCase,
    proposal: record.proposal,
    confirmation: payload.confirmation
  });
  await authenticateAccount(account.email, payload.pin);

  let result;
  if (record.status === "verification_pending") {
    result = await verifyCaseActionExecution({
      actionRecord: record,
      dependencies: buildSimulatorActionDependencies(account)
    });
  } else if (record.status === "executing") {
    result = await reconcileCaseActionExecution({
      actionRecord: record,
      dependencies: buildSimulatorActionDependencies(account)
    });
  } else {
    record = await actionStore.claimExecution(record.proposalId, {
      idempotencyKey: record.idempotencyKey,
      executingBy: { email: account.email }
    });
    result = await executeCaseAction({
      proposal: record.proposal,
      approval: record.approval,
      caseRecord: supportCase,
      dependencies: buildSimulatorActionDependencies(account)
    });
  }

  const completionStatus = result.verified === true
    ? "verified"
    : result.status === "verification_pending"
      ? "verification_pending"
      : "failed";
  const completed = await actionStore.completeExecution(record.proposalId, {
    status: completionStatus,
    idempotencyKey: record.idempotencyKey,
    result: {
      verified: result.verified === true,
      reason: result.reason,
      actionType: result.actionType,
      verificationRef: result.verificationRef
    },
    error: completionStatus === "failed" ? { code: result.reason || "case_action_failed" } : null
  });
  if (result.verified === true) {
    supportCase = await persistVerifiedAction(supportCase.chatId, result);
  }
  await auditSimulator("support_simulator_action_completed", account, supportCase, {
    proposalId: record.proposalId,
    actionType: record.proposal.actionType,
    resultStatus: completionStatus,
    verified: result.verified === true
  });
  return sendJson(res, 200, await simulatorPayload(supportCase, { action: completed, result }));
}

async function refreshSimulatorSources(supportCase, account, options = {}) {
  const query = {
    ...(supportCase.facts?.ticketKey ? { ticketKey: supportCase.facts.ticketKey } : {}),
    ...(supportCase.customer?.email ? { email: supportCase.customer.email } : {}),
    ...(supportCase.customer?.authId ? { authId: supportCase.customer.authId } : {})
  };
  const tools = createCaseReadTools({
    jiraSearch: (value) => searchJiraTickets(value, account),
    cacheLookup: lookupSlackListCache,
    kycLookup: (email) => kycReviewStore.findLatestByEmail(email),
    createAtenaJob,
    getAtenaJob,
    createKycJob,
    getKycJob
  });
  const results = await tools.lookupHistory(query);
  const historyCase = evolveSupportCase(supportCase, {
    chatId: supportCase.chatId,
    customer: supportCase.customer,
    events: [],
    systemFacts: {
      caseJiraLookup: results.jira,
      caseSlackLookup: results.slack,
      caseKycReview: null
    },
    source: supportCase.source,
    now: new Date().toISOString()
  });
  const evidenceInput = {
    ...query,
    ownerEmail: account.email,
    caseId: supportCase.chatId
  };
  let [atena, kyc, kycReview] = await Promise.all([
    shouldLookupAtenaForCase(historyCase)
      ? tools.lookupAtena({
          ...evidenceInput,
          previousEvidence: supportCase.systemFacts?.caseAtenaLookup
        })
      : null,
    shouldLookupKycEvidenceForCase(historyCase)
      ? tools.lookupKyc({
          ...evidenceInput,
          previousEvidence: supportCase.systemFacts?.caseKycLookup
        })
      : null,
    shouldLookupKycForCase(historyCase)
      ? tools.lookupKycReview(query)
      : null
  ]);
  if (options.waitForBridge === true) {
    // Atena and KYC are local authenticated browser jobs. Keep the customer turn
    // open long enough to receive their result instead of drafting from pending evidence.
    for (let attempt = 0; attempt < 4 && hasPendingBridgeEvidence(atena, kyc); attempt += 1) {
      [atena, kyc] = await Promise.all([
        isPendingBridgeEvidence(atena)
          ? tools.lookupAtena({ ...evidenceInput, previousEvidence: atena })
          : atena,
        isPendingBridgeEvidence(kyc)
          ? tools.lookupKyc({ ...evidenceInput, previousEvidence: kyc })
          : kyc
      ]);
    }
  }
  return updateSupportSimulatorCase(supportCase.chatId, (current) => evolveSupportCase(current || supportCase, {
    chatId: supportCase.chatId,
    customer: (current || supportCase).customer,
    events: [],
    systemFacts: {
      caseJiraLookup: results.jira,
      caseSlackLookup: results.slack,
      caseAtenaLookup: atena,
      caseKycLookup: kyc,
      caseKycReview: kycReview
    },
    source: supportCase.source,
    now: new Date().toISOString()
  }));
}

function hasPendingBridgeEvidence(...values) {
  return values.some(isPendingBridgeEvidence);
}

function isPendingBridgeEvidence(value) {
  return value?.status === "unavailable"
    && value?.error?.retryable === true
    && /_lookup_pending$/u.test(String(value?.error?.code || ""));
}

async function generateSimulatorDraft(supportCase) {
  try {
    const knowledge = isSimulatorKnowledgeEnabled()
      ? lookupCaseKnowledge({ caseRecord: supportCase })
      : null;
    const enrichedCase = knowledge
      ? await updateSupportSimulatorCase(supportCase.chatId, (current) => evolveSupportCase(current || supportCase, {
          chatId: supportCase.chatId,
          customer: (current || supportCase).customer,
          events: [],
          systemFacts: { caseKnowledgeLookup: knowledge },
          source: supportCase.source,
          now: new Date().toISOString()
        }))
      : supportCase;
    return await generateCaseDraft({ caseRecord: enrichedCase });
  } catch (error) {
    return {
      provider: "fallback",
      draft: {
        classification: supportCase.workflow?.id || "sin_clasificar",
        analysis: "El proveedor de IA no está disponible; se mantiene una respuesta segura.",
        nextStep: supportCase.nextAction?.message || "Continuar revisión manual.",
        customerDraft: "Estoy revisando tu caso. En cuanto tenga un dato confirmado, te lo comparto por este medio.",
        suggestedAction: null,
        usedSources: [],
        warnings: [error.message || "case_draft_unavailable"],
        requiresHumanReview: true,
        executable: false
      }
    };
  }
}

function normalizeSimulatorActionPayload(actionType, payload, chatId) {
  const marker = simulatorActionMarker(chatId);
  if (actionType === "jira.comment") {
    const issueKey = String(payload.target || payload.issueKey || "").trim().toUpperCase();
    const body = cleanText(payload.text || payload.body, 1800);
    if (!/^[A-Z][A-Z0-9]{1,19}-\d{1,12}$/u.test(issueKey) || !body) {
      throw simulatorError("invalid_case_action_payload", 400);
    }
    return { issueKey, body: `${marker}\n${body}` };
  }
  if (actionType === "slack.notify") {
    const routeId = String(payload.target || payload.routeId || "").trim().slice(0, 100);
    const text = cleanText(payload.text, 2700);
    if (!/^[A-Za-z0-9_.-]+$/u.test(routeId) || !text) {
      throw simulatorError("invalid_case_action_payload", 400);
    }
    return { routeId, text: `${marker}\n${text}` };
  }
  throw simulatorError("simulator_action_not_allowed", 403);
}

function buildSimulatorActionDependencies(account) {
  return {
    "jira.comment": {
      execute: ({ payload }) => addJiraIssueComment(payload.issueKey, payload.body, account),
      verify: ({ payload, execution }) => verifyJiraIssueComment(payload.issueKey, execution?.id, payload.body, account),
      reconcile: ({ payload, startedAt }) => findJiraIssueComment({
        issueKey: payload.issueKey,
        body: payload.body,
        since: startedAt,
        accountSettings: account
      })
    },
    "slack.notify": {
      execute: ({ payload }) => sendSlackApprovedMessage({
        routeId: payload.routeId,
        text: payload.text,
        accountSettings: account
      }),
      verify: ({ payload, execution }) => verifySlackApprovedMessage({
        routeId: payload.routeId,
        channel: execution?.channel,
        ts: execution?.ts,
        text: payload.text,
        accountSettings: account
      }),
      reconcile: ({ payload, startedAt }) => findSlackApprovedMessage({
        routeId: payload.routeId,
        text: payload.text,
        since: startedAt,
        accountSettings: account
      })
    }
  };
}

async function persistVerifiedAction(chatId, result) {
  const now = new Date().toISOString();
  return updateSupportSimulatorCase(chatId, (current) => evolveSupportCase(current, {
    chatId,
    customer: current.customer,
    events: [],
    systemFacts: appendVerifiedCaseAction(current.systemFacts, result, { now }),
    source: current.source,
    now
  }));
}

async function requireOwnedSimulatorCase(chatId, account) {
  const id = normalizeSimulatorChatId(chatId);
  const supportCase = id ? await getSupportSimulatorCase(id) : null;
  if (!supportCase) throw simulatorError("support_case_not_found", 404);
  assertSimulatorOwner(supportCase, account.email);
  return supportCase;
}

async function requireSimulatorAction(proposalId, account) {
  const id = String(proposalId || "").trim();
  const record = id ? await actionStore.get(id) : null;
  if (!record) throw simulatorError("case_action_not_found", 404);
  await requireOwnedSimulatorCase(record.proposal.chatId, account);
  return record;
}

async function simulatorPayload(supportCase, overrides = {}) {
  return {
    ok: true,
    case: {
      ...simulatorConversationView(supportCase),
      systemFacts: {
        jira: publicCaseToolResult(supportCase.systemFacts?.caseJiraLookup),
        slack: publicCaseToolResult(supportCase.systemFacts?.caseSlackLookup),
        atena: publicCaseToolResult(supportCase.systemFacts?.caseAtenaLookup),
        kyc: publicCaseToolResult(supportCase.systemFacts?.caseKycLookup),
        kycReview: publicCaseToolResult(supportCase.systemFacts?.caseKycReview),
        knowledge: publicCaseToolResult(supportCase.systemFacts?.caseKnowledgeLookup)
      },
      evidenceItems: supportCase.evidence?.attachments || [],
      investigationTrace: buildCaseInvestigationTrace(supportCase)
    },
    action: overrides.action === undefined
      ? await actionStore.getLatestByChat(supportCase.chatId)
      : overrides.action,
    draft: overrides.draft || null,
    result: overrides.result || null,
    capabilities: {
      ...simulatorCapabilities(),
      knowledge: getCaseKnowledgeMetadata()
    }
  };
}

function normalizeSimulatorChatId(value) {
  const id = String(value || "").trim().slice(0, 180);
  return /^simulator:[A-Za-z0-9_.:-]+$/u.test(id) ? id : "";
}

async function auditSimulator(type, account, supportCase, extra = {}) {
  await writeAuditLog({
    type,
    status: "ok",
    chatId: supportCase.chatId,
    caseRevision: supportCase.revision,
    workflow: supportCase.workflow?.id || "",
    account: { email: account.email },
    ...extra
  });
}

function sourceStatusSnapshot(supportCase = {}) {
  const facts = supportCase.systemFacts || {};
  return {
    jira: String(facts.caseJiraLookup?.status || ""),
    slack: String(facts.caseSlackLookup?.status || ""),
    atena: String(facts.caseAtenaLookup?.status || ""),
    kyc: String(facts.caseKycLookup?.status || ""),
    kycReview: String(facts.caseKycReview?.status || ""),
    knowledge: String(facts.caseKnowledgeLookup?.status || "")
  };
}

function cleanText(value, maxLength) {
  return String(value || "").replace(/\u0000/gu, "").trim().slice(0, maxLength);
}

function simulatorError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
