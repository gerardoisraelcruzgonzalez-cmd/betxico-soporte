export function cleanAtenaText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

export function latestAtenaWithdrawal(table) {
  return latestAtenaWithdrawals(table, 1)[0] || null;
}

export function latestAtenaWithdrawals(table, limit = 3) {
  return tableRecords(table)
    .filter((item) => item.amount || item.status || item.detail)
    .sort((left, right) => right.order - left.order)
    .slice(0, Math.max(1, Number(limit) || 3));
}

export function latestAtenaExtractMovements(table, limit = 3) {
  return tableRecords(table)
    .filter((item) => !/saldo anterior|saldo inicial/i.test(item.detail))
    .sort((left, right) => right.order - left.order)
    .slice(0, limit);
}

// Atena is searched over a broader period so the agent can see recent
// withdrawals. The extract returned to the case also includes every movement
// from the operational day being reviewed, rather than only its latest rows.
export function dailyAtenaExtractMovements(table, date) {
  const targetDate = normalizeIsoDate(date);
  if (!targetDate) return [];

  return tableRecords(table)
    .filter((item) => !/saldo anterior|saldo inicial/i.test(item.detail))
    .filter((item) => atenaDateKey(item.date) === targetDate)
    .sort((left, right) => right.order - left.order);
}

export function tableRecords(table) {
  const headers = table?.headers || [];
  const dateIndex = headerIndex(headers, [/solicitud/, /fecha/, /data/, /date/]);
  const detailIndex = headerIndex(headers, [/descripcion/, /detalhe/, /detalle/, /medio de pago/, /metodo/, /tipo/]);
  const valueIndex = headerIndex(headers, [/valor/, /monto/, /importe/, /value/]);
  const statusIndex = headerIndex(headers, [/estado/, /status/, /situacao/]);
  return (table?.rows || []).map((row, index) => ({
    date: cleanAtenaText(row[dateIndex]),
    detail: cleanAtenaText(row[detailIndex]),
    amount: cleanAtenaText(row[valueIndex]),
    status: cleanAtenaText(row[statusIndex]),
    order: dateValue(row[dateIndex]) || index
  })).filter((item) => item.date || item.detail || item.amount || item.status);
}

function headerIndex(headers, patterns) {
  const normalizedHeaders = headers.map((header) => cleanAtenaText(header).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase());
  for (const pattern of patterns) {
    const index = normalizedHeaders.findIndex((header) => pattern.test(header));
    if (index >= 0) return index;
  }
  return -1;
}

function dateValue(value) {
  const match = cleanAtenaText(value).match(/(\d{2})\/(\d{2})\/(\d{4})(?:\s+(\d{2}):(\d{2})(?::(\d{2}))?)?/);
  if (!match) return 0;
  return Date.UTC(Number(match[3]), Number(match[2]) - 1, Number(match[1]), Number(match[4] || 0), Number(match[5] || 0), Number(match[6] || 0));
}

function atenaDateKey(value) {
  const match = cleanAtenaText(value).match(/(\d{2})\/(\d{2})\/(\d{4})/);
  return match ? `${match[3]}-${match[2]}-${match[1]}` : "";
}

function normalizeIsoDate(value) {
  const text = cleanAtenaText(value);
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}
