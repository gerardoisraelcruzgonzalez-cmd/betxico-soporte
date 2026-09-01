import crypto from "node:crypto";
import { optionalEnv } from "./http.js";

const WINDOW_SECONDS = 15 * 60;
const MAX_FAILURES = 5;

export async function assertLoginAllowed(req, email, options = {}) {
  const request = options.request || kvRequest;
  const key = loginAttemptKey(req, email);
  const response = await request(["GET", key]);
  const failures = Number(response?.result || 0);
  if (failures >= MAX_FAILURES) {
    const error = new Error("login_rate_limited");
    error.statusCode = 429;
    error.details = { retryAfterSeconds: WINDOW_SECONDS };
    throw error;
  }
  return { key, failures };
}

export async function recordLoginFailure(req, email, options = {}) {
  const request = options.request || kvRequest;
  const key = loginAttemptKey(req, email);
  const response = await request(["INCR", key]);
  const failures = Number(response?.result || 1);
  if (failures === 1) await request(["EXPIRE", key, String(WINDOW_SECONDS)]);
  return { key, failures, blocked: failures >= MAX_FAILURES };
}

export async function clearLoginFailures(req, email, options = {}) {
  const request = options.request || kvRequest;
  await request(["DEL", loginAttemptKey(req, email)]);
}

export function loginAttemptKey(req, email) {
  const cleanEmail = String(email || "").trim().toLowerCase();
  const forwarded = String(req?.headers?.["x-forwarded-for"] || "").split(",")[0].trim();
  const ip = forwarded || String(req?.socket?.remoteAddress || req?.headers?.["x-real-ip"] || "unknown").trim();
  const fingerprint = crypto.createHash("sha256").update(`${cleanEmail}|${ip}`).digest("hex").slice(0, 32);
  return `support:login-attempt:v1:${fingerprint}`;
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
  const body = await response.json().catch(() => []);
  if (!response.ok || body?.[0]?.error) {
    const error = new Error(body?.[0]?.error || `kv_http_${response.status}`);
    error.statusCode = response.status || 500;
    throw error;
  }
  return body[0];
}
