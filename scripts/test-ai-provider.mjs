import assert from "node:assert/strict";
import {
  AI_PROVIDER_GROQ,
  AI_PROVIDER_OPENAI,
  buildGroqChatCompletionBody,
  extractAiResponseText,
  isProviderQuotaExceeded,
  isProviderRateLimit,
  isProviderUnsupportedJsonMode,
  redactExternalAiText,
  resolveAiProvider
} from "../lib/ai-provider.js";

const groqProvider = resolveAiProvider({
  GROQ_API_KEY: "gsk_test",
  GROQ_MODEL: "qwen/qwen3-32b",
  GROQ_MAX_COMPLETION_TOKENS: "900"
});
assert.equal(groqProvider.provider, AI_PROVIDER_GROQ);
assert.equal(groqProvider.model, "qwen/qwen3-32b");
assert.equal(groqProvider.maxOutputTokens, 900);

const explicitOpenAi = resolveAiProvider({
  AI_PROVIDER: "openai",
  GROQ_API_KEY: "gsk_test",
  OPENAI_API_KEY: "sk_test"
});
assert.equal(explicitOpenAi.provider, AI_PROVIDER_OPENAI);
assert.equal(explicitOpenAi.apiKey, "sk_test");

const body = buildGroqChatCompletionBody({
  model: "qwen/qwen3-32b",
  instructions: "Responde solo JSON.",
  input: "Consulta de soporte.",
  maxOutputTokens: 700,
  jsonMode: true
});
assert.equal(body.model, "qwen/qwen3-32b");
assert.equal(body.messages.length, 2);
assert.equal(body.messages[0].role, "system");
assert.equal(body.max_completion_tokens, 700);
assert.deepEqual(body.response_format, { type: "json_object" });

const noJsonBody = buildGroqChatCompletionBody({ jsonMode: false });
assert.equal(noJsonBody.response_format, undefined);

assert.equal(
  extractAiResponseText({
    choices: [{ message: { content: "{\"response\":\"Listo\"}" } }]
  }),
  "{\"response\":\"Listo\"}"
);
assert.equal(extractAiResponseText({ output_text: "Respuesta" }), "Respuesta");

const redacted = redactExternalAiText("correo cliente@test.com AUTH ID AB12345 cuenta 123456789012345678 CURP GOCG900101HDFRRR09 RFC GOCG900101AA1 telefono 5512345678");
assert.ok(redacted.includes("[EMAIL_REDACTED]"));
assert.ok(redacted.includes("AUTH [ID_REDACTED]"));
assert.ok(redacted.includes("[BANK_DATA_REDACTED]"));
assert.ok(redacted.includes("[CURP_REDACTED]"));
assert.ok(redacted.includes("[RFC_REDACTED]"));
assert.ok(redacted.includes("[PHONE_REDACTED]"));
assert.ok(!redacted.includes("cliente@test.com"));

assert.equal(isProviderRateLimit({ status: 429, error: { message: "Rate limit reached" } }), true);
assert.equal(isProviderQuotaExceeded({ error: { message: "Spend limit exceeded" } }), true);
assert.equal(isProviderUnsupportedJsonMode({ status: 400, error: { message: "response_format unsupported" } }), true);

console.log("Proveedor IA valido.");
