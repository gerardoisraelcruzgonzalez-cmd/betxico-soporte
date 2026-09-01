import crypto from "node:crypto";

const RECORD_PREFIX = "support:case-action:v1:";
const LOCK_PREFIX = "support:case-action-lock:v1:";
const LATEST_PREFIX = "support:case-action-latest:v1:";
const DEFAULT_RETENTION_SECONDS = 60 * 60 * 24 * 7;
const DEFAULT_APPROVAL_TTL_SECONDS = 10 * 60;
const DEFAULT_LOCK_TTL_MS = 5000;
const DEFAULT_LOCK_ATTEMPTS = 20;
const COMPLETION_STATUSES = new Set(["verified", "verification_pending", "failed"]);
const ALL_STATUSES = new Set([
  "proposed",
  "approved",
  "executing",
  "verified",
  "verification_pending",
  "failed",
  "rejected"
]);
const FORBIDDEN_KEYS = /(?:api.?key|authorization|base64|binary|bytes|cookie|credential|file.?data|password|pin|secret|token)/iu;

export function createCaseActionStore(options = {}) {
  const kv = options.kv || createUpstashCaseActionKvAdapter(options);
  assertKvAdapter(kv);

  const now = typeof options.now === "function" ? options.now : () => new Date();
  const recordPrefix = normalizePrefix(options.recordPrefix, RECORD_PREFIX);
  const lockPrefix = normalizePrefix(options.lockPrefix, LOCK_PREFIX);
  const latestPrefix = normalizePrefix(options.latestPrefix, LATEST_PREFIX);
  const retentionSeconds = clampInt(options.retentionSeconds, DEFAULT_RETENTION_SECONDS, 1, 60 * 60 * 24 * 30);
  const approvalTtlSeconds = clampInt(options.approvalTtlSeconds, DEFAULT_APPROVAL_TTL_SECONDS, 1, 60 * 60);
  const lockTtlMs = clampInt(options.lockTtlMs, DEFAULT_LOCK_TTL_MS, 100, 30000);
  const lockAttempts = clampInt(options.lockAttempts, DEFAULT_LOCK_ATTEMPTS, 1, 100);
  const lockRetryMs = clampInt(options.lockRetryMs, 10, 1, 1000);

  return Object.freeze({
    propose,
    get,
    getLatestByChat,
    approve,
    reject,
    claimExecution,
    completeExecution
  });

  async function propose(input = {}) {
    const proposedAt = validIso(input.proposedAt) || currentIso();
    const proposalId = normalizeId(input.proposalId, "proposal_id");
    const proposalExpiresAt = validIso(input.expiresAt)
      || addSeconds(proposedAt, approvalTtlSeconds);
    if (Date.parse(proposalExpiresAt) <= Date.parse(proposedAt)) {
      throw storeError("case_action_proposal_expired", 409);
    }

    const idempotencyKey = normalizeId(
      input.idempotencyKey || `case-action:${proposalId}`,
      "idempotency_key",
      240
    );
    const sanitizedProposal = sanitizeRecordValue({
      proposalId,
      status: "proposed",
      chatId: input.chatId,
      caseRevision: input.caseRevision,
      caseFingerprint: input.caseFingerprint,
      actionType: input.actionType,
      riskLevel: input.riskLevel,
      requiresHumanApproval: input.requiresHumanApproval !== false,
      payload: input.payload,
      proposedBy: input.proposedBy,
      reason: input.reason,
      proposedAt,
      expiresAt: proposalExpiresAt
    });
    const proposalFingerprint = digest(stableStringify({
      proposalId: sanitizedProposal.proposalId,
      chatId: sanitizedProposal.chatId,
      caseRevision: sanitizedProposal.caseRevision,
      caseFingerprint: sanitizedProposal.caseFingerprint,
      actionType: sanitizedProposal.actionType,
      riskLevel: sanitizedProposal.riskLevel,
      requiresHumanApproval: sanitizedProposal.requiresHumanApproval,
      payload: sanitizedProposal.payload,
      proposedBy: sanitizedProposal.proposedBy,
      reason: sanitizedProposal.reason
    }));

    const record = await transition(proposalId, async (existing, transitionNow) => {
      if (existing) {
        if (existing.idempotencyKey === idempotencyKey
          && existing.proposalFingerprint === proposalFingerprint) {
          return existing;
        }
        throw storeError("case_action_proposal_conflict", 409);
      }

      const createdAt = transitionNow;
      return {
        schemaVersion: 1,
        proposalId,
        status: "proposed",
        idempotencyKey,
        proposalFingerprint,
        proposal: sanitizedProposal,
        approval: null,
        execution: null,
        createdAt,
        updatedAt: createdAt,
        recordExpiresAt: addSeconds(createdAt, retentionSeconds)
      };
    });
    await kv.set(latestKeyFor(record.proposal.chatId), record.proposalId, { ttlSeconds: retentionSeconds });
    return record;
  }

  async function get(proposalId) {
    const cleanId = normalizeId(proposalId, "proposal_id");
    const record = await readRecord(cleanId);
    return record ? clone(record) : null;
  }

  async function getLatestByChat(chatId) {
    const key = latestKeyFor(chatId);
    const proposalId = await kv.get(key);
    if (!proposalId) return null;
    const record = await get(String(proposalId));
    if (!record) await kv.delete(key).catch(() => false);
    return record;
  }

  async function approve(proposalId, input = {}) {
    const cleanId = normalizeId(proposalId, "proposal_id");
    return transition(cleanId, async (record, transitionNow) => {
      requireRecord(record);
      assertIdempotencyKey(record, input.idempotencyKey);

      if (record.status === "approved") {
        if (sameApproval(record.approval, input)) return record;
        throw storeError("case_action_already_approved", 409);
      }
      if (record.status !== "proposed") {
        throw storeError("case_action_not_proposed", 409);
      }
      if (isExpired(record.proposal?.expiresAt, transitionNow)) {
        throw storeError("case_action_proposal_expired", 409);
      }

      const approvedAt = validIso(input.approvedAt) || transitionNow;
      const requestedExpiry = validIso(input.expiresAt)
        || addSeconds(approvedAt, approvalTtlSeconds);
      const expiresAt = earlierIso(record.proposal.expiresAt, requestedExpiry);
      if (Date.parse(expiresAt) <= Date.parse(approvedAt)) {
        throw storeError("case_action_approval_expired", 409);
      }

      const approvedBy = sanitizeRecordValue(input.approvedBy || {});
      if (!approvedBy || typeof approvedBy !== "object" || Object.keys(approvedBy).length === 0) {
        throw storeError("invalid_case_action_approver", 400);
      }
      const approvalId = normalizeId(
        input.approvalId || `approval_${digest(`${cleanId}|${stableStringify(approvedBy)}|${approvedAt}`).slice(0, 32)}`,
        "approval_id"
      );
      return {
        ...record,
        status: "approved",
        approval: {
          approvalId,
          status: "approved",
          proposalId: record.proposal.proposalId,
          chatId: record.proposal.chatId,
          caseRevision: record.proposal.caseRevision,
          caseFingerprint: record.proposal.caseFingerprint,
          actionType: record.proposal.actionType,
          approvedBy,
          approvedAt,
          expiresAt,
          consumedAt: null,
          consumedBy: null
        },
        updatedAt: transitionNow
      };
    });
  }

  async function reject(proposalId, input = {}) {
    const cleanId = normalizeId(proposalId, "proposal_id");
    return transition(cleanId, async (record, transitionNow) => {
      requireRecord(record);
      assertIdempotencyKey(record, input.idempotencyKey);
      if (record.status === "rejected") return record;
      if (!new Set(["proposed", "approved"]).has(record.status)) {
        throw storeError("case_action_cannot_be_rejected", 409);
      }
      if (record.approval?.consumedAt) {
        throw storeError("case_action_approval_consumed", 409);
      }
      return {
        ...record,
        status: "rejected",
        rejection: sanitizeRecordValue({
          rejectedBy: input.rejectedBy,
          reason: input.reason,
          rejectedAt: validIso(input.rejectedAt) || transitionNow
        }),
        updatedAt: transitionNow
      };
    });
  }

  async function claimExecution(proposalId, input = {}) {
    const cleanId = normalizeId(proposalId, "proposal_id");
    return transition(cleanId, async (record, transitionNow) => {
      requireRecord(record);
      assertIdempotencyKey(record, input.idempotencyKey);
      if (record.approval?.consumedAt || record.status !== "approved") {
        throw storeError("case_action_approval_consumed", 409);
      }
      if (isExpired(record.proposal?.expiresAt, transitionNow)
        || isExpired(record.approval?.expiresAt, transitionNow)) {
        throw storeError("case_action_approval_expired", 409);
      }

      const executingBy = sanitizeRecordValue(input.executingBy || {});
      const executionId = normalizeId(
        input.executionId || `execution_${crypto.randomUUID()}`,
        "execution_id"
      );
      return {
        ...record,
        status: "executing",
        approval: {
          ...record.approval,
          consumedAt: transitionNow,
          consumedBy: executingBy
        },
        execution: {
          executionId,
          status: "executing",
          idempotencyKey: record.idempotencyKey,
          executingBy,
          startedAt: transitionNow,
          completedAt: null,
          result: null,
          error: null
        },
        updatedAt: transitionNow
      };
    });
  }

  async function completeExecution(proposalId, input = {}) {
    const cleanId = normalizeId(proposalId, "proposal_id");
    const targetStatus = String(input.status || "").trim().toLowerCase();
    if (!COMPLETION_STATUSES.has(targetStatus)) {
      throw storeError("invalid_case_action_completion_status", 400);
    }

    return transition(cleanId, async (record, transitionNow) => {
      requireRecord(record);
      assertIdempotencyKey(record, input.idempotencyKey);
      if (record.status === targetStatus && record.execution?.completedAt) return record;
      if (record.status !== "executing" && record.status !== "verification_pending") {
        throw storeError("case_action_not_executing", 409);
      }
      if (record.status === "verification_pending" && targetStatus === "verification_pending") {
        return record;
      }

      return {
        ...record,
        status: targetStatus,
        execution: {
          ...record.execution,
          status: targetStatus,
          idempotencyKey: record.idempotencyKey,
          completedAt: transitionNow,
          result: sanitizeRecordValue(input.result),
          error: sanitizeRecordValue(input.error)
        },
        updatedAt: transitionNow
      };
    });
  }

  async function transition(proposalId, updater) {
    const lockToken = await acquireLock(proposalId);
    try {
      const existing = await readRecord(proposalId);
      const updated = await updater(existing, currentIso());
      validateRecord(updated, proposalId);
      await writeRecord(updated, lockToken);
      return clone(updated);
    } finally {
      await kv.compareDelete(lockKeyFor(proposalId), lockToken).catch(() => false);
    }
  }

  async function acquireLock(proposalId) {
    const token = crypto.randomUUID();
    for (let attempt = 0; attempt < lockAttempts; attempt += 1) {
      const acquired = await kv.set(lockKeyFor(proposalId), token, {
        onlyIfAbsent: true,
        ttlMilliseconds: lockTtlMs
      });
      if (acquired) return token;
      await delay(lockRetryMs * (attempt + 1));
    }
    throw storeError("case_action_locked", 409);
  }

  async function readRecord(proposalId) {
    const raw = await kv.get(recordKeyFor(proposalId));
    if (!raw) return null;
    let parsed;
    try {
      parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    } catch {
      throw storeError("invalid_case_action_record", 500);
    }
    validateRecord(parsed, proposalId);
    if (isExpired(parsed.recordExpiresAt, currentIso())) {
      await kv.delete(recordKeyFor(proposalId)).catch(() => false);
      return null;
    }
    return parsed;
  }

  async function writeRecord(record, lockToken) {
    const ttlSeconds = Math.max(1, Math.ceil(
      (Date.parse(record.recordExpiresAt) - Date.parse(currentIso())) / 1000
    ));
    const written = await kv.setIfLockOwned(
      lockKeyFor(record.proposalId),
      lockToken,
      recordKeyFor(record.proposalId),
      JSON.stringify(record),
      { ttlSeconds }
    );
    if (!written) throw storeError("case_action_lock_lost", 409);
  }

  function currentIso() {
    const value = now();
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) throw storeError("invalid_case_action_clock", 500);
    return date.toISOString();
  }

  function recordKeyFor(proposalId) {
    return `${recordPrefix}${proposalId}`;
  }

  function lockKeyFor(proposalId) {
    return `${lockPrefix}${proposalId}`;
  }

  function latestKeyFor(chatId) {
    const normalized = clean(chatId);
    if (!normalized) throw storeError("invalid_chat_id", 400);
    return `${latestPrefix}${digest(normalized).slice(0, 40)}`;
  }
}

export function createUpstashCaseActionKvAdapter(options = {}) {
  const url = clean(options.url
    || process.env.KV_REST_API_URL
    || process.env.UPSTASH_REDIS_REST_URL);
  const token = clean(options.token
    || process.env.KV_REST_API_TOKEN
    || process.env.UPSTASH_REDIS_REST_TOKEN);

  async function command(parts) {
    if (!url || !token) throw storeError("missing_kv_config", 500);
    const response = await fetch(`${url.replace(/\/+$/u, "")}/pipeline`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json"
      },
      body: JSON.stringify([parts])
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      const error = storeError("kv_request_failed", response.status);
      error.details = sanitizeRecordValue(body);
      throw error;
    }
    const entry = Array.isArray(body) ? body[0] : body;
    if (entry?.error) throw storeError("kv_command_failed", 502);
    return entry?.result ?? null;
  }

  return Object.freeze({
    async get(key) {
      return command(["GET", key]);
    },
    async set(key, value, setOptions = {}) {
      const parts = ["SET", key, value];
      if (setOptions.onlyIfAbsent) parts.push("NX");
      if (setOptions.ttlMilliseconds) parts.push("PX", String(setOptions.ttlMilliseconds));
      else if (setOptions.ttlSeconds) parts.push("EX", String(setOptions.ttlSeconds));
      return (await command(parts)) === "OK";
    },
    async delete(key) {
      return Number(await command(["DEL", key])) > 0;
    },
    async compareDelete(key, expectedValue) {
      const script = [
        "if redis.call('get', KEYS[1]) == ARGV[1] then",
        "  return redis.call('del', KEYS[1])",
        "end",
        "return 0"
      ].join("\n");
      return Number(await command(["EVAL", script, "1", key, expectedValue])) > 0;
    },
    async setIfLockOwned(lock, expectedValue, key, value, setOptions = {}) {
      const ttlSeconds = clampInt(setOptions.ttlSeconds, 1, 1, 60 * 60 * 24 * 30);
      const script = [
        "if redis.call('get', KEYS[1]) == ARGV[1] then",
        "  redis.call('set', KEYS[2], ARGV[2], 'EX', ARGV[3])",
        "  return 1",
        "end",
        "return 0"
      ].join("\n");
      return Number(await command([
        "EVAL",
        script,
        "2",
        lock,
        key,
        expectedValue,
        value,
        String(ttlSeconds)
      ])) > 0;
    }
  });
}

export function caseActionRecordKey(proposalId) {
  return recordKey(normalizeId(proposalId, "proposal_id"));
}

function validateRecord(record, proposalId) {
  if (!record || typeof record !== "object"
    || record.schemaVersion !== 1
    || record.proposalId !== proposalId
    || !ALL_STATUSES.has(record.status)
    || !record.idempotencyKey
    || !validIso(record.recordExpiresAt)) {
    throw storeError("invalid_case_action_record", 500);
  }
  if (record.status !== "proposed" && record.status !== "rejected" && !record.approval) {
    throw storeError("invalid_case_action_record", 500);
  }
  if (["executing", "verified", "verification_pending", "failed"].includes(record.status)
    && (!record.execution || !record.approval?.consumedAt)) {
    throw storeError("invalid_case_action_record", 500);
  }
}

function requireRecord(record) {
  if (!record) throw storeError("case_action_not_found", 404);
}

function assertIdempotencyKey(record, supplied) {
  if (!supplied) return;
  if (clean(supplied) !== record.idempotencyKey) {
    throw storeError("case_action_idempotency_mismatch", 409);
  }
}

function sameApproval(approval, input) {
  if (!approval) return false;
  if (input.approvalId && clean(input.approvalId) !== approval.approvalId) return false;
  const suppliedApprover = sanitizeRecordValue(input.approvedBy || {});
  return stableStringify(suppliedApprover) === stableStringify(approval.approvedBy || {});
}

function sanitizeRecordValue(value, depth = 0) {
  if (value === undefined || value === null || depth > 7) return null;
  if (typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return redactSecrets(value).slice(0, 4000);
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((item) => sanitizeRecordValue(item, depth + 1));
  }
  if (typeof value !== "object") return clean(value).slice(0, 500);

  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !FORBIDDEN_KEYS.test(normalizeObjectKey(key)))
      .filter(([key]) => !["__proto__", "constructor", "prototype"].includes(key))
      .slice(0, 80)
      .map(([key, item]) => [normalizeObjectKey(key), sanitizeRecordValue(item, depth + 1)])
      .filter(([key]) => Boolean(key))
  );
}

function redactSecrets(value) {
  return clean(value)
    .replace(/\b(?:api[-_ ]?key|authorization|password|contrasena|contraseña|token|nip|pin|secret)\s*[:=]\s*\S+/giu, "[CREDENTIAL_REDACTED]")
    .replace(/\b\d{18}\b/gu, "[CLABE_REDACTED]");
}

function assertKvAdapter(kv) {
  for (const method of ["get", "set", "delete", "compareDelete", "setIfLockOwned"]) {
    if (typeof kv?.[method] !== "function") throw storeError("invalid_case_action_kv_adapter", 500);
  }
}

function recordKey(proposalId) {
  return `${RECORD_PREFIX}${proposalId}`;
}

function lockKey(proposalId) {
  return `${LOCK_PREFIX}${proposalId}`;
}

function latestKey(chatId) {
  const normalized = clean(chatId);
  if (!normalized) throw storeError("invalid_chat_id", 400);
  return `${LATEST_PREFIX}${digest(normalized).slice(0, 40)}`;
}

function normalizePrefix(value, fallback) {
  const prefix = clean(value || fallback).slice(0, 120);
  if (!prefix || !/^[A-Za-z0-9:_.-]+$/u.test(prefix)) {
    throw storeError("invalid_case_action_prefix", 500);
  }
  return prefix;
}

function normalizeId(value, name, maxLength = 180) {
  const normalized = clean(value).slice(0, maxLength);
  if (!normalized || !/^[A-Za-z0-9:_.-]+$/u.test(normalized)) {
    throw storeError(`invalid_${name}`, 400);
  }
  return normalized;
}

function normalizeObjectKey(value) {
  return String(value || "").replace(/[^A-Za-z0-9_.-]/gu, "_").slice(0, 100);
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(",")}]`;
  if (value && typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(",")}}`;
  }
  return JSON.stringify(value);
}

function digest(value) {
  return crypto.createHash("sha256").update(String(value || "")).digest("hex");
}

function validIso(value) {
  const text = clean(value);
  return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : "";
}

function addSeconds(value, seconds) {
  return new Date(Date.parse(value) + (seconds * 1000)).toISOString();
}

function earlierIso(left, right) {
  return Date.parse(left) <= Date.parse(right) ? left : right;
}

function isExpired(value, now) {
  const expiresAt = Date.parse(validIso(value));
  const current = Date.parse(validIso(now));
  return !Number.isFinite(expiresAt) || !Number.isFinite(current) || expiresAt <= current;
}

function clampInt(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.floor(number)));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function storeError(message, statusCode) {
  const error = new Error(message);
  error.code = message;
  error.statusCode = statusCode;
  return error;
}

function clean(value) {
  return String(value || "").replace(/\u0000/gu, "").replace(/\s+/gu, " ").trim();
}
