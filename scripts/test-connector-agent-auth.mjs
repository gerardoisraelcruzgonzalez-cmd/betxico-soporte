import assert from "node:assert/strict";

process.env.SUPPORT_CONNECTOR_AGENT_TOKENS_JSON = JSON.stringify({
  "anahy.haro@betxico.mx": {
    atena: "atena-test-token",
    kyc: "kyc-test-token",
    bob: "bob-test-token"
  }
});

const { authenticateConnectorAgent, configuredConnectorAgent } = await import("../lib/connector-agent-auth.js");

assert.equal(configuredConnectorAgent("atena", "anahy.haro@betxico.mx"), true);
assert.equal(configuredConnectorAgent("kyc", "anahy.haro@betxico.mx"), true);
assert.equal(configuredConnectorAgent("bob", "anahy.haro@betxico.mx"), true);
assert.equal(configuredConnectorAgent("atena", "other@betxico.mx"), false);

const valid = authenticateConnectorAgent({ headers: {
  "x-support-connector-agent": "Anahy.Haro@Betxico.mx",
  "x-support-connector-agent-token": "atena-test-token"
} }, "atena");
assert.deepEqual(valid, { mode: "agent", email: "anahy.haro@betxico.mx" });

assert.equal(authenticateConnectorAgent({ headers: {
  "x-support-connector-agent": "anahy.haro@betxico.mx",
  "x-support-connector-agent-token": "wrong"
} }, "atena"), null);
assert.equal(authenticateConnectorAgent({ headers: {
  "x-support-connector-agent": "anahy.haro@betxico.mx"
} }, "atena"), null);
assert.deepEqual(authenticateConnectorAgent({ headers: {} }, "atena"), { mode: "legacy", email: "" });

console.log("Connector agent authentication: 8 checks passed.");
