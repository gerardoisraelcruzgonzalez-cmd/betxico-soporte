import assert from "node:assert/strict";
import { appendVerifiedCaseAction } from "../lib/case-verified-actions.js";

const NOW = "2026-08-11T18:30:00.000Z";
const results = [];

test("stores only the minimum verified Slack action fact", () => {
  const systemFacts = appendVerifiedCaseAction({}, {
    proposalId: "proposal_slack_1",
    actionType: "slack.notify",
    status: "verified",
    verified: true,
    verificationRef: {
      channel: "C123",
      ts: "1720000000.100",
      token: "must-not-leak",
      text: "Customer private data"
    }
  }, { now: NOW });

  assert.deepEqual(systemFacts.caseVerifiedActions, [{
    proposalId: "proposal_slack_1",
    actionType: "slack.notify",
    status: "verified",
    verifiedAt: NOW,
    verificationRef: { channel: "C123", ts: "1720000000.100" }
  }]);
  assert.equal(JSON.stringify(systemFacts).includes("must-not-leak"), false);
  assert.equal(JSON.stringify(systemFacts).includes("Customer private data"), false);
});

test("does not store unverified or unsupported actions", () => {
  const original = { anotherFact: true };
  assert.deepEqual(appendVerifiedCaseAction(original, {
    proposalId: "proposal_pending",
    actionType: "slack.notify",
    status: "verification_pending",
    verified: false
  }, { now: NOW }), original);
  assert.deepEqual(appendVerifiedCaseAction(original, {
    proposalId: "proposal_kyc",
    actionType: "kyc.approve",
    status: "verified",
    verified: true
  }, { now: NOW }), original);
});

test("deduplicates retries by proposal id", () => {
  const first = appendVerifiedCaseAction({}, {
    proposalId: "proposal_retry",
    actionType: "jira.comment",
    status: "verified",
    verified: true,
    verificationRef: { id: "comment-1" }
  }, { now: "2026-08-11T18:29:00.000Z" });
  const second = appendVerifiedCaseAction(first, {
    proposalId: "proposal_retry",
    actionType: "jira.comment",
    status: "verified",
    verified: true,
    verificationRef: { id: "comment-1" }
  }, { now: NOW });

  assert.equal(second.caseVerifiedActions.length, 1);
  assert.equal(second.caseVerifiedActions[0].verifiedAt, NOW);
});

console.log(JSON.stringify({ ok: true, tests: results.length, results }, null, 2));

function test(name, fn) {
  fn();
  results.push(name);
}
