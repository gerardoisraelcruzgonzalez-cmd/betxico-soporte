import assert from "node:assert/strict";
import { sanitizeForAudit, summarizeSupportTicketForAudit } from "../lib/audit.js";

const sensitive = {
  payload: {
    email: "cliente@example.com",
    authId: "1138340",
    description: "Datos completos del cliente",
    attachments: [{ filename: "ine.jpg", dataBase64: "A".repeat(600) }]
  },
  account: {
    email: "agente@betxico.mx",
    displayName: "Agente Real",
    jiraApiToken: "secret-token"
  },
  message: "Escribe a cliente@example.com",
  directEncodedData: "A".repeat(600)
};

const sanitized = sanitizeForAudit(sensitive);
const serialized = JSON.stringify(sanitized);
assert.doesNotMatch(serialized, /cliente@example\.com|agente@betxico\.mx|1138340|Datos completos|ine\.jpg|secret-token/);
assert.doesNotMatch(serialized, /A{100}/);

const summary = summarizeSupportTicketForAudit({
  source: "livechat",
  destination: "both",
  chatId: "chat-sensitive",
  attachments: [{ dataBase64: "B".repeat(600) }],
  accountSettings: { email: "agente@betxico.mx" },
  workflow: { id: "retiro_revision" }
}, {
  jira: { ok: true, key: "SUP-123" },
  slack: { ok: false, error: "rate_limited" }
});

const safeSummary = sanitizeForAudit(summary);
const summaryText = JSON.stringify(safeSummary);
assert.equal(safeSummary.attachmentCount, 1);
assert.equal(safeSummary.hasChatId, true);
assert.equal(safeSummary.jira.key, "SUP-123");
assert.doesNotMatch(summaryText, /agente@betxico\.mx|chat-sensitive|B{100}/);

console.log("Audit safety: 2 pruebas correctas.");
