import { optionalEnv } from "./http.js";

const KV_KEY = "support:alert-acks";

export async function getAlertAcknowledgements(email) {
  const cleanEmail = normalizeEmail(email);
  if (!cleanEmail) return {};
  const envelope = await loadEnvelope();
  return envelope.users[cleanEmail] || {};
}

export async function acknowledgeAlert(email, alertId, version) {
  const cleanEmail = normalizeEmail(email);
  const cleanAlertId = String(alertId || "").trim();
  const cleanVersion = String(version || "").trim();
  if (!cleanEmail || !cleanAlertId || !cleanVersion) {
    const error = new Error("invalid_alert_ack");
    error.statusCode = 400;
    throw error;
  }

  const envelope = await loadEnvelope();
  envelope.users[cleanEmail] = {
    ...(envelope.users[cleanEmail] || {}),
    [cleanAlertId]: cleanVersion
  };
  await saveEnvelope(envelope);
  return envelope.users[cleanEmail];
}

export async function getAlertAcknowledgementSummary(alerts = [], authorizedUsers = []) {
  const envelope = await loadEnvelope();
  return Object.fromEntries((Array.isArray(alerts) ? alerts : []).map((alert) => {
    const targets = selectTargetUsers(alert, authorizedUsers);
    const seenEmails = targets
      .filter((user) => envelope.users[user.email]?.[alert.id] === alert.updatedAt)
      .map((user) => user.email);
    const pendingEmails = targets
      .filter((user) => envelope.users[user.email]?.[alert.id] !== alert.updatedAt)
      .map((user) => user.email);
    return [alert.id, {
      targetCount: targets.length,
      seenCount: seenEmails.length,
      pendingCount: pendingEmails.length,
      seenEmails,
      pendingEmails
    }];
  }));
}

function selectTargetUsers(alert = {}, authorizedUsers = []) {
  const users = (Array.isArray(authorizedUsers) ? authorizedUsers : [])
    .map((user) => ({
      email: normalizeEmail(user.email),
      role: String(user.role || "agent").trim().toLowerCase(),
      enabled: user.enabled !== false
    }))
    .filter((user) => user.email && user.enabled);

  if (alert.target === "all") return users;
  if (alert.target === "admins") return users.filter((user) => user.role === "admin");
  if (alert.target === "emails") {
    const emails = new Set((alert.targetEmails || []).map(normalizeEmail).filter(Boolean));
    return users.filter((user) => emails.has(user.email));
  }
  return users.filter((user) => user.role !== "admin");
}

async function loadEnvelope() {
  const response = await kvRequest(["GET", KV_KEY]);
  if (!response?.result) return { users: {} };
  try {
    const parsed = JSON.parse(response.result);
    return {
      users: parsed?.users && typeof parsed.users === "object" ? parsed.users : {}
    };
  } catch {
    return { users: {} };
  }
}

async function saveEnvelope(envelope) {
  await kvRequest(["SET", KV_KEY, JSON.stringify({
    users: envelope.users && typeof envelope.users === "object" ? envelope.users : {}
  })]);
}

async function kvRequest(command) {
  const url = optionalEnv("KV_REST_API_URL") || optionalEnv("UPSTASH_REDIS_REST_URL");
  const token = optionalEnv("KV_REST_API_TOKEN") || optionalEnv("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) {
    const error = new Error("missing_kv_config");
    error.statusCode = 500;
    throw error;
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

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}
