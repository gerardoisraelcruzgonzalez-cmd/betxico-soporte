import {
  CASE_TOOL_STATUSES,
  buildCaseToolQueryHash,
  normalizeCaseToolResult
} from "./case-operation-contracts.js";
import {
  lookupAtena as lookupAtenaBridge,
  lookupKyc as lookupKycBridge
} from "./case-bridge-tools.js";

const DEFAULT_JIRA_TTL_SECONDS = 5 * 60;
const DEFAULT_SLACK_CACHE_TTL_SECONDS = 60 * 60;
const DEFAULT_KYC_REVIEW_TTL_SECONDS = 8 * 60 * 60;
const MAX_RECORDS = 8;

export function createCaseReadTools({
  jiraSearch,
  cacheLookup,
  kycLookup,
  createAtenaJob,
  getAtenaJob,
  createKycJob,
  getKycJob,
  evidenceHashSecret,
  now = () => new Date().toISOString(),
  jiraTtlSeconds = DEFAULT_JIRA_TTL_SECONDS,
  slackCacheTtlSeconds = DEFAULT_SLACK_CACHE_TTL_SECONDS,
  kycReviewTtlSeconds = DEFAULT_KYC_REVIEW_TTL_SECONDS
} = {}) {
  return Object.freeze({
    lookupJira: (input) => lookupJiraCase(input, { jiraSearch, now, jiraTtlSeconds }),
    lookupSlack: (input) => lookupSlackCase(input, { cacheLookup, now, slackCacheTtlSeconds }),
    lookupAtena: (input) => lookupAtenaBridge(input, {
      createJob: createAtenaJob,
      getJob: getAtenaJob,
      hashSecret: evidenceHashSecret,
      now
    }),
    lookupKyc: (input) => lookupKycBridge(input, {
      createJob: createKycJob,
      getJob: getKycJob,
      hashSecret: evidenceHashSecret,
      now
    }),
    lookupKycReview: (input) => lookupKycCase(input, { kycLookup, now, kycReviewTtlSeconds }),
    lookupHistory: async (input) => {
      const [jira, slack] = await Promise.all([
        lookupJiraCase(input, { jiraSearch, now, jiraTtlSeconds }),
        lookupSlackCase(input, { cacheLookup, now, slackCacheTtlSeconds })
      ]);
      return { jira, slack };
    },
    lookupCase: async (input) => {
      const [jira, slack, atena, kyc, kycReview] = await Promise.all([
        lookupJiraCase(input, { jiraSearch, now, jiraTtlSeconds }),
        lookupSlackCase(input, { cacheLookup, now, slackCacheTtlSeconds }),
        lookupAtenaBridge(input, {
          createJob: createAtenaJob,
          getJob: getAtenaJob,
          hashSecret: evidenceHashSecret,
          now
        }),
        lookupKycBridge(input, {
          createJob: createKycJob,
          getJob: getKycJob,
          hashSecret: evidenceHashSecret,
          now
        }),
        lookupKycCase(input, { kycLookup, now, kycReviewTtlSeconds })
      ]);
      return { jira, slack, atena, kyc, kycReview };
    }
  });
}

export async function lookupJiraCase(input, {
  jiraSearch,
  now = () => new Date().toISOString(),
  jiraTtlSeconds = DEFAULT_JIRA_TTL_SECONDS
} = {}) {
  const checkedAt = currentIso(now);
  const query = normalizeLookupQuery(input);
  const queryHash = buildCaseToolQueryHash(query || { invalid: true });

  if (!query) {
    return toolResult({
      tool: "case.jira.lookup",
      source: "jira",
      status: CASE_TOOL_STATUSES.UNAVAILABLE,
      checkedAt,
      queryHash,
      error: { code: "invalid_case_lookup", retryable: false }
    });
  }
  if (typeof jiraSearch !== "function") {
    return toolResult({
      tool: "case.jira.lookup",
      source: "jira",
      status: CASE_TOOL_STATUSES.UNAVAILABLE,
      checkedAt,
      queryHash,
      error: { code: "jira_lookup_not_configured", retryable: false }
    });
  }

  try {
    // The dependency receives plain data. External text is never interpreted as an instruction.
    const response = await jiraSearch(query.value, {
      queryType: query.type,
      queryHash
    });
    const candidates = extractRecords(response).map(normalizeJiraRecord);
    const records = candidates
      .filter((record) => jiraRecordMatchesQuery(record, query))
      .slice(0, MAX_RECORDS);
    const status = records.length
      ? CASE_TOOL_STATUSES.AVAILABLE
      : CASE_TOOL_STATUSES.NOT_FOUND;

    return toolResult({
      tool: "case.jira.lookup",
      source: "jira",
      status,
      verified: true,
      checkedAt,
      ttlSeconds: jiraTtlSeconds,
      queryHash,
      data: {
        queryType: query.type,
        count: records.length,
        candidateCount: candidates.length,
        records,
        untrustedExternalData: true
      }
    });
  } catch (error) {
    return toolResult({
      tool: "case.jira.lookup",
      source: "jira",
      status: CASE_TOOL_STATUSES.UNAVAILABLE,
      checkedAt,
      queryHash,
      error: safeLookupError(error, "jira_lookup_failed")
    });
  }
}

export async function lookupSlackCase(input, {
  cacheLookup,
  now = () => new Date().toISOString(),
  slackCacheTtlSeconds = DEFAULT_SLACK_CACHE_TTL_SECONDS
} = {}) {
  const checkedAt = currentIso(now);
  const query = normalizeLookupQuery(input);
  const queryHash = buildCaseToolQueryHash(query || { invalid: true });

  if (!query) {
    return toolResult({
      tool: "case.slack-cache.lookup",
      source: "slack_cache",
      status: CASE_TOOL_STATUSES.UNAVAILABLE,
      checkedAt,
      queryHash,
      error: { code: "invalid_case_lookup", retryable: false }
    });
  }
  if (typeof cacheLookup !== "function") {
    return toolResult({
      tool: "case.slack-cache.lookup",
      source: "slack_cache",
      status: CASE_TOOL_STATUSES.UNAVAILABLE,
      checkedAt,
      queryHash,
      error: { code: "slack_cache_not_configured", retryable: false }
    });
  }

  try {
    const response = await cacheLookup(query.value, {
      queryType: query.type,
      queryHash
    });
    const cacheCheckedAt = validIso(response?.checkedAt || response?.cachedAt);
    const cacheExpiresAt = validIso(response?.expiresAt)
      || (cacheCheckedAt ? addSeconds(cacheCheckedAt, slackCacheTtlSeconds) : "");
    const records = extractRecords(response).slice(0, MAX_RECORDS).map(normalizeSlackRecord);
    const coverage = normalizeCacheCoverage(response?.coverage);
    const expired = !cacheCheckedAt
      || !cacheExpiresAt
      || Date.parse(cacheExpiresAt) <= Date.parse(checkedAt);
    const absenceCannotBeVerified = records.length === 0 && coverage.complete !== true;
    const explicitStatus = normalizeProviderStatus(response?.status);
    const status = explicitStatus === CASE_TOOL_STATUSES.UNAVAILABLE
      ? CASE_TOOL_STATUSES.UNAVAILABLE
      : expired || explicitStatus === CASE_TOOL_STATUSES.STALE || absenceCannotBeVerified
        ? CASE_TOOL_STATUSES.STALE
        : records.length
          ? CASE_TOOL_STATUSES.AVAILABLE
          : CASE_TOOL_STATUSES.NOT_FOUND;

    return toolResult({
      tool: "case.slack-cache.lookup",
      source: "slack_cache",
      status,
      verified: [CASE_TOOL_STATUSES.AVAILABLE, CASE_TOOL_STATUSES.NOT_FOUND].includes(status),
      checkedAt: cacheCheckedAt || checkedAt,
      expiresAt: cacheExpiresAt || checkedAt,
      queryHash,
      data: {
        queryType: query.type,
        count: records.length,
        records,
        cacheOnly: true,
        coverage,
        untrustedExternalData: true
      },
      error: status === CASE_TOOL_STATUSES.UNAVAILABLE
        ? { code: "slack_cache_unavailable", retryable: true }
        : expired && !cacheCheckedAt
          ? { code: "slack_cache_freshness_unknown", retryable: true }
          : null
    });
  } catch (error) {
    return toolResult({
      tool: "case.slack-cache.lookup",
      source: "slack_cache",
      status: CASE_TOOL_STATUSES.UNAVAILABLE,
      checkedAt,
      queryHash,
      error: safeLookupError(error, "slack_cache_lookup_failed")
    });
  }
}

export async function lookupKycCase(input, {
  kycLookup,
  now = () => new Date().toISOString(),
  kycReviewTtlSeconds = DEFAULT_KYC_REVIEW_TTL_SECONDS
} = {}) {
  const checkedAt = currentIso(now);
  const email = typeof input === "object" && input !== null
    ? normalizeEmail(input.email)
    : normalizeEmail(input);
  const query = email ? { type: "email", value: email } : null;
  const queryHash = buildCaseToolQueryHash(query || { invalid: true });

  if (!query || query.type !== "email") {
    return toolResult({
      tool: "case.kyc-review.lookup",
      source: "kyc_manual_review",
      status: CASE_TOOL_STATUSES.UNAVAILABLE,
      checkedAt,
      queryHash,
      error: { code: "kyc_email_required", retryable: false }
    });
  }
  if (typeof kycLookup !== "function") {
    return toolResult({
      tool: "case.kyc-review.lookup",
      source: "kyc_manual_review",
      status: CASE_TOOL_STATUSES.UNAVAILABLE,
      checkedAt,
      queryHash,
      error: { code: "kyc_review_lookup_not_configured", retryable: false }
    });
  }

  try {
    const response = await kycLookup(query.value, { queryType: query.type, queryHash });
    const exactMatch = response && normalizeEmail(response.email) === query.value ? response : null;
    if (!exactMatch) {
      return toolResult({
        tool: "case.kyc-review.lookup",
        source: "kyc_manual_review",
        status: CASE_TOOL_STATUSES.NOT_FOUND,
        verified: true,
        checkedAt,
        ttlSeconds: kycReviewTtlSeconds,
        queryHash,
        data: { queryType: "email", record: null }
      });
    }

    const reviewedAt = validIso(exactMatch.createdAt || exactMatch.reviewedAt);
    const expiresAt = reviewedAt ? addSeconds(reviewedAt, kycReviewTtlSeconds) : checkedAt;
    const stale = !reviewedAt || Date.parse(expiresAt) <= Date.parse(checkedAt);
    return toolResult({
      tool: "case.kyc-review.lookup",
      source: "kyc_manual_review",
      status: stale ? CASE_TOOL_STATUSES.STALE : CASE_TOOL_STATUSES.AVAILABLE,
      verified: !stale,
      checkedAt,
      expiresAt,
      queryHash,
      data: {
        queryType: "email",
        record: {
          reviewId: clean(exactMatch.id || exactMatch.reviewId, 180),
          status: normalizeKycStatus(exactMatch.status),
          reviewedAt,
          reviewedByHuman: true
        }
      },
      error: stale ? { code: "kyc_review_stale", retryable: false } : null
    });
  } catch (error) {
    return toolResult({
      tool: "case.kyc-review.lookup",
      source: "kyc_manual_review",
      status: CASE_TOOL_STATUSES.UNAVAILABLE,
      checkedAt,
      queryHash,
      error: safeLookupError(error, "kyc_review_lookup_failed")
    });
  }
}

export function normalizeCaseReadQuery(input) {
  return normalizeLookupQuery(input);
}

function normalizeLookupQuery(input) {
  if (typeof input === "string") return inferStringQuery(input);
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;

  const ticketKey = normalizeTicketKey(input.ticketKey || input.key);
  if (ticketKey) return { type: "ticket_key", value: ticketKey };

  const email = normalizeEmail(input.email);
  if (email) return { type: "email", value: email };

  const authId = normalizeAuthId(input.authId || input.authID || input.userId);
  if (authId) return { type: "auth_id", value: authId };

  return null;
}

function inferStringQuery(value) {
  const ticketKey = normalizeTicketKey(value);
  if (ticketKey) return { type: "ticket_key", value: ticketKey };
  const email = normalizeEmail(value);
  if (email) return { type: "email", value: email };
  const authId = normalizeAuthId(value);
  return authId ? { type: "auth_id", value: authId } : null;
}

function normalizeJiraRecord(record) {
  const customer = record?.customer || record?.identity || {};
  const comments = Array.isArray(record?.comments) ? record.comments : [];
  const latestComment = comments.at(-1);
  return {
    ticketKey: clean(record?.key || record?.ticketKey, 40),
    status: clean(record?.status, 120),
    priority: clean(record?.priority, 80),
    updatedAt: validIso(record?.updated || record?.updatedAt),
    url: safeHttpUrl(record?.url),
    customer: {
      email: normalizeEmail(customer.email),
      authId: normalizeAuthId(customer.authId)
    },
    untrustedContent: {
      summary: clean(record?.summary, 300),
      description: clean(record?.description, 1200),
      latestComment: clean(
        typeof latestComment === "object" ? latestComment?.body : latestComment,
        800
      )
    }
  };
}

function jiraRecordMatchesQuery(record, query) {
  if (query.type === "ticket_key") {
    return normalizeTicketKey(record.ticketKey) === query.value;
  }
  if (query.type === "email") {
    return normalizeEmail(record.customer?.email) === query.value;
  }
  if (query.type === "auth_id") {
    return normalizeComparableAuthId(record.customer?.authId) === normalizeComparableAuthId(query.value);
  }
  return false;
}

function normalizeSlackRecord(record) {
  return {
    listId: clean(record?.listId || record?.list_id, 80),
    recordId: clean(record?.recordId || record?.id || record?.rowId, 120),
    status: clean(record?.status || record?.state, 120),
    updatedAt: validIso(record?.updatedAt || record?.updated_at || record?.dateUpdated),
    customer: {
      email: normalizeEmail(record?.email || record?.customer?.email),
      authId: normalizeAuthId(record?.authId || record?.auth_id || record?.customer?.authId)
    },
    untrustedContent: {
      reason: clean(record?.reason || record?.motivo || record?.retentionReason, 800),
      note: clean(record?.note || record?.comment || record?.comentario, 800)
    }
  };
}

function extractRecords(response) {
  if (Array.isArray(response)) return response;
  if (!response || typeof response !== "object") return [];
  for (const key of ["records", "tickets", "issues", "items", "rows"]) {
    if (Array.isArray(response[key])) return response[key];
  }
  return [];
}

function normalizeCacheCoverage(value) {
  const coverage = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const expectedPanels = nonNegativeInt(coverage.expectedPanels ?? coverage.totalPanels);
  const cachedPanels = nonNegativeInt(coverage.cachedPanels ?? coverage.coveredPanels);
  const missingPanels = nonNegativeInt(
    coverage.missingPanels ?? Math.max(0, expectedPanels - cachedPanels)
  );
  const partialPanels = nonNegativeInt(coverage.partialPanels);
  const complete = coverage.complete === true
    && expectedPanels > 0
    && cachedPanels >= expectedPanels
    && missingPanels === 0
    && partialPanels === 0;

  return {
    status: complete ? "complete" : "partial",
    complete,
    expectedPanels,
    cachedPanels,
    missingPanels,
    partialPanels
  };
}

function toolResult(input) {
  return normalizeCaseToolResult(input, { now: input.checkedAt });
}

function safeLookupError(error, fallbackCode) {
  const status = Number(error?.statusCode || error?.status || 0);
  if (status === 429) return { code: "rate_limited", retryable: true };
  if (status >= 500) return { code: "provider_unavailable", retryable: true };
  return { code: fallbackCode, retryable: true };
}

function normalizeProviderStatus(value) {
  const status = String(value || "").trim().toLowerCase();
  return Object.values(CASE_TOOL_STATUSES).includes(status) ? status : "";
}

function normalizeKycStatus(value) {
  const status = String(value || "").trim().toLowerCase();
  return new Set(["complete", "incomplete"]).has(status) ? status : "unknown";
}

function currentIso(now) {
  const value = typeof now === "function" ? now() : now;
  return validIso(value) || new Date().toISOString();
}

function normalizeTicketKey(value) {
  const key = String(value || "").trim().toUpperCase();
  return /^[A-Z][A-Z0-9]{1,19}-\d{1,12}$/.test(key) ? key : "";
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email.slice(0, 254) : "";
}

function normalizeAuthId(value) {
  const authId = String(value || "").trim();
  return /^[A-Za-z0-9][A-Za-z0-9._:-]{1,63}$/.test(authId) ? authId : "";
}

function normalizeComparableAuthId(value) {
  return normalizeAuthId(value).toLowerCase();
}

function nonNegativeInt(value) {
  const number = Number(value);
  return Number.isSafeInteger(number) && number >= 0 ? number : 0;
}

function safeHttpUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return ["http:", "https:"].includes(url.protocol) ? url.toString().slice(0, 500) : "";
  } catch {
    return "";
  }
}

function clean(value, maxLength) {
  return String(value || "")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function validIso(value) {
  const text = String(value || "").trim();
  return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : "";
}

function addSeconds(value, seconds) {
  const safeSeconds = Number.isFinite(Number(seconds)) ? Number(seconds) : 0;
  return new Date(Date.parse(value) + Math.max(0, safeSeconds) * 1000).toISOString();
}
