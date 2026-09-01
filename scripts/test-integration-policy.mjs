import assert from "node:assert/strict";
import {
  LEGACY_AUTO_SAFE_SEND_ENABLE_ENV,
  SLACK_LIST_READS_ENABLE_ENV,
  SLACK_LIST_SYNC_ENABLE_ENV,
  areLegacyAutoSafeSendsEnabled,
  areSlackListReadsEnabled,
  areSlackListReadsPaused,
  getSupportAgentMode,
  isSlackListSyncEnabled,
  requireApprovedActionsEnabled,
  requireLegacyAutoSafeSendsEnabled,
  requireSlackListSyncEnabled,
  requireSlackListReadsEnabled
} from "../lib/integration-policy.js";

const results = [];

test("pauses Slack List reads when the variable is absent", () => {
  assert.equal(areSlackListReadsEnabled({}), false);
  assert.equal(areSlackListReadsPaused({}), true);
  results.push("default fail-closed policy");
});

test("enables Slack List reads only with the explicit literal true", () => {
  const enabled = { [SLACK_LIST_READS_ENABLE_ENV]: "true" };
  assert.equal(areSlackListReadsEnabled(enabled), true);
  assert.equal(areSlackListReadsPaused(enabled), false);

  for (const value of ["", "1", "yes", "TRUE", " true ", "false", true]) {
    assert.equal(
      areSlackListReadsEnabled({ [SLACK_LIST_READS_ENABLE_ENV]: value }),
      false,
      `value ${JSON.stringify(value)} must remain paused`
    );
  }
  const inherited = Object.create({ [SLACK_LIST_READS_ENABLE_ENV]: "true" });
  assert.equal(areSlackListReadsEnabled(inherited), false);
  results.push("explicit safe enablement");
});

test("uses the same paused error contract for every caller", () => {
  assert.throws(
    () => requireSlackListReadsEnabled({}),
    (error) => error.message === "slack_list_reads_paused" && error.statusCode === 503
  );
  assert.doesNotThrow(() => requireSlackListReadsEnabled({
    [SLACK_LIST_READS_ENABLE_ENV]: "true"
  }));
  results.push("shared route guard");
});

test("keeps approved actions behind an explicit kill switch mode", () => {
  assert.equal(getSupportAgentMode({}), "suggest");
  assert.equal(getSupportAgentMode({ SUPPORT_AGENT_MODE: "approved_actions" }), "approved_actions");
  assert.throws(
    () => requireApprovedActionsEnabled({ SUPPORT_AGENT_MODE: "suggest" }),
    (error) => error.message === "support_agent_actions_disabled" && error.statusCode === 503
  );
  assert.doesNotThrow(() => requireApprovedActionsEnabled({ SUPPORT_AGENT_MODE: "approved_actions" }));
  results.push("agent action kill switch");
});

test("keeps legacy automatic sends disabled unless explicitly enabled", () => {
  assert.equal(areLegacyAutoSafeSendsEnabled({}), false);
  assert.equal(areLegacyAutoSafeSendsEnabled({ [LEGACY_AUTO_SAFE_SEND_ENABLE_ENV]: "true" }), true);
  assert.equal(areLegacyAutoSafeSendsEnabled({ [LEGACY_AUTO_SAFE_SEND_ENABLE_ENV]: "TRUE" }), false);
  assert.throws(
    () => requireLegacyAutoSafeSendsEnabled({}),
    (error) => error.message === "legacy_auto_safe_send_disabled" && error.statusCode === 503
  );
  results.push("legacy automatic send kill switch");
});

test("separates controlled Slack sync from per-chat Slack reads", () => {
  const env = {
    [SLACK_LIST_READS_ENABLE_ENV]: "false",
    [SLACK_LIST_SYNC_ENABLE_ENV]: "true"
  };
  assert.equal(areSlackListReadsEnabled(env), false);
  assert.equal(isSlackListSyncEnabled(env), true);
  assert.doesNotThrow(() => requireSlackListSyncEnabled(env));
  assert.throws(
    () => requireSlackListSyncEnabled({ [SLACK_LIST_READS_ENABLE_ENV]: "true" }),
    (error) => error.message === "slack_list_sync_disabled" && error.statusCode === 503
  );
  results.push("independent Slack sync kill switch");
});

console.log(JSON.stringify({ ok: true, tests: results.length, results }, null, 2));

function test(name, fn) {
  try {
    fn();
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  }
}
