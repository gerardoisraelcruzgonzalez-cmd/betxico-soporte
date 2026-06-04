import { optionalEnv, readJson, sendJson } from "../lib/http.js";
import { writeAuditLog } from "../lib/audit.js";

export default async function handler(req, res) {
  if (req.method === "GET") {
    return handleGetChatMessages(req, res);
  }

  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  try {
    const event = await readJson(req);
    const chatId = extractChatId(event);
    const messages = extractMessages(event);

    if (chatId && messages.length) {
      await appendChatMessages(chatId, messages);
    }

    await writeAuditLog({
      type: "livechat_webhook_received",
      status: "received",
      action: event?.action || "",
      webhookId: event?.webhook_id || "",
      organizationId: event?.organization_id || "",
      chatId
    });

    return sendJson(res, 200, { ok: true, stored: messages.length });
  } catch (error) {
    return sendJson(res, 400, { ok: false, error: error.message || "invalid_webhook" });
  }
}

async function handleGetChatMessages(req, res) {
  try {
    const url = new URL(req.url || "/", "https://support-livechat-app.vercel.app");
    const chatId = String(url.searchParams.get("chatId") || "").trim();
    if (!chatId) {
      return sendJson(res, 400, { ok: false, error: "missing_chat_id" });
    }

    const record = await getChatRecord(chatId).catch(() => null);
    const messages = Array.isArray(record?.messages) ? record.messages : [];
    return sendJson(res, 200, {
      ok: true,
      chatId,
      messages,
      text: messages.map((message) => message.text).filter(Boolean).join("\n")
    });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, { ok: false, error: error.message || "livechat_messages_failed" });
  }
}

async function appendChatMessages(chatId, messages) {
  const existing = await getChatRecord(chatId).catch(() => ({ messages: [] }));
  const merged = [...(existing?.messages || []), ...messages]
    .filter((message) => message.text)
    .slice(-40);

  await kvRequest(["SET", chatKey(chatId), JSON.stringify({
    chatId,
    messages: merged,
    updatedAt: new Date().toISOString()
  })]);
}

async function getChatRecord(chatId) {
  const response = await kvRequest(["GET", chatKey(chatId)]);
  return response?.result ? JSON.parse(response.result) : null;
}

function chatKey(chatId) {
  return `support:livechat:messages:${chatId}`;
}

function extractChatId(event) {
  return String(
    event?.payload?.chat?.id ||
    event?.payload?.chat_id ||
    event?.payload?.chat?.chat_id ||
    event?.chat_id ||
    ""
  ).trim();
}

function extractMessages(event) {
  const payload = event?.payload || {};
  const candidates = [
    payload.event,
    payload.message,
    payload.chat_event,
    payload.thread?.events,
    payload.chat?.thread?.events,
    payload.chat?.threads
  ].flat(Infinity).filter(Boolean);

  const messages = [];
  for (const candidate of candidates) {
    collectMessage(candidate, messages);
  }
  if (!messages.length) {
    collectMessage(payload, messages);
  }

  return dedupeMessages(messages)
    .filter((message) => isCustomerMessage(message.raw))
    .map(({ text, raw }) => ({
      text,
      authorType: authorType(raw),
      createdAt: raw?.created_at || raw?.timestamp || new Date().toISOString()
    }));
}

function collectMessage(value, messages) {
  if (!value || typeof value !== "object") return;
  const text = extractText(value);
  if (text) {
    messages.push({ text, raw: value });
  }
  if (Array.isArray(value.events)) {
    value.events.forEach((event) => collectMessage(event, messages));
  }
  if (Array.isArray(value.messages)) {
    value.messages.forEach((message) => collectMessage(message, messages));
  }
}

function extractText(value) {
  const raw = value?.text || value?.message || value?.content?.text || value?.properties?.text || "";
  return String(raw || "").replace(/\s+/g, " ").trim();
}

function isCustomerMessage(value) {
  const type = authorType(value);
  return !type || ["customer", "visitor"].includes(type);
}

function authorType(value) {
  return String(value?.author?.type || value?.author_type || value?.sender?.type || "").trim().toLowerCase();
}

function dedupeMessages(messages) {
  const seen = new Set();
  return messages.filter((message) => {
    const key = `${message.text}|${message.raw?.created_at || ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
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
