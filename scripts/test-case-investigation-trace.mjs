import assert from "node:assert/strict";
import { buildCaseInvestigationTrace, detectCustomerIdentityCorrection } from "../lib/case-investigation-trace.js";

const correction = detectCustomerIdentityCorrection(
  "Me equivoqué de correo, el correcto es nuevo@example.com",
  { email: "anterior@example.com" }
);
assert.deepEqual(correction, {
  field: "email",
  previousValue: "anterior@example.com",
  nextValue: "nuevo@example.com"
});
assert.equal(detectCustomerIdentityCorrection("Mi correo es nuevo@example.com", { email: "anterior@example.com" }), null);
assert.equal(detectCustomerIdentityCorrection("El retiro no ha llegado", { email: "anterior@example.com" }), null);

const trace = buildCaseInvestigationTrace({
  customer: { email: "nuevo@example.com", authId: "1031619" },
  workflow: { id: "withdrawal" },
  identityCorrections: [{ field: "email", previousValue: "anterior@example.com", nextValue: "nuevo@example.com", changedAt: "2026-08-11T18:00:00.000Z" }],
  systemFacts: {
    caseJiraLookup: { status: "not_found", data: { queryType: "email", records: [] } },
    caseSlackLookup: { status: "available", data: { queryType: "email", records: [{ recordId: "row-1" }], coverage: { expectedPanels: 4, cachedPanels: 4 } } }
  },
  nextAction: { message: "Preparar respuesta con el motivo confirmado.", requiresHumanApproval: false }
});
assert.equal(trace[0].kind, "correction");
assert.equal(trace.find((step) => step.id === "jira").status, "not_found");
assert.equal(trace.find((step) => step.id === "slack").status, "available");
assert.match(trace.at(-1).branch, /continuar/i);

console.log("Traza de investigación: 7 pruebas correctas.");
