import crypto from "node:crypto";
import { optionalEnv } from "./http.js";
import { configuredConnectorAgent } from "./connector-agent-auth.js";

const PREFIX = "support:bob-bridge:";
// A closure can legitimately take several minutes. Keep its record long enough
// for the agent to see the final verification and for supervisors to audit it.
const JOB_TTL_SECONDS = 60 * 60 * 24 * 30;
const MAX_PENDING_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const HISTORY_KEY = `${PREFIX}history`;
const RETRY_DELAYS_MS = [30_000, 60_000, 2 * 60_000, 5 * 60_000];
const JIRA_TICKET_LOCK_TTL_SECONDS = 5 * 60;

export async function createBobJob({ ownerEmail, customerId, reportedGame = "", chatId = "", customer = {} }) {
  const id = crypto.randomUUID();
  const connectorMode = configuredConnectorAgent("bob", ownerEmail) ? "agent" : "legacy";
  const job = {
    id,
    ownerEmail,
    customerId,
    reportedGame: normaliseReportedGame(reportedGame),
    chatId,
    customer: normaliseBobCustomer(customer, customerId),
    connectorMode,
    status: "pending",
    attempts: 0,
    retryAt: "",
    lastError: "",
    createdAt: new Date().toISOString()
  };
  await saveJob(job);
  await command(["ZADD", HISTORY_KEY, String(Date.now()), id]);
  await command(["EXPIRE", HISTORY_KEY, String(JOB_TTL_SECONDS)]);
  await command(["RPUSH", queueKey(ownerEmail, connectorMode), id]);
  return job;
}

export async function updateBobJobCustomer(id, customer = {}) {
  const job = await getBobJob(id);
  if (!job) return null;
  const incoming = normaliseBobCustomer(customer, job.customerId);
  const updated = {
    ...job,
    customer: {
      ...(job.customer || {}),
      ...Object.fromEntries(Object.entries(incoming).filter(([, value]) => value))
    }
  };
  await saveJob(updated);
  return updated;
}

export async function claimBobJob(ownerEmail = "") {
  for (let index = 0; index < 20; index += 1) {
    const id = await command(["LPOP", queueKey(ownerEmail, ownerEmail ? "agent" : "legacy")]);
    if (!id) return null;
    const job = await getBobJob(id);
    if (!job || !["pending", "retry_waiting"].includes(job.status)) continue;
    if (job.status === "retry_waiting" && Date.parse(job.retryAt || "") > Date.now()) {
      await command(["RPUSH", queueKey(job.ownerEmail, job.connectorMode), id]);
      return null;
    }
    if (Date.now() - Date.parse(job.createdAt || 0) > MAX_PENDING_AGE_MS) {
      await saveJob({ ...job, status: "failed", error: "bob_job_expired", completedAt: new Date().toISOString() });
      continue;
    }
    const processing = {
      ...job,
      status: "processing",
      retryAt: "",
      startedAt: new Date().toISOString(),
      progress: { step: "consulting", message: "Consultando sesiones en BoB.", updatedAt: new Date().toISOString() }
    };
    await saveJob(processing);
    return processing;
  }
  return null;
}

function queueKey(ownerEmail, mode) {
  const email = String(ownerEmail || "").trim().toLowerCase();
  return mode === "agent" && email ? `${PREFIX}queue:agent:${email}` : `${PREFIX}queue`;
}

export async function completeBobJob(id, result, error = "") {
  const job = await getBobJob(id);
  if (!job) return null;
  const completedAt = new Date().toISOString();
  const mergedResult = error ? undefined : mergeBobResults(job.partialResult, result);
  const completed = {
    ...job,
    status: error ? "failed" : "completed",
    result: mergedResult,
    error,
    completedAt,
    progress: {
      step: error ? "failed" : "completed",
      message: error ? "El cierre no pudo completarse." : "Cierre verificado en BoB.",
      updatedAt: completedAt
    }
  };
  await saveJob(completed);
  return completed;
}

// A browser action can succeed immediately before a transient bridge failure.
// Preserve every confirmed session so a retry reports the whole operation.
export async function recordBobJobCheckpoint(id, checkpoint = {}) {
  const job = await getBobJob(id);
  if (!job || job.status !== "processing") return null;
  const updated = {
    ...job,
    partialResult: mergeBobResults(job.partialResult, checkpoint),
    progress: {
      ...(job.progress || {}),
      updatedAt: new Date().toISOString()
    }
  };
  await saveJob(updated);
  return updated;
}

export async function beginBobJiraTicket(id) {
  const job = await getBobJob(id);
  if (!job || job.status !== "completed") return { state: "unavailable", job };
  if (job.jiraTicket?.status === "created") return { state: "created", job };

  const lockKey = `${PREFIX}jira-ticket-lock:${id}`;
  const acquired = await command(["SET", lockKey, "1", "EX", String(JIRA_TICKET_LOCK_TTL_SECONDS), "NX"]);
  if (acquired !== "OK") return { state: "busy", job };

  const startedAt = new Date().toISOString();
  const claimed = {
    ...job,
    jiraTicket: {
      ...(job.jiraTicket || {}),
      status: "creating",
      attemptedAt: startedAt,
      error: ""
    }
  };
  await saveJob(claimed);
  return { state: "claimed", job: claimed };
}

export async function finishBobJiraTicket(id, ticket = {}, error = "") {
  const job = await getBobJob(id);
  if (!job) return null;
  const updatedAt = new Date().toISOString();
  const jiraTicket = error
    ? {
        ...(job.jiraTicket || {}),
        status: "failed",
        error: String(error).slice(0, 180),
        completedAt: updatedAt
      }
    : {
        status: "created",
        key: String(ticket.key || ""),
        id: String(ticket.id || ""),
        url: String(ticket.url || ""),
        reused: Boolean(ticket.reused),
        createdAt: updatedAt,
        error: ""
      };
  const updatedResult = error || !job.result
    ? job.result
    : Object.fromEntries(Object.entries(job.result).filter(([key]) => key !== "jiraEvidence"));
  const updated = { ...job, result: updatedResult, jiraTicket };
  await saveJob(updated);
  await command(["DEL", `${PREFIX}jira-ticket-lock:${id}`]).catch(() => undefined);
  return updated;
}

export async function scheduleBobJobRetry(id, error = "") {
  const job = await getBobJob(id);
  if (!job || job.status !== "processing") return null;
  const attempts = Math.max(0, Number(job.attempts || 0)) + 1;
  const delayMs = RETRY_DELAYS_MS[Math.min(attempts - 1, RETRY_DELAYS_MS.length - 1)];
  const now = Date.now();
  const retryAt = new Date(now + delayMs).toISOString();
  const updated = {
    ...job,
    status: "retry_waiting",
    attempts,
    retryAt,
    lastError: String(error || "bob_retryable_failure").slice(0, 180),
    progress: {
      step: "retry_waiting",
      message: "BoB no está disponible todavía. El cierre se reintentará automáticamente.",
      updatedAt: new Date(now).toISOString()
    }
  };
  await saveJob(updated);
  await command(["RPUSH", queueKey(updated.ownerEmail, updated.connectorMode), updated.id]);
  return updated;
}

export async function updateBobJobProgress(id, progress = {}) {
  const job = await getBobJob(id);
  if (!job || job.status !== "processing") return null;
  const updated = {
    ...job,
    progress: {
      step: String(progress.step || "processing").slice(0, 48),
      message: String(progress.message || "Procesando cierre en BoB.").slice(0, 180),
      completed: Number(progress.completed || 0),
      total: Number(progress.total || 0),
      updatedAt: new Date().toISOString()
    }
  };
  await saveJob(updated);
  return updated;
}

export function mergeBobResults(previous = {}, incoming = {}) {
  const before = isRecord(previous) ? previous : {};
  const after = isRecord(incoming) ? incoming : {};
  const merged = { ...before, ...after };
  const closedSessions = mergeSessions(before.closedSessions, after.closedSessions);
  const pendingWinsBefore = mergeWins(before.pendingWins?.foundBeforeClosure, after.pendingWins?.foundBeforeClosure);
  const pendingWinsAfter = Object.prototype.hasOwnProperty.call(after.pendingWins || {}, "remainingAfterVerification")
    ? mergeWins([], after.pendingWins?.remainingAfterVerification)
    : mergeWins([], before.pendingWins?.remainingAfterVerification);

  merged.closedSessions = closedSessions;
  merged.closedCount = closedSessions.length;
  merged.totalPendingFound = Math.max(numberOrZero(before.totalPendingFound), numberOrZero(after.totalPendingFound), closedSessions.length);
  merged.alreadyClosedCount = Math.max(numberOrZero(before.alreadyClosedCount), numberOrZero(after.alreadyClosedCount));
  merged.skippedCount = Math.max(numberOrZero(before.skippedCount), numberOrZero(after.skippedCount));
  merged.pendingWins = {
    foundBeforeClosure: pendingWinsBefore,
    remainingAfterVerification: pendingWinsAfter
  };
  return merged;
}

function mergeSessions(...collections) {
  const seen = new Set();
  const merged = [];
  for (const collection of collections) {
    for (const session of Array.isArray(collection) ? collection : []) {
      const id = String(session?.sessionId || "").trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      merged.push(session);
    }
  }
  return merged;
}

function mergeWins(...collections) {
  const seen = new Set();
  const merged = [];
  for (const collection of collections) {
    for (const win of Array.isArray(collection) ? collection : []) {
      const id = `${String(win?.sessionId || "").trim()}:${String(win?.amount || "").trim()}`;
      if (id === ":" || seen.has(id)) continue;
      seen.add(id);
      merged.push(win);
    }
  }
  return merged;
}

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function isRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function normaliseBobCustomer(customer = {}, customerId = "") {
  const email = String(customer?.email || "").trim().toLowerCase();
  return {
    name: String(customer?.name || "").trim().slice(0, 180),
    email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email.slice(0, 254) : "",
    authId: String(customerId || "").trim()
  };
}

function normaliseReportedGame(value) {
  return String(value || "").replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 120);
}

export async function getBobJob(id) {
  const value = await command(["GET", `${PREFIX}job:${id}`]);
  try { return value ? JSON.parse(value) : null; } catch { return null; }
}

export async function listBobJobs({ ownerEmail, includeAll = false, limit = 40 } = {}) {
  const max = Math.min(Math.max(Number(limit) || 40, 1), 100);
  const ids = await command(["ZREVRANGE", HISTORY_KEY, "0", String(max * 4 - 1)]);
  const jobs = [];
  for (const id of Array.isArray(ids) ? ids : []) {
    const job = await getBobJob(id);
    if (!job || (!includeAll && job.ownerEmail !== ownerEmail)) continue;
    jobs.push(job);
    if (jobs.length >= max) break;
  }
  return jobs;
}

async function saveJob(job) {
  await command(["SET", `${PREFIX}job:${job.id}`, JSON.stringify(job), "EX", JOB_TTL_SECONDS]);
}

async function command(commandValue) {
  const baseUrl = optionalEnv("KV_REST_API_URL") || optionalEnv("UPSTASH_REDIS_REST_URL");
  const token = optionalEnv("KV_REST_API_TOKEN") || optionalEnv("UPSTASH_REDIS_REST_TOKEN");
  if (!baseUrl || !token) throw Object.assign(new Error("missing_kv_config"), { statusCode: 503 });
  const response = await fetch(`${baseUrl.replace(/\/+$/, "")}/pipeline`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify([commandValue]) });
  const data = await response.json().catch(() => []);
  if (!response.ok) throw Object.assign(new Error("kv_request_failed"), { statusCode: 503 });
  return Array.isArray(data) ? data[0]?.result : data?.result;
}
