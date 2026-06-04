import crypto from "node:crypto";
import { optionalEnv } from "./http.js";

const KV_KEY = "support:slack-user-tokens";

export async function getSlackUserToken(email) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return "";
  const envelope = await loadTokenEnvelope();
  const entry = envelope.users.find((item) => item.email === normalizedEmail);
  return entry?.accessTokenEncrypted ? decryptSecret(entry.accessTokenEncrypted) : "";
}

export async function getSlackUserTokenStatus(email) {
  const normalizedEmail = normalizeEmail(email);
  const envelope = await loadTokenEnvelope();
  const entry = envelope.users.find((item) => item.email === normalizedEmail);
  return {
    connected: Boolean(entry?.accessTokenEncrypted),
    slackUserId: entry?.slackUserId || "",
    teamId: entry?.teamId || "",
    updatedAt: entry?.updatedAt || ""
  };
}

export async function saveSlackUserToken({ email, accessToken, slackUserId = "", teamId = "", scope = "" }) {
  const normalizedEmail = normalizeEmail(email);
  const token = String(accessToken || "").trim();
  if (!normalizedEmail || !token) {
    const error = new Error("invalid_slack_user_token");
    error.statusCode = 400;
    throw error;
  }

  const envelope = await loadTokenEnvelope();
  const users = envelope.users.filter((entry) => entry.email !== normalizedEmail);
  users.push({
    email: normalizedEmail,
    accessTokenEncrypted: encryptSecret(token),
    slackUserId: String(slackUserId || "").trim(),
    teamId: String(teamId || "").trim(),
    scope: String(scope || "").trim(),
    updatedAt: new Date().toISOString()
  });
  await saveTokenEnvelope({ users });
}

async function loadTokenEnvelope() {
  const response = await kvRequest(["GET", KV_KEY]);
  if (!response?.result) return { users: [] };
  try {
    const parsed = JSON.parse(response.result);
    return {
      users: Array.isArray(parsed.users)
        ? parsed.users.map(normalizeEntry).filter((entry) => entry.email && entry.accessTokenEncrypted)
        : []
    };
  } catch {
    return { users: [] };
  }
}

async function saveTokenEnvelope(envelope) {
  await kvRequest(["SET", KV_KEY, JSON.stringify({
    users: envelope.users.map(normalizeEntry).filter((entry) => entry.email && entry.accessTokenEncrypted)
  })]);
}

function normalizeEntry(entry = {}) {
  return {
    email: normalizeEmail(entry.email),
    accessTokenEncrypted: String(entry.accessTokenEncrypted || "").trim(),
    slackUserId: String(entry.slackUserId || "").trim(),
    teamId: String(entry.teamId || "").trim(),
    scope: String(entry.scope || "").trim(),
    updatedAt: String(entry.updatedAt || "").trim()
  };
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

function encryptSecret(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decryptSecret(value) {
  const [ivRaw, tagRaw, encryptedRaw] = String(value || "").split(".");
  if (!ivRaw || !tagRaw || !encryptedRaw) return "";
  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
}

function encryptionKey() {
  const secret = optionalEnv("SUPPORT_ENCRYPTION_KEY");
  if (!secret) {
    const error = new Error("missing_encryption_key");
    error.statusCode = 500;
    throw error;
  }
  return crypto.createHash("sha256").update(secret).digest();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}
