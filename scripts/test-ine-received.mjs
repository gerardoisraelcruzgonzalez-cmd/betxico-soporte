import assert from "node:assert/strict";
import {
  buildIneReceivedParentMessage,
  buildRetirosKycMessage,
  formatIneReceivedWithdrawalDate,
  normalizeIneReceivedEmail,
  normalizeIneReceivedWithdrawalAmount
} from "../lib/ine-received.js";

assert.equal(buildIneReceivedParentMessage(" Cliente@Betxico.MX "), "cliente@betxico.mx");
assert.equal(
  buildRetirosKycMessage({
    email: "cliente@betxico.mx",
    withdrawalDate: "2026-08-18",
    withdrawalAmount: "$1,500"
  }),
  "cliente@betxico.mx\nKYC actualizado - 18/08/2026 $1500.00"
);
assert.equal(formatIneReceivedWithdrawalDate("2026-02-28"), "28/02/2026");
assert.equal(normalizeIneReceivedWithdrawalAmount("155.5"), "155.50");
assert.throws(() => normalizeIneReceivedEmail("correo-invalido"), /ine_received_email_invalid/);
assert.throws(() => formatIneReceivedWithdrawalDate("2026-02-30"), /ine_received_withdrawal_date_invalid/);
assert.throws(() => normalizeIneReceivedWithdrawalAmount("0"), /ine_received_withdrawal_amount_invalid/);

console.log(JSON.stringify({ ok: true, feature: "ine_received" }, null, 2));
