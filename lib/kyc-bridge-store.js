import crypto from "node:crypto";
import { optionalEnv } from "./http.js";
import { configuredConnectorAgent } from "./connector-agent-auth.js";

const PREFIX = "support:kyc-bridge:";
const JOB_TTL_SECONDS = 3600;
const MAX_PENDING_AGE_MS = 15 * 60 * 1000;
const QUEUE_LOCK_TTL_SECONDS = 15 * 60;

export async function createKycJob({ ownerEmail, email }) {
  const normalizedEmail = normalizeEmail(email);
  const dedupeKey = requestKey(normalizedEmail);
  const existing = await pendingJobForRequest(dedupeKey, ownerEmail);
  if (existing) return existing;
  const id = crypto.randomUUID();
  const connectorMode = configuredConnectorAgent("kyc", ownerEmail) ? "agent" : "legacy";
  const reserved = await command(["SET", dedupeKey, id, "EX", JOB_TTL_SECONDS, "NX"]);
  if (reserved !== "OK") {
    const concurrent = await pendingJobForRequest(dedupeKey, ownerEmail);
    if (concurrent) return concurrent;
    throw Object.assign(new Error("kyc_job_deduplication_conflict"), { statusCode: 409 });
  }
  const job = {
    id,
    ownerEmail,
    authorizedOwners: [normalizeOwner(ownerEmail)],
    email: normalizedEmail,
    dedupeKey,
    connectorMode,
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

export async function claimKycJob(ownerEmail = "") {
  const mode = ownerEmail ? "agent" : "legacy";
  for (let index = 0; index < 20; index += 1) {
    const lockToken = crypto.randomUUID();
    if (await command(["SET", queueLockKey(mode), lockToken, "EX", QUEUE_LOCK_TTL_SECONDS, "NX"]) !== "OK") return null;
    const id = await command(["LPOP", queueKey(ownerEmail, mode)]);
    if (!id) {
      await command(["DEL", queueLockKey(mode)]).catch(() => undefined);
      return null;
    }
    const job = await getKycJob(id);
    if (job?.status !== "pending") {
      await command(["DEL", queueLockKey(mode)]).catch(() => undefined);
      continue;
    }
    if (Date.now() - Date.parse(job.createdAt || 0) > MAX_PENDING_AGE_MS) {
      await saveJob({ ...job, status: "failed", error: "kyc_job_expired", completedAt: new Date().toISOString() });
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

function requestKey(email) {
  return `${PREFIX}request:${crypto.createHash("sha256").update(String(email || "").trim().toLowerCase()).digest("hex")}`;
}

async function pendingJobForRequest(dedupeKey, ownerEmail) {
  const id = await command(["GET", dedupeKey]);
  if (!id) return null;
  const job = await getKycJob(id);
  if (job && ["pending", "processing", "completed"].includes(job.status)) {
    return grantKycJobReadAccess(job, ownerEmail);
  }
  await command(["DEL", dedupeKey]);
  return null;
}

export function canReadKycJob(job, ownerEmail) {
  const requestedBy = normalizeOwner(ownerEmail);
  return Boolean(requestedBy && job && (
    normalizeOwner(job.ownerEmail) === requestedBy
    || job.authorizedOwners?.some((value) => normalizeOwner(value) === requestedBy)
  ));
}

async function grantKycJobReadAccess(job, ownerEmail) {
  const authorizedOwners = [...new Set([
    normalizeOwner(job.ownerEmail),
    ...(Array.isArray(job.authorizedOwners) ? job.authorizedOwners.map(normalizeOwner) : []),
    normalizeOwner(ownerEmail)
  ].filter(Boolean))];
  if (Array.isArray(job.authorizedOwners) && job.authorizedOwners.length === authorizedOwners.length
    && job.authorizedOwners.every((value) => authorizedOwners.includes(normalizeOwner(value)))) return job;
  const updated = { ...job, authorizedOwners };
  await saveJob(updated);
  return updated;
}

function normalizeOwner(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

export async function completeKycJob(id, result, error = "") {
  const job = await getKycJob(id);
  if (!job) return null;
  const next = { ...job, status: error ? "failed" : "completed", result: error ? undefined : result, error, completedAt: new Date().toISOString() };
  await saveJob(next);
  if (job.dedupeKey && error) await command(["DEL", job.dedupeKey]).catch(() => undefined);
  if (job.queueLockToken) await command(["DEL", queueLockKey(job.connectorMode || "legacy")]).catch(() => undefined);
  return next;
}

export async function getKycJob(id) {
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
