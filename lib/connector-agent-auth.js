import crypto from "node:crypto";
import { optionalEnv } from "./http.js";

const SERVICES = new Set(["atena", "kyc", "bob"]);

export function configuredConnectorAgent(service, email) {
  const cleanService = normalizeService(service);
  const cleanEmail = normalizeEmail(email);
  if (!cleanService || !cleanEmail) return false;
  return Boolean(agentTokens()[cleanEmail]?.[cleanService]);
}

export function authenticateConnectorAgent(req, service) {
  const cleanService = normalizeService(service);
  const email = normalizeEmail(req.headers["x-support-connector-agent"]);
  const token = String(req.headers["x-support-connector-agent-token"] || "").trim();
  if (!email && !token) return { mode: "legacy", email: "" };
  if (!cleanService || !email || !token) return null;
  const expected = agentTokens()[email]?.[cleanService] || "";
  if (!safeEqual(token, expected)) return null;
  return { mode: "agent", email };
}

function agentTokens() {
  const raw = optionalEnv("SUPPORT_CONNECTOR_AGENT_TOKENS_JSON");
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return Object.fromEntries(Object.entries(parsed).map(([email, services]) => {
      const normalized = normalizeEmail(email);
      const entries = services && typeof services === "object" && !Array.isArray(services)
        ? Object.entries(services)
          .filter(([service, token]) => SERVICES.has(String(service).toLowerCase()) && String(token || "").trim())
          .map(([service, token]) => [String(service).toLowerCase(), String(token).trim()])
        : [];
      return [normalized, Object.fromEntries(entries)];
    }).filter(([email]) => Boolean(email)));
  } catch {
    return {};
  }
}

function normalizeService(value) {
  const clean = String(value || "").trim().toLowerCase();
  return SERVICES.has(clean) ? clean : "";
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function safeEqual(actual, expected) {
  const left = Buffer.from(String(actual || ""));
  const right = Buffer.from(String(expected || ""));
  return left.length === right.length && left.length > 0 && crypto.timingSafeEqual(left, right);
}
