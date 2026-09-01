const MAX_VERIFIED_ACTIONS = 20;
const ALLOWED_ACTION_TYPES = new Set([
  "jira.comment",
  "slack.notify",
  "livechat.send_message"
]);

export function appendVerifiedCaseAction(systemFacts = {}, result = {}, options = {}) {
  const fact = normalizeVerifiedAction(result, options.now);
  if (!fact) return normalizeSystemFacts(systemFacts);

  const existing = normalizeVerifiedActions(systemFacts?.caseVerifiedActions)
    .filter((item) => item.proposalId !== fact.proposalId);
  return {
    ...normalizeSystemFacts(systemFacts),
    caseVerifiedActions: [...existing, fact].slice(-MAX_VERIFIED_ACTIONS)
  };
}

export function normalizeVerifiedAction(result = {}, now = new Date().toISOString()) {
  if (result?.verified !== true || result?.status !== "verified") return null;
  const proposalId = cleanIdentifier(result.proposalId, 180);
  const actionType = cleanIdentifier(result.actionType, 100);
  const verifiedAt = validIso(result.verifiedAt || now);
  if (!proposalId || !ALLOWED_ACTION_TYPES.has(actionType) || !verifiedAt) return null;

  return {
    proposalId,
    actionType,
    status: "verified",
    verifiedAt,
    verificationRef: normalizeVerificationRef(actionType, result.verificationRef)
  };
}

function normalizeVerifiedActions(value) {
  return (Array.isArray(value) ? value : [])
    .map((item) => normalizeVerifiedAction({ ...item, verified: item?.status === "verified" }, item?.verifiedAt))
    .filter(Boolean)
    .slice(-MAX_VERIFIED_ACTIONS);
}

function normalizeVerificationRef(actionType, value = {}) {
  if (actionType === "jira.comment") return { id: cleanReference(value?.id, 120) };
  if (actionType === "slack.notify") {
    return {
      channel: cleanReference(value?.channel, 120),
      ts: cleanReference(value?.ts, 80)
    };
  }
  if (actionType === "livechat.send_message") {
    return { event_id: cleanReference(value?.event_id, 180) };
  }
  return {};
}

function normalizeSystemFacts(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function cleanIdentifier(value, maxLength) {
  const clean = String(value || "").trim().slice(0, maxLength);
  return /^[A-Za-z0-9:_.-]+$/u.test(clean) ? clean : "";
}

function cleanReference(value, maxLength) {
  return String(value || "")
    .replace(/[^A-Za-z0-9:_.-]/gu, "")
    .slice(0, maxLength);
}

function validIso(value) {
  const text = String(value || "").trim();
  return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : "";
}
