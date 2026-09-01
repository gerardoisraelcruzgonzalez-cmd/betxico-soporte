import crypto from "node:crypto";
import {
  CASE_TOOL_STATUSES,
  normalizeCaseToolResult
} from "./case-operation-contracts.js";

const DEFAULT_TTL_SECONDS = 5 * 60;
const DEFAULT_WAIT_BUDGET_MS = 8 * 1000;
const DEFAULT_POLL_INTERVAL_MS = 2 * 1000;
const MAX_MOVEMENTS = 3;
const MAX_WITHDRAWALS = 3;
const MAX_KYC_RESULTS_PER_SOURCE = 10;
const OPERATIONAL_TIME_ZONE = "America/Mexico_City";

export async function lookupAtena(input = {}, dependencies = {}) {
  const context = normalizeLookupContext(input, dependencies);
  if (!context.ok) return invalidLookupResult("case.atena.lookup", "atena", context);

  return runBridgeLookup({
    tool: "case.atena.lookup",
    source: "atena",
    context,
    createJob: dependencies.createJob,
    getJob: dependencies.getJob,
    request: {
      ownerEmail: context.ownerEmail,
      caseId: context.caseId,
      email: context.email,
      startDate: validDate(input.startDate) || defaultStartDate(context.now),
      endDate: validDate(input.endDate) || operationalDate(context.now)
    },
    normalizeCompleted: (job) => normalizeAtenaJob(job, context)
  });
}

// Used by the connector-completion path. It creates the exact same evidence
// envelope as a polled lookup without starting another browser job.
export function evidenceFromCompletedAtenaJob(job = {}, options = {}) {
  const now = currentIso(options.now);
  const expectedEmail = normalizeEmail(options.email || job.email);
  const normalized = normalizeAtenaEvidence(job?.result, {
    email: expectedEmail,
    startDate: job?.startDate,
    endDate: job?.endDate
  });
  if (!normalized.ok) return null;
  const checkedAt = validIso(job?.completedAt) || now;
  const queryHash = buildEvidenceHash(expectedEmail, options.hashSecret);
  return normalizeCaseToolResult({
    tool: "case.atena.lookup",
    source: "atena",
    status: CASE_TOOL_STATUSES.AVAILABLE,
    verified: true,
    checkedAt,
    ttlSeconds: DEFAULT_TTL_SECONDS,
    queryHash,
    query: { type: "email", hash: queryHash },
    data: {
      ...normalized.data,
      lifecycle: ["pending", "processing", "completed"]
    }
  }, { now });
}

export async function lookupKyc(input = {}, dependencies = {}) {
  const context = normalizeLookupContext(input, dependencies);
  if (!context.ok) return invalidLookupResult("case.kyc.lookup", "kyc", context);

  return runBridgeLookup({
    tool: "case.kyc.lookup",
    source: "kyc",
    context,
    createJob: dependencies.createJob,
    getJob: dependencies.getJob,
    request: {
      ownerEmail: context.ownerEmail,
      email: context.email
    },
    normalizeCompleted: (job) => normalizeKycJob(job, context)
  });
}

export function normalizeAtenaEvidence(result = {}, options = {}) {
  const expectedEmail = normalizeEmail(options.email);
  const returnedEmail = normalizeEmail(result?.customer?.email);
  if (!expectedEmail || !returnedEmail || returnedEmail !== expectedEmail) {
    return { ok: false, error: { code: "atena_exact_email_mismatch", retryable: false } };
  }

  return {
    ok: true,
    data: {
      customer: {
        status: safeText(result?.customer?.status, 100),
        balance: safeText(result?.customer?.balance, 80),
        hasBalance: hasPositiveAmount(result?.customer?.balance)
      },
      range: {
        startDate: validDate(result?.range?.startDate) || validDate(options.startDate),
        endDate: validDate(result?.range?.endDate) || validDate(options.endDate)
      },
      latestWithdrawal: normalizeAtenaMovement(result?.latestWithdrawal),
      latestWithdrawals: (Array.isArray(result?.latestWithdrawals)
        ? result.latestWithdrawals
        : [result?.latestWithdrawal])
        .slice(0, MAX_WITHDRAWALS)
        .map(normalizeAtenaMovement)
        .filter(Boolean),
      latestExtractMovements: (Array.isArray(result?.latestExtractMovements)
        ? result.latestExtractMovements
        : [])
        .slice(0, MAX_MOVEMENTS)
        .map(normalizeAtenaMovement)
        .filter(Boolean),
      dailyExtractMovements: (Array.isArray(result?.dailyExtractMovements)
        ? result.dailyExtractMovements
        : [])
        .map(normalizeAtenaMovement)
        .filter(Boolean)
    }
  };
}

export function normalizeKycEvidence(result = {}, options = {}) {
  const expectedEmail = normalizeEmail(options.email);
  if (!expectedEmail || normalizeEmail(result?.email) !== expectedEmail) {
    return { ok: false, error: { code: "kyc_exact_email_mismatch", retryable: false } };
  }

  const users = normalizeKycSource(result?.sources?.users, "users", expectedEmail);
  const verifications = normalizeKycSource(
    result?.sources?.verifications,
    "verifications",
    expectedEmail
  );
  const allResults = [...users.results, ...verifications.results];
  if (!users.searched || !verifications.searched) {
    return { ok: false, error: { code: "kyc_incomplete_source_coverage", retryable: true } };
  }
  const exactMatches = allResults.length;

  return {
    ok: true,
    exactMatches,
    data: {
      queriedAt: validIso(result?.queriedAt),
      exactMatches: {
        total: exactMatches,
        users: users.exactMatches,
        verifications: verifications.exactMatches
      },
      overallStatus: overallKycStatus(allResults),
      sources: {
        users,
        verifications
      }
    }
  };
}

async function runBridgeLookup({
  tool,
  source,
  context,
  createJob,
  getJob,
  request,
  normalizeCompleted
}) {
  if (typeof createJob !== "function" || typeof getJob !== "function") {
    return evidenceResult({
      tool,
      source,
      context,
      status: CASE_TOOL_STATUSES.UNAVAILABLE,
      error: { code: `${source}_bridge_not_configured`, retryable: false }
    });
  }

  const reusable = reusableEvidence(context.previousEvidence, context);
  if (reusable) return reusable;

  let job = null;
  const previousJobId = previousBridgeJobId(context.previousEvidence, context.queryHash);
  try {
    job = previousJobId ? await getJob(previousJobId) : null;
    if (job && !jobReadableByOwner(job, context.ownerEmail)) {
      return evidenceResult({
        tool,
        source,
        context,
        status: CASE_TOOL_STATUSES.UNAVAILABLE,
        error: { code: `${source}_job_owner_mismatch`, retryable: false }
      });
    }
    if (!job) job = await createJob(request);
    if (!job?.id || !jobReadableByOwner(job, context.ownerEmail)) {
      return evidenceResult({
        tool,
        source,
        context,
        status: CASE_TOOL_STATUSES.UNAVAILABLE,
        error: { code: `${source}_job_owner_mismatch`, retryable: false }
      });
    }
  } catch (error) {
    return evidenceResult({
      tool,
      source,
      context,
      status: CASE_TOOL_STATUSES.UNAVAILABLE,
      error: safeBridgeError(error, `${source}_job_create_failed`)
    });
  }

  const deadline = Date.now() + context.waitBudgetMs;
  const lifecycle = previousLifecycle(context.previousEvidence);
  while (Date.now() <= deadline) {
    let current;
    try {
      current = await getJob(job.id);
    } catch (error) {
      return evidenceResult({
        tool,
        source,
        context,
        status: CASE_TOOL_STATUSES.UNAVAILABLE,
        error: safeBridgeError(error, `${source}_job_read_failed`),
        lifecycle
      });
    }

    if (current && !jobReadableByOwner(current, context.ownerEmail)) {
      return evidenceResult({
        tool,
        source,
        context,
        status: CASE_TOOL_STATUSES.UNAVAILABLE,
        error: { code: `${source}_job_owner_mismatch`, retryable: false },
        lifecycle
      });
    }

    const state = normalizeJobStatus(current?.status);
    if (state && lifecycle.at(-1) !== state) lifecycle.push(state);
    if (state === "completed") {
      const normalized = normalizeCompleted(current);
      if (!normalized.ok) {
        return evidenceResult({
          tool,
          source,
          context,
          status: CASE_TOOL_STATUSES.UNAVAILABLE,
          checkedAt: validIso(current?.completedAt) || context.now,
          error: normalized.error,
          lifecycle
        });
      }
      return evidenceResult({
        tool,
        source,
        context,
        status: normalized.status,
        verified: normalized.status !== CASE_TOOL_STATUSES.STALE,
        checkedAt: normalized.checkedAt,
        data: normalized.data,
        lifecycle
      });
    }
    if (state === "failed") {
      const error = safeJobFailure(source, current?.error);
      return evidenceResult({
        tool,
        source,
        context,
        status: error.notFound
          ? CASE_TOOL_STATUSES.NOT_FOUND
          : CASE_TOOL_STATUSES.UNAVAILABLE,
        verified: error.notFound,
        checkedAt: validIso(current?.completedAt) || context.now,
        data: error.notFound ? emptyEvidenceData(source, request) : {},
        error: error.notFound ? null : error.value,
        lifecycle
      });
    }

    if (Date.now() + context.pollIntervalMs > deadline) break;
    await context.sleep(context.pollIntervalMs);
  }

  return evidenceResult({
    tool,
    source,
    context,
    status: CASE_TOOL_STATUSES.UNAVAILABLE,
    data: {
      bridge: {
        jobId: safeText(job?.id, 100),
        state: lifecycle.at(-1) || "pending"
      }
    },
    error: { code: `${source}_lookup_pending`, retryable: true },
    lifecycle
  });
}

function normalizeAtenaJob(job, context) {
  const normalized = normalizeAtenaEvidence(job?.result, {
    email: context.email,
    startDate: job?.startDate,
    endDate: job?.endDate
  });
  if (!normalized.ok) return normalized;
  const checkedAt = validIso(job?.completedAt) || context.now;
  return {
    ok: true,
    status: expired(checkedAt, context.ttlSeconds, context.now)
      ? CASE_TOOL_STATUSES.STALE
      : CASE_TOOL_STATUSES.AVAILABLE,
    checkedAt,
    data: normalized.data
  };
}

function normalizeKycJob(job, context) {
  const normalized = normalizeKycEvidence(job?.result, { email: context.email });
  if (!normalized.ok) return normalized;
  const checkedAt = validIso(job?.result?.queriedAt)
    || validIso(job?.completedAt)
    || context.now;
  const status = expired(checkedAt, context.ttlSeconds, context.now)
    ? CASE_TOOL_STATUSES.STALE
    : normalized.exactMatches > 0
      ? CASE_TOOL_STATUSES.AVAILABLE
      : CASE_TOOL_STATUSES.NOT_FOUND;
  return { ok: true, status, checkedAt, data: normalized.data };
}

function evidenceResult({
  tool,
  source,
  context,
  status,
  verified = false,
  checkedAt = context.now,
  data = {},
  error = null,
  lifecycle = []
}) {
  return normalizeCaseToolResult({
    tool,
    source,
    status,
    verified,
    checkedAt,
    ttlSeconds: context.ttlSeconds,
    queryHash: context.queryHash,
    query: { type: "email", hash: context.queryHash },
    data: {
      ...data,
      lifecycle: [...new Set(lifecycle)].filter((item) => ["pending", "processing", "completed", "failed"].includes(item))
    },
    error
  }, { now: context.now });
}

function invalidLookupResult(tool, source, context) {
  const now = context.now || new Date().toISOString();
  return normalizeCaseToolResult({
    tool,
    source,
    status: CASE_TOOL_STATUSES.UNAVAILABLE,
    checkedAt: now,
    ttlSeconds: DEFAULT_TTL_SECONDS,
    queryHash: context.queryHash || "",
    query: { type: "email", hash: context.queryHash || "" },
    data: {},
    error: { code: context.error || "invalid_case_lookup", retryable: false }
  }, { now });
}

function normalizeLookupContext(input, dependencies) {
  const now = currentIso(dependencies.now);
  const email = normalizeEmail(input?.email);
  const ownerEmail = normalizeEmail(input?.ownerEmail);
  const hashSecret = safeText(
    dependencies.hashSecret
      || process.env.CASE_EVIDENCE_HASH_SECRET
      || process.env.SUPPORT_SESSION_SECRET,
    1000
  );
  const queryHash = email && hashSecret
    ? crypto.createHmac("sha256", hashSecret).update(email).digest("hex")
    : "";
  if (!email) return { ok: false, error: "case_evidence_email_required", now, queryHash };
  if (!ownerEmail) return { ok: false, error: "case_evidence_owner_required", now, queryHash };
  if (!hashSecret) return { ok: false, error: "case_evidence_hash_secret_missing", now, queryHash };

  return {
    ok: true,
    email,
    ownerEmail,
    caseId: safeText(input?.caseId, 180),
    now,
    queryHash,
    ttlSeconds: clampInt(dependencies.ttlSeconds, DEFAULT_TTL_SECONDS, 30, 24 * 60 * 60),
    waitBudgetMs: clampInt(dependencies.waitBudgetMs, DEFAULT_WAIT_BUDGET_MS, 0, 20 * 1000),
    pollIntervalMs: clampInt(dependencies.pollIntervalMs, DEFAULT_POLL_INTERVAL_MS, 10, 10 * 1000),
    previousEvidence: input?.previousEvidence && typeof input.previousEvidence === "object"
      ? input.previousEvidence
      : null,
    sleep: typeof dependencies.sleep === "function"
      ? dependencies.sleep
      : (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds))
  };
}

function buildEvidenceHash(email, preferredSecret) {
  const secret = safeText(
    preferredSecret
      || process.env.CASE_EVIDENCE_HASH_SECRET
      || process.env.SUPPORT_SESSION_SECRET,
    1000
  );
  return email && secret
    ? crypto.createHmac("sha256", secret).update(email).digest("hex")
    : "";
}

function normalizeKycSource(source = {}, sourceName, email) {
  const results = (Array.isArray(source?.results) ? source.results : [])
    .filter((record) => normalizeEmail(record?.personal?.email) === email)
    .slice(0, MAX_KYC_RESULTS_PER_SOURCE)
    .map((record) => normalizeKycRecord(record, sourceName));
  return {
    label: sourceName === "users" ? "Usuarios KYC" : "Verificaciones",
    searched: source?.searched === true,
    exactMatches: results.length,
    results
  };
}

function normalizeKycRecord(record = {}, sourceName) {
  const checks = record?.checks || {};
  const documents = record?.documents || {};
  return {
    source: sourceName,
    status: safeText(record?.status, 100),
    createdAt: validIso(record?.createdAt),
    updatedAt: validIso(record?.updatedAt),
    checks: {
      selfieVerified: booleanOrNull(checks.selfieVerified),
      documentVerified: booleanOrNull(checks.documentVerified),
      addressVerified: booleanOrNull(checks.addressVerified),
      livenessVerified: booleanOrNull(checks.livenessVerified),
      selfieDuplicated: checks.selfieDuplicated === true,
      documentDuplicated: checks.documentDuplicated === true,
      hasDuplicates: checks.hasDuplicates === true,
      riskFactors: (Array.isArray(checks.riskFactors) ? checks.riskFactors : [])
        .map((item) => normalizeKycRiskFactor(item?.type || item?.reason || item))
        .filter(Boolean)
        .slice(0, 8)
    },
    documents: {
      selfie: hasKycDocument(documents.selfie),
      ineFront: hasKycDocument(documents.ineFront),
      ineBack: hasKycDocument(documents.ineBack)
    }
  };
}

function normalizeKycRiskFactor(value) {
  const text = safeText(value, 300).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (!text) return "";
  if (/duplic/.test(text)) return "duplicate_identity";
  if (/selfie|rostro|facial/.test(text)) return "selfie_review";
  if (/document|ine|identific/.test(text)) return "document_review";
  if (/liveness|vida/.test(text)) return "liveness_review";
  if (/domicil|address/.test(text)) return "address_review";
  return "manual_review_required";
}

function overallKycStatus(records) {
  if (!records.length) return "not_found";
  if (records.some((record) => record.checks.hasDuplicates || record.checks.riskFactors.length)) {
    return "review_required";
  }
  const requiredChecks = records.flatMap((record) => [
    record.checks.selfieVerified,
    record.checks.documentVerified,
    record.checks.addressVerified,
    record.checks.livenessVerified
  ]);
  const hasMissingDocument = records.some((record) => !record.documents.selfie
    || !record.documents.ineFront
    || !record.documents.ineBack);
  if (requiredChecks.length && requiredChecks.every((value) => value === true) && !hasMissingDocument) {
    return "checks_complete";
  }
  return "incomplete";
}

function normalizeAtenaMovement(value) {
  if (!value || typeof value !== "object") return null;
  const movement = {
    date: safeText(value.date, 80),
    detail: safeText(value.detail, 240),
    amount: safeText(value.amount, 80),
    status: normalizeWithdrawalStatus(value.status),
    order: nonNegativeNumber(value.order)
  };
  return Object.values(movement).some(Boolean) ? movement : null;
}

function normalizeWithdrawalStatus(value) {
  const status = safeText(value, 100).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
  if (/^(?:PAGO|PAGA)$|PAGAD/.test(status)) return "PAGADO";
  if (/ANALIS(?:IS|E)|REVISION/.test(status)) return "EN ANÁLISIS";
  if (/AGUARDANDO|ESPERANDO|PENDIENTE.*APROB/.test(status)) return "AGUARDANDO APROBACIÓN";
  if (/CANCELAD|RECHAZAD|FAILED/.test(status)) return "CANCELADO";
  return status ? "SIN ESTADO" : "SIN ESTADO";
}

function safeJobFailure(source, value) {
  const code = safeText(value, 100).toLowerCase().replace(/[^a-z0-9_.-]/g, "_");
  const notFound = source === "atena" && code === "atena_customer_not_found";
  return {
    notFound,
    value: notFound ? null : {
      code: allowedFailureCode(source, code),
      retryable: !/(?:login_required|customer_not_found|exact_email_mismatch)/.test(code)
    }
  };
}

function safeBridgeError(error, fallbackCode) {
  const status = Number(error?.statusCode || error?.status || 0);
  if (status === 429) return { code: "rate_limited", retryable: true };
  if (status >= 500) return { code: "provider_unavailable", retryable: true };
  return { code: fallbackCode, retryable: true };
}

function allowedFailureCode(source, code) {
  const allowed = new Set([
    `${source}_login_required`,
    `${source}_job_expired`,
    `${source}_api_401`,
    `${source}_api_403`,
    `${source}_api_429`,
    `${source}_chrome_not_found`
  ]);
  return allowed.has(code) ? code : `${source}_lookup_failed`;
}

function emptyEvidenceData(source, request) {
  if (source === "kyc") {
    return {
      exactMatches: { total: 0, users: 0, verifications: 0 },
      overallStatus: "not_found",
      sources: {
        users: { label: "Usuarios KYC", searched: true, exactMatches: 0, results: [] },
        verifications: { label: "Verificaciones", searched: true, exactMatches: 0, results: [] }
      }
    };
  }
  return {
    customer: { status: "", balance: "", hasBalance: false },
    range: { startDate: request.startDate, endDate: request.endDate },
    latestWithdrawal: null,
    latestWithdrawals: [],
    latestExtractMovements: [],
    dailyExtractMovements: []
  };
}

function reusableEvidence(previous, context) {
  if (!previous || previous.query?.hash !== context.queryHash) return null;
  if (![CASE_TOOL_STATUSES.AVAILABLE, CASE_TOOL_STATUSES.NOT_FOUND].includes(previous.status)) return null;
  if (previous.verified !== true || Date.parse(previous.expiresAt || "") <= Date.parse(context.now)) return null;
  return normalizeCaseToolResult(previous, { now: context.now });
}

function previousBridgeJobId(previous, queryHash) {
  if (!previous || previous.query?.hash !== queryHash) return "";
  return safeText(previous?.data?.bridge?.jobId, 100);
}

function previousLifecycle(previous) {
  const values = Array.isArray(previous?.data?.lifecycle) ? previous.data.lifecycle : [];
  return [...new Set(values.map(normalizeJobStatus).filter(Boolean))];
}

function jobReadableByOwner(job, ownerEmail) {
  const normalizedOwner = normalizeEmail(ownerEmail);
  if (!normalizedOwner || !job) return false;
  return normalizeEmail(job.ownerEmail) === normalizedOwner
    || (Array.isArray(job.authorizedOwners)
      && job.authorizedOwners.some((value) => normalizeEmail(value) === normalizedOwner));
}

function hasKycDocument(value) {
  if (!value || typeof value !== "object") return false;
  return Boolean(safeText(value.url, 2000) || /disponible|verificad|aprob/i.test(safeText(value.status, 100)));
}

function hasPositiveAmount(value) {
  const numeric = Number(safeText(value, 80).replace(/[^0-9,.-]/g, "").replace(/,/g, ""));
  return Number.isFinite(numeric) && numeric > 0;
}

function normalizeJobStatus(value) {
  const status = safeText(value, 30).toLowerCase();
  return ["pending", "processing", "completed", "failed"].includes(status) ? status : "";
}

function currentIso(now) {
  const value = typeof now === "function" ? now() : now;
  return validIso(value) || new Date().toISOString();
}

function defaultStartDate(now) {
  const { year, month, day } = operationalDateParts(now);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 30);
  return date.toISOString().slice(0, 10);
}

function operationalDate(now) {
  const { year, month, day } = operationalDateParts(now);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function operationalDateParts(now) {
  const date = new Date(Date.parse(now));
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: OPERATIONAL_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(Number.isNaN(date.getTime()) ? new Date() : date);
  const value = Object.fromEntries(parts
    .filter((part) => ["year", "month", "day"].includes(part.type))
    .map((part) => [part.type, Number(part.value)]));
  return { year: value.year, month: value.month, day: value.day };
}

function expired(checkedAt, ttlSeconds, now) {
  return Date.parse(checkedAt) + ttlSeconds * 1000 <= Date.parse(now);
}

function normalizeEmail(value) {
  const email = safeText(value, 254).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}

function validDate(value) {
  const text = safeText(value, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function validIso(value) {
  const text = safeText(value, 80);
  return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : "";
}

function booleanOrNull(value) {
  return typeof value === "boolean" ? value : null;
}

function nonNegativeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, number) : 0;
}

function clampInt(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(min, Math.min(max, Math.trunc(number)));
}

function safeText(value, maxLength) {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}
