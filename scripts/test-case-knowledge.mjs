import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { buildCaseDraftContext, normalizeCaseDraft } from "../lib/case-draft.js";
import { getCaseKnowledgeMetadata, lookupCaseKnowledge } from "../lib/case-knowledge.js";

const NOW = "2026-08-13T12:00:00.000Z";
const results = [];

const withdrawalKyc = lookupCaseKnowledge({
  caseRecord: createCase({
    workflow: "withdrawal",
    text: "Mi retiro está retenido y me dijeron que falta identificación y selfie.",
    slackReason: "KYC: falta documento oficial y fotografía de rostro"
  }),
  now: () => NOW
});

test("loads the complete versioned manual index", () => {
  const metadata = getCaseKnowledgeMetadata();
  assert.equal(metadata.scope, "simulator_preview");
  assert.equal(metadata.scenarios, 91);
  assert.equal(metadata.sources, 14);
  assert.equal(metadata.sourceHash.length, 64);
});

test("matches semantic KYC document equivalents without exact phrasing", () => {
  assert.equal(withdrawalKyc.status, "available");
  assert.equal(withdrawalKyc.data.guidanceOnly, true);
  assert.equal(withdrawalKyc.data.canAuthorizeActions, false);
  const titles = withdrawalKyc.data.records.map((record) => record.title);
  assert.ok(titles.includes("Retiro retenido por KYC"), titles.join(" | "));
  assert.ok(withdrawalKyc.data.records.length <= 5);
  assert.ok(withdrawalKyc.data.records.some((record) => record.kind === "policy" && record.category === "withdrawal"));
  assert.ok(withdrawalKyc.data.records.every((record) => record.humanGate?.canAutoSend === false));
  assert.ok(withdrawalKyc.data.records.every((record) => record.sourceRefs.includes("M1")));
});

test("retrieves current promotion guidance for varied customer wording", () => {
  const result = lookupCaseKnowledge({
    caseRecord: createCase({
      workflow: "bonus_rollover",
      text: "Deposité para el diez por ciento pero jugué antes de prender la promo."
    }),
    now: () => NOW
  });
  const titles = result.data.records.map((record) => record.title);
  assert.ok(titles.some((title) => /Jugó antes de activar bono|Promoción 10%/u.test(title)), titles.join(" | "));
  const policy = result.data.records.find((record) => record.kind === "policy" && record.category === "bonus_rollover");
  assert.ok(policy);
  assert.equal(policy.freshness.mode, "live_required");
  assert.equal(policy.freshness.status, "ambiguous");
  assert.ok(policy.rules.some((rule) => /solo slots/i.test(rule)));
  assert.ok(policy.rules.some((rule) => /tarjeta también muestra >\$200/i.test(rule)));
  assert.ok(policy.sourceRefs.includes("F5"));
  assert.ok(result.data.records.every((record) => (
    record.category === "bonus_rollover" || record.category === "governance"
  )), result.data.records.map((record) => `${record.category}:${record.title}`).join(" | "));
});

test("passes only bounded manual excerpts into the model context", () => {
  const context = buildCaseDraftContext({
    ...createCase({ workflow: "withdrawal", text: "Mi retiro no llega" }),
    systemFacts: { caseKnowledgeLookup: withdrawalKyc }
  }, "2026-08-13T12:01:00.000Z");
  assert.equal(context.sources.knowledge.status, "available");
  assert.equal(context.sources.knowledge.records.length <= 5, true);
  assert.equal(JSON.stringify(context).includes("cliente@example.com"), false);
  assert.equal(JSON.stringify(context).includes("searchText"), false);
});

test("does not let the manual alone confirm a case outcome", () => {
  const context = buildCaseDraftContext({
    ...createCase({ workflow: "withdrawal", text: "Mi retiro no llega" }),
    systemFacts: { caseKnowledgeLookup: withdrawalKyc }
  }, "2026-08-13T12:01:00.000Z");
  const draft = normalizeCaseDraft({
    classification: "withdrawal",
    customerDraft: "Tu retiro ya fue aprobado.",
    usedSources: ["knowledge"]
  }, context);
  assert.doesNotMatch(draft.customerDraft, /ya fue aprobado/iu);
  assert.ok(draft.warnings.some((warning) => /manual|fuente/i.test(warning)));
});

test("contains no customer identity, credentials, or document payloads", () => {
  const serialized = JSON.stringify(withdrawalKyc);
  assert.equal(serialized.includes("cliente@example.com"), false);
  assert.doesNotMatch(serialized, /(?:password|cookie|authorization|signedUrl|documentNumber|curp|phone)/iu);
});

test("generator is deterministic and checks all 91 scenarios", () => {
  const source = readFileSync(new URL("build-manual-knowledge.py", import.meta.url), "utf8");
  assert.match(source, /scenario_count != 91/);
  assert.doesNotMatch(source, /python-docx|from docx/u);
});

console.log(JSON.stringify({ ok: true, tests: results.length, results }, null, 2));

function createCase({ workflow, text, slackReason = "" }) {
  return {
    chatId: "simulator:knowledge-test",
    revision: 1,
    workflow: { id: workflow, category: workflow, confidence: 0.9, riskLevel: "high" },
    customer: { email: "cliente@example.com", authId: "1138340", name: "Cliente Prueba" },
    events: [{ role: "customer", text }],
    evidence: {},
    systemFacts: slackReason ? {
      caseSlackLookup: {
        status: "available",
        verified: true,
        data: { records: [{ untrustedContent: { reason: slackReason } }] }
      }
    } : {},
    operationalDecision: null,
    missingData: [],
    pendingChecks: []
  };
}

function test(name, fn) {
  fn();
  results.push(name);
}
