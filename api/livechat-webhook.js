import { optionalEnv, readJson, sendJson } from "../lib/http.js";
import { writeAuditLog } from "../lib/audit.js";
import { getSupportConfig } from "../lib/remote-config.js";
import { sendLiveChatMessage } from "../lib/livechat.js";
import { findSafeAutoTemplateReply } from "../lib/safe-template-replies.js";

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
    const existingRecord = chatId ? await getChatRecord(chatId).catch(() => null) : null;

    if (chatId && messages.length) {
      await appendChatMessages(chatId, messages, existingRecord);
    }

    const autoReply = chatId && messages.length
      ? await maybeSendSafeTemplateAutoReply(chatId, messages, event, existingRecord)
      : null;

    await writeAuditLog({
      type: "livechat_webhook_received",
      status: "received",
      action: event?.action || "",
      webhookId: event?.webhook_id || "",
      organizationId: event?.organization_id || "",
      chatId
    });

    return sendJson(res, 200, {
      ok: true,
      stored: messages.length,
      autoReply: autoReply ? {
        sent: autoReply.sent === true,
        skipped: autoReply.skipped === true,
        reason: autoReply.reason || "",
        intent: autoReply.intent || "",
        category: autoReply.category || ""
      } : undefined
    });
  } catch (error) {
    return sendJson(res, 400, { ok: false, error: error.message || "invalid_webhook" });
  }
}

async function maybeSendSafeTemplateAutoReply(chatId, messages, event, existingRecord = null) {
  const config = await getSupportConfig().catch(() => ({}));
  const automation = config.liveChatAutomation || {};
  const mode = String(automation.safeTemplateMode || "suggest_only").trim().toLowerCase();
  if (automation.enabled === false || mode !== "auto_send_safe") {
    await writeAuditLog({
      type: "livechat_auto_safe_template_suggest_only",
      status: "skipped",
      chatId,
      reason: automation.enabled === false ? "automation_disabled" : "safe_template_mode_not_auto",
      mode
    });
    return { skipped: true, reason: "safe_template_mode_not_auto" };
  }

  const existing = await getSafeTemplateRecord(chatId).catch(() => null);
  if (existing?.sentAt) {
    await writeAuditLog({
      type: "livechat_auto_safe_template_already_sent",
      status: "skipped",
      chatId,
      reason: "safe_template_already_sent",
      selectedIntent: existing.intent || "",
      riskLevel: "low"
    });
    return { skipped: true, reason: "safe_template_already_sent", intent: existing.intent || "" };
  }

  if (hasPreviousUsefulCustomerMessage(existingRecord)) {
    await writeAuditLog({
      type: "livechat_auto_safe_template_not_first_message",
      status: "skipped",
      chatId,
      reason: "not_first_useful_customer_message"
    });
    return { skipped: true, reason: "not_first_useful_customer_message" };
  }

  // Solo se auto-responde a mensajes con author.type explicito de cliente.
  // Un mensaje sin tipo podria ser del agente/bot; en ese caso no se responde.
  const usefulMessage = messages.find(
    (message) => isExplicitCustomerMessage(message) && isUsefulCustomerText(message.text)
  );
  if (!usefulMessage) {
    const hadUsefulText = messages.some((message) => isUsefulCustomerText(message.text));
    if (hadUsefulText) {
      await writeAuditLog({
        type: "livechat_auto_safe_template_not_customer",
        status: "skipped",
        chatId,
        reason: "not_customer_message"
      });
      return { skipped: true, reason: "not_customer_message" };
    }
    return { skipped: true, reason: "no_useful_customer_message" };
  }

  const context = buildWebhookContext(event, messages);
  const match = findSafeAutoTemplateReply(usefulMessage.text, context, { requireAutoSendAllowed: true });
  if (!match.matched) {
    await writeAuditLog({
      type: match.riskBlocked === true
        ? "livechat_auto_safe_template_blocked_risk"
        : "livechat_auto_safe_template_no_match",
      status: "skipped",
      chatId,
      reason: match.reason || "no_match",
      riskBlocked: match.riskBlocked === true
    });
    return { skipped: true, reason: match.reason || "no_match", riskBlocked: match.riskBlocked === true };
  }

  // Claim atomico para evitar carrera: dos webhooks concurrentes del mismo chat
  // no deben enviar dos plantillas. SET NX gana solo uno; el otro se salta.
  const claimed = await claimSafeTemplate(chatId, { intent: match.intent, category: match.category });
  if (!claimed) {
    await writeAuditLog({
      type: "livechat_auto_safe_template_already_sent",
      status: "skipped",
      chatId,
      reason: "safe_template_already_sent",
      selectedIntent: match.intent || "",
      riskLevel: "low"
    });
    return { skipped: true, reason: "safe_template_already_sent", intent: match.intent || "" };
  }

  let result;
  try {
    result = await sendLiveChatMessage({ chatId, text: match.reply, visibility: "all" });
  } catch (error) {
    // El envio fallo: liberamos el claim para permitir un reintento valido.
    await releaseSafeTemplate(chatId).catch(() => null);
    throw error;
  }
  const sentAt = new Date().toISOString();
  await saveSafeTemplateRecord(chatId, {
    sentAt,
    intent: match.intent,
    category: match.category,
    eventId: result.event_id || "",
    source: "auto_safe_template"
  }).catch(() => null);

  await writeAuditLog({
    type: "livechat_auto_safe_template_sent",
    status: "ok",
    chatId,
    eventId: result.event_id || "",
    selectedIntent: match.intent,
    category: match.category,
    confidence: match.confidence || null,
    riskLevel: "low",
    source: "auto_safe_template"
  });

  return {
    sent: true,
    reason: "auto_safe_template_sent",
    intent: match.intent,
    category: match.category,
    eventId: result.event_id || "",
    sentAt
  };
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

async function appendChatMessages(chatId, messages, existingRecord = null) {
  const existing = existingRecord || { messages: [] };
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

async function getSafeTemplateRecord(chatId) {
  const response = await kvRequest(["GET", safeTemplateKey(chatId)]);
  return response?.result ? JSON.parse(response.result) : null;
}

async function saveSafeTemplateRecord(chatId, record) {
  await kvRequest(["SET", safeTemplateKey(chatId), JSON.stringify({
    chatId,
    safe_template_sent: true,
    safe_template_intent: record.intent || "",
    ...record,
    updatedAt: new Date().toISOString()
  })]);
}

async function claimSafeTemplate(chatId, record = {}) {
  // SET ... NX es atomico: solo escribe si la clave no existe. Devuelve "OK"
  // cuando el claim se gana, null cuando ya estaba tomada.
  const response = await kvRequest([
    "SET",
    safeTemplateKey(chatId),
    JSON.stringify({
      chatId,
      claimedAt: new Date().toISOString(),
      pending: true,
      intent: record.intent || "",
      category: record.category || ""
    }),
    "NX"
  ]);
  return response?.result === "OK";
}

async function releaseSafeTemplate(chatId) {
  await kvRequest(["DEL", safeTemplateKey(chatId)]);
}

function chatKey(chatId) {
  return `support:livechat:messages:${chatId}`;
}

function safeTemplateKey(chatId) {
  return `support:livechat:safe-template:${chatId}`;
}

function isUsefulCustomerText(text) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  if (!clean || clean.length < 4) return false;
  return !/^(hola|buenas|buenos dias|buen dia|buenas tardes|buenas noches|hey|ola)$/i.test(clean);
}

function hasPreviousUsefulCustomerMessage(record) {
  return Array.isArray(record?.messages) && record.messages.some((message) => isUsefulCustomerText(message.text));
}

function buildWebhookContext(event, messages) {
  const action = String(event?.action || "").trim();
  const previous = messages.map((message) => message.text).filter(Boolean).slice(-3).join("\n");
  return [action ? `webhook_action:${action}` : "", previous].filter(Boolean).join("\n");
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
  // Permisivo a proposito para ALMACENAR contexto: incluye mensajes sin tipo.
  // El auto-envio usa isExplicitCustomerMessage, que si exige tipo de cliente.
  const type = authorType(value);
  return !type || ["customer", "visitor"].includes(type);
}

function isExplicitCustomerMessage(message) {
  const type = String(message?.authorType || "").trim().toLowerCase();
  return type === "customer" || type === "visitor";
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
