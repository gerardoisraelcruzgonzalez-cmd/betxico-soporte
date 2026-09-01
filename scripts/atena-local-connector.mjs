#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { homedir } from "node:os";
import path from "node:path";
import { runAtenaQueueTick } from "../lib/atena-connector-scheduler.js";
import {
  cleanAtenaText,
  dailyAtenaExtractMovements,
  latestAtenaExtractMovements,
  latestAtenaWithdrawal,
  latestAtenaWithdrawals
} from "../lib/atena-extraction.js";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

loadLocalEnv();

const CONNECTOR_VERSION = "1.0.1-login-safe";
const ATENA_LIST_URL = "https://gestor.sptservices.io/principal/sites/logins/listar";
const ATENA_DASHBOARD_URL = "https://gestor.sptservices.io/dashboard";
const LOCK_PORT = Number(process.env.ATENA_CONNECTOR_LOCK_PORT || 8791);
const bridgeUrl = String(process.env.ATENA_BRIDGE_URL || "https://support-livechat-app.vercel.app/api/atena-bridge").replace(/\/$/, "");
const connectorToken = String(process.env.ATENA_CONNECTOR_TOKEN || "").trim();
const connectorAgentEmail = String(process.env.CONNECTOR_AGENT_EMAIL || "").trim().toLowerCase();
const connectorAgentToken = String(process.env.ATENA_CONNECTOR_AGENT_TOKEN || "").trim();
let bridgePolling = false;
let managedAtenaContext = null;
let managedAtenaPage = null;
let browserLaunchPromise = null;
let pollTimer = null;
let processLock = null;
let stopping = false;
let mainFrameNavigationCount = 0;
let lastMainFrameNavigationAt = "";

async function tables(panel) {
  return panel.locator("table").evaluateAll((items) => items.filter((table) => table.offsetParent !== null).map((table) => ({
    headers: Array.from(table.querySelectorAll("thead th")).map((cell) => (cell.textContent || "").replace(/\s+/g, " ").trim()),
    rows: Array.from(table.querySelectorAll("tbody tr")).map((row) => Array.from(row.querySelectorAll("td")).map((cell) => (cell.textContent || "").replace(/\s+/g, " ").trim()))
  })));
}

async function readSection(page, name, startDate, endDate) {
  await page.getByRole("tab", { name, exact: true }).click();
  const panel = page.locator(".tab-pane.active").first();
  const dates = panel.locator("input:not([type=hidden]):not([disabled])");
  if (await dates.count() < 2) throw new Error(`atena_date_fields_not_found_${name.toLowerCase()}`);
  await fillAtenaDate(dates.nth(0), startDate, false);
  await fillAtenaDate(dates.nth(1), endDate, true);
  await panel.getByRole("button", { name: "Buscar", exact: true }).click();
  const table = panel.locator("table").first();
  await table.waitFor({ state: "visible", timeout: 15_000 });
  await page.waitForTimeout(2_200);
  await table.locator("tbody tr").filter({ hasNotText: "Cargando" }).first().waitFor({ state: "visible", timeout: 15_000 });
  return (await tables(panel))[0] || { headers: [], rows: [] };
}

async function fillAtenaDate(input, value, endOfDay) {
  const type = String(await input.getAttribute("type") || "text").toLowerCase();
  if (type === "datetime-local") return input.fill(`${value}T${endOfDay ? "23:59:59" : "00:00"}`);
  if (type === "date") return input.fill(value);
  const [year, month, day] = value.split("-");
  return input.fill(`${day}/${month}/${year}, ${endOfDay ? "11:59:59 p.m." : "12:00 a.m."}`);
}

async function lookup(email, startDate, endDate) {
  const page = await getAtenaPage();
  if (!(await prepareAtenaSearchPage(page))) throw new Error("atena_login_required");
  // Reset the SPA before every customer so a modal left by the previous lookup
  // can never intercept the next search.
  await page.goto(ATENA_LIST_URL, { waitUntil: "domcontentloaded" });
  await page.locator("input#__BVID__83").waitFor({ state: "visible", timeout: 15_000 });
  const site = page.locator(".multiselect").nth(1);
  if (!(await site.innerText()).includes("Betxico")) {
    await site.click();
    await page.locator(".multiselect__option").filter({ hasText: "Betxico" }).first().click();
  }
  await page.locator("input#__BVID__83").fill(email);
  await page.locator("input#__BVID__84").fill("");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  const row = page.locator("table tbody tr").filter({ hasText: email }).first();
  try {
    await row.waitFor({ state: "visible", timeout: 15_000 });
  } catch {
    throw new Error("atena_customer_not_found");
  }
  const cells = (await row.locator("td").allTextContents()).map(cleanAtenaText);
  await row.locator("button[title='información']").click();
  await page.getByRole("tab", { name: "Depósitos", exact: true }).waitFor({ state: "visible" });
  const withdrawals = await readSection(page, "Pago", startDate, endDate);
  const extract = await readSection(page, "Extracto", startDate, endDate);
  await page.getByRole("tab", { name: "Principal", exact: true }).click();
  const principal = await page.locator(".tab-pane.active").innerText();
  const balance = principal.match(/^Saldo:\s*(.+)$/mi)?.[1]?.trim() || "";
  return {
    customer: { name: cells[1] || "", login: cells[2] || "", email: cells[3] || email, phone: cells[4] || "", status: cells[6] || "", balance },
    range: { startDate, endDate },
    latestWithdrawal: latestAtenaWithdrawal(withdrawals),
    latestWithdrawals: latestAtenaWithdrawals(withdrawals, 3),
    latestExtractMovements: latestAtenaExtractMovements(extract),
    dailyExtractMovements: dailyAtenaExtractMovements(extract, endDate)
  };
}

async function getAtenaPage() {
  try {
    if (managedAtenaContext) {
      const existingPage = managedAtenaContext.pages().find((page) => !page.isClosed());
      return existingPage || await managedAtenaContext.newPage();
    }
  } catch {
    // The operator may close the dedicated window. Recreate it below.
    managedAtenaContext = null;
  }
  if (!browserLaunchPromise) browserLaunchPromise = launchAtenaBrowser().finally(() => { browserLaunchPromise = null; });
  return browserLaunchPromise;
}

async function launchAtenaBrowser() {
  const profile = process.env.ATENA_BROWSER_PROFILE || path.join(homedir(), "Library", "Application Support", `BetxicoAtenaConnector${connectorAgentEmail ? `-${profileSlug(connectorAgentEmail)}` : ""}`);
  const executablePath = resolveChromeExecutable();
  if (!executablePath) throw new Error("atena_chrome_not_found");
  mkdirSync(profile, { recursive: true });
  const context = await chromium.launchPersistentContext(profile, {
    executablePath,
    chromiumSandbox: true,
    headless: false,
    viewport: null
  });
  managedAtenaContext = context;
  context.once("close", () => {
    if (managedAtenaContext === context) managedAtenaContext = null;
    managedAtenaPage = null;
    if (!stopping) console.log("Atena browser was closed; it will reopen automatically.");
  });
  const page = context.pages().find((item) => !item.isClosed()) || await context.newPage();
  managedAtenaPage = page;
  page.on("framenavigated", (frame) => {
    if (frame !== page.mainFrame()) return;
    mainFrameNavigationCount += 1;
    lastMainFrameNavigationAt = new Date().toISOString();
  });
  await page.goto(ATENA_DASHBOARD_URL, { waitUntil: "domcontentloaded" });
  console.log("Atena browser ready. Sign in once if the login screen is shown.");
  return page;
}

async function prepareAtenaSearchPage(page) {
  if (page.isClosed()) return false;
  if (await page.locator("input#__BVID__83").count()) return true;
  const currentUrl = String(page.url() || "");
  const hasPassword = await page.locator("input[type=password]").count();
  if (hasPassword || /\/login|\/auth/i.test(currentUrl)) return false;
  await page.goto(ATENA_LIST_URL, { waitUntil: "domcontentloaded" });
  return Boolean(await page.locator("input#__BVID__83").count());
}

async function lookupWithRetry(job) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await lookup(job.email, job.startDate, job.endDate);
    } catch (error) {
      lastError = error;
      const code = cleanAtenaText(error?.message);
      if (/atena_login_required|atena_customer_not_found/.test(code) || attempt === 2) throw error;
      console.warn(`Atena transient lookup failure; retrying once: ${code}`);
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
  throw lastError;
}

function resolveChromeExecutable() {
  const candidates = [
    process.env.ATENA_BROWSER_EXECUTABLE,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate));
}

async function pollBridge() {
  if (bridgePolling) return;
  bridgePolling = true;
  try {
    // While idle, only the private LiveChat queue is checked. Atena's page is
    // never inspected or navigated, so its login form cannot be reloaded.
    const outcome = await runAtenaQueueTick({
      claimJob: () => bridgeRequest("claim", {}),
      lookupJob: async (job) => {
        console.log("LiveChat Atena query received.");
        return lookupWithRetry(job);
      },
      completeJob: ({ jobId, result, error }) => bridgeRequest("complete", { jobId, result, error })
    });
    if (outcome.status === "completed") console.log("LiveChat Atena query completed.");
    if (outcome.status === "failed") console.error("LiveChat Atena query failed:", outcome.error);
  } catch (error) {
    console.error("Atena bridge unavailable:", cleanAtenaText(error?.message));
  } finally {
    bridgePolling = false;
  }
}

async function bridgeRequest(action, body) {
  const headers = { "content-type": "application/json" };
  if (connectorAgentEmail && connectorAgentToken) {
    headers["x-support-connector-agent"] = connectorAgentEmail;
    headers["x-support-connector-agent-token"] = connectorAgentToken;
  } else headers["x-atena-connector-token"] = connectorToken;
  const response = await fetch(`${bridgeUrl}?action=${action}`, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "atena_bridge_request_failed");
  return data;
}

function loadLocalEnv() {
  for (const file of [".env.agent.local", ".env.atena.local"]) {
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
  const server = createServer((socket) => {
    // Status probes such as netcat can close immediately after connecting.
    // A diagnostic client must never terminate the authenticated connector.
    socket.on("error", () => undefined);
    socket.end(`${JSON.stringify(localConnectorStatus())}\n`);
  });
  return new Promise((resolve, reject) => {
    server.once("error", (error) => {
      if (error.code === "EADDRINUSE") return resolve(null);
      reject(error);
    });
    server.listen({ host: "127.0.0.1", port: LOCK_PORT, exclusive: true }, () => resolve(server));
  });
}

function localConnectorStatus() {
  const pageUrl = !managedAtenaPage || managedAtenaPage.isClosed() ? "" : String(managedAtenaPage.url() || "");
  let pageState = "unavailable";
  if (pageUrl === "about:blank") pageState = "blank";
  else if (/^https:\/\/gestor\.sptservices\.io\/?(?:[?#].*)?$/.test(pageUrl)) pageState = "login";
  else if (/^https:\/\/gestor\.sptservices\.io\/(?:dashboard|principal)(?:\/|$)/.test(pageUrl)) pageState = "atena";
  else if (pageUrl.startsWith("https://gestor.sptservices.io/")) pageState = "atena_other";
  return {
    ok: true,
    connector: "atena",
    version: CONNECTOR_VERSION,
    pageState,
    mainFrameNavigationCount,
    lastMainFrameNavigationAt
  };
}

async function shutdownConnector() {
  if (stopping) return;
  stopping = true;
  if (pollTimer) clearInterval(pollTimer);
  await managedAtenaContext?.close().catch(() => undefined);
  processLock?.close();
}

async function startConnector() {
  if (connectorAgentEmail ? !connectorAgentToken : !connectorToken) throw new Error("Atena connector credential missing. Configure .env.agent.local for an agent connector or pull .env.atena.local for the legacy connector.");
  processLock = await acquireProcessLock();
  if (!processLock) {
    console.error("Atena connector is already running. Keep only one terminal with npm run atena:connector.");
    process.exitCode = 1;
    return;
  }
  process.once("SIGINT", () => shutdownConnector().finally(() => process.exit(0)));
  process.once("SIGTERM", () => shutdownConnector().finally(() => process.exit(0)));
  await getAtenaPage();
  console.log(`Atena connector ${CONNECTOR_VERSION} connected to the production bridge${connectorAgentEmail ? ` for ${connectorAgentEmail}` : ""}.`);
  console.log("Login-safe idle mode: Atena will not reload until LiveChat sends a query.");
  pollTimer = setInterval(pollBridge, 2_000);
  await pollBridge();
}

startConnector().catch((error) => {
  console.error("Atena connector could not start:", cleanAtenaText(error?.message));
  process.exitCode = 1;
});
