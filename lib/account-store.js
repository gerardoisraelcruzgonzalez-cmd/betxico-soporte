import crypto from "node:crypto";
import { optionalEnv } from "./http.js";
import { isSupportUserAuthorized } from "./remote-config.js";

const SESSION_COOKIE = "betxico_support_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
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
  "miriam.vazquez@betxico.mx": "712020:b6f6cc6b-7158-424f-a7e1-c5726e720272"
};

export async function getCurrentAccount(req) {
  const session = verifySessionCookie(req);
  if (!session?.userId) return null;

  const account = await getAccount(session.userId);
  if (!account) return null;

  const email = account.email || session.userId;
  if (!(await isSupportUserAuthorized(email))) {
    return null;
  }

  return {
    userId: session.userId,
    displayName: account.displayName || "",
    email,
    jiraEmail: account.jiraEmail || "",
    jiraApiToken: account.jiraApiTokenEncrypted ? decryptSecret(account.jiraApiTokenEncrypted) : "",
    reporterAccountId: account.reporterAccountId || "",
    defaultAssigneeAccountId: account.defaultAssigneeAccountId || "",
    defaultLabels: account.defaultLabels || "",
    configured: Boolean(account.jiraEmail && account.jiraApiTokenEncrypted)
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
  return kvGet(accountKey(userId));
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

export function publicAccount(account, userId = account?.email) {
  if (!account) return null;
  return {
    userId: userId || account.email || "",
    displayName: account.displayName || "",
    email: account.email || "",
    jiraEmail: account.jiraEmail || "",
    reporterAccountId: account.reporterAccountId || "",
    defaultAssigneeAccountId: account.defaultAssigneeAccountId || "",
    defaultLabels: account.defaultLabels || "",
    hasJiraToken: Boolean(account.jiraApiTokenEncrypted || account.jiraApiToken),
    configured: Boolean(account.jiraEmail && (account.jiraApiTokenEncrypted || account.jiraApiToken))
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
  if (!payload || !signature || sign(payload) !== signature) return null;

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

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function accountKey(userId) {
  return `support:account:${normalizeEmail(userId)}`;
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
