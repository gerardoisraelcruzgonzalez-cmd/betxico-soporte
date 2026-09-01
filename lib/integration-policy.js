export const SLACK_LIST_READS_ENABLE_ENV = "SUPPORT_SLACK_LIST_READS_ENABLED";
export const LEGACY_AUTO_SAFE_SEND_ENABLE_ENV = "SUPPORT_LEGACY_AUTO_SAFE_SEND_ENABLED";
export const SLACK_LIST_SYNC_ENABLE_ENV = "SUPPORT_SLACK_LIST_SYNC_ENABLED";
export const SUPPORT_AGENT_MODES = Object.freeze({
  OFF: "off",
  OBSERVE: "observe",
  SUGGEST: "suggest",
  APPROVED_ACTIONS: "approved_actions"
});

/**
 * Slack List reads are fail-closed. They are enabled only when the dedicated
 * support-app variable is explicitly set to the literal value "true".
 */
export function areSlackListReadsEnabled(env = process.env) {
  return Boolean(
    env
    && Object.prototype.hasOwnProperty.call(env, SLACK_LIST_READS_ENABLE_ENV)
    && env[SLACK_LIST_READS_ENABLE_ENV] === "true"
  );
}

export function areSlackListReadsPaused(env = process.env) {
  return !areSlackListReadsEnabled(env);
}

export function requireSlackListReadsEnabled(env = process.env) {
  if (!areSlackListReadsPaused(env)) return;

  const error = new Error("slack_list_reads_paused");
  error.statusCode = 503;
  throw error;
}

export function areLegacyAutoSafeSendsEnabled(env = process.env) {
  return Boolean(
    env
    && Object.prototype.hasOwnProperty.call(env, LEGACY_AUTO_SAFE_SEND_ENABLE_ENV)
    && env[LEGACY_AUTO_SAFE_SEND_ENABLE_ENV] === "true"
  );
}

export function requireLegacyAutoSafeSendsEnabled(env = process.env) {
  if (areLegacyAutoSafeSendsEnabled(env)) return;
  const error = new Error("legacy_auto_safe_send_disabled");
  error.statusCode = 503;
  throw error;
}

export function isSlackListSyncEnabled(env = process.env) {
  return Boolean(
    env
    && Object.prototype.hasOwnProperty.call(env, SLACK_LIST_SYNC_ENABLE_ENV)
    && env[SLACK_LIST_SYNC_ENABLE_ENV] === "true"
  );
}

export function requireSlackListSyncEnabled(env = process.env) {
  if (isSlackListSyncEnabled(env)) return;
  const error = new Error("slack_list_sync_disabled");
  error.statusCode = 503;
  throw error;
}

export function getSupportAgentMode(env = process.env) {
  const mode = String(env?.SUPPORT_AGENT_MODE || SUPPORT_AGENT_MODES.SUGGEST).trim().toLowerCase();
  return Object.values(SUPPORT_AGENT_MODES).includes(mode) ? mode : SUPPORT_AGENT_MODES.SUGGEST;
}

export function requireSupportAgentEnabled(env = process.env) {
  if (getSupportAgentMode(env) !== SUPPORT_AGENT_MODES.OFF) return;
  const error = new Error("support_agent_disabled");
  error.statusCode = 503;
  throw error;
}

export function requireApprovedActionsEnabled(env = process.env) {
  if (getSupportAgentMode(env) === SUPPORT_AGENT_MODES.APPROVED_ACTIONS) return;
  const error = new Error("support_agent_actions_disabled");
  error.statusCode = 503;
  throw error;
}
