import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const URL = "https://api.livechatinc.com/v3.6/agent/action/list_archives";
const args = parseArgs(process.argv.slice(2));
loadLocalEnv();

main().catch((error) => {
  console.error(`consult-livechat-emails failed: ${error.message}`);
  process.exitCode = 1;
});

async function main() {
  const input = args.input || args.emails;
  if (!input && !args.email) throw new Error("usa --input archivo.json|csv o --email cliente@correo.com");
  const rows = args.email ? [{ correo: args.email }] : await readRows(input);
  const unique = [...new Map(rows.map((row) => [normalizeEmail(row.correo || row.email), row])).entries()]
    .filter(([email]) => email)
    .map(([correo, row]) => ({ ...row, correo }));
  const from = validDate(args.from || "2026-06-10T00:00:00-06:00");
  const to = validDate(args.to || "2026-07-12T00:00:00-06:00");
  const outputDir = path.resolve(args["output-dir"] || "tmp/livechat-email-consult");
  fs.mkdirSync(outputDir, { recursive: true });

  const results = [];
  const concurrency = Math.min(8, Math.max(1, Number(args.concurrency || 4)));
  let cursor = 0;
  async function worker() {
    while (cursor < unique.length) {
      const index = cursor++;
      const row = unique[index];
      const chats = args.archive ? filterLocalChats(readJson(args.archive), row.correo) : await fetchByEmail(row.correo, from, to);
      results[index] = analyze(row, chats);
      console.log(`[${index + 1}/${unique.length}] ${row.correo}: ${results[index].vino}`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));

  const byEmail = new Map(results.map((result) => [result.correo, result]));
  const expanded = rows
    .map((row) => ({ ...row, correo: normalizeEmail(row.correo || row.email) }))
    .filter((row) => row.correo && byEmail.has(row.correo))
    .map((row) => ({
      row_id: row.row_id || "",
      record_url: row.record_url || "",
      atena_status: row.atena_status || "",
      ...byEmail.get(row.correo)
    }));
  const stamp = new Date().toISOString().slice(0, 10);
  const csvPath = path.join(outputDir, `consulta_livechat_lista5_${stamp}.csv`);
  const jsonPath = path.join(outputDir, `consulta_livechat_lista5_${stamp}.json`);
  fs.writeFileSync(csvPath, toCsv(expanded), "utf8");
  fs.writeFileSync(jsonPath, `${JSON.stringify({ from: from.toISOString(), to: to.toISOString(), uniqueEmails: results.length, rows: expanded.length, results: expanded }, null, 2)}\n`, "utf8");
  const counts = results.reduce((acc, item) => ((acc[item.vino] = (acc[item.vino] || 0) + 1), acc), {});
  console.log(`Resultado: ${JSON.stringify(counts)}`);
  console.log(`CSV: ${csvPath}`);
  console.log(`JSON: ${jsonPath}`);
}

async function fetchByEmail(email, from, to) {
  const token = process.env.LIVECHAT_BASIC_TOKEN || process.env.LIVECHAT_BASIC_AUTH_TOKEN || process.env.TEXT_BASIC_TOKEN;
  if (!token) throw new Error("falta LIVECHAT_BASIC_TOKEN (tambien se acepta LIVECHAT_BASIC_AUTH_TOKEN o TEXT_BASIC_TOKEN)");
  const chats = [];
  let pageId = "";
  do {
    const body = pageId ? { page_id: pageId } : {
      filters: {
        from: toLiveChatDate(from),
        to: toLiveChatDate(to),
        query: email,
        event_types: { values: ["message", "filled_form", "file", "rich_message"] }
      },
      sort_order: "asc",
      limit: 100
    };
    const response = await fetchWithRetry(body, token);
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`LiveChat ${response.status}: ${data?.error?.message || data?.error || "list_archives_failed"}`);
    chats.push(...(data.chats || []));
    pageId = data.next_page_id || "";
  } while (pageId);
  return dedupeChats(chats).filter((chat) => chatMatchesEmail(chat, email));
}

async function fetchWithRetry(body, token) {
  for (let attempt = 0; attempt < 7; attempt += 1) {
    const response = await fetch(URL, {
      method: "POST",
      headers: { authorization: `Basic ${token}`, "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    if (response.status !== 429 || attempt === 6) return response;
    const retryAfter = Number(response.headers.get("retry-after") || 0);
    const delay = Math.max(retryAfter * 1000, 1500 * (attempt + 1));
    await new Promise((resolve) => setTimeout(resolve, delay));
  }
  throw new Error("livechat_retry_exhausted");
}

function analyze(row, chats) {
  const events = chats.flatMap(getEvents);
  const customerIds = new Set(chats.flatMap((chat) => (chat.users || []).filter((u) => u.type === "customer").map((u) => String(u.id || ""))));
  const customerEvents = events.filter((event) => customerIds.has(String(event.author_id || "")) || event.author_type === "customer");
  const customerText = customerEvents.map(eventText).filter(Boolean).join("\n");
  const allText = `${chats.map((chat) => JSON.stringify(chat.thread?.summary || "")).join("\n")}\n${events.map(eventText).join("\n")}`;
  const normalized = normalizeText(allText);
  const customerNormalized = normalizeText(customerText);
  const fileEvents = customerEvents.filter(isFileEvent);
  const names = fileEvents.map(fileName).join(" ");
  const evidenceText = normalizeText(`${customerText} ${names}`);

  const sent = new Set();
  if (/\bine\b|identificacion|identificación/.test(evidenceText)) sent.add("INE");
  if (/frente|frontal|anverso/.test(evidenceText)) sent.add("INE frente");
  if (/reverso|posterior|parte de atras|parte de atrás|vuelta/.test(evidenceText)) sent.add("INE reverso");
  if (/selfie|foto.*(cara|rostro)|rostro.*ine/.test(evidenceText)) sent.add("selfie");
  if (/captura|screenshot|pantallazo/.test(evidenceText)) sent.add("captura");
  if (/\bclabe\b|cuenta bancaria/.test(customerNormalized)) sent.add("CLABE");
  if (new RegExp(row.correo.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(customerText)) sent.add("correo");
  if (fileEvents.length && ![...sent].some((x) => /INE|selfie|captura/.test(x))) sent.add("imagen no identificada");
  if (!fileEvents.length && /(?:envio|envío|mando|adjunto|aqui esta|aquí está|mis datos|mi clabe)/.test(customerNormalized)) sent.add("datos escritos");

  const hasFront = sent.has("INE frente");
  const hasBack = sent.has("INE reverso");
  let ine = "No enviada";
  if (hasFront && hasBack) ine = "Completa";
  else if (hasFront || hasBack || sent.has("INE")) ine = "Parcial";
  else if (fileEvents.length) ine = "No detectable";

  let motivo = "No claro";
  const tema = normalizeText(row.tema || row.slack_detail || "");
  if (/dev\s*wallet|devwallet/.test(`${tema} ${normalized}`)) motivo = "Devwallet";
  else if (/\badv\b.*bono|bono|bonificacion|bonificación|promocion|promoción/.test(`${tema} ${normalized}`)) motivo = "ADV bono";
  else if (/\botros\b/.test(tema)) motivo = "OTROS";
  else if (/\bkyc\b|verificacion|verificación|identidad|\bine\b|selfie/.test(normalized)) motivo = "KYC";

  const docs = sent.size ? (ine === "Parcial" ? "Parcial" : "Sí") : "No";
  let accion = "Revisar manual";
  if (["ADV bono", "Devwallet"].includes(motivo)) accion = "No pedir documentos";
  else if (["OTROS", "KYC"].includes(motivo) && ine !== "Completa") accion = "Pedir INE";
  const vino = chats.length ? "Sí" : "No";
  const que = sent.size ? [...sent].join("; ") : "no detectable";
  const resumen = vino === "No"
    ? "No se encontró conversación en el periodo."
    : `${motivo}: ${sent.size ? `envió ${que}` : "no se detectaron documentos ni datos enviados"}.`.slice(0, 180);

  return {
    correo: row.correo, vino, motivo,
    documentos_datos_enviados: docs,
    que_envio: que,
    ine,
    resumen,
    accion,
    chats_encontrados: chats.length,
    chat_ids: chats.map((chat) => chat.id || chat.chat_id).filter(Boolean).join("; "),
    fechas: events.map((event) => event.created_at).filter(Boolean).sort().filter((v, i, a) => i === 0 || i === a.length - 1).join("; "),
    archivos_cliente: fileEvents.length
  };
}

function getEvents(chat) {
  const events = [];
  if (Array.isArray(chat.thread?.events)) events.push(...chat.thread.events);
  for (const thread of chat.threads || []) if (Array.isArray(thread.events)) events.push(...thread.events);
  return events;
}
function eventText(event) { return String(event.text || event.content?.text || event.title || "").trim(); }
function isFileEvent(event) { return event.type === "file" || Boolean(event.file || event.url || event.content_type || event.mime_type); }
function fileName(event) { return String(event.name || event.filename || event.file?.name || event.url || ""); }
function chatMatchesEmail(chat, email) {
  const needle = normalizeEmail(email);
  if ((chat.users || []).some((user) => normalizeEmail(user.email) === needle)) return true;
  return normalizeText(JSON.stringify(chat)).includes(normalizeText(needle));
}
function filterLocalChats(raw, email) { return dedupeChats(Array.isArray(raw) ? raw : raw.chats || []).filter((chat) => chatMatchesEmail(chat, email)); }
function dedupeChats(chats) { return [...new Map(chats.map((chat) => [String(chat.id || chat.chat_id), chat])).values()]; }

async function readRows(file) {
  if (/\.json$/i.test(file)) {
    const value = readJson(file);
    return Array.isArray(value) ? value : value.rows || value.results || [];
  }
  const ExcelJS = (await import("exceljs")).default;
  const workbook = new ExcelJS.Workbook();
  const sheet = await workbook.csv.readFile(file);
  const headers = sheet.getRow(1).values.slice(1).map((v) => String(v || "").trim());
  return sheet.getRows(2, sheet.rowCount - 1).map((excelRow) => Object.fromEntries(headers.map((h, i) => [h, String(excelRow.getCell(i + 1).text || "").trim()])));
}
function readJson(file) { return JSON.parse(fs.readFileSync(file, "utf8")); }
function validDate(value) { const date = new Date(value); if (Number.isNaN(date.getTime())) throw new Error(`fecha inválida: ${value}`); return date; }
function toLiveChatDate(date) { return date.toISOString().replace(/\.(\d{3})Z$/, ".$1000+00:00"); }
function normalizeEmail(value) { return String(value || "").trim().toLowerCase().replace(/^mailto:/, ""); }
function normalizeText(value) { return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase(); }
function toCsv(items) {
  const headers = ["row_id", "record_url", "atena_status", "correo", "vino", "motivo", "documentos_datos_enviados", "que_envio", "ine", "resumen", "accion", "chats_encontrados", "chat_ids", "fechas", "archivos_cliente"];
  return `${headers.join(",")}\n${items.map((item) => headers.map((h) => `"${String(item[h] ?? "").replace(/"/g, '""')}"`).join(",")).join("\n")}\n`;
}
function parseArgs(argv) { const out = {}; for (let i = 0; i < argv.length; i++) if (argv[i].startsWith("--")) { const k = argv[i].slice(2); const v = argv[i + 1]; if (!v || v.startsWith("--")) out[k] = true; else { out[k] = v; i++; } } return out; }
function loadLocalEnv() {
  for (const file of [".env.local", ".env.vercel.local", ".env"]) {
    if (!fs.existsSync(file)) continue;
    for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
      const equals = line.indexOf("=");
      if (equals < 1) continue;
      const key = line.slice(0, equals).trim();
      if (!/^[A-Z0-9_]+$/.test(key)) continue;
      if (process.env[key] && (key !== "LIVECHAT_BASIC_TOKEN" || /^[A-Za-z0-9+/=_-]{40,}$/.test(process.env[key]))) continue;
      let value = line.slice(equals + 1).trim().replace(/^['"]|['"]$/g, "");
      if (key === "LIVECHAT_BASIC_TOKEN" && !/^[A-Za-z0-9+/=_-]{40,}$/.test(value)) {
        value = [...value.matchAll(/[A-Za-z0-9+/=:_-]{40,}/g)]
          .map((candidate) => candidate[0])
          .filter((candidate) => /^[A-Za-z0-9+/=_-]{40,}$/.test(candidate))
          .sort((a, b) => b.length - a.length)[0] || "";
      }
      if (value) process.env[key] = value;
    }
  }
}
