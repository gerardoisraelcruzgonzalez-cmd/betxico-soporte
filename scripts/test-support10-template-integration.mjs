import { readFileSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const FALLBACK_PATH = `${ROOT_DIR}/docs/betxico_fallback_templates_v1.json`;

const fallbackDataset = JSON.parse(readFileSync(FALLBACK_PATH, "utf8"));

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
  const selected = selectSafeFallbackTemplate(fallbackDataset.templates || [], fixture.message);
  const wouldCallOpenAi = !selected;
  const errors = [];

  if (fixture.expectedFallback && !selected) {
    errors.push("se esperaba fallback seguro, pero no hubo match");
  }
  if (!fixture.expectedFallback && selected) {
    errors.push(`no debia responder automatico, pero selecciono ${selected.intent}`);
  }
  if (fixture.expectedIntent && selected?.intent !== fixture.expectedIntent) {
    errors.push(`intent esperado ${fixture.expectedIntent}, recibido ${selected?.intent || "sin intent"}`);
  }
  if (fixture.expectedFallback && wouldCallOpenAi) {
    errors.push("OpenAI se llamaria aunque habia fallback seguro");
  }
  if (!fixture.expectedFallback && !wouldCallOpenAi) {
    errors.push("OpenAI no se llamaria aunque no habia fallback seguro");
  }
  if (selected && selected.riskLevel !== "low") {
    errors.push("fallback seleccionado no es riesgo bajo");
  }
  if (selected && selected.mode !== "plantilla_segura") {
    errors.push("fallback seleccionado no es plantilla_segura");
  }
  if (selected && selected.status !== "aprobada") {
    errors.push("fallback seleccionado no esta aprobado");
  }
  if (selected && selected.canAutoRespond !== true) {
    errors.push("fallback seleccionado no puede autoresponder");
  }
  if (selected && !cleanText(selected.response)) {
    errors.push("respuesta vacia");
  }
  if (selected && containsSensitiveData(selected.response)) {
    errors.push("respuesta contiene posible dato sensible");
  }
  if (selected && promisesExactTime(selected.response)) {
    errors.push("respuesta promete tiempo exacto");
  }

  if (errors.length) {
    throw new Error(`${fixture.message}: ${errors.join("; ")}`);
  }

  return {
    message: fixture.message,
    selectedIntent: selected?.intent || null,
    category: selected?.category || null,
    risk: selected?.riskLevel || null,
    safeTemplateFallback: Boolean(selected),
    wouldCallOpenAi
  };
});

console.log(JSON.stringify({ ok: true, fixtures: results }, null, 2));

function selectSafeFallbackTemplate(templates = [], text = "") {
  if (!templates.length || hasHighRiskSupportSignal(text)) return null;

  const normalized = normalize(text);
  const words = new Set(normalized.split(/[^a-z0-9]+/u).filter((word) => word.length >= 4));
  const matches = templates
    .filter((template) => template?.status === "aprobada"
      && template.riskLevel === "low"
      && template.mode === "plantilla_segura"
      && template.canAutoRespond === true)
    .map((template) => {
      let score = 0;
      let strongTriggerMatches = 0;
      for (const trigger of template.triggers || []) {
        const normalizedTrigger = normalize(trigger);
        if (!normalizedTrigger || normalizedTrigger.length < 4) continue;
        if (normalized.includes(normalizedTrigger)) {
          score += 16;
          strongTriggerMatches += 1;
        } else if (isSafePartialTriggerMatch(normalized, normalizedTrigger)) {
          score += 9;
          strongTriggerMatches += 1;
        }
      }

      const haystack = normalize([
        template.intent,
        template.category,
        template.subcategory,
        ...(template.triggers || [])
      ].join(" "));
      for (const word of words) {
        if (haystack.includes(word)) score += 1;
      }

      if (template.category === "depositos" && /\b(deposito|deposite|transferencia|spei|cep|comprobante|saldo)\b/iu.test(normalized)) score += 4;
      if (template.category === "bonos_promociones" && /\b(bono|promocion|cashback)\b/iu.test(normalized)) score += 4;
      if (template.category === "acceso_cuenta" && /\b(entrar|cuenta|contrasena|login|iniciar sesion)\b/iu.test(normalized)) score += 4;
      if (template.category === "kyc_documentos" && /\b(ine|selfie|documento|verificacion)\b/iu.test(normalized)) score += 4;

      return { ...template, score, strongTriggerMatches };
    })
    .filter((template) => template.score >= 14 && template.strongTriggerMatches >= 1)
    .sort((a, b) => b.score - a.score || String(a.intent).localeCompare(String(b.intent)));

  return matches[0] || null;
}

function isSafePartialTriggerMatch(normalizedText, normalizedTrigger) {
  const triggerWords = normalizedTrigger.split(/[^a-z0-9]+/u).filter((word) => word.length >= 4);
  if (triggerWords.length < 2) return false;
  const matched = triggerWords.filter((word) => normalizedText.includes(word)).length;
  return matched >= Math.min(2, triggerWords.length);
}

function hasHighRiskSupportSignal(text = "") {
  const normalized = normalize(text);
  const checks = [
    /\bretiro\b|\bretirar\b|\bwithdraw\b/u,
    /failed|congelad|revision|revisando/u,
    /bloquead|bloquearon|suspendid|desactivad/u,
    /cerrar cuenta|cierre de cuenta|cancelar cuenta|autoexclusion|auto exclusion/u,
    /suplantacion|fraude|fraudul|estafa|robo/u,
    /demanda|demandar|legal|abogado|profeco|condusef/u,
    /ganancia no reflejad|premio no aparece|no me pago|saldo descontad|quito dinero|quito mi saldo|me quito|me quit[oó]/u,
    /molesto|enojad|indignad|queja|reclamo/u
  ];
  return checks.some((pattern) => pattern.test(normalized));
}

function containsSensitiveData(value) {
  return /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/iu.test(value)
    || /livechatinc\.com\/chats\//iu.test(value)
    || /(sk-proj-|ATATT|us-south1:|Basic\s+[A-Za-z0-9+/=]{20,})/u.test(value);
}

function promisesExactTime(value) {
  return /\b(en\s+\d+\s*(minutos|horas|dias)|hoy queda|queda hoy|manana queda|en unas horas)\b/iu.test(value);
}

function cleanText(value) {
  return String(value || "").replace(/\s+/gu, " ").trim();
}

function normalize(value) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase();
}
