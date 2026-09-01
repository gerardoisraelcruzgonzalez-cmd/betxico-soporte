import assert from "node:assert/strict";
import { createKycReviewStore } from "../lib/kyc-review-store.js";

const values = new Map();
const kv = {
  async get(key) {
    return values.get(key) || null;
  },
  async set(key, value, options = {}) {
    if (options.onlyIfAbsent && values.has(key)) return false;
    values.set(key, value);
    return true;
  },
  async compareDelete(key, expectedValue) {
    if (values.get(key) !== expectedValue) return false;
    values.delete(key);
    return true;
  },
  async setIfLockOwned(lock, expectedValue, key, value) {
    if (values.get(lock) !== expectedValue) return false;
    values.set(key, value);
    return true;
  }
};

const times = [
  new Date("2026-08-11T18:00:00.000Z"),
  new Date("2026-08-11T18:05:00.000Z"),
  new Date("2026-08-11T18:10:00.000Z")
];
let uuid = 0;
let clock = 0;
const store = createKycReviewStore({
  kv,
  now: () => times[Math.min(clock++, times.length - 1)],
  randomUUID: () => `review-${++uuid}`
});
const results = [];

await test("saves a human KYC review with normalized identity", async () => {
  const review = await store.save({
    email: " Cliente@Example.COM ",
    status: "complete",
    customerName: "Cliente",
    customerId: "123",
    chatId: "chat-1"
  }, {
    email: "Agente@Betxico.mx",
    displayName: "Agente"
  });
  assert.equal(review.email, "cliente@example.com");
  assert.equal(review.agentEmail, "agente@betxico.mx");
  assert.equal(review.status, "complete");
});

await test("returns only the latest exact-email review", async () => {
  await store.save({ email: "otro@example.com", status: "incomplete" }, { email: "agente@betxico.mx" });
  await store.save({ email: "cliente@example.com", status: "incomplete" }, { email: "agente@betxico.mx" });
  assert.equal((await store.findLatestByEmail("CLIENTE@example.com")).status, "incomplete");
  assert.equal(await store.findLatestByEmail("client@example.com"), null);
});

await test("rejects invalid emails and statuses", async () => {
  await assert.rejects(
    () => store.save({ email: "invalid", status: "complete" }, { email: "agente@betxico.mx" }),
    /invalid_customer_email/
  );
  await assert.rejects(
    () => store.save({ email: "cliente@example.com", status: "approved" }, { email: "agente@betxico.mx" }),
    /invalid_kyc_status/
  );
});

console.log(JSON.stringify({ ok: true, tests: results.length, results }, null, 2));

async function test(name, fn) {
  await fn();
  results.push(name);
}
