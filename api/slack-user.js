import crypto from "node:crypto";
import {
  createOrUpdateAccount,
  getAccount,
  getCurrentAccount,
  publicAccount,
  saveAccount,
  setSessionCookie
} from "../lib/account-store.js";
import { optionalEnv, readJson, sendJson } from "../lib/http.js";
import { getSlackUserTokenStatus, saveSlackUserToken } from "../lib/slack-user-tokens.js";
import { syncSlackListPanelCache } from "../lib/slack.js";
import { SUPPORT_SLACK_PANEL_ID, isSupportAdmin } from "../lib/remote-config.js";

export default async function handler(req, res) {
  const action = String(req.query?.action || "").trim();
  const hasSlackCallback = Boolean(req.query?.code || req.query?.state || req.query?.error);
  const callbackState = hasSlackCallback ? verifyState(String(req.query?.state || "").trim()) : null;

  if (action === "signin-start") {
    return handleSignInStart(req, res);
  }
  if (action === "signin-callback") {
    return handleSignInCallback(req, res);
  }
  if (action === "start") {
    return handleStart(req, res);
  }
  if (action === "status") {
    return handleStatus(req, res);
  }
  if (action === "sync") {
    return handleSync(req, res);
  }
  if (!action && hasSlackCallback && callbackState?.nonce) {
    return handleSignInCallback(req, res, callbackState);
  }
  if (action === "callback" || (!action && hasSlackCallback)) {
    return handleCallback(req, res, callbackState);
  }
  return sendJson(res, 404, { ok: false, error: "not_found" });
}

async function handleSignInStart(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  try {
    await readJson(req).catch(() => ({}));
    const config = getSlackSignInConfig(req);
    if (!config.configured) {
      const error = new Error("slack_signin_not_configured");
      error.statusCode = 500;
      throw error;
    }

    const state = signState({ nonce: crypto.randomBytes(16).toString("base64url") }, 600);
    const url = new URL("https://slack.com/openid/connect/authorize");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email profile");
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("redirect_uri", config.callbackUrl);
    url.searchParams.set("state", state);
    url.searchParams.set("nonce", state.split(".")[0]);
    return sendJson(res, 200, { ok: true, url: url.toString() });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "slack_signin_start_failed",
      details: error.details || undefined
    });
  }
}

async function handleSignInCallback(req, res, verifiedState = null) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("content-type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({ ok: false, error: "method_not_allowed" }));
  }

  try {
    const requestUrl = getRequestUrl(req);
    const code = String(requestUrl.searchParams.get("code") || "").trim();
    const state = verifiedState || verifyState(String(requestUrl.searchParams.get("state") || "").trim());
    if (!code || !state?.nonce) {
      const error = new Error("invalid_slack_signin_state");
      error.statusCode = 400;
      throw error;
    }

    const config = getSlackSignInConfig(req);
    if (!config.configured) {
      const error = new Error("slack_signin_not_configured");
      error.statusCode = 500;
      throw error;
    }

    const tokenResponse = await fetch("https://slack.com/api/openid.connect.token", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded; charset=utf-8" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.callbackUrl
      })
    });
    const tokenData = await tokenResponse.json().catch(() => ({}));
    if (!tokenResponse.ok || !tokenData.ok || !tokenData.access_token) {
      const error = new Error(tokenData.error || `slack_signin_http_${tokenResponse.status}`);
      error.statusCode = tokenResponse.status || 500;
      error.details = tokenData;
      throw error;
    }

    const profile = await fetchSlackUserInfo(tokenData.access_token);
    const email = String(profile.email || "").trim().toLowerCase();
    if (!email) {
      const error = new Error("slack_signin_email_missing");
      error.statusCode = 400;
      throw error;
    }

    const existing = await getAccount(email).catch(() => null);
    const account = await createOrUpdateAccount({
      email,
      displayName: profile.name || profile.given_name || existing?.displayName || email,
      jiraEmail: existing?.jiraEmail || email
    }, existing || {}, { allowPasswordless: true });

    account.slackAuthenticatedAt = new Date().toISOString();
    account.slackAuthProvider = "slack";
    await saveAccount(account.email, account);

    setSessionCookie(res, account.email);
    return sendHtml(res, 200, "Sesión iniciada con Slack", "Ya puedes cerrar esta pestaña y volver a LiveChat.", publicAccount(account, account.email));
  } catch (error) {
    return sendHtml(res, error.statusCode || 500, "No pude iniciar con Slack", error.message || "slack_signin_failed");
  }
}

async function handleStart(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  try {
    await readJson(req).catch(() => ({}));
    const account = await getCurrentAccount(req);
    if (!account?.email) {
      const error = new Error("invalid_login");
      error.statusCode = 401;
      throw error;
    }

    const config = getSlackOAuthConfig(req);
    if (!config.configured) {
      const error = new Error("slack_oauth_not_configured");
      error.statusCode = 500;
      throw error;
    }

    const url = new URL("https://slack.com/oauth/v2/authorize");
    url.searchParams.set("client_id", config.clientId);
    url.searchParams.set("user_scope", config.userScopes);
    url.searchParams.set("redirect_uri", config.callbackUrl);
    url.searchParams.set("state", signState({ email: account.email }, 600));
    return sendJson(res, 200, { ok: true, url: url.toString() });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "slack_oauth_start_failed",
      details: error.details || undefined
    });
  }
}

async function fetchSlackUserInfo(accessToken) {
  const response = await fetch("https://slack.com/api/openid.connect.userInfo", {
    headers: { authorization: `Bearer ${accessToken}` }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.ok) {
    const error = new Error(data.error || `slack_userinfo_http_${response.status}`);
    error.statusCode = response.status || 500;
    error.details = data;
    throw error;
  }
  return data;
}

async function handleStatus(req, res) {
  if (req.method !== "GET") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  try {
    const account = await getCurrentAccount(req);
    if (!account?.email) {
      const error = new Error("invalid_login");
      error.statusCode = 401;
      throw error;
    }

    const status = await getSlackUserTokenStatus(account.email);
    return sendJson(res, 200, { ok: true, ...status });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "slack_oauth_status_failed",
      details: error.details || undefined
    });
  }
}

async function handleSync(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "method_not_allowed" });
  }

  try {
    await readJson(req).catch(() => ({}));
    const account = await getCurrentAccount(req);
    if (!account?.email) {
      const error = new Error("invalid_login");
      error.statusCode = 401;
      throw error;
    }
    if (!(await isSupportAdmin(account.email))) {
      const error = new Error("admin_not_authorized");
      error.statusCode = 403;
      throw error;
    }
    const tokenStatus = await getSlackUserTokenStatus(account.email);
    if (!tokenStatus.connected) {
      const error = new Error("slack_user_not_connected");
      error.statusCode = 400;
      throw error;
    }
    const sync = await syncSlackListPanelCache(SUPPORT_SLACK_PANEL_ID, { accountEmail: account.email });
    return sendJson(res, 200, { ok: true, sync });
  } catch (error) {
    return sendJson(res, error.statusCode || 500, {
      ok: false,
      error: error.message || "slack_list_sync_failed",
      details: error.details || undefined
    });
  }
}

async function handleCallback(req, res, verifiedState = null) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.setHeader("content-type", "application/json; charset=utf-8");
    return res.end(JSON.stringify({ ok: false, error: "method_not_allowed" }));
  }

  try {
    const requestUrl = getRequestUrl(req);
    const code = String(requestUrl.searchParams.get("code") || "").trim();
    const state = verifiedState || verifyState(String(requestUrl.searchParams.get("state") || "").trim());
    if (!code || !state?.email) {
      const error = new Error("invalid_slack_oauth_state");
      error.statusCode = 400;
      throw error;
    }

    const config = getSlackOAuthConfig(req);
    if (!config.configured) {
      const error = new Error("slack_oauth_not_configured");
      error.statusCode = 500;
      throw error;
    }

    const response = await fetch("https://slack.com/api/oauth.v2.access", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded; charset=utf-8" },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code,
        redirect_uri: config.callbackUrl
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.ok || !data.authed_user?.access_token) {
      const error = new Error(data.error || `slack_oauth_http_${response.status}`);
      error.statusCode = response.status || 500;
      error.details = data;
      throw error;
    }

    await saveSlackUserToken({
      email: state.email,
      accessToken: data.authed_user.access_token,
      slackUserId: data.authed_user.id || "",
      teamId: data.team?.id || "",
      scope: data.authed_user.scope || data.scope || ""
    });

    let syncMessage = "Lista 8 sincronizada con tu sesión.";
    try {
      const sync = await syncSlackListPanelCache(SUPPORT_SLACK_PANEL_ID, { accountEmail: state.email });
      syncMessage = `Lista 8 sincronizada: ${Number(sync.itemCount) || 0} registros disponibles.`;
    } catch (syncError) {
      // Keep the successful OAuth connection even when Slack declines the new
      // list scope. The callback page exposes the exact next action to the user.
      syncMessage = syncError?.message === "missing_scope"
        ? "Slack quedó conectado, pero falta autorizar el permiso lists:read. Repite la conexión y acepta el permiso de listas."
        : "Slack quedó conectado; no pude sincronizar Lista 8 todavía. Vuelve a intentar la conexión en unos minutos.";
    }

    return sendHtml(res, 200, "Slack personal conectado", syncMessage);
  } catch (error) {
    return sendHtml(res, error.statusCode || 500, "No pude conectar Slack", error.message || "slack_oauth_callback_failed");
  }
}

function getSlackOAuthConfig(req) {
  const clientId = optionalEnv("SLACK_CLIENT_ID");
  const clientSecret = optionalEnv("SLACK_CLIENT_SECRET");
  const origin = getOrigin(req);
  const callbackUrl = optionalEnv("SLACK_USER_OAUTH_CALLBACK_URL", `${origin}/api/slack-user`);
  const userScopes = optionalEnv("SLACK_USER_SCOPES", "chat:write,lists:read")
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean)
    .join(",") || "chat:write,lists:read";

  return {
    clientId,
    clientSecret,
    callbackUrl,
    userScopes,
    configured: Boolean(clientId && clientSecret && callbackUrl)
  };
}

function getSlackSignInConfig(req) {
  const clientId = optionalEnv("SLACK_SIGNIN_CLIENT_ID", optionalEnv("SLACK_CLIENT_ID"));
  const clientSecret = optionalEnv("SLACK_SIGNIN_CLIENT_SECRET", optionalEnv("SLACK_CLIENT_SECRET"));
  const origin = getOrigin(req);
  const callbackUrl = optionalEnv("SLACK_SIGNIN_CALLBACK_URL", `${origin}/api/slack-user`);
  return {
    clientId,
    clientSecret,
    callbackUrl,
    configured: Boolean(clientId && clientSecret && callbackUrl)
  };
}

function signState(payload, ttlSeconds) {
  const body = Buffer.from(JSON.stringify({
    ...payload,
    expiresAt: Math.floor(Date.now() / 1000) + ttlSeconds
  })).toString("base64url");
  const signature = crypto.createHmac("sha256", stateSecret()).update(body).digest("base64url");
  return `${body}.${signature}`;
}

function verifyState(raw) {
  const [body, signature] = raw.split(".");
  if (!body || !signature) return null;
  const expected = crypto.createHmac("sha256", stateSecret()).update(body).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;
  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  if (Number(payload.expiresAt || 0) < Math.floor(Date.now() / 1000)) return null;
  return payload;
}

function stateSecret() {
  const secret = optionalEnv("SUPPORT_SESSION_SECRET") || optionalEnv("SUPPORT_ENCRYPTION_KEY");
  if (!secret) {
    const error = new Error("missing_session_secret");
    error.statusCode = 500;
    throw error;
  }
  return secret;
}

function sendHtml(res, statusCode, title, message, account = null) {
  res.statusCode = statusCode;
  res.setHeader("content-type", "text/html; charset=utf-8");
  const success = statusCode >= 200 && statusCode < 300;
  const redirectUrl = success ? "/" : "";
  return res.end(`<!doctype html>
<html lang="es">
  <head><meta charset="utf-8"><title>${escapeHtml(title)}</title></head>
  <body style="font-family: system-ui, sans-serif; padding: 24px;">
    <h1>${escapeHtml(title)}</h1>
    <p>${escapeHtml(message)}</p>
    <script>
      try {
        var hasOpener = Boolean(window.opener && !window.opener.closed);
        localStorage.setItem("betxicoSlackLoginComplete", String(Date.now()));
        if (hasOpener) {
          window.opener.postMessage({ type: "betxico-slack-login-complete" }, location.origin);
          setTimeout(function () { window.close(); }, 500);
        } else if (${JSON.stringify(Boolean(redirectUrl))}) {
          setTimeout(function () { window.location.replace(${JSON.stringify(redirectUrl)}); }, 700);
        }
      } catch {}
    </script>
    ${account ? `<pre style="display:none">${escapeHtml(JSON.stringify(account))}</pre>` : ""}
  </body>
</html>`);
}

function getRequestUrl(req) {
  return new URL(req.url || "/", getOrigin(req));
}

function getOrigin(req) {
  const proto = String(req.headers["x-forwarded-proto"] || "https").split(",")[0].trim();
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").split(",")[0].trim();
  return `${proto}://${host}`;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}
