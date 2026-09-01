import { optionalEnv } from "./http.js";

const AI_RUNTIME_KEY = "support:ai-runtime-enabled:v1";

// This is deliberately separate from the editable IA instructions. A stale
// remote config cannot turn provider calls back on after a deployment.
export async function getAiRuntimeState() {
  const stored = await kvGet(AI_RUNTIME_KEY).catch(() => null);
  return {
    enabled: stored?.enabled === true,
    updatedAt: validIso(stored?.updatedAt),
    updatedBy: normalizeEmail(stored?.updatedBy)
  };
}

export async function setAiRuntimeEnabled(enabled, account = {}) {
  const state = {
    enabled: enabled === true,
    updatedAt: new Date().toISOString(),
    updatedBy: normalizeEmail(account.email)
  };
  if (!state.updatedBy) {
    const error = new Error("invalid_ai_runtime_account");
    error.statusCode = 400;
    throw error;
  }
  await kvSet(AI_RUNTIME_KEY, state);
  return state;
}

async function kvGet(key) {
  const response = await kvRequest(["GET", key]);
  return response?.result ? JSON.parse(response.result) : null;
}

async function kvSet(key, value) {
  await kvRequest(["SET", key, JSON.stringify(value)]);
}

async function kvRequest(command) {
  const url = optionalEnv("KV_REST_API_URL") || optionalEnv("UPSTASH_REDIS_REST_URL");
  const token = optionalEnv("KV_REST_API_TOKEN") || optionalEnv("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) {
    const error = new Error("missing_kv_config");
    error.statusCode = 500;
    throw error;
  }
  const response = await fetch(`${url.replace(/\/+$/u, "")}/pipeline`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify([command])
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error("kv_request_failed");
    error.statusCode = response.status;
    throw error;
  }
  return Array.isArray(data) ? data[0] : data;
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) ? email : "";
}

function validIso(value) {
  const text = String(value || "").trim();
  return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : "";
}
