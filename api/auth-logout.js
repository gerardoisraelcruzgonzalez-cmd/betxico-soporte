import { clearSessionCookie } from "../lib/account-store.js";
import { sendJson } from "../lib/http.js";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  clearSessionCookie(res);
  return sendJson(res, 200, { ok: true });
}
