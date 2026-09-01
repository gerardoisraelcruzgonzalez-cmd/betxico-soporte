#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { homedir } from "node:os";
import path from "node:path";
import { runBobQueueTick } from "../lib/bob-connector-scheduler.js";
import { BobNativeClient, isPendingBobSession, pendingWinsFromSessions, summariseBobSession } from "../lib/bob-native-client.js";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");
loadLocalEnv();
const CONNECTOR_VERSION = "1.1.1-cdp-recovery";
const BOB_URL = "https://tools.solutions.vsslots.com/bob/login.php";
const BOB_SESSIONS_URL = "https://tools.solutions.vsslots.com/bob/applications/CAS/SES00/";
const LOCK_PORT = Number(process.env.BOB_CONNECTOR_LOCK_PORT || 8794);
const DEBUG_PORT = Number(process.env.BOB_BROWSER_DEBUG_PORT || 8795);
const bridgeUrl = String(process.env.BOB_BRIDGE_URL || "https://support-livechat-app.vercel.app/api/atena-bridge?service=bob").replace(/\/$/, "");
const connectorToken = String(process.env.BOB_CONNECTOR_TOKEN || "").trim();
const connectorAgentEmail = String(process.env.CONNECTOR_AGENT_EMAIL || "").trim().toLowerCase();
const connectorAgentToken = String(process.env.BOB_CONNECTOR_AGENT_TOKEN || "").trim();
let context = null;
let page = null;
let pollTimer = null;
let polling = false;
let processLock = null;
let stopping = false;
let ownsBrowserContext = false;

async function getBobPage() {
  if (context && !page?.isClosed()) return page;
  const cdpUrls = [...new Set([
    String(process.env.BOB_CDP_URL || "").trim(),
    `http://127.0.0.1:${DEBUG_PORT}`
  ].filter(Boolean))];
  for (const cdpUrl of cdpUrls) {
    try {
      const browser = await chromium.connectOverCDP(cdpUrl);
      context = browser.contexts()[0];
      if (!context) throw new Error("bob_cdp_context_unavailable");
      page = context?.pages().find((item) => !item.isClosed()) || await context.newPage();
      ownsBrowserContext = false;
      console.log(`BoB browser attached to the existing authenticated profile (${cdpUrl}).`);
      return page;
    } catch {
      // An old CDP address must not make the connector launch a duplicate
      // Chrome profile. Try the active local debug port before a new browser.
    }
  }
  console.log("Existing BoB browser unavailable; opening the persistent profile.");
  const profile = process.env.BOB_BROWSER_PROFILE || path.join(homedir(), "Library", "Application Support", `BetxicoBobConnector${connectorAgentEmail ? `-${profileSlug(connectorAgentEmail)}` : ""}`);
  const executablePath = [process.env.BOB_BROWSER_EXECUTABLE, "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"].find((candidate) => candidate && existsSync(candidate));
  if (!executablePath) throw new Error("bob_chrome_not_found");
  mkdirSync(profile, { recursive: true });
  context = await chromium.launchPersistentContext(profile, { executablePath, chromiumSandbox: true, headless: false, viewport: null, args: [`--remote-debugging-port=${DEBUG_PORT}`] });
  ownsBrowserContext = true;
  context.once("close", () => { context = null; page = null; });
  page = context.pages().find((item) => !item.isClosed()) || await context.newPage();
  await page.goto(BOB_URL, { waitUntil: "domcontentloaded" });
  console.log("BoB browser ready. Sign in once if the login screen is shown.");
  return page;
}

async function closeSessions(job, reportProgress = async () => undefined, reportCheckpoint = async () => undefined) {
  const activePage = await getBobPage();
  if (await activePage.locator("input[type=password]").count()) throw new Error("bob_login_required");
  await activePage.goto(BOB_SESSIONS_URL, { waitUntil: "domcontentloaded" });
  if (await activePage.locator("input[type=password]").count()) throw new Error("bob_login_required");
  const range = buildSearchRange(job);
  const nativeClient = await createNativeClient(activePage);
  await reportProgress({ step: "consulting", message: "Consultando sesiones desde el 1 de enero hasta hoy." });
  const sessions = await nativeClient.sessionsForCustomer(job.customerId, range);
  const uniqueCandidates = uniqueSessions(sessions
    .filter(isPendingBobSession)
    .map((session) => ({ sessionId: session.session_id, session })));
  // A request remains bound to one exact customer ID. The limit prevents an
  // accidental broad request, while allowing normal historical cleanups.
  const maxSessions = Number(process.env.BOB_MAX_SESSIONS_PER_RUN || 150);
  if (uniqueCandidates.length > maxSessions) {
    throw new Error(`bob_pending_limit_exceeded_${uniqueCandidates.length}`);
  }
  await reportCheckpoint({
    customerId: job.customerId,
    checkedAt: new Date().toISOString(),
    totalPendingFound: uniqueCandidates.length,
    pendingWins: { foundBeforeClosure: pendingWinsFromSessions(sessions) }
  });
  await reportProgress({ step: "capturing_before", message: "Guardando evidencia de las sesiones pendientes en BoB." });
  const beforeClosureEvidence = await captureBobSessionsEvidence(activePage, job, range, "antes");
  const closed = [];
  const alreadyClosed = [];
  let skippedCount = 0;
  for (let index = 0; index < uniqueCandidates.length; index += 1) {
    const candidate = uniqueCandidates[index];
    await reportProgress({
      step: "closing",
      message: `Cerrando sesión ${index + 1} de ${uniqueCandidates.length}.`,
      completed: index,
      total: uniqueCandidates.length
    });
    await nativeClient.manuallyFinalizeSession(candidate.session);
    const closedSession = summariseBobSession(candidate.session, { closedAt: new Date().toISOString() });
    closed.push(closedSession);
    await reportCheckpoint({ closedSessions: [closedSession] });
    if (index < uniqueCandidates.length - 1) await wait(600);
  }
  await reportProgress({ step: "verifying", message: "Verificando el cierre final en BoB.", completed: closed.length, total: uniqueCandidates.length });
  const verification = await verifyNoPendingSessions(nativeClient, job.customerId, range);
  if (verification.remaining.length) throw new Error(`bob_verification_failed_${verification.remaining.length}_pending`);
  await reportProgress({ step: "capturing_after", message: "Guardando evidencia de la verificación final en BoB.", completed: closed.length, total: uniqueCandidates.length });
  const afterClosureEvidence = await captureBobSessionsEvidence(activePage, job, range, "despues");
  return {
    customerId: job.customerId,
    checkedAt: new Date().toISOString(),
    totalPendingFound: uniqueCandidates.length,
    closedCount: closed.length,
    alreadyClosedCount: alreadyClosed.length,
    skippedCount,
    verifiedPendingCount: 0,
    closedSessions: closed,
    remainingSessions: [],
    pendingWins: {
      foundBeforeClosure: pendingWinsFromSessions(sessions),
      remainingAfterVerification: pendingWinsFromSessions(verification.sessions)
    },
    jiraEvidence: [beforeClosureEvidence, afterClosureEvidence].filter(Boolean),
    method: "bob_native_session_action"
  };
}

async function captureBobSessionsEvidence(activePage, job, range, phase) {
  try {
    await searchCustomerSessions(activePage, job.customerId, range);
    const table = activePage.locator("#SES00-data").first();
    await table.waitFor({ state: "visible", timeout: 15_000 });
    const bytes = await table.screenshot({ type: "jpeg", quality: 65 });
    return {
      filename: `bob-sesiones-${job.customerId}-${phase}.jpg`,
      contentType: "image/jpeg",
      dataBase64: bytes.toString("base64")
    };
  } catch (error) {
    console.warn(`BoB screenshot (${phase}) unavailable:`, String(error?.message || error));
    return null;
  }
}

async function searchCustomerSessions(activePage, customerId, range = currentSearchRange()) {
  const sessionField = activePage.locator("#SES00-read-session_id");
  if (await sessionField.count()) await sessionField.fill("");
  const userField = activePage.locator("#SES00-read-user_identifier");
  await userField.waitFor({ state: "visible", timeout: 15_000 });
  await userField.fill(customerId);
  const start = activePage.locator("#SES00-read-start_date");
  const end = activePage.locator("#SES00-read-end_date");
  if (await start.count()) await start.fill(range.startDate);
  if (await end.count()) await end.fill(range.endDate);
  const button = activePage.locator("#SES00-read input.formSubmit").first();
  if (await button.count()) await button.click();
  else await userField.press("Enter");
  await activePage.waitForTimeout(1200);
  await activePage.locator("#SES00-data tbody").waitFor({ state: "visible", timeout: 15_000 });
  const pageSize = activePage.locator("select[name='SES00-data_length']");
  if (await pageSize.count()) {
    const options = await pageSize.locator("option").evaluateAll((items) => items.map((item) => item.value));
    const largest = options.map(Number).filter(Number.isFinite).sort((a, b) => b - a)[0];
    if (largest) {
      await pageSize.selectOption(String(largest));
      await activePage.waitForTimeout(400);
    }
  }
}

async function listPendingSessions(activePage) {
  // The second click on BoB's Finalized column puts null values first. Check
  // the actual first row instead of trusting aria-label, which describes the
  // next sort direction rather than the active one.
  const finalizedHeader = activePage.locator("#date_finalized");
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const firstFinalizedAt = await activePage.locator("#SES00-data tbody tr").first().locator("td").nth(6).innerText().catch(() => "");
    if (!normaliseFinalizedAt(firstFinalizedAt)) break;
    await finalizedHeader.click();
    await activePage.waitForTimeout(500);
  }
  return await activePage.locator("#SES00-data tbody tr").evaluateAll((rows) => rows.map((row) => {
    const cells = Array.from(row.querySelectorAll("td")).map((cell) => (cell.textContent || "").replace(/\s+/g, " ").trim());
    const details = row.querySelector("a.sessionDetail");
    const rawFinalizedAt = String(cells[6] || "").trim();
    const finalizedAt = /^(null|undefined|n\/a|-)$/i.test(rawFinalizedAt) ? "" : rawFinalizedAt;
    return { sessionId: cells[0] || "", status: cells[4] || "", finalizedAt, hasDetails: Boolean(details) };
  }).filter((row) => row.hasDetails && row.sessionId && !/finalizedSession/i.test(row.status) && !row.finalizedAt));
}

async function verifyNoPendingSessions(nativeClient, customerId, range) {
  let remaining = [];
  let sessions = [];
  for (let attempt = 0; attempt < 5; attempt += 1) {
    sessions = await nativeClient.sessionsForCustomer(customerId, range);
    remaining = sessions.filter(isPendingBobSession);
    if (!remaining.length) return { remaining, sessions };
    if (attempt < 4) await wait(2500);
  }
  return { remaining, sessions };
}

function buildSearchRange(job) {
  const startDate = normaliseDate(job.startDate) || `${new Date().getUTCFullYear()}-01-01`;
  const endDate = normaliseDate(job.endDate) || currentUtcDate();
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) throw new Error("bob_invalid_search_range");
  return { startDate, endDate };
}

function currentSearchRange() {
  return { startDate: `${new Date().getUTCFullYear()}-01-01`, endDate: currentUtcDate() };
}

function currentUtcDate() {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  return date.toISOString().slice(0, 10);
}

function normaliseDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || "")) ? String(value) : "";
}

function uniqueSessions(sessions) {
  const seen = new Set();
  return sessions.filter((session) => {
    if (!session.sessionId || seen.has(session.sessionId)) return false;
    seen.add(session.sessionId);
    return true;
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createNativeClient(activePage) {
  const cookies = await activePage.context().cookies(BOB_URL);
  const cookie = cookies.map(({ name, value }) => `${name}=${value}`).join("; ");
  if (!cookie) throw new Error("bob_login_required");
  return new BobNativeClient({ cookie });
}

async function pollBridge() {
  if (polling) return;
  polling = true;
  try {
    const outcome = await runBobQueueTick({
      claimJob: () => bridgeRequest("claim", {}),
      closeSessions: async (job) => {
        console.log("LiveChat BoB closure request received.");
        return closeSessions(
          job,
          (progress) => bridgeRequest("progress", { jobId: job.id, progress }),
          (checkpoint) => bridgeRequest("checkpoint", { jobId: job.id, checkpoint })
        );
      },
      scheduleRetry: ({ jobId, error }) => bridgeRequest("retry", { jobId, error }),
      completeJob: ({ jobId, result, error }) => bridgeRequest("complete", { jobId, result, error })
    });
    if (outcome.status === "completed") console.log("LiveChat BoB closure request completed.");
    if (outcome.status === "retry_waiting") console.warn("LiveChat BoB closure will retry when the connector is ready:", outcome.error);
    if (outcome.status === "failed") console.error("LiveChat BoB closure request failed:", outcome.error);
  } catch (error) { console.error("BoB bridge unavailable:", String(error?.message || error)); }
  finally { polling = false; }
}

async function bridgeRequest(action, body) {
  const separator = bridgeUrl.includes("?") ? "&" : "?";
  const headers = { "content-type": "application/json" };
  if (connectorAgentEmail && connectorAgentToken) {
    headers["x-support-connector-agent"] = connectorAgentEmail;
    headers["x-support-connector-agent-token"] = connectorAgentToken;
  } else headers["x-bob-connector-token"] = connectorToken;
  const response = await fetch(`${bridgeUrl}${separator}action=${action}`, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "bob_bridge_request_failed");
  return data;
}

function loadLocalEnv() {
  for (const file of [".env.agent.local", ".env.bob.local"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const match = line.match(/^([A-Z0-9_]+)=(.*)$/);
      if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
    }
  }
}

function profileSlug(value) {
  return String(value).replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

async function acquireProcessLock() {
  const server = createServer((socket) => { socket.on("error", () => undefined); socket.end(`${JSON.stringify({ ok: true, connector: "bob", version: CONNECTOR_VERSION, pageState: page?.url() || "unavailable" })}\n`); });
  return await new Promise((resolve, reject) => {
    server.once("error", (error) => error.code === "EADDRINUSE" ? resolve(null) : reject(error));
    server.listen({ host: "127.0.0.1", port: LOCK_PORT, exclusive: true }, () => resolve(server));
  });
}

async function shutdown() {
  if (stopping) return;
  stopping = true;
  if (pollTimer) clearInterval(pollTimer);
  if (ownsBrowserContext) await context?.close().catch(() => undefined);
  processLock?.close();
}

async function start() {
  if (connectorAgentEmail ? !connectorAgentToken : !connectorToken) throw new Error("BoB connector credential missing. Configure .env.agent.local for an agent connector or pull .env.bob.local for the legacy connector.");
  processLock = await acquireProcessLock();
  if (!processLock) throw new Error("bob_connector_already_running");
  process.once("SIGINT", () => shutdown().finally(() => process.exit(0)));
  process.once("SIGTERM", () => shutdown().finally(() => process.exit(0)));
  await getBobPage();
  console.log(`BoB connector ${CONNECTOR_VERSION} connected to the production bridge${connectorAgentEmail ? ` for ${connectorAgentEmail}` : ""}.`);
  console.log("Idle mode: BoB is not inspected until an authorized agent requests a closure.");
  pollTimer = setInterval(pollBridge, 2_000);
  await pollBridge();
}

if (process.env.BOB_CONNECTOR_TEST !== "1") {
  start().catch((error) => { console.error("BoB connector could not start:", String(error?.message || error)); process.exitCode = 1; });
}

export { closeSessions };
