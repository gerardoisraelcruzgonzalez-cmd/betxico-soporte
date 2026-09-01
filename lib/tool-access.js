import { getSupportConfig, isSupportAdmin } from "./remote-config.js";

export const ACCESS_GROUPS = Object.freeze({
  BASIC: "basic",
  OPERATIONS: "operations",
  AI: "ai",
  COMPLETE: "complete"
});

const GROUP_CAPABILITIES = Object.freeze({
  [ACCESS_GROUPS.BASIC]: Object.freeze({ atena: false, kyc: false, bob: false, ai: false }),
  [ACCESS_GROUPS.OPERATIONS]: Object.freeze({ atena: true, kyc: true, bob: true, ai: false }),
  [ACCESS_GROUPS.AI]: Object.freeze({ atena: false, kyc: false, bob: false, ai: true }),
  [ACCESS_GROUPS.COMPLETE]: Object.freeze({ atena: true, kyc: true, bob: true, ai: true })
});

export function normalizeAccessGroup(value) {
  const group = String(value || "").trim().toLowerCase();
  return Object.hasOwn(GROUP_CAPABILITIES, group) ? group : ACCESS_GROUPS.BASIC;
}

export function accessGroupCapabilities(group) {
  return { ...GROUP_CAPABILITIES[normalizeAccessGroup(group)] };
}

export async function getAgentToolAccess(email) {
  if (await isSupportAdmin(email)) {
    return { group: ACCESS_GROUPS.COMPLETE, capabilities: accessGroupCapabilities(ACCESS_GROUPS.COMPLETE) };
  }
  const config = await getSupportConfig();
  const user = config.authorizedUsers.find((item) => item.email === String(email || "").trim().toLowerCase());
  const group = normalizeAccessGroup(user?.accessGroup);
  return { group, capabilities: accessGroupCapabilities(group) };
}

export async function requireAgentCapability(account, capability) {
  const access = await getAgentToolAccess(account?.email);
  if (access.capabilities[capability] === true) return access;
  const error = new Error(`agent_${capability}_access_disabled`);
  error.statusCode = 403;
  throw error;
}
