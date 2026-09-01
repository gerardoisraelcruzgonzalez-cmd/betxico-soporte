import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const tests = [
  "test-account-policy.mjs",
  "test-admin-account-provisioning.mjs",
  "test-api-route-consolidation.mjs",
  "test-ai-provider.mjs",
  "test-attachment-policy.mjs",
  "test-atena-connector-scheduler.mjs",
  "test-atena-extraction.mjs",
  "test-bob-connector-scheduler.mjs",
  "test-bob-request-contract.mjs",
    "test-bob-jira-ticket.mjs",
    "test-bob-result-merge.mjs",
  "test-bob-session-summary.mjs",
  "test-audit-safety.mjs",
  "test-auto-safe-templates.mjs",
  "test-case-action-executor.mjs",
  "test-supervised-case-flow.mjs",
  "test-case-action-provider-verification.mjs",
  "test-case-action-store.mjs",
  "test-case-bridge-tools.mjs",
  "test-connector-agent-auth.mjs",
  "test-case-draft.mjs",
  "test-case-investigation-trace.mjs",
  "test-case-knowledge.mjs",
  "test-case-operation-contracts.mjs",
  "test-case-orchestrator.mjs",
  "test-case-read-tools.mjs",
  "test-real-conversation-regression.mjs",
  "test-case-response-policy.mjs",
  "test-case-verified-actions.mjs",
  "test-integration-policy.mjs",
  "test-ine-received.mjs",
  "test-jira-account-settings.mjs",
  "test-kyc-connector-scheduler.mjs",
  "test-kyc-extraction.mjs",
  "test-kyc-review-store.mjs",
  "test-livechat-attachments.mjs",
  "test-livechat-webhook-limits.mjs",
  "test-livechat-webhook-security.mjs",
  "test-login-rate-limit.mjs",
  "test-simulator-policy.mjs",
  "test-simulator-preview-auth.mjs",
  "test-slack-list-7-only.mjs",
  "test-support-simulator-boundary.mjs",
  "test-support-simulator.mjs",
  "test-tool-access.mjs",
  "test-test-bootstrap-account.mjs",
  "test-support10-template-integration.mjs",
  "test-widget-access.mjs"
];

for (const test of tests) {
  process.stdout.write(`\n=== ${test} ===\n`);
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(test, import.meta.url))], {
    cwd: fileURLToPath(new URL("..", import.meta.url)),
    encoding: "utf8"
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
  if (result.status !== 0) process.exit(result.status || 1);
}

process.stdout.write(`\n${tests.length} archivos de pruebas aprobados.\n`);
