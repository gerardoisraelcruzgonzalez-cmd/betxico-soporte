import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  console.log("Usage: npm run deploy:env -- [env-file]");
  console.log("       npm run deploy:env:prod -- [env-file]");
  console.log("");
  console.log("Default env file: .env.vercel.local");
  process.exit(0);
}

const positional = process.argv.slice(2).find((arg) => !arg.startsWith("-"));
const envFile = resolve(positional || ".env.vercel.local");
const target = process.argv.includes("--prod") ? "--prod" : null;

const required = [
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
const missing = required.filter((key) => !String(env[key] || "").trim());

if (missing.length) {
  console.error(`Missing required values: ${missing.join(", ")}`);
  process.exit(1);
}

const args = ["--yes", "vercel@latest", "deploy", "-y", "--force"];
if (target) {
  args.push(target);
}

for (const [key, value] of Object.entries(env)) {
  if (String(value).trim()) {
    args.push("-e", `${key}=${value}`);
  }
}

console.log(`Deploying to Vercel with ${Object.keys(env).length} environment values.`);
console.log("Secret values are not printed.");

const result = spawnSync("npx", args, {
  stdio: "inherit",
  env: process.env
});

process.exit(result.status ?? 1);

function parseEnv(input) {
  const output = {};

  for (const rawLine of input.split(/\r?\n/)) {
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
