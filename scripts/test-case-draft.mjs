import assert from "node:assert/strict";
import {
  buildCaseDraftContext,
  generateCaseDraft,
  normalizeCaseDraft,
  normalizeProviderUsage
} from "../lib/case-draft.js";

const results = [];
const caseRecord = fixtureCase();

await test("builds a redacted context without attachment URLs or stale source records", async () => {
  const context = buildCaseDraftContext(caseRecord, "2026-08-11T12:05:00.000Z");
  const serialized = JSON.stringify(context);
  assert.equal(serialized.includes("cliente@example.com"), false);
  assert.equal(serialized.includes("11383340"), false);
  assert.equal(serialized.includes("Laura Medina"), false);
  assert.equal(serialized.includes("https://files.example.test/ine.jpg"), false);
  assert.equal(serialized.includes("No confiar en este dato vencido"), false);
  assert.equal(context.sources.jira.status, "available");
  assert.equal(context.sources.slack.status, "stale");
  assert.equal(context.sources.kyc.status, "unavailable");
  assert.equal(context.sources.kycReview.status, "available");
  assert.deepEqual(context.sources.kycReview.record, {
    reviewId: "review-kyc-1",
    status: "complete",
    reviewedAt: "2026-08-11T12:01:00.000Z",
    reviewedByHuman: true
  });
  assert.equal(serialized.includes("agente@betxico.mx"), false);
  assert.equal(context.evidence.attachments[0].reviewStatus, "pending");
  results.push("redacted bounded context");
});

await test("removes unsupported actions and unverified outcome claims", async () => {
  const context = buildCaseDraftContext({
    ...caseRecord,
    systemFacts: {}
  }, "2026-08-11T12:05:00.000Z");
  const draft = normalizeCaseDraft({
    classification: "withdrawal",
    analysis: "Caso de retiro.",
    nextStep: "Aprobarlo.",
    customerDraft: "Tu retiro ya fue aprobado y pagado.",
    suggestedAction: {
      actionType: "withdrawal.approve",
      target: "retiro",
      text: "Aprobar",
      reason: "Modelo"
    },
    usedSources: ["jira"],
    warnings: []
  }, context);
  assert.equal(draft.suggestedAction, null);
  assert.equal(draft.usedSources.length, 0);
  assert.match(draft.customerDraft, /sin adivinar/);
  assert.equal(draft.requiresHumanReview, true);
  assert.equal(draft.executable, false);
  results.push("unsafe draft normalization");
});

await test("blocks KYC document requests unless the deterministic route and human review allow them", async () => {
  const blockedContext = buildCaseDraftContext({
    ...caseRecord,
    operationalDecision: {
      route: "bank_rejection",
      source: "slack_list_8",
      reason: "La cuenta fue rechazada por el banco receptor.",
      customerMessage: "Localicé un motivo bancario y lo revisaré contigo."
    },
    systemFacts: {
      ...caseRecord.systemFacts,
      caseKycReview: null
    }
  }, "2026-08-11T12:05:00.000Z");
  const blocked = normalizeCaseDraft({
    customerDraft: "Envíame tu INE y una selfie para continuar.",
    usedSources: ["slack"]
  }, blockedContext);
  assert.equal(blocked.customerDraft, "Localicé un motivo bancario y lo revisaré contigo.");
  assert.ok(blocked.warnings.some((warning) => warning.includes("solicitud de documentos")));

  const allowedContext = buildCaseDraftContext({
    ...caseRecord,
    operationalDecision: {
      route: "kyc_document_required",
      source: "slack_list_8",
      reason: "Pendiente INE frente.",
      documentRequirements: [{ key: "ine_front", label: "INE de frente" }]
    }
  }, "2026-08-11T12:05:00.000Z");
  const allowed = normalizeCaseDraft({
    customerDraft: "Envíame la INE de frente para continuar.",
    usedSources: ["slack", "kyc"]
  }, allowedContext);
  assert.equal(allowed.customerDraft, "Envíame la INE de frente para continuar.");
  results.push("KYC request gate");
});

await test("calls a real provider adapter with only the redacted case projection", async () => {
  let providerInput = "";
  const generated = await generateCaseDraft({
    caseRecord,
    env: {
      SUPPORT_AI_PROVIDER: "groq",
      GROQ_API_KEY: "test-key",
      GROQ_MODEL: "test-model",
      GROQ_JSON_MODE: "true"
    },
    fetchImpl: async (_url, request) => {
      const body = JSON.parse(request.body);
      providerInput = body.messages?.[1]?.content || "";
      return jsonResponse({
        usage: { prompt_tokens: 410, completion_tokens: 190, total_tokens: 600 },
        choices: [{
          message: {
            content: JSON.stringify({
              classification: "withdrawal",
              analysis: "Jira confirma que falta actualizar datos KYC.",
              nextStep: "Solicitar revision humana de la evidencia antes de comentar Jira.",
              customerDraft: "Para continuar necesito que un agente revise el documento recibido.",
              suggestedAction: {
                actionType: "jira.comment",
                target: "BTF-15712",
                text: "Documento recibido; pendiente de revision humana.",
                reason: "Dar seguimiento sin afirmar aprobacion."
              },
              usedSources: ["jira", "slack"],
              warnings: ["Slack no esta vigente."]
            })
          }
        }]
      });
    }
  });
  assert.equal(providerInput.includes("cliente@example.com"), false);
  assert.equal(providerInput.includes("11383340"), false);
  assert.equal(providerInput.includes("https://files.example.test/ine.jpg"), false);
  assert.equal(generated.provider, "groq");
  assert.equal(generated.model, "test-model");
  assert.deepEqual(generated.draft.usedSources, ["jira"]);
  assert.equal(generated.draft.suggestedAction.actionType, "jira.comment");
  assert.equal(generated.draft.requiresHumanReview, true);
  assert.equal(generated.usage.inputTokens, 410);
  assert.equal(generated.usage.outputTokens, 190);
  results.push("provider-backed supervised draft");
});

await test("calculates OpenAI usage and estimated GPT-5.4 mini cost", async () => {
  const usage = normalizeProviderUsage({
    usage: {
      input_tokens: 1000,
      output_tokens: 200,
      input_tokens_details: { cached_tokens: 100 },
      output_tokens_details: { reasoning_tokens: 50 }
    }
  }, "openai", "gpt-5.4-mini");
  assert.equal(usage.totalTokens, 1200);
  assert.equal(usage.reasoningTokens, 50);
  assert.equal(usage.estimatedCostUsd, 0.00165);
  results.push("provider usage accounting");
});

await test("requires structured OpenAI output without provider storage", async () => {
  let providerBody;
  const generated = await generateCaseDraft({
    caseRecord,
    env: {
      SUPPORT_AI_PROVIDER: "openai",
      OPENAI_API_KEY: "test-key",
      OPENAI_MODEL: "gpt-5.4-mini"
    },
    fetchImpl: async (_url, request) => {
      providerBody = JSON.parse(request.body);
      return jsonResponse({
        output_text: JSON.stringify({
          classification: "withdrawal",
          analysis: "Jira contiene un antecedente vigente.",
          nextStep: "Mantener revisión humana.",
          customerDraft: "Estoy revisando el antecedente antes de confirmarte el resultado.",
          suggestedAction: null,
          usedSources: ["jira"],
          warnings: []
        }),
        usage: { input_tokens: 300, output_tokens: 100 }
      });
    }
  });

  assert.equal(providerBody.store, false);
  assert.equal(providerBody.text?.format?.type, "json_schema");
  assert.equal(providerBody.text?.format?.strict, true);
  assert.ok(providerBody.text?.format?.schema?.required.includes("customerDraft"));
  assert.equal(generated.draft.customerDraft, "Estoy revisando el antecedente antes de confirmarte el resultado.");
  results.push("structured OpenAI output without provider storage");
});

console.log(JSON.stringify({ ok: true, tests: results.length, results }, null, 2));

function fixtureCase() {
  return {
    chatId: "chat-private-1",
    revision: 4,
    state: "investigating",
    customer: {
      email: "cliente@example.com",
      authId: "11383340",
      liveChatCustomerId: "customer-private",
      name: "Laura Medina"
    },
    workflow: {
      id: "withdrawal",
      category: "withdrawals",
      confidence: 0.9,
      riskLevel: "high"
    },
    events: [{
      id: "event-1",
      role: "customer",
      text: "Soy Laura Medina, mi correo es cliente@example.com y mi AUTH ID: 11383340. Mi retiro sigue retenido."
    }],
    evidence: {
      receivedCount: 1,
      reviewedCount: 0,
      attachments: [{
        id: "attachment-1",
        kind: "image",
        mimeType: "image/jpeg",
        size: 120000,
        url: "https://files.example.test/ine.jpg"
      }],
      reviews: {}
    },
    missingData: [],
    pendingChecks: ["revision humana"],
    systemFacts: {
      caseJiraLookup: toolResult({
        status: "available",
        source: "jira",
        records: [{
          ticketKey: "BTF-15712",
          status: "En curso",
          priority: "Media",
          updatedAt: "2026-08-11T12:00:00.000Z",
          customer: { email: "cliente@example.com", authId: "11383340" },
          url: "https://jira.example.test/browse/BTF-15712",
          untrustedContent: {
            summary: "Actualizar datos KYC de Laura Medina",
            description: "Falta comprobante de domicilio.",
            latestComment: "Pendiente de documento."
          }
        }]
      }),
      caseSlackLookup: toolResult({
        status: "stale",
        source: "slack_cache",
        verified: false,
        expiresAt: "2026-08-11T11:00:00.000Z",
        records: [{
          listId: "Lista 8",
          status: "RETENIDO",
          untrustedContent: { reason: "No confiar en este dato vencido" }
        }]
      }),
      caseKycReview: {
        tool: "case.kyc-review.lookup",
        mode: "read",
        status: "available",
        verified: true,
        source: "kyc_manual_review",
        checkedAt: "2026-08-11T12:02:00.000Z",
        expiresAt: "2026-08-11T20:01:00.000Z",
        data: {
          record: {
            reviewId: "review-kyc-1",
            status: "complete",
            reviewedAt: "2026-08-11T12:01:00.000Z",
            reviewedByHuman: true,
            agentEmail: "agente@betxico.mx"
          }
        }
      }
    }
  };
}

function toolResult({ status, source, records, verified = true, expiresAt = "2099-08-11T12:10:00.000Z" }) {
  return {
    tool: `case.${source}.lookup`,
    mode: "read",
    status,
    verified,
    source,
    checkedAt: "2026-08-11T12:00:00.000Z",
    expiresAt,
    data: { records, count: records.length }
  };
}

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  };
}

async function test(name, fn) {
  try {
    await fn();
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  }
}
