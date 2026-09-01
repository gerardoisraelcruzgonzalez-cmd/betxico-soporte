import crypto from "node:crypto";
import { optionalEnv } from "./http.js";
import { configuredConnectorAgent } from "./connector-agent-auth.js";

const PREFIX = "support:atena-bridge:";
const JOB_TTL_SECONDS = 3600;
const MAX_PENDING_AGE_MS = 15 * 60 * 1000;
const QUEUE_LOCK_TTL_SECONDS = 15 * 60;

export async function createAtenaJob({ ownerEmail, email, startDate, endDate, caseId = "" }) {
  const dedupeKey = requestKey({ email, startDate, endDate });
  const existing = await pendingJobForRequest(dedupeKey, ownerEmail, caseId);
  if (existing) return existing;

  const id = crypto.randomUUID();
  const connectorMode = configuredConnectorAgent("atena", ownerEmail) ? "agent" : "legacy";
  const reserved = await command(["SET", dedupeKey, id, "EX", JOB_TTL_SECONDS, "NX"]);
  if (reserved !== "OK") {
    const concurrent = await pendingJobForRequest(dedupeKey, ownerEmail, caseId);
    if (concurrent) return concurrent;
    // A terminal job may have released its reservation between reads. Retry once.
    const retried = await command(["SET", dedupeKey, id, "EX", JOB_TTL_SECONDS, "NX"]);
    if (retried !== "OK") throw Object.assign(new Error("atena_job_deduplication_conflict"), { statusCode: 409 });
  }

  const job = {
    id,
    ownerEmail,
    authorizedOwners: [normalizeOwner(ownerEmail)],
    email,
    startDate,
    endDate,
    dedupeKey,
    connectorMode,
    caseIds: normalizeCaseIds([caseId]),
    status: "pending",
    createdAt: new Date().toISOString()
  };
  try {
    await command(["SET", `${PREFIX}job:${id}`, JSON.stringify(job), "EX", JOB_TTL_SECONDS]);
    await command(["RPUSH", queueKey(ownerEmail, connectorMode), id]);
  } catch (error) {
    await command(["DEL", dedupeKey]).catch(() => undefined);
    throw error;
  }
  return job;
}

export async function claimAtenaJob(ownerEmail = "") {
  const mode = ownerEmail ? "agent" : "legacy";
  for (let index = 0; index < 20; index += 1) {
    const lockToken = crypto.randomUUID();
    if (await command(["SET", queueLockKey(mode), lockToken, "EX", QUEUE_LOCK_TTL_SECONDS, "NX"]) !== "OK") return null;
    const id = await command(["LPOP", queueKey(ownerEmail, mode)]);
    if (!id) {
      await command(["DEL", queueLockKey(mode)]).catch(() => undefined);
      return null;
    }
    const job = await getJob(id);
    if (job?.status !== "pending") {
      await command(["DEL", queueLockKey(mode)]).catch(() => undefined);
      continue;
    }
    if (Date.now() - Date.parse(job.createdAt || 0) > MAX_PENDING_AGE_MS) {
      await saveJob({ ...job, status: "failed", error: "atena_job_expired", completedAt: new Date().toISOString() });
      if (job.dedupeKey) await command(["DEL", job.dedupeKey]);
      await command(["DEL", queueLockKey(mode)]).catch(() => undefined);
      continue;
    }
    const processing = { ...job, status: "processing", queueLockToken: lockToken, startedAt: new Date().toISOString() };
    await saveJob(processing);
    return processing;
  }
  return null;
}

function queueKey(ownerEmail, mode) {
  return mode === "agent" ? `${PREFIX}queue:agent` : `${PREFIX}queue`;
}

function queueLockKey(mode) {
  return `${PREFIX}queue-lock:${mode}`;
}

function requestKey({ email, startDate, endDate }) {
  const value = [email, startDate, endDate]
    .map((item) => String(item || "").trim().toLowerCase())
    .join("|");
  return `${PREFIX}request:${crypto.createHash("sha256").update(value).digest("hex")}`;
}

async function pendingJobForRequest(dedupeKey, ownerEmail, caseId = "") {
  const id = await command(["GET", dedupeKey]);
  if (!id) return null;
  const job = await getJob(id);
  if (job && ["pending", "processing", "completed"].includes(job.status)) {
    return grantAtenaJobReadAccess(job, ownerEmail, caseId);
  }
  await command(["DEL", dedupeKey]);
  return null;
}

export function canReadAtenaJob(job, ownerEmail) {
  const requestedBy = normalizeOwner(ownerEmail);
  if (!requestedBy || !job) return false;
  return normalizeOwner(job.ownerEmail) === requestedBy
    || (Array.isArray(job.authorizedOwners) && job.authorizedOwners.some((value) => normalizeOwner(value) === requestedBy));
}

async function grantAtenaJobReadAccess(job, ownerEmail, caseId = "") {
  const requestedBy = normalizeOwner(ownerEmail);
  const authorizedOwners = [...new Set([
    normalizeOwner(job.ownerEmail),
    ...(Array.isArray(job.authorizedOwners) ? job.authorizedOwners.map(normalizeOwner) : []),
    requestedBy
  ].filter(Boolean))];
  const caseIds = normalizeCaseIds([...(Array.isArray(job.caseIds) ? job.caseIds : []), caseId]);
  if (Array.isArray(job.authorizedOwners)
    && job.authorizedOwners.length === authorizedOwners.length
    && job.authorizedOwners.every((value) => authorizedOwners.includes(normalizeOwner(value)))
    && Array.isArray(job.caseIds)
    && job.caseIds.length === caseIds.length
    && job.caseIds.every((value) => caseIds.includes(value))) {
    return job;
  }
  const updated = { ...job, authorizedOwners, caseIds };
  await saveJob(updated);
  return updated;
}

function normalizeCaseIds(values) {
  return [...new Set((Array.isArray(values) ? values : [])
    .map((value) => String(value || "").trim().slice(0, 180))
    .filter(Boolean))]
    .slice(-20);
}

function normalizeOwner(value) {
  return String(value || "").trim().toLowerCase();
}

export async function completeAtenaJob(id, result, error = "") {
  const job = await getJob(id);
  if (!job) return null;
  const next = { ...job, status: error ? "failed" : "completed", result: error ? undefined : result, error, completedAt: new Date().toISOString() };
  await saveJob(next);
  if (job.queueLockToken) await command(["DEL", queueLockKey(job.connectorMode || "legacy")]).catch(() => undefined);
  // A completed read-only result remains reusable for the job TTL. This lets a
  // second agent receive the same result even when the first query finished
  // shortly before the second click.
  if (job.dedupeKey && error) await command(["DEL", job.dedupeKey]);
  return next;
}

export async function getJob(id) {
  const value = await command(["GET", `${PREFIX}job:${id}`]);
  try { return value ? JSON.parse(value) : null; } catch { return null; }
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
