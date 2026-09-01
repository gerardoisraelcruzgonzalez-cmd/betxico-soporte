import assert from "node:assert/strict";
import {
  appendSimulatorEvent,
  appendSimulatorAiUsage,
  assertSimulatorOwner,
  createSimulatorCase,
  prepareSimulatorManualReply,
  selectSimulatorReply,
  simulatorConversationView
} from "../lib/support-simulator.js";

const results = [];
const NOW = "2026-08-11T20:00:00.000Z";

const initial = createSimulatorCase({
  chatId: "simulator:test-1",
  customer: { email: "cliente@example.com", authId: "1138340", name: "Cliente Prueba" },
  ownerEmail: "gerardo.cruz@betxico.mx",
  now: NOW
});

test("starts an owned synthetic conversation with a welcome", () => {
  assert.equal(initial.source.type, "support_simulator");
  assert.equal(initial.source.synthetic, true);
  assert.equal(initial.events[0].role, "bot");
  assert.doesNotThrow(() => assertSimulatorOwner(initial, "gerardo.cruz@betxico.mx"));
  assert.throws(() => assertSimulatorOwner(initial, "otro@betxico.mx"), /simulator_case_not_owned/);
});

const withCustomer = appendSimulatorEvent(initial, {
  role: "customer",
  text: "Mi retiro de $500 sigue retenido hoy.",
  attachments: [{ name: "ine-frente.jpg", mimeType: "image/jpeg", size: 120000 }],
  now: "2026-08-11T20:01:00.000Z"
});

test("uses the production classifier and attachment metadata path", () => {
  assert.equal(withCustomer.workflow.id, "withdrawal");
  assert.equal(withCustomer.events.at(-1).role, "customer");
  assert.equal(withCustomer.evidence.receivedCount, 1);
  assert.equal(withCustomer.evidence.pendingReviewCount, 1);
  assert.equal(withCustomer.evidence.attachments[0].source, "support_simulator");
});

test("replaces an unsupported final claim before showing it to the synthetic customer", () => {
  const reply = selectSimulatorReply(withCustomer, { customerDraft: "Tu retiro ya fue aprobado." }, {
    now: "2026-08-11T20:02:00.000Z"
  });
  assert.equal(reply.replaced, true);
  assert.match(reply.text, /Para revisarlo sin adivinar/);
});

test("does not replace an explanation that explicitly avoids an unsupported outcome", () => {
  const reply = selectSimulatorReply(withCustomer, {
    customerDraft: "Veo que tu retiro sigue en revisión. No puedo confirmar que ya fue aprobado hasta tener el resultado operativo."
  }, {
    now: "2026-08-11T20:02:00.000Z"
  });
  assert.equal(reply.replaced, false);
  assert.match(reply.text, /No puedo confirmar/);
});

test("uses an actionable fallback when a draft is empty", () => {
  const reply = selectSimulatorReply(withCustomer, {}, {
    now: "2026-08-11T20:02:00.000Z"
  });
  assert.equal(reply.replaced, false);
  assert.match(reply.text, /Para revisarlo sin adivinar/);
  assert.match(reply.text, /estado o mensaje/);
});

test("uses the customer-safe template for a withdrawal awaiting approval", () => {
  const pendingCase = {
    ...withCustomer,
    operationalDecision: { route: "withdrawal_awaiting_approval" },
    systemFacts: {
      caseAtenaLookup: {
        data: { latestWithdrawal: { amount: "$155.00", date: "hoy" } }
      }
    }
  };
  const reply = selectSimulatorReply(pendingCase, {
    customerDraft: "Atena, Jira y Lista 8 dicen cosas internas que no deben mostrarse."
  }, {
    now: "2026-08-11T20:02:00.000Z"
  });
  assert.equal(reply.replaced, false);
  assert.match(reply.text, /retiro de \$155\.00 solicitado el día de hoy/);
  assert.match(reply.text, /Aguardando aprobación/);
  assert.match(reply.text, /no necesitas realizar ninguna acción adicional/);
  assert.doesNotMatch(reply.text, /Atena|Jira|Lista 8/);
});

test("does not use a historical withdrawal until the client identifies the movement", () => {
  const unidentified = {
    ...withCustomer,
    operationalDecision: { route: "identify_withdrawal" },
    systemFacts: {
      caseAtenaLookup: {
        data: { latestWithdrawal: { amount: "$300.00", date: "12/08/2026", status: "PAGADO" } }
      }
    }
  };
  const reply = selectSimulatorReply(unidentified, {
    customerDraft: "Tu retiro de $300 del 12 de agosto fue pagado."
  }, {
    now: "2026-08-11T20:02:00.000Z"
  });
  assert.match(reply.text, /monto y la fecha aproximada/);
  assert.doesNotMatch(reply.text, /\$300|pagado/i);
});

test("removes internal investigation wording from a customer response", () => {
  const reply = selectSimulatorReply(withCustomer, {
    customerDraft: "Vi el retiro en Atena y debo revisar Jira y la Lista 8 para decirte qué pasó."
  }, {
    now: "2026-08-11T20:02:00.000Z"
  });
  assert.equal(reply.replaced, true);
  assert.doesNotMatch(reply.text, /Atena|Jira|Lista 8|revisar Jira/i);
  assert.match(reply.text, /Para revisarlo sin adivinar/);
});

test("allows safe manual agent messages and rejects unsupported outcome claims", () => {
  const safe = prepareSimulatorManualReply(withCustomer, "Voy a revisar el documento antes de continuar.", {
    now: "2026-08-11T20:02:00.000Z"
  });
  assert.equal(safe.text, "Voy a revisar el documento antes de continuar.");
  assert.throws(
    () => prepareSimulatorManualReply(withCustomer, "Tu retiro ya fue aprobado.", {
      now: "2026-08-11T20:02:00.000Z"
    }),
    /simulator_agent_message_not_verified/
  );
});

test("returns only the synthetic transcript and intended customer identity", () => {
  const answered = appendSimulatorEvent(withCustomer, {
    role: "agent",
    text: "Voy a revisar el estado de tu retiro.",
    now: "2026-08-11T20:02:00.000Z"
  });
  const view = simulatorConversationView(answered);
  assert.equal(view.chatId, "simulator:test-1");
  assert.equal(view.transcript.length, 3);
  assert.equal(view.transcript.at(-1).text, "Voy a revisar el estado de tu retiro.");
  assert.equal(view.transcript[0].role, "assistant");
  assert.equal(view.transcript.at(-1).role, "agent");
  assert.equal("source" in view, false);
});

test("accumulates real provider usage by conversation", () => {
  const first = appendSimulatorAiUsage(initial, {
    provider: "openai", model: "gpt-5.4-mini", inputTokens: 500, outputTokens: 100,
    totalTokens: 600, estimatedCostUsd: 0.000825
  }, "2026-08-11T20:03:00.000Z");
  const second = appendSimulatorAiUsage(first, {
    provider: "openai", model: "gpt-5.4-mini", inputTokens: 600, outputTokens: 120,
    totalTokens: 720, estimatedCostUsd: 0.00099
  }, "2026-08-11T20:04:00.000Z");
  assert.equal(second.aiUsage.calls, 2);
  assert.equal(second.aiUsage.totalTokens, 1320);
  assert.equal(second.aiUsage.estimatedCostUsd, 0.001815);
});

test("clears Atena and KYC evidence when the customer corrects the email", () => {
  const withEvidence = {
    ...withCustomer,
    systemFacts: {
      caseJiraLookup: { status: "available" },
      caseSlackLookup: { status: "available" },
      caseAtenaLookup: { status: "available" },
      caseKycLookup: { status: "available" },
      caseKycReview: { status: "available" },
      caseKnowledgeLookup: { status: "available" }
    }
  };
  const corrected = appendSimulatorEvent(withEvidence, {
    role: "customer",
    text: "Me equivoqué, el correo correcto es cliente.nuevo@example.com",
    now: "2026-08-11T20:05:00.000Z"
  });
  assert.equal(corrected.customer.email, "cliente.nuevo@example.com");
  assert.equal(corrected.systemFacts.caseJiraLookup || null, null);
  assert.equal(corrected.systemFacts.caseSlackLookup || null, null);
  assert.equal(corrected.systemFacts.caseAtenaLookup || null, null);
  assert.equal(corrected.systemFacts.caseKycLookup || null, null);
  assert.equal(corrected.systemFacts.caseKycReview || null, null);
  assert.equal(corrected.systemFacts.caseKnowledgeLookup || null, null);
});

console.log(JSON.stringify({ ok: true, tests: results.length, results }, null, 2));

function test(name, fn) {
  fn();
  results.push(name);
}
