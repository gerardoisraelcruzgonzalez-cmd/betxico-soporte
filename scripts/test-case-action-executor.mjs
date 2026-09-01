import assert from "node:assert/strict";
import {
  executeCaseAction,
  reconcileCaseActionExecution,
  verifyCaseActionExecution
} from "../lib/case-action-executor.js";
import {
  approveCaseAction,
  createCaseActionProposal
} from "../lib/case-operation-contracts.js";

const NOW = "2026-08-11T12:00:00.000Z";
const EXECUTION_TIME = "2026-08-11T12:02:00.000Z";
const results = [];

await test("executes an approved action with its deterministic idempotency key", async () => {
  const action = approvedAction("jira.comment", {
    issueKey: "BTF-100",
    body: "Documento sensible recibido. token=must-not-leak"
  });
  const calls = [];
  const result = await executeCaseAction({
    ...action,
    now: EXECUTION_TIME,
    dependencies: {
      "jira.comment": {
        execute: async (operation) => {
          calls.push(operation);
          return { commentId: "10001", token: "provider-secret" };
        },
        verify: async () => true
      }
    }
  });

  assert.equal(result.status, "verified");
  assert.equal(result.verified, true);
  assert.deepEqual(result.verificationRef, { id: "10001" });
  assert.match(result.idempotencyKey, /^case-action:proposal_/);
  assert.equal(calls[0].idempotencyKey, result.idempotencyKey);
  assert.equal(calls[0].payload.issueKey, "BTF-100");
  assert.equal(JSON.stringify(result).includes("Documento sensible"), false);
  assert.equal(JSON.stringify(result).includes("provider-secret"), false);
  results.push("approved action");
});

await test("does not execute an action without a current approval", async () => {
  const action = approvedAction("slack.notify", { routeId: "retiros", summary: "Revisar" });
  action.approval = { ...action.approval, status: "pending" };
  let called = false;
  const result = await executeCaseAction({
    ...action,
    now: EXECUTION_TIME,
    dependencies: {
      "slack.notify": {
        execute: async () => { called = true; },
        verify: async () => true
      }
    }
  });

  assert.equal(result.status, "rejected");
  assert.equal(result.reason, "case_action_not_approved");
  assert.equal(result.executed, false);
  assert.equal(called, false);
  results.push("missing approval rejection");
});

await test("never executes forbidden KYC, withdrawal, or account actions", async () => {
  const action = approvedAction("jira.comment", { issueKey: "BTF-101", body: "Seguimiento" });
  action.proposal = { ...action.proposal, actionType: "kyc.approve" };
  action.approval = { ...action.approval, actionType: "kyc.approve" };
  let called = false;
  const result = await executeCaseAction({
    ...action,
    now: EXECUTION_TIME,
    dependencies: {
      "kyc.approve": {
        execute: async () => { called = true; },
        verify: async () => true
      }
    }
  });

  assert.equal(result.status, "rejected");
  assert.equal(result.reason, "case_action_forbidden");
  assert.equal(result.executed, false);
  assert.equal(called, false);
  results.push("forbidden action rejection");
});

await test("returns verification_pending after execution when verification does not confirm", async () => {
  const action = approvedAction("slack.notify", { routeId: "retiros", summary: "Aprobacion solicitada" });
  let verifyReceivedExecution = false;
  const result = await executeCaseAction({
    ...action,
    now: EXECUTION_TIME,
    dependencies: {
      "slack.notify": {
        execute: async () => ({ channel: "C123", ts: "1720000000.100", secret: "do-not-return" }),
        verify: async ({ execution, idempotencyKey }) => {
          verifyReceivedExecution = execution.channel === "C123" && execution.ts === "1720000000.100"
            && idempotencyKey.startsWith("case-action:proposal_");
          return { verified: false, body: "sensitive provider response" };
        }
      }
    }
  });

  assert.equal(result.status, "verification_pending");
  assert.equal(result.executed, true);
  assert.equal(result.verified, false);
  assert.deepEqual(result.verificationRef, { channel: "C123", ts: "1720000000.100" });
  assert.equal(verifyReceivedExecution, true);
  assert.equal(JSON.stringify(result).includes("do-not-return"), false);
  assert.equal(JSON.stringify(result).includes("sensitive provider response"), false);
  results.push("partial failure");
});

await test("accepts an explicit positive verification without exposing provider data", async () => {
  const action = approvedAction("livechat.send_message", { text: "Tu retiro sigue en revision." });
  const result = await executeCaseAction({
    ...action,
    now: EXECUTION_TIME,
    dependencies: {
      "livechat.send_message": {
        execute: async () => ({ messageId: "message-1", authorization: "secret" }),
        verify: async () => ({ verified: true, transcript: "private transcript" })
      }
    }
  });

  assert.equal(result.status, "verified");
  assert.equal(result.reason, "action_verified");
  assert.equal(result.verified, true);
  assert.equal(JSON.stringify(result).includes("Tu retiro"), false);
  assert.equal(JSON.stringify(result).includes("private transcript"), false);
  assert.equal(JSON.stringify(result).includes("secret"), false);
  results.push("positive verification");
});

await test("blocks a LiveChat approval claim when Jira only says in progress", async () => {
  const action = approvedAction(
    "livechat.send_message",
    { text: "Tu retiro ya fue aprobado." },
    {
      caseJiraLookup: toolResult("jira", [{ ticketKey: "BTF-200", status: "En curso" }])
    }
  );
  let executeCalls = 0;
  const result = await executeCaseAction({
    ...action,
    now: EXECUTION_TIME,
    dependencies: {
      "livechat.send_message": {
        execute: async () => {
          executeCalls += 1;
          return { event_id: "must-not-exist" };
        },
        verify: async () => true
      }
    }
  });

  assert.equal(result.status, "rejected");
  assert.equal(result.reason, "case_action_outcome_not_verified");
  assert.equal(result.executed, false);
  assert.equal(executeCalls, 0);
  results.push("unverified outcome blocked");
});

await test("allows a LiveChat approval claim backed by structured Slack status", async () => {
  const action = approvedAction(
    "livechat.send_message",
    { text: "Tu retiro ya fue aprobado." },
    {
      caseSlackLookup: toolResult("slack_cache", [{ recordId: "row-200", status: "APROBADO" }])
    }
  );
  let executeCalls = 0;
  const result = await executeCaseAction({
    ...action,
    now: EXECUTION_TIME,
    dependencies: {
      "livechat.send_message": {
        execute: async () => {
          executeCalls += 1;
          return { event_id: "event-approved-200" };
        },
        verify: async () => true
      }
    }
  });

  assert.equal(result.status, "verified");
  assert.equal(result.verified, true);
  assert.equal(executeCalls, 1);
  results.push("structured outcome allowed");
});

await test("retries only verification without executing the write again", async () => {
  const action = approvedAction("livechat.send_message", { text: "Seguimos revisando tu caso." });
  let executeCalls = 0;
  const first = await executeCaseAction({
    ...action,
    now: EXECUTION_TIME,
    dependencies: {
      "livechat.send_message": {
        execute: async () => {
          executeCalls += 1;
          return { event_id: "event-100" };
        },
        verify: async () => false
      }
    }
  });
  const actionRecord = {
    proposalId: action.proposal.proposalId,
    status: "verification_pending",
    idempotencyKey: first.idempotencyKey,
    proposal: action.proposal,
    approval: action.approval,
    execution: { result: { verificationRef: first.verificationRef } }
  };
  const second = await verifyCaseActionExecution({
    actionRecord,
    dependencies: {
      "livechat.send_message": {
        execute: async () => {
          executeCalls += 1;
        },
        verify: async ({ execution }) => execution.event_id === "event-100"
      }
    }
  });

  assert.equal(second.status, "verified");
  assert.equal(second.verified, true);
  assert.equal(executeCalls, 1);
  results.push("verification-only retry");
});

await test("reconciles a stuck execution by reading the provider without resending", async () => {
  const action = approvedAction("jira.comment", { issueKey: "BTF-500", body: "Evidencia revisada." });
  let executeCalls = 0;
  let reconcileCalls = 0;
  const result = await reconcileCaseActionExecution({
    actionRecord: {
      proposalId: action.proposal.proposalId,
      status: "executing",
      idempotencyKey: `case-action:${action.proposal.proposalId}`,
      proposal: action.proposal,
      approval: { ...action.approval, consumedAt: EXECUTION_TIME },
      execution: { startedAt: EXECUTION_TIME }
    },
    dependencies: {
      "jira.comment": {
        execute: async () => {
          executeCalls += 1;
        },
        reconcile: async ({ payload }) => {
          reconcileCalls += 1;
          assert.equal(payload.body, "Evidencia revisada.");
          return { id: "comment-500" };
        },
        verify: async ({ execution }) => execution.id === "comment-500"
      }
    }
  });

  assert.equal(result.status, "verified");
  assert.equal(result.verified, true);
  assert.equal(executeCalls, 0);
  assert.equal(reconcileCalls, 1);
  results.push("stuck execution reconciliation");
});

console.log(JSON.stringify({ ok: true, tests: results.length, results }, null, 2));

function approvedAction(actionType, payload, systemFacts = {}) {
  const caseRecord = {
    chatId: "chat-executor",
    revision: 7,
    state: "waiting_approval",
    workflow: { id: "withdrawal", riskLevel: "high" },
    facts: { reason: "kyc_review" },
    systemFacts,
    evidence: [],
    missingData: [],
    pendingChecks: []
  };
  const proposal = createCaseActionProposal({
    caseRecord,
    actionType,
    payload,
    now: NOW
  });
  const approval = approveCaseAction(proposal, {
    email: "agente@betxico.mx",
    role: "agent"
  }, { now: "2026-08-11T12:01:00.000Z" });
  return { proposal, approval, caseRecord };
}

function toolResult(source, records) {
  return {
    tool: `case.${source}.lookup`,
    mode: "read",
    status: "available",
    verified: true,
    source,
    checkedAt: "2026-08-11T11:59:00.000Z",
    expiresAt: "2026-08-11T12:10:00.000Z",
    data: { records, count: records.length }
  };
}

async function test(name, fn) {
  try {
    await fn();
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  }
}
