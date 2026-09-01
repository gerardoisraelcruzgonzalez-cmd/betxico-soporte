import { evidenceFromCompletedAtenaJob } from "./case-bridge-tools.js";
import { deterministicCaseReply } from "./case-decision-engine.js";
import { evolveSupportCase } from "./case-orchestrator.js";
import { getSupportCase, updateSupportCase } from "./case-store.js";
import { getSupportConfig } from "./remote-config.js";
import { writeAuditLog } from "./audit.js";
import {
  claimLiveChatEvidenceResponse,
  releaseLiveChatEvidenceResponse,
  saveLiveChatEvidenceResponse,
  sendLiveChatMessage,
  verifyLiveChatMessage
} from "./livechat.js";

const AUTO_SEND_ROUTES = new Set(["withdrawal_awaiting_approval", "kyc_document_required"]);

// Jira and Lista 8 are already normalized evidence when case-refresh runs.
// This handles the document-request route immediately; Atena and Bob use their
// own completion callbacks because their browser work is asynchronous.
export async function processVerifiedCaseDecision(caseRecord, options = {}) {
  const route = String(caseRecord?.operationalDecision?.route || "");
  if (!AUTO_SEND_ROUTES.has(route)) return { state: "skipped", reason: "route_requires_human_review" };
  const config = options.config || await getSupportConfig();
  const automation = config?.liveChatAutomation || {};
  if (automation.enabled === false || String(automation.evidenceResponseMode || "auto_send_verified").toLowerCase() !== "auto_send_verified") {
    return { state: "ready_for_review", route };
  }
  const chatId = String(caseRecord?.chatId || "").trim();
  if (!chatId) return { state: "skipped", reason: "missing_chat_id" };
  const source = String(caseRecord?.operationalDecision?.source || "case_evidence");
  const evidenceId = `decision:${route}:${String(caseRecord?.operationalDecision?.sourceReference || source)}`;
  if (!(await claimLiveChatEvidenceResponse(chatId, evidenceId, { route, source }))) return { state: "duplicate" };
  const text = deterministicCaseReply(caseRecord);
  try {
    const result = await sendLiveChatMessage({ chatId, text, visibility: "all" });
    const verified = await verifyLiveChatMessage({ chatId, eventId: result.event_id, text, visibility: "all" }).catch(() => false);
    const sentAt = new Date().toISOString();
    await saveLiveChatEvidenceResponse(chatId, evidenceId, { pending: false, sentAt, verified, eventId: result.event_id || "", route, source });
    await saveCaseResponseState(chatId, caseRecord, { state: verified ? "sent_verified" : "sent_verification_pending", route, source, evidenceId, eventId: result.event_id || "", sentAt, verified });
    return { state: "sent", verified };
  } catch (error) {
    await releaseLiveChatEvidenceResponse(chatId, evidenceId).catch(() => null);
    throw error;
  }
}

export async function processCaseAcknowledgement(caseRecord, options = {}) {
  const chatId = String(caseRecord?.chatId || "").trim();
  const workflow = String(caseRecord?.workflow?.id || "");
  const route = String(caseRecord?.operationalDecision?.route || "");
  const atenaPending = caseRecord?.systemFacts?.caseAtenaLookup?.status === "unavailable"
    && /atena_lookup_pending$/u.test(String(caseRecord?.systemFacts?.caseAtenaLookup?.error?.code || ""));
  const text = route === "game_sessions_closing"
    ? "Dame un momento, por favor. Permanece en el chat mientras verifico tus sesiones para ayudarte a ingresar al juego."
    : workflow === "withdrawal" && atenaPending
      ? "Dame un momento, por favor. Permanece en el chat mientras verifico los datos de tu retiro."
      : "";
  if (!chatId || !text) return { state: "skipped" };
  const config = options.config || await getSupportConfig();
  const automation = config?.liveChatAutomation || {};
  if (automation.enabled === false || String(automation.evidenceResponseMode || "auto_send_verified").toLowerCase() !== "auto_send_verified") {
    return { state: "ready_for_review" };
  }
  const evidenceId = `ack:${workflow}:${route || "pending"}`;
  if (!(await claimLiveChatEvidenceResponse(chatId, evidenceId, { route: route || workflow, source: "conversation" }))) return { state: "duplicate" };
  try {
    const result = await sendLiveChatMessage({ chatId, text, visibility: "all" });
    const verified = await verifyLiveChatMessage({ chatId, eventId: result.event_id, text, visibility: "all" }).catch(() => false);
    await saveLiveChatEvidenceResponse(chatId, evidenceId, {
      pending: false,
      sentAt: new Date().toISOString(),
      verified,
      eventId: result.event_id || "",
      route: route || workflow,
      source: "conversation"
    });
    return { state: "sent", verified };
  } catch (error) {
    await releaseLiveChatEvidenceResponse(chatId, evidenceId).catch(() => null);
    throw error;
  }
}

// Atena is completed by the authenticated local connector. This coordinator is
// deliberately source-agnostic: it receives a normalized evidence envelope and
// only performs an outward action for routes explicitly approved below.
export async function processCompletedAtenaEvidence(job, options = {}) {
  const config = options.config || await getSupportConfig();
  const automation = config?.liveChatAutomation || {};
  const caseIds = normalizeCaseIds(job?.caseIds);
  const summary = { processed: 0, sent: 0, skipped: 0, failed: 0 };
  if (!caseIds.length) return { ...summary, skipped: 1, reason: "atena_job_without_case" };

  for (const chatId of caseIds) {
    const outcome = await processCase(job, chatId, automation, options).catch(async (error) => {
      await writeAuditLog({
        type: "support_case_evidence_auto_response_failed",
        status: "error",
        chatId,
        source: "atena",
        error: error.message || "evidence_auto_response_failed"
      }).catch(() => null);
      return { state: "failed" };
    });
    summary.processed += 1;
    if (outcome.state === "sent") summary.sent += 1;
    else if (outcome.state === "failed") summary.failed += 1;
    else summary.skipped += 1;
  }
  return summary;
}

async function processCase(job, chatId, automation, options) {
  const existing = await getSupportCase(chatId);
  if (!existing) return { state: "skipped", reason: "support_case_not_found" };
  if (normalizeEmail(existing.customer?.email) !== normalizeEmail(job.email)) {
    return { state: "skipped", reason: "case_email_mismatch" };
  }
  const atena = evidenceFromCompletedAtenaJob(job, {
    email: existing.customer?.email,
    hashSecret: options.hashSecret,
    now: options.now
  });
  if (!atena) return { state: "skipped", reason: "atena_evidence_invalid" };

  const updated = await updateSupportCase(chatId, (current) => evolveSupportCase(current || existing, {
    chatId,
    customer: (current || existing).customer,
    events: [],
    systemFacts: { caseAtenaLookup: atena },
    source: (current || existing).source,
    now: options.now || new Date().toISOString()
  }));
  const route = String(updated.operationalDecision?.route || "");
  const mode = String(automation.evidenceResponseMode || "auto_send_verified").trim().toLowerCase();
  if (automation.enabled === false || mode !== "auto_send_verified" || !AUTO_SEND_ROUTES.has(route)) {
    await saveCaseResponseState(chatId, updated, {
      state: "ready_for_review",
      route,
      source: "atena",
      reason: automation.enabled === false
        ? "automation_disabled"
        : mode !== "auto_send_verified"
          ? "evidence_response_suggest_only"
          : "route_requires_human_review"
    });
    return { state: "skipped", reason: "response_not_auto_sendable" };
  }

  const responseText = deterministicCaseReply(updated);
  if (!responseText) return { state: "skipped", reason: "empty_verified_response" };
  const evidenceId = String(job.id || "").trim();
  const claimed = await claimLiveChatEvidenceResponse(chatId, evidenceId, { route, source: "atena" });
  if (!claimed) return { state: "skipped", reason: "evidence_response_already_claimed" };

  try {
    const result = await sendLiveChatMessage({ chatId, text: responseText, visibility: "all" });
    const verified = await verifyLiveChatMessage({
      chatId,
      eventId: result.event_id,
      text: responseText,
      visibility: "all"
    }).catch(() => false);
    const sentAt = new Date().toISOString();
    await saveLiveChatEvidenceResponse(chatId, evidenceId, {
      pending: false,
      sentAt,
      verified,
      eventId: result.event_id || "",
      route,
      source: "atena"
    });
    await saveCaseResponseState(chatId, updated, {
      state: verified ? "sent_verified" : "sent_verification_pending",
      route,
      source: "atena",
      evidenceId,
      eventId: result.event_id || "",
      sentAt,
      verified
    });
    await writeAuditLog({
      type: "support_case_evidence_auto_response_sent",
      status: verified ? "ok" : "verification_pending",
      chatId,
      source: "atena",
      route,
      eventId: result.event_id || ""
    }).catch(() => null);
    return { state: "sent", verified };
  } catch (error) {
    await releaseLiveChatEvidenceResponse(chatId, evidenceId).catch(() => null);
    await saveCaseResponseState(chatId, updated, {
      state: "send_failed",
      route,
      source: "atena",
      evidenceId,
      reason: error.message || "livechat_send_failed"
    });
    throw error;
  }
}

async function saveCaseResponseState(chatId, fallback, responseAutomation) {
  return updateSupportCase(chatId, (current) => ({
    ...(current || fallback),
    responseAutomation: {
      ...(current || fallback)?.responseAutomation,
      ...responseAutomation,
      updatedAt: new Date().toISOString()
    }
  }));
}

function normalizeCaseIds(value) {
  return [...new Set((Array.isArray(value) ? value : [])
    .map((item) => String(item || "").trim().slice(0, 180))
    .filter(Boolean))].slice(-20);
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) ? email : "";
}
