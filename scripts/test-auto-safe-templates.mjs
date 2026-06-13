import { findSafeAutoTemplateReply, isSimpleGreeting } from "../lib/safe-template-replies.js";

const fixtures = [
  { message: "Quiero bono sin depósito", mode: "auto_send_safe", expectedSend: true, expectedIntent: "bono_sin_deposito_no_disponible" },
  { message: "Tengo comprobante pero no CEP", mode: "auto_send_safe", expectedSend: true, expectedIntent: "deposito_comprobante_no_sustituye_cep" },
  { message: "Dónde saco el CEP", mode: "auto_send_safe", expectedSend: true, expectedIntent: "deposito_comprobante_no_sustituye_cep" },
  { message: "No puedo entrar a mi cuenta", mode: "auto_send_safe", expectedSend: true, expectedIntent: "acceso_cambio_password_pedir_captura" },
  { message: "Olvidé mi contraseña", mode: "auto_send_safe", expectedSend: true, expectedIntent: "acceso_cambio_password_pedir_captura" },
  { message: "Hay cashback?", mode: "auto_send_safe", expectedSend: true, expectedIntent: "bono_no_disponible_cashback_lealtad" },
  { message: "Quiero bono sin depósito pero voy a demandar", mode: "auto_send_safe", expectedSend: false, expectedReason: "risk_signal" },
  { message: "Hola", mode: "auto_send_safe", expectedSend: false, expectedReason: "simple_greeting" },
  { message: "No puedo retirar", mode: "auto_send_safe", expectedSend: false, expectedReason: "risk_signal" },
  { message: "Mi retiro no llega", mode: "auto_send_safe", expectedSend: false, expectedReason: "risk_signal" },
  { message: "Me bloquearon la cuenta", mode: "auto_send_safe", expectedSend: false, expectedReason: "risk_signal" },
  { message: "El juego me quitó dinero", mode: "auto_send_safe", expectedSend: false, expectedReason: "risk_signal" },
  { message: "No me pagó mi ganancia", mode: "auto_send_safe", expectedSend: false, expectedReason: "risk_signal" },
  { message: "Voy a demandar", mode: "auto_send_safe", expectedSend: false, expectedReason: "risk_signal" },
  { message: "Quiero cerrar mi cuenta", mode: "auto_send_safe", expectedSend: false, expectedReason: "risk_signal" },
  { message: "Me están robando", mode: "auto_send_safe", expectedSend: false, expectedReason: "risk_signal" },
  { message: "Me robaron", mode: "auto_send_safe", expectedSend: false, expectedReason: "risk_signal" },
  { message: "Quiero bono sin depósito", mode: undefined, expectedSend: false, expectedReason: "safe_template_mode_not_auto" },
  { message: "Quiero bono sin depósito", mode: "config_error", expectedSend: false, expectedReason: "safe_template_mode_not_auto" },
  { message: "Quiero bono sin depósito", mode: "suggest_only", expectedSend: false, expectedReason: "safe_template_mode_not_auto" },
  { message: "Quiero bono sin depósito", mode: "disabled", expectedSend: false, expectedReason: "safe_template_mode_not_auto" },
  { message: "Quiero bono sin depósito", mode: "auto_send_safe", authorType: "agent", expectedSend: false, expectedReason: "not_customer_message" },
  { message: "Quiero bono sin depósito", mode: "auto_send_safe", alreadySent: true, expectedSend: false, expectedReason: "safe_template_already_sent" },
  { message: "Quiero bono sin depósito", mode: "auto_send_safe", previousUsefulCustomerMessage: true, expectedSend: false, expectedReason: "not_first_useful_customer_message" }
];

const results = fixtures.map((fixture) => {
  const decision = decideAutoSend(fixture);
  const errors = [];

  if (decision.shouldSend !== fixture.expectedSend) {
    errors.push(`expected shouldSend=${fixture.expectedSend}, got ${decision.shouldSend}`);
  }
  if (fixture.expectedIntent && decision.intent !== fixture.expectedIntent) {
    errors.push(`expected intent=${fixture.expectedIntent}, got ${decision.intent || "none"}`);
  }
  if (fixture.expectedReason && decision.reason !== fixture.expectedReason) {
    errors.push(`expected reason=${fixture.expectedReason}, got ${decision.reason}`);
  }
  if (decision.shouldSend && decision.wouldCallOpenAi) {
    errors.push("OpenAI would be called for safe auto template");
  }
  if (decision.shouldSend && !decision.reply) {
    errors.push("empty reply");
  }

  if (errors.length) {
    throw new Error(`${fixture.message}: ${errors.join("; ")}`);
  }

  return {
    message: fixture.message,
    mode: fixture.mode,
    authorType: fixture.authorType || "customer",
    shouldSend: decision.shouldSend,
    intent: decision.intent || null,
    reason: decision.reason,
    wouldCallOpenAi: decision.wouldCallOpenAi
  };
});

console.log(JSON.stringify({ ok: true, fixtures: results }, null, 2));

function decideAutoSend({ message, mode, authorType = "customer", alreadySent = false, previousUsefulCustomerMessage = false }) {
  if (mode !== "auto_send_safe") {
    return { shouldSend: false, reason: "safe_template_mode_not_auto", wouldCallOpenAi: false };
  }
  if (!["customer", "visitor"].includes(String(authorType || "").toLowerCase())) {
    return { shouldSend: false, reason: "not_customer_message", wouldCallOpenAi: false };
  }
  if (alreadySent) {
    return { shouldSend: false, reason: "safe_template_already_sent", wouldCallOpenAi: false };
  }
  if (previousUsefulCustomerMessage) {
    return { shouldSend: false, reason: "not_first_useful_customer_message", wouldCallOpenAi: false };
  }
  if (isSimpleGreeting(message)) {
    return { shouldSend: false, reason: "simple_greeting", wouldCallOpenAi: false };
  }

  const match = findSafeAutoTemplateReply(message, "", { requireAutoSendAllowed: true });
  if (!match.matched) {
    return { shouldSend: false, reason: match.reason, wouldCallOpenAi: false, riskBlocked: match.riskBlocked };
  }

  return {
    shouldSend: true,
    reason: "auto_safe_template_sent",
    intent: match.intent,
    category: match.category,
    reply: match.reply,
    wouldCallOpenAi: false
  };
}
