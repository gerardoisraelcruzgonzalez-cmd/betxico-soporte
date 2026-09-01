import crypto from "node:crypto";

export async function writeAuditLog(event) {
  const safeEvent = {
    ...sanitizeForAudit(event),
    createdAt: new Date().toISOString()
  };

  console.log(JSON.stringify(safeEvent));
}

export function sanitizeForAudit(value, parentKey = "") {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeForAudit(item, parentKey));
  }

  if (!value || typeof value !== "object") {
    return sanitizeAuditScalar(value, parentKey);
  }

  return Object.entries(value).reduce((acc, [key, item]) => {
    const normalizedKey = key.toLowerCase();
    if (isSecretKey(normalizedKey)) {
      acc[key] = item ? "[redacted]" : "";
      return acc;
    }
    if (isPrivateContentKey(normalizedKey)) {
      acc[key] = normalizedKey === "attachments"
        ? { count: Array.isArray(item) ? item.length : 0 }
        : "[redacted]";
      return acc;
    }
    if (isIdentityKey(normalizedKey)) {
      acc[`${key}Fingerprint`] = item ? auditFingerprint(item) : "";
      return acc;
    }
    acc[key] = sanitizeForAudit(item, normalizedKey);
    return acc;
  }, {});
}

export function summarizeSupportTicketForAudit(normalized = {}, { jira = null, slack = null, account = null } = {}) {
  return {
    source: safeLabel(normalized.source),
    destination: safeLabel(normalized.destination),
    workflowId: safeLabel(normalized.workflow?.id || normalized.workflowId),
    hasChatId: Boolean(normalized.chatId),
    attachmentCount: Array.isArray(normalized.attachments) ? normalized.attachments.length : 0,
    actorEmail: account?.email || normalized.accountSettings?.email || "",
    jira: providerAuditResult(jira, ["key", "id"]),
    slack: providerAuditResult(slack, ["channel", "listId", "listItemId"])
  };
}

export function auditFingerprint(value) {
  const text = String(value || "").trim().toLowerCase();
  if (!text) return "";
  return crypto.createHash("sha256").update(text).digest("hex").slice(0, 16);
}

function providerAuditResult(result, idKeys) {
  if (!result || typeof result !== "object") {
    return { attempted: false, ok: false };
  }
  const summary = {
    attempted: true,
    ok: result.ok !== false && !result.error
  };
  for (const key of idKeys) {
    const value = safeProviderId(result[key]);
    if (value) summary[key] = value;
  }
  if (result.error) summary.error = safeLabel(result.error);
  return summary;
}

function sanitizeAuditScalar(value, parentKey) {
  if (typeof value !== "string") return value;
  const text = value.trim();
  if (!text) return value;
  if (parentKey && isIdentityKey(parentKey)) return auditFingerprint(text);
  if (/^data:[^;]+;base64,/i.test(text) || looksLikeEncodedFile(text)) return "[redacted]";
  return text.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, (email) => `[email:${auditFingerprint(email)}]`);
}

function isSecretKey(key) {
  return /(token|secret|password|authorization|cookie|api.?key|\bpin\b)/i.test(key);
}

function isPrivateContentKey(key) {
  return /^(payload|attachments?|database64|base64|bytes|content|message|text|context|description|body|ocr|document|image|file|url|downloadurl)$/i.test(key);
}

function isIdentityKey(key) {
  return /^(email|actoremail|accountemail|customeremail|userid|customerid|authid|displayname|name)$/i.test(key);
}

function looksLikeEncodedFile(value) {
  return value.length > 256 && /^[A-Za-z0-9+/=_-]+$/.test(value);
}

function safeLabel(value) {
  return String(value || "").trim().slice(0, 120).replace(/[^a-zA-Z0-9_.:\-/ ]/g, "");
}

function safeProviderId(value) {
  return String(value || "").trim().slice(0, 120).replace(/[^a-zA-Z0-9_.:\-/]/g, "");
}
