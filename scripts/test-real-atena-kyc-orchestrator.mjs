#!/usr/bin/env node
import crypto from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { createAtenaJob, getJob as getAtenaJob } from "../lib/atena-bridge-store.js";
import { createKycJob, getKycJob } from "../lib/kyc-bridge-store.js";
import { lookupAtena, lookupKyc } from "../lib/case-bridge-tools.js";
import { evolveSupportCase } from "../lib/case-orchestrator.js";
import { buildCaseDraftContext, generateCaseDraft } from "../lib/case-draft.js";

loadLocalEnvironment();

const email = normalizeEmail(process.env.CASE_TEST_EMAIL);
const ownerEmail = normalizeEmail(process.env.CASE_TEST_OWNER_EMAIL);
const hashSecret = String(
  process.env.CASE_EVIDENCE_HASH_SECRET
    || process.env.SUPPORT_SESSION_SECRET
    || ""
).trim();
const timeoutMs = clamp(Number(process.env.CASE_TEST_TIMEOUT_MS || 180_000), 30_000, 180_000);
if (!email) fail("CASE_TEST_EMAIL_required");
if (!ownerEmail) fail("CASE_TEST_OWNER_EMAIL_required");
if (!hashSecret) fail("CASE_EVIDENCE_HASH_SECRET_required");

const startedAt = new Date().toISOString();
const endDate = startedAt.slice(0, 10);
const start = new Date(Date.parse(startedAt));
start.setUTCDate(start.getUTCDate() - 30);
const startDate = start.toISOString().slice(0, 10);

const [atena, kyc] = await Promise.all([
  completeLookup({
    lookup: lookupAtena,
    input: { email, ownerEmail, caseId: "controlled-e2e", startDate, endDate },
    dependencies: { createJob: createAtenaJob, getJob: getAtenaJob, hashSecret }
  }),
  completeLookup({
    lookup: lookupKyc,
    input: { email, ownerEmail, caseId: "controlled-e2e" },
    dependencies: { createJob: createKycJob, getJob: getKycJob, hashSecret }
  })
]);

const initial = evolveSupportCase(null, {
  chatId: `simulator:e2e-${crypto.randomUUID()}`,
  customer: { email },
  events: [{
    eventId: `e2e-${crypto.randomUUID()}`,
    role: "customer",
    text: "Mi retiro sigue en revisión y necesito saber qué falta.",
    createdAt: new Date().toISOString()
  }],
  source: { type: "controlled_e2e", synthetic: true, ownerEmail },
  now: new Date().toISOString()
});
const caseRecord = evolveSupportCase(initial, {
  chatId: initial.chatId,
  customer: initial.customer,
  events: [],
  systemFacts: {
    caseAtenaLookup: atena,
    caseKycLookup: kyc
  },
  source: initial.source,
  now: new Date().toISOString()
});
const context = buildCaseDraftContext(caseRecord);
const generated = await generateCaseDraft({ caseRecord });
const evidenceText = JSON.stringify({ atena, kyc, context });
const draftText = JSON.stringify(generated.draft);
const terminalStatuses = new Set(["available", "not_found", "stale"]);
const result = {
  ok: terminalStatuses.has(atena.status) && terminalStatuses.has(kyc.status),
  controlledReadOnlyTest: true,
  elapsedSeconds: Math.round((Date.now() - Date.parse(startedAt)) / 1000),
  flow: {
    atena: {
      status: atena.status,
      lifecycle: atena.data?.lifecycle || [],
      withdrawalStatus: atena.data?.latestWithdrawal?.status || "SIN RETIRO"
    },
    kyc: {
      status: kyc.status,
      lifecycle: kyc.data?.lifecycle || [],
      exactMatches: Number(kyc.data?.exactMatches?.total || 0),
      usersSearched: kyc.data?.sources?.users?.searched === true,
      verificationsSearched: kyc.data?.sources?.verifications?.searched === true
    },
    decision: {
      route: caseRecord.operationalDecision?.route || "",
      source: caseRecord.operationalDecision?.source || ""
    },
    draft: {
      provider: generated.provider,
      model: generated.model,
      usedSources: generated.draft?.usedSources || [],
      requiresHumanReview: generated.draft?.requiresHumanReview === true,
      executable: generated.draft?.executable === true
    }
  },
  privacy: {
    irreversibleEmailHash: /^[a-f0-9]{64}$/u.test(atena.query?.hash || "")
      && /^[a-f0-9]{64}$/u.test(kyc.query?.hash || ""),
    emailAbsentFromEvidenceAndPrompt: !evidenceText.includes(email),
    emailAbsentFromDraft: !draftText.includes(email),
    noDocumentUrlsInModelContext: !/https?:\/\//iu.test(JSON.stringify(context.sources?.kyc || {}))
  },
  writesPerformed: {
    atena: false,
    kyc: false,
    jira: false,
    slack: false,
    livechat: false
  }
};

console.log(JSON.stringify(result, null, 2));
if (!result.ok
  || !result.privacy.irreversibleEmailHash
  || !result.privacy.emailAbsentFromEvidenceAndPrompt
  || !result.privacy.emailAbsentFromDraft
  || !result.privacy.noDocumentUrlsInModelContext
  || !result.flow.draft.requiresHumanReview
  || result.flow.draft.executable) {
  process.exitCode = 1;
}

async function completeLookup({ lookup, input, dependencies }) {
  const deadline = Date.now() + timeoutMs;
  let previousEvidence = null;
  do {
    const evidence = await lookup({ ...input, previousEvidence }, {
      ...dependencies,
      waitBudgetMs: 8_000,
      pollIntervalMs: 2_000
    });
    if (!isPending(evidence)) return evidence;
    previousEvidence = evidence;
    await delay(1_000);
  } while (Date.now() < deadline);
  return previousEvidence;
}

function isPending(value) {
  return value?.status === "unavailable"
    && value?.error?.retryable === true
    && /_lookup_pending$/u.test(String(value?.error?.code || ""));
}

function loadLocalEnvironment() {
  for (const file of [".env.production.local", ".env.local", ".env.vercel.local"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/u)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/u);
      if (!match || process.env[match[1]]) continue;
      process.env[match[1]] = match[2].replace(/^['"]|['"]$/gu, "");
    }
  }
}

function normalizeEmail(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalized) ? normalized : "";
}

function clamp(value, min, max) {
  return Number.isFinite(value) ? Math.max(min, Math.min(max, Math.trunc(value))) : max;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
