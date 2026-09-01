import assert from "node:assert/strict";
import {
  CASE_ACTION_TYPES,
  CASE_TOOL_STATUSES,
  approveCaseAction,
  buildCaseToolQueryHash,
  createCaseActionProposal,
  isCaseToolResultUsable,
  normalizeCaseToolResult,
  validateCaseActionApproval
} from "../lib/case-operation-contracts.js";

const NOW = "2026-08-11T12:00:00.000Z";
const results = [];

test("normalizes a verified read result without retaining credentials", () => {
  const result = normalizeCaseToolResult({
    tool: "jira.search",
    source: "jira",
    status: CASE_TOOL_STATUSES.AVAILABLE,
    verified: true,
    checkedAt: NOW,
    queryHash: buildCaseToolQueryHash({ email: "cliente@example.com" }),
    data: {
      issueKey: "BTF-1",
      token: "must-not-survive",
      note: "pin=4312"
    }
  });

  assert.equal(result.verified, true);
  assert.equal(result.data.issueKey, "BTF-1");
  assert.equal("token" in result.data, false);
  assert.equal(result.data.note, "[CREDENTIAL_REDACTED]");
  assert.equal(isCaseToolResultUsable(result, "2026-08-11T12:01:00.000Z"), true);
  results.push("verified read contract");
});

test("never treats unavailable or expired data as verified evidence", () => {
  const unavailable = normalizeCaseToolResult({
    tool: "slack.search_cached",
    source: "slack-cache",
    status: CASE_TOOL_STATUSES.UNAVAILABLE,
    verified: true,
    checkedAt: NOW,
    data: []
  });
  const expired = normalizeCaseToolResult({
    tool: "jira.search",
    source: "jira",
    status: CASE_TOOL_STATUSES.NOT_FOUND,
    verified: true,
    checkedAt: NOW,
    ttlSeconds: 30,
    data: []
  });

  assert.equal(unavailable.verified, false);
  assert.equal(isCaseToolResultUsable(unavailable, NOW), false);
  assert.equal(isCaseToolResultUsable(expired, "2026-08-11T12:00:31.000Z"), false);
  results.push("unavailable and expired evidence");
});

test("requires a matching current-case approval for every write", () => {
  const supportCase = createCase();
  const proposal = createCaseActionProposal({
    caseRecord: supportCase,
    actionType: CASE_ACTION_TYPES.JIRA_COMMENT,
    payload: { issueKey: "BTF-1", body: "Documentos enviados a revision." },
    reason: "Actualizar seguimiento",
    now: NOW
  });
  const approval = approveCaseAction(proposal, {
    email: "agente@betxico.mx",
    role: "agent"
  }, { now: "2026-08-11T12:01:00.000Z" });
  const validation = validateCaseActionApproval({
    proposal,
    approval,
    caseRecord: supportCase,
    now: "2026-08-11T12:02:00.000Z"
  });

  assert.equal(validation.ok, true);
  assert.match(validation.idempotencyKey, /^case-action:proposal_/);
  results.push("approved write contract");
});

test("invalidates approval when the case changes", () => {
  const supportCase = createCase();
  const proposal = createCaseActionProposal({
    caseRecord: supportCase,
    actionType: CASE_ACTION_TYPES.SLACK_NOTIFY,
    payload: { routeId: "retiros", summary: "Enviar a revision" },
    now: NOW
  });
  const approval = approveCaseAction(proposal, {
    email: "supervisor@betxico.mx",
    role: "admin"
  }, { now: "2026-08-11T12:01:00.000Z" });
  const changedCase = { ...supportCase, revision: supportCase.revision + 1 };

  const validation = validateCaseActionApproval({
    proposal,
    approval,
    caseRecord: changedCase,
    now: "2026-08-11T12:02:00.000Z"
  });
  assert.deepEqual(validation, {
    ok: false,
    reason: "case_action_revision_changed",
    idempotencyKey: ""
  });
  results.push("stale approval rejection");
});

test("requires a different human to approve a human-authored proposal", () => {
  const proposal = createCaseActionProposal({
    caseRecord: createCase(),
    actionType: CASE_ACTION_TYPES.LIVECHAT_SEND_MESSAGE,
    payload: { chatId: "chat-contract", text: "Seguimos revisando tu caso." },
    proposedBy: { type: "human", email: "agente@betxico.mx" },
    now: NOW
  });

  const approval = approveCaseAction(proposal, {
    email: "agente@betxico.mx",
    role: "agent"
  }, { now: "2026-08-11T12:01:00.000Z" });
  assert.equal(approval.status, "approved");
  assert.equal(approval.approvedBy.email, "agente@betxico.mx");
  results.push("independent human approval");
});

test("forbids KYC and withdrawal approval actions", () => {
  assert.throws(() => createCaseActionProposal({
    caseRecord: createCase(),
    actionType: "kyc.update",
    payload: { status: "approved" },
    now: NOW
  }), /case_action_forbidden/);
  assert.throws(() => createCaseActionProposal({
    caseRecord: createCase(),
    actionType: "withdrawal.approve",
    payload: { status: "approved" },
    now: NOW
  }), /case_action_forbidden/);
  results.push("forbidden sensitive actions");
});

console.log(JSON.stringify({ ok: true, tests: results.length, results }, null, 2));

function createCase() {
  return {
    chatId: "chat-contract",
    revision: 4,
    state: "waiting_approval",
    workflow: { id: "withdrawal", riskLevel: "high" },
    facts: { amount: 500 },
    systemFacts: {
      jira: { status: "available", verified: true, data: { issueKey: "BTF-1" } }
    },
    missingData: [],
    pendingChecks: []
  };
}

function test(name, fn) {
  try {
    fn();
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  }
}
