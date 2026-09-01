import {
  authenticateAccount,
  clearSessionCookie,
  getAccount,
  publicAccount,
  setSessionCookie
} from "../lib/account-store.js";
import { readJson, sendJson } from "../lib/http.js";
import { assertLoginAllowed, clearLoginFailures, recordLoginFailure } from "../lib/login-rate-limit.js";
import { isSupportAdmin } from "../lib/remote-config.js";
import { getAgentToolAccess } from "../lib/tool-access.js";
import { verifySimulatorPreviewPin } from "../lib/simulator-policy.js";

export default async function handler(req, res) {
  const action = String(req.query?.action || "").trim().toLowerCase();

  if (action === "login") {
    return handleLogin(req, res);
  }
  if (action === "logout") {
    return handleLogout(req, res);
  }

  return sendJson(res, 404, { ok: false, error: "auth_action_not_found" });
}

async function handleLogin(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  let payload = {};
  try {
    payload = await readJson(req);
    await assertLoginAllowed(req, payload.email);
    const { userId, account } = await authenticateWithPreviewFallback(payload.email, payload.pin);
    await clearLoginFailures(req, payload.email);
    setSessionCookie(res, userId);
    return sendJson(res, 200, {
      ok: true,
      account: {
        ...publicAccount(account, userId),
        isAdmin: await isSupportAdmin(account.email || userId),
        toolAccess: await getAgentToolAccess(account.email || userId)
      }
    });
  } catch (error) {
    if (["invalid_login", "user_not_authorized"].includes(error.message)) {
      await recordLoginFailure(req, payload.email).catch(() => null);
      error.message = "invalid_login";
      error.statusCode = 401;
      error.details = undefined;
    }
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "login_failed",
      details: error.details || undefined
    });
  }
}

async function authenticateWithPreviewFallback(email, pin) {
  try {
    return await authenticateAccount(email, pin);
  } catch (error) {
    if (error?.message !== "invalid_login") throw error;

    const userId = String(email || "").trim().toLowerCase();
    const account = userId ? await getAccount(userId) : null;
    if (!verifySimulatorPreviewPin({ email: userId, pin, account })) throw error;
    return { userId, account };
  }
}

function handleLogout(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  clearSessionCookie(res);
  return sendJson(res, 200, { ok: true });
}
