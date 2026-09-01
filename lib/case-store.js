import crypto from "node:crypto";
import { optionalEnv } from "./http.js";

const CASE_KEY_PREFIX = "support:case:v1:";
const CASE_LOCK_PREFIX = "support:case-lock:v1:";
const SIMULATOR_CASE_KEY_PREFIX = "support:simulator-case:v1:";
const SIMULATOR_CASE_LOCK_PREFIX = "support:simulator-case-lock:v1:";
const CASE_RETENTION_SECONDS = 60 * 60 * 24 * 180;
const SIMULATOR_CASE_RETENTION_SECONDS = 60 * 60 * 24;
const LOCK_TTL_MS = 5000;
const LOCK_ATTEMPTS = 6;

export async function getSupportCase(chatId) {
  return getCase(chatId, CASE_KEY_PREFIX);
}

export async function getSupportSimulatorCase(chatId) {
  return getCase(chatId, SIMULATOR_CASE_KEY_PREFIX);
}

async function getCase(chatId, keyPrefix) {
  const cleanChatId = normalizeChatId(chatId);
  if (!cleanChatId) return null;

  const response = await kvRequest(["GET", caseKey(cleanChatId, keyPrefix)]);
  if (!response?.result) return null;

  try {
    return JSON.parse(response.result);
  } catch {
    const error = new Error("invalid_support_case_record");
    error.statusCode = 500;
    throw error;
  }
}

export async function updateSupportCase(chatId, updater) {
  return updateCase(chatId, updater, {
    keyPrefix: CASE_KEY_PREFIX,
    lockPrefix: CASE_LOCK_PREFIX,
    retentionSeconds: CASE_RETENTION_SECONDS
  });
}

export async function updateSupportSimulatorCase(chatId, updater) {
  return updateCase(chatId, updater, {
    keyPrefix: SIMULATOR_CASE_KEY_PREFIX,
    lockPrefix: SIMULATOR_CASE_LOCK_PREFIX,
    retentionSeconds: SIMULATOR_CASE_RETENTION_SECONDS
  });
}

async function updateCase(chatId, updater, options) {
  const cleanChatId = normalizeChatId(chatId);
  if (!cleanChatId) {
    const error = new Error("missing_chat_id");
    error.statusCode = 400;
    throw error;
  }
  if (typeof updater !== "function") {
    const error = new Error("invalid_case_updater");
    error.statusCode = 500;
    throw error;
  }

  const lockToken = await acquireCaseLock(cleanChatId, options.lockPrefix);
  try {
    const existing = await getCase(cleanChatId, options.keyPrefix);
    const updated = await updater(existing);
    if (!updated || typeof updated !== "object") {
      const error = new Error("invalid_support_case_update");
      error.statusCode = 500;
      throw error;
    }

    await kvRequest([
      "SET",
      caseKey(cleanChatId, options.keyPrefix),
      JSON.stringify(updated),
      "EX",
      String(options.retentionSeconds)
    ]);
    return updated;
  } finally {
    await releaseCaseLock(cleanChatId, lockToken, options.lockPrefix).catch(() => null);
  }
}

export function supportCaseKey(chatId) {
  const cleanChatId = normalizeChatId(chatId);
  return cleanChatId ? caseKey(cleanChatId, CASE_KEY_PREFIX) : "";
}

async function acquireCaseLock(chatId, lockPrefix) {
  const token = crypto.randomUUID();
  for (let attempt = 0; attempt < LOCK_ATTEMPTS; attempt += 1) {
    const response = await kvRequest([
      "SET",
      lockKey(chatId, lockPrefix),
      token,
      "NX",
      "PX",
      String(LOCK_TTL_MS)
    ]);
    if (response?.result === "OK") return token;
    await delay(25 * (attempt + 1));
  }

  const error = new Error("support_case_locked");
  error.statusCode = 409;
  throw error;
}

async function releaseCaseLock(chatId, token, lockPrefix) {
  const script = [
    "if redis.call('get', KEYS[1]) == ARGV[1] then",
    "  return redis.call('del', KEYS[1])",
    "end",
    "return 0"
  ].join("\n");
  await kvRequest(["EVAL", script, "1", lockKey(chatId, lockPrefix), token]);
}

function caseKey(chatId, prefix) {
  return `${prefix}${chatId}`;
}

function lockKey(chatId, prefix) {
  return `${prefix}${chatId}`;
}

function normalizeChatId(value) {
  return String(value || "").trim().slice(0, 180);
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function kvRequest(command) {
  const url = optionalEnv("KV_REST_API_URL") || optionalEnv("UPSTASH_REDIS_REST_URL");
  const token = optionalEnv("KV_REST_API_TOKEN") || optionalEnv("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) {
    const error = new Error("missing_kv_config");
    error.statusCode = 500;
    throw error;
  }

  const response = await fetch(`${url.replace(/\/+$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify([command])
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error("kv_request_failed");
    error.statusCode = response.status;
    error.details = data;
    throw error;
  }
  return Array.isArray(data) ? data[0] : data;
}
