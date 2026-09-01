export function resolveAccountSettingsWrite({ current, payload = {}, isAdmin = false } = {}) {
  const currentEmail = normalizeEmail(current?.email || current?.userId);
  if (!currentEmail) {
    throwPolicyError("login_required", 401);
  }

  const requestedEmail = normalizeEmail(payload.email || currentEmail);
  if (!requestedEmail) {
    throwPolicyError("invalid_account_email", 400);
  }
  if (requestedEmail !== currentEmail && !isAdmin) {
    throwPolicyError("account_update_forbidden", 403);
  }

  return {
    currentEmail,
    targetEmail: requestedEmail,
    editsOwnAccount: requestedEmail === currentEmail
  };
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function throwPolicyError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  throw error;
}
