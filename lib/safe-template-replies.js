import { readFileSync } from "node:fs";

const FALLBACK_TEMPLATES_PATH = new URL("../docs/betxico_fallback_templates_v1.json", import.meta.url);
let fallbackTemplatesCache = null;

export function findSafeAutoTemplateReply(message = "", context = "", options = {}) {
  const text = `${cleanText(message)}\n${cleanText(context)}`.trim();
  if (!text) {
    return { matched: false, riskBlocked: false, reason: "empty_message" };
  }
  if (isSimpleGreeting(text)) {
    return { matched: false, riskBlocked: false, reason: "simple_greeting" };
  }
  if (hasRiskSignals(message, context)) {
    return { matched: false, riskBlocked: true, reason: "risk_signal" };
  }

  const selected = selectSafeFallbackTemplate(loadSafeFallbackTemplates(), text, options);
  if (!selected) {
    return { matched: false, riskBlocked: false, reason: "no_safe_template_match" };
  }

  const reply = cleanText(isAngryCustomerText(text) && selected.angryCustomerResponse
    ? selected.angryCustomerResponse
    : selected.response);

  if (!reply) {
    return { matched: false, riskBlocked: false, reason: "empty_template_reply" };
  }

  return {
    matched: true,
    intent: selected.intent,
    category: selected.category,
    subdiagnostic: selected.subcategory || "plantilla_segura",
    reply,
    riskBlocked: false,
    reason: "matched_safe_template",
    confidence: inferTemplateConfidence(selected.score),
    template: selected
  };
}

export function hasRiskSignals(message = "", context = "") {
  const normalized = normalizeForSearch(`${message}\n${context}`);
  const checks = [
    /\bretiro\b|\bretirar\b|\bwithdraw\b/u,
    /failed|congelad|revision|revisando/u,
    /bloquead|bloquearon|suspendid|desactivad/u,
    /cerrar.*cuenta|cierre de cuenta|cancelar.*cuenta|autoexclusion|auto exclusion/u,
    /suplantacion|fraude|fraudul|estafa|robo|robaron|roband/u,
    /demanda|demandar|legal|abogado|profeco|condusef/u,
    /ganancia no reflejad|premio no aparece|no me pago|saldo descontad|quito dinero|quito mi saldo|me quito|me quit[oó]/u,
    /molesto|enojad|indignad|queja|reclamo/u
  ];
  return checks.some((pattern) => pattern.test(normalized));
}

export function isSimpleGreeting(value = "") {
  const normalized = normalizeForSearch(value).replace(/[^a-z0-9\s]/gu, " ").replace(/\s+/gu, " ").trim();
  if (!normalized) return true;
  const greetings = new Set([
    "hola",
    "buen dia",
    "buenos dias",
    "buenas tardes",
    "buenas noches",
    "hey",
    "ola",
    "hi",
    "hello"
  ]);
  return greetings.has(normalized) || normalized.split(" ").length <= 2 && /^(hola|buenas|buenos|hey|ola)$/u.test(normalized);
}

export function loadSafeFallbackTemplates() {
  if (fallbackTemplatesCache !== null) return fallbackTemplatesCache;

  try {
    const parsed = JSON.parse(readFileSync(FALLBACK_TEMPLATES_PATH, "utf8"));
    fallbackTemplatesCache = Array.isArray(parsed?.templates) ? parsed.templates : [];
  } catch {
    fallbackTemplatesCache = [];
  }

  return fallbackTemplatesCache;
}

function selectSafeFallbackTemplate(templates = [], text = "", options = {}) {
  const requireAutoSendAllowed = options.requireAutoSendAllowed === true;
  const normalized = normalizeForSearch(text);
  const words = new Set(normalized.split(/[^a-z0-9]+/u).filter((word) => word.length >= 4));
  const matches = templates
    .filter((template) => template?.status === "aprobada"
      && template.riskLevel === "low"
      && template.mode === "plantilla_segura"
      && template.canAutoRespond === true
      && (!requireAutoSendAllowed || template.auto_send_allowed === true))
    .map((template) => {
      let score = 0;
      let strongTriggerMatches = 0;
      for (const trigger of template.triggers || []) {
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

function isAngryCustomerText(text) {
  return /molest|enoja|robo|fraude|estafa|demanda|queja|pesim|terrible|indign/i.test(String(text || ""));
}

function inferTemplateConfidence(score) {
  const value = Number(score || 0);
  if (value >= 24) return 0.84;
  if (value >= 14) return 0.72;
  if (value >= 6) return 0.58;
  return 0.42;
}

function normalizeForSearch(value) {
  return cleanText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase();
}

function cleanText(value) {
  return String(value || "").replace(/\s+/gu, " ").trim();
}
