#!/usr/bin/env node
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { mkdtemp, writeFile, rm } from "node:fs/promises";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { homedir } from "node:os";
import path from "node:path";
import { runKycQueueTick } from "../lib/kyc-connector-scheduler.js";
import { cleanKycText, exactKycEmail, normalizeKycUserRecord, normalizeKycVerificationRecord } from "../lib/kyc-extraction.js";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

loadLocalEnv();

const CONNECTOR_VERSION = "1.0.1-on-demand";
const KYC_BASE_URL = "https://backoffice-kyc.paybridge.com.mx";
const KYC_USERS_URL = `${KYC_BASE_URL}/dashboard/users`;
const OPEN_KYC_ON_START = /^(1|true|yes)$/i.test(String(process.env.KYC_OPEN_BROWSER_ON_START || ""));
const LOCK_PORT = Number(process.env.KYC_CONNECTOR_LOCK_PORT || 8792);
const bridgeUrl = String(process.env.KYC_BRIDGE_URL || process.env.ATENA_BRIDGE_URL || "https://support-livechat-app.vercel.app/api/atena-bridge").replace(/\/$/, "");
const connectorToken = String(process.env.KYC_CONNECTOR_TOKEN || process.env.ATENA_CONNECTOR_TOKEN || "").trim();
const connectorAgentEmail = String(process.env.CONNECTOR_AGENT_EMAIL || "").trim().toLowerCase();
const connectorAgentToken = String(process.env.KYC_CONNECTOR_AGENT_TOKEN || "").trim();
let bridgePolling = false;
let managedKycContext = null;
let browserLaunchPromise = null;
let pollTimer = null;
let processLock = null;
let stopping = false;

async function lookup(email) {
  const page = await getKycPage();
  if (!(await prepareKycPage(page))) throw new Error("kyc_login_required");
  try {
    const encodedEmail = encodeURIComponent(email);
    const [usersResponse, verificationsResponse] = await Promise.all([
      apiGet(page, `/api/kyc-users?page=1&limit=20&sort_by=created_at&sort_order=desc&search=${encodedEmail}`),
      apiGet(page, `/api/verifications?page=1&limit=20&sort_by=created_at&sort_order=desc&search=${encodedEmail}`)
    ]);
    const userItems = (Array.isArray(usersResponse?.items) ? usersResponse.items : []).filter((item) => exactKycEmail(item?.email, email));
    const verificationItems = (Array.isArray(verificationsResponse?.items) ? verificationsResponse.items : []).filter((item) => exactKycEmail(item?.email, email));
    const users = await Promise.all(userItems.slice(0, 10).map(async (item) => {
      const [user, documentResponse, verification] = await Promise.all([
        apiGet(page, `/api/kyc-users/${encodeURIComponent(item.id)}`),
        apiGet(page, `/api/kyc-users/${encodeURIComponent(item.id)}/documents`),
        apiGet(page, `/api/kyc-users/${encodeURIComponent(item.id)}/verification`)
      ]);
      return normalizeKycUserRecord({ user: { ...item, ...user }, documents: documentResponse?.documents || [], verification });
    }));
    const verifications = verificationItems.slice(0, 20).map(normalizeKycVerificationRecord);
    return {
      email,
      queriedAt: new Date().toISOString(),
      sources: {
        users: { label: "Usuarios KYC", searched: true, total: Number(usersResponse?.total || users.length), exactMatches: users.length, results: users },
        verifications: { label: "Verificaciones", searched: true, total: Number(verificationsResponse?.total || verifications.length), exactMatches: verifications.length, results: verifications }
      }
    };
  } finally {
    await parkKycPage(page);
  }
}

const EDIT_TITLES = {
  firstName: "Editar Nombre", paternalSurname: "Editar Apellido paterno", maternalSurname: "Editar Apellido materno",
  email: "Editar Email", phone: "Editar Teléfono", dateOfBirth: "Editar Fecha de nacimiento", curp: "Editar CURP",
  sex: "Editar Sexo", profession: "Editar Profesión", documentType: "Editar Tipo de documento", documentNumber: "Editar Número de documento",
  street: "Editar Calle", exteriorNumber: "Editar Número exterior", neighborhood: "Editar Colonia", postalCode: "Editar Código postal",
  municipality: "Editar Municipio", state: "Editar Estado"
};
const DOCUMENT_BUTTONS = { selfie: "Selfie", ineFront: "INE Frente", ineBack: "INE Vuelta", proofOfAddress: "Comp. Domicilio" };

async function mutate(job) {
  const page = await getKycPage();
  if (!(await prepareKycPage(page))) throw new Error("kyc_login_required");
  const tempDir = job.operation === "upload" ? await mkdtemp(path.join(process.env.TMPDIR || "/tmp", "betxico-kyc-")) : "";
  try {
    await page.goto(`${KYC_BASE_URL}/dashboard/users/${encodeURIComponent(job.userId)}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(500);
    if (job.operation === "edit") return await editField(page, job);
    const file = job.document?.file;
    if (!file?.dataBase64) throw new Error("kyc_document_missing");
    const filePath = path.join(tempDir, file.filename || "documento");
    await writeFile(filePath, Buffer.from(file.dataBase64, "base64"));
    const button = page.getByRole("button", { name: DOCUMENT_BUTTONS[job.document.type], exact: true });
    if (await button.count() !== 1) throw new Error("kyc_document_button_not_found");
    const chooserPromise = page.waitForEvent("filechooser", { timeout: 10000 });
    await button.click();
    const chooser = await chooserPromise;
    await chooser.setFiles(filePath);
    await page.waitForTimeout(1500);
    return { operation: "upload", documentType: job.document.type, filename: file.filename, status: "uploaded" };
  } finally {
    if (tempDir) await rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
    await parkKycPage(page);
  }
}

async function editField(page, job) {
  const title = EDIT_TITLES[job.field];
  if (!title) throw new Error("invalid_kyc_field");
  const editButton = page.getByTitle(title);
  if (await editButton.count() !== 1) throw new Error("kyc_edit_button_not_found");
  await editButton.click();
  const input = page.locator(`input[aria-label="${title}"]`);
  if (await input.count() !== 1) throw new Error("kyc_edit_input_not_found");
  await input.fill(job.value);
  await page.getByTitle("Guardar").click();
  await page.waitForTimeout(1000);
  return { operation: "edit", field: job.field, status: "updated" };
}

async function apiGet(page, pathname) {
  const result = await page.evaluate(async (pathValue) => {
    const response = await fetch(pathValue, { method: "GET", credentials: "include", cache: "no-store", headers: { accept: "application/json" } });
    const data = await response.json().catch(() => ({}));
    return { ok: response.ok, status: response.status, data };
  }, pathname);
  if (result.status === 401 || result.status === 403) throw new Error("kyc_login_required");
  if (!result.ok) throw new Error(`kyc_api_${result.status}`);
  return result.data;
}

async function getKycPage() {
  try {
    if (managedKycContext) {
      const existingPage = managedKycContext.pages().find((page) => !page.isClosed());
      return existingPage || await managedKycContext.newPage();
    }
  } catch {
    managedKycContext = null;
  }
  if (!browserLaunchPromise) browserLaunchPromise = launchKycBrowser().finally(() => { browserLaunchPromise = null; });
  return browserLaunchPromise;
}

async function launchKycBrowser() {
  const profile = process.env.KYC_BROWSER_PROFILE || path.join(homedir(), "Library", "Application Support", `BetxicoKycConnector${connectorAgentEmail ? `-${profileSlug(connectorAgentEmail)}` : ""}`);
  const executablePath = resolveChromeExecutable();
  if (!executablePath) throw new Error("kyc_chrome_not_found");
  mkdirSync(profile, { recursive: true });
  const context = await chromium.launchPersistentContext(profile, {
    executablePath,
    chromiumSandbox: true,
    headless: false,
    viewport: null
  });
  managedKycContext = context;
  context.once("close", () => {
    if (managedKycContext === context) managedKycContext = null;
    if (!stopping) console.log("KYC browser was closed; it will reopen automatically.");
  });
  const page = context.pages().find((item) => !item.isClosed()) || await context.newPage();
  await parkKycPage(page);
  console.log("KYC browser parked. It will open Paybridge only for a LiveChat query.");
  return page;
}

async function parkKycPage(page) {
  if (!page || page.isClosed() || page.url() === "about:blank") return;
  await page.goto("about:blank", { waitUntil: "commit" }).catch(() => undefined);
}

async function prepareKycPage(page) {
  if (page.isClosed()) return false;
  const currentUrl = String(page.url() || "");
  if (!currentUrl.startsWith(KYC_BASE_URL)) await page.goto(KYC_USERS_URL, { waitUntil: "domcontentloaded" });
  const auth = await page.evaluate(async () => {
    try {
      const response = await fetch("/api/auth/me", { credentials: "include", cache: "no-store" });
      return response.status;
    } catch {
      return 0;
    }
  });
  if (auth !== 200) return false;
  if (!String(page.url() || "").includes("/dashboard/")) await page.goto(KYC_USERS_URL, { waitUntil: "domcontentloaded" });
  return true;
}

async function lookupWithRetry(job) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt += 1) {
    try {
      return await lookup(job.email);
    } catch (error) {
      lastError = error;
      const code = cleanKycText(error?.message);
      if (/kyc_login_required/.test(code) || attempt === 2) throw error;
      console.warn(`KYC transient lookup failure; retrying once: ${code}`);
      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
  throw lastError;
}

function resolveChromeExecutable() {
  const candidates = [
    process.env.KYC_BROWSER_EXECUTABLE,
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary"
  ].filter(Boolean);
  return candidates.find((candidate) => existsSync(candidate));
}

async function pollBridge() {
  if (bridgePolling) return;
  bridgePolling = true;
  try {
    // Poll only the private LiveChat queue while idle. Paybridge KYC is not
    // contacted until a real job has been claimed.
    const outcome = await runKycQueueTick({
      claimJob: () => bridgeRequest("claim", {}),
      lookupJob: async (job) => {
        console.log("LiveChat KYC query received.");
        return job.operation ? mutate(job) : lookupWithRetry(job);
      },
      completeJob: ({ jobId, result, error }) => bridgeRequest("complete", { jobId, result, error })
    });
    if (outcome.status === "completed") console.log("LiveChat KYC query completed.");
    if (outcome.status === "failed") console.error("LiveChat KYC query failed:", outcome.error);
  } catch (error) {
    console.error("KYC bridge unavailable:", cleanKycText(error?.message));
  } finally {
    bridgePolling = false;
  }
}

async function bridgeRequest(action, body) {
  const separator = bridgeUrl.includes("?") ? "&" : "?";
  const headers = { "content-type": "application/json" };
  if (connectorAgentEmail && connectorAgentToken) {
    headers["x-support-connector-agent"] = connectorAgentEmail;
    headers["x-support-connector-agent-token"] = connectorAgentToken;
  } else headers["x-kyc-connector-token"] = connectorToken;
  const response = await fetch(`${bridgeUrl}${separator}service=kyc&action=${action}`, { method: "POST", headers, body: JSON.stringify(body) });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "kyc_bridge_request_failed");
  return data;
}

function loadLocalEnv() {
  for (const file of [".env.agent.local", ".env.kyc.local", ".env.atena.local"]) {
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
    // Keep diagnostic probes from surfacing an unhandled socket error.
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
  const page = managedKycContext?.pages().find((item) => !item.isClosed());
  const pageUrl = page ? String(page.url() || "") : "";
  return {
    ok: true,
    connector: "kyc",
    version: CONNECTOR_VERSION,
    pageState: pageUrl === "about:blank" ? "blank" : pageUrl ? "kyc" : "unavailable"
  };
}

async function shutdownConnector() {
  if (stopping) return;
  stopping = true;
  if (pollTimer) clearInterval(pollTimer);
  await managedKycContext?.close().catch(() => undefined);
  processLock?.close();
}

async function startConnector() {
  if (connectorAgentEmail ? !connectorAgentToken : !connectorToken) throw new Error("KYC connector credential missing. Configure .env.agent.local for an agent connector or pull .env.atena.local for the legacy connector.");
  processLock = await acquireProcessLock();
  if (!processLock) {
    console.error("KYC connector is already running. Keep only one terminal with npm run kyc:connector.");
    process.exitCode = 1;
    return;
  }
  process.once("SIGINT", () => shutdownConnector().finally(() => process.exit(0)));
  process.once("SIGTERM", () => shutdownConnector().finally(() => process.exit(0)));
  const page = await getKycPage();
  if (OPEN_KYC_ON_START) {
    await page.goto(KYC_USERS_URL, { waitUntil: "domcontentloaded" }).catch((error) => {
      console.warn("KYC browser could not open the sign-in page:", cleanKycText(error?.message));
    });
    console.log("KYC browser opened for manual sign-in. It will remain idle until a LiveChat query arrives.");
  }
  console.log(`KYC connector ${CONNECTOR_VERSION} connected to the production bridge${connectorAgentEmail ? ` for ${connectorAgentEmail}` : ""}.`);
  console.log("Idle mode: zero Paybridge KYC traffic until LiveChat sends a query.");
  pollTimer = setInterval(pollBridge, 2_000);
  await pollBridge();
}

startConnector().catch((error) => {
  console.error("KYC connector could not start:", cleanKycText(error?.message));
  process.exitCode = 1;
});
