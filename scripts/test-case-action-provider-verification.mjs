import assert from "node:assert/strict";
import {
  findJiraIssueComment,
  verifyJiraIssueComment
} from "../lib/jira.js";
import {
  findLiveChatMessage,
  verifyLiveChatMessage
} from "../lib/livechat.js";
import {
  findSlackApprovedMessage,
  verifySlackApprovedMessage
} from "../lib/slack.js";

const originalFetch = globalThis.fetch;
const originalProjectKey = process.env.JIRA_PROJECT_KEY;
const originalLiveChatToken = process.env.LIVECHAT_BASIC_TOKEN;
const originalSlackToken = process.env.SLACK_BOT_TOKEN;
const originalRemoteConfig = process.env.SUPPORT_REMOTE_CONFIG_JSON;
const originalKvUrl = process.env.KV_REST_API_URL;
const originalKvToken = process.env.KV_REST_API_TOKEN;
const originalUpstashUrl = process.env.UPSTASH_REDIS_REST_URL;
const originalUpstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;
const results = [];

process.env.JIRA_PROJECT_KEY = "BTF";
process.env.LIVECHAT_BASIC_TOKEN = "test-token";
process.env.SLACK_BOT_TOKEN = "test-slack-token";
process.env.SUPPORT_REMOTE_CONFIG_JSON = JSON.stringify({
  slackRoutes: [{ id: "retiros", name: "Retiros", mode: "message", channelId: "C-RETIROS" }]
});
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;
delete process.env.UPSTASH_REDIS_REST_URL;
delete process.env.UPSTASH_REDIS_REST_TOKEN;

try {
  await test("Jira verification requires the exact approved comment", async () => {
    globalThis.fetch = async () => jsonResponse({
      id: "comment-101",
      body: atlassianDoc("Evidencia revisada y enviada a validacion.")
    });
    const verified = await verifyJiraIssueComment(
      "BTF-101",
      "comment-101",
      "Evidencia revisada y enviada a validacion.",
      jiraSettings()
    );
    assert.equal(verified, true);

    globalThis.fetch = async () => jsonResponse({
      id: "comment-101",
      body: atlassianDoc("Comentario distinto.")
    });
    const mismatch = await verifyJiraIssueComment(
      "BTF-101",
      "comment-101",
      "Evidencia revisada y enviada a validacion.",
      jiraSettings()
    );
    assert.equal(mismatch, false);
    results.push("jira exact content verification");
  });

  await test("Jira reconciliation locates a recent exact comment", async () => {
    globalThis.fetch = async () => jsonResponse({
      comments: [
        {
          id: "comment-old",
          created: "2026-08-11T11:50:00.000Z",
          body: atlassianDoc("Evidencia revisada.")
        },
        {
          id: "comment-202",
          created: "2026-08-11T12:02:10.000Z",
          body: atlassianDoc("Evidencia revisada.")
        }
      ]
    });
    const found = await findJiraIssueComment({
      issueKey: "BTF-202",
      body: "Evidencia revisada.",
      since: "2026-08-11T12:02:00.000Z",
      accountSettings: jiraSettings()
    });
    assert.deepEqual(found, { id: "comment-202" });
    results.push("jira read-only reconciliation");
  });

  await test("LiveChat verification requires the exact approved agent message", async () => {
    globalThis.fetch = async () => textResponse({
      chat: liveChatWithEvents([
        liveChatEvent({
          id: "event-301",
          text: "Tu retiro continua en revision.",
          authorId: "agent-1"
        })
      ])
    });
    const verified = await verifyLiveChatMessage({
      chatId: "chat-301",
      eventId: "event-301",
      text: "Tu retiro continua en revision.",
      visibility: "all"
    });
    assert.equal(verified, true);

    globalThis.fetch = async () => textResponse({
      chat: liveChatWithEvents([
        liveChatEvent({
          id: "event-301",
          text: "Tu retiro ya fue aprobado.",
          authorId: "agent-1"
        })
      ])
    });
    const mismatch = await verifyLiveChatMessage({
      chatId: "chat-301",
      eventId: "event-301",
      text: "Tu retiro continua en revision.",
      visibility: "all"
    });
    assert.equal(mismatch, false);
    results.push("livechat exact content verification");
  });

  await test("LiveChat reconciliation ignores customer and old messages", async () => {
    globalThis.fetch = async () => textResponse({
      chat: liveChatWithEvents([
        liveChatEvent({
          id: "event-customer",
          text: "Seguimos revisando tu caso.",
          authorId: "customer-1"
        }),
        liveChatEvent({
          id: "event-old",
          text: "Seguimos revisando tu caso.",
          authorId: "agent-1",
          createdAt: "2026-08-11T11:55:00.000Z"
        }),
        liveChatEvent({
          id: "event-402",
          text: "Seguimos revisando tu caso.",
          authorId: "agent-1",
          createdAt: "2026-08-11T12:03:00.000Z"
        })
      ])
    });
    const found = await findLiveChatMessage({
      chatId: "chat-402",
      text: "Seguimos revisando tu caso.",
      visibility: "all",
      since: "2026-08-11T12:02:30.000Z"
    });
    assert.deepEqual(found, { event_id: "event-402" });
    results.push("livechat read-only reconciliation");
  });

  await test("Slack verification requires route, timestamp, and exact text", async () => {
    globalThis.fetch = async (url) => {
      assert.match(String(url), /slack\.com\/api\/conversations\.history$/);
      return jsonResponse({
        ok: true,
        messages: [{ ts: "1786457000.100", text: "Enviar a revision operativa." }]
      });
    };
    const verified = await verifySlackApprovedMessage({
      routeId: "retiros",
      channel: "C-RETIROS",
      ts: "1786457000.100",
      text: "Enviar a revision operativa."
    });
    assert.equal(verified, true);

    globalThis.fetch = async () => jsonResponse({
      ok: true,
      messages: [{ ts: "1786457000.100", text: "Texto diferente." }]
    });
    const mismatch = await verifySlackApprovedMessage({
      routeId: "retiros",
      channel: "C-RETIROS",
      ts: "1786457000.100",
      text: "Enviar a revision operativa."
    });
    assert.equal(mismatch, false);
    results.push("slack exact content verification");
  });

  await test("Slack reconciliation locates a recent exact message", async () => {
    globalThis.fetch = async () => jsonResponse({
      ok: true,
      messages: [
        { ts: "1786456000.100", text: "Mensaje anterior." },
        { ts: "1786457100.200", text: "Enviar a revision operativa." }
      ]
    });
    const found = await findSlackApprovedMessage({
      routeId: "retiros",
      text: "Enviar a revision operativa.",
      since: "2026-08-11T13:00:00.000Z"
    });
    assert.deepEqual(found, { channel: "C-RETIROS", ts: "1786457100.200" });
    results.push("slack read-only reconciliation");
  });
} finally {
  globalThis.fetch = originalFetch;
  restoreEnv("JIRA_PROJECT_KEY", originalProjectKey);
  restoreEnv("LIVECHAT_BASIC_TOKEN", originalLiveChatToken);
  restoreEnv("SLACK_BOT_TOKEN", originalSlackToken);
  restoreEnv("SUPPORT_REMOTE_CONFIG_JSON", originalRemoteConfig);
  restoreEnv("KV_REST_API_URL", originalKvUrl);
  restoreEnv("KV_REST_API_TOKEN", originalKvToken);
  restoreEnv("UPSTASH_REDIS_REST_URL", originalUpstashUrl);
  restoreEnv("UPSTASH_REDIS_REST_TOKEN", originalUpstashToken);
}

console.log(JSON.stringify({ ok: true, tests: results.length, results }, null, 2));

function jiraSettings() {
  return {
    jiraBaseUrl: "https://jira.example.test",
    jiraEmail: "agent@example.test",
    jiraApiToken: "test-token"
  };
}

function atlassianDoc(text) {
  return {
    type: "doc",
    version: 1,
    content: [{ type: "paragraph", content: [{ type: "text", text }] }]
  };
}

function liveChatWithEvents(events) {
  return {
    users: [
      { id: "agent-1", type: "agent" },
      { id: "customer-1", type: "customer" }
    ],
    threads: [{ events }]
  };
}

function liveChatEvent({
  id,
  text,
  authorId,
  createdAt = "2026-08-11T12:03:00.000Z"
}) {
  return {
    id,
    type: "message",
    text,
    author_id: authorId,
    created_at: createdAt,
    visibility: "all"
  };
}

function jsonResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body
  };
}

function textResponse(body, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => JSON.stringify(body)
  };
}

function restoreEnv(name, value) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

async function test(name, fn) {
  try {
    await fn();
  } catch (error) {
    error.message = `${name}: ${error.message}`;
    throw error;
  }
}
