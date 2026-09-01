import { validateCaseActionApproval } from "./case-operation-contracts.js";
import { evaluateCaseResponsePolicy } from "./case-response-policy.js";

const ALLOWED_ACTIONS = new Set([
  "jira.comment",
  "slack.notify",
  "livechat.send_message"
]);

export async function executeCaseAction({
  proposal,
  approval,
  caseRecord,
  dependencies = {},
  now
} = {}) {
  const actionType = String(proposal?.actionType || "").trim();
  const baseResult = {
    actionType,
    proposalId: String(proposal?.proposalId || ""),
    approvalId: String(approval?.approvalId || ""),
    chatId: String(caseRecord?.chatId || ""),
    idempotencyKey: "",
    verified: false
  };

  if (!ALLOWED_ACTIONS.has(actionType)) {
    return rejected(baseResult, "case_action_forbidden");
  }

  const authorization = validateCaseActionApproval({
    proposal,
    approval,
    caseRecord,
    now
  });
  if (!authorization.ok) {
    return rejected(baseResult, authorization.reason);
  }

  const authorizedResult = {
    ...baseResult,
    idempotencyKey: authorization.idempotencyKey
  };
  if (actionType === "livechat.send_message") {
    const responsePolicy = evaluateCaseResponsePolicy(caseRecord, proposal?.payload?.text, { now });
    if (!responsePolicy.ok) {
      return rejected(authorizedResult, responsePolicy.reason);
    }
  }
  const dependency = dependencies?.[actionType];
  if (typeof dependency?.execute !== "function" || typeof dependency?.verify !== "function") {
    return failed(authorizedResult, "case_action_dependency_unavailable");
  }

  const operation = {
    actionType,
    payload: proposal.payload,
    idempotencyKey: authorization.idempotencyKey,
    proposalId: proposal.proposalId,
    chatId: proposal.chatId,
    caseRevision: proposal.caseRevision
  };

  let execution;
  try {
    execution = await dependency.execute(operation);
  } catch (error) {
    return failed(authorizedResult, normalizeFailureCode(error, "case_action_execution_failed"));
  }

  const verificationRef = buildVerificationRef(actionType, execution);

  let verification;
  try {
    verification = await dependency.verify({ ...operation, execution: verificationRef });
  } catch (error) {
    return pending(
      authorizedResult,
      normalizeFailureCode(error, "case_action_verification_failed"),
      verificationRef
    );
  }

  if (!isVerified(verification)) {
    return pending(authorizedResult, "case_action_verification_unconfirmed", verificationRef);
  }

  return {
    ...authorizedResult,
    status: "verified",
    reason: "action_verified",
    executed: true,
    verified: true,
    verificationRef
  };
}

export async function verifyCaseActionExecution({ actionRecord, dependencies = {} } = {}) {
  const actionType = String(actionRecord?.proposal?.actionType || "").trim();
  const baseResult = {
    actionType,
    proposalId: String(actionRecord?.proposalId || actionRecord?.proposal?.proposalId || ""),
    approvalId: String(actionRecord?.approval?.approvalId || ""),
    chatId: String(actionRecord?.proposal?.chatId || ""),
    idempotencyKey: String(actionRecord?.idempotencyKey || ""),
    executed: true,
    verified: false
  };

  if (!ALLOWED_ACTIONS.has(actionType)) return rejected(baseResult, "case_action_forbidden");
  if (actionRecord?.status !== "verification_pending") {
    return rejected(baseResult, "case_action_not_pending_verification");
  }

  const verificationRef = sanitizeVerificationRef(
    actionType,
    actionRecord?.execution?.result?.verificationRef
  );
  if (!hasVerificationReference(actionType, verificationRef)) {
    return pending(baseResult, "case_action_verification_reference_missing", verificationRef);
  }

  const dependency = dependencies?.[actionType];
  if (typeof dependency?.verify !== "function") {
    return pending(baseResult, "case_action_dependency_unavailable", verificationRef);
  }

  let verification;
  try {
    verification = await dependency.verify({
      actionType,
      payload: actionRecord.proposal.payload,
      execution: verificationRef,
      idempotencyKey: actionRecord.idempotencyKey,
      proposalId: actionRecord.proposal.proposalId,
      chatId: actionRecord.proposal.chatId,
      caseRevision: actionRecord.proposal.caseRevision
    });
  } catch (error) {
    return pending(baseResult, normalizeFailureCode(error, "case_action_verification_failed"), verificationRef);
  }

  if (!isVerified(verification)) {
    return pending(baseResult, "case_action_verification_unconfirmed", verificationRef);
  }

  return {
    ...baseResult,
    status: "verified",
    reason: "action_verified",
    verified: true,
    verificationRef
  };
}

export async function reconcileCaseActionExecution({ actionRecord, dependencies = {} } = {}) {
  const actionType = String(actionRecord?.proposal?.actionType || "").trim();
  const baseResult = {
    actionType,
    proposalId: String(actionRecord?.proposalId || actionRecord?.proposal?.proposalId || ""),
    approvalId: String(actionRecord?.approval?.approvalId || ""),
    chatId: String(actionRecord?.proposal?.chatId || ""),
    idempotencyKey: String(actionRecord?.idempotencyKey || ""),
    executed: true,
    verified: false
  };

  if (!ALLOWED_ACTIONS.has(actionType)) return rejected(baseResult, "case_action_forbidden");
  if (actionRecord?.status !== "executing") {
    return rejected(baseResult, "case_action_not_executing");
  }

  const dependency = dependencies?.[actionType];
  if (typeof dependency?.reconcile !== "function" || typeof dependency?.verify !== "function") {
    return pending(baseResult, "case_action_reconciliation_unavailable");
  }

  let externalReference;
  try {
    externalReference = await dependency.reconcile({
      actionType,
      payload: actionRecord.proposal.payload,
      idempotencyKey: actionRecord.idempotencyKey,
      proposalId: actionRecord.proposal.proposalId,
      chatId: actionRecord.proposal.chatId,
      caseRevision: actionRecord.proposal.caseRevision,
      startedAt: actionRecord.execution?.startedAt || actionRecord.updatedAt || ""
    });
  } catch (error) {
    return pending(baseResult, normalizeFailureCode(error, "case_action_reconciliation_failed"));
  }

  const verificationRef = sanitizeVerificationRef(actionType, externalReference);
  if (!hasVerificationReference(actionType, verificationRef)) {
    return pending(baseResult, "case_action_reconciliation_unconfirmed", verificationRef);
  }

  let verification;
  try {
    verification = await dependency.verify({
      actionType,
      payload: actionRecord.proposal.payload,
      execution: verificationRef,
      idempotencyKey: actionRecord.idempotencyKey,
      proposalId: actionRecord.proposal.proposalId,
      chatId: actionRecord.proposal.chatId,
      caseRevision: actionRecord.proposal.caseRevision
    });
  } catch (error) {
    return pending(baseResult, normalizeFailureCode(error, "case_action_verification_failed"), verificationRef);
  }

  if (!isVerified(verification)) {
    return pending(baseResult, "case_action_verification_unconfirmed", verificationRef);
  }
  return {
    ...baseResult,
    status: "verified",
    reason: "action_reconciled_and_verified",
    verified: true,
    verificationRef
  };
}

function rejected(result, reason) {
  return {
    ...result,
    status: "rejected",
    reason,
    executed: false
  };
}

function failed(result, reason) {
  return {
    ...result,
    status: "execution_failed",
    reason,
    executed: false
  };
}

function pending(result, reason, verificationRef = null) {
  return {
    ...result,
    status: "verification_pending",
    reason,
    executed: true,
    verificationRef
  };
}

function buildVerificationRef(actionType, execution) {
  if (actionType === "jira.comment") {
    return sanitizeVerificationRef(actionType, { id: execution?.id || execution?.commentId });
  }
  if (actionType === "slack.notify") {
    return sanitizeVerificationRef(actionType, { channel: execution?.channel, ts: execution?.ts });
  }
  if (actionType === "livechat.send_message") {
    return sanitizeVerificationRef(actionType, {
      event_id: execution?.event_id || execution?.eventId || execution?.messageId
    });
  }
  return null;
}

function sanitizeVerificationRef(actionType, value = {}) {
  if (actionType === "jira.comment") {
    return { id: cleanReference(value?.id, 120) };
  }
  if (actionType === "slack.notify") {
    return {
      channel: cleanReference(value?.channel, 120),
      ts: cleanReference(value?.ts, 80)
    };
  }
  if (actionType === "livechat.send_message") {
    return { event_id: cleanReference(value?.event_id, 180) };
  }
  return null;
}

function hasVerificationReference(actionType, value) {
  if (actionType === "jira.comment") return Boolean(value?.id);
  if (actionType === "slack.notify") return Boolean(value?.channel && value?.ts);
  if (actionType === "livechat.send_message") return Boolean(value?.event_id);
  return false;
}

function cleanReference(value, maxLength) {
  return String(value || "")
    .replace(/[^A-Za-z0-9._:-]/gu, "")
    .slice(0, maxLength);
}

function isVerified(value) {
  return value === true || value?.verified === true || value?.confirmed === true;
}

function normalizeFailureCode(error, fallback) {
  const candidate = String(error?.code || "").trim().toLowerCase();
  return /^[a-z][a-z0-9_.-]{0,99}$/.test(candidate) ? candidate : fallback;
}
