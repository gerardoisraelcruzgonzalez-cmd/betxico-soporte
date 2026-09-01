import assert from "node:assert/strict";
import { resolveAccountSettingsWrite } from "../lib/account-policy.js";
import { publicAccount } from "../lib/account-store.js";

assert.throws(
  () => resolveAccountSettingsWrite({ payload: { email: "agente@betxico.mx" } }),
  (error) => error.message === "login_required" && error.statusCode === 401
);

assert.deepEqual(
  resolveAccountSettingsWrite({
    current: { email: "agente@betxico.mx" },
    payload: { email: "AGENTE@BETXICO.MX" }
  }),
  {
    currentEmail: "agente@betxico.mx",
    targetEmail: "agente@betxico.mx",
    editsOwnAccount: true
  }
);

assert.throws(
  () => resolveAccountSettingsWrite({
    current: { email: "agente@betxico.mx" },
    payload: { email: "otra@betxico.mx" }
  }),
  (error) => error.message === "account_update_forbidden" && error.statusCode === 403
);

assert.equal(
  resolveAccountSettingsWrite({
    current: { email: "admin@betxico.mx" },
    payload: { email: "agente@betxico.mx" },
    isAdmin: true
  }).targetEmail,
  "agente@betxico.mx"
);

const previousEncryptionKey = process.env.SUPPORT_ENCRYPTION_KEY;
process.env.SUPPORT_ENCRYPTION_KEY = "different-key";
const accountWithUnreadableJiraToken = publicAccount({
  email: "agente@betxico.mx",
  jiraEmail: "agente@betxico.mx",
  jiraApiTokenEncrypted: "invalid.encrypted.value"
});
assert.equal(accountWithUnreadableJiraToken.hasJiraToken, false);
assert.equal(accountWithUnreadableJiraToken.configured, false);
if (previousEncryptionKey === undefined) delete process.env.SUPPORT_ENCRYPTION_KEY;
else process.env.SUPPORT_ENCRYPTION_KEY = previousEncryptionKey;

console.log("Account policy: 5 pruebas correctas.");
