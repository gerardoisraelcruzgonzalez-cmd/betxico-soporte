#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { closeSessions } from "./bob-local-connector.mjs";

const customerId = String(process.argv[2] || "").trim();
const customerName = String(process.argv[3] || "").trim();
const customerEmail = String(process.argv[4] || "").trim().toLowerCase();

if (!/^\d{3,20}$/.test(customerId) || !customerName || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
  console.error("usage: node scripts/run-bob-local-closure-once.mjs <auth_id> <name> <email>");
  process.exit(2);
}

const date = new Date().toISOString().slice(0, 10);
const outDir = path.resolve("outputs", `game_session_closure_${date}_${customerId}`);
mkdirSync(outDir, { recursive: true });

const job = {
  id: `local-${customerId}-${Date.now()}`,
  customerId,
  customer: { name: customerName, email: customerEmail },
  reportedGame: "",
  startDate: "2026-01-01",
  endDate: date
};

const progressLog = [];
const checkpoints = [];

const result = await closeSessions(
  job,
  async (progress) => {
    progressLog.push({ at: new Date().toISOString(), ...progress });
    console.log(progress.message || progress.step || "progress");
  },
  async (checkpoint) => {
    checkpoints.push({ at: new Date().toISOString(), ...checkpoint });
  }
);

for (const evidence of result.jiraEvidence || []) {
  if (!evidence?.dataBase64 || !evidence?.filename) continue;
  writeFileSync(path.join(outDir, evidence.filename), Buffer.from(evidence.dataBase64, "base64"));
}

writeFileSync(path.join(outDir, "resultado.json"), JSON.stringify({ job, result, progressLog, checkpoints }, null, 2));
writeFileSync(path.join(outDir, "indice.csv"), [
  "secuencia,auth_id_parcial,juego,perfil_encontrado,sesiones_revisadas,sesiones_cerradas,estado,resultado,notas",
  `001,${customerId.slice(0, 3)}***,,si,${result.totalPendingFound},${result.closedCount},${result.closedCount ? "cerrado" : "sin_sesion"},finalized,"verificado con ${result.verifiedPendingCount} sesiones pendientes tras buscar nuevamente"`
].join("\n"));

console.log(`RESULT_PATH=${outDir}`);
console.log(JSON.stringify({
  customerId: result.customerId,
  totalPendingFound: result.totalPendingFound,
  closedCount: result.closedCount,
  verifiedPendingCount: result.verifiedPendingCount,
  evidence: (result.jiraEvidence || []).map((item) => item.filename)
}, null, 2));
