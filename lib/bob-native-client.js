const BOB_CONNECTOR_URL = "https://tools.solutions.vsslots.com/bob/requires/connector.php";

// This is the browser's own BoB session used through the native action that
// backs the BoB interface. It is only used inside the local connector.
export class BobNativeClient {
  constructor({ cookie, timeoutMs = 30_000 }) {
    this.cookie = String(cookie || "").trim();
    this.timeoutMs = timeoutMs;
  }

  async sessionsForCustomer(customerId, { startDate, endDate }) {
    const body = new URLSearchParams({
      action: "sessionInfo",
      "params[user_identifier]": customerId,
      "params[start_date]": startDate,
      "params[end_date]": endDate,
      env: "PRO"
    });
    const response = await this.post(body, { allowEmpty: true });
    return uniqueBySession(normaliseRows(response.data));
  }

  async manuallyFinalizeSession(session) {
    const sessionId = String(session?.session_id || "").trim();
    if (!sessionId) throw new Error("bob_missing_session_id");
    const body = new URLSearchParams({ action: "manuallyFinalizeSession", env: "PRO" });
    for (const [key, value] of Object.entries(session)) {
      if (value == null || typeof value === "object") continue;
      const normalised = key === "session_status" ? stripHtml(value) : String(value);
      body.set(`params[${key}]`, normalised === "null" ? "" : normalised);
    }
    const response = await this.post(body);
    if (response.result !== "ok" && response.status !== "ok" && response.status !== "notice") {
      throw new Error("bob_native_finalize_not_confirmed");
    }
    return response;
  }

  async post(body, { allowEmpty = false } = {}) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await fetch(BOB_CONNECTOR_URL, {
        method: "POST",
        headers: {
          "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
          origin: "https://tools.solutions.vsslots.com",
          referer: "https://tools.solutions.vsslots.com/bob/applications/CAS/SES00/",
          "x-requested-with": "XMLHttpRequest",
          cookie: this.cookie
        },
        body,
        signal: controller.signal
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || !data) throw new Error("bob_native_request_failed");
      const status = String(data.status || "").toLowerCase();
      if (status === "error") throw new Error("bob_native_request_failed");
      if (!allowEmpty && status && !["ok", "notice"].includes(status) && data.result !== "ok") {
        throw new Error("bob_native_request_failed");
      }
      return data;
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function isPendingBobSession(session) {
  const status = stripHtml(session?.session_status).toLowerCase();
  const finalizedAt = String(session?.date_finalized || "").trim().toLowerCase();
  return status !== "finalizedsession" && ["", "null", "undefined", "n/a", "-"].includes(finalizedAt);
}

export function summariseBobSession(session, { closedAt = "" } = {}) {
  const pendingWin = normalisePendingWin(session?.pending_total_win);
  return {
    sessionId: String(session?.session_id || "").trim(),
    game: String(session?.game_code || session?.game || "Juego sin codigo").trim() || "Juego sin codigo",
    provider: String(session?.provider || session?.provider_name || session?.game_provider || session?.operator_name || "").trim(),
    createdAt: String(session?.date_created || "").trim(),
    finalizedAt: String(session?.date_finalized || "").trim(),
    status: stripHtml(session?.session_status) || "Sin estado",
    closedAt: String(closedAt || "").trim(),
    pendingWin
  };
}

export function pendingWinsFromSessions(sessions) {
  return (Array.isArray(sessions) ? sessions : [])
    .map((session) => summariseBobSession(session))
    .filter((session) => session.pendingWin.hasValue)
    .map(({ sessionId, game, createdAt, pendingWin }) => ({ sessionId, game, createdAt, amount: pendingWin.amount }));
}

function normaliseRows(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.rows)) return value.rows;
  if (Array.isArray(value?.ok?.rows)) return value.ok.rows;
  return [];
}

function uniqueBySession(rows) {
  const seen = new Set();
  return rows.filter((row) => {
    const id = String(row?.session_id || "").trim();
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

function stripHtml(value) {
  return String(value || "").replace(/<[^>]*>/g, "").trim();
}

function normalisePendingWin(value) {
  const amount = String(value ?? "").trim();
  if (!amount || /^null$/i.test(amount)) return { hasValue: false, amount: "" };
  const numeric = Number(amount.replace(/,/g, ""));
  return { hasValue: Number.isFinite(numeric) ? numeric > 0 : amount !== "0", amount };
}
