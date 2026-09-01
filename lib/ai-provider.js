export const AI_PROVIDER_GROQ = "groq";
export const AI_PROVIDER_OPENAI = "openai";

export const DEFAULT_GROQ_MODEL = "llama-3.3-70b-versatile";
const DEFAULT_MAX_OUTPUT_TOKENS = 650;

export function resolveAiProvider(env = process.env) {
  const requested = clean(env.SUPPORT_AI_PROVIDER || env.AI_PROVIDER).toLowerCase();
  const provider = [AI_PROVIDER_GROQ, AI_PROVIDER_OPENAI].includes(requested)
    ? requested
    : clean(env.GROQ_API_KEY)
      ? AI_PROVIDER_GROQ
      : AI_PROVIDER_OPENAI;

  if (provider === AI_PROVIDER_GROQ) {
    return {
      provider,
      apiKey: clean(env.GROQ_API_KEY),
      model: clean(env.GROQ_MODEL || env.SUPPORT_AI_MODEL) || DEFAULT_GROQ_MODEL,
      maxOutputTokens: clampInt(
        env.GROQ_MAX_COMPLETION_TOKENS || env.AI_MAX_OUTPUT_TOKENS || env.OPENAI_MAX_OUTPUT_TOKENS,
        DEFAULT_MAX_OUTPUT_TOKENS,
        128,
        1200
      ),
      jsonMode: String(env.GROQ_JSON_MODE || "true").trim().toLowerCase() !== "false"
    };
  }

  return {
    provider,
    apiKey: clean(env.OPENAI_API_KEY),
    model: clean(env.OPENAI_MODEL),
    maxOutputTokens: clampInt(
      env.OPENAI_MAX_OUTPUT_TOKENS || env.AI_MAX_OUTPUT_TOKENS,
      DEFAULT_MAX_OUTPUT_TOKENS,
      128,
      1200
    ),
    jsonMode: true
  };
}

export function buildGroqChatCompletionBody({
  model = DEFAULT_GROQ_MODEL,
  instructions = "",
  input = "",
  maxOutputTokens = DEFAULT_MAX_OUTPUT_TOKENS,
  jsonMode = true
} = {}) {
  const body = {
    model: clean(model) || DEFAULT_GROQ_MODEL,
    messages: [
      { role: "system", content: clean(instructions) || "Eres un asistente interno de soporte." },
      { role: "user", content: clean(input) }
    ],
    temperature: 0.2,
    top_p: 0.9,
    max_completion_tokens: clampInt(maxOutputTokens, DEFAULT_MAX_OUTPUT_TOKENS, 128, 1200)
  };

  if (jsonMode) {
    body.response_format = { type: "json_object" };
  }

  return body;
}

export async function requestGroqChatCompletion(apiKey, body, fetchImpl = fetch) {
  const response = await fetchImpl("https://api.groq.com/openai/v1/chat/completions", {
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

export function extractAiResponseText(data = {}) {
  if (typeof data.output_text === "string" && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const chatText = data.choices?.[0]?.message?.content;
  if (typeof chatText === "string" && chatText.trim()) {
    return chatText.trim();
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

export function isProviderRateLimit(data) {
  const status = Number(data?.status || 0);
  const code = String(data?.error?.code || data?.error?.type || "").toLowerCase();
  const message = String(data?.error?.message || data?.error || "").toLowerCase();
  return status === 429
    || code.includes("rate")
    || message.includes("rate limit")
    || message.includes("tokens per min")
    || message.includes("tpm")
    || message.includes("rpm");
}

export function isProviderQuotaExceeded(data) {
  const code = String(data?.error?.code || data?.error?.type || "").toLowerCase();
  const message = String(data?.error?.message || data?.error || "").toLowerCase();
  return code.includes("insufficient_quota")
    || code.includes("quota")
    || message.includes("exceeded your current quota")
    || message.includes("check your plan and billing")
    || message.includes("billing details")
    || message.includes("spend limit")
    || message.includes("quota");
}

export function isProviderUnsupportedJsonMode(data) {
  const status = Number(data?.status || 0);
  const message = String(data?.error?.message || data?.error || "").toLowerCase();
  return status === 400
    && (message.includes("response_format")
      || message.includes("json mode")
      || message.includes("json_object")
      || message.includes("schema"));
}

export function redactExternalAiText(text = "") {
  return String(text || "")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/giu, "[EMAIL_REDACTED]")
    .replace(/\b[A-Z]{4}\d{6}[A-Z0-9]{8}\b/giu, "[CURP_REDACTED]")
    .replace(/\b[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}\b/giu, "[RFC_REDACTED]")
    .replace(/\b(?:auth\s*id|auth|id)\s*[:#-]?\s*[A-Z0-9_-]{4,}\b/giu, "AUTH [ID_REDACTED]")
    .replace(/\b(?:clabe|cuenta|tarjeta)\s*[:#-]?\s*\d[\d\s-]{7,}\b/giu, "[BANK_DATA_REDACTED]")
    .replace(/\b(?:tel(?:efono)?|cel(?:ular)?|whatsapp)\s*[:#-]?\s*(?:\+?52\s*)?\d[\d\s-]{8,}\b/giu, "[PHONE_REDACTED]")
    .replace(/\b\d{12,18}\b/gu, "[NUMBER_REDACTED]");
}

function clean(value = "") {
  return String(value || "").trim();
}

function clampInt(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(number)));
}
