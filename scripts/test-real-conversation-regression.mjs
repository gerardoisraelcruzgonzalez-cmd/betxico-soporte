import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  deterministicCaseReply,
  isAcknowledgementWithoutNewEvidence,
  shouldLookupKycForCase
} from "../lib/case-decision-engine.js";
import { evolveSupportCase, reviewCaseEvidence } from "../lib/case-orchestrator.js";
import { lookupJiraCase, lookupSlackCase } from "../lib/case-read-tools.js";
import { appendSimulatorEvent, createSimulatorCase } from "../lib/support-simulator.js";

const FIXTURE_URL = new URL("../docs/fixtures/real-conversation-regression.anonymized.json", import.meta.url);
const fixture = JSON.parse(await readFile(FIXTURE_URL, "utf8"));
const results = [];

test("el fixture no contiene identidades personales reales", () => {
  assert.equal(fixture.privacy.sourceDataIncluded, false);
  assert.equal(fixture.privacy.identitiesAreSynthetic, true);
  assert.equal(fixture.slackScope.listNumber, 7);
  assert.equal(fixture.slackScope.expectedPanels, 1);
  assert.equal(fixture.cases.length, 6);

  for (const scenario of fixture.cases) {
    assert.match(scenario.customer.email, /^[^@\s]+@example\.test$/u, scenario.id);
    assert.match(scenario.customer.authId, /^99\d{6}$/u, scenario.id);
    for (const record of scenario.sources?.slack?.records || []) {
      assert.equal(record.listId, fixture.slackScope.listId, `${scenario.id}: sólo Lista 8`);
    }
  }

  const serialized = JSON.stringify(fixture).toLowerCase();
  assert.equal(serialized.includes("@gmail.com"), false);
  assert.equal(serialized.includes("@betxico.mx"), false);
  assert.equal(serialized.includes("paybridge"), false);
});

for (const scenario of fixture.cases.slice(0, 3)) {
  test(scenario.title, async () => {
    const supportCase = await buildInvestigatedCase(scenario);
    assertDecision(supportCase, scenario.expected);
  });
}

test("interpreta variantes de identidad de Lista 8 sin depender de una frase literal", async () => {
  const customer = { email: "cliente.kyc.lista7@example.test", authId: "99000009" };
  const variants = [
    "OTROS · KYC (Falta selfie e INE)",
    "Pendiente identificación oficial para continuar",
    "Validación de identidad requerida"
  ];

  for (const [index, reason] of variants.entries()) {
    let supportCase = evolveSupportCase(null, {
      chatId: `regression:lista7-identity-${index}`,
      customer,
      events: [caseEvent(`lista7-identity-${index}`, {
        role: "customer",
        text: "Mi retiro está retenido y no me llega."
      }, 1)],
      now: fixture.now
    });
    const slack = await lookupSlackCase(customer, {
      now: () => fixture.now,
      cacheLookup: async () => ({
        status: "available",
        checkedAt: fixture.now,
        expiresAt: addMinutes(fixture.now, 60),
        coverage: completeList7Coverage(),
        records: [{
          listId: fixture.slackScope.listId,
          recordId: `L7-KYC-TOPIC-${index}`,
          status: "RETENIDO / EN REVISION",
          reason,
          email: customer.email,
          authId: customer.authId
        }]
      })
    });
    supportCase = evolveSupportCase(supportCase, {
      chatId: supportCase.chatId,
      customer,
      systemFacts: { caseSlackLookup: slack },
      now: fixture.now
    });

    assert.equal(supportCase.operationalDecision.route, "kyc_document_required", reason);
    assert.equal(supportCase.operationalDecision.source, "slack_list_8", reason);
    assert.equal(supportCase.nextAction.type, "review_kyc", reason);
  }
});

test("Slack unavailable/stale no equivale a retiro inexistente", async () => {
  const scenario = byId("withdrawal-slack-degraded");

  for (const variant of scenario.sources.slackVariants) {
    const supportCase = await buildInvestigatedCase(scenario, variant);
    assert.equal(supportCase.workflow.id, scenario.expected.workflow, variant.name);
    assert.equal(supportCase.systemFacts.caseSlackLookup.status, variant.name, variant.name);
    assert.equal(supportCase.systemFacts.caseSlackLookup.verified, false, variant.name);
    assert.equal(supportCase.operationalDecision.route, scenario.expected.route, variant.name);
    assert.equal(supportCase.nextAction.type, scenario.expected.nextActionType, variant.name);
    assert.equal(shouldLookupKycForCase(supportCase), scenario.expected.requiresKyc, variant.name);
    if (scenario.expected.mustNotTreatAsNotFound) {
      assert.notEqual(supportCase.operationalDecision.route, "withdrawal_not_found", variant.name);
    }
  }
});

test("'listo' sin adjunto no se interpreta como evidencia recibida", async () => {
  const scenario = byId("kyc-ready-without-attachment");
  let supportCase = await buildInvestigatedCase(scenario, null, { messageCount: 1 });
  const acknowledgement = scenario.messages[1];

  assert.equal(
    isAcknowledgementWithoutNewEvidence(acknowledgement.text, acknowledgement.attachments),
    scenario.expected.acknowledgementWithoutEvidence
  );

  supportCase = evolveSupportCase(supportCase, {
    chatId: supportCase.chatId,
    customer: supportCase.customer,
    events: [caseEvent(scenario.id, acknowledgement, 2)],
    now: addMinutes(fixture.now, 2)
  });

  assert.equal(supportCase.evidence.receivedCount, scenario.expected.receivedAttachments);
  assert.equal(supportCase.operationalDecision.route, scenario.expected.route);
  const reply = deterministicCaseReply(supportCase).toLowerCase();
  assert.ok(reply.includes(scenario.expected.replyIncludes), reply);
  for (const forbidden of scenario.expected.replyExcludes) {
    assert.equal(reply.includes(forbidden), false, forbidden);
  }
});

test("Lista 8 pide INE de ambos lados y KYC humano permite continuar el retiro", async () => {
  const scenario = byId("kyc-ready-without-attachment");
  let supportCase = await buildInvestigatedCase(scenario, null, { messageCount: 1 });

  const firstReply = deterministicCaseReply(supportCase).toLowerCase();
  assert.ok(firstReply.includes("ine por ambos lados"), firstReply);
  assert.equal(firstReply.includes("confirma el requisito exacto"), false, firstReply);

  supportCase = evolveSupportCase(supportCase, {
    chatId: supportCase.chatId,
    customer: supportCase.customer,
    events: [caseEvent(scenario.id, {
      role: "customer",
      text: "Te comparto mi INE.",
      attachments: [{ id: "ine-front", kind: "image", name: "ine-frente.jpg", mimeType: "image/jpeg", size: 12000 }]
    }, 2)],
    now: addMinutes(fixture.now, 2)
  });
  supportCase = reviewCaseEvidence(supportCase, {
    attachmentIds: supportCase.evidence.attachments.map((item) => item.id),
    reviewedBy: "agente@example.test",
    now: addMinutes(fixture.now, 3)
  });
  supportCase = evolveSupportCase(supportCase, {
    chatId: supportCase.chatId,
    customer: supportCase.customer,
    systemFacts: {
      caseKycReview: {
        tool: "case.kyc-review.lookup",
        mode: "read",
        source: "kyc_manual_review",
        status: "available",
        verified: true,
        checkedAt: addMinutes(fixture.now, 3),
        expiresAt: addMinutes(fixture.now, 63),
        data: { record: { reviewId: "KYC-TEST-1", status: "complete", reviewedAt: addMinutes(fixture.now, 3), reviewedByHuman: true } }
      }
    },
    now: addMinutes(fixture.now, 3)
  });

  assert.equal(supportCase.operationalDecision.route, "kyc_updated_withdrawal_ready");
  assert.equal(supportCase.nextAction.type, "prepare_verified_response");
  const completionReply = deterministicCaseReply(supportCase).toLowerCase();
  assert.ok(completionReply.includes("ya actualizamos tus datos"), completionReply);
  assert.ok(completionReply.includes("compartir tu retiro"), completionReply);
  assert.equal(completionReply.includes("pagado"), false, completionReply);
});

for (const correctionField of ["email", "authId"]) {
test(`corregir ${correctionField} invalida todas las consultas anteriores`, () => {
  const scenario = byId("identity-correction-invalidates-lookups");
  const correction = scenario.corrections.find((item) => item.field === correctionField);
  assert.ok(correction, correctionField);
  let supportCase = createSimulatorCase({
    chatId: `simulator:${scenario.id}`,
    customer: scenario.customer,
    ownerEmail: "owner@example.test",
    now: fixture.now
  });
  supportCase = appendSimulatorEvent(supportCase, {
    ...scenario.messages[0],
    now: addMinutes(fixture.now, 1)
  });
  supportCase = withCompletedLookups(supportCase);

  supportCase = appendSimulatorEvent(supportCase, {
    role: "customer",
    text: correction.text,
    now: addMinutes(fixture.now, 2)
  });
  assert.equal(supportCase.customer[correction.field], correction.expectedValue, correction.field);
  for (const key of scenario.expected.invalidatedSystemFacts) {
    assert.equal(
      hasUsableFact(supportCase.systemFacts?.[key]),
      false,
      `${correction.field} debe invalidar ${key}`
    );
  }

  assert.equal(supportCase.identityCorrections.length, 1);
});
}

for (const entry of results) {
  try {
    await entry.run();
    process.stdout.write(`ok - ${entry.name}\n`);
  } catch (error) {
    process.stderr.write(`not ok - ${entry.name}\n  ${error.stack || error.message}\n`);
    process.exitCode = 1;
  }
}

const failed = process.exitCode === 1;
process.stdout.write(`\n${results.length} contratos ejecutados; ${failed ? "hay gaps expuestos" : "todos aprobados"}.\n`);

function test(name, run) {
  results.push({ name, run });
}

function byId(id) {
  const scenario = fixture.cases.find((item) => item.id === id);
  assert.ok(scenario, `fixture no encontrado: ${id}`);
  return scenario;
}

async function buildInvestigatedCase(scenario, slackOverride, options = {}) {
  const messageCount = options.messageCount || scenario.messages.length;
  let supportCase = evolveSupportCase(null, {
    chatId: `regression:${scenario.id}`,
    customer: scenario.customer,
    events: scenario.messages.slice(0, messageCount).map((message, index) => caseEvent(scenario.id, message, index + 1)),
    now: fixture.now,
    source: { type: "anonymized_regression_fixture", synthetic: true }
  });

  const jira = await lookupJiraCase(scenario.customer, {
    now: () => fixture.now,
    jiraSearch: async () => scenario.sources.jira.records
  });
  const slackInput = slackOverride || scenario.sources.slack;
  const slack = await lookupSlackCase(scenario.customer, {
    now: () => fixture.now,
    cacheLookup: async () => {
      if (slackInput.throws) {
        const error = new Error(slackInput.throws.message);
        error.statusCode = slackInput.throws.statusCode;
        throw error;
      }
      return {
        ...slackInput,
        coverage: slackInput.coverage || completeList7Coverage()
      };
    }
  });

  supportCase = evolveSupportCase(supportCase, {
    chatId: supportCase.chatId,
    customer: supportCase.customer,
    systemFacts: { caseJiraLookup: jira, caseSlackLookup: slack },
    now: fixture.now
  });
  return supportCase;
}

function assertDecision(supportCase, expected) {
  assert.equal(supportCase.workflow.id, expected.workflow);
  assert.equal(supportCase.operationalDecision.route, expected.route);
  assert.equal(supportCase.operationalDecision.source, expected.source);
  assert.equal(supportCase.nextAction.type, expected.nextActionType);
  assert.equal(shouldLookupKycForCase(supportCase), expected.requiresKyc);

  for (const fragment of expected.reasonIncludes || []) {
    assert.ok(supportCase.operationalDecision.reason.includes(fragment), fragment);
  }
  if (expected.documentRequirementKeys) {
    assert.deepEqual(
      supportCase.operationalDecision.documentRequirements.map((item) => item.key),
      expected.documentRequirementKeys
    );
  }
}

function completeList7Coverage() {
  return {
    complete: true,
    expectedPanels: fixture.slackScope.expectedPanels,
    cachedPanels: fixture.slackScope.expectedPanels,
    missingPanels: 0,
    partialPanels: 0
  };
}

function caseEvent(scenarioId, message, sequence) {
  return {
    eventId: `${scenarioId}:event:${sequence}`,
    role: message.role,
    text: message.text,
    createdAt: addMinutes(fixture.now, sequence),
    attachments: message.attachments || []
  };
}

function withCompletedLookups(caseRecord) {
  const result = {
    mode: "read",
    status: "available",
    verified: true,
    checkedAt: fixture.now,
    expiresAt: addMinutes(fixture.now, 5),
    data: { records: [{ recordId: "SYNTHETIC-LOOKUP" }] }
  };
  return {
    ...caseRecord,
    systemFacts: {
      ...caseRecord.systemFacts,
      caseJiraLookup: { ...result, tool: "case.jira.lookup", source: "jira" },
      caseSlackLookup: { ...result, tool: "case.slack-cache.lookup", source: "slack_cache" },
      caseKycReview: { ...result, tool: "case.kyc-review.lookup", source: "kyc_manual_review" },
      caseAtenaLookup: { ...result, tool: "case.atena.lookup", source: "atena" }
    }
  };
}

function hasUsableFact(value) {
  return Boolean(value && typeof value === "object" && Object.keys(value).length);
}

function addMinutes(iso, minutes) {
  return new Date(Date.parse(iso) + minutes * 60_000).toISOString();
}
