import { isCaseToolResultUsable } from "./case-operation-contracts.js";

const ACTION_FACT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const CASE_OUTCOME_CLAIMS = Object.freeze({
  APPROVED: "approved",
  KYC_COMPLETE: "kyc_complete",
  PAID: "paid",
  RESOLVED: "resolved",
  SENT_FOR_REVIEW: "sent_for_review"
});

export function evaluateCaseResponsePolicy(caseRecord = {}, text = "", options = {}) {
  const claims = detectCaseOutcomeClaims(text);
  if (!claims.length) return { ok: true, claims: [], evidence: [] };

  const evidence = deriveVerifiedCaseOutcomes(caseRecord, options.now);
  const supported = new Set(evidence.map((item) => item.outcome));
  const missingClaims = claims.filter((claim) => !supported.has(claim));
  return {
    ok: missingClaims.length === 0,
    reason: missingClaims.length ? "case_action_outcome_not_verified" : "case_action_outcome_verified",
    claims,
    missingClaims,
    evidence
  };
}

export function detectCaseOutcomeClaims(text = "") {
  const value = normalizeText(text);
  const claims = [];
  if (hasAffirmativeOutcomeClaim(value, /\b(?:aprobad[oa]|autorizad[oa]|liberad[oa])\b/u)) {
    claims.push(CASE_OUTCOME_CLAIMS.APPROVED);
  }
  if (hasAffirmativeOutcomeClaim(value, /\b(?:pagad[oa]|depositad[oa]|acreditad[oa]|reflejad[oa])\b/u)) {
    claims.push(CASE_OUTCOME_CLAIMS.PAID);
  }
  if (/(?:\bkyc\b.{0,45}\b(?:complet[oa]|validado|verificado|actualizado|corregido)\b)|(?:\b(?:complet[oa]|validado|verificado|actualizado|corregido)\b.{0,45}\bkyc\b)/u.test(value)) {
    claims.push(CASE_OUTCOME_CLAIMS.KYC_COMPLETE);
  }
  if (/\b(?:resuelt[oa]|solucionad[oa]|caso cerrado)\b/u.test(value)) {
    claims.push(CASE_OUTCOME_CLAIMS.RESOLVED);
  }
  if (/(?:\b(?:enviad[oa]|turnad[oa]|escalad[oa])\b.{0,45}\b(?:revision|transacciones|area|equipo)\b)|(?:\b(?:revision|transacciones)\b.{0,45}\b(?:enviad[oa]|turnad[oa]|escalad[oa])\b)/u.test(value)) {
    claims.push(CASE_OUTCOME_CLAIMS.SENT_FOR_REVIEW);
  }
  return [...new Set(claims)];
}

function hasAffirmativeOutcomeClaim(value, pattern) {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  return [...value.matchAll(new RegExp(pattern.source, flags))].some((match) => {
    const before = value.slice(Math.max(0, match.index - 110), match.index);
    return !isNegatedOrConditionalOutcome(before);
  });
}

function isNegatedOrConditionalOutcome(before) {
  return /(?:\bno\s+(?:puedo\s+)?(?:confirmar|asegurar|afirmar|indicar|decir|verificar)|\bsin\s+(?:poder\s+)?(?:confirmar|asegurar)|\b(?:aun|todavia)\s+no|\bno\s+se\s+ha|\bno\s+(?:esta|fue|ha\s+sido|quedo)|\bsi|\buna\s+vez|\bpendiente\s+de\s+ser)\b[^.!?]{0,80}$/u.test(before);
}

export function deriveVerifiedCaseOutcomes(caseRecord = {}, now = new Date().toISOString()) {
  const evidence = [];
  const jira = caseRecord.systemFacts?.caseJiraLookup;
  if (isCaseToolResultUsable(jira, now)) {
    for (const record of jira?.data?.records || []) {
      const status = normalizeText(record?.status);
      if (/\b(?:done|resolved|closed|resuelt[oa]|cerrad[oa]|solucionad[oa])\b/u.test(status)) {
        evidence.push(outcomeEvidence(CASE_OUTCOME_CLAIMS.RESOLVED, "jira", record?.ticketKey));
      }
    }
  }

  const slack = caseRecord.systemFacts?.caseSlackLookup;
  if (isCaseToolResultUsable(slack, now)) {
    for (const record of slack?.data?.records || []) {
      const status = normalizeText(record?.status);
      if (/\b(?:aprobad[oa]|approved|autorizad[oa]|liberad[oa])\b/u.test(status)) {
        evidence.push(outcomeEvidence(CASE_OUTCOME_CLAIMS.APPROVED, "slack_cache", record?.recordId));
      }
      if (/\b(?:pagad[oa]|paid|depositad[oa]|acreditad[oa]|reflejad[oa])\b/u.test(status)) {
        evidence.push(outcomeEvidence(CASE_OUTCOME_CLAIMS.PAID, "slack_cache", record?.recordId));
      }
      if (/\b(?:resuelt[oa]|resolved|closed|cerrad[oa]|solucionad[oa])\b/u.test(status)) {
        evidence.push(outcomeEvidence(CASE_OUTCOME_CLAIMS.RESOLVED, "slack_cache", record?.recordId));
      }
    }
  }

  const kyc = caseRecord.systemFacts?.caseKycReview;
  if (isCaseToolResultUsable(kyc, now)) {
    const record = kyc?.data?.record;
    if (normalizeText(record?.status) === "complete" && record?.reviewedByHuman === true) {
      evidence.push(outcomeEvidence(CASE_OUTCOME_CLAIMS.KYC_COMPLETE, "kyc_manual_review", record?.reviewId));
    }
  }

  const nowMs = Date.parse(now);
  for (const action of caseRecord.systemFacts?.caseVerifiedActions || []) {
    const verifiedAtMs = Date.parse(action?.verifiedAt || "");
    const recent = Number.isFinite(nowMs)
      && Number.isFinite(verifiedAtMs)
      && verifiedAtMs <= nowMs
      && nowMs - verifiedAtMs <= ACTION_FACT_MAX_AGE_MS;
    if (recent && action?.status === "verified" && action?.actionType === "slack.notify") {
      evidence.push(outcomeEvidence(CASE_OUTCOME_CLAIMS.SENT_FOR_REVIEW, "verified_action", action?.proposalId));
    }
  }

  return dedupeEvidence(evidence);
}

function outcomeEvidence(outcome, source, reference) {
  return {
    outcome,
    source,
    reference: String(reference || "").trim().slice(0, 120)
  };
}

function dedupeEvidence(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.outcome}:${item.source}:${item.reference}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .replace(/\s+/gu, " ")
    .trim()
    .toLowerCase();
}
