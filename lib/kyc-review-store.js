import crypto from "node:crypto";
import { optionalEnv } from "./http.js";

const REVIEW_KEY = "support:kyc-review-status:v1";
const LOCK_KEY = "support:kyc-review-status-lock:v1";
const LOCK_TTL_MS = 5000;
const LOCK_ATTEMPTS = 20;
export const KYC_REVIEW_MAX_RECORDS = 500;

export function createKycReviewStore(options = {}) {
  const kv = options.kv || createUpstashKycReviewKvAdapter(options);
  assertKvAdapter(kv);
  const now = typeof options.now === "function" ? options.now : () => new Date();
  const randomUUID = typeof options.randomUUID === "function" ? options.randomUUID : () => crypto.randomUUID();
  const maxRecords = clampInt(options.maxRecords, KYC_REVIEW_MAX_RECORDS, 1, KYC_REVIEW_MAX_RECORDS);

  return Object.freeze({ list, save, findLatestByEmail });

  async function list(limit = maxRecords) {
    return (await readReviews()).slice(0, clampInt(limit, maxRecords, 1, maxRecords));
  }

  async function save(payload = {}, account = {}) {
    const review = normalizeReviewInput(payload, account, {
      id: randomUUID(),
      createdAt: currentIso()
    });
    const lockToken = await acquireLock();
    try {
      const reviews = await readReviews();
      const next = [review, ...reviews].slice(0, maxRecords);
      const written = await kv.setIfLockOwned(LOCK_KEY, lockToken, REVIEW_KEY, JSON.stringify(next));
      if (!written) throw storeError("kyc_review_lock_lost", 409);
      return review;
    } finally {
      await kv.compareDelete(LOCK_KEY, lockToken).catch(() => false);
    }
  }

  async function findLatestByEmail(email) {
    const normalizedEmail = normalizeEmail(email);
    if (!normalizedEmail) return null;
    const reviews = await readReviews();
    return reviews.find((review) => review.email === normalizedEmail) || null;
  }

  async function readReviews() {
    const raw = await kv.get(REVIEW_KEY);
    if (!raw) return [];
    let parsed;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      throw storeError("invalid_kyc_review_store", 500);
    }
    return normalizeStoredReviews(parsed).slice(0, maxRecords);
  }

  async function acquireLock() {
    const token = randomUUID();
    for (let attempt = 0; attempt < LOCK_ATTEMPTS; attempt += 1) {
      const acquired = await kv.set(LOCK_KEY, token, {
        onlyIfAbsent: true,
        ttlMilliseconds: LOCK_TTL_MS
      });
      if (acquired) return token;
      await delay(10 * (attempt + 1));
    }
    throw storeError("kyc_review_store_locked", 409);
  }

  function currentIso() {
    const value = now();
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) throw storeError("invalid_kyc_review_clock", 500);
    return date.toISOString();
  }
}

export function normalizeKycReviewEmail(value) {
  return normalizeEmail(value);
}

export function createUpstashKycReviewKvAdapter(options = {}) {
  const url = clean(options.url
    || optionalEnv("KV_REST_API_URL")
    || optionalEnv("UPSTASH_REDIS_REST_URL"));
  const token = clean(options.token
    || optionalEnv("KV_REST_API_TOKEN")
    || optionalEnv("UPSTASH_REDIS_REST_TOKEN"));

  async function command(parts) {
    if (!url || !token) throw storeError("missing_kv_config", 500);
    const response = await fetch(`${url.replace(/\/+$/u, "")}/pipeline`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify([parts])
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw storeError("kv_request_failed", response.status);
    const entry = Array.isArray(body) ? body[0] : body;
    if (entry?.error) throw storeError("kv_command_failed", 502);
    return entry?.result ?? null;
  }

  return Object.freeze({
    get: (key) => command(["GET", key]),
    async set(key, value, setOptions = {}) {
      const parts = ["SET", key, value];
      if (setOptions.onlyIfAbsent) parts.push("NX");
      if (setOptions.ttlMilliseconds) parts.push("PX", String(setOptions.ttlMilliseconds));
      return (await command(parts)) === "OK";
    },
    async compareDelete(key, expectedValue) {
      const script = [
        "if redis.call('get', KEYS[1]) == ARGV[1] then",
        "  return redis.call('del', KEYS[1])",
        "end",
        "return 0"
      ].join("\n");
      return Number(await command(["EVAL", script, "1", key, expectedValue])) > 0;
    },
    async setIfLockOwned(lock, expectedValue, key, value) {
      const script = [
        "if redis.call('get', KEYS[1]) == ARGV[1] then",
        "  redis.call('set', KEYS[2], ARGV[2])",
        "  return 1",
        "end",
        "return 0"
      ].join("\n");
      return Number(await command(["EVAL", script, "2", lock, key, expectedValue, value])) > 0;
    }
  });
}

function normalizeReviewInput(payload, account, generated) {
  const email = normalizeEmail(payload.email);
  if (!email) throw storeError("invalid_customer_email", 400);
  const status = clean(payload.status).toLowerCase();
  if (!new Set(["complete", "incomplete"]).has(status)) {
    throw storeError("invalid_kyc_status", 400);
  }
  return normalizeStoredReview({
    id: generated.id,
    email,
    status,
    customerName: payload.customerName,
    customerId: payload.customerId,
    chatId: payload.chatId,
    agentEmail: account.email,
    agentName: account.displayName || account.email,
    source: "betxico-soporte",
    createdAt: generated.createdAt
  });
}

function normalizeStoredReviews(value) {
  return (Array.isArray(value) ? value : [])
    .map(normalizeStoredReview)
    .filter((review) => review.id && review.email && review.createdAt)
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
}

function normalizeStoredReview(value = {}) {
  const normalizedStatus = clean(value.status).toLowerCase();
  return {
    id: clean(value.id).slice(0, 180),
    email: normalizeEmail(value.email),
    status: new Set(["complete", "incomplete"]).has(normalizedStatus) ? normalizedStatus : "",
    customerName: clean(value.customerName).slice(0, 180),
    customerId: clean(value.customerId).slice(0, 180),
    chatId: clean(value.chatId).slice(0, 180),
    agentEmail: normalizeEmail(value.agentEmail),
    agentName: clean(value.agentName).slice(0, 180),
    source: clean(value.source).slice(0, 80) || "betxico-soporte",
    createdAt: validIso(value.createdAt)
  };
}

function normalizeEmail(value) {
  const email = clean(value).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) ? email : "";
}

function assertKvAdapter(kv) {
  for (const method of ["get", "set", "compareDelete", "setIfLockOwned"]) {
    if (typeof kv?.[method] !== "function") throw storeError("invalid_kyc_review_kv_adapter", 500);
  }
}

function validIso(value) {
  const text = clean(value);
  return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : "";
}

function clean(value) {
  return String(value || "").replace(/\u0000/gu, "").replace(/\s+/gu, " ").trim();
}

function clampInt(value, fallback, min, max) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(max, Math.floor(number))) : fallback;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function storeError(message, statusCode) {
  const error = new Error(message);
  error.code = message;
  error.statusCode = statusCode;
  return error;
}
