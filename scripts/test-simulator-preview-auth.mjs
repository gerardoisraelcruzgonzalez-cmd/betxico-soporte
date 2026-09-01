import assert from "node:assert/strict";
import crypto from "node:crypto";
import { verifySimulatorPreviewPin } from "../lib/simulator-policy.js";

const email = "gerardo.cruz@betxico.mx";
const pin = "739152";
const salt = crypto.randomBytes(16).toString("base64url");
const hash = crypto.scryptSync(pin, salt, 32).toString("base64url");
const account = { email, pin: "existing-account-pin-hash" };
const previewEnv = {
  VERCEL_ENV: "preview",
  SUPPORT_SIMULATOR_ENABLED: "true",
  SUPPORT_SIMULATOR_ALLOWED_EMAILS: email,
  SUPPORT_SIMULATOR_PREVIEW_PIN_HASH: `${salt}.${hash}`
};

assert.equal(verifySimulatorPreviewPin({ email, pin, account, env: previewEnv }), true);
assert.equal(verifySimulatorPreviewPin({ email, pin: "000000", account, env: previewEnv }), false);
assert.equal(verifySimulatorPreviewPin({ email, pin, account, env: { ...previewEnv, VERCEL_ENV: "production" } }), false);
assert.equal(verifySimulatorPreviewPin({ email, pin, account, env: { ...previewEnv, SUPPORT_SIMULATOR_ENABLED: "false" } }), false);
assert.equal(verifySimulatorPreviewPin({ email: "otro@betxico.mx", pin, account: { ...account, email: "otro@betxico.mx" }, env: previewEnv }), false);
assert.equal(verifySimulatorPreviewPin({ email, pin, account: null, env: previewEnv }), false);

console.log("Acceso temporal del simulador: 6 pruebas correctas.");
