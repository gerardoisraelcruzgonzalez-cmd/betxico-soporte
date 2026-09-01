import { readFileSync } from "node:fs";
import {
  addJiraIssueComment,
  createJiraIssue,
  findJiraIssueComment,
  searchJiraTickets,
  verifyJiraIssueComment
} from "../lib/jira.js";
import {
  findSlackApprovedMessage,
  lookupSlackListCache,
  sendSlackApprovedMessage,
  sendSlackRouteMessage,
  sendSlackSupportNotification,
  verifySlackApprovedMessage
} from "../lib/slack.js";
import { optionalEnv, readJson, sendJson, requireWidgetAccess } from "../lib/http.js";
import { summarizeSupportTicketForAudit, writeAuditLog } from "../lib/audit.js";
import { requireCurrentAccount } from "../lib/account-store.js";
import { getSupportConfig, isSupportAdmin } from "../lib/remote-config.js";
import { getAgentToolAccess, requireAgentCapability } from "../lib/tool-access.js";
import { getAiRuntimeState } from "../lib/ai-runtime-toggle.js";
import { addAiExample, addAiFeedback, inferTopic, selectRelevantAiExamples } from "../lib/ai-training.js";
import {
  AI_PROVIDER_GROQ,
  buildGroqChatCompletionBody,
  extractAiResponseText,
  isProviderQuotaExceeded,
  isProviderRateLimit,
  isProviderUnsupportedJsonMode,
  redactExternalAiText,
  requestGroqChatCompletion,
  resolveAiProvider
} from "../lib/ai-provider.js";
import {
  claimLiveChatWelcome,
  extractLiveChatCustomerMessages,
  extractLiveChatTextMessages,
  getLiveChat,
  getLiveChatSafeTemplateRecord,
  getLiveChatWelcomeRecord,
  findLiveChatMessage,
  listActiveLiveChats,
  releaseLiveChatWelcome,
  saveLiveChatSafeTemplateRecord,
  saveLiveChatWelcomeRecord,
  sendLiveChatMessage,
  verifyLiveChatMessage
} from "../lib/livechat.js";
import { findSafeAutoTemplateReply, isSimpleGreeting } from "../lib/safe-template-replies.js";
import { validateSupportAttachments } from "../lib/attachment-policy.js";
import {
  buildIneReceivedParentMessage,
  buildRetirosKycMessage,
  normalizeIneReceivedEmail
} from "../lib/ine-received.js";
import { createCaseReadTools } from "../lib/case-read-tools.js";
import { createAtenaJob, getJob as getAtenaJob } from "../lib/atena-bridge-store.js";
import { createBobJob } from "../lib/bob-bridge-store.js";
import { registerAutomaticBobClosure } from "../lib/case-bob-auto-response.js";
import { processCaseAcknowledgement, processVerifiedCaseDecision } from "../lib/case-evidence-auto-response.js";
import { createKycJob, getKycJob } from "../lib/kyc-bridge-store.js";
import { getSupportCase, updateSupportCase } from "../lib/case-store.js";
import { generateCaseDraft } from "../lib/case-draft.js";
import { appendVerifiedCaseAction } from "../lib/case-verified-actions.js";
import { createKycReviewStore } from "../lib/kyc-review-store.js";
import { evaluateCaseActionContext } from "../lib/case-action-context.js";
import {
  evolveSupportCase,
  orchestrateLiveChatCase,
  publicCaseSummary,
  reviewCaseEvidence
} from "../lib/case-orchestrator.js";
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
import {
  getSupportAgentMode,
  requireApprovedActionsEnabled,
  requireLegacyAutoSafeSendsEnabled,
  requireSupportAgentEnabled
} from "../lib/integration-policy.js";

const DEFAULT_OPENAI_MODEL = "gpt-5.4-mini";
const DEFAULT_OPENAI_FALLBACK_MODEL = "gpt-5.4-nano";
const MAX_AI_MESSAGE_LENGTH = 4000;
const MAX_AI_CONTEXT_LENGTH = 7000;
const INTENTS_DATASET_PATH = new URL("../docs/betxico_intents_dataset_v1.json", import.meta.url);
const FALLBACK_TEMPLATES_PATH = new URL("../docs/betxico_fallback_templates_v1.json", import.meta.url);
let intentsDatasetCache = null;
let fallbackTemplatesCache = null;
const caseActionStore = createCaseActionStore();
const kycReviewStore = createKycReviewStore();

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  try {
    requireWidgetAccess(req);
    const payload = await readJson(req);
    const action = String(req.query?.action || payload.action || "").trim();
    if (action === "ai-chat") {
      return await handleAiChat(req, res, payload);
    }
    if (action === "ai-save-example") {
      return await handleAiSaveExample(req, res, payload);
    }
    if (action === "ai-feedback") {
      return await handleAiFeedback(req, res, payload);
    }
    if (action === "livechat-send-welcome") {
      return await handleLiveChatSendWelcome(req, res, payload);
    }
    if (action === "livechat-send-message") {
      return await handleLiveChatSendMessage(req, res, payload);
    }
    if (action === "livechat-auto-safe-template") {
      return await handleLiveChatAutoSafeTemplate(req, res, payload);
    }
    if (action === "livechat-list-active") {
      return await handleLiveChatListActive(req, res, payload);
    }
    if (action === "livechat-get-chat") {
      return await handleLiveChatGetChat(req, res, payload);
    }
    if (action === "livechat-customer-history") {
      return await handleLiveChatCustomerHistory(req, res, payload);
    }
    if (action === "game-sessions-close" || action === "game-sessions-request") {
      return await handleGameSessionsRequest(req, res, payload);
    }
    if (action === "game-sessions-requests") {
      return await handleGameSessionsRequestsList(req, res, payload);
    }
    if (action === "ine-received") {
      return await handleIneReceived(req, res, payload);
    }
    if (action === "case-get") {
      return await handleCaseGet(req, res, payload);
    }
    if (action === "case-refresh") {
      return await handleCaseRefresh(req, res, payload);
    }
    if (action === "case-evidence-status") {
      return await handleCaseEvidenceStatus(req, res, payload);
    }
    if (action === "case-evidence-review") {
      return await handleCaseEvidenceReview(req, res, payload);
    }
    if (action === "case-draft") {
      return await handleCaseDraft(req, res, payload);
    }
    if (action === "case-action-propose") {
      return await handleCaseActionPropose(req, res, payload);
    }
    if (action === "case-action-approve") {
      return await handleCaseActionApprove(req, res, payload);
    }
    if (action === "case-action-reject") {
      return await handleCaseActionReject(req, res, payload);
    }
    if (action === "case-action-execute") {
      return await handleCaseActionExecute(req, res, payload);
    }
    if (action === "case-action-verify") {
      return await handleCaseActionVerify(req, res, payload);
    }
    if (action === "case-action-reconcile") {
      return await handleCaseActionReconcile(req, res, payload);
    }

    const normalized = normalizeSupportPayload(payload);
    const account = await requireCurrentAccount(req);
    const slackAccountIdentity = buildSlackAccountIdentity(account);
    if (normalized.source === "raycast") {
      normalized.slackFields.agentName = account.displayName || account.email || normalized.slackFields.agentName;
    }
    if (account?.configured) {
      normalized.accountSettings = account;
    }

    let jira = null;
    let slack = null;
    const shouldCreateJira = normalized.destination === "jira" || normalized.destination === "both";
    const shouldNotifySlack = normalized.destination === "slack" || normalized.destination === "both";

    if (shouldCreateJira) {
      jira = await createJiraIssue(normalized);
    }

    if (shouldNotifySlack) {
      try {
        slack = await sendSlackSupportNotification({
          ...normalized,
          accountSettings: normalized.accountSettings || slackAccountIdentity
        }, jira);
      } catch (error) {
        slack = {
          ok: false,
          error: error.message || "slack_notification_failed",
          details: error.details || undefined
        };
        if (!shouldCreateJira) {
          throw error;
        }
      }
    }

    await writeAuditLog({
      type: "support_ticket_created",
      status: "ok",
      operation: summarizeSupportTicketForAudit(normalized, { jira, slack, account })
    });

    return sendJson(res, 200, { ok: true, jira, slack });
  } catch (error) {
    await writeAuditLog({
      type: "support_ticket_failed",
      status: "error",
      error: error.message || "support_ticket_failed"
    });

    const status = error.statusCode || 500;
    return sendJson(res, status, {
      ok: false,
      error: error.message || "support_ticket_failed",
      details: error.details || undefined
    });
  }
}

function buildSlackAccountIdentity(account = {}) {
  return {
    email: account.email || "",
    displayName: account.displayName || "",
    jiraEmail: account.jiraEmail || "",
    reporterAccountId: account.reporterAccountId || "",
    defaultAssigneeAccountId: account.defaultAssigneeAccountId || "",
    defaultLabels: account.defaultLabels || ""
  };
}

async function handleIneReceived(req, res, payload) {
  const account = await requireCurrentAccount(req);
  const email = normalizeIneReceivedEmail(payload?.customer?.email || payload?.email);
  const attachments = validateSupportAttachments(payload?.attachments || []);
  if (!attachments.length) {
    const error = new Error("ine_received_evidence_required");
    error.statusCode = 400;
    throw error;
  }

  const accountSettings = buildSlackAccountIdentity(account);
  const ine = await sendSlackRouteMessage({
    routeId: "ine-recibida",
    text: buildIneReceivedParentMessage(email),
    attachments,
    initialComment: "INE recibida del cliente",
    accountSettings
  });

  let withdrawal = null;
  let withdrawalError = "";
  if (payload?.withdrawal?.notify === true) {
    const withdrawalText = buildRetirosKycMessage({
      email,
      withdrawalDate: payload.withdrawal.date,
      withdrawalAmount: payload.withdrawal.amount
    });
    try {
      withdrawal = await sendSlackRouteMessage({
        routeId: "retiros-kyc",
        text: withdrawalText,
        accountSettings
      });
    } catch (error) {
      withdrawalError = error.message || "retiros_kyc_notification_failed";
    }
  }

  await writeAuditLog({
    type: "ine_received_sent",
    status: withdrawalError ? "partial" : "ok",
    operation: {
      source: "ine_received",
      attachmentCount: attachments.length,
      ineRoute: ine.routeId,
      withdrawalRequested: payload?.withdrawal?.notify === true,
      withdrawalRoute: withdrawal?.routeId || "",
      withdrawalError
    }
  });

  return sendJson(res, 200, {
    ok: true,
    ine: { routeId: ine.routeId, files: ine.files.length },
    withdrawal: payload?.withdrawal?.notify === true
      ? { ok: !withdrawalError, routeId: withdrawal?.routeId || "", error: withdrawalError || null }
      : null,
    partial: Boolean(withdrawalError)
  });
}

async function handleCaseGet(req, res, payload) {
  requireSupportAgentEnabled();
  await requireCurrentAccount(req);
  const chatId = cleanCaseIdentifier(payload.chatId);
  const caseRecord = chatId ? await getSupportCase(chatId) : null;
  if (!caseRecord) return sendJson(res, 404, { ok: false, error: "support_case_not_found" });

  const actionRecord = payload.proposalId
    ? await caseActionStore.get(String(payload.proposalId || "").trim())
    : await caseActionStore.getLatestByChat(chatId);
  return sendJson(res, 200, {
    ok: true,
    case: operationalCaseView(caseRecord),
    action: actionRecord
  });
}

async function handleCaseRefresh(req, res, payload) {
  requireSupportAgentEnabled();
  const account = await requireCurrentAccount(req);
  const toolAccess = await getAgentToolAccess(account.email);
  const chatId = cleanCaseIdentifier(payload.chatId);
  let existing = chatId ? await getSupportCase(chatId) : null;
  let hydratedFromLiveChat = false;
  let hydratedFromWidgetContext = false;

  // The widget can be opened on a chat that predates the webhook, or when the
  // webhook was unavailable. In that case, hydrate the case from LiveChat's
  // authenticated read API before consulting Jira, Slack, Atena, or KYC.
  if (!existing && chatId) {
    try {
      const liveChatResponse = await getLiveChat(chatId);
      const chat = liveChatResponse?.chat || liveChatResponse;
      existing = await orchestrateLiveChatCase({
        action: "on_demand_case_refresh",
        payload: { chat }
      }, { chatId });
      hydratedFromLiveChat = Boolean(existing);
    } catch (error) {
      await writeAuditLog({
        type: "support_case_livechat_hydration_failed",
        status: "error",
        chatId,
        error: error.message || "livechat_case_hydration_failed"
      }).catch(() => null);
    }
  }

  // LiveChat can still render the widget with customer fields even when its
  // server-side chat-read credential is unavailable. The context is supplied
  // by the active widget only and contains no fabricated conversation events.
  if (!existing && chatId) {
    const widgetCustomer = normalizeWidgetCustomer(payload.customer);
    if (widgetCustomer.email || widgetCustomer.authId || widgetCustomer.name) {
      existing = await orchestrateLiveChatCase({
        action: "widget_context_refresh",
        payload: {
          chat: {
            id: chatId,
            properties: widgetCustomer.authId ? { auth_id: widgetCustomer.authId } : {},
            users: [{
              id: widgetCustomer.liveChatCustomerId || "widget-customer",
              type: "customer",
              email: widgetCustomer.email,
              name: widgetCustomer.name
            }]
          }
        }
      }, { chatId });
      hydratedFromWidgetContext = Boolean(existing);
    }
  }
  if (!existing) return sendJson(res, 404, { ok: false, error: "support_case_not_found" });
  // A chat id identifies a conversation, not the customer. LiveChat can
  // issue another chat id for the same customer, so prefer current identity.
  const widgetCustomer = normalizeWidgetCustomer(payload.customer);
  const resolvedCustomer = mergeLookupCustomer(existing.customer, widgetCustomer);
  const activeAction = await caseActionStore.getLatestByChat(chatId);
  if (["proposed", "approved", "executing", "verification_pending"].includes(activeAction?.status)) {
    return sendJson(res, 200, {
      ok: true,
      case: operationalCaseView(existing),
      action: activeAction,
      refreshSkipped: "active_case_action"
    });
  }

  const query = caseLookupIdentity({ ...existing, customer: resolvedCustomer });
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
  // Atena y KYC de Paybridge se consultan exclusivamente al pulsar sus
  // botones. El refresh del chat sólo actualiza Jira, Lista 8 y conserva la
  // evidencia ya obtenida para que otro agente pueda reutilizarla.
  const atena = existing.systemFacts?.caseAtenaLookup || null;
  const kyc = existing.systemFacts?.caseKycLookup || null;
  const kycReview = toolAccess.capabilities.kyc === true
    ? await tools.lookupKycReview(query)
    : existing.systemFacts?.caseKycReview || null;
  const updated = await updateSupportCase(chatId, (current) => evolveSupportCase(current || existing, {
    chatId,
    customer: resolvedCustomer,
    events: [],
    systemFacts: {
      caseJiraLookup: results.jira,
      caseSlackLookup: results.slack,
      caseAtenaLookup: atena,
      caseKycLookup: kyc,
      caseKycReview: kycReview
    },
    now: new Date().toISOString()
  }));

  const bobClosure = toolAccess.capabilities.bob === true && updated.workflow?.id === "game_access"
    ? await registerAutomaticBobClosure(updated, { ownerEmail: account.email, createBobJob }).catch(async (error) => {
        await writeAuditLog({
          type: "support_case_bob_auto_closure_failed",
          status: "error",
          chatId,
          source: "bob",
          error: error.message || "bob_auto_closure_failed"
        }).catch(() => null);
        return null;
      })
    : null;
  const acknowledgement = await processCaseAcknowledgement(updated).catch(() => null);
  const responseAutomation = await processVerifiedCaseDecision(updated).catch(async (error) => {
    await writeAuditLog({
      type: "support_case_decision_auto_response_failed",
      status: "error",
      chatId,
      source: updated.operationalDecision?.source || "case_evidence",
      route: updated.operationalDecision?.route || "",
      error: error.message || "case_decision_auto_response_failed"
    }).catch(() => null);
    return null;
  });

  await writeAuditLog({
    type: "support_case_tools_refreshed",
    status: "ok",
    chatId,
    jiraStatus: results.jira.status,
    slackStatus: results.slack.status,
    atenaStatus: atena?.status || "skipped",
    kycStatus: kyc?.status || "skipped",
    kycReviewStatus: kycReview?.status || "skipped",
    bobStatus: bobClosure?.status || "skipped",
    responseAutomation: responseAutomation?.state || acknowledgement?.state || "skipped"
  });
  return sendJson(res, 200, {
    ok: true,
    case: operationalCaseView(updated),
    action: await caseActionStore.getLatestByChat(chatId),
    hydratedFromLiveChat,
    hydratedFromWidgetContext
  });
}

function normalizeWidgetCustomer(value = {}) {
  const email = String(value?.email || "").trim().toLowerCase();
  const name = String(value?.name || "").trim().slice(0, 180);
  const authId = String(value?.authId || "").trim().replace(/[^0-9]/gu, "").slice(0, 32);
  const liveChatCustomerId = String(value?.liveChatCustomerId || "").trim().slice(0, 180);
  return {
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) ? email : "",
    name,
    authId,
    liveChatCustomerId
  };
}

async function handleCaseEvidenceStatus(req, res, payload) {
  requireSupportAgentEnabled();
  const account = await requireCurrentAccount(req);
  const chatId = cleanCaseIdentifier(payload.chatId);
  const existing = chatId ? await getSupportCase(chatId) : null;
  if (!existing) return sendJson(res, 404, { ok: false, error: "support_case_not_found" });

  const query = caseLookupIdentity(existing);
  const evidenceInput = {
    ...query,
    ownerEmail: account.email,
    caseId: chatId
  };
  const tools = createCaseReadTools({
    createAtenaJob,
    getAtenaJob,
    createKycJob,
    getKycJob
  });
  const [atena, kyc] = await Promise.all([
    isPendingBridgeEvidence(existing.systemFacts?.caseAtenaLookup)
      ? tools.lookupAtena({
          ...evidenceInput,
          previousEvidence: existing.systemFacts.caseAtenaLookup
        })
      : existing.systemFacts?.caseAtenaLookup || null,
    isPendingBridgeEvidence(existing.systemFacts?.caseKycLookup)
      ? tools.lookupKyc({
          ...evidenceInput,
          previousEvidence: existing.systemFacts.caseKycLookup
        })
      : existing.systemFacts?.caseKycLookup || null
  ]);
  const updated = await updateSupportCase(chatId, (current) => evolveSupportCase(current || existing, {
    chatId,
    customer: (current || existing).customer,
    events: [],
    systemFacts: {
      caseAtenaLookup: atena,
      caseKycLookup: kyc
    },
    source: (current || existing).source,
    now: new Date().toISOString()
  }));
  return sendJson(res, 200, {
    ok: true,
    case: operationalCaseView(updated),
    evidencePending: hasPendingBridgeEvidence(atena, kyc)
  });
}

function hasPendingBridgeEvidence(...values) {
  return values.some(isPendingBridgeEvidence);
}

function isPendingBridgeEvidence(value) {
  return value?.status === "unavailable"
    && value?.error?.retryable === true
    && /_lookup_pending$/u.test(String(value?.error?.code || ""));
}

async function handleCaseEvidenceReview(req, res, payload) {
  requireSupportAgentEnabled();
  const account = await requireCurrentAccount(req);
  const chatId = cleanCaseIdentifier(payload.chatId);
  const attachmentIds = Array.isArray(payload.attachmentIds) ? payload.attachmentIds : [];
  const existing = chatId ? await getSupportCase(chatId) : null;
  if (!existing) return sendJson(res, 404, { ok: false, error: "support_case_not_found" });

  const updated = await updateSupportCase(chatId, (current) => reviewCaseEvidence(current || existing, {
    attachmentIds,
    reviewedBy: account.email,
    now: new Date().toISOString()
  }));
  await writeAuditLog({
    type: "support_case_evidence_reviewed",
    status: "ok",
    chatId,
    attachmentCount: attachmentIds.length,
    account: { email: account.email }
  });
  return sendJson(res, 200, { ok: true, case: operationalCaseView(updated) });
}

async function handleCaseDraft(req, res, payload) {
  requireSupportAgentEnabled();
  const account = await requireCurrentAccount(req);
  await requireAgentCapability(account, "ai");
  const chatId = cleanCaseIdentifier(payload.chatId);
  const caseRecord = chatId ? await getSupportCase(chatId) : null;
  if (!caseRecord) return sendJson(res, 404, { ok: false, error: "support_case_not_found" });
  const activeAction = await caseActionStore.getLatestByChat(chatId);
  if (["proposed", "approved", "executing", "verification_pending"].includes(activeAction?.status)) {
    return sendJson(res, 409, { ok: false, error: "case_action_already_active", action: activeAction });
  }

  const generated = await generateCaseDraft({ caseRecord });
  await writeAuditLog({
    type: "support_case_draft_generated",
    status: "ok",
    chatId,
    provider: generated.provider,
    model: generated.model,
    sourceStatus: generated.sourceStatus,
    suggestedActionType: generated.draft?.suggestedAction?.actionType || "",
    account: { email: account.email }
  });
  return sendJson(res, 200, { ok: true, ...generated });
}

async function handleCaseActionPropose(req, res, payload) {
  requireSupportAgentEnabled();
  const account = await requireCurrentAccount(req);
  const chatId = cleanCaseIdentifier(payload.chatId);
  const caseRecord = chatId ? await getSupportCase(chatId) : null;
  if (!caseRecord) return sendJson(res, 404, { ok: false, error: "support_case_not_found" });

  const actionType = String(payload.actionType || "").trim().toLowerCase();
  const actionPayload = normalizeCaseActionPayload(actionType, payload.payload, caseRecord);
  assertCaseActionContext(caseRecord, actionType, actionPayload);
  const proposal = createCaseActionProposal({
    caseRecord,
    actionType,
    payload: actionPayload,
    proposedBy: { type: "human", email: account.email },
    reason: String(payload.reason || "Accion solicitada por el agente.").trim().slice(0, 500)
  });
  const record = await caseActionStore.propose(proposal);
  await writeAuditLog({
    type: "support_case_action_proposed",
    status: "proposed",
    chatId,
    proposalId: proposal.proposalId,
    actionType,
    account: { email: account.email }
  });
  return sendJson(res, 200, { ok: true, action: record });
}

async function handleCaseActionApprove(req, res, payload) {
  requireSupportAgentEnabled();
  const account = await requireCurrentAccount(req);
  const proposalId = String(payload.proposalId || "").trim();
  const record = proposalId ? await caseActionStore.get(proposalId) : null;
  if (!record) return sendJson(res, 404, { ok: false, error: "case_action_not_found" });
  const role = await isSupportAdmin(account.email) ? "admin" : "agent";
  const approval = approveCaseAction(record.proposal, { email: account.email, role });
  const approved = await caseActionStore.approve(proposalId, approval);
  await writeAuditLog({
    type: "support_case_action_approved",
    status: "approved",
    chatId: record.proposal.chatId,
    proposalId,
    approvalId: approved.approval?.approvalId || "",
    actionType: record.proposal.actionType,
    account: { email: account.email }
  });
  return sendJson(res, 200, { ok: true, action: approved });
}

async function handleCaseActionReject(req, res, payload) {
  requireSupportAgentEnabled();
  const account = await requireCurrentAccount(req);
  const proposalId = String(payload.proposalId || "").trim();
  const rejected = await caseActionStore.reject(proposalId, {
    rejectedBy: { email: account.email },
    reason: String(payload.reason || "Rechazada por el agente.").trim().slice(0, 500)
  });
  await writeAuditLog({
    type: "support_case_action_rejected",
    status: "rejected",
    chatId: rejected.proposal.chatId,
    proposalId,
    actionType: rejected.proposal.actionType,
    account: { email: account.email }
  });
  return sendJson(res, 200, { ok: true, action: rejected });
}

async function handleCaseActionExecute(req, res, payload) {
  requireApprovedActionsEnabled();
  const account = await requireCurrentAccount(req);
  const proposalId = String(payload.proposalId || "").trim();
  const record = proposalId ? await caseActionStore.get(proposalId) : null;
  if (!record) return sendJson(res, 404, { ok: false, error: "case_action_not_found" });
  const caseRecord = await getSupportCase(record.proposal.chatId);
  if (!caseRecord) return sendJson(res, 404, { ok: false, error: "support_case_not_found" });

  const claimed = await caseActionStore.claimExecution(proposalId, {
    idempotencyKey: record.idempotencyKey,
    executingBy: { email: account.email }
  });
  const result = await executeCaseAction({
    proposal: claimed.proposal,
    approval: claimed.approval,
    caseRecord,
    dependencies: buildCaseActionDependencies(account)
  });
  const completionStatus = result.status === "verified"
    ? "verified"
    : result.status === "verification_pending"
      ? "verification_pending"
      : "failed";
  const completed = await caseActionStore.completeExecution(proposalId, {
    status: completionStatus,
    idempotencyKey: claimed.idempotencyKey,
    result: {
      verified: result.verified === true,
      reason: result.reason,
      actionType: result.actionType,
      verificationRef: result.verificationRef
    },
    error: completionStatus === "failed" ? { code: result.reason || "case_action_failed" } : null
  });
  const updatedCase = result.verified === true
    ? await persistVerifiedCaseAction(record.proposal.chatId, result)
    : null;
  await writeAuditLog({
    type: "support_case_action_completed",
    status: completionStatus,
    chatId: record.proposal.chatId,
    proposalId,
    actionType: record.proposal.actionType,
    verified: result.verified === true,
    reason: result.reason,
    account: { email: account.email }
  });
  return sendJson(res, 200, {
    ok: true,
    result,
    action: completed,
    case: updatedCase ? operationalCaseView(updatedCase) : undefined
  });
}

async function handleCaseActionVerify(req, res, payload) {
  requireApprovedActionsEnabled();
  const account = await requireCurrentAccount(req);
  const proposalId = String(payload.proposalId || "").trim();
  const record = proposalId ? await caseActionStore.get(proposalId) : null;
  if (!record) return sendJson(res, 404, { ok: false, error: "case_action_not_found" });

  const result = await verifyCaseActionExecution({
    actionRecord: record,
    dependencies: buildCaseActionDependencies(account)
  });
  const completionStatus = result.verified === true ? "verified" : "verification_pending";
  const completed = await caseActionStore.completeExecution(proposalId, {
    status: completionStatus,
    idempotencyKey: record.idempotencyKey,
    result: {
      verified: result.verified === true,
      reason: result.reason,
      actionType: result.actionType,
      verificationRef: result.verificationRef
    }
  });
  const updatedCase = result.verified === true
    ? await persistVerifiedCaseAction(record.proposal.chatId, result)
    : null;
  await writeAuditLog({
    type: "support_case_action_reverified",
    status: completionStatus,
    chatId: record.proposal.chatId,
    proposalId,
    actionType: record.proposal.actionType,
    verified: result.verified === true,
    reason: result.reason,
    account: { email: account.email }
  });
  return sendJson(res, 200, {
    ok: true,
    result,
    action: completed,
    case: updatedCase ? operationalCaseView(updatedCase) : undefined
  });
}

async function handleCaseActionReconcile(req, res, payload) {
  requireApprovedActionsEnabled();
  const account = await requireCurrentAccount(req);
  const proposalId = String(payload.proposalId || "").trim();
  const record = proposalId ? await caseActionStore.get(proposalId) : null;
  if (!record) return sendJson(res, 404, { ok: false, error: "case_action_not_found" });

  const result = await reconcileCaseActionExecution({
    actionRecord: record,
    dependencies: buildCaseActionDependencies(account)
  });
  const completionStatus = result.verified === true ? "verified" : "verification_pending";
  const completed = await caseActionStore.completeExecution(proposalId, {
    status: completionStatus,
    idempotencyKey: record.idempotencyKey,
    result: {
      verified: result.verified === true,
      reason: result.reason,
      actionType: result.actionType,
      verificationRef: result.verificationRef
    }
  });
  const updatedCase = result.verified === true
    ? await persistVerifiedCaseAction(record.proposal.chatId, result)
    : null;
  await writeAuditLog({
    type: "support_case_action_reconciled",
    status: completionStatus,
    chatId: record.proposal.chatId,
    proposalId,
    actionType: record.proposal.actionType,
    verified: result.verified === true,
    reason: result.reason,
    account: { email: account.email }
  });
  return sendJson(res, 200, {
    ok: true,
    result,
    action: completed,
    case: updatedCase ? operationalCaseView(updatedCase) : undefined
  });
}

async function persistVerifiedCaseAction(chatId, result) {
  const verifiedAt = new Date().toISOString();
  return updateSupportCase(chatId, (current) => {
    if (!current) {
      const error = new Error("support_case_not_found");
      error.statusCode = 404;
      throw error;
    }
    return evolveSupportCase(current, {
      chatId,
      customer: current.customer,
      events: [],
      systemFacts: appendVerifiedCaseAction(current.systemFacts, result, { now: verifiedAt }),
      now: verifiedAt
    });
  });
}

function buildCaseActionDependencies(account) {
  return {
    "jira.comment": {
      execute: ({ payload }) => addJiraIssueComment(payload.issueKey, payload.body, account),
      verify: ({ payload, execution }) => verifyJiraIssueComment(
        payload.issueKey,
        execution?.id,
        payload.body,
        account
      ),
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
    },
    "livechat.send_message": {
      execute: ({ payload }) => sendLiveChatMessage({ chatId: payload.chatId, text: payload.text, visibility: "all" }),
      verify: ({ payload, execution }) => verifyLiveChatMessage({
        chatId: payload.chatId,
        eventId: execution?.event_id,
        text: payload.text,
        visibility: "all"
      }),
      reconcile: ({ payload, startedAt }) => findLiveChatMessage({
        chatId: payload.chatId,
        text: payload.text,
        visibility: "all",
        since: startedAt
      })
    }
  };
}

function normalizeCaseActionPayload(actionType, rawPayload = {}, caseRecord = {}) {
  if (actionType === "jira.comment") {
    const issueKey = String(rawPayload.issueKey || "").trim().toUpperCase();
    const body = cleanActionText(rawPayload.body, 2000);
    if (!/^[A-Z][A-Z0-9]{1,19}-\d{1,12}$/.test(issueKey) || !body) throwActionPayloadError();
    return { issueKey, body };
  }
  if (actionType === "slack.notify") {
    const routeId = String(rawPayload.routeId || "").trim().slice(0, 100);
    const text = cleanActionText(rawPayload.text, 3000);
    if (!/^[A-Za-z0-9_.-]+$/.test(routeId) || !text) throwActionPayloadError();
    return { routeId, text };
  }
  if (actionType === "livechat.send_message") {
    const text = cleanActionText(rawPayload.text, 3000);
    if (!text) throwActionPayloadError();
    return { chatId: caseRecord.chatId, text };
  }
  return rawPayload;
}

function assertCaseActionContext(caseRecord, actionType, actionPayload) {
  const result = evaluateCaseActionContext(caseRecord, actionType, actionPayload);
  if (!result.ok) throwCaseActionContextError(result.reason);
}

function throwCaseActionContextError(message) {
  const error = new Error(message);
  error.statusCode = 409;
  throw error;
}

function throwActionPayloadError() {
  const error = new Error("invalid_case_action_payload");
  error.statusCode = 400;
  throw error;
}

function cleanActionText(value, maxLength) {
  return String(value || "").replace(/\u0000/g, "").trim().slice(0, maxLength);
}

function cleanCaseIdentifier(value) {
  return String(value || "").trim().slice(0, 180);
}

function caseLookupIdentity(caseRecord = {}) {
  const identity = {};
  const email = String(caseRecord.customer?.email || "").trim();
  if (email) identity.email = email;
  const authId = String(caseRecord.customer?.authId || caseRecord.customer?.liveChatCustomerId || "").trim();
  if (authId) identity.authId = authId;
  // A known ticket is only a fallback when the customer identity is absent.
  if (!identity.email && !identity.authId) {
    const ticketKey = String(caseRecord.facts?.ticketKey || "").trim();
    if (ticketKey) identity.ticketKey = ticketKey;
  }
  return identity;
}

function mergeLookupCustomer(existing = {}, incoming = {}) {
  return {
    liveChatCustomerId: String(incoming.liveChatCustomerId || existing.liveChatCustomerId || "").trim().slice(0, 180),
    authId: String(incoming.authId || existing.authId || "").replace(/[^0-9]/gu, "").slice(0, 32),
    email: String(incoming.email || existing.email || "").trim().toLowerCase(),
    name: String(incoming.name || existing.name || "").trim().slice(0, 180)
  };
}

function operationalCaseView(caseRecord) {
  return {
    ...publicCaseSummary(caseRecord),
    agentMode: getSupportAgentMode(),
    systemFacts: {
      jira: publicCaseToolResult(caseRecord.systemFacts?.caseJiraLookup),
      slack: publicCaseToolResult(caseRecord.systemFacts?.caseSlackLookup),
      atena: publicCaseToolResult(caseRecord.systemFacts?.caseAtenaLookup),
      kyc: publicCaseToolResult(caseRecord.systemFacts?.caseKycLookup),
      kycReview: publicCaseToolResult(caseRecord.systemFacts?.caseKycReview)
    },
    evidenceItems: Array.isArray(caseRecord.evidence?.attachments)
      ? caseRecord.evidence.attachments.map((attachment) => ({
        id: attachment.id,
        kind: attachment.kind,
        name: attachment.name,
        mimeType: attachment.mimeType,
        size: attachment.size,
        receivedAt: attachment.receivedAt,
        reviewStatus: attachment.reviewStatus,
        reviewedAt: attachment.reviewedAt || ""
      }))
      : []
  };
}

async function handleGameSessionsRequest(req, res, payload) {
  const account = await requireCurrentAccount(req);
  await requireAgentCapability(account, "bob");
  const customerId = cleanCustomerId(payload.customerId || payload.authId || payload.customer_id);
  if (!customerId) {
    return sendJson(res, 400, { ok: false, error: "invalid_customer_id" });
  }

  const auditBase = {
    type: "game_sessions_close_request",
    customerId,
    source: "support-livechat-app",
    chatId: cleanText(payload.chatId).slice(0, 120),
    account: {
      email: account.email || "",
      displayName: account.displayName || ""
    }
  };

  try {
    const { createBobJob } = await import("../lib/bob-bridge-store.js");
    const request = await createBobJob({ ownerEmail: account.email, customerId, chatId: auditBase.chatId });

    await writeAuditLog({
      ...auditBase,
      status: "ok",
      requestId: request.id,
      transport: "bob_ui_playwright_bridge"
    });

    return sendJson(res, 200, {
      ok: true,
      customerId,
      duplicate: false,
      request
    });
  } catch (error) {
    await writeAuditLog({
      ...auditBase,
      status: "error",
      error: error.message || "game_sessions_request_failed",
      upstreamStatus: error.upstreamStatus || undefined
    });

    return sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "game_sessions_request_failed",
      details: error.details || undefined
    });
  }
}

async function handleGameSessionsRequestsList(req, res, payload) {
  const account = await requireCurrentAccount(req);
  await requireAgentCapability(account, "bob");
  const { getBobJob } = await import("../lib/bob-bridge-store.js");
  const jobId = cleanText(payload.jobId);
  if (!jobId) return sendJson(res, 400, { ok: false, error: "missing_bob_job_id" });
  const job = await getBobJob(jobId);
  if (!job || job.ownerEmail !== account.email) return sendJson(res, 404, { ok: false, error: "bob_job_not_found" });
  return sendJson(res, 200, { ok: true, requests: [job] });
}

async function requestGameSessionsClosureViaBetxicoAssistant({ customerId, reason, customerName, customerEmail, account, chatId }) {
  const baseUrl = betxicoAssistantApiBaseUrl();
  const accessToken = optionalEnv("BETXICO_ASSISTANT_ACCESS_TOKEN", optionalEnv("BETXICO_ASSISTANT_API_TOKEN", optionalEnv("SUPPORT_ALERTS_TOKEN", "")));
  const localToken = optionalEnv("BETXICO_ASSISTANT_LOCAL_TOKEN", "");

  if (!accessToken && !localToken) {
    throw statusError("missing_betxico_assistant_token", 500);
  }

  const headers = {
    "content-type": "application/json",
    "idempotency-key": buildGameSessionRequestIdempotencyKey(customerId, chatId)
  };

  if (accessToken) {
    headers.authorization = `Bearer ${accessToken}`;
  }
  if (localToken) {
    headers["x-betxico-local-token"] = localToken;
    headers["x-betxico-role"] = "admin";
    headers["x-betxico-actor"] = account.email || "support-livechat-app";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${baseUrl}/game-session-requests`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        customerId,
        reason,
        chatId,
        customerName,
        customerEmail,
        requestedByName: account.displayName || "",
        requestedByEmail: account.email || "",
        source: "support-livechat-app"
      }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = statusError(data.error || data.message || `betxico_assistant_http_${response.status}`, response.status || 502);
      error.details = data.details || undefined;
      error.upstreamStatus = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw statusError("betxico_assistant_timeout", 504);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function listGameSessionsClosureRequestsViaBetxicoAssistant({ status, limit }) {
  const baseUrl = betxicoAssistantApiBaseUrl();
  const accessToken = optionalEnv("BETXICO_ASSISTANT_ACCESS_TOKEN", optionalEnv("BETXICO_ASSISTANT_API_TOKEN", optionalEnv("SUPPORT_ALERTS_TOKEN", "")));
  const localToken = optionalEnv("BETXICO_ASSISTANT_LOCAL_TOKEN", "");

  if (!accessToken && !localToken) {
    throw statusError("missing_betxico_assistant_token", 500);
  }

  const headers = { "accept": "application/json" };
  if (accessToken) {
    headers.authorization = `Bearer ${accessToken}`;
  }
  if (localToken) {
    headers["x-betxico-local-token"] = localToken;
    headers["x-betxico-role"] = "admin";
    headers["x-betxico-actor"] = "support-livechat-app";
  }

  const params = new URLSearchParams({
    status: ["active", "all", "pending", "processing", "completed", "rejected", "error"].includes(status) ? status : "all",
    limit: String(Math.max(1, Math.min(Number.isFinite(limit) ? limit : 20, 50)))
  });
  const response = await fetch(`${baseUrl}/game-session-requests?${params.toString()}`, { headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = statusError(data.error || data.message || `betxico_assistant_http_${response.status}`, response.status || 502);
    error.details = data.details || undefined;
    error.upstreamStatus = response.status;
    throw error;
  }
  return data;
}

function betxicoAssistantApiBaseUrl() {
  const raw = optionalEnv("BETXICO_ASSISTANT_API_URL", "").replace(/\/+$/, "");
  if (!raw) {
    throw statusError("missing_betxico_assistant_api_url", 500);
  }
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}

function cleanCustomerId(value) {
  const customerId = String(value || "").trim();
  return /^\d{3,20}$/.test(customerId) ? customerId : "";
}

function buildGameSessionRequestIdempotencyKey(customerId, chatId) {
  const safeChat = cleanText(chatId).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80) || "manual";
  return `support-livechat:game-sessions-request:${customerId}:${safeChat}`;
}

function summarizeGameSessionCloseResult(result = {}) {
  return {
    estado: result.estado || "",
    resultado: result.resultado || "",
    cantidadCerradas: result.cantidadCerradas ?? null,
    fechaProceso: result.fechaProceso || "",
    notas: result.notas || ""
  };
}

function statusError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function handleAiChat(req, res, payload) {
  const account = await requireCurrentAccount(req);
  await requireAgentCapability(account, "ai");

  const message = cleanText(payload.message).slice(0, MAX_AI_MESSAGE_LENGTH);
  const context = cleanText(payload.context).slice(0, MAX_AI_CONTEXT_LENGTH);

  if (!message) {
    return sendJson(res, 400, { ok: false, error: "missing_message" });
  }

  const config = await getSupportConfig().catch(() => ({}));
  const aiConfig = config.aiAssistant || {};
  const aiRuntime = await getAiRuntimeState();
  if (aiConfig.enabled === false || aiRuntime.enabled !== true) {
    return sendJson(res, 403, { ok: false, error: "ai_assistant_disabled" });
  }

  const topic = inferTopic(`${message}\n${context}`);
  const intentsDataset = mergeIntentDatasetWithFallbackTemplates(loadIntentsDataset(), loadFallbackTemplates());
  const intentCandidates = selectIntentCandidates(intentsDataset, `${message}\n${context}`, 5);
  const safeTemplateFallback = buildSafeTemplateFallbackResponse({ message, context, topic });
  if (safeTemplateFallback) {
    await writeAuditLog({
      type: "ai_chat_safe_template_fallback",
      status: "ok",
      model: "template-fallback",
      topic,
      selectedIntent: safeTemplateFallback.classification?.selectedIntent || "",
      subdiagnostic: safeTemplateFallback.classification?.subdiagnostic || "",
      confidence: safeTemplateFallback.classification?.confidence || null,
      riskLevel: safeTemplateFallback.classification?.riskLevel || "",
      account: { email: account.email || "" }
    });

    return sendJson(res, 200, {
      ok: true,
      answer: safeTemplateFallback.answer,
      classification: safeTemplateFallback.classification,
      model: "template-fallback",
      topic,
      exampleCount: 0,
      usedFileSearch: false,
      retriedWithoutFileSearch: false,
      retriedWithFallbackModel: false,
      templateFallback: true,
      safeTemplateFallback: true,
      skippedOpenAi: true
    });
  }

  const aiProvider = resolveAiProvider();
  const examples = await selectRelevantAiExamples({
    message,
    context,
    topic,
    limit: Math.min(Number(aiConfig.maxExamples || 3) || 3, 3)
  }).catch(() => []);

  if (aiProvider.provider === AI_PROVIDER_GROQ) {
    return await handleGroqAiChat({
      res,
      account,
      aiProvider,
      aiConfig,
      message,
      context,
      topic,
      intentsDataset,
      intentCandidates,
      examples
    });
  }

  const apiKey = optionalEnv("OPENAI_API_KEY");
  if (!apiKey) {
    return sendJson(res, 500, { ok: false, error: "missing_openai_api_key", provider: aiProvider.provider });
  }

  const safeMessage = redactExternalAiText(message);
  const safeContext = redactExternalAiText(context);
  const safeExamples = redactExternalAiExamples(examples);
  const redactionApplied = safeMessage !== message
    || safeContext !== context
    || JSON.stringify(safeExamples) !== JSON.stringify(examples);
  const model = optionalEnv("OPENAI_MODEL", DEFAULT_OPENAI_MODEL);
  const requestBody = buildOpenAiRequestBody({
    model,
    account,
    aiConfig,
    message: safeMessage,
    context: safeContext,
    examples: safeExamples,
    intentsDataset,
    intentCandidates
  });
  let data = await requestOpenAi(apiKey, requestBody);
  let retriedWithoutFileSearch = false;
  let retriedWithFallbackModel = false;
  let finalModel = model;

  if (!data.ok && isOpenAiRateLimit(data) && !isOpenAiQuotaExceeded(data) && model !== getOpenAiFallbackModel()) {
    retriedWithoutFileSearch = Boolean(requestBody.tools?.length);
    retriedWithFallbackModel = true;
    finalModel = getOpenAiFallbackModel();
    data = await requestOpenAi(apiKey, {
      ...requestBody,
      model: finalModel,
      tools: undefined,
      instructions: buildAiInstructions(account, aiConfig, safeExamples.slice(0, 2), intentsDataset, intentCandidates.slice(0, 3), { compact: true }),
      max_output_tokens: Math.min(Number(optionalEnv("OPENAI_MAX_OUTPUT_TOKENS", "650")) || 650, 650)
    });
  }

  if (!data.ok && !isOpenAiRateLimit(data) && !isOpenAiQuotaExceeded(data) && requestBody.tools?.length) {
    retriedWithoutFileSearch = true;
    data = await requestOpenAi(apiKey, { ...requestBody, tools: undefined });
  }

  if (!data.ok) {
    const openAiErrorCode = isOpenAiQuotaExceeded(data)
      ? "openai_quota_exceeded"
      : isOpenAiRateLimit(data)
        ? "openai_rate_limited"
        : "openai_request_failed";

    if (openAiErrorCode === "openai_quota_exceeded" || openAiErrorCode === "openai_rate_limited") {
      const templateFallback = buildTemplateFallbackResponse({
        message,
        context,
        topic,
        examples,
        intentCandidates,
        errorCode: openAiErrorCode
      });

      await writeAuditLog({
        type: "ai_chat_template_fallback",
        status: "ok",
        provider: "openai",
        model: "template-fallback",
        topic,
        selectedIntent: templateFallback.classification?.selectedIntent || "",
        subdiagnostic: templateFallback.classification?.subdiagnostic || "",
        confidence: templateFallback.classification?.confidence || null,
        riskLevel: templateFallback.classification?.riskLevel || "",
        openAiErrorCode,
        account: { email: account.email || "" }
      });

      return sendJson(res, 200, {
        ok: true,
        answer: templateFallback.answer,
        classification: templateFallback.classification,
        model: "template-fallback",
        provider: "openai",
        topic,
        exampleCount: examples.length,
        usedFileSearch: false,
        retriedWithoutFileSearch,
        retriedWithFallbackModel,
        templateFallback: true,
        openAiErrorCode
      });
    }

    await writeAuditLog({
      type: "ai_chat_failed",
      status: "error",
      provider: "openai",
      model: finalModel,
      topic,
      usedFileSearch: Boolean(requestBody.tools?.length),
      retriedWithoutFileSearch,
      retriedWithFallbackModel,
      redactionApplied,
      account: { email: account.email || "" },
      error: data.error?.message || data.error || "openai_request_failed"
    });
    return sendJson(res, data.status || 500, {
      ok: false,
      error: openAiErrorCode,
      details: data.error?.message || data.error || undefined
    });
  }

  const rawAnswer = extractAiText(data.body);
  const classification = parseAiClassification(rawAnswer, intentsDataset);
  const answer = classification?.response || rawAnswer;

  await writeAuditLog({
    type: "ai_chat_completed",
    status: "ok",
    provider: "openai",
    model: finalModel,
    topic,
    selectedIntent: classification?.selectedIntent || "",
    subdiagnostic: classification?.subdiagnostic || "",
    confidence: classification?.confidence || null,
    riskLevel: classification?.riskLevel || "",
    usedFileSearch: Boolean(requestBody.tools?.length),
    retriedWithoutFileSearch,
    retriedWithFallbackModel,
    redactionApplied,
    exampleCount: examples.length,
    account: { email: account.email || "" },
    usage: data.body?.usage || undefined
  });

  return sendJson(res, 200, {
    ok: true,
    answer,
    classification,
    model: finalModel,
    provider: "openai",
    topic,
    exampleCount: examples.length,
    usedFileSearch: Boolean(requestBody.tools?.length),
    retriedWithoutFileSearch,
    retriedWithFallbackModel,
    redactionApplied
  });
}

async function handleGroqAiChat({
  res,
  account,
  aiProvider,
  aiConfig,
  message,
  context,
  topic,
  intentsDataset,
  intentCandidates,
  examples
}) {
  if (!aiProvider.apiKey) {
    return sendJson(res, 500, { ok: false, error: "missing_groq_api_key", provider: AI_PROVIDER_GROQ });
  }

  const safeMessage = redactExternalAiText(message);
  const safeContext = redactExternalAiText(context);
  const safeExamples = redactExternalAiExamples(examples);
  const redactionApplied = safeMessage !== message
    || safeContext !== context
    || JSON.stringify(safeExamples) !== JSON.stringify(examples);
  const requestBody = buildGroqChatCompletionBody({
    model: aiProvider.model,
    instructions: buildAiInstructions(account, aiConfig, safeExamples, intentsDataset, intentCandidates, { compact: true }),
    input: buildAiInput(safeMessage, safeContext),
    maxOutputTokens: Math.min(Number(aiProvider.maxOutputTokens || 650) || 650, 650),
    jsonMode: aiProvider.jsonMode
  });
  let data = await requestGroqChatCompletion(aiProvider.apiKey, requestBody);
  let retriedWithoutJsonMode = false;

  if (!data.ok && isProviderUnsupportedJsonMode(data) && requestBody.response_format) {
    retriedWithoutJsonMode = true;
    data = await requestGroqChatCompletion(aiProvider.apiKey, {
      ...requestBody,
      response_format: undefined
    });
  }

  if (!data.ok) {
    const providerErrorCode = isProviderQuotaExceeded(data)
      ? "groq_quota_exceeded"
      : isProviderRateLimit(data)
        ? "groq_rate_limited"
        : "groq_request_failed";

    if (providerErrorCode === "groq_quota_exceeded" || providerErrorCode === "groq_rate_limited") {
      const templateFallback = buildTemplateFallbackResponse({
        message,
        context,
        topic,
        examples,
        intentCandidates,
        errorCode: providerErrorCode
      });

      await writeAuditLog({
        type: "ai_chat_template_fallback",
        status: "ok",
        provider: AI_PROVIDER_GROQ,
        model: "template-fallback",
        topic,
        selectedIntent: templateFallback.classification?.selectedIntent || "",
        subdiagnostic: templateFallback.classification?.subdiagnostic || "",
        confidence: templateFallback.classification?.confidence || null,
        riskLevel: templateFallback.classification?.riskLevel || "",
        providerErrorCode,
        account: { email: account.email || "" }
      });

      return sendJson(res, 200, {
        ok: true,
        answer: templateFallback.answer,
        classification: templateFallback.classification,
        model: "template-fallback",
        provider: AI_PROVIDER_GROQ,
        topic,
        exampleCount: examples.length,
        usedFileSearch: false,
        retriedWithoutFileSearch: false,
        retriedWithFallbackModel: false,
        retriedWithoutJsonMode,
        templateFallback: true,
        providerErrorCode
      });
    }

    await writeAuditLog({
      type: "ai_chat_failed",
      status: "error",
      provider: AI_PROVIDER_GROQ,
      model: aiProvider.model,
      topic,
      usedFileSearch: false,
      retriedWithoutJsonMode,
      redactionApplied,
      account: { email: account.email || "" },
      error: data.error?.message || data.error || "groq_request_failed"
    });

    return sendJson(res, data.status || 500, {
      ok: false,
      error: providerErrorCode,
      provider: AI_PROVIDER_GROQ,
      details: data.error?.message || data.error || undefined
    });
  }

  const rawAnswer = extractAiResponseText(data.body);
  const classification = parseAiClassification(rawAnswer, intentsDataset);
  const answer = classification?.response || rawAnswer;

  await writeAuditLog({
    type: "ai_chat_completed",
    status: "ok",
    provider: AI_PROVIDER_GROQ,
    model: aiProvider.model,
    topic,
    selectedIntent: classification?.selectedIntent || "",
    subdiagnostic: classification?.subdiagnostic || "",
    confidence: classification?.confidence || null,
    riskLevel: classification?.riskLevel || "",
    usedFileSearch: false,
    retriedWithoutJsonMode,
    redactionApplied,
    exampleCount: examples.length,
    account: { email: account.email || "" },
    usage: data.body?.usage || undefined
  });

  return sendJson(res, 200, {
    ok: true,
    answer,
    classification,
    model: aiProvider.model,
    provider: AI_PROVIDER_GROQ,
    topic,
    exampleCount: examples.length,
    usedFileSearch: false,
    retriedWithoutFileSearch: false,
    retriedWithFallbackModel: false,
    retriedWithoutJsonMode,
    redactionApplied
  });
}

async function handleAiSaveExample(req, res, payload) {
  const account = await requireAdminAccount(req);
  const example = await addAiExample({
    topic: payload.topic || inferTopic(payload.question || payload.answer || ""),
    question: payload.question,
    answer: payload.answer,
    notes: payload.notes,
    enabled: true
  }, account);
  return sendJson(res, 200, { ok: true, example });
}

async function handleAiFeedback(req, res, payload) {
  const account = await requireAdminAccount(req);
  const feedback = await addAiFeedback({
    topic: payload.topic || inferTopic(payload.question || payload.answer || payload.correction || ""),
    question: payload.question,
    answer: payload.answer,
    correction: payload.correction,
    status: "pending"
  }, account);
  return sendJson(res, 200, { ok: true, feedback });
}

async function handleLiveChatSendWelcome(req, res, payload) {
  const account = await requireCurrentAccount(req);
  requireLegacyAutoSafeSendsEnabled();
  const config = await getSupportConfig().catch(() => ({}));
  const automation = config.liveChatAutomation || {};
  const autoWelcome = automation.autoWelcome || {};

  if (automation.enabled === false || autoWelcome.enabled === false) {
    return sendJson(res, 403, { ok: false, error: "livechat_welcome_disabled" });
  }

  const allowedAgents = Array.isArray(autoWelcome.onlyForAgents) ? autoWelcome.onlyForAgents : [];
  if (allowedAgents.length && !allowedAgents.includes(String(account.email || "").trim().toLowerCase())) {
    return sendJson(res, 403, { ok: false, error: "livechat_agent_not_allowed" });
  }

  const chatId = cleanText(payload.chatId || payload.chat_id);
  const message = cleanText(payload.message || autoWelcome.message);
  if (!chatId) {
    return sendJson(res, 400, { ok: false, error: "missing_chat_id" });
  }

  if (autoWelcome.oncePerChat !== false) {
    const existing = await getLiveChatWelcomeRecord(chatId).catch(() => null);
    if (existing?.sentAt) {
      return sendJson(res, 200, {
        ok: true,
        skipped: true,
        reason: "welcome_already_sent",
        chatId,
        sentAt: existing.sentAt
      });
    }

    const chat = await getLiveChat(chatId).catch(() => null);
    if (chat && liveChatAlreadyHasMessage(chat, message)) {
      const sentAt = new Date().toISOString();
      await saveLiveChatWelcomeRecord(chatId, {
        sentAt,
        eventId: "",
        accountEmail: account.email || "",
        message,
        source: "history_detected"
      }).catch(() => null);
      return sendJson(res, 200, {
        ok: true,
        skipped: true,
        reason: "welcome_already_in_chat",
        chatId,
        sentAt
      });
    }
  }

  // Claim atomico para evitar bienvenidas duplicadas por disparos concurrentes.
  const oncePerChat = autoWelcome.oncePerChat !== false;
  if (oncePerChat) {
    const claimed = await claimLiveChatWelcome(chatId, { accountEmail: account.email || "", message });
    if (!claimed) {
      return sendJson(res, 200, {
        ok: true,
        skipped: true,
        reason: "welcome_already_sent",
        chatId
      });
    }
  }

  let result;
  try {
    result = await sendLiveChatMessage({ chatId, text: message });
  } catch (error) {
    // El envio fallo: liberamos el claim para permitir un reintento valido.
    if (oncePerChat) await releaseLiveChatWelcome(chatId).catch(() => null);
    throw error;
  }
  const verified = await verifyLiveChatMessage({
    chatId,
    eventId: result.event_id,
    text: message,
    visibility: "all"
  }).catch(() => false);
  const sentAt = new Date().toISOString();
  await saveLiveChatWelcomeRecord(chatId, {
    sentAt,
    eventId: result.event_id || "",
    accountEmail: account.email || "",
    message,
    verified
  }).catch(() => null);

  await writeAuditLog({
    type: "livechat_welcome_sent",
    status: verified ? "ok" : "verification_pending",
    chatId,
    eventId: result.event_id || "",
    account: { email: account.email || "" }
  });

  return sendJson(res, verified ? 200 : 202, {
    ok: true,
    chatId,
    eventId: result.event_id || "",
    sentAt,
    verified
  });
}

function liveChatAlreadyHasMessage(chat, message) {
  const expected = normalizeComparableText(message);
  if (!expected) return false;
  return extractLiveChatTextMessages(chat).some((event) =>
    normalizeComparableText(event.text) === expected &&
    !["customer", "visitor"].includes(String(event.authorType || "").toLowerCase())
  );
}

async function handleLiveChatSendMessage(req, res, payload) {
  await requireCurrentAccount(req);
  return sendJson(res, 409, {
    ok: false,
    error: "livechat_message_requires_case_approval"
  });
}

async function handleLiveChatAutoSafeTemplate(req, res, payload) {
  requireLegacyAutoSafeSendsEnabled();
  const account = await requireCurrentAccount(req);
  const config = await getSupportConfig().catch(() => ({}));
  const automation = config.liveChatAutomation || {};
  const mode = String(automation.safeTemplateMode || "suggest_only").trim().toLowerCase();
  const chatId = cleanText(payload.chatId || payload.chat_id);

  if (!chatId) {
    return sendJson(res, 400, { ok: false, error: "missing_chat_id" });
  }
  if (automation.enabled === false || mode !== "auto_send_safe") {
    return sendJson(res, 200, { ok: true, skipped: true, reason: "safe_template_mode_not_auto", mode });
  }

  const existing = await getLiveChatSafeTemplateRecord(chatId).catch(() => null);
  if (existing?.sentAt) {
    return sendJson(res, 200, {
      ok: true,
      skipped: true,
      reason: "safe_template_already_sent",
      intent: existing.intent || existing.safe_template_intent || "",
      sentAt: existing.sentAt
    });
  }

  const chat = await getLiveChat(chatId);
  const customerMessages = extractLiveChatCustomerMessages(chat);
  const usefulMessages = customerMessages
    .map((message) => ({ ...message, text: cleanText(message.text) }))
    .filter((message) => message.text && !isSimpleGreeting(message.text));
  const lastUseful = usefulMessages.at(-1);
  if (!lastUseful) {
    return sendJson(res, 200, { ok: true, skipped: true, reason: "no_useful_customer_message" });
  }

  const context = customerMessages.slice(-5).map((message) => message.text).filter(Boolean).join("\n");
  const match = findSafeAutoTemplateReply(lastUseful.text, context, { requireAutoSendAllowed: true });
  if (!match.matched) {
    await writeAuditLog({
      type: match.riskBlocked === true ? "livechat_widget_auto_safe_blocked_risk" : "livechat_widget_auto_safe_no_match",
      status: "skipped",
      chatId,
      reason: match.reason || "no_match",
      riskBlocked: match.riskBlocked === true,
      account: { email: account.email || "" }
    });
    return sendJson(res, 200, {
      ok: true,
      skipped: true,
      reason: match.reason || "no_match",
      riskBlocked: match.riskBlocked === true
    });
  }

  const result = await sendLiveChatMessage({ chatId, text: match.reply, visibility: "all" });
  const verified = await verifyLiveChatMessage({
    chatId,
    eventId: result.event_id,
    text: match.reply,
    visibility: "all"
  }).catch(() => false);
  const sentAt = new Date().toISOString();
  await saveLiveChatSafeTemplateRecord(chatId, {
    sentAt,
    intent: match.intent,
    category: match.category,
    eventId: result.event_id || "",
    source: "widget_auto_safe_template",
    verified
  }).catch(() => null);

  await writeAuditLog({
    type: "livechat_widget_auto_safe_sent",
    status: verified ? "ok" : "verification_pending",
    chatId,
    eventId: result.event_id || "",
    selectedIntent: match.intent,
    category: match.category,
    confidence: match.confidence || null,
    riskLevel: "low",
    source: "widget_auto_safe_template",
    account: { email: account.email || "" }
  });

  return sendJson(res, verified ? 200 : 202, {
    ok: true,
    sent: true,
    reason: "auto_safe_template_sent",
    chatId,
    eventId: result.event_id || "",
    intent: match.intent,
    category: match.category,
    sentAt,
    verified
  });
}

async function handleLiveChatListActive(req, res, payload) {
  await requireCurrentAccount(req);
  const chats = await listActiveLiveChats({ limit: payload.limit || 25 });
  return sendJson(res, 200, { ok: true, chats });
}

async function handleLiveChatGetChat(req, res, payload) {
  await requireCurrentAccount(req);
  const chatId = cleanText(payload.chatId || payload.chat_id);
  const chat = await getLiveChat(chatId);
  const customerMessages = extractLiveChatCustomerMessages(chat);
  return sendJson(res, 200, {
    ok: true,
    chat,
    customerMessages,
    text: customerMessages.map((message) => message.text).filter(Boolean).join("\n")
  });
}

async function handleLiveChatCustomerHistory(req, res, payload) {
  await requireCurrentAccount(req);
  const email = cleanText(payload.email).toLowerCase();
  const currentChatId = cleanText(payload.chatId || payload.chat_id);
  if (!email) {
    return sendJson(res, 200, { ok: true, history: [] });
  }

  const chats = await listActiveLiveChats({ limit: Math.min(100, Math.max(20, Number(payload.limit) || 60)) });
  const matching = chats
    .filter((chat) => chatIdFromLiveChat(chat) && chatIdFromLiveChat(chat) !== currentChatId)
    .filter((chat) => liveChatHasCustomerEmail(chat, email))
    .slice(0, 3);

  const details = await Promise.all(matching.map(async (summary) => {
    const chatId = chatIdFromLiveChat(summary);
    const chat = await getLiveChat(chatId).catch(() => summary);
    const messages = extractLiveChatTextMessages(chat)
      .filter((message) => message.text)
      .slice(-8);
    return {
      chatId,
      dateLabel: formatHistoryDate(chat, summary),
      summary: summarizeHistoryMessages(messages),
      messages: messages.slice(-4)
    };
  }));

  return sendJson(res, 200, { ok: true, history: details });
}

function chatIdFromLiveChat(chat = {}) {
  return cleanText(chat.id || chat.chat_id || chat.chat?.id || chat.chat?.chat_id);
}

function liveChatHasCustomerEmail(chat = {}, email = "") {
  const users = Array.isArray(chat.users) ? chat.users : Array.isArray(chat.chat?.users) ? chat.chat.users : [];
  return users.some((user) =>
    ["customer", "visitor"].includes(String(user?.type || "").toLowerCase()) &&
    cleanText(user?.email).toLowerCase() === email
  );
}

function formatHistoryDate(chat = {}, summary = {}) {
  const raw = chat.created_at || summary.created_at || chat.last_thread_summary?.created_at || summary.last_thread_summary?.created_at || "";
  if (!raw) return "Conversacion previa";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? "Conversacion previa" : date.toLocaleString("es-MX", { timeZone: "America/Mexico_City" });
}

function summarizeHistoryMessages(messages = []) {
  const useful = messages
    .map((message) => `${["customer", "visitor"].includes(message.authorType) ? "Cliente" : "Agente"}: ${cleanText(message.text)}`)
    .filter(Boolean)
    .slice(-6);
  return useful.join(" | ").slice(0, 900);
}

async function requireAdminAccount(req) {
  const account = await requireCurrentAccount(req);
  if (!(await isSupportAdmin(account.email))) {
    const error = new Error("admin_not_authorized");
    error.statusCode = 403;
    throw error;
  }
  return account;
}

async function requestOpenAi(apiKey, body) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const bodyData = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, status: response.status, error: bodyData.error || bodyData };
  }
  return { ok: true, status: response.status, body: bodyData };
}

function getOpenAiFallbackModel() {
  return optionalEnv("OPENAI_FALLBACK_MODEL", DEFAULT_OPENAI_FALLBACK_MODEL) || DEFAULT_OPENAI_FALLBACK_MODEL;
}

function isOpenAiRateLimit(data) {
  const status = Number(data?.status || 0);
  const code = String(data?.error?.code || data?.error?.type || "").toLowerCase();
  const message = String(data?.error?.message || data?.error || "").toLowerCase();
  return status === 429 || code.includes("rate") || message.includes("rate limit") || message.includes("tokens per min") || message.includes("tpm");
}

function isOpenAiQuotaExceeded(data) {
  const code = String(data?.error?.code || data?.error?.type || "").toLowerCase();
  const message = String(data?.error?.message || data?.error || "").toLowerCase();
  return code.includes("insufficient_quota")
    || message.includes("exceeded your current quota")
    || message.includes("check your plan and billing")
    || message.includes("billing details");
}

function buildTemplateFallbackResponse({ message = "", context = "", topic = "general", examples = [], intentCandidates = [], errorCode = "" } = {}) {
  const text = `${message}\n${context}`;
  const selected = intentCandidates[0] || null;
  const example = examples.find((item) => item.enabled !== false);
  const response = buildTemplateFallbackText(selected, example, text, topic);
  const missingData = inferTemplateMissingData(selected, text);

  return {
    answer: response,
    classification: {
      selectedIntent: selected?.intent || (example ? `ejemplo_aprobado_${example.topic || topic}` : "general"),
      subdiagnostic: selected?.subdiagnostics?.[0] || "plantilla_sin_gpt",
      confidence: selected ? inferTemplateConfidence(selected.score) : (example ? 0.45 : 0.25),
      missingData,
      riskLevel: normalizeRiskLevel(selected?.riskLevel || "medium"),
      canAutoRespond: selected?.canAutoRespond === true && missingData.length === 0,
      requiresTicket: selected?.requiresTicket === true,
      requiresDocuments: selected?.requiresDocuments === true,
      requiresScreenshot: selected?.requiresScreenshot === true,
      source: "template-fallback",
      response
    },
    errorCode
  };
}

function buildSafeTemplateFallbackResponse({ message = "", context = "", topic = "general" } = {}) {
  const text = `${message}\n${context}`;
  const selected = selectSafeFallbackTemplate(loadFallbackTemplates(), text);
  if (!selected) return null;

  const response = cleanText(isAngryCustomerText(text) && selected.angryCustomerResponse
    ? selected.angryCustomerResponse
    : selected.response);

  if (!response) return null;

  return {
    answer: response,
    classification: {
      selectedIntent: selected.intent,
      subdiagnostic: selected.subcategory || "plantilla_segura",
      category: selected.category || topic,
      confidence: inferTemplateConfidence(selected.score),
      missingData: [],
      riskLevel: "low",
      canAutoRespond: true,
      requiresTicket: false,
      requiresDocuments: false,
      requiresScreenshot: false,
      source: "safe-template-fallback",
      response
    }
  };
}

function selectSafeFallbackTemplate(templates = [], text = "") {
  if (!templates.length || hasHighRiskSupportSignal(text)) return null;

  const normalized = normalizeForSearch(text);
  const words = new Set(normalized.split(/[^a-z0-9]+/).filter((word) => word.length >= 4));
  const matches = templates
    .filter((template) => template?.status === "aprobada"
      && template.riskLevel === "low"
      && template.mode === "plantilla_segura"
      && template.canAutoRespond === true)
    .map((template) => {
      let score = 0;
      let strongTriggerMatches = 0;
      const triggers = normalizeAiStringList(template.triggers);
      for (const trigger of triggers) {
        const normalizedTrigger = normalizeForSearch(trigger);
        if (!normalizedTrigger || normalizedTrigger.length < 4) continue;
        if (normalized.includes(normalizedTrigger)) {
          score += 16;
          strongTriggerMatches += 1;
        } else if (isSafePartialTriggerMatch(normalized, normalizedTrigger)) {
          score += 9;
          strongTriggerMatches += 1;
        }
      }

      const haystack = normalizeForSearch([
        template.intent,
        template.category,
        template.subcategory,
        ...(template.triggers || [])
      ].join(" "));
      for (const word of words) {
        if (haystack.includes(word)) score += 1;
      }

      if (template.category === "depositos" && /\b(deposito|deposite|transferencia|spei|cep|comprobante|saldo)\b/i.test(normalized)) score += 4;
      if (template.category === "bonos_promociones" && /\b(bono|promocion|cashback)\b/i.test(normalized)) score += 4;
      if (template.category === "acceso_cuenta" && /\b(entrar|cuenta|contrasena|login|iniciar sesion)\b/i.test(normalized)) score += 4;
      if (template.category === "kyc_documentos" && /\b(ine|selfie|documento|verificacion)\b/i.test(normalized)) score += 4;

      return { ...template, score, strongTriggerMatches };
    })
    .filter((template) => template.score >= 14 && template.strongTriggerMatches >= 1)
    .sort((a, b) => b.score - a.score || String(a.intent).localeCompare(String(b.intent)));

  return matches[0] || null;
}

function isSafePartialTriggerMatch(normalizedText, normalizedTrigger) {
  const triggerWords = normalizedTrigger.split(/[^a-z0-9]+/).filter((word) => word.length >= 4);
  if (triggerWords.length < 2) return false;
  const matched = triggerWords.filter((word) => normalizedText.includes(word)).length;
  return matched >= Math.min(2, triggerWords.length);
}

function hasHighRiskSupportSignal(text = "") {
  const normalized = normalizeForSearch(text);
  const checks = [
    /\bretiro\b|\bretirar\b|\bwithdraw\b/,
    /failed|congelad|revision|revisando/,
    /bloquead|bloquearon|suspendid|desactivad/,
    /cerrar cuenta|cierre de cuenta|cancelar cuenta|autoexclusion|auto exclusion/,
    /suplantacion|fraude|fraudul|estafa|robo/,
    /demanda|demandar|legal|abogado|profeco|condusef/,
    /ganancia no reflejad|premio no aparece|no me pago|saldo descontad|quito dinero|quito mi saldo|me quito|me quit[oó]/,
    /molesto|enojad|indignad|queja|reclamo/
  ];
  return checks.some((pattern) => pattern.test(normalized));
}

function buildTemplateFallbackText(intent, example, text, topic) {
  if (intent?.templateFallbackResponse || intent?.templateFallbackAngryResponse) {
    return cleanText(isAngryCustomerText(text) && intent.templateFallbackAngryResponse
      ? intent.templateFallbackAngryResponse
      : intent.templateFallbackResponse);
  }
  if (intent?.baseResponse || intent?.angryCustomerResponse) {
    return cleanText(isAngryCustomerText(text) && intent.angryCustomerResponse ? intent.angryCustomerResponse : intent.baseResponse);
  }
  if (example?.answer) {
    return cleanText(example.answer);
  }

  if (topic === "depositos") {
    return "Para poder revisar correctamente tu deposito, necesitamos que nos compartas correo registrado, AUTH ID, monto, fecha y hora del deposito, clave de rastreo y evidencia completa de la transferencia. Si fue SPEI, comparte tambien el CEP de Banxico en PDF para validar el estado de la operacion.";
  }
  if (topic === "retiros") {
    return "Para revisar tu retiro, necesitamos validar el estado actual en sistema. Por favor comparte correo registrado, AUTH ID, monto del retiro y fecha de solicitud. No podemos prometer aprobacion, pago o tiempo exacto sin la validacion interna correspondiente.";
  }
  if (topic === "juegos") {
    return "Para revisar el caso con el juego, necesitamos nombre exacto del juego, captura o video del error, hora aproximada, dispositivo utilizado y si estabas usando WiFi o datos moviles. Con esa informacion podremos validar el caso sin prometer reposicion antes de revisar evidencia.";
  }

  return "Para poder darte una respuesta correcta, necesitamos revisar el caso con la informacion disponible. Si falta algun dato, comparte correo registrado, AUTH ID, descripcion del problema y evidencia del error o movimiento para continuar con el seguimiento correspondiente.";
}

function inferTemplateConfidence(score) {
  const value = Number(score || 0);
  if (value >= 24) return 0.84;
  if (value >= 14) return 0.72;
  if (value >= 6) return 0.58;
  return 0.42;
}

function inferTemplateMissingData(intent, text) {
  if (!intent?.requiredData?.length) return [];
  const normalized = normalizeForSearch(text);
  return normalizeAiStringList(intent.requiredData)
    .filter((item) => !templateDataLooksPresent(item, normalized))
    .slice(0, 6);
}

function templateDataLooksPresent(item, normalizedText) {
  const normalizedItem = normalizeForSearch(item);
  const checks = [
    ["correo", /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i],
    ["auth", /\b(auth|id)\b.{0,8}\d{3,}/i],
    ["monto", /\$\s?\d+|\b\d+([.,]\d{2})?\b/],
    ["fecha", /\b\d{1,2}[/-]\d{1,2}|\b\d{4}-\d{2}-\d{2}\b|ayer|hoy/i],
    ["hora", /\b\d{1,2}:\d{2}\b|am|pm/i],
    ["clave", /[a-z0-9]{10,}/i],
    ["cep", /\bcep\b/i],
    ["captura", /captura|foto|imagen|video|evidencia/i],
    ["juego", /juego|casino|slot|nombre del juego/i],
    ["dispositivo", /android|iphone|ios|celular|telefono|chrome|safari|pc|computadora/i]
  ];
  const matched = checks.find(([keyword]) => normalizedItem.includes(keyword));
  if (!matched) return normalizedText.includes(normalizedItem);
  return matched[1].test(normalizedText);
}

function isAngryCustomerText(text) {
  const normalized = normalizeForSearch(text);
  return [
    "molesto",
    "enojado",
    "robo",
    "estafa",
    "fraude",
    "demanda",
    "queja",
    "siempre",
    "nunca",
    "pesimo",
    "ratero"
  ].some((word) => normalized.includes(word));
}

function buildOpenAiRequestBody({ model, account, aiConfig, message, context, examples, intentsDataset, intentCandidates }) {
  const vectorStoreId = String(aiConfig.vectorStoreId || optionalEnv("OPENAI_VECTOR_STORE_ID") || "").trim();
  const tools = vectorStoreId
    ? [{
      type: "file_search",
      vector_store_ids: [vectorStoreId],
      max_num_results: Number(aiConfig.fileSearchMaxResults || 3) || 3
    }]
    : undefined;

  return {
    model,
    instructions: buildAiInstructions(account, aiConfig, examples, intentsDataset, intentCandidates),
    input: buildAiInput(message, context),
    max_output_tokens: Math.min(Number(optionalEnv("OPENAI_MAX_OUTPUT_TOKENS", "650")) || 650, 650),
    reasoning: { effort: optionalEnv("OPENAI_REASONING_EFFORT", "low") || "low" },
    tools
  };
}

function buildAiInstructions(account, aiConfig = {}, examples = [], intentsDataset = null, intentCandidates = [], options = {}) {
  const compact = Boolean(options.compact);
  return [
    "# Instrucciones base",
    aiConfig.baseInstructions || "Eres el asistente interno de soporte de Betxico para agentes humanos.",
    "# Contexto operativo",
    aiConfig.businessContext || "",
    "# Tono",
    aiConfig.toneRules || "",
    "# Reglas de seguridad",
    aiConfig.safetyRules || "",
    "# Formato",
    aiConfig.defaultResponseFormat || "",
    buildIntentDatasetBlock(intentsDataset, intentCandidates, { compact }),
    buildStructuredClassificationBlock(Boolean(intentsDataset), { compact }),
    buildExamplesBlock(examples),
    account ? "La solicitud proviene de un agente autenticado." : ""
  ].filter(Boolean).join("\n\n");
}

function redactExternalAiExamples(examples = []) {
  return examples.map((example) => ({
    ...example,
    question: redactExternalAiText(example.question),
    answer: redactExternalAiText(example.answer),
    notes: redactExternalAiText(example.notes),
    createdBy: example.createdBy ? "[AGENT_REDACTED]" : ""
  }));
}

function buildIntentDatasetBlock(intentsDataset, candidates = [], options = {}) {
  if (!intentsDataset?.intents?.length) {
    return [
      "# Clasificacion de intents",
      "El archivo local de intents no esta disponible o no se pudo parsear. Usa la base documental, ejemplos aprobados y contexto del caso como fallback. Mantiene las reglas: no inventar causas, no prometer tiempos, pagos, bonos ni aprobaciones."
    ].join("\n");
  }

  const compact = Boolean(options.compact);
  const compactCandidates = candidates.map((intent) => ({
    intent: intent.intent,
    category: intent.category,
    riskLevel: intent.riskLevel,
    priority: intent.priority,
    description: intent.description,
    triggers: compact ? undefined : normalizeAiStringList(intent.triggers).slice(0, 8),
    subdiagnostics: compact ? normalizeAiStringList(intent.subdiagnostics).slice(0, 5) : normalizeAiStringList(intent.subdiagnostics).slice(0, 8),
    requiredData: normalizeAiStringList(intent.requiredData).slice(0, 8),
    responseRules: normalizeAiStringList(intent.responseRules).slice(0, compact ? 5 : 8),
    forbiddenPhrases: normalizeAiStringList(intent.forbiddenPhrases).slice(0, compact ? 4 : 6),
    doNotUseWhen: compact ? undefined : normalizeAiStringList(intent.doNotUseWhen).slice(0, 5),
    requiresTicket: intent.requiresTicket,
    requiresDocuments: intent.requiresDocuments,
    requiresScreenshot: intent.requiresScreenshot,
    canAutoRespond: intent.canAutoRespond
  }));

  const lines = [
    "# Dataset operativo de intents",
    `Version: ${intentsDataset.version || "sin version"}`,
    "Usa primero los candidatos relevantes. Si ninguno encaja, usa un intent general con confianza baja.",
    "No crees intents nuevos. Si hay variaciones menores, usa subdiagnosticos del intent universal.",
    `Candidatos relevantes (${compactCandidates.length}):`,
    JSON.stringify(compactCandidates, null, 2)
  ];

  if (!compact) {
    lines.splice(2, 0, `Intents disponibles: ${intentsDataset.intents.map((intent) => intent.intent).join(", ")}`);
  }

  return lines.join("\n");
}

function buildStructuredClassificationBlock(hasDataset, options = {}) {
  if (options.compact) {
    return [
      "# Salida estructurada obligatoria",
      "Clasifica con el dataset y responde solo JSON valido. Si faltan datos criticos, pidelos antes de diagnosticar. No inventes causas ni prometas tiempos, bonos, pagos o aprobaciones.",
      hasDataset ? "Usa selectedIntent del dataset." : "Sin dataset: usa intent general con confidence baja.",
      JSON.stringify({
        selectedIntent: "intent",
        subdiagnostic: "subdiagnostico",
        confidence: 0.0,
        missingData: ["dato faltante"],
        riskLevel: "low|medium|high",
        canAutoRespond: false,
        requiresTicket: false,
        requiresDocuments: false,
        requiresScreenshot: false,
        response: "Respuesta sugerida."
      })
    ].join("\n");
  }

  return [
    "# Salida estructurada obligatoria",
    "Antes de redactar, clasifica el caso con el dataset de intents y consulta la base documental disponible por File Search si existe.",
    "Si hay duda entre un intent general y uno especifico, usa el especifico solo si cambia la accion operativa; si no, usa el general con subdiagnostico.",
    "Si faltan datos criticos, la respuesta debe pedir esos datos antes de diagnosticar de mas.",
    "Si canAutoRespond es false, la respuesta debe quedar claramente como sugerencia para agente, no como mensaje automatico enviado sin revision.",
    hasDataset ? "Usa selectedIntent del dataset. No inventes nombres de intents." : "Si el dataset no esta disponible, usa selectedIntent general y confidence baja.",
    "Devuelve exclusivamente JSON valido con esta forma exacta, sin markdown ni texto adicional:",
    JSON.stringify({
      selectedIntent: "intent_del_dataset_o_general",
      subdiagnostic: "subdiagnostico_operativo",
      confidence: 0.0,
      missingData: ["dato faltante"],
      riskLevel: "low|medium|high",
      canAutoRespond: false,
      requiresTicket: false,
      requiresDocuments: false,
      requiresScreenshot: false,
      response: "Respuesta sugerida lista para el agente o para pedir datos faltantes."
    }, null, 2)
  ].join("\n");
}

function buildExamplesBlock(examples) {
  if (!examples.length) return "";
  return [
    "# Ejemplos aprobados de Betxico",
    ...examples.map((example, index) => [
      `Ejemplo ${index + 1} (${example.topic})`,
      `Situacion: ${example.question}`,
      `Respuesta aprobada: ${example.answer}`,
      example.notes ? `Notas internas: ${example.notes}` : ""
    ].filter(Boolean).join("\n"))
  ].join("\n\n");
}

function buildAiInput(message, context) {
  const blocks = [];
  if (context) {
    blocks.push(`Contexto disponible de la app:\n${context}`);
  }
  blocks.push(`Consulta del agente:\n${message}`);
  return blocks.join("\n\n");
}

function extractAiText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n").trim() || "No pude generar una respuesta util. Intenta reformular la consulta.";
}

function loadIntentsDataset() {
  if (intentsDatasetCache !== null) return intentsDatasetCache;

  try {
    const parsed = JSON.parse(readFileSync(INTENTS_DATASET_PATH, "utf8"));
    intentsDatasetCache = parsed?.intents?.length ? parsed : null;
  } catch {
    intentsDatasetCache = null;
  }

  return intentsDatasetCache;
}

function loadFallbackTemplates() {
  if (fallbackTemplatesCache !== null) return fallbackTemplatesCache;

  try {
    const parsed = JSON.parse(readFileSync(FALLBACK_TEMPLATES_PATH, "utf8"));
    fallbackTemplatesCache = parsed?.templates?.length ? parsed.templates : [];
  } catch {
    fallbackTemplatesCache = [];
  }

  return fallbackTemplatesCache;
}

function mergeIntentDatasetWithFallbackTemplates(intentsDataset, fallbackTemplates = []) {
  if (!fallbackTemplates.length) return intentsDataset;
  const base = intentsDataset?.intents?.length
    ? { ...intentsDataset, intents: intentsDataset.intents.map((intent) => ({ ...intent })) }
    : { version: "fallback", intents: [] };
  const byIntent = new Map(base.intents.map((intent, index) => [intent.intent, index]));

  for (const template of fallbackTemplates) {
    if (!template?.intent || template.status !== "aprobada" || template.riskLevel !== "low" || template.mode !== "plantilla_segura") {
      continue;
    }
    const fallbackIntent = fallbackTemplateToIntent(template);
    const existingIndex = byIntent.get(fallbackIntent.intent);
    if (existingIndex === undefined) {
      byIntent.set(fallbackIntent.intent, base.intents.length);
      base.intents.push(fallbackIntent);
    } else {
      base.intents[existingIndex] = mergeFallbackIntent(base.intents[existingIndex], fallbackIntent);
    }
  }

  return base;
}

function fallbackTemplateToIntent(template) {
  return {
    intent: template.intent,
    category: template.category,
    description: `Plantilla segura aprobada para ${template.subcategory || template.intent}.`,
    triggers: normalizeAiStringList(template.triggers),
    subdiagnostics: normalizeAiStringList([template.subcategory]),
    requiredData: normalizeAiStringList(template.requiredData),
    responseRules: ["Usar solo cuando el caso coincida con la plantilla segura aprobada."],
    forbiddenPhrases: ["queda hoy", "te lo aseguro", "ya fue aprobado", "te damos un bono"],
    doNotUseWhen: normalizeAiStringList(template.doNotUseWhen),
    baseResponse: cleanText(template.response),
    angryCustomerResponse: cleanText(template.angryCustomerResponse),
    templateFallbackResponse: cleanText(template.response),
    templateFallbackAngryResponse: cleanText(template.angryCustomerResponse),
    internalRecommendation: "Fallback sin GPT desde plantillas aprobadas de Soporte 10.",
    requiresTicket: false,
    requiresDocuments: false,
    requiresScreenshot: false,
    canAutoRespond: template.canAutoRespond === true,
    relatedIntents: [],
    templateFallback: true
  };
}

function mergeFallbackIntent(existing, fallback) {
  return {
    ...existing,
    triggers: normalizeAiStringList([...(existing.triggers || []), ...(fallback.triggers || [])]),
    subdiagnostics: normalizeAiStringList([...(existing.subdiagnostics || []), ...(fallback.subdiagnostics || [])]),
    requiredData: normalizeAiStringList([...(existing.requiredData || []), ...(fallback.requiredData || [])]),
    responseRules: normalizeAiStringList([...(existing.responseRules || []), ...(fallback.responseRules || [])]),
    forbiddenPhrases: normalizeAiStringList([...(existing.forbiddenPhrases || []), ...(fallback.forbiddenPhrases || [])]),
    doNotUseWhen: normalizeAiStringList([...(existing.doNotUseWhen || []), ...(fallback.doNotUseWhen || [])]),
    templateFallbackResponse: fallback.templateFallbackResponse,
    templateFallbackAngryResponse: fallback.templateFallbackAngryResponse,
    canAutoRespond: existing.canAutoRespond === true || fallback.canAutoRespond === true,
    templateFallback: true
  };
}

function selectIntentCandidates(intentsDataset, text, limit = 8) {
  if (!intentsDataset?.intents?.length) return [];
  const normalized = normalizeForSearch(text);
  const words = new Set(normalized.split(/[^a-z0-9]+/).filter((word) => word.length >= 3));

  return intentsDataset.intents
    .map((intent) => {
      const haystack = normalizeForSearch([
        intent.intent,
        intent.category,
        intent.description,
        ...(intent.triggers || []),
        ...(intent.subdiagnostics || []),
        ...(intent.requiredData || [])
      ].join(" "));
      let score = 0;
      if (normalized.includes(normalizeForSearch(intent.intent))) score += 12;
      for (const trigger of intent.triggers || []) {
        if (normalized.includes(normalizeForSearch(trigger))) score += 8;
      }
      for (const subdiagnostic of intent.subdiagnostics || []) {
        if (normalized.includes(normalizeForSearch(subdiagnostic))) score += 4;
      }
      for (const word of words) {
        if (haystack.includes(word)) score += 1;
      }
      return { ...intent, score };
    })
    .filter((intent) => intent.score > 0)
    .sort((a, b) => b.score - a.score || String(a.intent).localeCompare(String(b.intent)))
    .slice(0, Math.max(3, Math.min(12, Number(limit) || 8)));
}

function parseAiClassification(text, intentsDataset) {
  const parsed = parseJsonObject(text);
  if (!parsed || typeof parsed !== "object") return null;

  const intents = new Set((intentsDataset?.intents || []).map((intent) => intent.intent));
  const selectedIntent = cleanText(parsed.selectedIntent).slice(0, 120);
  const normalizedIntent = intents.size && !intents.has(selectedIntent) ? "general" : selectedIntent;
  const confidence = clampConfidence(parsed.confidence);

  return {
    selectedIntent: normalizedIntent || "general",
    subdiagnostic: cleanText(parsed.subdiagnostic).slice(0, 160) || "sin_subdiagnostico_confirmado",
    confidence,
    missingData: normalizeAiStringList(parsed.missingData).slice(0, 12),
    riskLevel: normalizeRiskLevel(parsed.riskLevel),
    canAutoRespond: parsed.canAutoRespond === true,
    requiresTicket: parsed.requiresTicket === true,
    requiresDocuments: parsed.requiresDocuments === true,
    requiresScreenshot: parsed.requiresScreenshot === true,
    response: cleanText(parsed.response).slice(0, 8000) || "No pude generar una respuesta util. Intenta reformular la consulta."
  };
}

function parseJsonObject(text) {
  const clean = String(text || "").trim();
  if (!clean) return null;
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeAiStringList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanText(item).slice(0, 240)).filter(Boolean);
}

function normalizeRiskLevel(value) {
  const clean = String(value || "").trim().toLowerCase();
  return ["low", "medium", "high"].includes(clean) ? clean : "medium";
}

function clampConfidence(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

function normalizeForSearch(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function cleanText(value) {
  return String(value || "").replace(/\u0000/g, "").trim();
}

function normalizeComparableText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeSupportPayload(payload) {
  const ticket = payload?.ticket || {};
  const customer = payload?.customer || {};
  const livechat = payload?.livechat || {};
  const workflow = normalizeWorkflow(payload?.workflow || {});

  const summary = String(ticket.summary || "").trim();
  const description = String(ticket.description || ticket.notes || "").trim();
  const issueTypeId = String(ticket.issueTypeId || "").trim();
  const issueType = String(ticket.issueType || "Servicio al Cliente").trim();
  const destination = normalizeDestination(payload?.destination);
  const slackFields = normalizeSlackFields(payload?.slackFields || {});

  if (!summary || !description || (!issueTypeId && !issueType)) {
    const error = new Error("invalid_payload");
    error.statusCode = 400;
    throw error;
  }

  if ((destination === "slack" || destination === "both") && !hasRequiredSlackFields(slackFields, workflow)) {
    const error = new Error("invalid_slack_payload");
    error.statusCode = 400;
    throw error;
  }

  return {
    source: String(payload?.source || "livechat_agent_widget"),
    destination,
    workflow,
    livechat: {
      chatId: String(livechat.chatId || "").trim(),
      threadId: String(livechat.threadId || "").trim(),
      groupId: String(livechat.groupId || "").trim(),
      customerId: String(livechat.customerId || "").trim(),
      source: String(livechat.source || "").trim()
    },
    customer: {
      name: String(customer.name || "").trim(),
      email: String(customer.email || "").trim().toLowerCase(),
      authId: String(customer.authId || "").trim()
    },
    ticket: {
      issueTypeId,
      issueType,
      priority: String(ticket.priority || "Media").trim(),
      summary,
      description,
      category: String(ticket.category || issueType || "Soporte").trim(),
      labels: normalizeLabels(ticket.labels || "livechat soporte"),
      amplifyUrl: String(ticket.amplifyUrl || "").trim(),
      notes: String(ticket.notes || "").trim()
    },
    jiraFields: normalizeJiraFields(payload?.jiraFields || {}),
    slackFields,
    attachments: normalizeAttachments(payload?.attachments || [])
  };
}

function normalizeDestination(value) {
  const clean = String(value || "jira").trim().toLowerCase();
  return ["jira", "slack", "both"].includes(clean) ? clean : "jira";
}

function normalizeSlackFields(fields = {}) {
  return {
    agentName: String(fields.agentName || "").trim(),
    customerId: String(fields.customerId || "").trim(),
    customerEmail: String(fields.customerEmail || "").trim().toLowerCase(),
    game: String(fields.game || "").trim(),
    trackingKey: String(fields.trackingKey || "").trim(),
    amount: String(fields.amount || "").trim(),
    detail: String(fields.detail || "").trim()
  };
}

function normalizeWorkflow(workflow = {}) {
  return {
    id: String(workflow.id || "").trim(),
    label: String(workflow.label || workflow.name || workflow.id || "").trim(),
    slackRouteId: String(workflow.slackRouteId || workflow.routeId || "").trim(),
    slackTemplate: String(workflow.slackTemplate || workflow.template || "").trim(),
    messageOnly: Boolean(workflow.messageOnly),
    requiredSlackFields: normalizeStringList(workflow.requiredSlackFields || workflow.requiredFields || [])
  };
}

function hasRequiredSlackFields(fields = {}, workflow = {}) {
  const required = workflow.requiredSlackFields?.length
    ? workflow.requiredSlackFields
    : ["agentName", "customerId", "customerEmail", "trackingKey", "amount"];
  return required.every((field) => Boolean(fields[field]));
}

function normalizeStringList(values) {
  return Array.isArray(values)
    ? values.map((value) => String(value || "").trim()).filter(Boolean)
    : String(values || "").split(",").map((value) => value.trim()).filter(Boolean);
}

function normalizeLabels(value) {
  if (Array.isArray(value)) {
    return value.map((label) => String(label).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/[,\s]+/)
    .map((label) => label.trim())
    .filter(Boolean);
}

function normalizeJiraFields(fields) {
  return Object.entries(fields).reduce((acc, [fieldId, field]) => {
    const cleanFieldId = String(fieldId || "").trim();
    if (!cleanFieldId) return acc;

    acc[cleanFieldId] = {
      name: String(field?.name || cleanFieldId).trim(),
      value: field?.value ?? "",
      schema: {
        type: String(field?.schema?.type || "").trim(),
        items: String(field?.schema?.items || "").trim(),
        system: String(field?.schema?.system || "").trim(),
        custom: String(field?.schema?.custom || "").trim()
      }
    };
    return acc;
  }, {});
}

function normalizeAttachments(attachments) {
  return validateSupportAttachments(attachments);
}
