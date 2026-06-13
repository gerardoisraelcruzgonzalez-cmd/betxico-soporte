import { readFileSync } from "node:fs";

const files = [
  "public/index.html",
  "public/app.js",
  "public/admin.html",
  "public/admin.js",
  "api/support-ticket.js",
  "api/admin-config.js",
  "api/support-config.js",
  "api/jira-search.js",
  "api/slack-list-schema.js",
  "api/account-settings.js",
  "api/auth-login.js",
  "api/auth-logout.js",
  "api/livechat-webhook.js",
  "lib/account-store.js",
  "lib/ai-training.js",
  "lib/safe-template-replies.js",
  "lib/remote-config.js",
  "lib/jira.js",
  "lib/slack.js",
  "lib/http.js",
  "lib/audit.js",
  "scripts/deploy-with-env.mjs",
  "scripts/sync-openai-knowledge.mjs",
  "scripts/extract-support10-response-candidates.mjs",
  "scripts/curate-support10-response-candidates.mjs",
  "scripts/integrate-approved-support10-templates.mjs",
  "scripts/mine-livechat-conversation-flows.mjs",
  "scripts/test-support10-template-integration.mjs",
  "scripts/test-auto-safe-templates.mjs",
  "docs/livechat-console-checklist.md",
  "docs/plan-soporte-livechat-app.md",
  "docs/betxico-soporte-knowledge.md",
  "docs/betxico_base_conocimiento_operativa_v1.md",
  "docs/betxico_intents_dataset_v1.json",
  "docs/support-remote-config.example.json"
];

for (const file of files) {
  readFileSync(new URL(`../${file}`, import.meta.url), "utf8");
}

JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
JSON.parse(readFileSync(new URL("../docs/support-remote-config.example.json", import.meta.url), "utf8"));
JSON.parse(readFileSync(new URL("../docs/betxico_intents_dataset_v1.json", import.meta.url), "utf8"));
JSON.parse(readFileSync(new URL("../docs/betxico_fallback_templates_v1.json", import.meta.url), "utf8"));
if (readFileSync(new URL("../tmp/livechat-response-mining/plantillas_aprobadas_soporte10_v1.json", import.meta.url), "utf8")) {
  JSON.parse(readFileSync(new URL("../tmp/livechat-response-mining/plantillas_aprobadas_soporte10_v1.json", import.meta.url), "utf8"));
}

console.log("Scaffold de soporte valido.");
