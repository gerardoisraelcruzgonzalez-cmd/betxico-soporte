import { optionalEnv } from "./http.js";

const LIVECHAT_API_BASE = "https://api.livechatinc.com/v3.6/agent/action";

export async function sendLiveChatMessage({ chatId, text, visibility = "all" }) {
  const cleanChatId = String(chatId || "").trim();
  const cleanText = String(text || "").trim();
  if (!cleanChatId) {
    const error = new Error("missing_chat_id");
    error.statusCode = 400;
    throw error;
  }
  if (!cleanText) {
    const error = new Error("missing_message");
    error.statusCode = 400;
    throw error;
  }

  return liveChatRequest("send_event", {
    chat_id: cleanChatId,
    event: {
      type: "message",
      text: cleanText,
      visibility
    }
  });
}

export async function getLiveChatWelcomeRecord(chatId) {
  const cleanChatId = String(chatId || "").trim();
  if (!cleanChatId) return null;
  const response = await kvRequest(["GET", welcomeKey(cleanChatId)]);
  return response?.result ? JSON.parse(response.result) : null;
}

export async function saveLiveChatWelcomeRecord(chatId, record) {
  const cleanChatId = String(chatId || "").trim();
  if (!cleanChatId) {
    const error = new Error("missing_chat_id");
    error.statusCode = 400;
    throw error;
  }
  await kvRequest(["SET", welcomeKey(cleanChatId), JSON.stringify({
    chatId: cleanChatId,
    ...record,
    updatedAt: new Date().toISOString()
  })]);
}

export async function claimLiveChatWelcome(chatId, record = {}) {
  const cleanChatId = String(chatId || "").trim();
  if (!cleanChatId) {
    const error = new Error("missing_chat_id");
    error.statusCode = 400;
    throw error;
  }
  // SET ... NX es atomico: gana el claim solo una llamada concurrente.
  const response = await kvRequest([
    "SET",
    welcomeKey(cleanChatId),
    JSON.stringify({
      chatId: cleanChatId,
      claimedAt: new Date().toISOString(),
      pending: true,
      accountEmail: record.accountEmail || "",
      message: record.message || ""
    }),
    "NX"
  ]);
  return response?.result === "OK";
}

export async function releaseLiveChatWelcome(chatId) {
  const cleanChatId = String(chatId || "").trim();
  if (!cleanChatId) return;
  await kvRequest(["DEL", welcomeKey(cleanChatId)]);
}

export async function getLiveChatSafeTemplateRecord(chatId) {
  const cleanChatId = String(chatId || "").trim();
  if (!cleanChatId) return null;
  const response = await kvRequest(["GET", safeTemplateKey(cleanChatId)]);
  return response?.result ? JSON.parse(response.result) : null;
}

export async function saveLiveChatSafeTemplateRecord(chatId, record) {
  const cleanChatId = String(chatId || "").trim();
  if (!cleanChatId) {
    const error = new Error("missing_chat_id");
    error.statusCode = 400;
    throw error;
  }
  await kvRequest(["SET", safeTemplateKey(cleanChatId), JSON.stringify({
    chatId: cleanChatId,
    safe_template_sent: true,
    safe_template_intent: record.intent || "",
    ...record,
    updatedAt: new Date().toISOString()
  })]);
}

export async function listActiveLiveChats({ limit = 25 } = {}) {
  const response = await liveChatRequest("list_chats", {
    filters: {
      event_types: {
        values: ["message", "filled_form"]
      }
    },
    sort_order: "desc",
    limit: Math.min(100, Math.max(1, Number(limit) || 25))
  });
  return response.chats_summary || response.chats || [];
}

export async function getLiveChat(chatId) {
  const cleanChatId = String(chatId || "").trim();
  if (!cleanChatId) {
    const error = new Error("missing_chat_id");
    error.statusCode = 400;
    throw error;
  }
  return liveChatRequest("get_chat", { chat_id: cleanChatId });
}

export function extractLiveChatCustomerMessages(chat = {}) {
  const events = [];
  const userTypes = collectLiveChatUserTypes(chat);
  collectLiveChatEvents(chat, events);
  return dedupeMessages(events)
    .filter((event) => isCustomerMessage(event.raw, userTypes))
    .map(({ text, raw }) => ({
      text,
      authorType: authorType(raw, userTypes),
      createdAt: raw?.created_at || raw?.timestamp || "",
      eventId: raw?.id || raw?.event_id || ""
    }))
    .filter((message) => message.text);
}

export function extractLiveChatTextMessages(chat = {}) {
  const events = [];
  const userTypes = collectLiveChatUserTypes(chat);
  collectLiveChatEvents(chat, events);
  return dedupeMessages(events)
    .map(({ text, raw }) => ({
      text,
      authorType: authorType(raw, userTypes),
      authorId: raw?.author_id || raw?.author?.id || "",
      createdAt: raw?.created_at || raw?.timestamp || "",
      eventId: raw?.id || raw?.event_id || ""
    }))
    .filter((message) => message.text);
}

async function liveChatRequest(action, payload) {
  const auth = getLiveChatAuth();
  const response = await fetch(`${LIVECHAT_API_BASE}/${action}`, {
    method: "POST",
    headers: {
      authorization: `Basic ${auth}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(payload || {})
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    const error = new Error(data?.error?.message || data?.error || `livechat_${action}_failed`);
    error.statusCode = response.status;
    error.details = data;
    throw error;
  }
  return data;
}

function getLiveChatAuth() {
  const token = optionalEnv("LIVECHAT_BASIC_TOKEN") || optionalEnv("LIVECHAT_BASIC_AUTH_TOKEN") || optionalEnv("TEXT_BASIC_TOKEN");
  if (!token) {
    const error = new Error("missing_livechat_token");
    error.statusCode = 500;
    throw error;
  }
  return token;
}

function welcomeKey(chatId) {
  return `support:livechat:welcome:${chatId}`;
}

function safeTemplateKey(chatId) {
  return `support:livechat:safe-template:${chatId}`;
}

function collectLiveChatEvents(value, events) {
  if (!value || typeof value !== "object") return;
  const text = extractText(value);
  if (text) {
    events.push({ text, raw: value });
  }
  for (const key of ["events", "messages", "threads"]) {
    const items = value[key];
    if (Array.isArray(items)) {
      items.forEach((item) => collectLiveChatEvents(item, events));
    }
  }
  if (value.thread) collectLiveChatEvents(value.thread, events);
  if (value.chat) collectLiveChatEvents(value.chat, events);
}

function extractText(value) {
  const raw = value?.text || value?.message || value?.content?.text || value?.properties?.text || "";
  return String(raw || "").replace(/\s+/g, " ").trim();
}

function collectLiveChatUserTypes(chat = {}) {
  const users = new Map();
  collectUsers(chat, users);
  return users;
}

function collectUsers(value, users) {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value.users)) {
    for (const user of value.users) {
      const id = String(user?.id || "").trim();
      const type = String(user?.type || "").trim().toLowerCase();
      if (id && type) users.set(id, type);
    }
  }
  if (value.chat) collectUsers(value.chat, users);
  if (value.thread) collectUsers(value.thread, users);
  if (Array.isArray(value.threads)) value.threads.forEach((thread) => collectUsers(thread, users));
}

function isCustomerMessage(value, userTypes) {
  const type = authorType(value, userTypes);
  return ["customer", "visitor"].includes(type);
}

function authorType(value, userTypes = new Map()) {
  const direct = String(value?.author?.type || value?.author_type || value?.sender?.type || "").trim().toLowerCase();
  if (direct) return direct;
  const authorId = String(value?.author_id || value?.author?.id || value?.sender?.id || "").trim();
  return authorId ? String(userTypes.get(authorId) || "").trim().toLowerCase() : "";
}

function dedupeMessages(messages) {
  const seen = new Set();
  return messages.filter((message) => {
    const key = `${message.text}|${message.raw?.created_at || ""}|${message.raw?.id || ""}`;
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
