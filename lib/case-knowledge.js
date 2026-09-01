import { readFileSync } from "node:fs";
import { redactExternalAiText } from "./ai-provider.js";
import {
  CASE_TOOL_STATUSES,
  buildCaseToolQueryHash,
  normalizeCaseToolResult
} from "./case-operation-contracts.js";

const KNOWLEDGE = loadKnowledge();
const MAX_RESULTS = 5;
const DEFAULT_TTL_SECONDS = 24 * 60 * 60;
const CATEGORY_BY_WORKFLOW = Object.freeze({
  withdrawal: "withdrawal",
  deposit: "deposit",
  bonus_rollover: "bonus_rollover",
  kyc_identity: "kyc_identity",
  devwallet: "devwallet",
  game_access: "casino",
  casino_win_missing: "casino",
  sports_bet: "sports_bet",
  bank_account: "devwallet",
  account_closure: "responsible_gaming",
  ticket_followup: "ticket_followup"
});
const CONCEPT_GROUPS = [
  ["retiro", "retirar", "retirada", "cobro"],
  ["deposito", "depositar", "spei", "transferencia"],
  ["kyc", "verificacion", "identidad"],
  ["ine", "identificacion", "documento", "credencial"],
  ["selfie", "rostro", "fotografia"],
  ["domicilio", "direccion", "residencia"],
  ["bono", "promocion", "regalo", "beneficio"],
  ["rollover", "liberacion", "requisito", "apostar"],
  ["pendiente", "retenido", "revision", "analisis", "espera"],
  ["reflejado", "acreditado", "llego", "recibido"],
  ["rechazado", "cancelado", "devuelto", "reversa"],
  ["juego", "casino", "ronda", "proveedor"],
  ["apuesta", "deportiva", "ticket", "momio"],
  ["cuenta", "perfil", "acceso", "sesion"],
  ["cerrar", "bloquear", "autoexclusion", "compulsion"],
  ["molesto", "queja", "fraude", "profeco", "supervisor"]
];
const CONCEPT_INDEX = buildConceptIndex(CONCEPT_GROUPS);
const GOVERNANCE_IDS = [
  "governance.principios-y-jerarquia-de-evidencia",
  "governance.errores-prohibidos"
];

export function lookupCaseKnowledge({ caseRecord = {}, now = () => new Date().toISOString() } = {}) {
  const checkedAt = currentIso(now);
  const query = buildKnowledgeQuery(caseRecord);
  const ranked = KNOWLEDGE.records
    .map((record) => ({ record, score: scoreRecord(record, query) }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score || left.record.id.localeCompare(right.record.id));

  const selected = [];
  const scenarioCandidates = query.category
    ? ranked.filter((item) => item.record.category === query.category)
    : ranked;
  for (const item of scenarioCandidates) {
    if (selected.length >= 3) break;
    if (item.record.kind === "scenario" || item.record.kind === "template") selected.push(item);
  }
  const categoryPolicy = query.category
    ? KNOWLEDGE.records.find((record) => record.kind === "policy" && record.category === query.category)
    : null;
  if (categoryPolicy && !selected.some((item) => item.record.id === categoryPolicy.id)) {
    selected.unshift({ record: categoryPolicy, score: 100 });
  }
  for (const id of GOVERNANCE_IDS) {
    if (selected.length >= MAX_RESULTS) break;
    const record = KNOWLEDGE.records.find((item) => item.id === id);
    if (record && !selected.some((item) => item.record.id === id)) {
      selected.push({ record, score: 1 });
    }
  }
  for (const item of ranked) {
    if (selected.length >= MAX_RESULTS) break;
    if (!selected.some((selectedItem) => selectedItem.record.id === item.record.id)) selected.push(item);
  }

  const records = selected.slice(0, MAX_RESULTS).map(({ record, score }) => publicKnowledgeRecord(record, score));
  return normalizeCaseToolResult({
    tool: "case.knowledge.lookup",
    source: "manual_knowledge",
    status: records.length ? CASE_TOOL_STATUSES.AVAILABLE : CASE_TOOL_STATUSES.NOT_FOUND,
    verified: true,
    checkedAt,
    ttlSeconds: DEFAULT_TTL_SECONDS,
    query: {
      type: "case_context",
      hash: buildCaseToolQueryHash({
        workflow: query.workflow,
        category: query.category,
        concepts: [...query.concepts].sort()
      })
    },
    data: {
      knowledgeId: KNOWLEDGE.knowledgeId,
      sourceHash: KNOWLEDGE.source?.sha256 || "",
      scope: KNOWLEDGE.scope,
      guidanceOnly: true,
      canAuthorizeActions: false,
      canConfirmCaseOutcome: false,
      count: records.length,
      records
    }
  }, { now: checkedAt });
}

export function getCaseKnowledgeMetadata() {
  return {
    knowledgeId: KNOWLEDGE.knowledgeId,
    title: KNOWLEDGE.title,
    scope: KNOWLEDGE.scope,
    sourceHash: KNOWLEDGE.source?.sha256 || "",
    records: Number(KNOWLEDGE.counts?.records || KNOWLEDGE.records.length),
    scenarios: Number(KNOWLEDGE.counts?.scenarios || 0),
    sources: Number(KNOWLEDGE.counts?.sources || 0)
  };
}

function buildKnowledgeQuery(caseRecord) {
  const workflow = String(caseRecord.workflow?.id || "").trim().toLowerCase();
  const category = CATEGORY_BY_WORKFLOW[workflow] || "";
  const customerText = (Array.isArray(caseRecord.events) ? caseRecord.events : [])
    .filter((event) => ["customer", "visitor"].includes(String(event?.role || event?.authorType || "").toLowerCase()))
    .map((event) => redactExternalAiText(String(event?.text || "")))
    .slice(-8)
    .join(" ");
  const operationalText = [
    caseRecord.operationalDecision?.title,
    caseRecord.operationalDecision?.reason,
    ...sourceTexts(caseRecord.systemFacts?.caseJiraLookup, "jira"),
    ...sourceTexts(caseRecord.systemFacts?.caseSlackLookup, "slack")
  ].filter(Boolean).join(" ");
  const normalized = normalizeText(`${workflow} ${customerText} ${operationalText}`);
  return {
    workflow,
    category,
    tokens: expandConcepts(tokenize(normalized)),
    concepts: conceptsForText(normalized)
  };
}

function sourceTexts(result, source) {
  if (result?.status !== "available" || result?.verified !== true) return [];
  return (Array.isArray(result?.data?.records) ? result.data.records : []).slice(0, 6).flatMap((record) => source === "jira"
    ? [record?.untrustedContent?.summary, record?.untrustedContent?.description, record?.untrustedContent?.latestComment]
    : [record?.untrustedContent?.reason, record?.untrustedContent?.note]);
}

function scoreRecord(record, query) {
  const categoryMatch = query.category && record.category === query.category;
  const titleTokens = expandConcepts(tokenize(record.title));
  const recordTokens = expandConcepts(tokenize(record.searchText));
  let score = categoryMatch ? 20 : 0;
  for (const token of query.tokens) {
    if (titleTokens.has(token)) score += 6;
    else if (recordTokens.has(token)) score += 2;
  }
  const recordConcepts = conceptsForText(record.searchText);
  for (const concept of query.concepts) {
    if (recordConcepts.has(concept)) score += 3;
  }
  if (record.kind === "scenario") score += 2;
  if (!categoryMatch && score < 8 && record.category !== "governance") return 0;
  return score;
}

function publicKnowledgeRecord(record, score) {
  return {
    id: clean(record.id, 140),
    kind: clean(record.kind, 30),
    category: clean(record.category, 60),
    section: clean(record.section, 120),
    title: clean(record.title, 180),
    relevance: Math.max(1, Math.min(100, Math.round(score))),
    review: stringList(record.review, 5, 240),
    avoid: stringList(record.avoid, 5, 240),
    guidance: stringList(record.guidance, 8, 320),
    customerDraft: clean(record.customerDraft, 1200),
    escalation: clean(record.escalation, 500),
    rules: stringList(record.rules, 12, 500),
    sourceRefs: stringList(record.sourceRefs, 8, 20),
    freshness: {
      mode: clean(record?.freshness?.mode, 30),
      status: clean(record?.freshness?.status, 30),
      reason: clean(record?.freshness?.reason, 300)
    },
    requiredEvidence: (Array.isArray(record.requiredEvidence) ? record.requiredEvidence : []).slice(0, 6).map((item) => ({
      source: clean(item?.source, 50),
      maxAgeSeconds: Number(item?.maxAgeSeconds || 0)
    })),
    humanGate: {
      reviewRequired: true,
      canAutoSend: false,
      canAuthorize: false
    }
  };
}

function buildConceptIndex(groups) {
  const index = new Map();
  groups.forEach((group, groupIndex) => {
    for (const word of group) index.set(normalizeText(word), { groupIndex, group });
  });
  return index;
}

function expandConcepts(tokens) {
  const expanded = new Set(tokens);
  for (const token of tokens) {
    const match = CONCEPT_INDEX.get(token);
    if (match) match.group.forEach((word) => expanded.add(normalizeText(word)));
  }
  return expanded;
}

function conceptsForText(value) {
  const tokens = tokenize(value);
  const concepts = new Set();
  for (const token of tokens) {
    const match = CONCEPT_INDEX.get(token);
    if (match) concepts.add(`concept_${match.groupIndex}`);
  }
  return concepts;
}

function tokenize(value) {
  return new Set(normalizeText(value).split(" ").filter((token) => token.length >= 3));
}

function normalizeText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function stringList(value, limit, maxLength) {
  return (Array.isArray(value) ? value : []).map((item) => clean(item, maxLength)).filter(Boolean).slice(0, limit);
}

function clean(value, maxLength) {
  return String(value || "").replace(/\s+/gu, " ").trim().slice(0, maxLength);
}

function currentIso(now) {
  const value = typeof now === "function" ? now() : now;
  const parsed = Date.parse(String(value || ""));
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date().toISOString();
}

function loadKnowledge() {
  const parsed = JSON.parse(readFileSync(
    new URL("../knowledge/betxico-support-manual.v1.json", import.meta.url),
    "utf8"
  ));
  if (parsed?.schemaVersion !== 2 || parsed?.scope !== "simulator_preview") {
    throw new Error("invalid_simulator_knowledge_index");
  }
  if (!Array.isArray(parsed.records) || Number(parsed?.counts?.scenarios || 0) !== 91) {
    throw new Error("incomplete_simulator_knowledge_index");
  }
  return Object.freeze(parsed);
}
