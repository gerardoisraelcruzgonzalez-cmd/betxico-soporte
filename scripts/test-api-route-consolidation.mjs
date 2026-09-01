import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import authHandler from "../api/auth.js";
import jiraHandler from "../api/jira.js";

const authLogin = await call(authHandler, { method: "GET", query: { action: "login" } });
assert.equal(authLogin.statusCode, 405);
assert.equal(authLogin.body.error, "method_not_allowed");

const authLogout = await call(authHandler, { method: "POST", query: { action: "logout" } });
assert.equal(authLogout.statusCode, 200);
assert.equal(authLogout.body.ok, true);
assert.match(String(authLogout.headers["set-cookie"] || ""), /Max-Age=0/);

const jiraMetadata = await call(jiraHandler, { method: "POST", query: { action: "metadata" } });
assert.equal(jiraMetadata.statusCode, 405);

const jiraSearch = await call(jiraHandler, { method: "DELETE", query: { action: "search" } });
assert.equal(jiraSearch.statusCode, 405);

const unknown = await call(jiraHandler, { method: "GET", query: { action: "unknown" } });
assert.equal(unknown.statusCode, 404);
assert.equal(unknown.body.error, "jira_action_not_found");

const vercelConfig = JSON.parse(readFileSync(new URL("../vercel.json", import.meta.url), "utf8"));
assert.deepEqual(
  Object.fromEntries(vercelConfig.rewrites.map(({ source, destination }) => [source, destination])),
  {
    "/api/auth-login": "/api/auth?action=login",
    "/api/auth-logout": "/api/auth?action=logout",
    "/api/jira-metadata": "/api/jira?action=metadata",
    "/api/jira-search": "/api/jira?action=search"
  }
);

const functionCount = readdirSync(new URL("../api", import.meta.url))
  .filter((name) => name.endsWith(".js"))
  .length;
assert.equal(functionCount, 14);

console.log("Rutas API consolidadas: 7 pruebas correctas.");

async function call(handler, req) {
  const result = { headers: {} };
  const res = {
    statusCode: 200,
    setHeader(name, value) {
      result.headers[String(name).toLowerCase()] = value;
    },
    status(code) {
      result.statusCode = code;
      return this;
    },
    json(body) {
      result.body = body;
      return this;
    },
    end(body) {
      if (body) result.body = JSON.parse(body);
      return this;
    }
  };

  await handler({ headers: {}, ...req }, res);
  result.statusCode = res.statusCode;
  return result;
}
