import { readFileSync } from "node:fs";
import { createJiraIssue } from "../lib/jira.js";
import { sendSlackSupportNotification } from "../lib/slack.js";
import { optionalEnv, readJson, sendJson, requireWidgetAccess } from "../lib/http.js";
import { writeAuditLog } from "../lib/audit.js";
import { requireCurrentAccount } from "../lib/account-store.js";
import { getSupportConfig, isSupportAdmin } from "../lib/remote-config.js";
import { addAiExample, addAiFeedback, inferTopic, selectRelevantAiExamples } from "../lib/ai-training.js";
import {
  claimLiveChatWelcome,
  extractLiveChatCustomerMessages,
  extractLiveChatTextMessages,
  getLiveChat,
  getLiveChatSafeTemplateRecord,
  getLiveChatWelcomeRecord,
  listActiveLiveChats,
  releaseLiveChatWelcome,
  saveLiveChatSafeTemplateRecord,
  saveLiveChatWelcomeRecord,
  sendLiveChatMessage
} from "../lib/livechat.js";
import { findSafeAutoTemplateReply, isSimpleGreeting } from "../lib/safe-template-replies.js";

const DEFAULT_OPENAI_MODEL = "gpt-5.4-mini";
const DEFAULT_OPENAI_FALLBACK_MODEL = "gpt-5.4-nano";
const MAX_AI_MESSAGE_LENGTH = 4000;
const MAX_AI_CONTEXT_LENGTH = 7000;
const INTENTS_DATASET_PATH = new URL("../docs/betxico_intents_dataset_v1.json", import.meta.url);
const FALLBACK_TEMPLATES_PATH = new URL("../docs/betxico_fallback_templates_v1.json", import.meta.url);
let intentsDatasetCache = null;
let fallbackTemplatesCache = null;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  try {
    requireWidgetAccess(req);
    const payload = await readJson(req);
    const action = String(req.query?.action || payload.action || "").trim();
    if (action === "ai-chat") {
      return await handleAiChat(req, res, payload);
    }
    if (action === "ai-save-example") {
      return await handleAiSaveExample(req, res, payload);
    }
    if (action === "ai-feedback") {
      return await handleAiFeedback(req, res, payload);
    }
    if (action === "livechat-send-welcome") {
      return await handleLiveChatSendWelcome(req, res, payload);
    }
    if (action === "livechat-send-message") {
      return await handleLiveChatSendMessage(req, res, payload);
    }
    if (action === "livechat-auto-safe-template") {
      return await handleLiveChatAutoSafeTemplate(req, res, payload);
    }
    if (action === "livechat-list-active") {
      return await handleLiveChatListActive(req, res, payload);
    }
    if (action === "livechat-get-chat") {
      return await handleLiveChatGetChat(req, res, payload);
    }
    if (action === "livechat-customer-history") {
      return await handleLiveChatCustomerHistory(req, res, payload);
    }
    if (action === "game-sessions-close" || action === "game-sessions-request") {
      return await handleGameSessionsRequest(req, res, payload);
    }
    if (action === "game-sessions-requests") {
      return await handleGameSessionsRequestsList(req, res, payload);
    }

    const normalized = normalizeSupportPayload(payload);
    const account = await requireCurrentAccount(req);
    const slackAccountIdentity = buildSlackAccountIdentity(account);
    if (normalized.source === "raycast") {
      normalized.slackFields.agentName = account.displayName || account.email || normalized.slackFields.agentName;
    }
    if (account?.configured) {
      normalized.accountSettings = account;
    }

    let jira = null;
    let slack = null;
    const shouldCreateJira = normalized.destination === "jira" || normalized.destination === "both";
    const shouldNotifySlack = normalized.destination === "slack" || normalized.destination === "both";

    if (shouldCreateJira) {
      jira = await createJiraIssue(normalized);
    }

    if (shouldNotifySlack) {
      try {
        slack = await sendSlackSupportNotification({
          ...normalized,
          accountSettings: normalized.accountSettings || slackAccountIdentity
        }, jira);
      } catch (error) {
        slack = {
          ok: false,
          error: error.message || "slack_notification_failed",
          details: error.details || undefined
        };
        if (!shouldCreateJira) {
          throw error;
        }
      }
    }

    await writeAuditLog({
      type: "support_ticket_created",
      status: "ok",
      payload: normalized,
      jira,
      slack
    });

    return sendJson(res, 200, { ok: true, jira, slack });
  } catch (error) {
    await writeAuditLog({
      type: "support_ticket_failed",
      status: "error",
      error: error.message || "support_ticket_failed"
    });

    const status = error.statusCode || 500;
    return sendJson(res, status, {
      ok: false,
      error: error.message || "support_ticket_failed",
      details: error.details || undefined
    });
  }
}

function buildSlackAccountIdentity(account = {}) {
  return {
    email: account.email || "",
    displayName: account.displayName || "",
    jiraEmail: account.jiraEmail || "",
    reporterAccountId: account.reporterAccountId || "",
    defaultAssigneeAccountId: account.defaultAssigneeAccountId || "",
    defaultLabels: account.defaultLabels || ""
  };
}

async function handleGameSessionsRequest(req, res, payload) {
  const account = await requireCurrentAccount(req);
  const customerId = cleanCustomerId(payload.customerId || payload.authId || payload.customer_id);
  if (!customerId) {
    return sendJson(res, 400, { ok: false, error: "invalid_customer_id" });
  }

  const auditBase = {
    type: "game_sessions_close_request",
    customerId,
    source: "support-livechat-app",
    chatId: cleanText(payload.chatId).slice(0, 120),
    account: {
      email: account.email || "",
      displayName: account.displayName || ""
    }
  };

  try {
    const data = await requestGameSessionsClosureViaBetxicoAssistant({
      customerId,
      reason: cleanText(payload.reason || payload.note || payload.message).slice(0, 260),
      customerName: cleanText(payload.customerName).slice(0, 160),
      customerEmail: cleanText(payload.customerEmail).slice(0, 180),
      account,
      chatId: auditBase.chatId
    });

    await writeAuditLog({
      ...auditBase,
      status: "ok",
      requestId: data.request?.id || "",
      duplicate: Boolean(data.duplicate)
    });

    return sendJson(res, 200, {
      ok: true,
      customerId,
      duplicate: Boolean(data.duplicate),
      request: data.request
    });
  } catch (error) {
    await writeAuditLog({
      ...auditBase,
      status: "error",
      error: error.message || "game_sessions_request_failed",
      upstreamStatus: error.upstreamStatus || undefined
    });

    return sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "game_sessions_request_failed",
      details: error.details || undefined
    });
  }
}

async function handleGameSessionsRequestsList(req, res, payload) {
  await requireCurrentAccount(req);
  try {
    const data = await listGameSessionsClosureRequestsViaBetxicoAssistant({
      status: cleanText(payload.status || "all") || "all",
      limit: Number(payload.limit || 20)
    });
    return sendJson(res, 200, {
      ok: true,
      requests: Array.isArray(data.requests) ? data.requests : []
    });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "game_sessions_requests_failed",
      details: error.details || undefined
    });
  }
}

async function requestGameSessionsClosureViaBetxicoAssistant({ customerId, reason, customerName, customerEmail, account, chatId }) {
  const baseUrl = betxicoAssistantApiBaseUrl();
  const accessToken = optionalEnv("BETXICO_ASSISTANT_ACCESS_TOKEN", optionalEnv("BETXICO_ASSISTANT_API_TOKEN", optionalEnv("SUPPORT_ALERTS_TOKEN", "")));
  const localToken = optionalEnv("BETXICO_ASSISTANT_LOCAL_TOKEN", "");

  if (!accessToken && !localToken) {
    throw statusError("missing_betxico_assistant_token", 500);
  }

  const headers = {
    "content-type": "application/json",
    "idempotency-key": buildGameSessionRequestIdempotencyKey(customerId, chatId)
  };

  if (accessToken) {
    headers.authorization = `Bearer ${accessToken}`;
  }
  if (localToken) {
    headers["x-betxico-local-token"] = localToken;
    headers["x-betxico-role"] = "admin";
    headers["x-betxico-actor"] = account.email || "support-livechat-app";
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const response = await fetch(`${baseUrl}/game-session-requests`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        customerId,
        reason,
        chatId,
        customerName,
        customerEmail,
        requestedByName: account.displayName || "",
        requestedByEmail: account.email || "",
        source: "support-livechat-app"
      }),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = statusError(data.error || data.message || `betxico_assistant_http_${response.status}`, response.status || 502);
      error.details = data.details || undefined;
      error.upstreamStatus = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (error.name === "AbortError") {
      throw statusError("betxico_assistant_timeout", 504);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

async function listGameSessionsClosureRequestsViaBetxicoAssistant({ status, limit }) {
  const baseUrl = betxicoAssistantApiBaseUrl();
  const accessToken = optionalEnv("BETXICO_ASSISTANT_ACCESS_TOKEN", optionalEnv("BETXICO_ASSISTANT_API_TOKEN", optionalEnv("SUPPORT_ALERTS_TOKEN", "")));
  const localToken = optionalEnv("BETXICO_ASSISTANT_LOCAL_TOKEN", "");

  if (!accessToken && !localToken) {
    throw statusError("missing_betxico_assistant_token", 500);
  }

  const headers = { "accept": "application/json" };
  if (accessToken) {
    headers.authorization = `Bearer ${accessToken}`;
  }
  if (localToken) {
    headers["x-betxico-local-token"] = localToken;
    headers["x-betxico-role"] = "admin";
    headers["x-betxico-actor"] = "support-livechat-app";
  }

  const params = new URLSearchParams({
    status: ["active", "all", "pending", "processing", "completed", "rejected", "error"].includes(status) ? status : "all",
    limit: String(Math.max(1, Math.min(Number.isFinite(limit) ? limit : 20, 50)))
  });
  const response = await fetch(`${baseUrl}/game-session-requests?${params.toString()}`, { headers });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = statusError(data.error || data.message || `betxico_assistant_http_${response.status}`, response.status || 502);
    error.details = data.details || undefined;
    error.upstreamStatus = response.status;
    throw error;
  }
  return data;
}

function betxicoAssistantApiBaseUrl() {
  const raw = optionalEnv("BETXICO_ASSISTANT_API_URL", "").replace(/\/+$/, "");
  if (!raw) {
    throw statusError("missing_betxico_assistant_api_url", 500);
  }
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}

function cleanCustomerId(value) {
  const customerId = String(value || "").trim();
  return /^\d{3,20}$/.test(customerId) ? customerId : "";
}

function buildGameSessionRequestIdempotencyKey(customerId, chatId) {
  const safeChat = cleanText(chatId).replace(/[^A-Za-z0-9_-]/g, "").slice(0, 80) || "manual";
  return `support-livechat:game-sessions-request:${customerId}:${safeChat}`;
}

function summarizeGameSessionCloseResult(result = {}) {
  return {
    estado: result.estado || "",
    resultado: result.resultado || "",
    cantidadCerradas: result.cantidadCerradas ?? null,
    fechaProceso: result.fechaProceso || "",
    notas: result.notas || ""
  };
}

function statusError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function handleAiChat(req, res, payload) {
  const account = await requireAdminAccount(req);

  const message = cleanText(payload.message).slice(0, MAX_AI_MESSAGE_LENGTH);
  const context = cleanText(payload.context).slice(0, MAX_AI_CONTEXT_LENGTH);

  if (!message) {
    return sendJson(res, 400, { ok: false, error: "missing_message" });
  }

  const config = await getSupportConfig().catch(() => ({}));
  const aiConfig = config.aiAssistant || {};
  if (aiConfig.enabled === false) {
    return sendJson(res, 403, { ok: false, error: "ai_assistant_disabled" });
  }

  const topic = inferTopic(`${message}\n${context}`);
  const intentsDataset = mergeIntentDatasetWithFallbackTemplates(loadIntentsDataset(), loadFallbackTemplates());
  const intentCandidates = selectIntentCandidates(intentsDataset, `${message}\n${context}`, 5);
  const safeTemplateFallback = buildSafeTemplateFallbackResponse({ message, context, topic });
  if (safeTemplateFallback) {
    await writeAuditLog({
      type: "ai_chat_safe_template_fallback",
      status: "ok",
      model: "template-fallback",
      topic,
      selectedIntent: safeTemplateFallback.classification?.selectedIntent || "",
      subdiagnostic: safeTemplateFallback.classification?.subdiagnostic || "",
      confidence: safeTemplateFallback.classification?.confidence || null,
      riskLevel: safeTemplateFallback.classification?.riskLevel || "",
      account: { email: account.email || "" }
    });

    return sendJson(res, 200, {
      ok: true,
      answer: safeTemplateFallback.answer,
      classification: safeTemplateFallback.classification,
      model: "template-fallback",
      topic,
      exampleCount: 0,
      usedFileSearch: false,
      retriedWithoutFileSearch: false,
      retriedWithFallbackModel: false,
      templateFallback: true,
      safeTemplateFallback: true,
      skippedOpenAi: true
    });
  }

  const apiKey = optionalEnv("OPENAI_API_KEY");
  if (!apiKey) {
    return sendJson(res, 500, { ok: false, error: "missing_openai_api_key" });
  }

  const examples = await selectRelevantAiExamples({
    message,
    context,
    topic,
    limit: Math.min(Number(aiConfig.maxExamples || 3) || 3, 3)
  }).catch(() => []);
  const model = optionalEnv("OPENAI_MODEL", DEFAULT_OPENAI_MODEL);
  const requestBody = buildOpenAiRequestBody({ model, account, aiConfig, message, context, examples, intentsDataset, intentCandidates });
  let data = await requestOpenAi(apiKey, requestBody);
  let retriedWithoutFileSearch = false;
  let retriedWithFallbackModel = false;
  let finalModel = model;

  if (!data.ok && isOpenAiRateLimit(data) && !isOpenAiQuotaExceeded(data) && model !== getOpenAiFallbackModel()) {
    retriedWithoutFileSearch = Boolean(requestBody.tools?.length);
    retriedWithFallbackModel = true;
    finalModel = getOpenAiFallbackModel();
    data = await requestOpenAi(apiKey, {
      ...requestBody,
      model: finalModel,
      tools: undefined,
      instructions: buildAiInstructions(account, aiConfig, examples.slice(0, 2), intentsDataset, intentCandidates.slice(0, 3), { compact: true }),
      max_output_tokens: Math.min(Number(optionalEnv("OPENAI_MAX_OUTPUT_TOKENS", "650")) || 650, 650)
    });
  }

  if (!data.ok && !isOpenAiRateLimit(data) && !isOpenAiQuotaExceeded(data) && requestBody.tools?.length) {
    retriedWithoutFileSearch = true;
    data = await requestOpenAi(apiKey, { ...requestBody, tools: undefined });
  }

  if (!data.ok) {
    const openAiErrorCode = isOpenAiQuotaExceeded(data)
      ? "openai_quota_exceeded"
      : isOpenAiRateLimit(data)
        ? "openai_rate_limited"
        : "openai_request_failed";

    if (openAiErrorCode === "openai_quota_exceeded" || openAiErrorCode === "openai_rate_limited") {
      const templateFallback = buildTemplateFallbackResponse({
        message,
        context,
        topic,
        examples,
        intentCandidates,
        errorCode: openAiErrorCode
      });

      await writeAuditLog({
        type: "ai_chat_template_fallback",
        status: "ok",
        model: "template-fallback",
        topic,
        selectedIntent: templateFallback.classification?.selectedIntent || "",
        subdiagnostic: templateFallback.classification?.subdiagnostic || "",
        confidence: templateFallback.classification?.confidence || null,
        riskLevel: templateFallback.classification?.riskLevel || "",
        openAiErrorCode,
        account: { email: account.email || "" }
      });

      return sendJson(res, 200, {
        ok: true,
        answer: templateFallback.answer,
        classification: templateFallback.classification,
        model: "template-fallback",
        topic,
        exampleCount: examples.length,
        usedFileSearch: false,
        retriedWithoutFileSearch,
        retriedWithFallbackModel,
        templateFallback: true,
        openAiErrorCode
      });
    }

    await writeAuditLog({
      type: "ai_chat_failed",
      status: "error",
      model: finalModel,
      topic,
      usedFileSearch: Boolean(requestBody.tools?.length),
      retriedWithoutFileSearch,
      retriedWithFallbackModel,
      account: { email: account.email || "" },
      error: data.error?.message || data.error || "openai_request_failed"
    });
    return sendJson(res, data.status || 500, {
      ok: false,
      error: openAiErrorCode,
      details: data.error?.message || data.error || undefined
    });
  }

  const rawAnswer = extractAiText(data.body);
  const classification = parseAiClassification(rawAnswer, intentsDataset);
  const answer = classification?.response || rawAnswer;

  await writeAuditLog({
    type: "ai_chat_completed",
    status: "ok",
    model: finalModel,
    topic,
    selectedIntent: classification?.selectedIntent || "",
    subdiagnostic: classification?.subdiagnostic || "",
    confidence: classification?.confidence || null,
    riskLevel: classification?.riskLevel || "",
    usedFileSearch: Boolean(requestBody.tools?.length),
    retriedWithoutFileSearch,
    retriedWithFallbackModel,
    exampleCount: examples.length,
    account: { email: account.email || "" },
    usage: data.body?.usage || undefined
  });

  return sendJson(res, 200, {
    ok: true,
    answer,
    classification,
    model: finalModel,
    topic,
    exampleCount: examples.length,
    usedFileSearch: Boolean(requestBody.tools?.length),
    retriedWithoutFileSearch,
    retriedWithFallbackModel
  });
}

async function handleAiSaveExample(req, res, payload) {
  const account = await requireAdminAccount(req);
  const example = await addAiExample({
    topic: payload.topic || inferTopic(payload.question || payload.answer || ""),
    question: payload.question,
    answer: payload.answer,
    notes: payload.notes,
    enabled: true
  }, account);
  return sendJson(res, 200, { ok: true, example });
}

async function handleAiFeedback(req, res, payload) {
  const account = await requireAdminAccount(req);
  const feedback = await addAiFeedback({
    topic: payload.topic || inferTopic(payload.question || payload.answer || payload.correction || ""),
    question: payload.question,
    answer: payload.answer,
    correction: payload.correction,
    status: "pending"
  }, account);
  return sendJson(res, 200, { ok: true, feedback });
}

async function handleLiveChatSendWelcome(req, res, payload) {
  const account = await requireCurrentAccount(req);
  const config = await getSupportConfig().catch(() => ({}));
  const automation = config.liveChatAutomation || {};
  const autoWelcome = automation.autoWelcome || {};

  if (automation.enabled === false || autoWelcome.enabled === false) {
    return sendJson(res, 403, { ok: false, error: "livechat_welcome_disabled" });
  }

  const allowedAgents = Array.isArray(autoWelcome.onlyForAgents) ? autoWelcome.onlyForAgents : [];
  if (allowedAgents.length && !allowedAgents.includes(String(account.email || "").trim().toLowerCase())) {
    return sendJson(res, 403, { ok: false, error: "livechat_agent_not_allowed" });
  }

  const chatId = cleanText(payload.chatId || payload.chat_id);
  const message = cleanText(payload.message || autoWelcome.message);
  if (!chatId) {
    return sendJson(res, 400, { ok: false, error: "missing_chat_id" });
  }

  if (autoWelcome.oncePerChat !== false) {
    const existing = await getLiveChatWelcomeRecord(chatId).catch(() => null);
    if (existing?.sentAt) {
      return sendJson(res, 200, {
        ok: true,
        skipped: true,
        reason: "welcome_already_sent",
        chatId,
        sentAt: existing.sentAt
      });
    }

    const chat = await getLiveChat(chatId).catch(() => null);
    if (chat && liveChatAlreadyHasMessage(chat, message)) {
      const sentAt = new Date().toISOString();
      await saveLiveChatWelcomeRecord(chatId, {
        sentAt,
        eventId: "",
        accountEmail: account.email || "",
        message,
        source: "history_detected"
      }).catch(() => null);
      return sendJson(res, 200, {
        ok: true,
        skipped: true,
        reason: "welcome_already_in_chat",
        chatId,
        sentAt
      });
    }
  }

  // Claim atomico para evitar bienvenidas duplicadas por disparos concurrentes.
  const oncePerChat = autoWelcome.oncePerChat !== false;
  if (oncePerChat) {
    const claimed = await claimLiveChatWelcome(chatId, { accountEmail: account.email || "", message });
    if (!claimed) {
      return sendJson(res, 200, {
        ok: true,
        skipped: true,
        reason: "welcome_already_sent",
        chatId
      });
    }
  }

  let result;
  try {
    result = await sendLiveChatMessage({ chatId, text: message });
  } catch (error) {
    // El envio fallo: liberamos el claim para permitir un reintento valido.
    if (oncePerChat) await releaseLiveChatWelcome(chatId).catch(() => null);
    throw error;
  }
  const sentAt = new Date().toISOString();
  await saveLiveChatWelcomeRecord(chatId, {
    sentAt,
    eventId: result.event_id || "",
    accountEmail: account.email || "",
    message
  }).catch(() => null);

  await writeAuditLog({
    type: "livechat_welcome_sent",
    status: "ok",
    chatId,
    eventId: result.event_id || "",
    account: { email: account.email || "" }
  });

  return sendJson(res, 200, {
    ok: true,
    chatId,
    eventId: result.event_id || "",
    sentAt
  });
}

function liveChatAlreadyHasMessage(chat, message) {
  const expected = normalizeComparableText(message);
  if (!expected) return false;
  return extractLiveChatTextMessages(chat).some((event) =>
    normalizeComparableText(event.text) === expected &&
    !["customer", "visitor"].includes(String(event.authorType || "").toLowerCase())
  );
}

async function handleLiveChatSendMessage(req, res, payload) {
  const account = await requireCurrentAccount(req);
  const chatId = cleanText(payload.chatId || payload.chat_id);
  const message = cleanText(payload.message);
  if (!chatId) {
    return sendJson(res, 400, { ok: false, error: "missing_chat_id" });
  }
  if (!message) {
    return sendJson(res, 400, { ok: false, error: "missing_message" });
  }

  const result = await sendLiveChatMessage({ chatId, text: message });
  await writeAuditLog({
    type: "livechat_message_sent",
    status: "ok",
    chatId,
    eventId: result.event_id || "",
    account: { email: account.email || "" }
  });
  return sendJson(res, 200, { ok: true, chatId, eventId: result.event_id || "" });
}

async function handleLiveChatAutoSafeTemplate(req, res, payload) {
  const account = await requireCurrentAccount(req);
  const config = await getSupportConfig().catch(() => ({}));
  const automation = config.liveChatAutomation || {};
  const mode = String(automation.safeTemplateMode || "suggest_only").trim().toLowerCase();
  const chatId = cleanText(payload.chatId || payload.chat_id);

  if (!chatId) {
    return sendJson(res, 400, { ok: false, error: "missing_chat_id" });
  }
  if (automation.enabled === false || mode !== "auto_send_safe") {
    return sendJson(res, 200, { ok: true, skipped: true, reason: "safe_template_mode_not_auto", mode });
  }

  const existing = await getLiveChatSafeTemplateRecord(chatId).catch(() => null);
  if (existing?.sentAt) {
    return sendJson(res, 200, {
      ok: true,
      skipped: true,
      reason: "safe_template_already_sent",
      intent: existing.intent || existing.safe_template_intent || "",
      sentAt: existing.sentAt
    });
  }

  const chat = await getLiveChat(chatId);
  const customerMessages = extractLiveChatCustomerMessages(chat);
  const usefulMessages = customerMessages
    .map((message) => ({ ...message, text: cleanText(message.text) }))
    .filter((message) => message.text && !isSimpleGreeting(message.text));
  const lastUseful = usefulMessages.at(-1);
  if (!lastUseful) {
    return sendJson(res, 200, { ok: true, skipped: true, reason: "no_useful_customer_message" });
  }

  const context = customerMessages.slice(-5).map((message) => message.text).filter(Boolean).join("\n");
  const match = findSafeAutoTemplateReply(lastUseful.text, context, { requireAutoSendAllowed: true });
  if (!match.matched) {
    await writeAuditLog({
      type: match.riskBlocked === true ? "livechat_widget_auto_safe_blocked_risk" : "livechat_widget_auto_safe_no_match",
      status: "skipped",
      chatId,
      reason: match.reason || "no_match",
      riskBlocked: match.riskBlocked === true,
      account: { email: account.email || "" }
    });
    return sendJson(res, 200, {
      ok: true,
      skipped: true,
      reason: match.reason || "no_match",
      riskBlocked: match.riskBlocked === true
    });
  }

  const result = await sendLiveChatMessage({ chatId, text: match.reply, visibility: "all" });
  const sentAt = new Date().toISOString();
  await saveLiveChatSafeTemplateRecord(chatId, {
    sentAt,
    intent: match.intent,
    category: match.category,
    eventId: result.event_id || "",
    source: "widget_auto_safe_template"
  }).catch(() => null);

  await writeAuditLog({
    type: "livechat_widget_auto_safe_sent",
    status: "ok",
    chatId,
    eventId: result.event_id || "",
    selectedIntent: match.intent,
    category: match.category,
    confidence: match.confidence || null,
    riskLevel: "low",
    source: "widget_auto_safe_template",
    account: { email: account.email || "" }
  });

  return sendJson(res, 200, {
    ok: true,
    sent: true,
    reason: "auto_safe_template_sent",
    chatId,
    eventId: result.event_id || "",
    intent: match.intent,
    category: match.category,
    sentAt
  });
}

async function handleLiveChatListActive(req, res, payload) {
  await requireCurrentAccount(req);
  const chats = await listActiveLiveChats({ limit: payload.limit || 25 });
  return sendJson(res, 200, { ok: true, chats });
}

async function handleLiveChatGetChat(req, res, payload) {
  await requireCurrentAccount(req);
  const chatId = cleanText(payload.chatId || payload.chat_id);
  const chat = await getLiveChat(chatId);
  const customerMessages = extractLiveChatCustomerMessages(chat);
  return sendJson(res, 200, {
    ok: true,
    chat,
    customerMessages,
    text: customerMessages.map((message) => message.text).filter(Boolean).join("\n")
  });
}

async function handleLiveChatCustomerHistory(req, res, payload) {
  await requireCurrentAccount(req);
  const email = cleanText(payload.email).toLowerCase();
  const currentChatId = cleanText(payload.chatId || payload.chat_id);
  if (!email) {
    return sendJson(res, 200, { ok: true, history: [] });
  }

  const chats = await listActiveLiveChats({ limit: Math.min(100, Math.max(20, Number(payload.limit) || 60)) });
  const matching = chats
    .filter((chat) => chatIdFromLiveChat(chat) && chatIdFromLiveChat(chat) !== currentChatId)
    .filter((chat) => liveChatHasCustomerEmail(chat, email))
    .slice(0, 3);

  const details = await Promise.all(matching.map(async (summary) => {
    const chatId = chatIdFromLiveChat(summary);
    const chat = await getLiveChat(chatId).catch(() => summary);
    const messages = extractLiveChatTextMessages(chat)
      .filter((message) => message.text)
      .slice(-8);
    return {
      chatId,
      dateLabel: formatHistoryDate(chat, summary),
      summary: summarizeHistoryMessages(messages),
      messages: messages.slice(-4)
    };
  }));

  return sendJson(res, 200, { ok: true, history: details });
}

function chatIdFromLiveChat(chat = {}) {
  return cleanText(chat.id || chat.chat_id || chat.chat?.id || chat.chat?.chat_id);
}

function liveChatHasCustomerEmail(chat = {}, email = "") {
  const users = Array.isArray(chat.users) ? chat.users : Array.isArray(chat.chat?.users) ? chat.chat.users : [];
  return users.some((user) =>
    ["customer", "visitor"].includes(String(user?.type || "").toLowerCase()) &&
    cleanText(user?.email).toLowerCase() === email
  );
}

function formatHistoryDate(chat = {}, summary = {}) {
  const raw = chat.created_at || summary.created_at || chat.last_thread_summary?.created_at || summary.last_thread_summary?.created_at || "";
  if (!raw) return "Conversacion previa";
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? "Conversacion previa" : date.toLocaleString("es-MX", { timeZone: "America/Mexico_City" });
}

function summarizeHistoryMessages(messages = []) {
  const useful = messages
    .map((message) => `${["customer", "visitor"].includes(message.authorType) ? "Cliente" : "Agente"}: ${cleanText(message.text)}`)
    .filter(Boolean)
    .slice(-6);
  return useful.join(" | ").slice(0, 900);
}

async function requireAdminAccount(req) {
  const account = await requireCurrentAccount(req);
  if (!(await isSupportAdmin(account.email))) {
    const error = new Error("admin_not_authorized");
    error.statusCode = 403;
    throw error;
  }
  return account;
}

async function requestOpenAi(apiKey, body) {
  const response = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json"
    },
    body: JSON.stringify(body)
  });
  const bodyData = await response.json().catch(() => ({}));
  if (!response.ok) {
    return { ok: false, status: response.status, error: bodyData.error || bodyData };
  }
  return { ok: true, status: response.status, body: bodyData };
}

function getOpenAiFallbackModel() {
  return optionalEnv("OPENAI_FALLBACK_MODEL", DEFAULT_OPENAI_FALLBACK_MODEL) || DEFAULT_OPENAI_FALLBACK_MODEL;
}

function isOpenAiRateLimit(data) {
  const status = Number(data?.status || 0);
  const code = String(data?.error?.code || data?.error?.type || "").toLowerCase();
  const message = String(data?.error?.message || data?.error || "").toLowerCase();
  return status === 429 || code.includes("rate") || message.includes("rate limit") || message.includes("tokens per min") || message.includes("tpm");
}

function isOpenAiQuotaExceeded(data) {
  const code = String(data?.error?.code || data?.error?.type || "").toLowerCase();
  const message = String(data?.error?.message || data?.error || "").toLowerCase();
  return code.includes("insufficient_quota")
    || message.includes("exceeded your current quota")
    || message.includes("check your plan and billing")
    || message.includes("billing details");
}

function buildTemplateFallbackResponse({ message = "", context = "", topic = "general", examples = [], intentCandidates = [], errorCode = "" } = {}) {
  const text = `${message}\n${context}`;
  const selected = intentCandidates[0] || null;
  const example = examples.find((item) => item.enabled !== false);
  const response = buildTemplateFallbackText(selected, example, text, topic);
  const missingData = inferTemplateMissingData(selected, text);

  return {
    answer: response,
    classification: {
      selectedIntent: selected?.intent || (example ? `ejemplo_aprobado_${example.topic || topic}` : "general"),
      subdiagnostic: selected?.subdiagnostics?.[0] || "plantilla_sin_gpt",
      confidence: selected ? inferTemplateConfidence(selected.score) : (example ? 0.45 : 0.25),
      missingData,
      riskLevel: normalizeRiskLevel(selected?.riskLevel || "medium"),
      canAutoRespond: selected?.canAutoRespond === true && missingData.length === 0,
      requiresTicket: selected?.requiresTicket === true,
      requiresDocuments: selected?.requiresDocuments === true,
      requiresScreenshot: selected?.requiresScreenshot === true,
      source: "template-fallback",
      response
    },
    errorCode
  };
}

function buildSafeTemplateFallbackResponse({ message = "", context = "", topic = "general" } = {}) {
  const text = `${message}\n${context}`;
  const selected = selectSafeFallbackTemplate(loadFallbackTemplates(), text);
  if (!selected) return null;

  const response = cleanText(isAngryCustomerText(text) && selected.angryCustomerResponse
    ? selected.angryCustomerResponse
    : selected.response);

  if (!response) return null;

  return {
    answer: response,
    classification: {
      selectedIntent: selected.intent,
      subdiagnostic: selected.subcategory || "plantilla_segura",
      category: selected.category || topic,
      confidence: inferTemplateConfidence(selected.score),
      missingData: [],
      riskLevel: "low",
      canAutoRespond: true,
      requiresTicket: false,
      requiresDocuments: false,
      requiresScreenshot: false,
      source: "safe-template-fallback",
      response
    }
  };
}

function selectSafeFallbackTemplate(templates = [], text = "") {
  if (!templates.length || hasHighRiskSupportSignal(text)) return null;

  const normalized = normalizeForSearch(text);
  const words = new Set(normalized.split(/[^a-z0-9]+/).filter((word) => word.length >= 4));
  const matches = templates
    .filter((template) => template?.status === "aprobada"
      && template.riskLevel === "low"
      && template.mode === "plantilla_segura"
      && template.canAutoRespond === true)
    .map((template) => {
      let score = 0;
      let strongTriggerMatches = 0;
      const triggers = normalizeAiStringList(template.triggers);
      for (const trigger of triggers) {
        const normalizedTrigger = normalizeForSearch(trigger);
        if (!normalizedTrigger || normalizedTrigger.length < 4) continue;
        if (normalized.includes(normalizedTrigger)) {
          score += 16;
          strongTriggerMatches += 1;
        } else if (isSafePartialTriggerMatch(normalized, normalizedTrigger)) {
          score += 9;
          strongTriggerMatches += 1;
        }
      }

      const haystack = normalizeForSearch([
        template.intent,
        template.category,
        template.subcategory,
        ...(template.triggers || [])
      ].join(" "));
      for (const word of words) {
        if (haystack.includes(word)) score += 1;
      }

      if (template.category === "depositos" && /\b(deposito|deposite|transferencia|spei|cep|comprobante|saldo)\b/i.test(normalized)) score += 4;
      if (template.category === "bonos_promociones" && /\b(bono|promocion|cashback)\b/i.test(normalized)) score += 4;
      if (template.category === "acceso_cuenta" && /\b(entrar|cuenta|contrasena|login|iniciar sesion)\b/i.test(normalized)) score += 4;
      if (template.category === "kyc_documentos" && /\b(ine|selfie|documento|verificacion)\b/i.test(normalized)) score += 4;

      return { ...template, score, strongTriggerMatches };
    })
    .filter((template) => template.score >= 14 && template.strongTriggerMatches >= 1)
    .sort((a, b) => b.score - a.score || String(a.intent).localeCompare(String(b.intent)));

  return matches[0] || null;
}

function isSafePartialTriggerMatch(normalizedText, normalizedTrigger) {
  const triggerWords = normalizedTrigger.split(/[^a-z0-9]+/).filter((word) => word.length >= 4);
  if (triggerWords.length < 2) return false;
  const matched = triggerWords.filter((word) => normalizedText.includes(word)).length;
  return matched >= Math.min(2, triggerWords.length);
}

function hasHighRiskSupportSignal(text = "") {
  const normalized = normalizeForSearch(text);
  const checks = [
    /\bretiro\b|\bretirar\b|\bwithdraw\b/,
    /failed|congelad|revision|revisando/,
    /bloquead|bloquearon|suspendid|desactivad/,
    /cerrar cuenta|cierre de cuenta|cancelar cuenta|autoexclusion|auto exclusion/,
    /suplantacion|fraude|fraudul|estafa|robo/,
    /demanda|demandar|legal|abogado|profeco|condusef/,
    /ganancia no reflejad|premio no aparece|no me pago|saldo descontad|quito dinero|quito mi saldo|me quito|me quit[oó]/,
    /molesto|enojad|indignad|queja|reclamo/
  ];
  return checks.some((pattern) => pattern.test(normalized));
}

function buildTemplateFallbackText(intent, example, text, topic) {
  if (intent?.templateFallbackResponse || intent?.templateFallbackAngryResponse) {
    return cleanText(isAngryCustomerText(text) && intent.templateFallbackAngryResponse
      ? intent.templateFallbackAngryResponse
      : intent.templateFallbackResponse);
  }
  if (intent?.baseResponse || intent?.angryCustomerResponse) {
    return cleanText(isAngryCustomerText(text) && intent.angryCustomerResponse ? intent.angryCustomerResponse : intent.baseResponse);
  }
  if (example?.answer) {
    return cleanText(example.answer);
  }

  if (topic === "depositos") {
    return "Para poder revisar correctamente tu deposito, necesitamos que nos compartas correo registrado, AUTH ID, monto, fecha y hora del deposito, clave de rastreo y evidencia completa de la transferencia. Si fue SPEI, comparte tambien el CEP de Banxico en PDF para validar el estado de la operacion.";
  }
  if (topic === "retiros") {
    return "Para revisar tu retiro, necesitamos validar el estado actual en sistema. Por favor comparte correo registrado, AUTH ID, monto del retiro y fecha de solicitud. No podemos prometer aprobacion, pago o tiempo exacto sin la validacion interna correspondiente.";
  }
  if (topic === "juegos") {
    return "Para revisar el caso con el juego, necesitamos nombre exacto del juego, captura o video del error, hora aproximada, dispositivo utilizado y si estabas usando WiFi o datos moviles. Con esa informacion podremos validar el caso sin prometer reposicion antes de revisar evidencia.";
  }

  return "Para poder darte una respuesta correcta, necesitamos revisar el caso con la informacion disponible. Si falta algun dato, comparte correo registrado, AUTH ID, descripcion del problema y evidencia del error o movimiento para continuar con el seguimiento correspondiente.";
}

function inferTemplateConfidence(score) {
  const value = Number(score || 0);
  if (value >= 24) return 0.84;
  if (value >= 14) return 0.72;
  if (value >= 6) return 0.58;
  return 0.42;
}

function inferTemplateMissingData(intent, text) {
  if (!intent?.requiredData?.length) return [];
  const normalized = normalizeForSearch(text);
  return normalizeAiStringList(intent.requiredData)
    .filter((item) => !templateDataLooksPresent(item, normalized))
    .slice(0, 6);
}

function templateDataLooksPresent(item, normalizedText) {
  const normalizedItem = normalizeForSearch(item);
  const checks = [
    ["correo", /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i],
    ["auth", /\b(auth|id)\b.{0,8}\d{3,}/i],
    ["monto", /\$\s?\d+|\b\d+([.,]\d{2})?\b/],
    ["fecha", /\b\d{1,2}[/-]\d{1,2}|\b\d{4}-\d{2}-\d{2}\b|ayer|hoy/i],
    ["hora", /\b\d{1,2}:\d{2}\b|am|pm/i],
    ["clave", /[a-z0-9]{10,}/i],
    ["cep", /\bcep\b/i],
    ["captura", /captura|foto|imagen|video|evidencia/i],
    ["juego", /juego|casino|slot|nombre del juego/i],
    ["dispositivo", /android|iphone|ios|celular|telefono|chrome|safari|pc|computadora/i]
  ];
  const matched = checks.find(([keyword]) => normalizedItem.includes(keyword));
  if (!matched) return normalizedText.includes(normalizedItem);
  return matched[1].test(normalizedText);
}

function isAngryCustomerText(text) {
  const normalized = normalizeForSearch(text);
  return [
    "molesto",
    "enojado",
    "robo",
    "estafa",
    "fraude",
    "demanda",
    "queja",
    "siempre",
    "nunca",
    "pesimo",
    "ratero"
  ].some((word) => normalized.includes(word));
}

function buildOpenAiRequestBody({ model, account, aiConfig, message, context, examples, intentsDataset, intentCandidates }) {
  const vectorStoreId = String(aiConfig.vectorStoreId || optionalEnv("OPENAI_VECTOR_STORE_ID") || "").trim();
  const tools = vectorStoreId
    ? [{
      type: "file_search",
      vector_store_ids: [vectorStoreId],
      max_num_results: Number(aiConfig.fileSearchMaxResults || 3) || 3
    }]
    : undefined;

  return {
    model,
    instructions: buildAiInstructions(account, aiConfig, examples, intentsDataset, intentCandidates),
    input: buildAiInput(message, context),
    max_output_tokens: Math.min(Number(optionalEnv("OPENAI_MAX_OUTPUT_TOKENS", "650")) || 650, 650),
    reasoning: { effort: optionalEnv("OPENAI_REASONING_EFFORT", "low") || "low" },
    tools
  };
}

function buildAiInstructions(account, aiConfig = {}, examples = [], intentsDataset = null, intentCandidates = [], options = {}) {
  const compact = Boolean(options.compact);
  return [
    "# Instrucciones base",
    aiConfig.baseInstructions || "Eres el asistente interno de soporte de Betxico para agentes humanos.",
    "# Contexto operativo",
    aiConfig.businessContext || "",
    "# Tono",
    aiConfig.toneRules || "",
    "# Reglas de seguridad",
    aiConfig.safetyRules || "",
    "# Formato",
    aiConfig.defaultResponseFormat || "",
    buildIntentDatasetBlock(intentsDataset, intentCandidates, { compact }),
    buildStructuredClassificationBlock(Boolean(intentsDataset), { compact }),
    buildExamplesBlock(examples),
    `Agente activo: ${account.displayName || account.email || "sin nombre"}.`
  ].filter(Boolean).join("\n\n");
}

function buildIntentDatasetBlock(intentsDataset, candidates = [], options = {}) {
  if (!intentsDataset?.intents?.length) {
    return [
      "# Clasificacion de intents",
      "El archivo local de intents no esta disponible o no se pudo parsear. Usa la base documental, ejemplos aprobados y contexto del caso como fallback. Mantiene las reglas: no inventar causas, no prometer tiempos, pagos, bonos ni aprobaciones."
    ].join("\n");
  }

  const compact = Boolean(options.compact);
  const compactCandidates = candidates.map((intent) => ({
    intent: intent.intent,
    category: intent.category,
    riskLevel: intent.riskLevel,
    priority: intent.priority,
    description: intent.description,
    triggers: compact ? undefined : normalizeAiStringList(intent.triggers).slice(0, 8),
    subdiagnostics: compact ? normalizeAiStringList(intent.subdiagnostics).slice(0, 5) : normalizeAiStringList(intent.subdiagnostics).slice(0, 8),
    requiredData: normalizeAiStringList(intent.requiredData).slice(0, 8),
    responseRules: normalizeAiStringList(intent.responseRules).slice(0, compact ? 5 : 8),
    forbiddenPhrases: normalizeAiStringList(intent.forbiddenPhrases).slice(0, compact ? 4 : 6),
    doNotUseWhen: compact ? undefined : normalizeAiStringList(intent.doNotUseWhen).slice(0, 5),
    requiresTicket: intent.requiresTicket,
    requiresDocuments: intent.requiresDocuments,
    requiresScreenshot: intent.requiresScreenshot,
    canAutoRespond: intent.canAutoRespond
  }));

  const lines = [
    "# Dataset operativo de intents",
    `Version: ${intentsDataset.version || "sin version"}`,
    "Usa primero los candidatos relevantes. Si ninguno encaja, usa un intent general con confianza baja.",
    "No crees intents nuevos. Si hay variaciones menores, usa subdiagnosticos del intent universal.",
    `Candidatos relevantes (${compactCandidates.length}):`,
    JSON.stringify(compactCandidates, null, 2)
  ];

  if (!compact) {
    lines.splice(2, 0, `Intents disponibles: ${intentsDataset.intents.map((intent) => intent.intent).join(", ")}`);
  }

  return lines.join("\n");
}

function buildStructuredClassificationBlock(hasDataset, options = {}) {
  if (options.compact) {
    return [
      "# Salida estructurada obligatoria",
      "Clasifica con el dataset y responde solo JSON valido. Si faltan datos criticos, pidelos antes de diagnosticar. No inventes causas ni prometas tiempos, bonos, pagos o aprobaciones.",
      hasDataset ? "Usa selectedIntent del dataset." : "Sin dataset: usa intent general con confidence baja.",
      JSON.stringify({
        selectedIntent: "intent",
        subdiagnostic: "subdiagnostico",
        confidence: 0.0,
        missingData: ["dato faltante"],
        riskLevel: "low|medium|high",
        canAutoRespond: false,
        requiresTicket: false,
        requiresDocuments: false,
        requiresScreenshot: false,
        response: "Respuesta sugerida."
      })
    ].join("\n");
  }

  return [
    "# Salida estructurada obligatoria",
    "Antes de redactar, clasifica el caso con el dataset de intents y consulta la base documental disponible por File Search si existe.",
    "Si hay duda entre un intent general y uno especifico, usa el especifico solo si cambia la accion operativa; si no, usa el general con subdiagnostico.",
    "Si faltan datos criticos, la respuesta debe pedir esos datos antes de diagnosticar de mas.",
    "Si canAutoRespond es false, la respuesta debe quedar claramente como sugerencia para agente, no como mensaje automatico enviado sin revision.",
    hasDataset ? "Usa selectedIntent del dataset. No inventes nombres de intents." : "Si el dataset no esta disponible, usa selectedIntent general y confidence baja.",
    "Devuelve exclusivamente JSON valido con esta forma exacta, sin markdown ni texto adicional:",
    JSON.stringify({
      selectedIntent: "intent_del_dataset_o_general",
      subdiagnostic: "subdiagnostico_operativo",
      confidence: 0.0,
      missingData: ["dato faltante"],
      riskLevel: "low|medium|high",
      canAutoRespond: false,
      requiresTicket: false,
      requiresDocuments: false,
      requiresScreenshot: false,
      response: "Respuesta sugerida lista para el agente o para pedir datos faltantes."
    }, null, 2)
  ].join("\n");
}

function buildExamplesBlock(examples) {
  if (!examples.length) return "";
  return [
    "# Ejemplos aprobados de Betxico",
    ...examples.map((example, index) => [
      `Ejemplo ${index + 1} (${example.topic})`,
      `Situacion: ${example.question}`,
      `Respuesta aprobada: ${example.answer}`,
      example.notes ? `Notas internas: ${example.notes}` : ""
    ].filter(Boolean).join("\n"))
  ].join("\n\n");
}

function buildAiInput(message, context) {
  const blocks = [];
  if (context) {
    blocks.push(`Contexto disponible de la app:\n${context}`);
  }
  blocks.push(`Consulta del agente:\n${message}`);
  return blocks.join("\n\n");
}

function extractAiText(data) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const parts = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (typeof content.text === "string") {
        parts.push(content.text);
      }
    }
  }

  return parts.join("\n").trim() || "No pude generar una respuesta util. Intenta reformular la consulta.";
}

function loadIntentsDataset() {
  if (intentsDatasetCache !== null) return intentsDatasetCache;

  try {
    const parsed = JSON.parse(readFileSync(INTENTS_DATASET_PATH, "utf8"));
    intentsDatasetCache = parsed?.intents?.length ? parsed : null;
  } catch {
    intentsDatasetCache = null;
  }

  return intentsDatasetCache;
}

function loadFallbackTemplates() {
  if (fallbackTemplatesCache !== null) return fallbackTemplatesCache;

  try {
    const parsed = JSON.parse(readFileSync(FALLBACK_TEMPLATES_PATH, "utf8"));
    fallbackTemplatesCache = parsed?.templates?.length ? parsed.templates : [];
  } catch {
    fallbackTemplatesCache = [];
  }

  return fallbackTemplatesCache;
}

function mergeIntentDatasetWithFallbackTemplates(intentsDataset, fallbackTemplates = []) {
  if (!fallbackTemplates.length) return intentsDataset;
  const base = intentsDataset?.intents?.length
    ? { ...intentsDataset, intents: intentsDataset.intents.map((intent) => ({ ...intent })) }
    : { version: "fallback", intents: [] };
  const byIntent = new Map(base.intents.map((intent, index) => [intent.intent, index]));

  for (const template of fallbackTemplates) {
    if (!template?.intent || template.status !== "aprobada" || template.riskLevel !== "low" || template.mode !== "plantilla_segura") {
      continue;
    }
    const fallbackIntent = fallbackTemplateToIntent(template);
    const existingIndex = byIntent.get(fallbackIntent.intent);
    if (existingIndex === undefined) {
      byIntent.set(fallbackIntent.intent, base.intents.length);
      base.intents.push(fallbackIntent);
    } else {
      base.intents[existingIndex] = mergeFallbackIntent(base.intents[existingIndex], fallbackIntent);
    }
  }

  return base;
}

function fallbackTemplateToIntent(template) {
  return {
    intent: template.intent,
    category: template.category,
    description: `Plantilla segura aprobada para ${template.subcategory || template.intent}.`,
    triggers: normalizeAiStringList(template.triggers),
    subdiagnostics: normalizeAiStringList([template.subcategory]),
    requiredData: normalizeAiStringList(template.requiredData),
    responseRules: ["Usar solo cuando el caso coincida con la plantilla segura aprobada."],
    forbiddenPhrases: ["queda hoy", "te lo aseguro", "ya fue aprobado", "te damos un bono"],
    doNotUseWhen: normalizeAiStringList(template.doNotUseWhen),
    baseResponse: cleanText(template.response),
    angryCustomerResponse: cleanText(template.angryCustomerResponse),
    templateFallbackResponse: cleanText(template.response),
    templateFallbackAngryResponse: cleanText(template.angryCustomerResponse),
    internalRecommendation: "Fallback sin GPT desde plantillas aprobadas de Soporte 10.",
    requiresTicket: false,
    requiresDocuments: false,
    requiresScreenshot: false,
    canAutoRespond: template.canAutoRespond === true,
    relatedIntents: [],
    templateFallback: true
  };
}

function mergeFallbackIntent(existing, fallback) {
  return {
    ...existing,
    triggers: normalizeAiStringList([...(existing.triggers || []), ...(fallback.triggers || [])]),
    subdiagnostics: normalizeAiStringList([...(existing.subdiagnostics || []), ...(fallback.subdiagnostics || [])]),
    requiredData: normalizeAiStringList([...(existing.requiredData || []), ...(fallback.requiredData || [])]),
    responseRules: normalizeAiStringList([...(existing.responseRules || []), ...(fallback.responseRules || [])]),
    forbiddenPhrases: normalizeAiStringList([...(existing.forbiddenPhrases || []), ...(fallback.forbiddenPhrases || [])]),
    doNotUseWhen: normalizeAiStringList([...(existing.doNotUseWhen || []), ...(fallback.doNotUseWhen || [])]),
    templateFallbackResponse: fallback.templateFallbackResponse,
    templateFallbackAngryResponse: fallback.templateFallbackAngryResponse,
    canAutoRespond: existing.canAutoRespond === true || fallback.canAutoRespond === true,
    templateFallback: true
  };
}

function selectIntentCandidates(intentsDataset, text, limit = 8) {
  if (!intentsDataset?.intents?.length) return [];
  const normalized = normalizeForSearch(text);
  const words = new Set(normalized.split(/[^a-z0-9]+/).filter((word) => word.length >= 3));

  return intentsDataset.intents
    .map((intent) => {
      const haystack = normalizeForSearch([
        intent.intent,
        intent.category,
        intent.description,
        ...(intent.triggers || []),
        ...(intent.subdiagnostics || []),
        ...(intent.requiredData || [])
      ].join(" "));
      let score = 0;
      if (normalized.includes(normalizeForSearch(intent.intent))) score += 12;
      for (const trigger of intent.triggers || []) {
        if (normalized.includes(normalizeForSearch(trigger))) score += 8;
      }
      for (const subdiagnostic of intent.subdiagnostics || []) {
        if (normalized.includes(normalizeForSearch(subdiagnostic))) score += 4;
      }
      for (const word of words) {
        if (haystack.includes(word)) score += 1;
      }
      return { ...intent, score };
    })
    .filter((intent) => intent.score > 0)
    .sort((a, b) => b.score - a.score || String(a.intent).localeCompare(String(b.intent)))
    .slice(0, Math.max(3, Math.min(12, Number(limit) || 8)));
}

function parseAiClassification(text, intentsDataset) {
  const parsed = parseJsonObject(text);
  if (!parsed || typeof parsed !== "object") return null;

  const intents = new Set((intentsDataset?.intents || []).map((intent) => intent.intent));
  const selectedIntent = cleanText(parsed.selectedIntent).slice(0, 120);
  const normalizedIntent = intents.size && !intents.has(selectedIntent) ? "general" : selectedIntent;
  const confidence = clampConfidence(parsed.confidence);

  return {
    selectedIntent: normalizedIntent || "general",
    subdiagnostic: cleanText(parsed.subdiagnostic).slice(0, 160) || "sin_subdiagnostico_confirmado",
    confidence,
    missingData: normalizeAiStringList(parsed.missingData).slice(0, 12),
    riskLevel: normalizeRiskLevel(parsed.riskLevel),
    canAutoRespond: parsed.canAutoRespond === true,
    requiresTicket: parsed.requiresTicket === true,
    requiresDocuments: parsed.requiresDocuments === true,
    requiresScreenshot: parsed.requiresScreenshot === true,
    response: cleanText(parsed.response).slice(0, 8000) || "No pude generar una respuesta util. Intenta reformular la consulta."
  };
}

function parseJsonObject(text) {
  const clean = String(text || "").trim();
  if (!clean) return null;
  try {
    return JSON.parse(clean);
  } catch {
    const match = clean.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch {
      return null;
    }
  }
}

function normalizeAiStringList(value) {
  if (!Array.isArray(value)) return [];
  return value.map((item) => cleanText(item).slice(0, 240)).filter(Boolean);
}

function normalizeRiskLevel(value) {
  const clean = String(value || "").trim().toLowerCase();
  return ["low", "medium", "high"].includes(clean) ? clean : "medium";
}

function clampConfidence(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.max(0, Math.min(1, number));
}

function normalizeForSearch(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function cleanText(value) {
  return String(value || "").replace(/\u0000/g, "").trim();
}

function normalizeComparableText(value) {
  return String(value || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function normalizeSupportPayload(payload) {
  const ticket = payload?.ticket || {};
  const customer = payload?.customer || {};
  const livechat = payload?.livechat || {};
  const workflow = normalizeWorkflow(payload?.workflow || {});

  const summary = String(ticket.summary || "").trim();
  const description = String(ticket.description || ticket.notes || "").trim();
  const issueTypeId = String(ticket.issueTypeId || "").trim();
  const issueType = String(ticket.issueType || "Servicio al Cliente").trim();
  const destination = normalizeDestination(payload?.destination);
  const slackFields = normalizeSlackFields(payload?.slackFields || {});

  if (!summary || !description || (!issueTypeId && !issueType)) {
    const error = new Error("invalid_payload");
    error.statusCode = 400;
    throw error;
  }

  if ((destination === "slack" || destination === "both") && !hasRequiredSlackFields(slackFields, workflow)) {
    const error = new Error("invalid_slack_payload");
    error.statusCode = 400;
    throw error;
  }

  return {
    source: String(payload?.source || "livechat_agent_widget"),
    destination,
    workflow,
    livechat: {
      chatId: String(livechat.chatId || "").trim(),
      threadId: String(livechat.threadId || "").trim(),
      groupId: String(livechat.groupId || "").trim(),
      customerId: String(livechat.customerId || "").trim(),
      source: String(livechat.source || "").trim()
    },
    customer: {
      name: String(customer.name || "").trim(),
      email: String(customer.email || "").trim().toLowerCase(),
      authId: String(customer.authId || "").trim()
    },
    ticket: {
      issueTypeId,
      issueType,
      priority: String(ticket.priority || "Media").trim(),
      summary,
      description,
      category: String(ticket.category || issueType || "Soporte").trim(),
      labels: normalizeLabels(ticket.labels || "livechat soporte"),
      amplifyUrl: String(ticket.amplifyUrl || "").trim(),
      notes: String(ticket.notes || "").trim()
    },
    jiraFields: normalizeJiraFields(payload?.jiraFields || {}),
    slackFields,
    attachments: normalizeAttachments(payload?.attachments || [])
  };
}

function normalizeDestination(value) {
  const clean = String(value || "jira").trim().toLowerCase();
  return ["jira", "slack", "both"].includes(clean) ? clean : "jira";
}

function normalizeSlackFields(fields = {}) {
  return {
    agentName: String(fields.agentName || "").trim(),
    customerId: String(fields.customerId || "").trim(),
    customerEmail: String(fields.customerEmail || "").trim().toLowerCase(),
    game: String(fields.game || "").trim(),
    trackingKey: String(fields.trackingKey || "").trim(),
    amount: String(fields.amount || "").trim(),
    detail: String(fields.detail || "").trim()
  };
}

function normalizeWorkflow(workflow = {}) {
  return {
    id: String(workflow.id || "").trim(),
    label: String(workflow.label || workflow.name || workflow.id || "").trim(),
    slackRouteId: String(workflow.slackRouteId || workflow.routeId || "").trim(),
    slackTemplate: String(workflow.slackTemplate || workflow.template || "").trim(),
    messageOnly: Boolean(workflow.messageOnly),
    requiredSlackFields: normalizeStringList(workflow.requiredSlackFields || workflow.requiredFields || [])
  };
}

function hasRequiredSlackFields(fields = {}, workflow = {}) {
  const required = workflow.requiredSlackFields?.length
    ? workflow.requiredSlackFields
    : ["agentName", "customerId", "customerEmail", "trackingKey", "amount"];
  return required.every((field) => Boolean(fields[field]));
}

function normalizeStringList(values) {
  return Array.isArray(values)
    ? values.map((value) => String(value || "").trim()).filter(Boolean)
    : String(values || "").split(",").map((value) => value.trim()).filter(Boolean);
}

function normalizeLabels(value) {
  if (Array.isArray(value)) {
    return value.map((label) => String(label).trim()).filter(Boolean);
  }

  return String(value || "")
    .split(/[,\s]+/)
    .map((label) => label.trim())
    .filter(Boolean);
}

function normalizeJiraFields(fields) {
  return Object.entries(fields).reduce((acc, [fieldId, field]) => {
    const cleanFieldId = String(fieldId || "").trim();
    if (!cleanFieldId) return acc;

    acc[cleanFieldId] = {
      name: String(field?.name || cleanFieldId).trim(),
      value: field?.value ?? "",
      schema: {
        type: String(field?.schema?.type || "").trim(),
        items: String(field?.schema?.items || "").trim(),
        system: String(field?.schema?.system || "").trim(),
        custom: String(field?.schema?.custom || "").trim()
      }
    };
    return acc;
  }, {});
}

function normalizeAttachments(attachments) {
  if (!Array.isArray(attachments)) {
    return [];
  }

  return attachments.slice(0, 6).map((attachment) => ({
    filename: String(attachment?.filename || attachment?.name || "adjunto").trim(),
    contentType: String(attachment?.contentType || attachment?.type || "application/octet-stream").trim(),
    dataBase64: String(attachment?.dataBase64 || "").trim()
  })).filter((attachment) => attachment.dataBase64);
}
