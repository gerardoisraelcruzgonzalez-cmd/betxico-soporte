import assert from "node:assert/strict";
import {
  CASE_OUTCOME_CLAIMS,
  detectCaseOutcomeClaims,
  evaluateCaseResponsePolicy
} from "../lib/case-response-policy.js";

const NOW = "2026-08-11T18:00:00.000Z";
const results = [];

test("detecta resultados fuertes sin bloquear mensajes de seguimiento", () => {
  assert.deepEqual(detectCaseOutcomeClaims("Seguimos revisando tu caso."), []);
  assert.deepEqual(detectCaseOutcomeClaims("Tu retiro ya fue aprobado y pagado."), [
    CASE_OUTCOME_CLAIMS.APPROVED,
    CASE_OUTCOME_CLAIMS.PAID
  ]);
  assert.deepEqual(detectCaseOutcomeClaims("Tu caso fue enviado al área de Transacciones para revisión."), [
    CASE_OUTCOME_CLAIMS.SENT_FOR_REVIEW
  ]);
});

test("permite explicar que un resultado no esta confirmado", () => {
  assert.deepEqual(detectCaseOutcomeClaims("No puedo confirmar que tu retiro ya fue aprobado."), []);
  assert.deepEqual(detectCaseOutcomeClaims("Aún no puedo asegurar que el retiro haya sido pagado."), []);
  assert.deepEqual(detectCaseOutcomeClaims("Si ya fue aprobado, el área correspondiente continuará el proceso."), []);
  assert.deepEqual(detectCaseOutcomeClaims("Una vez aprobado, el retiro continuará con el proceso de pago."), []);
  assert.deepEqual(detectCaseOutcomeClaims("El retiro está pendiente de ser revisado y aprobado."), []);
});

test("no acepta cualquier fuente vigente como prueba de aprobación", () => {
  const policy = evaluateCaseResponsePolicy(caseWithFacts({
    jira: toolResult("jira", [{ ticketKey: "BTF-1", status: "En curso" }])
  }), "Tu retiro ya fue aprobado.", { now: NOW });
  assert.equal(policy.ok, false);
  assert.deepEqual(policy.missingClaims, [CASE_OUTCOME_CLAIMS.APPROVED]);
});

test("acepta aprobado y pagado sólo por estados estructurados de Slack", () => {
  const policy = evaluateCaseResponsePolicy(caseWithFacts({
    slack: toolResult("slack_cache", [{ recordId: "row-1", status: "PAGADO Y APROBADO" }])
  }), "Tu retiro fue aprobado y pagado.", { now: NOW });
  assert.equal(policy.ok, true);
  assert.deepEqual(new Set(policy.claims), new Set([
    CASE_OUTCOME_CLAIMS.APPROVED,
    CASE_OUTCOME_CLAIMS.PAID
  ]));
});

test("exige revisión KYC humana vigente para afirmar KYC completo", () => {
  const unsupported = evaluateCaseResponsePolicy(caseWithFacts({}), "Tu KYC ya está completo y verificado.", { now: NOW });
  assert.equal(unsupported.ok, false);

  const supported = evaluateCaseResponsePolicy(caseWithFacts({
    kyc: toolResult("kyc_manual_review", [], {
      data: { record: { reviewId: "review-1", status: "complete", reviewedByHuman: true } }
    })
  }), "Tu KYC ya está completo y verificado.", { now: NOW });
  assert.equal(supported.ok, true);
});

test("una notificación Slack verificada permite decir enviado a revisión", () => {
  const policy = evaluateCaseResponsePolicy({
    ...caseWithFacts({}),
    systemFacts: {
      caseVerifiedActions: [{
        proposalId: "proposal-slack-1",
        actionType: "slack.notify",
        status: "verified",
        verifiedAt: "2026-08-11T17:58:00.000Z"
      }]
    }
  }, "Tu caso fue enviado a Transacciones para revisión.", { now: NOW });
  assert.equal(policy.ok, true);
});

test("fuentes vencidas y acciones antiguas no respaldan resultados", () => {
  const oldAction = evaluateCaseResponsePolicy({
    ...caseWithFacts({
      slack: toolResult("slack_cache", [{ recordId: "row-old", status: "APROBADO" }], {
        expiresAt: "2026-08-11T17:59:59.000Z"
      })
    }),
    systemFacts: {
      caseSlackLookup: toolResult("slack_cache", [{ recordId: "row-old", status: "APROBADO" }], {
        expiresAt: "2026-08-11T17:59:59.000Z"
      }),
      caseVerifiedActions: [{
        proposalId: "proposal-old",
        actionType: "slack.notify",
        status: "verified",
        verifiedAt: "2026-07-01T12:00:00.000Z"
      }]
    }
  }, "Tu retiro fue aprobado y enviado a revisión.", { now: NOW });
  assert.equal(oldAction.ok, false);
});

console.log(JSON.stringify({ ok: true, tests: results.length, results }, null, 2));

function caseWithFacts({ jira, slack, kyc } = {}) {
  return {
    chatId: "chat-policy",
    revision: 1,
    systemFacts: {
      ...(jira ? { caseJiraLookup: jira } : {}),
      ...(slack ? { caseSlackLookup: slack } : {}),
      ...(kyc ? { caseKycReview: kyc } : {})
    }
  };
}

function toolResult(source, records = [], overrides = {}) {
  return {
    tool: `case.${source}.lookup`,
    mode: "read",
    status: "available",
    verified: true,
    source,
    checkedAt: "2026-08-11T17:55:00.000Z",
    expiresAt: "2026-08-11T18:05:00.000Z",
    data: { records, count: records.length },
    ...overrides
  };
}

function test(name, fn) {
  fn();
  results.push(name);
}
