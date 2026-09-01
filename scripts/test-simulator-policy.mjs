import assert from "node:assert/strict";
import {
  SIMULATOR_CONFIRMATION,
  isSimulatorKnowledgeEnabled,
  requireSimulatorRealAction,
  requireSimulatorSameOrigin,
  requireSupportSimulatorAccess,
  simulatorActionMarker
} from "../lib/simulator-policy.js";

const results = [];
const caseRecord = {
  source: { type: "support_simulator", synthetic: true }
};

test("allows only the configured admin into the simulator", () => {
  const env = {
    SUPPORT_SIMULATOR_ENABLED: "true",
    SUPPORT_SIMULATOR_ALLOWED_EMAILS: "gerardo.cruz@betxico.mx"
  };
  assert.doesNotThrow(() => requireSupportSimulatorAccess(
    { email: "gerardo.cruz@betxico.mx" },
    { env, isAdmin: true }
  ));
  assert.throws(
    () => requireSupportSimulatorAccess({ email: "agente@betxico.mx" }, { env, isAdmin: true }),
    /support_simulator_not_authorized/
  );
  assert.throws(
    () => requireSupportSimulatorAccess({ email: "gerardo.cruz@betxico.mx" }, { env, isAdmin: false }),
    /support_simulator_not_authorized/
  );
});

test("fails closed when the simulator flag is missing", () => {
  assert.throws(
    () => requireSupportSimulatorAccess({ email: "gerardo.cruz@betxico.mx" }, { env: {}, isAdmin: true }),
    /support_simulator_disabled/
  );
});

test("enables manual knowledge only through its explicit simulator flag", () => {
  assert.equal(isSimulatorKnowledgeEnabled({ SUPPORT_SIMULATOR_KNOWLEDGE_ENABLED: "true" }), true);
  assert.equal(isSimulatorKnowledgeEnabled({
    VERCEL_ENV: "preview",
    SUPPORT_SIMULATOR_KNOWLEDGE_ENABLED: "true"
  }), true);
  assert.equal(isSimulatorKnowledgeEnabled({
    VERCEL_ENV: "production",
    SUPPORT_SIMULATOR_KNOWLEDGE_ENABLED: "true"
  }), false);
  assert.equal(isSimulatorKnowledgeEnabled({ SUPPORT_SIMULATOR_KNOWLEDGE_ENABLED: "false" }), false);
  assert.equal(isSimulatorKnowledgeEnabled({}), false);
});

test("accepts only browser requests from the same origin", () => {
  assert.equal(requireSimulatorSameOrigin({
    headers: { host: "preview.example.test", origin: "https://preview.example.test" }
  }), true);
  assert.equal(requireSimulatorSameOrigin({
    headers: {
      host: "internal.vercel.test",
      "x-forwarded-host": "preview.example.test",
      origin: "https://preview.example.test"
    }
  }), true);
  assert.throws(
    () => requireSimulatorSameOrigin({
      headers: { host: "preview.example.test", origin: "https://attacker.example" }
    }),
    /simulator_same_origin_required/
  );
  assert.throws(
    () => requireSimulatorSameOrigin({ headers: { host: "preview.example.test" } }),
    /simulator_same_origin_required/
  );
});

test("requires explicit real-action enablement, confirmation, and allowlisted target", () => {
  const base = {
    caseRecord,
    confirmation: SIMULATOR_CONFIRMATION,
    env: {
      SUPPORT_SIMULATOR_REAL_ACTIONS_ENABLED: "true",
      SUPPORT_SIMULATOR_JIRA_KEYS: "BTF-TEST-1 BTF-900",
      SUPPORT_SIMULATOR_SLACK_ROUTES: "simulador-pruebas"
    }
  };
  assert.deepEqual(requireSimulatorRealAction({
    ...base,
    proposal: { actionType: "jira.comment", payload: { issueKey: "BTF-900" } }
  }), { actionType: "jira.comment", target: "BTF-900" });
  assert.deepEqual(requireSimulatorRealAction({
    ...base,
    proposal: { actionType: "slack.notify", payload: { routeId: "simulador-pruebas" } }
  }), { actionType: "slack.notify", target: "simulador-pruebas" });
  assert.throws(
    () => requireSimulatorRealAction({
      ...base,
      confirmation: "si",
      proposal: { actionType: "jira.comment", payload: { issueKey: "BTF-900" } }
    }),
    /simulator_confirmation_required/
  );
  assert.throws(
    () => requireSimulatorRealAction({
      ...base,
      proposal: { actionType: "slack.notify", payload: { routeId: "retiros" } }
    }),
    /simulator_slack_target_not_allowed/
  );
});

test("marks every real simulator write as non-operational", () => {
  assert.match(simulatorActionMarker("simulator:case-1"), /^\[SIMULADOR CONTROLADO/);
  assert.match(simulatorActionMarker("simulator:case-1"), /NO OPERAR\]$/);
});

console.log(JSON.stringify({ ok: true, tests: results.length, results }, null, 2));

function test(name, fn) {
  fn();
  results.push(name);
}
