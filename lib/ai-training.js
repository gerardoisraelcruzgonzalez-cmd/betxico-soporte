import crypto from "node:crypto";
import { optionalEnv } from "./http.js";

const EXAMPLES_KEY = "support:ai:examples";
const FEEDBACK_KEY = "support:ai:feedback";
const TOPICS = new Set(["depositos", "retiros", "kyc", "bonos", "juegos", "cierres", "escalacion", "general"]);

export async function listAiExamples() {
  return normalizeExamples(await kvGet(EXAMPLES_KEY).catch(() => []));
}

export async function saveAiExamples(examples) {
  const normalized = normalizeExamples(examples).slice(0, 300);
  await kvSet(EXAMPLES_KEY, normalized);
  return normalized;
}

export async function addAiExample(payload, account = {}) {
  const examples = await listAiExamples();
  const next = normalizeExample({
    ...payload,
    id: payload.id || crypto.randomUUID(),
    createdBy: account.email || "",
    createdAt: payload.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });
  const filtered = examples.filter((example) => example.id !== next.id);
  await saveAiExamples([next, ...filtered]);
  return next;
}

export async function addAiFeedback(payload, account = {}) {
  const feedback = normalizeFeedbackList(await kvGet(FEEDBACK_KEY).catch(() => []));
  const next = {
    id: crypto.randomUUID(),
    topic: normalizeTopic(payload.topic),
    question: cleanText(payload.question).slice(0, 4000),
    answer: cleanText(payload.answer).slice(0, 8000),
    correction: cleanText(payload.correction).slice(0, 8000),
    status: String(payload.status || "pending").trim(),
    createdBy: account.email || "",
    createdAt: new Date().toISOString()
  };
  await kvSet(FEEDBACK_KEY, [next, ...feedback].slice(0, 300));
  return next;
}

export async function selectRelevantAiExamples({ message = "", context = "", topic = "", limit = 5 } = {}) {
  const examples = (await listAiExamples()).filter((example) => example.enabled !== false);
  const inferredTopic = normalizeTopic(topic) || inferTopic(`${message}\n${context}`);
  const normalizedText = normalizeText(`${message}\n${context}`);
  const words = new Set(normalizedText.split(/[^a-z0-9]+/).filter((word) => word.length >= 3));

  return examples
    .map((example) => {
      const haystack = normalizeText(`${example.topic} ${example.question} ${example.answer} ${example.notes}`);
      let score = example.topic === inferredTopic ? 8 : 0;
      for (const word of words) {
        if (haystack.includes(word)) score += 1;
      }
      return { ...example, score };
    })
    .filter((example) => example.score > 0)
    .sort((a, b) => b.score - a.score || String(b.updatedAt || b.createdAt).localeCompare(String(a.updatedAt || a.createdAt)))
    .slice(0, Math.max(1, Math.min(8, Number(limit) || 5)));
}

export function inferTopic(text) {
  const normalized = normalizeText(text);
  const checks = [
    ["depositos", ["deposito", "spei", "cep", "clave de rastreo", "transferencia", "monto"]],
    ["retiros", ["retiro", "retirar", "rechazo", "banco", "liquidacion"]],
    ["kyc", ["kyc", "ine", "documentos", "selfie", "verificacion", "validacion"]],
    ["bonos", ["bono", "promocion", "rollover", "10%"]],
    ["juegos", ["juego", "casino", "tirada", "ganancia", "proveedor"]],
    ["cierres", ["cierre", "sesion", "sesiones", "autoexclusion", "cerrar cuenta"]],
    ["escalacion", ["escalar", "escalacion", "jira", "proveedor", "revision"]]
  ];
  return checks.find(([, keywords]) => keywords.some((keyword) => normalized.includes(normalizeText(keyword))))?.[0] || "general";
}

function normalizeExamples(examples) {
  if (!Array.isArray(examples)) return [];
  return examples.map(normalizeExample).filter((example) => example.question && example.answer);
}

function normalizeExample(example = {}) {
  return {
    id: String(example.id || crypto.randomUUID()).trim(),
    topic: normalizeTopic(example.topic),
    question: cleanText(example.question).slice(0, 4000),
    answer: cleanText(example.answer).slice(0, 8000),
    notes: cleanText(example.notes).slice(0, 2000),
    enabled: example.enabled !== false,
    createdBy: String(example.createdBy || "").trim(),
    createdAt: String(example.createdAt || "").trim(),
    updatedAt: String(example.updatedAt || "").trim()
  };
}

function normalizeFeedbackList(items) {
  return Array.isArray(items) ? items : [];
}

function normalizeTopic(value) {
  const clean = String(value || "general").trim().toLowerCase();
  return TOPICS.has(clean) ? clean : "general";
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function cleanText(value) {
  return String(value || "").replace(/\u0000/g, "").trim();
}

async function kvGet(key) {
  const response = await kvRequest(["GET", key]);
  return response?.result ? JSON.parse(response.result) : null;
}

async function kvSet(key, value) {
  await kvRequest(["SET", key, JSON.stringify(value)]);
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
