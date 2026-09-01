#!/usr/bin/env node
import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const projectDirectory = path.dirname(scriptDirectory);
const connectors = [
  { label: "ATENA", file: "atena-local-connector.mjs" },
  { label: "KYC", file: "kyc-local-connector.mjs" },
  ...(process.argv.includes("--with-bob") ? [{ label: "BOB", file: "bob-local-connector.mjs" }] : [])
].map((connector) => ({ ...connector, pathname: path.join(scriptDirectory, connector.file) }));

for (const connector of connectors) {
  if (!existsSync(connector.pathname)) {
    console.error(`No se encontró el conector ${connector.label}: ${connector.pathname}`);
    process.exitCode = 1;
  }
}

if (process.exitCode) process.exit();

if (process.argv.includes("--check")) {
  console.log("Iniciador conjunto listo: Atena + KYC.");
  process.exit(0);
}

console.log(`Iniciando los conectores de LiveChat: ${connectors.map((connector) => connector.label).join(" + ")}...`);
console.log("Conserva esta Terminal abierta durante las consultas. Presiona Ctrl+C para cerrar ambos.");

const children = new Map();
let stopping = false;
let failed = false;

for (const connector of connectors) {
  const child = spawn(process.execPath, [connector.pathname], {
    cwd: projectDirectory,
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"]
  });
  children.set(connector.label, child);
  prefixOutput(child.stdout, connector.label, process.stdout);
  prefixOutput(child.stderr, connector.label, process.stderr);
  child.once("error", (error) => stopAfterFailure(connector.label, error.message));
  child.once("exit", (code, signal) => {
    children.delete(connector.label);
    if (!stopping) {
      const detail = signal ? `señal ${signal}` : `código ${code ?? "desconocido"}`;
      stopAfterFailure(connector.label, detail);
    }
    if (children.size === 0) process.exitCode = failed ? 1 : 0;
  });
}

process.once("SIGINT", () => stopAll("SIGINT"));
process.once("SIGTERM", () => stopAll("SIGTERM"));

function prefixOutput(stream, label, destination) {
  let pending = "";
  stream.setEncoding("utf8");
  stream.on("data", (chunk) => {
    pending += chunk;
    const lines = pending.split(/\r?\n/);
    pending = lines.pop() || "";
    for (const line of lines) destination.write(`[${label}] ${line}\n`);
  });
  stream.on("end", () => {
    if (pending) destination.write(`[${label}] ${pending}\n`);
  });
}

function stopAfterFailure(label, detail) {
  if (stopping) return;
  failed = true;
  console.error(`El conector ${label} se detuvo (${detail}). Se cerrará el otro para evitar un funcionamiento incompleto.`);
  console.error("Si indica que ya existe un conector, cierra la Terminal anterior y vuelve a ejecutar npm run conectores.");
  stopAll("SIGTERM");
}

function stopAll(signal) {
  if (stopping) return;
  stopping = true;
  for (const child of children.values()) {
    if (!child.killed) child.kill(signal);
  }
  const forceTimer = setTimeout(() => {
    for (const child of children.values()) {
      if (child.exitCode === null && child.signalCode === null) child.kill("SIGKILL");
    }
  }, 5_000);
  forceTimer.unref();
}
