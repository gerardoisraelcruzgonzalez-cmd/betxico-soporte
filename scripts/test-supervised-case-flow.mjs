import assert from "node:assert/strict";
import { evaluateCaseActionContext } from "../lib/case-action-context.js";
import { executeCaseAction } from "../lib/case-action-executor.js";
import { appendVerifiedCaseAction } from "../lib/case-verified-actions.js";
import { approveCaseAction, createCaseActionProposal } from "../lib/case-operation-contracts.js";
import { requireApprovedActionsEnabled } from "../lib/integration-policy.js";

const NOW = "2026-08-11T19:00:00.000Z";
const caseRecord = {
  chatId: "chat-integrated-flow",
  revision: 3,
  state: "investigating",
  workflow: { id: "withdrawal", riskLevel: "high" },
  facts: {},
  evidence: { pendingReviewCount: 0 },
  missingData: [],
  pendingChecks: [],
  systemFacts: {
    caseJiraLookup: {
      tool: "case.jira.lookup",
      mode: "read",
      status: "available",
      verified: true,
      source: "jira",
      checkedAt: "2026-08-11T18:58:00.000Z",
      expiresAt: "2026-08-11T19:05:00.000Z",
      data: { records: [{ ticketKey: "BTF-900", status: "En curso" }], count: 1 }
    }
  }
};
const results = [];

test("blocks a final customer claim before any write", () => {
  const context = evaluateCaseActionContext(
    caseRecord,
    "livechat.send_message",
    { text: "Tu retiro ya fue aprobado." },
    { now: NOW }
  );
  assert.equal(context.ok, false);
  assert.equal(context.reason, "case_action_outcome_not_verified");
});

const slackProposal = createCaseActionProposal({
  caseRecord,
  actionType: "slack.notify",
  payload: { routeId: "retiros", text: "Solicito revisión del caso BTF-900." },
  proposedBy: { type: "human", email: "agente.a@betxico.mx" },
  now: NOW
});

test("allows the handling agent to approve an explicit proposal", () => {
  const approval = approveCaseAction(
    slackProposal,
    { email: "agente.a@betxico.mx", role: "agent" },
    { now: "2026-08-11T19:01:00.000Z" }
  );
  assert.equal(approval.status, "approved");
  assert.equal(approval.approvedBy.email, "agente.a@betxico.mx");
});

const slackApproval = approveCaseAction(
  slackProposal,
  { email: "supervisor@betxico.mx", role: "admin" },
  { now: "2026-08-11T19:01:00.000Z" }
);

test("keeps execution disabled in suggest mode", () => {
  let executeCalls = 0;
  assert.throws(
    () => {
      requireApprovedActionsEnabled({ SUPPORT_AGENT_MODE: "suggest" });
      executeCalls += 1;
    },
    /support_agent_actions_disabled/
  );
  assert.equal(executeCalls, 0);
});

let verifiedSlackResult;
await asyncTest("records a verified Slack notification without message content", async () => {
  requireApprovedActionsEnabled({ SUPPORT_AGENT_MODE: "approved_actions" });
  verifiedSlackResult = await executeCaseAction({
    proposal: slackProposal,
    approval: slackApproval,
    caseRecord,
    now: "2026-08-11T19:02:00.000Z",
    dependencies: {
      "slack.notify": {
        execute: async () => ({ channel: "C-RETIROS", ts: "1723402920.001" }),
        verify: async () => ({ verified: true })
      }
    }
  });
  assert.equal(verifiedSlackResult.status, "verified");
  caseRecord.systemFacts = appendVerifiedCaseAction(caseRecord.systemFacts, verifiedSlackResult, {
    now: "2026-08-11T19:02:00.000Z"
  });
  assert.equal(JSON.stringify(caseRecord.systemFacts).includes("Solicito revisión"), false);
});

test("allows only the subsequent claim that the case was sent for review", () => {
  const sent = evaluateCaseActionContext(
    caseRecord,
    "livechat.send_message",
    { text: "Tu caso fue enviado a Transacciones para revisión." },
    { now: "2026-08-11T19:03:00.000Z" }
  );
  const approved = evaluateCaseActionContext(
    caseRecord,
    "livechat.send_message",
    { text: "Tu retiro fue aprobado." },
    { now: "2026-08-11T19:03:00.000Z" }
  );
  assert.equal(sent.ok, true);
  assert.equal(approved.ok, false);
});

console.log(JSON.stringify({ ok: true, tests: results.length, results }, null, 2));

function test(name, fn) {
  fn();
  results.push(name);
}

async function asyncTest(name, fn) {
  await fn();
  results.push(name);
}
