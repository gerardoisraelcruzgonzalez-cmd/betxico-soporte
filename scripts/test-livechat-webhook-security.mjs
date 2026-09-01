import assert from "node:assert/strict";
import {
  requireLiveChatWebhookConfiguration,
  verifyLiveChatWebhook
} from "../lib/livechat-webhook-security.js";

const results = [];

test("accepts a valid LiveChat webhook secret", () => {
  assert.equal(verifyLiveChatWebhook(
    { secret_key: "livechat-secret" },
    { LIVECHAT_WEBHOOK_SECRET: "livechat-secret" }
  ), true);
});

test("rejects an invalid LiveChat webhook secret", () => {
  assertSecurityError(
    () => verifyLiveChatWebhook(
      { secret_key: "wrong-secret" },
      { LIVECHAT_WEBHOOK_SECRET: "livechat-secret" }
    ),
    "invalid_livechat_webhook_secret",
    401
  );
});

test("fails closed when the LiveChat webhook secret is not configured", () => {
  assertSecurityError(
    () => verifyLiveChatWebhook({ secret_key: "anything" }, {}),
    "livechat_webhook_secret_not_configured",
    503
  );
  assertSecurityError(
    () => requireLiveChatWebhookConfiguration({ LIVECHAT_WEBHOOK_SECRET: "  " }),
    "livechat_webhook_secret_not_configured",
    503
  );
});

test("validates the configured LiveChat organization", () => {
  const env = {
    LIVECHAT_WEBHOOK_SECRET: "livechat-secret",
    LIVECHAT_ORGANIZATION_ID: "organization-123"
  };

  assert.equal(verifyLiveChatWebhook({
    secret_key: "livechat-secret",
    organization_id: "organization-123"
  }, env), true);

  assertSecurityError(
    () => verifyLiveChatWebhook({
      secret_key: "livechat-secret",
      organization_id: "another-organization"
    }, env),
    "invalid_livechat_organization",
    403
  );

  assertSecurityError(
    () => verifyLiveChatWebhook({ secret_key: "livechat-secret" }, env),
    "invalid_livechat_organization",
    403
  );
});

console.log(JSON.stringify({ ok: true, tests: results.length, results }, null, 2));

function test(name, fn) {
  fn();
  results.push({ name, ok: true });
}

function assertSecurityError(fn, code, statusCode) {
  assert.throws(fn, (error) => {
    assert.equal(error.message, code);
    assert.equal(error.statusCode, statusCode);
    return true;
  });
}
