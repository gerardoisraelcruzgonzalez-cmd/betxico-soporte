import crypto from "node:crypto";

export const SIMULATOR_ENABLE_ENV = "SUPPORT_SIMULATOR_ENABLED";
export const SIMULATOR_REAL_ACTIONS_ENV = "SUPPORT_SIMULATOR_REAL_ACTIONS_ENABLED";
export const SIMULATOR_PREVIEW_PIN_HASH_ENV = "SUPPORT_SIMULATOR_PREVIEW_PIN_HASH";
export const SIMULATOR_KNOWLEDGE_ENV = "SUPPORT_SIMULATOR_KNOWLEDGE_ENABLED";
export const SIMULATOR_CONFIRMATION = "EJECUTAR PRUEBA REAL";
const DEFAULT_ALLOWED_EMAILS = ["gerardo.cruz@betxico.mx"];

export function isSupportSimulatorEnabled(env = process.env) {
  return explicitTrue(env, SIMULATOR_ENABLE_ENV);
}

export function areSimulatorRealActionsEnabled(env = process.env) {
  return explicitTrue(env, SIMULATOR_REAL_ACTIONS_ENV);
}

export function isSimulatorKnowledgeEnabled(env = process.env) {
  return env?.VERCEL_ENV !== "production" && explicitTrue(env, SIMULATOR_KNOWLEDGE_ENV);
}

export function simulatorAllowedEmails(env = process.env) {
  const configured = parseList(env?.SUPPORT_SIMULATOR_ALLOWED_EMAILS).map(normalizeEmail).filter(Boolean);
  return configured.length ? configured : DEFAULT_ALLOWED_EMAILS;
}

export function verifySimulatorPreviewPin({ email, pin, account, env = process.env } = {}) {
  const normalizedEmail = normalizeEmail(email);
  if (env?.VERCEL_ENV !== "preview" || !isSupportSimulatorEnabled(env)) return false;
  if (!normalizedEmail || !simulatorAllowedEmails(env).includes(normalizedEmail)) return false;
  if (normalizeEmail(account?.email) !== normalizedEmail || !account?.pin) return false;

  const [salt, expected] = String(env?.[SIMULATOR_PREVIEW_PIN_HASH_ENV] || "").split(".");
  if (!salt || !expected || !String(pin || "").trim()) return false;

  try {
    const actual = crypto.scryptSync(String(pin), salt, 32);
    const expectedBuffer = Buffer.from(expected, "base64url");
    return actual.length === expectedBuffer.length && crypto.timingSafeEqual(actual, expectedBuffer);
  } catch {
    return false;
  }
}

export function requireSupportSimulatorAccess(account = {}, options = {}) {
  const env = options.env || process.env;
  const email = normalizeEmail(account.email);
  if (!isSupportSimulatorEnabled(env)) throw policyError("support_simulator_disabled", 503);
  if (options.isAdmin !== true || !email || !simulatorAllowedEmails(env).includes(email)) {
    throw policyError("support_simulator_not_authorized", 403);
  }
  return { email, role: "admin" };
}

export function requireSimulatorSameOrigin(req = {}) {
  const forwardedHost = String(req?.headers?.["x-forwarded-host"] || "").split(",")[0].trim().toLowerCase();
  const host = forwardedHost || String(req?.headers?.host || "").split(",")[0].trim().toLowerCase();
  const origin = String(req?.headers?.origin || "").trim();
  if (!host || !origin) throw policyError("simulator_same_origin_required", 403);

  try {
    if (new URL(origin).host.toLowerCase() !== host) {
      throw policyError("simulator_same_origin_required", 403);
    }
  } catch (error) {
    if (error?.message === "simulator_same_origin_required") throw error;
    throw policyError("simulator_same_origin_required", 403);
  }
  return true;
}

export function requireSimulatorRealAction({ caseRecord, proposal, confirmation, env = process.env } = {}) {
  if (!areSimulatorRealActionsEnabled(env)) throw policyError("simulator_real_actions_disabled", 503);
  if (caseRecord?.source?.type !== "support_simulator" || caseRecord?.source?.synthetic !== true) {
    throw policyError("simulator_case_required", 409);
  }
  if (String(confirmation || "").trim() !== SIMULATOR_CONFIRMATION) {
    throw policyError("simulator_confirmation_required", 409);
  }

  const actionType = String(proposal?.actionType || "").trim();
  if (actionType === "jira.comment") {
    const allowed = parseList(env.SUPPORT_SIMULATOR_JIRA_KEYS).map((value) => value.toUpperCase());
    const issueKey = String(proposal?.payload?.issueKey || "").trim().toUpperCase();
    if (!allowed.length || !allowed.includes(issueKey)) {
      throw policyError("simulator_jira_target_not_allowed", 403);
    }
    return { actionType, target: issueKey };
  }
  if (actionType === "slack.notify") {
    const allowed = parseList(env.SUPPORT_SIMULATOR_SLACK_ROUTES);
    const routeId = String(proposal?.payload?.routeId || "").trim();
    if (!allowed.length || !allowed.includes(routeId)) {
      throw policyError("simulator_slack_target_not_allowed", 403);
    }
    return { actionType, target: routeId };
  }
  throw policyError("simulator_action_not_allowed", 403);
}

export function simulatorActionMarker(chatId) {
  const id = String(chatId || "").replace(/[^A-Za-z0-9_.:-]/gu, "").slice(-48);
  return `[SIMULADOR CONTROLADO${id ? ` ${id}` : ""} - NO OPERAR]`;
}

export function simulatorCapabilities(env = process.env) {
  return {
    enabled: isSupportSimulatorEnabled(env),
    knowledgeEnabled: isSimulatorKnowledgeEnabled(env),
    realActionsEnabled: areSimulatorRealActionsEnabled(env),
    confirmation: SIMULATOR_CONFIRMATION,
    jiraKeys: parseList(env?.SUPPORT_SIMULATOR_JIRA_KEYS).map((value) => value.toUpperCase()),
    slackRoutes: parseList(env?.SUPPORT_SIMULATOR_SLACK_ROUTES)
  };
}

function explicitTrue(env, key) {
  return Boolean(env
    && Object.prototype.hasOwnProperty.call(env, key)
    && env[key] === "true");
}

function parseList(value) {
  return String(value || "").split(/[,\s]+/u).map((item) => item.trim()).filter(Boolean);
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) ? email : "";
}

function policyError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}
