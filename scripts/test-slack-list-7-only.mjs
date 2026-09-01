import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const LIST_8_ID = "F0BS8SERTNE";
const OTHER_LIST_IDS = ["F0BFNBURC21", "F0B1Z5R527P"];

process.env.SUPPORT_REMOTE_CONFIG_JSON = JSON.stringify({
  listPanels: [
    { id: "revision-6", label: "Lista 6", listId: "F0BFNBURC21", enabled: true },
    { id: "revision", label: "Lista 8 configurada", listId: LIST_8_ID, limit: 12, enabled: true },
    { id: "revision-5", label: "Lista 5", listId: "F0AUUV7CSNA", enabled: true }
  ]
});

const remoteConfig = await import("../lib/remote-config.js");
const slack = await import("../lib/slack.js");

await test("normaliza Lista 8 activa y Lista 7 historica con TTL independiente", async () => {
  delete process.env.KV_REST_API_URL;
  delete process.env.KV_REST_API_TOKEN;
  delete process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_TOKEN;
  const config = await remoteConfig.getSupportConfig();
  assert.deepEqual(config.listPanels.map(({ id, listId }) => ({ id, listId })), [
    { id: "revision", listId: LIST_8_ID },
    { id: "revision-7", listId: "F0BNV1FR02J" }
  ]);
  assert.equal(config.listPanels[0].label, "Lista 8 configurada");
  assert.equal(config.listPanels[0].limit, 12);
  assert.equal(config.listPanels[0].cacheTtlSeconds, 300);
  assert.equal(config.listPanels[1].cacheTtlSeconds, 86400);
});

await test("las consultas del panel leen cache y nunca llaman la API de Slack", async () => {
  process.env.KV_REST_API_URL = "https://kv.example.test";
  process.env.KV_REST_API_TOKEN = "test-token";
  delete process.env.SLACK_BOT_TOKEN;
  let slackCalls = 0;
  globalThis.fetch = async (url, init = {}) => {
    if (String(url).startsWith("https://slack.com/")) {
      slackCalls += 1;
      throw new Error("unexpected_slack_call");
    }
    const [command] = JSON.parse(init.body);
    if (command[0] === "GET" && command[1] === "support:config") return jsonResponse([{ result: null }]);
    if (command[0] === "GET" && command[1] === "support:slack-panel-cache:revision") {
      return jsonResponse([{ result: JSON.stringify({
        updatedAt: new Date().toISOString(),
        complete: true,
        scannedCount: 1,
        items: [{ id: "row-7", email: "cliente@example.com", authId: "7007", withdrawalStatus: "RETENIDO" }]
      }) }]);
    }
    throw new Error(`unexpected_kv_command:${JSON.stringify(command)}`);
  };

  const result = await slack.getSlackListPanelItems("revision", { email: "cliente@example.com" });
  assert.equal(slackCalls, 0);
  assert.equal(result.panel.listId, LIST_8_ID);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0].id, "row-7");
});

await test("la sincronizacion usa Lista 8 una vez y no reintenta un 429", async () => {
  process.env.SLACK_BOT_TOKEN = "xoxb-test";
  process.env.SUPPORT_SLACK_SYNC_COOLDOWN_SECONDS = "300";
  let slackCalls = 0;
  let cooldownTtl = 0;
  globalThis.fetch = async (url, init = {}) => {
    if (String(url).startsWith("https://slack.com/")) {
      slackCalls += 1;
      const body = new URLSearchParams(init.body);
      assert.equal(body.get("list_id"), LIST_8_ID);
      return jsonResponse({ ok: false, error: "ratelimited" }, 429, { "retry-after": "17" });
    }

    const [command] = JSON.parse(init.body);
    if (command[0] === "GET") return jsonResponse([{ result: null }]);
    if (command[0] === "SET" && String(command[1]).includes("sync-lock")) {
      return jsonResponse([{ result: "OK" }]);
    }
    if (command[0] === "SET" && String(command[1]).includes("sync-cooldown")) {
      cooldownTtl = Number(command[4]);
      return jsonResponse([{ result: "OK" }]);
    }
    if (command[0] === "DEL") return jsonResponse([{ result: 1 }]);
    throw new Error(`unexpected_kv_command:${JSON.stringify(command)}`);
  };

  await assert.rejects(
    () => slack.syncSlackListPanelCache("revision"),
    (error) => error.message === "ratelimited"
      && error.statusCode === 429
      && error.details.retryAfterSeconds === 17
  );
  assert.equal(slackCalls, 1);
  assert.equal(cooldownTtl, 17);
});

await test("un 429 al hidratar una fila detiene la sincronizacion", async () => {
  let slackCalls = 0;
  globalThis.fetch = async (url, init = {}) => {
    if (String(url).startsWith("https://slack.com/")) {
      slackCalls += 1;
      const body = new URLSearchParams(init.body);
      assert.equal(body.get("list_id"), LIST_8_ID);
      if (slackCalls === 1) {
        return jsonResponse({ ok: true, items: [{ id: "row-needs-info" }] });
      }
      return jsonResponse({ ok: false, error: "ratelimited" }, 429, { "retry-after": "9" });
    }

    const [command] = JSON.parse(init.body);
    if (command[0] === "GET") return jsonResponse([{ result: null }]);
    if (command[0] === "SET" && String(command[1]).includes("sync-lock")) {
      return jsonResponse([{ result: "OK" }]);
    }
    if (command[0] === "SET" && String(command[1]).includes("sync-cooldown")) {
      return jsonResponse([{ result: "OK" }]);
    }
    if (command[0] === "DEL") return jsonResponse([{ result: 1 }]);
    throw new Error(`unexpected_kv_command:${JSON.stringify(command)}`);
  };

  await assert.rejects(
    () => slack.syncSlackListPanelCache("revision"),
    (error) => error.message === "ratelimited" && error.details.retryAfterSeconds === 9
  );
  assert.equal(slackCalls, 2);
});

await test("los archivos del alcance conservan solo Lista 8 activa y Lista 7 historica", async () => {
  for (const file of ["../lib/remote-config.js", "../lib/slack.js", "../api/slack-list-schema.js"]) {
    const source = readFileSync(new URL(file, import.meta.url), "utf8");
    for (const oldListId of OTHER_LIST_IDS) assert.equal(source.includes(oldListId), false, `${file} contiene ${oldListId}`);
  }
});

console.log(JSON.stringify({ ok: true, scope: "Slack Lista 8", tests: 5 }, null, 2));

async function test(name, fn) {
  try {
    await fn();
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  }
}

function jsonResponse(payload, status = 200, headers = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => headers[String(name).toLowerCase()] || null },
    json: async () => payload
  };
}
