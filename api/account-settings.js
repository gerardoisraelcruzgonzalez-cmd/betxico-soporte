import {
  createOrUpdateAccount,
  getAccount,
  getCurrentAccount,
  issueDeviceToken,
  publicAccount,
  revokeCurrentDeviceToken,
  setSessionCookie
} from "../lib/account-store.js";
import { isSupportAdmin } from "../lib/remote-config.js";
import { getAgentToolAccess } from "../lib/tool-access.js";
import { resolveAccountSettingsWrite } from "../lib/account-policy.js";
import { assertLoginAllowed, clearLoginFailures, recordLoginFailure } from "../lib/login-rate-limit.js";
import { readJson, sendJson } from "../lib/http.js";

export default async function handler(req, res) {
  try {
    const action = String(req.query?.action || "").trim();
    if (action === "device-auth") {
      return await handleDeviceAuth(req, res);
    }
    if (req.method === "GET") {
      const account = await getCurrentAccount(req);
      return sendJson(res, 200, {
        ok: true,
        account: account ? await publicAccountWithRole(account, account.userId) : null
      });
    }

    if (req.method === "POST") {
      const payload = await readJson(req);
      const current = await getCurrentAccount(req);
      const currentIsAdmin = current?.email ? await isSupportAdmin(current.email) : false;
      const policy = resolveAccountSettingsWrite({ current, payload, isAdmin: currentIsAdmin });
      const existing = await getAccount(policy.targetEmail);
      const account = await createOrUpdateAccount(
        { ...payload, email: policy.targetEmail },
        existing || {},
        { allowPasswordless: Boolean(existing) }
      );
      if (policy.editsOwnAccount) {
        setSessionCookie(res, account.email);
      }
      return sendJson(res, 200, {
        ok: true,
        account: await publicAccountWithRole(account, account.email)
      });
    }

    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "account_settings_failed",
      details: error.details || undefined
    });
  }
}

async function handleDeviceAuth(req, res) {
  if (req.method === "POST") {
    const payload = await readJson(req);
    await assertLoginAllowed(req, payload.email);
    let issued;
    try {
      issued = await issueDeviceToken(payload.email, payload.pin, payload.deviceLabel || "Raycast");
      await clearLoginFailures(req, payload.email);
    } catch (error) {
      if (["invalid_login", "user_not_authorized"].includes(error.message)) {
        await recordLoginFailure(req, payload.email).catch(() => null);
        error.message = "invalid_login";
        error.statusCode = 401;
        error.details = undefined;
      }
      throw error;
    }
    return sendJson(res, 200, {
      ok: true,
      token: issued.token,
      expiresAt: issued.expiresAt,
      account: {
        ...issued.account,
        isAdmin: await isSupportAdmin(issued.account.email)
      }
    });
  }

  const account = await getCurrentAccount(req);
  if (!account || account.authSource !== "device_token") {
    return sendJson(res, 401, { ok: false, error: "invalid_device_token" });
  }

  if (req.method === "GET") {
    return sendJson(res, 200, {
      ok: true,
      account: {
        ...publicAccount(account, account.userId),
        isAdmin: await isSupportAdmin(account.email),
        deviceLabel: account.deviceLabel || ""
      }
    });
  }

  if (req.method === "DELETE") {
    await revokeCurrentDeviceToken(req);
    return sendJson(res, 200, { ok: true });
  }

  return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
}

async function publicAccountWithRole(account, userId) {
  const toolAccess = await getAgentToolAccess(account.email || userId);
  return {
    ...publicAccount(account, userId),
    isAdmin: await isSupportAdmin(account.email || userId),
    toolAccess
  };
}
