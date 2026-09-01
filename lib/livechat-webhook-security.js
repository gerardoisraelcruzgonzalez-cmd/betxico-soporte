import crypto from "node:crypto";

export const LIVECHAT_WEBHOOK_MAX_BODY_BYTES = 512 * 1024;
export const LIVECHAT_WEBHOOK_REPLAY_TTL_SECONDS = 60 * 60 * 24 * 7;
export const LIVECHAT_MESSAGE_RETENTION_SECONDS = 60 * 60 * 24 * 30;

const MAX_PERSISTED_MESSAGES = 20;
const MAX_PERSISTED_MESSAGE_CHARS = 800;

export function requireLiveChatWebhookConfiguration(env = process.env) {
  const secret = normalize(env?.LIVECHAT_WEBHOOK_SECRET);
  if (!secret) {
    throwSecurityError("livechat_webhook_secret_not_configured", 503);
  }

  return {
    secret,
    organizationId: normalize(env?.LIVECHAT_ORGANIZATION_ID)
  };
}

export function verifyLiveChatWebhook(event, env = process.env) {
  const config = requireLiveChatWebhookConfiguration(env);
  const receivedSecret = normalize(event?.secret_key);

  if (!receivedSecret || !constantTimeEqual(receivedSecret, config.secret)) {
    throwSecurityError("invalid_livechat_webhook_secret", 401);
  }

  if (config.organizationId) {
    const receivedOrganizationId = normalize(event?.organization_id);
    if (!receivedOrganizationId || !constantTimeEqual(receivedOrganizationId, config.organizationId)) {
      throwSecurityError("invalid_livechat_organization", 403);
    }
  }

  return true;
}

export async function claimLiveChatWebhookReplay(event, request, options = {}) {
  if (typeof request !== "function") {
    throwSecurityError("livechat_webhook_replay_store_unavailable", 503);
  }

  const identity = getLiveChatWebhookReplayIdentity(event);
  const ttlSeconds = normalizeReplayTtl(options.ttlSeconds);
  const key = `support:livechat:webhook-replay:v1:${digest(`${identity.source}:${identity.id}`)}`;
  const claimedAt = validIso(options.now) || new Date().toISOString();
  const response = await request([
    "SET",
    key,
    JSON.stringify({ source: identity.source, claimedAt }),
    "EX",
    String(ttlSeconds),
    "NX"
  ]);

  return {
    claimed: response?.result === "OK",
    source: identity.source,
    key,
    ttlSeconds
  };
}

export function getLiveChatWebhookReplayIdentity(event) {
  const webhookId = cleanReplayId(event?.webhook_id);
  if (webhookId) return { source: "webhook_id", id: webhookId };

  const eventId = findEventId(event);
  if (eventId) return { source: "event_id", id: eventId };

  throwSecurityError("livechat_webhook_replay_id_missing", 400);
}

export function sanitizeLiveChatMessagesForPersistence(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .slice(-MAX_PERSISTED_MESSAGES)
    .map((message) => ({
      eventId: cleanIdentifier(message?.eventId),
      text: redactPersistedText(message?.text),
      authorType: normalizeAuthorType(message?.authorType),
      createdAt: validIso(message?.createdAt)
    }))
    .filter((message) => message.text);
}

function constantTimeEqual(received, expected) {
  const receivedDigest = crypto.createHash("sha256").update(received, "utf8").digest();
  const expectedDigest = crypto.createHash("sha256").update(expected, "utf8").digest();
  return crypto.timingSafeEqual(receivedDigest, expectedDigest);
}

function findEventId(event) {
  const payload = event?.payload || {};
  const candidates = [
    payload.event,
    payload.message,
    payload.chat_event,
    payload.thread?.events,
    payload.chat?.thread?.events,
    payload.chat?.threads
  ].flat(Infinity).filter(Boolean);

  for (const candidate of candidates.slice(0, 200)) {
    const id = cleanReplayId(candidate?.event_id || candidate?.id);
    if (id) return id;
    if (Array.isArray(candidate?.events)) {
      const nested = candidate.events
        .slice(0, 200)
        .map((item) => cleanReplayId(item?.event_id || item?.id))
        .find(Boolean);
      if (nested) return nested;
    }
  }
  return "";
}

function redactPersistedText(value) {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim()
    .replace(/https?:\/\/\S+/giu, "[LINK_REDACTED]")
    .replace(/\b[^\s@]+@[^\s@]+\.[^\s@]+\b/giu, "[EMAIL_REDACTED]")
    .replace(/\b(?:password|contrasena|contraseña|token|nip|pin|secret|authorization)\s*[:=]?\s*\S+/giu, "[CREDENTIAL_REDACTED]")
    .replace(/(?<!\d)(?:\d[ -]?){12,19}(?!\d)/gu, "[FINANCIAL_NUMBER_REDACTED]")
    .replace(/(?<!\d)(?:\+?52[ -]?)?\d{10}(?!\d)/gu, "[PHONE_REDACTED]")
    .slice(0, MAX_PERSISTED_MESSAGE_CHARS);
}

function normalizeAuthorType(value) {
  const type = normalize(value).toLowerCase();
  return ["customer", "visitor", "agent", "system", "bot"].includes(type) ? type : "unknown";
}

function cleanIdentifier(value) {
  return normalize(value).replace(/[^A-Za-z0-9_.:-]/gu, "").slice(0, 180);
}

function cleanReplayId(value) {
  return normalize(value).replace(/[\u0000-\u001F\u007F]/gu, "").slice(0, 512);
}

function normalizeReplayTtl(value) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return LIVECHAT_WEBHOOK_REPLAY_TTL_SECONDS;
  return Math.max(60, Math.min(Math.floor(parsed), 60 * 60 * 24 * 30));
}

function validIso(value) {
  const text = normalize(value);
  return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : "";
}

function digest(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function normalize(value) {
  return String(value || "").trim();
}

function throwSecurityError(code, statusCode) {
  const error = new Error(code);
  error.statusCode = statusCode;
  throw error;
}
