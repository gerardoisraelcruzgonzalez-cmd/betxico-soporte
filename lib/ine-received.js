const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeIneReceivedEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email)) {
    const error = new Error("ine_received_email_invalid");
    error.statusCode = 400;
    throw error;
  }
  return email;
}

export function formatIneReceivedWithdrawalDate(value) {
  const match = String(value || "").trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    const error = new Error("ine_received_withdrawal_date_invalid");
    error.statusCode = 400;
    throw error;
  }
  const [, year, month, day] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  if (
    date.getUTCFullYear() !== Number(year) ||
    date.getUTCMonth() !== Number(month) - 1 ||
    date.getUTCDate() !== Number(day)
  ) {
    const error = new Error("ine_received_withdrawal_date_invalid");
    error.statusCode = 400;
    throw error;
  }
  return `${day}/${month}/${year}`;
}

export function normalizeIneReceivedWithdrawalAmount(value) {
  const raw = String(value || "").trim().replace(/[$,\s]/g, "");
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw) || Number(raw) <= 0) {
    const error = new Error("ine_received_withdrawal_amount_invalid");
    error.statusCode = 400;
    throw error;
  }
  return Number(raw).toFixed(2);
}

export function buildIneReceivedParentMessage(email) {
  return normalizeIneReceivedEmail(email);
}

export function buildRetirosKycMessage({ email, withdrawalDate, withdrawalAmount } = {}) {
  return [
    normalizeIneReceivedEmail(email),
    `KYC actualizado - ${formatIneReceivedWithdrawalDate(withdrawalDate)} $${normalizeIneReceivedWithdrawalAmount(withdrawalAmount)}`
  ].join("\n");
}
