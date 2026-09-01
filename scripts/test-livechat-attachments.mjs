import assert from "node:assert/strict";
import {
  extractLiveChatCaseInput,
  mergeCaseEvents
} from "../lib/livechat-case-parser.js";
import { evolveSupportCase, publicCaseSummary } from "../lib/case-orchestrator.js";

const RECEIVED_AT = "2026-08-11T18:30:00.000Z";
const results = [];

test("stores only minimal safe metadata for LiveChat file and image events", () => {
  const input = extractLiveChatCaseInput({
    action: "incoming_event",
    payload: {
      chat: {
        id: "chat-attachments",
        users: [{ id: "customer-1", type: "customer" }],
        thread: {
          events: [
            {
              id: "event-file",
              type: "file",
              author_id: "customer-1",
              name: "../../Estado de cuenta?.PDF",
              content_type: "application/pdf; charset=binary",
              size: 24891,
              created_at: RECEIVED_AT,
              url: "https://files.example.test/private/document.pdf?token=secret",
              thumbnail_url: "https://files.example.test/private/thumb.png",
              dataBase64: "c2VjcmV0LWJ5dGVz",
              bytes: [115, 101, 99, 114, 101, 116],
              ocrText: "contenido extraido que no debe persistirse"
            },
            {
              id: "event-image",
              type: "image",
              author_id: "customer-1",
              file_id: "image-provider-77",
              filename: "selfie.png",
              mime_type: "image/png",
              file_size: "1200",
              timestamp: RECEIVED_AT,
              url: "https://files.example.test/private/selfie.png"
            }
          ]
        }
      }
    }
  });

  assert.equal(input.events.length, 2);
  assert.deepEqual(input.events.map((event) => event.role), ["customer", "customer"]);
  assert.deepEqual(input.events.map((event) => event.attachments[0].kind), ["file", "image"]);
  assert.deepEqual(input.events.map((event) => event.attachments[0].name), ["Estado de cuenta_.PDF", "selfie.png"]);
  assert.deepEqual(input.events.map((event) => event.attachments[0].mimeType), ["application/pdf", "image/png"]);
  assert.deepEqual(input.events.map((event) => event.attachments[0].size), [24891, 1200]);
  assert.ok(input.events.every((event) => event.attachments[0].source === "livechat"));
  assert.ok(input.events.every((event) => event.attachments[0].receivedAt === RECEIVED_AT));
  assert.ok(input.events.every((event) => /^livechat:[a-f0-9]{24}$/u.test(event.attachments[0].id)));

  const serialized = JSON.stringify(input.events);
  for (const forbidden of ["https://", "token=secret", "dataBase64", "c2VjcmV0", "bytes", "ocrText", "contenido extraido"]) {
    assert.equal(serialized.includes(forbidden), false, `must not retain ${forbidden}`);
  }
});

test("classifies a file event with an image MIME as image evidence", () => {
  const input = extractSingleEvent({
    id: "event-image-as-file",
    type: "file",
    name: "capture.JPG",
    content_type: "image/jpeg",
    size: 900,
    created_at: RECEIVED_AT
  });

  assert.equal(input.events[0].attachments[0].kind, "image");
});

test("deduplicates the same attachment stably without depending on its URL", () => {
  const first = extractSingleEvent({
    id: "event-envelope-a",
    type: "file",
    file_id: "stable-provider-id",
    name: "evidence.pdf",
    content_type: "application/pdf",
    size: 500,
    created_at: RECEIVED_AT,
    url: "https://files.example.test/first"
  }).events;
  const second = extractSingleEvent({
    id: "event-envelope-b",
    type: "file",
    file_id: "stable-provider-id",
    name: "evidence.pdf",
    content_type: "application/pdf",
    size: 500,
    created_at: RECEIVED_AT,
    url: "https://files.example.test/rotated-url"
  }).events;
  const merged = mergeCaseEvents(first, second);

  assert.equal(first[0].attachments[0].id, second[0].attachments[0].id);
  assert.equal(merged.length, 1);
});

test("uses safe metadata for stable deduplication when provider IDs are absent", () => {
  const first = extractSingleEvent({
    type: "file",
    name: "receipt.pdf",
    content_type: "application/pdf",
    size: 1500,
    url: "https://files.example.test/one"
  }).events;
  const second = extractSingleEvent({
    type: "file",
    name: "receipt.pdf",
    content_type: "application/pdf",
    size: 1500,
    url: "https://files.example.test/two"
  }).events;

  assert.equal(first[0].attachments[0].id, second[0].attachments[0].id);
  assert.equal(mergeCaseEvents(first, second).length, 1);
  assert.equal("receivedAt" in first[0].attachments[0], false);
});

test("does not treat textual attachment mentions as received files", () => {
  const input = extractSingleEvent({
    id: "message-only",
    type: "message",
    text: "Adjunto captura y foto de mi comprobante.",
    created_at: RECEIVED_AT
  });

  assert.equal(input.events.length, 1);
  assert.equal(input.events[0].text, "Adjunto captura y foto de mi comprobante.");
  assert.equal("attachments" in input.events[0], false);
});

test("preserves existing message parsing and rejects attachment-shaped message fields", () => {
  const input = extractSingleEvent({
    id: "normal-message",
    type: "message",
    text: "Necesito ayuda con mi retiro.",
    name: "should-not-be-a-file.pdf",
    content_type: "application/pdf",
    size: 100,
    url: "https://files.example.test/not-an-attachment",
    created_at: RECEIVED_AT
  });

  assert.equal(input.events.length, 1);
  assert.equal(input.events[0].text, "Necesito ayuda con mi retiro.");
  assert.equal("attachments" in input.events[0], false);
});

test("keeps received evidence separate from human review", () => {
  const input = extractSingleEvent({
    id: "event-evidence",
    type: "file",
    filename: "comprobante.pdf",
    content_type: "application/pdf",
    size: 1024,
    created_at: RECEIVED_AT
  });
  const record = evolveSupportCase(null, { ...input, now: RECEIVED_AT });
  const summary = publicCaseSummary(record);

  assert.equal(record.evidence.receivedCount, 1);
  assert.equal(record.evidence.reviewedCount, 0);
  assert.equal(record.evidence.attachments[0].reviewStatus, "received");
  assert.deepEqual(summary.evidence, {
    receivedCount: 1,
    reviewedCount: 0,
    pendingReviewCount: 1,
    kinds: ["file"]
  });
});

console.log(JSON.stringify({ ok: true, tests: results.length, results }, null, 2));

function extractSingleEvent(event) {
  return extractLiveChatCaseInput({
    action: "incoming_event",
    payload: {
      chat: {
        id: "chat-single-event",
        users: [{ id: "customer-1", type: "customer" }],
        thread: {
          events: [{ author_id: "customer-1", ...event }]
        }
      }
    }
  });
}

function test(name, fn) {
  fn();
  results.push({ name, ok: true });
}
