export async function writeAuditLog(event) {
  const safeEvent = {
    ...sanitizeForAudit(event),
    createdAt: new Date().toISOString()
  };

  console.log(JSON.stringify(safeEvent));
}

function sanitizeForAudit(value) {
  if (Array.isArray(value)) {
    return value.map(sanitizeForAudit);
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  return Object.entries(value).reduce((acc, [key, item]) => {
    if (["jiraApiToken", "jiraApiTokenEncrypted", "pin"].includes(key)) {
      acc[key] = item ? "[redacted]" : "";
      return acc;
    }
    acc[key] = sanitizeForAudit(item);
    return acc;
  }, {});
}
