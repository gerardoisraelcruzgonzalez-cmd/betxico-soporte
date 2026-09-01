import crypto from "node:crypto";

export const CASE_TOOL_STATUSES = Object.freeze({
  AVAILABLE: "available",
  NOT_FOUND: "not_found",
  UNAVAILABLE: "unavailable",
  STALE: "stale"
});

export const CASE_ACTION_TYPES = Object.freeze({
  JIRA_COMMENT: "jira.comment",
  SLACK_NOTIFY: "slack.notify",
  LIVECHAT_SEND_MESSAGE: "livechat.send_message"
});

const TOOL_STATUSES = new Set(Object.values(CASE_TOOL_STATUSES));
const ACTION_POLICIES = Object.freeze({
  [CASE_ACTION_TYPES.JIRA_COMMENT]: actionPolicy("medium", ["agent", "admin"]),
  [CASE_ACTION_TYPES.SLACK_NOTIFY]: actionPolicy("high", ["agent", "admin"]),
  [CASE_ACTION_TYPES.LIVECHAT_SEND_MESSAGE]: actionPolicy("high", ["agent", "admin"])
});
const BLOCKED_ACTIONS = new Set([
  "kyc.update",
  "kyc.approve",
  "withdrawal.approve",
  "withdrawal.pay",
  "bank_account.update",
  "account.close"
]);
const DEFAULT_TOOL_TTL_SECONDS = 5 * 60;
const DEFAULT_APPROVAL_TTL_SECONDS = 10 * 60;

export function normalizeCaseToolResult(input = {}, options = {}) {
  const now = validIso(options.now || input.checkedAt) || new Date().toISOString();
  const tool = normalizeIdentifier(input.tool, 100);
  const source = clean(input.source).slice(0, 160);
  const status = TOOL_STATUSES.has(input.status) ? input.status : CASE_TOOL_STATUSES.UNAVAILABLE;
  if (!tool || !source) throw contractError("invalid_case_tool_result");

  const checkedAt = validIso(input.checkedAt) || now;
  const ttlSeconds = clampInt(input.ttlSeconds, DEFAULT_TOOL_TTL_SECONDS, 30, 24 * 60 * 60);
  const expiresAt = validIso(input.expiresAt) || addSeconds(checkedAt, ttlSeconds);
  const queryHash = clean(input.queryHash || input.query?.hash).slice(0, 64);
  const queryType = normalizeIdentifier(
    input.query?.type || input.queryType || input.data?.queryType || "unknown",
    40
  ) || "unknown";
  const verified = input.verified === true
    && [CASE_TOOL_STATUSES.AVAILABLE, CASE_TOOL_STATUSES.NOT_FOUND].includes(status);

  return {
    tool,
    mode: "read",
    status,
    verified,
    source,
    queryHash,
    query: {
      type: queryType,
      hash: queryHash
    },
    checkedAt,
    expiresAt,
    freshness: {
      ttlSeconds,
      expiresAt
    },
    data: sanitizeContractValue(input.data),
    error: normalizeContractError(input.error)
  };
}

export function buildCaseToolQueryHash(value) {
  return digest(stableStringify(sanitizeContractValue(value)));
}

export function isCaseToolResultUsable(result, now = new Date().toISOString()) {
  if (!result || result.mode !== "read" || result.verified !== true) return false;
  if (![CASE_TOOL_STATUSES.AVAILABLE, CASE_TOOL_STATUSES.NOT_FOUND].includes(result.status)) return false;
  const expiresAt = Date.parse(result.expiresAt || "");
  const current = Date.parse(validIso(now) || "");
  return Number.isFinite(expiresAt) && Number.isFinite(current) && expiresAt > current;
}

export function publicCaseToolResult(result) {
  if (!result || typeof result !== "object") return null;
  const data = result.data && typeof result.data === "object"
    ? { ...result.data }
    : {};
  delete data.bridge;
  return {
    ...result,
    data
  };
}

export function createCaseActionProposal({ caseRecord, actionType, payload, reason = "", proposedBy, now, ttlSeconds } = {}) {
  const policy = getCaseActionPolicy(actionType);
  if (!caseRecord?.chatId || !Number.isFinite(Number(caseRecord?.revision))) {
    throw contractError("invalid_case_for_action");
  }

  const proposedAt = validIso(now) || new Date().toISOString();
  const expiresAt = addSeconds(
    proposedAt,
    clampInt(ttlSeconds, DEFAULT_APPROVAL_TTL_SECONDS, 60, 60 * 60)
  );
  const normalizedPayload = sanitizeContractValue(payload);
  const normalizedProposer = normalizeProposer(proposedBy);
  const caseFingerprint = buildCaseFingerprint(caseRecord);
  const proposalSeed = {
    chatId: caseRecord.chatId,
    caseRevision: Number(caseRecord.revision),
    caseFingerprint,
    actionType,
    payload: normalizedPayload,
    proposedBy: normalizedProposer
  };

  return {
    proposalId: `proposal_${digest(stableStringify(proposalSeed)).slice(0, 32)}`,
    status: "proposed",
    chatId: String(caseRecord.chatId),
    caseRevision: Number(caseRecord.revision),
    caseFingerprint,
    actionType,
    riskLevel: policy.riskLevel,
    requiresHumanApproval: true,
    payload: normalizedPayload,
    proposedBy: normalizedProposer,
    reason: clean(reason).slice(0, 500),
    proposedAt,
    expiresAt
  };
}

export function approveCaseAction(proposal, account = {}, options = {}) {
  const now = validIso(options.now) || new Date().toISOString();
  const email = normalizeEmail(account.email);
  const role = normalizeRole(account.role);
  const policy = getCaseActionPolicy(proposal?.actionType);

  if (!email || !policy.approverRoles.includes(role)) throw contractError("case_action_approver_not_allowed", 403);
  if (proposal?.status !== "proposed" || !proposal?.proposalId) throw contractError("invalid_case_action_proposal");
  if (Date.parse(proposal.expiresAt || "") <= Date.parse(now)) throw contractError("case_action_proposal_expired", 409);

  const expiresAt = earlierIso(
    proposal.expiresAt,
    addSeconds(now, clampInt(options.ttlSeconds, DEFAULT_APPROVAL_TTL_SECONDS, 60, 60 * 60))
  );
  return {
    approvalId: `approval_${digest(`${proposal.proposalId}|${email}|${now}`).slice(0, 32)}`,
    status: "approved",
    proposalId: proposal.proposalId,
    chatId: proposal.chatId,
    caseRevision: proposal.caseRevision,
    caseFingerprint: proposal.caseFingerprint,
    actionType: proposal.actionType,
    approvedBy: { email, role },
    approvedAt: now,
    expiresAt
  };
}

export function validateCaseActionApproval({ proposal, approval, caseRecord, now } = {}) {
  const checkedAt = validIso(now) || new Date().toISOString();
  if (!proposal || !approval || !caseRecord) return invalid("missing_action_authorization");
  if (approval.status !== "approved") return invalid("case_action_not_approved");
  if (proposal.proposalId !== approval.proposalId) return invalid("case_action_approval_mismatch");
  if (proposal.actionType !== approval.actionType) return invalid("case_action_type_mismatch");
  if (proposal.chatId !== caseRecord.chatId || approval.chatId !== caseRecord.chatId) {
    return invalid("case_action_chat_mismatch");
  }
  if (Number(proposal.caseRevision) !== Number(caseRecord.revision)
    || Number(approval.caseRevision) !== Number(caseRecord.revision)) {
    return invalid("case_action_revision_changed");
  }
  const currentFingerprint = buildCaseFingerprint(caseRecord);
  if (proposal.caseFingerprint !== currentFingerprint || approval.caseFingerprint !== currentFingerprint) {
    return invalid("case_action_case_changed");
  }
  if (Date.parse(proposal.expiresAt || "") <= Date.parse(checkedAt)
    || Date.parse(approval.expiresAt || "") <= Date.parse(checkedAt)) {
    return invalid("case_action_approval_expired");
  }

  return {
    ok: true,
    reason: "approved",
    idempotencyKey: `case-action:${proposal.proposalId}`
  };
}

export function getCaseActionPolicy(actionType) {
  const cleanType = normalizeIdentifier(actionType, 100);
  if (BLOCKED_ACTIONS.has(cleanType)) throw contractError("case_action_forbidden", 403);
  const policy = ACTION_POLICIES[cleanType];
  if (!policy) throw contractError("unsupported_case_action");
  return { ...policy, actionType: cleanType };
}

export function buildCaseFingerprint(caseRecord = {}) {
  return digest(stableStringify({
    chatId: clean(caseRecord.chatId),
    revision: Number(caseRecord.revision || 0),
    state: clean(caseRecord.state),
    workflow: sanitizeContractValue(caseRecord.workflow),
    facts: sanitizeContractValue(caseRecord.facts),
    systemFacts: sanitizeContractValue(caseRecord.systemFacts),
    evidence: sanitizeContractValue(caseRecord.evidence),
    missingData: sanitizeContractValue(caseRecord.missingData),
    pendingChecks: sanitizeContractValue(caseRecord.pendingChecks)
  }));
}

function actionPolicy(riskLevel, approverRoles) {
  return Object.freeze({
    mode: "write",
    riskLevel,
    approverRoles: Object.freeze([...approverRoles]),
    requiresVerification: true
  });
}

function sanitizeContractValue(value, depth = 0) {
  if (depth > 6 || value === undefined || value === null) return value ?? null;
  if (typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return redactSecrets(value).slice(0, 4000);
  if (Array.isArray(value)) return value.slice(0, 50).map((item) => sanitizeContractValue(item, depth + 1));
  if (typeof value !== "object") return clean(value).slice(0, 500);

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !/(?:token|password|contrasena|contraseña|pin|secret|authorization)/iu.test(key))
      .slice(0, 80)
      .map(([key, item]) => [normalizeObjectKey(key), sanitizeContractValue(item, depth + 1)])
      .filter(([key]) => Boolean(key))
  );
}

function normalizeContractError(value) {
  if (!value) return null;
  if (typeof value === "string") return { code: normalizeIdentifier(value, 100) || "external_error" };
  return {
    code: normalizeIdentifier(value.code || value.type || value.message, 100) || "external_error",
    retryable: value.retryable === true
  };
}

function redactSecrets(value) {
  return clean(value)
    .replace(/\b(?:password|contrasena|contraseña|token|nip|pin|secret|authorization)\s*[:=]\s*\S+/giu, "[CREDENTIAL_REDACTED]")
    .replace(/\b\d{18}\b/gu, "[CLABE_REDACTED]");
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function digest(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function addSeconds(value, seconds) {
  return new Date(Date.parse(value) + seconds * 1000).toISOString();
}

function earlierIso(left, right) {
  return Date.parse(left) <= Date.parse(right) ? left : right;
}

function invalid(reason) {
  return { ok: false, reason, idempotencyKey: "" };
}

function normalizeObjectKey(value) {
  return String(value || "").replace(/[^A-Za-z0-9_.-]/g, "_").slice(0, 100);
}

function normalizeIdentifier(value, maxLength) {
  const normalized = clean(value).toLowerCase();
  return /^[a-z][a-z0-9_.-]*$/.test(normalized) ? normalized.slice(0, maxLength) : "";
}

function normalizeEmail(value) {
  const email = clean(value).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email.slice(0, 254) : "";
}

function normalizeRole(value) {
  const role = clean(value).toLowerCase();
  return ["agent", "admin"].includes(role) ? role : "agent";
}

function normalizeProposer(value = {}) {
  const type = clean(value?.type).toLowerCase();
  if (type === "human") {
    const email = normalizeEmail(value?.email);
    if (!email) throw contractError("invalid_case_action_proposer");
    return { type: "human", email };
  }
  return {
    type: "assistant",
    id: normalizeIdentifier(value?.id || "support-case-agent", 100) || "support-case-agent"
  };
}

function validIso(value) {
  const text = clean(value);
  return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : "";
}

function clampInt(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(number)));
}

function contractError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function clean(value) {
  return String(value || "").replace(/\u0000/gu, "").replace(/\s+/gu, " ").trim();
}
