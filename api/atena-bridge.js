import { optionalEnv, readJson, requireWidgetAccess, requiredEnv, sendJson } from "../lib/http.js";
import { getCentralJiraAccountForOwner, getJiraAccountForOwner, requireCurrentAccount } from "../lib/account-store.js";
import { requireAgentCapability } from "../lib/tool-access.js";
import { isSupportAdmin } from "../lib/remote-config.js";
import { authenticateConnectorAgent } from "../lib/connector-agent-auth.js";
import { canReadAtenaJob, claimAtenaJob, completeAtenaJob, createAtenaJob, getJob } from "../lib/atena-bridge-store.js";
import { canReadKycJob, claimKycJob, completeKycJob, createKycJob, getKycJob } from "../lib/kyc-bridge-store.js";
import { beginBobJiraTicket, claimBobJob, completeBobJob, createBobJob, finishBobJiraTicket, getBobJob, listBobJobs, recordBobJobCheckpoint, scheduleBobJobRetry, updateBobJobCustomer, updateBobJobProgress } from "../lib/bob-bridge-store.js";
import { createBobClosureJiraTicket, summarizeBobJiraError } from "../lib/bob-jira-ticket.js";
import { processCompletedAtenaEvidence } from "../lib/case-evidence-auto-response.js";
import { processCompletedBobClosure } from "../lib/case-bob-auto-response.js";

export default async function handler(req, res) {
  try {
    const action = String(req.query?.action || "").trim();
    const service = String(req.query?.service || "atena").trim().toLowerCase();
    if (service === "kyc") return await handleKyc(req, res, action);
    if (service === "bob") return await handleBob(req, res, action);
    if (action === "claim" || action === "complete") return await handleConnector(req, res, action);
    requireWidgetAccess(req);
    const account = await requireCurrentAccount(req);
    const body = await readJson(req);
    if (action === "request") {
      await requireAgentCapability(account, "atena");
      const { email, startDate, endDate } = body;
      if (!validEmail(email) || !validDate(startDate) || !validDate(endDate) || startDate > endDate) throw Object.assign(new Error("invalid_query"), { statusCode: 400 });
      // Public bridge callers can query their own evidence, but cannot bind an
      // arbitrary LiveChat case to an automatic customer response.
      return sendJson(res, 202, { ok: true, job: await createAtenaJob({ ownerEmail: account.email, email, startDate, endDate }) });
    }
    if (action === "result") {
      const job = await getJob(String(body.jobId || ""));
      if (!canReadAtenaJob(job, account.email)) throw Object.assign(new Error("atena_job_not_found"), { statusCode: 404 });
      return sendJson(res, 200, { ok: true, job });
    }
    return sendJson(res, 404, { ok: false, error: "atena_bridge_action_not_found" });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, { ok: false, error: error.message || "atena_bridge_failed" });
  }
}

async function handleBob(req, res, action) {
  if (action === "claim" || action === "progress" || action === "checkpoint" || action === "retry" || action === "complete") return await handleBobConnector(req, res, action);
  requireWidgetAccess(req);
  const account = await requireCurrentAccount(req);
  const body = await readJson(req);
  if (action === "request") {
    await requireAgentCapability(account, "bob");
    const customerId = String(body.customerId || body.authId || "").trim();
    if (!/^\d{3,20}$/.test(customerId)) throw Object.assign(new Error("invalid_customer_id"), { statusCode: 400 });
    const customer = requireBobTicketCustomer(body.customer || {});
    return sendJson(res, 202, { ok: true, job: await createBobJob({
      ownerEmail: account.email,
      customerId,
      reportedGame: String(body.reportedGame || ""),
      chatId: String(body.chatId || "").slice(0, 120),
      customer
    }) });
  }
  if (action === "result") {
    const job = await getBobJob(String(body.jobId || ""));
    if (!job || job.ownerEmail !== account.email) throw Object.assign(new Error("bob_job_not_found"), { statusCode: 404 });
    return sendJson(res, 200, { ok: true, job });
  }
  if (action === "history") {
    await requireAgentCapability(account, "bob");
    const includeAll = await isSupportAdmin(account.email);
    const jobs = await listBobJobs({ ownerEmail: account.email, includeAll, limit: Number(body.limit || 40) });
    return sendJson(res, 200, { ok: true, jobs: jobs.map((job) => publicBobJob(job, includeAll)) });
  }
  if (action === "jira-ticket-retry") {
    await requireAgentCapability(account, "bob");
    const job = await getBobJob(String(body.jobId || ""));
    const includeAll = await isSupportAdmin(account.email);
    if (!job || (job.ownerEmail !== account.email && !includeAll)) throw Object.assign(new Error("bob_job_not_found"), { statusCode: 404 });
    if (job.status !== "completed") throw Object.assign(new Error("bob_jira_ticket_requires_completed_closure"), { statusCode: 409 });
    const contextualized = await updateBobJobCustomer(job.id, body.customer || {});
    const updated = await createBobJiraTicket(contextualized.id);
    return sendJson(res, 200, { ok: true, job: publicBobJob(updated || contextualized, includeAll) });
  }
  return sendJson(res, 404, { ok: false, error: "bob_bridge_action_not_found" });
}

export function requireBobTicketCustomer(customer = {}) {
  const name = String(customer.name || "").trim();
  const email = String(customer.email || "").trim().toLowerCase();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw Object.assign(new Error("bob_customer_data_required"), { statusCode: 400 });
  }
  return { name, email };
}

async function handleKyc(req, res, action) {
  if (action === "claim" || action === "complete") return await handleKycConnector(req, res, action);
  requireWidgetAccess(req);
  const account = await requireCurrentAccount(req);
  const body = await readJson(req);
  if (action === "request") {
    await requireAgentCapability(account, "kyc");
    const email = String(body.email || "").trim().toLowerCase();
    if (!validEmail(email)) throw Object.assign(new Error("invalid_query"), { statusCode: 400 });
    return sendJson(res, 202, { ok: true, job: await createKycJob({ ownerEmail: account.email, email }) });
  }
  if (action === "result") {
    const job = await getKycJob(String(body.jobId || ""));
    if (!canReadKycJob(job, account.email)) throw Object.assign(new Error("kyc_job_not_found"), { statusCode: 404 });
    return sendJson(res, 200, { ok: true, job });
  }
  return sendJson(res, 404, { ok: false, error: "kyc_bridge_action_not_found" });
}

async function handleConnector(req, res, action) {
  const connector = authenticateConnector(req, "atena", "x-atena-connector-token", requiredEnv("ATENA_CONNECTOR_TOKEN"));
  if (!connector) return sendJson(res, 401, { ok: false, error: "connector_unauthorized" });
  const body = await readJson(req);
  if (action === "claim") return sendJson(res, 200, { ok: true, job: await claimAtenaJob(connector.email) });
  if (!(await connectorOwnsJob(getJob, String(body.jobId || ""), connector))) return sendJson(res, 404, { ok: false, error: "atena_job_not_found" });
  const result = await completeAtenaJob(String(body.jobId || ""), body.result, String(body.error || ""));
  const automation = result?.status === "completed"
    ? await processCompletedAtenaEvidence(result).catch(() => null)
    : null;
  return sendJson(res, result ? 200 : 404, { ok: Boolean(result), automation: automation || undefined });
}

async function handleKycConnector(req, res, action) {
  const configuredToken = optionalEnv("KYC_CONNECTOR_TOKEN") || requiredEnv("ATENA_CONNECTOR_TOKEN");
  const connector = authenticateConnector(req, "kyc", "x-kyc-connector-token", configuredToken);
  if (!connector) return sendJson(res, 401, { ok: false, error: "connector_unauthorized" });
  const body = await readJson(req);
  if (action === "claim") return sendJson(res, 200, { ok: true, job: await claimKycJob(connector.email) });
  if (!(await connectorOwnsJob(getKycJob, String(body.jobId || ""), connector))) return sendJson(res, 404, { ok: false, error: "kyc_job_not_found" });
  const result = await completeKycJob(String(body.jobId || ""), body.result, String(body.error || ""));
  return sendJson(res, result ? 200 : 404, { ok: Boolean(result) });
}

async function handleBobConnector(req, res, action) {
  const connector = authenticateConnector(req, "bob", "x-bob-connector-token", requiredEnv("BOB_CONNECTOR_TOKEN"));
  if (!connector) return sendJson(res, 401, { ok: false, error: "connector_unauthorized" });
  const body = await readJson(req);
  if (action === "claim") return sendJson(res, 200, { ok: true, job: await claimBobJob(connector.email) });
  if (!(await connectorOwnsJob(getBobJob, String(body.jobId || ""), connector))) return sendJson(res, 404, { ok: false, error: "bob_job_not_found" });
  if (action === "progress") {
    const job = await updateBobJobProgress(String(body.jobId || ""), body.progress || {});
    return sendJson(res, job ? 200 : 404, { ok: Boolean(job) });
  }
  if (action === "checkpoint") {
    const job = await recordBobJobCheckpoint(String(body.jobId || ""), body.checkpoint || {});
    return sendJson(res, job ? 200 : 404, { ok: Boolean(job) });
  }
  if (action === "retry") {
    const job = await scheduleBobJobRetry(String(body.jobId || ""), String(body.error || ""));
    return sendJson(res, job ? 200 : 404, { ok: Boolean(job) });
  }
  const result = await completeBobJob(String(body.jobId || ""), body.result, String(body.error || ""));
  if (!result) return sendJson(res, 404, { ok: false });
  if (!String(body.error || "")) await createBobJiraTicket(result.id);
  const automation = !String(body.error || "")
    ? await processCompletedBobClosure(result).catch(() => null)
    : null;
  return sendJson(res, 200, { ok: true, automation: automation || undefined });
}

async function createBobJiraTicket(jobId) {
  const claim = await beginBobJiraTicket(jobId);
  if (claim.state !== "claimed") return claim.job;
  try {
    const account = await getJiraAccountForOwner(claim.job.ownerEmail)
      || await getCentralJiraAccountForOwner(claim.job.ownerEmail);
    if (!account) throw new Error("bob_jira_agent_not_configured");
    const ticket = await createBobClosureJiraTicket({ job: claim.job, account });
    return await finishBobJiraTicket(jobId, ticket);
  } catch (error) {
    return await finishBobJiraTicket(jobId, {}, summarizeBobJiraError(error));
  }
}

function authenticateConnector(req, service, legacyHeader, legacyToken) {
  if (req.method !== "POST") return null;
  const agent = authenticateConnectorAgent(req, service);
  if (agent?.mode === "agent") return agent;
  if (agent === null) return null;
  return String(req.headers[legacyHeader] || "") === legacyToken ? agent : null;
}

async function connectorOwnsJob(readJob, jobId, connector) {
  const job = await readJob(jobId);
  if (!job) return false;
  if (job.connectorMode === "agent") return connector.mode === "agent";
  return connector.mode === "legacy";
}

function publicBobJob(job, includeActor = false) {
  return {
    id: job.id,
    customerId: job.customerId,
    reportedGame: job.reportedGame || "",
    chatId: job.chatId || "",
    status: job.status,
    createdAt: job.createdAt,
    startedAt: job.startedAt || "",
    completedAt: job.completedAt || "",
    progress: job.progress || null,
    result: publicBobResult(job.result),
    jiraTicket: job.jiraTicket || null,
    error: job.error || "",
    ...(includeActor ? { requestedBy: job.ownerEmail } : {})
  };
}

function publicBobResult(result) {
  if (!result || typeof result !== "object") return result || null;
  const { jiraEvidence, ...safeResult } = result;
  return safeResult;
}

function validEmail(value) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "")); }
function validDate(value) { return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")); }
