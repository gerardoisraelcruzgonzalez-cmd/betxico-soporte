import assert from "node:assert/strict";
import http from "node:http";
import {
  CASE_STATES,
  classifySupportCase,
  evolveSupportCase,
  extractLiveChatCaseInput,
  publicCaseSummary,
  reviewCaseEvidence
} from "../lib/case-orchestrator.js";
import liveChatWebhookHandler from "../api/livechat-webhook.js";

const NOW = "2026-07-29T18:00:00.000Z";
const EVENT_TIME = "2026-07-29T17:59:00.000Z";
const EMAIL = "cliente@example.com";

const results = [];

test("extracts customer and agent messages from a LiveChat webhook", () => {
  const input = extractLiveChatCaseInput({
    action: "incoming_event",
    webhook_id: "wh_1",
    payload: {
      chat: {
        id: "chat-extract",
        users: [
          { id: "customer-1", type: "customer", email: EMAIL, name: "Cliente" },
          { id: "agent-1", type: "agent", name: "Agente" }
        ],
        thread: {
          events: [
            { id: "event-customer", type: "message", author_id: "customer-1", text: "No puedo retirar", created_at: EVENT_TIME },
            { id: "event-agent", type: "message", author_id: "agent-1", text: "Voy a revisarlo", created_at: NOW }
          ]
        }
      }
    }
  });

  assert.equal(input.chatId, "chat-extract");
  assert.equal(input.customer.email, EMAIL);
  assert.deepEqual(input.events.map((event) => event.role).sort(), ["agent", "customer"]);
  assert.equal(input.events.length, 2);
});

test("keeps a widget-only customer context separate from fabricated messages", () => {
  const input = extractLiveChatCaseInput({
    action: "widget_context_refresh",
    payload: {
      chat: {
        id: "chat-widget-context",
        properties: { auth_id: "123456" },
        users: [{ id: "widget-customer", type: "customer", email: EMAIL, name: "Cliente" }]
      }
    }
  });
  const supportCase = evolveSupportCase(null, { ...input, now: NOW });

  assert.equal(input.events.length, 0);
  assert.equal(supportCase.customer.email, EMAIL);
  assert.equal(supportCase.customer.authId, "123456");
  assert.equal(supportCase.state, CASE_STATES.IDENTIFIED);
  assert.equal(supportCase.nextAction.type, "await_customer_message");
});

test("classifies a blocked game and prepares BoB checks", () => {
  const supportCase = createCase(
    "No puedo jugar. El juego se llama 3 Coin Volcanoes. Sale pantalla negra en la app y adjunto captura.",
    "game-access"
  );

  assert.equal(supportCase.workflow.id, "game_access");
  assert.equal(supportCase.workflow.riskLevel, "medium");
  assert.equal(supportCase.state, CASE_STATES.INVESTIGATING);
  assert.equal(supportCase.nextAction.type, "investigate");
  assert.ok(supportCase.pendingChecks.includes("Pending Win antes de cualquier cierre"));
  assertSafeAutomation(supportCase);
});

test("separates a missing casino win from game access", () => {
  const supportCase = createCase(
    "En el juego Gates of Olympus no me pago una ganancia de $72.02 ayer. Adjunto captura del historial y movimientos.",
    "casino-win"
  );

  assert.equal(supportCase.workflow.id, "casino_win_missing");
  assert.equal(supportCase.workflow.riskLevel, "high");
  assert.equal(supportCase.state, CASE_STATES.INVESTIGATING);
  assert.ok(supportCase.pendingChecks.includes("Pending Win"));
  assertSafeAutomation(supportCase);
});

test("consults withdrawal history before requesting amount, date and status", () => {
  const supportCase = createCase("No puedo retirar y me aparece un error.", "withdrawal");

  assert.equal(supportCase.workflow.id, "withdrawal");
  assert.equal(supportCase.workflow.riskLevel, "high");
  assert.equal(supportCase.state, CASE_STATES.INVESTIGATING);
  assert.equal(supportCase.operationalDecision.route, "lookup_history");
  assert.equal(supportCase.nextAction.type, "investigate");
  assert.ok(supportCase.missingData.some((field) => field.key === "amount"));
  assert.ok(supportCase.missingData.some((field) => field.key === "occurredAt"));
  assert.ok(supportCase.missingData.some((field) => field.key === "withdrawalStatus"));
  assertSafeAutomation(supportCase);
});

test("routes identity discrepancies to KYC with a human gate", () => {
  const supportCase = createCase(
    "Mi nombre no coincide entre KYC y Atena. Me piden selfie con INE para verificar.",
    "kyc"
  );

  assert.equal(supportCase.workflow.id, "kyc_identity");
  assert.equal(supportCase.workflow.requiresHumanApproval, true);
  assert.equal(supportCase.workflow.riskLevel, "high");
  assert.equal(supportCase.state, CASE_STATES.INVESTIGATING);
  assertSafeAutomation(supportCase);
});

test("routes CLABE deletion separately from a withdrawal", () => {
  const supportCase = createCase(
    "Quiero eliminar la CLABE terminacion 5807 que tengo registrada.",
    "bank-account"
  );

  assert.equal(supportCase.workflow.id, "bank_account");
  assert.equal(supportCase.state, CASE_STATES.INVESTIGATING);
  assert.equal(supportCase.workflow.requiresHumanApproval, true);
  assertSafeAutomation(supportCase);
});

test("requires provider reconciliation for sports bets", () => {
  const supportCase = createCase(
    "Mi apuesta deportiva aparece duplicada. El boleto fue de $161 hoy y adjunto historial y movimientos.",
    "sports"
  );

  assert.equal(supportCase.workflow.id, "sports_bet");
  assert.equal(supportCase.state, CASE_STATES.INVESTIGATING);
  assert.ok(supportCase.pendingChecks.includes("boleto en First Sports"));
  assertSafeAutomation(supportCase);
});

test("collects the minimum SPEI evidence before deposit investigation", () => {
  const supportCase = createCase(
    "Hice un SPEI de $205 hoy y no aparece. Adjunto comprobante y CEP con la clave de rastreo.",
    "deposit"
  );

  assert.equal(supportCase.workflow.id, "deposit");
  assert.equal(supportCase.state, CASE_STATES.INVESTIGATING);
  assert.ok(supportCase.pendingChecks.includes("CEP o procesador"));
  assertSafeAutomation(supportCase);
});

test("keeps bonus and rollover changes human controlled", () => {
  const supportCase = createCase(
    "Tengo rollover x2 por el bono de bienvenida de mi deposito de $2000.",
    "bonus"
  );

  assert.equal(supportCase.workflow.id, "bonus_rollover");
  assert.equal(supportCase.workflow.riskLevel, "medium");
  assert.equal(supportCase.workflow.requiresHumanApproval, true);
  assertSafeAutomation(supportCase);
});

test("keeps a promotion question in the bonus route when withdrawal is only a condition", () => {
  const supportCase = createCase(
    "Hice mi segundo depósito y quiero activar el bono del diez por ciento. ¿Dónde aplica y qué tengo que cumplir para poder retirar?",
    "bonus-withdrawal-condition"
  );

  assert.equal(supportCase.workflow.id, "bonus_rollover");
  assert.ok(supportCase.workflow.matchedSignals.includes("consulta principal de promocion"));
  assertSafeAutomation(supportCase);
});

test("recognizes Devolucion Wallet and requires ownership review", () => {
  const supportCase = createCase(
    "Deposite $300 por error y quiero retirar sin jugar. La cuenta de deposito y retiro esta a mi nombre.",
    "devwallet"
  );

  assert.equal(supportCase.workflow.id, "devwallet");
  assert.equal(supportCase.state, CASE_STATES.INVESTIGATING);
  assert.equal(supportCase.workflow.riskLevel, "high");
  assertSafeAutomation(supportCase);
});

test("never automates a permanent account closure", () => {
  const supportCase = createCase("Quiero cerrar mi cuenta definitivamente.", "closure");

  assert.equal(supportCase.workflow.id, "account_closure");
  assert.equal(supportCase.workflow.riskLevel, "high");
  assert.equal(supportCase.workflow.requiresHumanApproval, true);
  assertSafeAutomation(supportCase);
});

test("uses a BTF key for ticket follow-up without marking it resolved", () => {
  const supportCase = createCase("Quiero seguimiento del ticket BTF-14985.", "follow-up");

  assert.equal(supportCase.workflow.id, "ticket_followup");
  assert.equal(supportCase.state, CASE_STATES.INVESTIGATING);
  assert.notEqual(supportCase.state, CASE_STATES.RESOLVED);
  assertSafeAutomation(supportCase);
});

test("unknown cases remain waiting for clarification", () => {
  const supportCase = createCase("Tengo un problema y necesito ayuda.", "unknown");

  assert.equal(supportCase.workflow.id, "unknown");
  assert.equal(supportCase.state, CASE_STATES.WAITING_EVIDENCE);
  assert.equal(supportCase.nextAction.type, "clarify_issue");
  assertSafeAutomation(supportCase);
});

test("agent text does not classify the customer intent", () => {
  const supportCase = evolveSupportCase(null, {
    chatId: "agent-only",
    now: NOW,
    customer: { email: EMAIL },
    events: [
      event("agent-event", "agent", "El retiro esta rechazado.")
    ]
  });

  assert.equal(supportCase.workflow.id, "");
  assert.equal(supportCase.state, CASE_STATES.IDENTIFIED);
  assertSafeAutomation(supportCase);
});

test("duplicate webhook events are idempotent", () => {
  const first = createCase("No puedo retirar $600 hoy, aparece failed.", "duplicate", {
    eventId: "same-event"
  });
  const second = evolveSupportCase(first, {
    chatId: "duplicate",
    now: "2026-07-29T18:01:00.000Z",
    customer: { email: EMAIL },
    events: [
      event("same-event", "customer", "No puedo retirar $600 hoy, aparece failed.")
    ]
  });

  assert.equal(first.events.length, 1);
  assert.equal(second.events.length, 1);
  assert.equal(second.workflow.id, "withdrawal");
});

test("sensitive values are redacted from stored conversation text", () => {
  const supportCase = createCase(
    "Mi correo es otro@example.com, CLABE 012345678901234567 y password=secreto. Quiero eliminar la CLABE terminacion 4567.",
    "redaction"
  );
  const storedText = supportCase.events[0].text;

  assert.ok(storedText.includes("[EMAIL_REDACTED]"));
  assert.ok(storedText.includes("[CLABE_REDACTED]"));
  assert.ok(storedText.includes("[CREDENTIAL_REDACTED]"));
  assert.ok(!storedText.includes("otro@example.com"));
  assert.ok(!storedText.includes("012345678901234567"));
  assert.ok(!storedText.includes("secreto"));
});

test("public summaries do not expose customer identity or message text", () => {
  const supportCase = createCase("No puedo retirar $600 hoy, aparece failed.", "public-summary");
  const summary = publicCaseSummary(supportCase);

  assert.equal(summary.workflow.id, "withdrawal");
  assert.equal("customer" in summary, false);
  assert.equal("events" in summary, false);
  assert.equal("facts" in summary, false);
});

test("classifies all supported workflow families", () => {
  const fixtures = [
    ["Quiero cerrar mi cuenta", "account_closure"],
    ["Caso DEVWALLET1", "devwallet"],
    ["Quiero cambiar mi CLABE", "bank_account"],
    ["Mi identidad no coincide", "kyc_identity"],
    ["Mi apuesta deportiva no aparece", "sports_bet"],
    ["No me pago la ganancia", "casino_win_missing"],
    ["El juego no carga", "game_access"],
    ["Mi retiro fue rechazado", "withdrawal"],
    ["Mi deposito SPEI no aparece", "deposit"],
    ["Tengo rollover pendiente", "bonus_rollover"],
    ["Quiero activar el bono del 10% y saber qué cumplir para retirar", "bonus_rollover"],
    ["Seguimiento del ticket BTF-100", "ticket_followup"]
  ];

  for (const [message, expected] of fixtures) {
    assert.equal(classifySupportCase(message).workflow.id, expected, message);
  }
});

test("records human review only for attachments present in the case", () => {
  const supportCase = evolveSupportCase(null, {
    chatId: "evidence-review",
    now: NOW,
    customer: { email: EMAIL },
    events: [{
      ...event("evidence-event", "customer", "Adjunto el comprobante del retiro."),
      attachments: [{
        id: "attachment-1",
        kind: "image",
        name: "comprobante.png",
        mimeType: "image/png",
        size: 2048,
        receivedAt: EVENT_TIME
      }]
    }]
  });
  const attachmentId = supportCase.evidence.attachments[0].id;
  const reviewed = reviewCaseEvidence(supportCase, {
    attachmentIds: [attachmentId],
    reviewedBy: "agente@betxico.mx",
    now: "2026-07-29T18:05:00.000Z"
  });

  assert.equal(reviewed.revision, supportCase.revision + 1);
  assert.equal(reviewed.evidence.reviewedCount, 1);
  assert.equal(reviewed.evidence.pendingReviewCount, 0);
  assert.equal(reviewed.evidence.attachments[0].reviewStatus, "reviewed");
  assert.equal(reviewed.evidence.attachments[0].reviewedBy, "agente@betxico.mx");
  assert.equal(reviewed.evidence.attachments[0].reviewedAt, "2026-07-29T18:05:00.000Z");
  assert.throws(
    () => reviewCaseEvidence(reviewed, { attachmentIds: ["attachment-other"] }),
    (error) => error.message === "case_attachment_not_found" && error.statusCode === 404
  );
});

await testAsync("persists a deduplicated case through the LiveChat webhook", async () => {
  const kv = await createFakeKvServer();
  const previousUrl = process.env.KV_REST_API_URL;
  const previousToken = process.env.KV_REST_API_TOKEN;
  const previousWebhookSecret = process.env.LIVECHAT_WEBHOOK_SECRET;
  const originalLog = console.log;
  process.env.KV_REST_API_URL = kv.url;
  process.env.KV_REST_API_TOKEN = "test-token";
  process.env.LIVECHAT_WEBHOOK_SECRET = "test-webhook-secret";
  console.log = () => {};

  try {
    const webhook = {
      action: "incoming_event",
      webhook_id: "wh-integration",
      secret_key: "test-webhook-secret",
      payload: {
        chat: {
          id: "chat-integration",
          users: [
            { id: "customer-integration", type: "customer", email: EMAIL },
            { id: "agent-integration", type: "agent", name: "Agente" }
          ],
          thread: {
            events: [
              {
                id: "integration-customer",
                type: "message",
                author: { type: "customer", id: "customer-integration" },
                text: "No puedo retirar $600 hoy, aparece failed.",
                created_at: EVENT_TIME
              },
              {
                id: "integration-agent",
                type: "message",
                author: { type: "agent", id: "agent-integration" },
                text: "Voy a revisar el estado.",
                created_at: NOW
              }
            ]
          }
        }
      }
    };

    const first = await invokeWebhook(webhook);
    const second = await invokeWebhook(webhook);
    const stored = JSON.parse(kv.data.get("support:case:v1:chat-integration"));

    assert.equal(first.statusCode, 200);
    assert.equal(first.body.case.workflow.id, "withdrawal");
    assert.equal(first.body.case.state, CASE_STATES.INVESTIGATING);
    assert.equal("events" in first.body.case, false);
    assert.equal(second.statusCode, 200);
    assert.equal(stored.events.length, 2);
    assert.deepEqual(stored.events.map((event) => event.role).sort(), ["agent", "customer"]);
    assert.equal(stored.automation.mode, "suggest_only");
  } finally {
    console.log = originalLog;
    restoreEnv("KV_REST_API_URL", previousUrl);
    restoreEnv("KV_REST_API_TOKEN", previousToken);
    restoreEnv("LIVECHAT_WEBHOOK_SECRET", previousWebhookSecret);
    await kv.close();
  }
});

await testAsync("keeps the LiveChat webhook available when case persistence is locked", async () => {
  const kv = await createFakeKvServer();
  const previousUrl = process.env.KV_REST_API_URL;
  const previousToken = process.env.KV_REST_API_TOKEN;
  const previousWebhookSecret = process.env.LIVECHAT_WEBHOOK_SECRET;
  const originalLog = console.log;
  process.env.KV_REST_API_URL = kv.url;
  process.env.KV_REST_API_TOKEN = "test-token";
  process.env.LIVECHAT_WEBHOOK_SECRET = "test-webhook-secret";
  console.log = () => {};
  kv.data.set("support:case-lock:v1:chat-degraded", "another-worker");

  try {
    const response = await invokeWebhook({
      action: "incoming_event",
      webhook_id: "wh-degraded",
      secret_key: "test-webhook-secret",
      payload: {
        chat: {
          id: "chat-degraded",
          users: [{ id: "customer-degraded", type: "customer", email: EMAIL }],
          thread: {
            events: [{
              id: "degraded-customer",
              type: "message",
              author: { type: "customer", id: "customer-degraded" },
              text: "Necesito seguimiento del ticket BTF-200.",
              created_at: EVENT_TIME
            }]
          }
        }
      }
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.ok, true);
    assert.equal(response.body.stored, 1);
    assert.equal("case" in response.body, false);
    assert.equal(kv.data.has("support:case:v1:chat-degraded"), false);
  } finally {
    console.log = originalLog;
    restoreEnv("KV_REST_API_URL", previousUrl);
    restoreEnv("KV_REST_API_TOKEN", previousToken);
    restoreEnv("LIVECHAT_WEBHOOK_SECRET", previousWebhookSecret);
    await kv.close();
  }
});

console.log(JSON.stringify({ ok: true, tests: results.length, results }, null, 2));

function createCase(message, chatId, options = {}) {
  return evolveSupportCase(null, {
    chatId,
    now: NOW,
    customer: { email: EMAIL },
    events: [
      event(options.eventId || `${chatId}-event`, "customer", message)
    ],
    facts: options.facts,
    systemFacts: options.systemFacts
  });
}

function event(eventId, role, text) {
  return {
    eventId,
    role,
    text,
    createdAt: EVENT_TIME
  };
}

function assertSafeAutomation(supportCase) {
  assert.equal(supportCase.automation.mode, "suggest_only");
  assert.equal(supportCase.automation.canSendAutomatically, false);
  assert.equal(supportCase.automation.canExecuteSensitiveAction, false);
}

function test(name, fn) {
  fn();
  results.push({ name, ok: true });
}

async function testAsync(name, fn) {
  await fn();
  results.push({ name, ok: true });
}

async function invokeWebhook(body) {
  let responseBody = "";
  const req = {
    method: "POST",
    url: "/api/livechat-webhook",
    headers: {},
    body
  };
  const res = {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[String(name).toLowerCase()] = value;
    },
    end(value) {
      responseBody = String(value || "");
    }
  };

  await liveChatWebhookHandler(req, res);
  return {
    statusCode: res.statusCode,
    headers: res.headers,
    body: responseBody ? JSON.parse(responseBody) : null
  };
}

async function createFakeKvServer() {
  const data = new Map();
  const server = http.createServer(async (req, res) => {
    const chunks = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const pipeline = JSON.parse(Buffer.concat(chunks).toString("utf8") || "[]");
    const command = pipeline[0] || [];
    const result = executeKvCommand(data, command);
    res.statusCode = 200;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify([{ result }]));
  });

  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  return {
    data,
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => {
      server.close((error) => error ? reject(error) : resolve());
    })
  };
}

function executeKvCommand(data, command) {
  const action = String(command[0] || "").toUpperCase();
  if (action === "GET") return data.get(String(command[1])) ?? null;
  if (action === "DEL") return data.delete(String(command[1])) ? 1 : 0;
  if (action === "SET") {
    const key = String(command[1]);
    const value = String(command[2]);
    const options = command.slice(3).map((item) => String(item).toUpperCase());
    if (options.includes("NX") && data.has(key)) return null;
    data.set(key, value);
    return "OK";
  }
  if (action === "EVAL") {
    const key = String(command[3]);
    const token = String(command[4]);
    if (data.get(key) !== token) return 0;
    data.delete(key);
    return 1;
  }
  throw new Error(`Unsupported fake KV command: ${action}`);
}

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}
