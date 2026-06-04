import {
  createOrUpdateAccount,
  getAccount,
  getCurrentAccount,
  publicAccount,
  setSessionCookie
} from "../lib/account-store.js";
import { isSupportAdmin } from "../lib/remote-config.js";
import { readJson, sendJson } from "../lib/http.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const account = await getCurrentAccount(req);
      return sendJson(res, 200, { ok: true, account: account ? await publicAccountWithRole(account, account.userId) : null });
    }

    if (req.method === "POST") {
      const payload = await readJson(req);
      const current = await getCurrentAccount(req);
      const userId = String(payload.email || current?.userId || "").trim().toLowerCase();
      const existing = userId ? await getAccount(userId) : null;
      const account = await createOrUpdateAccount(payload, existing || {}, { allowPasswordless: Boolean(current?.userId) });
      setSessionCookie(res, account.email);
      return sendJson(res, 200, { ok: true, account: await publicAccountWithRole(account, account.email) });
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

async function publicAccountWithRole(account, userId) {
  return {
    ...publicAccount(account, userId),
    isAdmin: await isSupportAdmin(account.email || userId)
  };
}
