import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: npm run deploy:env -- [env-file]");
  console.log("       npm run deploy:env -- --enable-slack-sync [env-file]");
  console.log("       npm run deploy:env:prod -- [env-file]");
  console.log("");
  console.log("Default env file: .env.vercel.local");
  process.exit(0);
}

const positional = process.argv.slice(2).find((arg) => !arg.startsWith("-"));
const envFile = resolve(positional || ".env.vercel.local");
const target = process.argv.includes("--prod") ? "--prod" : null;
const enableSlackSync = !target && process.argv.includes("--enable-slack-sync");

const productionRequired = [
  "JIRA_BASE_URL",
  "JIRA_EMAIL",
  "JIRA_API_TOKEN",
  "JIRA_PROJECT_KEY",
  "JIRA_ISSUE_TYPE",
  "ALLOW_UNAUTHENTICATED_WIDGET"
];

if (!existsSync(envFile)) {
  console.error(`Missing env file: ${envFile}`);
  console.error("Copy .env.vercel.example to .env.vercel.local and fill the values.");
  process.exit(1);
}

const env = parseEnv(readFileSync(envFile, "utf8"));
const cliEnv = {
  ...process.env,
  ...(usableValue(env.VERCEL_OIDC_TOKEN) ? { VERCEL_OIDC_TOKEN: env.VERCEL_OIDC_TOKEN } : {})
};
const ignoredDeploymentEnv = new Set([
  "VERCEL",
  "VERCEL_ENV",
  "VERCEL_TARGET_ENV",
  "VERCEL_OIDC_TOKEN",
  "NX_DAEMON",
  "TURBO_CACHE",
  "TURBO_FORCE",
  "TURBO_REMOTE_ONLY",
  "TURBO_RUN_SUMMARY"
]);
for (const key of ignoredDeploymentEnv) {
  delete env[key];
}
if (!target) {
  const hasSimulatorActionTarget = Boolean(
    usableValue(env.SUPPORT_SIMULATOR_JIRA_KEYS)
    || usableValue(env.SUPPORT_SIMULATOR_SLACK_ROUTES)
  );
  const simulatorRealActionsEnabled = env.SUPPORT_SIMULATOR_REAL_ACTIONS_ENABLED === "true"
    && hasSimulatorActionTarget;
  Object.assign(env, {
    ALLOW_UNAUTHENTICATED_WIDGET: "false",
    JIRA_BASE_URL: usableValue(env.JIRA_BASE_URL) || "https://betxico.atlassian.net",
    JIRA_ISSUE_TYPE: usableValue(env.JIRA_ISSUE_TYPE) || "Servicio al Cliente",
    JIRA_PROJECT_KEY: usableValue(env.JIRA_PROJECT_KEY) || "BTF",
    SUPPORT_AGENT_MODE: "suggest",
    SUPPORT_LEGACY_AUTO_SAFE_SEND_ENABLED: "false",
    SUPPORT_SLACK_LIST_READS_ENABLED: "false",
    SUPPORT_SLACK_LIST_SYNC_ENABLED: enableSlackSync ? "true" : "false",
    SUPPORT_SIMULATOR_ENABLED: "true",
    SUPPORT_SIMULATOR_KNOWLEDGE_ENABLED: "true",
    SUPPORT_SIMULATOR_ALLOWED_EMAILS: usableValue(env.SUPPORT_SIMULATOR_ALLOWED_EMAILS)
      || "gerardo.cruz@betxico.mx",
    SUPPORT_SIMULATOR_REAL_ACTIONS_ENABLED: simulatorRealActionsEnabled ? "true" : "false"
  });
}
const missing = (target ? productionRequired : []).filter((key) => !usableValue(env[key]));

if (missing.length) {
  console.error(`Missing required values: ${missing.join(", ")}`);
  process.exit(1);
}

const args = ["--yes", "vercel@latest", "deploy", "-y", "--force"];
if (target) {
  args.push(target);
}

for (const [key, value] of Object.entries(env)) {
  if (usableValue(value)) {
    args.push("-e", `${key}=${value}`);
  }
}

console.log(`Deploying to Vercel with ${Object.keys(env).length} environment values.`);
console.log("Secret values are not printed.");
if (!target) {
  console.log(`Preview safety: suggest-only, authenticated widget, Slack reads off, Slack sync ${enableSlackSync ? "temporarily enabled" : "off"}, legacy sends off.`);
  console.log(`Private simulator: enabled; real writes ${env.SUPPORT_SIMULATOR_REAL_ACTIONS_ENABLED === "true" ? "allowlisted" : "off"}.`);
}

const result = spawnSync("npx", args, {
  stdio: "inherit",
  env: cliEnv
});

process.exit(result.status ?? 1);

function parseEnv(input) {
  const output = {};

  for (const rawLine of input.split(/\r\n?|\n|\u2028|\u2029/u)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) {
      continue;
    }

    const equalsIndex = line.indexOf("=");
    if (equalsIndex === -1) {
      continue;
    }

    const key = line.slice(0, equalsIndex).trim();
    let value = line.slice(equalsIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    output[key] = value;
  }

  return output;
}

function usableValue(value) {
  const clean = String(value || "").trim();
  return clean && !/^\[?redacted\]?$/i.test(clean) ? clean : "";
}
