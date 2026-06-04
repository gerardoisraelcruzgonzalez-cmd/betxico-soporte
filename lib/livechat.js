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
