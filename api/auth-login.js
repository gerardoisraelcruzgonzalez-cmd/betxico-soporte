import { authenticateAccount, publicAccount, setSessionCookie } from "../lib/account-store.js";
import { isSupportAdmin } from "../lib/remote-config.js";
import { readJson, sendJson } from "../lib/http.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  try {
    const payload = await readJson(req);
    const { userId, account } = await authenticateAccount(payload.email, payload.pin);
    setSessionCookie(res, userId);
    return sendJson(res, 200, {
      ok: true,
      account: {
        ...publicAccount(account, userId),
        isAdmin: await isSupportAdmin(account.email || userId)
      }
    });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "login_failed",
      details: error.details || undefined
    });
  }
}
