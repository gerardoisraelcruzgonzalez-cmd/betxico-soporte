import assert from "node:assert/strict";
import { readJson } from "../lib/http.js";
import {
  LIVECHAT_MESSAGE_RETENTION_SECONDS,
  LIVECHAT_WEBHOOK_REPLAY_TTL_SECONDS,
  claimLiveChatWebhookReplay,
  getLiveChatWebhookReplayIdentity,
  sanitizeLiveChatMessagesForPersistence
} from "../lib/livechat-webhook-security.js";

const results = [];

await test("rejects a declared oversized body before reading the request stream", async () => {
  let iterated = false;
  const req = {
    headers: { "content-length": "100" },
    async *[Symbol.asyncIterator]() {
      iterated = true;
      yield Buffer.from("{}");
    }
  };

  await assert.rejects(() => readJson(req, { maxBytes: 10 }), bodyTooLarge);
  assert.equal(iterated, false);
});

await test("stops accumulating a streamed body when it crosses the limit", async () => {
  let chunksRead = 0;
  const req = {
    headers: {},
    async *[Symbol.asyncIterator]() {
      chunksRead += 1;
      yield Buffer.from("{\"text\":");
      chunksRead += 1;
      yield Buffer.from("\"payload-too-large\"}");
      chunksRead += 1;
      yield Buffer.from("never-read");
    }
  };

  await assert.rejects(() => readJson(req, { maxBytes: 12 }), bodyTooLarge);
  assert.equal(chunksRead, 2);
});

await test("checks an already parsed platform body against the same limit", async () => {
  await assert.rejects(
    () => readJson({ headers: {}, body: { text: "x".repeat(100) } }, { maxBytes: 20 }),
    bodyTooLarge
  );
  assert.deepEqual(
    await readJson({ headers: {}, body: Buffer.from("{\"ok\":true}") }, { maxBytes: 20 }),
    { ok: true }
  );
});

await test("claims a webhook once in KV with an expiring hashed replay key", async () => {
  const stored = new Set();
  const commands = [];
  const request = async (command) => {
    commands.push(command);
    const key = command[1];
    if (stored.has(key)) return { result: null };
    stored.add(key);
    return { result: "OK" };
  };
  const event = { webhook_id: "webhook-sensitive-id" };

  const first = await claimLiveChatWebhookReplay(event, request, {
    now: "2026-08-11T12:00:00.000Z"
  });
  const second = await claimLiveChatWebhookReplay(event, request, {
    now: "2026-08-11T12:00:01.000Z"
  });

  assert.equal(first.claimed, true);
  assert.equal(second.claimed, false);
  assert.equal(first.ttlSeconds, LIVECHAT_WEBHOOK_REPLAY_TTL_SECONDS);
  assert.deepEqual(commands[0].slice(-3), ["EX", String(LIVECHAT_WEBHOOK_REPLAY_TTL_SECONDS), "NX"]);
  assert.equal(commands[0][1].includes("webhook-sensitive-id"), false);
  assert.equal(commands[0][2].includes("webhook-sensitive-id"), false);
});

await test("uses a LiveChat event id when webhook_id is absent", async () => {
  assert.deepEqual(getLiveChatWebhookReplayIdentity({
    payload: { event: { id: "event-123", type: "message" } }
  }), { source: "event_id", id: "event-123" });
});

await test("persists only a bounded redacted chat projection", async () => {
  const messages = Array.from({ length: 25 }, (_, index) => ({
    eventId: `event-${index}`,
    authorType: index === 24 ? "customer" : "unexpected-role",
    createdAt: "2026-08-11T12:00:00.000Z",
    text: index === 24
      ? `Correo cliente@example.com PIN:4312 CLABE 002010077777777771 https://private.example.test/doc ${"x".repeat(900)}`
      : `mensaje ${index}`,
    raw: { secret_key: "must-not-survive" }
  }));

  const persisted = sanitizeLiveChatMessagesForPersistence(messages);
  const serialized = JSON.stringify(persisted);
  assert.equal(persisted.length, 20);
  assert.equal(persisted.at(-1).authorType, "customer");
  assert.ok(persisted.at(-1).text.length <= 800);
  assert.match(persisted.at(-1).text, /\[EMAIL_REDACTED\]/u);
  assert.match(persisted.at(-1).text, /\[CREDENTIAL_REDACTED\]/u);
  assert.match(persisted.at(-1).text, /\[FINANCIAL_NUMBER_REDACTED\]/u);
  assert.match(persisted.at(-1).text, /\[LINK_REDACTED\]/u);
  assert.equal(serialized.includes("cliente@example.com"), false);
  assert.equal(serialized.includes("4312"), false);
  assert.equal(serialized.includes("must-not-survive"), false);
  assert.equal(LIVECHAT_MESSAGE_RETENTION_SECONDS, 60 * 60 * 24 * 30);
});

console.log(JSON.stringify({ ok: true, tests: results.length, results }, null, 2));

async function test(name, fn) {
  await fn();
  results.push({ name, ok: true });
}

function bodyTooLarge(error) {
  return error?.message === "request_body_too_large" && error?.statusCode === 413;
}
