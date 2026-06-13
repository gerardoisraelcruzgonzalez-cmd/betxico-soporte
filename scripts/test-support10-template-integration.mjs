import { findSafeAutoTemplateReply } from "../lib/safe-template-replies.js";

const fixtures = [
  {
    message: "Quiero bono sin depósito",
    expectedIntent: "bono_sin_deposito_no_disponible",
    expectedFallback: true
  },
  {
    message: "Hice transferencia y no tengo saldo",
    expectedIntent: "deposito_spei_no_reflejado_pedir_cep",
    expectedFallback: true
  },
  {
    message: "Tengo comprobante pero no CEP",
    expectedIntent: "deposito_comprobante_no_sustituye_cep",
    expectedFallback: true
  },
  {
    message: "No puedo entrar a mi cuenta",
    expectedIntent: "acceso_cambio_password_pedir_captura",
    expectedFallback: true
  },
  {
    message: "No puedo retirar",
    expectedFallback: false
  },
  {
    message: "Me bloquearon la cuenta",
    expectedFallback: false
  },
  {
    message: "El juego me quitó dinero",
    expectedFallback: false
  },
  {
    message: "Voy a demandar",
    expectedFallback: false
  }
];

const results = fixtures.map((fixture) => {
  const match = findSafeAutoTemplateReply(fixture.message);
  const wouldCallOpenAi = !match.matched;
  const errors = [];

  if (fixture.expectedFallback && !match.matched) {
    errors.push(`se esperaba fallback seguro, razon ${match.reason}`);
  }
  if (!fixture.expectedFallback && match.matched) {
    errors.push(`no debia responder automatico, pero selecciono ${match.intent}`);
  }
  if (fixture.expectedIntent && match.intent !== fixture.expectedIntent) {
    errors.push(`intent esperado ${fixture.expectedIntent}, recibido ${match.intent || "sin intent"}`);
  }
  if (fixture.expectedFallback && wouldCallOpenAi) {
    errors.push("OpenAI se llamaria aunque habia fallback seguro");
  }
  if (!fixture.expectedFallback && !wouldCallOpenAi) {
    errors.push("OpenAI no se llamaria aunque no habia fallback seguro");
  }
  if (match.matched && !match.reply) {
    errors.push("respuesta vacia");
  }
  if (match.matched && containsSensitiveData(match.reply)) {
    errors.push("respuesta contiene posible dato sensible");
  }
  if (match.matched && promisesExactTime(match.reply)) {
    errors.push("respuesta promete tiempo exacto");
  }

  if (errors.length) {
    throw new Error(`${fixture.message}: ${errors.join("; ")}`);
  }

  return {
    message: fixture.message,
    selectedIntent: match.intent || null,
    category: match.category || null,
    risk: match.matched ? "low" : null,
    safeTemplateFallback: match.matched,
    wouldCallOpenAi
  };
});

console.log(JSON.stringify({ ok: true, fixtures: results }, null, 2));

function containsSensitiveData(value) {
  return /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/iu.test(value)
    || /livechatinc\.com\/chats\//iu.test(value)
    || /(sk-proj-|ATATT|us-south1:|Basic\s+[A-Za-z0-9+/=]{20,})/u.test(value);
}

function promisesExactTime(value) {
  return /\b(en\s+\d+\s*(minutos|horas|dias)|hoy queda|queda hoy|manana queda|en unas horas)\b/iu.test(value);
}
