import crypto from "node:crypto";
import { optionalEnv } from "./http.js";
import { isSupportUserAuthorized } from "./remote-config.js";

const SESSION_COOKIE = "betxico_support_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const DEVICE_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 90;
const DEVICE_TOKEN_PREFIX = "btq_";
const REPORTER_ACCOUNT_BY_EMAIL = {
  "blanca.gutierrez@betxico.mx": "712020:dff65510-256b-49e7-9e7f-9dea32717596",
  "azucena.rodriguez@betxico.mx": "712020:316b09c7-6a78-4968-a914-a9326f919548",
  "patricio.maldonado@betxico.mx": "712020:06aaebbd-4864-447a-904e-1ef39e2b80a3",
  "ivonne.cruz@betxico.mx": "712020:775830ac-56f4-4eef-8374-b8f60e037b49",
  "anahy.haro@betxico.mx": "712020:a0083027-2e98-439c-ad08-631afb25421a",
  "adriana.lobato@betxico.mx": "712020:c3c9b5ad-cd16-41ad-a737-f901739ff56d",
  "gerardo.cruz@betxico.mx": "712020:c330b151-8b29-4676-a5cc-8165abcae0a1",
  "patricio.garza@betxico.mx": "712020:f119b6ea-bc3c-4f3b-98f2-9de54d998a4e",
  "montserrat.quirarte@betxico.mx": "712020:dd5dfea4-7c8c-4c99-a72a-f24fde300c76",
  "valeria.garza@betxico.mx": "712020:92b1e269-febe-4fb7-a422-14e86620eb5e",
  "luis.salazar@betxico.mx": "712020:1f4047d0-6dfc-4313-bac9-6703a04e4fe9",
  "pedro.salazar@betxico.mx": "712020:15303948-edb0-4ec3-9b3a-8181c1a2d436",
  "miriam.vazquez@betxico.mx": "712020:b6f6cc6b-7158-424f-a7e1-c5726e720272",
  "oriana.moreno@betxico.mx": "712020:3a41fa45-6359-40b6-9827-919f558a0d4d"
};

export async function getCurrentAccount(req) {
  const deviceSession = await verifyDeviceToken(req);
  const session = deviceSession || verifySessionCookie(req);
  if (!session?.userId) return null;

  const account = await getAccount(session.userId);
  if (!account) return null;

  const email = account.email || session.userId;
  if (!(await isSupportUserAuthorized(email))) {
    return null;
  }

  const jiraApiToken = account.jiraApiTokenEncrypted ? decryptSecretSafe(account.jiraApiTokenEncrypted) : "";

  return {
    userId: session.userId,
    displayName: account.displayName || "",
    email,
    jiraEmail: account.jiraEmail || "",
    jiraApiToken,
    reporterAccountId: account.reporterAccountId || "",
    defaultAssigneeAccountId: account.defaultAssigneeAccountId || "",
    defaultLabels: account.defaultLabels || "",
    configured: Boolean(account.jiraEmail && jiraApiToken),
    authSource: deviceSession ? "device_token" : "web_session",
    deviceLabel: deviceSession?.deviceLabel || ""
  };
}

export async function requireCurrentAccount(req) {
  const account = await getCurrentAccount(req);
  if (!account) {
    throwHttp("login_required", 401);
  }
  return account;
}

export async function getAccount(userId) {
  const stored = await kvGet(accountKey(userId)).catch(() => null);
  return stored || getTestBootstrapAccount(userId);
}

// Used only by trusted server-side workflows that must create a Jira issue on
// behalf of the agent that originally requested the operation.
export async function getJiraAccountForOwner(ownerEmail) {
  const userId = normalizeEmail(ownerEmail);
  if (!userId || !(await isSupportUserAuthorized(userId))) return null;
  const account = await getAccount(userId);
  if (!account) return null;
  const jiraApiToken = account.jiraApiTokenEncrypted ? decryptSecretSafe(account.jiraApiTokenEncrypted) : "";
  const jiraEmail = normalizeEmail(account.jiraEmail || "");
  if (!jiraEmail || !jiraApiToken) return null;
  return {
    userId,
    displayName: account.displayName || "",
    email: account.email || userId,
    jiraEmail,
    jiraApiToken,
    reporterAccountId: account.reporterAccountId || REPORTER_ACCOUNT_BY_EMAIL[jiraEmail] || REPORTER_ACCOUNT_BY_EMAIL[userId] || "",
    defaultAssigneeAccountId: account.defaultAssigneeAccountId || "",
    defaultLabels: account.defaultLabels || "",
    configured: true
  };
}

// Automated workflows keep the requesting agent as Jira reporter even when
// that agent has not stored an individual Jira token in the support app.
export async function getCentralJiraAccountForOwner(ownerEmail) {
  const userId = normalizeEmail(ownerEmail);
  // The BoB job was already created through an authorized agent request.
  // Do not invalidate its audit trail merely because group membership later changes.
  if (!userId) return null;

  const jiraEmail = normalizeEmail(optionalEnv("JIRA_EMAIL"));
  const jiraApiToken = optionalEnv("JIRA_API_TOKEN");
  if (!jiraEmail || !jiraApiToken) return null;

  return {
    userId,
    displayName: userId,
    email: userId,
    jiraEmail,
    jiraApiToken,
    reporterAccountId: await resolveReporterAccountId(userId, jiraEmail, jiraApiToken),
    defaultAssigneeAccountId: optionalEnv("JIRA_DEFAULT_ASSIGNEE_ACCOUNT_ID"),
    defaultLabels: optionalEnv("JIRA_DEFAULT_LABELS", "livechat soporte servicio_cliente"),
    configured: true
  };
}

async function resolveReporterAccountId(ownerEmail, jiraEmail, jiraApiToken) {
  const known = REPORTER_ACCOUNT_BY_EMAIL[ownerEmail] || REPORTER_ACCOUNT_BY_EMAIL[jiraEmail];
  if (known) return known;

  const baseUrl = optionalEnv("JIRA_BASE_URL").replace(/\/+$/, "");
  if (!baseUrl) return "";
  try {
    const authorization = `Basic ${Buffer.from(`${jiraEmail}:${jiraApiToken}`).toString("base64")}`;
    const response = await fetch(
      `${baseUrl}/rest/api/3/user/search?query=${encodeURIComponent(ownerEmail)}&maxResults=1`,
      { headers: { authorization, accept: "application/json" } }
    );
    const users = await response.json().catch(() => []);
    return response.ok && Array.isArray(users) ? String(users[0]?.accountId || "") : "";
  } catch {
    return "";
  }
}

export async function saveAccount(userId, account) {
  await kvSet(accountKey(userId), account);
}

export async function createOrUpdateAccount(payload, existing = {}, options = {}) {
  const email = normalizeEmail(payload.email || existing.email);
  if (!email) {
    throwHttp("invalid_account_email", 400);
  }
  if (!(await isSupportUserAuthorized(email))) {
    throwHttp("user_not_authorized", 403);
  }
  const jiraEmail = normalizeEmail(payload.jiraEmail || existing.jiraEmail);
  const matchedReporterAccountId = REPORTER_ACCOUNT_BY_EMAIL[jiraEmail] || REPORTER_ACCOUNT_BY_EMAIL[email] || "";

  const next = {
    ...existing,
    email,
    displayName: String(payload.displayName || existing.displayName || "").trim(),
    jiraEmail,
    reporterAccountId: matchedReporterAccountId || String(payload.reporterAccountId || existing.reporterAccountId || "").trim(),
    defaultAssigneeAccountId: String(payload.defaultAssigneeAccountId || existing.defaultAssigneeAccountId || "").trim(),
    defaultLabels: String(payload.defaultLabels || existing.defaultLabels || "livechat soporte servicio_cliente").trim(),
    updatedAt: new Date().toISOString()
  };

  const pin = String(payload.pin || "").trim();
  if (pin) {
    next.pin = hashPin(pin);
  } else if (!next.pin && !options.allowPasswordless) {
    throwHttp("missing_pin", 400);
  }

  const jiraApiToken = String(payload.jiraApiToken || "").trim();
  if (jiraApiToken) {
    next.jiraApiTokenEncrypted = encryptSecret(jiraApiToken);
  }

  if (!next.createdAt) {
    next.createdAt = next.updatedAt;
  }

  await saveAccount(email, next);
  return next;
}

export async function authenticateAccount(email, pin) {
  const userId = normalizeEmail(email);
  if (!(await isSupportUserAuthorized(userId))) {
    throwHttp("user_not_authorized", 403);
  }
  const account = userId ? await getAccount(userId) : null;
  if (!account?.pin || !verifyPin(pin, account.pin)) {
    throwHttp("invalid_login", 401);
  }
  return { userId, account };
}

export async function issueDeviceToken(email, pin, deviceLabel = "Raycast") {
  const { userId, account } = await authenticateAccount(email, pin);
  const cleanDeviceLabel = String(deviceLabel || "Raycast").trim().slice(0, 80);
  const previousTokenKey = await kvGet(deviceTokenIndexKey(userId, cleanDeviceLabel)).catch(() => "");
  if (previousTokenKey) {
    await kvDelete(previousTokenKey).catch(() => null);
  }
  const token = `${DEVICE_TOKEN_PREFIX}${crypto.randomBytes(32).toString("base64url")}`;
  const now = Math.floor(Date.now() / 1000);
  const record = {
    userId,
    deviceLabel: cleanDeviceLabel,
    createdAt: new Date(now * 1000).toISOString(),
    expiresAt: now + DEVICE_TOKEN_TTL_SECONDS
  };
  const tokenKey = deviceTokenKey(token);
  await kvSet(tokenKey, record);
  await kvSet(deviceTokenIndexKey(userId, cleanDeviceLabel), tokenKey);
  return {
    token,
    expiresAt: new Date(record.expiresAt * 1000).toISOString(),
    account: publicAccount(account, userId)
  };
}

export async function revokeCurrentDeviceToken(req) {
  const token = bearerToken(req);
  if (!token) return false;
  await kvDelete(deviceTokenKey(token));
  return true;
}

export function publicAccount(account, userId = account?.email) {
  if (!account) return null;
  const email = account.email || userId || "";
  const jiraApiToken = account.jiraApiToken || decryptSecretSafe(account.jiraApiTokenEncrypted);
  return {
    userId: userId || email,
    displayName: account.displayName || "",
    email,
    jiraEmail: account.jiraEmail || "",
    reporterAccountId: account.reporterAccountId || "",
    defaultAssigneeAccountId: account.defaultAssigneeAccountId || "",
    defaultLabels: account.defaultLabels || "",
    hasJiraToken: Boolean(jiraApiToken),
    configured: Boolean(account.jiraEmail && jiraApiToken)
  };
}

export function setSessionCookie(res, userId) {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = Buffer.from(JSON.stringify({ userId, expiresAt })).toString("base64url");
  const signature = sign(payload);
  res.setHeader("set-cookie", [
    `${SESSION_COOKIE}=${payload}.${signature}; Path=/; Max-Age=${SESSION_TTL_SECONDS}; HttpOnly; Secure; SameSite=None`
  ]);
}

export function clearSessionCookie(res) {
  res.setHeader("set-cookie", [`${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=None`]);
}

function verifySessionCookie(req) {
  const raw = parseCookies(req.headers.cookie || "")[SESSION_COOKIE];
  if (!raw) return null;

  const [payload, signature] = raw.split(".");
  if (!payload || !signature || !timingSafeEqualStr(sign(payload), signature)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (Number(data.expiresAt || 0) < Math.floor(Date.now() / 1000)) return null;
    return data;
  } catch {
    return null;
  }
}

async function kvGet(key) {
  const response = await kvRequest(["GET", key]);
  return response?.result ? JSON.parse(response.result) : null;
}

async function kvSet(key, value) {
  await kvRequest(["SET", key, JSON.stringify(value)]);
}

async function kvDelete(key) {
  await kvRequest(["DEL", key]);
}

async function kvRequest(command) {
  const url = optionalEnv("KV_REST_API_URL") || optionalEnv("UPSTASH_REDIS_REST_URL");
  const token = optionalEnv("KV_REST_API_TOKEN") || optionalEnv("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) {
    throwHttp("missing_kv_config", 500);
  }

  const response = await fetch(`${url.replace(/\/+$/, "")}/pipeline`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json"
    },
    body: JSON.stringify([command])
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error("kv_request_failed");
    error.statusCode = response.status;
    error.details = data;
    throw error;
  }

  return Array.isArray(data) ? data[0] : data;
}

function encryptSecret(value) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(value), "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString("base64url")}.${tag.toString("base64url")}.${encrypted.toString("base64url")}`;
}

function decryptSecret(value) {
  const [ivRaw, tagRaw, encryptedRaw] = String(value || "").split(".");
  if (!ivRaw || !tagRaw || !encryptedRaw) return "";

  const decipher = crypto.createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64url"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64url"));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedRaw, "base64url")),
    decipher.final()
  ]);
  return decrypted.toString("utf8");
}

function decryptSecretSafe(value) {
  if (!String(value || "").trim()) return "";
  try {
    return decryptSecret(value);
  } catch {
    return "";
  }
}

function encryptionKey() {
  const secret = optionalEnv("SUPPORT_ENCRYPTION_KEY");
  if (!secret) {
    throwHttp("missing_encryption_key", 500);
  }
  return crypto.createHash("sha256").update(secret).digest();
}

function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = crypto.scryptSync(String(pin), salt, 32).toString("base64url");
  return `${salt}.${hash}`;
}

function verifyPin(pin, stored) {
  const [salt, expected] = String(stored || "").split(".");
  if (!salt || !expected) return false;
  const hash = crypto.scryptSync(String(pin), salt, 32);
  return crypto.timingSafeEqual(hash, Buffer.from(expected, "base64url"));
}

function sign(value) {
  const secret = optionalEnv("SUPPORT_SESSION_SECRET") || optionalEnv("SUPPORT_ENCRYPTION_KEY");
  if (!secret) {
    throwHttp("missing_session_secret", 500);
  }
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function timingSafeEqualStr(a, b) {
  const bufA = Buffer.from(String(a || ""));
  const bufB = Buffer.from(String(b || ""));
  // timingSafeEqual exige misma longitud; si difieren, no coinciden.
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

// A dedicated test deployment can authenticate one operator without sharing
// the production Redis account store. This is inert unless explicitly enabled.
function getTestBootstrapAccount(userId) {
  if (String(process.env.SUPPORT_TEST_MODE || "").trim().toLowerCase() !== "true") return null;

  const email = normalizeEmail(optionalEnv("SUPPORT_TEST_LOGIN_EMAIL"));
  const pin = optionalEnv("SUPPORT_TEST_LOGIN_PIN");
  if (!email || !pin || normalizeEmail(userId) !== email) return null;

  return {
    email,
    displayName: optionalEnv("SUPPORT_TEST_LOGIN_NAME", "Operador de prueba"),
    pin: hashPin(pin),
    createdAt: "test-bootstrap",
    updatedAt: "test-bootstrap"
  };
}

function accountKey(userId) {
  return `support:account:${normalizeEmail(userId)}`;
}

function deviceTokenKey(token) {
  const digest = crypto.createHash("sha256").update(String(token || "")).digest("hex");
  return `support:device-token:${digest}`;
}

function deviceTokenIndexKey(userId, deviceLabel) {
  const digest = crypto.createHash("sha256").update(`${normalizeEmail(userId)}:${deviceLabel}`).digest("hex");
  return `support:device-token-index:${digest}`;
}

function bearerToken(req) {
  const match = String(req?.headers?.authorization || "").trim().match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || "";
}

async function verifyDeviceToken(req) {
  const token = bearerToken(req);
  if (!token.startsWith(DEVICE_TOKEN_PREFIX)) return null;
  const record = await kvGet(deviceTokenKey(token)).catch(() => null);
  if (!record?.userId || Number(record.expiresAt || 0) < Math.floor(Date.now() / 1000)) {
    return null;
  }
  return record;
}

function parseCookies(header) {
  return String(header || "")
    .split(";")
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const index = part.indexOf("=");
      if (index === -1) return acc;
      acc[part.slice(0, index)] = decodeURIComponent(part.slice(index + 1));
      return acc;
    }, {});
}

function throwHttp(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}
