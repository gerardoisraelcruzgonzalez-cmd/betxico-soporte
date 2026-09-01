import crypto from "node:crypto";

const DEFAULT_MAX_EVENTS = 120;
const CUSTOMER_ROLES = new Set(["customer", "visitor"]);
const ATTACHMENT_EVENT_TYPES = new Set(["file", "image"]);
const SAFE_ATTACHMENT_ID = /^livechat:[a-f0-9]{24}$/u;
const SAFE_SIMULATOR_ATTACHMENT_ID = /^simulator:[a-f0-9]{24}$/u;

export function extractLiveChatCaseInput(event = {}, options = {}) {
  const chatId = clean(
    options.chatId ||
    event?.payload?.chat?.id ||
    event?.payload?.chat_id ||
    event?.payload?.chat?.chat_id ||
    event?.chat_id
  ).slice(0, 180);
  const users = collectUserIndex(event);
  const events = collectConversationEvents(event, users);
  const customerUser = [...users.values()].find((user) => CUSTOMER_ROLES.has(user.type)) || {};
  const payload = event?.payload || {};
  const authId = firstNumericId([
    payload.auth_id,
    payload.authId,
    payload.customer_id,
    payload.customerId,
    payload.chat?.properties?.auth_id,
    payload.chat?.properties?.authId,
    payload.chat?.properties?.customer_id,
    payload.chat?.properties?.customerId
  ]);

  return {
    chatId,
    customer: {
      liveChatCustomerId: clean(customerUser.id).slice(0, 180),
      authId,
      email: normalizeEmail(customerUser.email || payload.customer?.email || payload.chat?.customer?.email),
      name: clean(customerUser.name || payload.customer?.name || payload.chat?.customer?.name).slice(0, 180)
    },
    events,
    source: {
      type: "livechat_webhook",
      action: clean(event?.action).slice(0, 100),
      webhookId: clean(event?.webhook_id).slice(0, 180),
      organizationId: clean(event?.organization_id).slice(0, 180)
    }
  };
}

export function mergeCaseEvents(existingEvents, incomingEvents, limit = DEFAULT_MAX_EVENTS) {
  const normalized = [
    ...(Array.isArray(existingEvents) ? existingEvents : []),
    ...normalizeIncomingEvents(incomingEvents)
  ];
  const seen = new Set();
  return normalized.filter((event) => {
    const key = event.eventKey || eventKey(event);
    if (seen.has(key)) return false;
    seen.add(key);
    event.eventKey = key;
    return true;
  }).slice(-Math.max(1, Number(limit) || DEFAULT_MAX_EVENTS));
}

export function isCustomerCaseRole(role) {
  return CUSTOMER_ROLES.has(normalizeRole(role));
}

function collectConversationEvents(event, users) {
  const payload = event?.payload || {};
  const candidates = [
    payload.event,
    payload.message,
    payload.chat_event,
    payload.thread,
    payload.thread?.events,
    payload.chat?.thread,
    payload.chat?.thread?.events,
    payload.chat?.threads
  ].flat(Infinity).filter(Boolean);
  const collected = [];
  for (const candidate of candidates) collectMessages(candidate, collected, users);
  if (!collected.length) collectMessages(payload, collected, users);
  return mergeCaseEvents([], collected);
}

function collectMessages(value, events, users) {
  if (!value || typeof value !== "object") return;
  const text = extractText(value);
  const eventId = clean(value?.id || value?.event_id).slice(0, 180);
  const createdAt = validIso(value?.created_at || value?.timestamp);
  const attachments = extractAttachments(value, { eventId, createdAt });
  if (text || attachments.length) {
    events.push({
      eventId,
      role: resolveAuthorType(value, users),
      text,
      createdAt: createdAt || new Date().toISOString(),
      ...(attachments.length ? { attachments } : {})
    });
  }
  for (const key of ["events", "messages", "threads"]) {
    if (Array.isArray(value[key])) {
      value[key].forEach((item) => collectMessages(item, events, users));
    }
  }
  if (value.thread) collectMessages(value.thread, events, users);
}

function collectUserIndex(event) {
  const users = new Map();
  collectUsers(event?.payload || event, users);
  return users;
}

function collectUsers(value, users) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value.users)) {
    for (const user of value.users) {
      const id = clean(user?.id);
      if (!id) continue;
      users.set(id, {
        id,
        type: normalizeRole(user?.type),
        email: normalizeEmail(user?.email || user?.email_address),
        name: clean(user?.name || user?.display_name)
      });
    }
  }
  if (value.customer && typeof value.customer === "object") {
    const customer = value.customer;
    const id = clean(customer?.id) || "customer";
    users.set(id, {
      id,
      type: "customer",
      email: normalizeEmail(customer?.email || customer?.email_address),
      name: clean(customer?.name || customer?.display_name)
    });
  }
  if (value.chat) collectUsers(value.chat, users);
  if (value.thread) collectUsers(value.thread, users);
  if (Array.isArray(value.threads)) value.threads.forEach((thread) => collectUsers(thread, users));
}

function resolveAuthorType(value, users) {
  const direct = normalizeRole(value?.author?.type || value?.author_type || value?.sender?.type);
  if (direct !== "unknown") return direct;
  const authorId = clean(value?.author_id || value?.author?.id || value?.sender?.id);
  return authorId ? users.get(authorId)?.type || "unknown" : "unknown";
}

function normalizeIncomingEvents(events) {
  if (!Array.isArray(events)) return [];
  return events.map((event) => {
    const eventId = clean(event?.eventId).slice(0, 180);
    const createdAt = validIso(event?.createdAt) || new Date().toISOString();
    const attachments = normalizeAttachments(event?.attachments, { eventId, createdAt });
    const normalized = {
      eventId,
      role: normalizeRole(event?.role || event?.authorType),
      text: sanitizeMessageText(event?.text).slice(0, 2000),
      createdAt,
      ...(attachments.length ? { attachments } : {})
    };
    normalized.eventKey = eventKey(normalized);
    return normalized;
  }).filter((event) => event.text || event.attachments?.length);
}

function eventKey(event) {
  if (event?.attachments?.length) {
    const attachmentIds = event.attachments.map((attachment) => attachment.id).sort().join("|");
    return `attachment:${digest(attachmentIds)}`;
  }
  if (event?.eventId) return `id:${event.eventId}`;
  return `hash:${digest(`${event?.role || ""}|${event?.createdAt || ""}|${event?.text || ""}`)}`;
}

function extractAttachments(value, context) {
  const explicitType = clean(value?.type || value?.event_type).toLowerCase();
  if (!ATTACHMENT_EVENT_TYPES.has(explicitType)) return [];
  return normalizeAttachments([value], context);
}

function normalizeAttachments(attachments, context = {}) {
  if (!Array.isArray(attachments)) return [];
  const seen = new Set();
  const normalized = [];

  for (const attachment of attachments) {
    if (!attachment || typeof attachment !== "object") continue;
    const explicitType = clean(attachment?.type || attachment?.event_type || attachment?.kind).toLowerCase();
    if (!ATTACHMENT_EVENT_TYPES.has(explicitType)) continue;

    const normalizedId = clean(attachment?.id);
    const normalizedSource = clean(attachment?.source).toLowerCase();
    const isLiveChatAttachment = SAFE_ATTACHMENT_ID.test(normalizedId) && normalizedSource === "livechat";
    const isSimulatorAttachment = SAFE_SIMULATOR_ATTACHMENT_ID.test(normalizedId)
      && normalizedSource === "support_simulator";
    const isAlreadyNormalized = isLiveChatAttachment || isSimulatorAttachment;

    const mimeType = sanitizeMimeType(
      attachment?.content_type ||
      attachment?.mime_type ||
      attachment?.mimeType ||
      attachment?.file?.content_type ||
      attachment?.file?.mime_type ||
      attachment?.content?.content_type ||
      attachment?.content?.mime_type
    );
    const kind = explicitType === "image" || mimeType.startsWith("image/") ? "image" : "file";
    const name = sanitizeFilename(
      attachment?.name ||
      attachment?.filename ||
      attachment?.file?.name ||
      attachment?.file?.filename ||
      attachment?.content?.name ||
      attachment?.content?.filename
    );
    const size = sanitizeSize(
      attachment?.size ??
      attachment?.file_size ??
      attachment?.file?.size ??
      attachment?.content?.size
    );
    const receivedAt = validIso(
      attachment?.receivedAt ||
      attachment?.received_at ||
      attachment?.created_at ||
      attachment?.timestamp ||
      (isAlreadyNormalized ? "" : context.createdAt)
    );
    const providerId = clean(
      attachment?.file_id ||
      attachment?.attachment_id ||
      attachment?.file?.id ||
      attachment?.content?.id
    ).slice(0, 180);
    const eventId = clean(context.eventId || attachment?.eventId).slice(0, 180);
    const idSeed = providerId
      ? `provider:${providerId}`
      : eventId
        ? `event:${eventId}`
        : `metadata:${kind}|${name}|${mimeType}|${size ?? "unknown"}`;
    const id = isAlreadyNormalized
      ? normalizedId
      : `livechat:${digest(idSeed)}`;

    if (seen.has(id)) continue;
    seen.add(id);
    normalized.push({
      id,
      kind,
      name,
      mimeType,
      size,
      source: isSimulatorAttachment ? "support_simulator" : "livechat",
      ...(receivedAt ? { receivedAt } : {})
    });
  }

  return normalized;
}

function sanitizeFilename(value) {
  const leaf = clean(value).normalize("NFKC").split(/[\\/]/u).at(-1) || "attachment";
  const sanitized = leaf
    .replace(/[\u0000-\u001f\u007f]/gu, "")
    .replace(/[^\p{L}\p{N}._() -]+/gu, "_")
    .replace(/\s+/gu, " ")
    .replace(/^\.+/u, "")
    .trim()
    .slice(0, 180);
  return sanitized || "attachment";
}

function sanitizeMimeType(value) {
  const mimeType = clean(value).toLowerCase().split(";", 1)[0];
  return /^[a-z0-9][a-z0-9!#$&^_.+-]*\/[a-z0-9][a-z0-9!#$&^_.+-]*$/u.test(mimeType)
    ? mimeType.slice(0, 120)
    : "application/octet-stream";
}

function sanitizeSize(value) {
  if (value === "" || value === null || value === undefined) return null;
  const size = Number(value);
  return Number.isSafeInteger(size) && size >= 0 ? size : null;
}

function digest(value) {
  return crypto.createHash("sha256")
    .update(String(value || ""))
    .digest("hex")
    .slice(0, 24);
}

function sanitizeMessageText(value) {
  return clean(value)
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/giu, "[EMAIL_REDACTED]")
    .replace(/\b\d{18}\b/gu, "[CLABE_REDACTED]")
    .replace(/\b(?:password|contrasena|contraseña|token|nip|pin)\s*[:=]\s*\S+/giu, "[CREDENTIAL_REDACTED]");
}

function extractText(value) {
  const raw = value?.text || value?.message || value?.content?.text || value?.properties?.text || "";
  return clean(raw);
}

function normalizeRole(value) {
  const role = clean(value).toLowerCase();
  if (["customer", "visitor"].includes(role)) return role;
  if (["agent", "bot", "system"].includes(role)) return role;
  return "unknown";
}

function normalizeEmail(value) {
  const email = clean(value).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email.slice(0, 254) : "";
}

function firstNumericId(values) {
  for (const value of values || []) {
    const candidate = clean(value);
    if (/^\d{3,20}$/.test(candidate)) return candidate;
  }
  return "";
}

function validIso(value) {
  const cleanValue = clean(value);
  return cleanValue && Number.isFinite(Date.parse(cleanValue)) ? new Date(cleanValue).toISOString() : "";
}

function clean(value) {
  return String(value || "").replace(/\u0000/gu, "").replace(/\s+/gu, " ").trim();
}
