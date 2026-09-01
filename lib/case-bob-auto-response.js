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

// Bob owns only the session-close side effect. This module translates its
// verified result into the case record and optional customer message.
export async function registerAutomaticBobClosure(caseRecord, { ownerEmail, createBobJob } = {}) {
  const chatId = String(caseRecord?.chatId || "").trim();
  const customerId = String(caseRecord?.customer?.authId || caseRecord?.customer?.id || "").replace(/\D/gu, "");
  const existing = caseRecord?.systemFacts?.caseBobClosure;
  if (!chatId || !/^\d{3,20}$/u.test(customerId) || typeof createBobJob !== "function") return null;
  if (["pending", "processing", "retry_waiting", "completed"].includes(String(existing?.status || ""))) return existing;

  const job = await createBobJob({
    ownerEmail,
    customerId,
    chatId,
    reportedGame: String(caseRecord?.facts?.gameName || "")
  });
  const snapshot = publicBobSnapshot(job);
  await updateSupportCase(chatId, (current) => evolveSupportCase(current || caseRecord, {
    chatId,
    customer: (current || caseRecord).customer,
    events: [],
    systemFacts: { caseBobClosure: snapshot },
    source: (current || caseRecord).source,
    now: new Date().toISOString()
  }));
  await writeAuditLog({
    type: "support_case_bob_auto_closure_requested",
    status: "ok",
    chatId,
    source: "bob",
    jobId: job.id
  }).catch(() => null);
  return snapshot;
}

export async function processCompletedBobClosure(job, options = {}) {
  const chatId = String(job?.chatId || "").trim();
  if (!chatId || job?.status !== "completed") return { state: "skipped", reason: "bob_job_not_completed_or_unbound" };
  const existing = await getSupportCase(chatId);
  if (!existing) return { state: "skipped", reason: "support_case_not_found" };

  const updated = await updateSupportCase(chatId, (current) => evolveSupportCase(current || existing, {
    chatId,
    customer: (current || existing).customer,
    events: [],
    systemFacts: { caseBobClosure: publicBobSnapshot(job) },
    source: (current || existing).source,
    now: new Date().toISOString()
  }));
  const config = options.config || await getSupportConfig();
  const mode = String(config?.liveChatAutomation?.evidenceResponseMode || "suggest_only").toLowerCase();
  const enabled = config?.liveChatAutomation?.enabled !== false;
  if (!enabled || mode !== "auto_send_verified" || updated.operationalDecision?.route !== "game_sessions_closed") {
    return { state: "ready_for_review", route: updated.operationalDecision?.route || "" };
  }

  const evidenceId = `bob:${job.id}`;
  if (!(await claimLiveChatEvidenceResponse(chatId, evidenceId, { route: "game_sessions_closed", source: "bob" }))) {
    return { state: "duplicate" };
  }
  const text = deterministicCaseReply(updated);
  try {
    const sent = await sendLiveChatMessage({ chatId, text, visibility: "all" });
    const verified = await verifyLiveChatMessage({ chatId, eventId: sent.event_id, text, visibility: "all" }).catch(() => false);
    await saveLiveChatEvidenceResponse(chatId, evidenceId, {
      pending: false,
      sentAt: new Date().toISOString(),
      verified,
      eventId: sent.event_id || "",
      route: "game_sessions_closed",
      source: "bob"
    });
    await writeAuditLog({
      type: "support_case_bob_auto_response_sent",
      status: verified ? "ok" : "verification_pending",
      chatId,
      source: "bob",
      jobId: job.id,
      eventId: sent.event_id || ""
    }).catch(() => null);
    return { state: "sent", verified };
  } catch (error) {
    await releaseLiveChatEvidenceResponse(chatId, evidenceId).catch(() => null);
    throw error;
  }
}

function publicBobSnapshot(job = {}) {
  const result = job?.result || {};
  return {
    jobId: String(job?.id || ""),
    status: String(job?.status || "pending"),
    createdAt: String(job?.createdAt || ""),
    completedAt: String(job?.completedAt || ""),
    closedCount: Number(result?.closedCount || result?.closedSessions?.length || 0),
    pendingCount: Number(result?.pendingSessions?.length || 0),
    pendingWinCount: Number(result?.pendingWins?.remainingAfterVerification?.length || 0)
  };
}
