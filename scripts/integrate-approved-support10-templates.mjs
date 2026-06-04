import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT_DIR = dirname(dirname(fileURLToPath(import.meta.url)));
const DEFAULT_APPROVED_PATH = "tmp/livechat-response-mining/plantillas_aprobadas_soporte10_v1.json";
const DEFAULT_CURATED_PATH = "tmp/livechat-response-mining/plantillas_curadas_soporte10_v1.json";
const INTENTS_PATH = "docs/betxico_intents_dataset_v1.json";
const FALLBACK_PATH = "docs/betxico_fallback_templates_v1.json";
const KNOWLEDGE_PATH = "docs/betxico_base_conocimiento_operativa_v1.md";
const REPORT_PATH = "tmp/livechat-response-mining/integration_dry_run_soporte10_v1.md";
const SECTION_TITLE = "## Curación Soporte 10 V1";

const args = parseArgs(process.argv.slice(2));
const mode = args.applyKv ? "apply-kv" : args.apply ? "apply" : "dry-run";

const approvedPath = args.approved || DEFAULT_APPROVED_PATH;
const curatedPath = args.curated || DEFAULT_CURATED_PATH;

const approved = readJson(approvedPath);
const curated = existsSync(toAbs(curatedPath)) ? readJson(curatedPath) : null;
const intentsDataset = readJson(INTENTS_PATH);
const fallbackExisting = existsSync(toAbs(FALLBACK_PATH)) ? readJson(FALLBACK_PATH) : null;
const knowledgeExisting = readFileSync(toAbs(KNOWLEDGE_PATH), "utf8");

const approvedTemplates = normalizeArray(approved.templates)
  .filter((template) => template.estado_revision === "aprobada");
const safeTemplates = approvedTemplates.filter(isSafeFallbackTemplate);
const kvCandidates = approvedTemplates.filter((template) => template.modo === "ejemplo_estilo");
const blockedFromFallback = approvedTemplates.filter((template) => !isSafeFallbackTemplate(template));

const intentResult = buildUpdatedIntents(intentsDataset, approvedTemplates);
const fallbackResult = buildFallbackTemplates(fallbackExisting, safeTemplates, approvedPath);
const knowledgeResult = buildKnowledgeMarkdown(knowledgeExisting, curated, approvedTemplates);
const sensitiveHits = findSensitiveHits({
  intents: intentResult.dataset,
  fallback: fallbackResult.dataset,
  knowledgeSection: knowledgeResult.section
});

const report = buildReport({
  mode,
  approvedPath,
  curatedPath,
  approvedCount: approvedTemplates.length,
  safeCount: safeTemplates.length,
  blockedFromFallback,
  kvCandidates,
  intentResult,
  fallbackResult,
  knowledgeResult,
  sensitiveHits
});

if (mode !== "dry-run") {
  if (sensitiveHits.length) {
    throw new Error(`Se detectaron posibles datos sensibles. Revisa antes de aplicar: ${sensitiveHits.join(", ")}`);
  }
  writeJson(INTENTS_PATH, intentResult.dataset);
  writeJson(FALLBACK_PATH, fallbackResult.dataset);
  writeFileSync(toAbs(KNOWLEDGE_PATH), knowledgeResult.markdown);
}

if (mode === "apply-kv") {
  await writeKvCandidates(kvCandidates);
}

writeFileSync(toAbs(REPORT_PATH), report);

console.log(`Modo: ${mode}`);
console.log(`Plantillas aprobadas: ${approvedTemplates.length}`);
console.log(`Plantillas seguras para fallback: ${safeTemplates.length}`);
console.log(`Intents nuevos: ${intentResult.created.length}`);
console.log(`Intents actualizados: ${intentResult.updated.length}`);
console.log(`Candidatos KV preparados: ${kvCandidates.length}`);
console.log(`Reporte: ${REPORT_PATH}`);
if (mode === "dry-run") {
  console.log("No se escribieron intents, fallback, base MD ni KV. Usa --apply para archivos locales.");
}

function buildUpdatedIntents(dataset, templates) {
  const next = {
    ...dataset,
    updatedAt: new Date().toISOString(),
    intents: normalizeArray(dataset.intents).map((intent) => ({ ...intent }))
  };
  const created = [];
  const updated = [];
  const unchanged = [];

  for (const template of templates) {
    const patch = templateToIntent(template);
    const index = next.intents.findIndex((intent) => intent.intent === patch.intent);
    if (index === -1) {
      next.intents.push(patch);
      created.push(patch.intent);
      continue;
    }

    const existing = next.intents[index];
    const merged = mergeIntent(existing, patch);
    if (JSON.stringify(existing) === JSON.stringify(merged)) {
      unchanged.push(patch.intent);
    } else {
      next.intents[index] = merged;
      updated.push(patch.intent);
    }
  }

  next.intents.sort((a, b) => String(a.category).localeCompare(String(b.category)) || String(a.intent).localeCompare(String(b.intent)));
  assertNoDuplicateStrings(next.intents.map((intent) => intent.intent), "intents");
  return { dataset: next, created, updated, unchanged };
}

function templateToIntent(template) {
  const safe = isSafeFallbackTemplate(template);
  return {
    intent: template.intent,
    category: template.categoria,
    subcategory: template.subcategoria || "",
    priority: mapPriority(template.prioridad),
    riskLevel: mapRisk(template.riesgo),
    description: `Plantilla curada Soporte 10 V1 para ${template.subcategoria || template.intent}.`,
    triggers: uniqueStrings(template.triggers),
    subdiagnostics: uniqueStrings([template.subcategoria]),
    requiredData: uniqueStrings(template.datos_requeridos),
    responseRules: uniqueStrings([
      ...(template.condiciones_para_usar || []),
      ...(template.reglas_internas || [])
    ]),
    forbiddenPhrases: [
      "te lo aseguro",
      "queda hoy",
      "en unos minutos",
      "ya fue aprobado",
      "te damos un bono",
      "te reponemos el saldo"
    ],
    doNotUseWhen: uniqueStrings(template.no_usar_si),
    baseResponse: cleanForUniversalTemplate(template.respuesta_base),
    angryCustomerResponse: cleanForUniversalTemplate(template.respuesta_cliente_molesto),
    internalRecommendation: uniqueStrings(template.reglas_internas).join(" "),
    requiresTicket: false,
    requiresDocuments: hasAny(template.datos_requeridos, ["cep", "comprobante", "ine", "selfie", "captura", "evidencia"]),
    requiresScreenshot: hasAny(template.datos_requeridos, ["captura", "video", "error"]),
    canAutoRespond: safe,
    relatedIntents: [],
    templateRef: {
      source: "support10_curated_v1",
      mode: template.modo,
      status: template.estado_revision,
      safeFallback: safe
    }
  };
}

function mergeIntent(existing, patch) {
  return {
    ...existing,
    category: existing.category || patch.category,
    subcategory: existing.subcategory || patch.subcategory,
    priority: existing.priority || patch.priority,
    riskLevel: safestRisk(existing.riskLevel, patch.riskLevel),
    description: existing.description || patch.description,
    triggers: uniqueStrings([...(existing.triggers || []), ...(patch.triggers || [])]),
    subdiagnostics: uniqueStrings([...(existing.subdiagnostics || []), ...(patch.subdiagnostics || [])]),
    requiredData: uniqueStrings([...(existing.requiredData || []), ...(patch.requiredData || [])]),
    responseRules: uniqueStrings([...(existing.responseRules || []), ...(patch.responseRules || [])]),
    forbiddenPhrases: uniqueStrings([...(existing.forbiddenPhrases || []), ...(patch.forbiddenPhrases || [])]),
    doNotUseWhen: uniqueStrings([...(existing.doNotUseWhen || []), ...(patch.doNotUseWhen || [])]),
    baseResponse: existing.baseResponse || patch.baseResponse,
    angryCustomerResponse: existing.angryCustomerResponse || patch.angryCustomerResponse,
    internalRecommendation: existing.internalRecommendation || patch.internalRecommendation,
    requiresTicket: Boolean(existing.requiresTicket || patch.requiresTicket),
    requiresDocuments: Boolean(existing.requiresDocuments || patch.requiresDocuments),
    requiresScreenshot: Boolean(existing.requiresScreenshot || patch.requiresScreenshot),
    canAutoRespond: existing.canAutoRespond === true && patch.canAutoRespond === true,
    relatedIntents: uniqueStrings([...(existing.relatedIntents || []), ...(patch.relatedIntents || [])]),
    templateRef: {
      ...(existing.templateRef || {}),
      ...patch.templateRef
    }
  };
}

function buildFallbackTemplates(existing, templates, sourcePath) {
  const base = existing?.templates?.length ? existing : {
    version: "1.0.0",
    updatedAt: "",
    project: "Betxico Soporte",
    description: "Plantillas seguras aprobadas para fallback sin GPT.",
    source: "",
    templates: []
  };
  const next = {
    ...base,
    updatedAt: new Date().toISOString(),
    source: sourcePath,
    templates: normalizeArray(base.templates).map((template) => ({ ...template }))
  };
  const created = [];
  const updated = [];

  for (const template of templates) {
    const fallback = {
      intent: template.intent,
      category: template.categoria,
      subcategory: template.subcategoria || "",
      riskLevel: "low",
      mode: "plantilla_segura",
      status: template.estado_revision,
      canAutoRespond: true,
      triggers: uniqueStrings(template.triggers),
      requiredData: uniqueStrings(template.datos_requeridos),
      doNotUseWhen: uniqueStrings(template.no_usar_si),
      response: cleanForUniversalTemplate(template.respuesta_base),
      angryCustomerResponse: cleanForUniversalTemplate(template.respuesta_cliente_molesto),
      source: "support10_curated_v1"
    };
    const index = next.templates.findIndex((item) => item.intent === fallback.intent);
    if (index === -1) {
      next.templates.push(fallback);
      created.push(fallback.intent);
    } else {
      next.templates[index] = { ...next.templates[index], ...fallback };
      updated.push(fallback.intent);
    }
  }

  next.templates.sort((a, b) => String(a.category).localeCompare(String(b.category)) || String(a.intent).localeCompare(String(b.intent)));
  assertNoDuplicateStrings(next.templates.map((template) => template.intent), "fallback templates");
  return { dataset: next, created, updated };
}

function buildKnowledgeMarkdown(markdown, curated, approvedTemplates) {
  const reglas = normalizeArray(curated?.reglasGlobales);
  const arboles = curated?.arbolesDecision || {};
  const section = [
    SECTION_TITLE,
    "",
    "Esta seccion resume la curacion operativa de respuestas reales de Soporte 10. Sirve como conocimiento profundo para File Search; no reemplaza el JSON de intents ni las plantillas seguras.",
    "",
    "### Reglas globales",
    "",
    ...(reglas.length ? reglas.map((rule) => `- ${rule}`) : ["- Sin reglas nuevas detectadas."]),
    "",
    "### Arboles de decision",
    "",
    ...Object.entries(arboles).flatMap(([category, steps]) => [
      `#### ${category}`,
      "",
      ...normalizeArray(steps).map((step) => `- ${step}`),
      ""
    ]),
    "### Plantillas aprobadas",
    "",
    ...approvedTemplates.map((template) => [
      `#### ${template.intent}`,
      "",
      `- Categoria: ${template.categoria}`,
      `- Subcategoria: ${template.subcategoria || "sin subcategoria"}`,
      `- Riesgo: ${template.riesgo}`,
      `- Modo: ${template.modo}`,
      `- Usar cuando: ${uniqueStrings(template.condiciones_para_usar).join("; ") || "caso coincidente con triggers"}`,
      `- No usar si: ${uniqueStrings(template.no_usar_si).join("; ") || "hay excepcion o falta validacion"}`,
      `- Datos requeridos: ${uniqueStrings(template.datos_requeridos).join("; ") || "sin datos adicionales"}`,
      ""
    ].join("\n")),
    ""
  ].join("\n");

  return {
    section,
    markdown: replaceSection(markdown, SECTION_TITLE, section)
  };
}

function replaceSection(markdown, title, section) {
  const index = markdown.indexOf(title);
  if (index === -1) {
    return `${markdown.replace(/\s+$/u, "")}\n\n${section}`;
  }
  const nextIndex = markdown.indexOf("\n## ", index + title.length);
  if (nextIndex === -1) {
    return `${markdown.slice(0, index).replace(/\s+$/u, "")}\n\n${section}`;
  }
  return `${markdown.slice(0, index).replace(/\s+$/u, "")}\n\n${section}\n${markdown.slice(nextIndex + 1)}`;
}

function buildReport(data) {
  const lines = [
    "# Dry-run integracion Soporte 10 V1",
    "",
    `Modo: ${data.mode}`,
    `Archivo aprobado: ${data.approvedPath}`,
    `Archivo curado: ${data.curatedPath}`,
    "",
    "## Resumen",
    "",
    `- Plantillas aprobadas leidas: ${data.approvedCount}`,
    `- Plantillas seguras para fallback sin GPT: ${data.safeCount}`,
    `- Intents nuevos: ${data.intentResult.created.length}`,
    `- Intents actualizados: ${data.intentResult.updated.length}`,
    `- Plantillas fallback nuevas: ${data.fallbackResult.created.length}`,
    `- Plantillas fallback actualizadas: ${data.fallbackResult.updated.length}`,
    `- Candidatos KV preparados: ${data.kvCandidates.length}`,
    `- Posibles datos sensibles detectados: ${data.sensitiveHits.length}`,
    "",
    "## Intents nuevos",
    "",
    ...(data.intentResult.created.length ? data.intentResult.created.map((item) => `- ${item}`) : ["- Ninguno"]),
    "",
    "## Intents actualizados",
    "",
    ...(data.intentResult.updated.length ? data.intentResult.updated.map((item) => `- ${item}`) : ["- Ninguno"]),
    "",
    "## Bloqueadas para respuesta automatica",
    "",
    ...(data.blockedFromFallback.length ? data.blockedFromFallback.map((item) => `- ${item.intent} (${item.riesgo}, ${item.modo})`) : ["- Ninguna"]),
    "",
    "## Candidatos KV",
    "",
    ...(data.kvCandidates.length ? data.kvCandidates.map((item) => `- ${item.intent}`) : ["- Ninguno. No se escribira KV sin --apply-kv."]),
    "",
    "## Seguridad",
    "",
    data.sensitiveHits.length
      ? `Revisar posibles datos sensibles: ${data.sensitiveHits.join(", ")}`
      : "No se detectaron correos, links de LiveChat ni tokens en las salidas generadas.",
    "",
    "## Siguiente paso",
    "",
    data.mode === "dry-run"
      ? "Ejecuta `npm run ai:integrate-support10 -- --apply` para escribir solo archivos locales."
      : "Archivos locales aplicados. KV no se toca salvo que ejecutes con `--apply-kv`.",
    ""
  ];
  return lines.join("\n");
}

async function writeKvCandidates(candidates) {
  if (!candidates.length) {
    console.log("KV: sin candidatos de ejemplo_estilo para escribir.");
    return;
  }
  const { addAiExample } = await import("../lib/ai-training.js");
  for (const template of candidates) {
    await addAiExample({
      topic: template.categoria,
      situation: cleanForUniversalTemplate(template.subcategoria || template.intent),
      answer: cleanForUniversalTemplate(template.respuesta_base),
      notes: "Ejemplo aprobado desde curacion Soporte 10 V1.",
      status: "activo"
    });
  }
  console.log(`KV: ${candidates.length} ejemplos escritos.`);
}

function findSensitiveHits(payload) {
  const text = JSON.stringify(payload);
  const hits = [];
  if (/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/iu.test(text)) hits.push("email");
  if (/livechatinc\.com\/chats\//iu.test(text)) hits.push("livechat-link");
  if (/(sk-proj-|ATATT|us-south1:|Basic\s+[A-Za-z0-9+/=]{20,})/u.test(text)) hits.push("token");
  return hits;
}

function isSafeFallbackTemplate(template) {
  return template.estado_revision === "aprobada"
    && template.riesgo === "bajo"
    && template.modo === "plantilla_segura";
}

function hasAny(values, needles) {
  const text = normalizeForSearch(normalizeArray(values).join(" "));
  return needles.some((needle) => text.includes(normalizeForSearch(needle)));
}

function safestRisk(a, b) {
  const rank = { low: 1, medium: 2, high: 3 };
  const left = mapRisk(a);
  const right = mapRisk(b);
  return rank[right] > rank[left] ? right : left;
}

function mapRisk(value) {
  const normalized = normalizeForSearch(value);
  if (normalized.includes("alto") || normalized === "high") return "high";
  if (normalized.includes("medio") || normalized === "medium") return "medium";
  return "low";
}

function mapPriority(value) {
  const normalized = normalizeForSearch(value);
  if (normalized.includes("alta") || normalized === "high") return "high";
  if (normalized.includes("baja") || normalized === "low") return "low";
  return "medium";
}

function cleanForUniversalTemplate(value) {
  return cleanText(value)
    .replace(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/giu, "[correo]")
    .replace(/https:\/\/my\.livechatinc\.com\/chats\/[A-Z0-9]+/giu, "[chat]")
    .replace(/\bT[A-Z0-9]{6,}\b/gu, "[chat_id]");
}

function uniqueStrings(values) {
  const seen = new Set();
  const result = [];
  for (const value of normalizeArray(values)) {
    const cleaned = cleanText(value);
    if (!cleaned) continue;
    const key = normalizeForSearch(cleaned);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
  }
  return result;
}

function assertNoDuplicateStrings(values, label) {
  const seen = new Set();
  for (const value of values) {
    const key = normalizeForSearch(value);
    if (seen.has(key)) throw new Error(`Duplicado en ${label}: ${value}`);
    seen.add(key);
  }
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter((item) => item !== null && item !== undefined) : [];
}

function cleanText(value) {
  return String(value || "").replace(/\s+/gu, " ").trim();
}

function normalizeForSearch(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .trim();
}

function readJson(path) {
  return JSON.parse(readFileSync(toAbs(path), "utf8"));
}

function writeJson(path, data) {
  writeFileSync(toAbs(path), `${JSON.stringify(data, null, 2)}\n`);
}

function toAbs(path) {
  return path.startsWith("/") ? path : `${ROOT_DIR}/${path}`;
}

function parseArgs(argv) {
  const parsed = { apply: false, applyKv: false };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--apply") parsed.apply = true;
    else if (arg === "--apply-kv") parsed.applyKv = true;
    else if (arg === "--dry-run") parsed.dryRun = true;
    else if (arg === "--approved") parsed.approved = argv[++index];
    else if (arg === "--curated") parsed.curated = argv[++index];
    else throw new Error(`Argumento no soportado: ${arg}`);
  }
  return parsed;
}
