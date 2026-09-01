import assert from "node:assert/strict";
import {
  assertLoginAllowed,
  clearLoginFailures,
  loginAttemptKey,
  recordLoginFailure
} from "../lib/login-rate-limit.js";

const data = new Map();
const request = async ([command, key]) => {
  if (command === "GET") return { result: data.get(key) || null };
  if (command === "INCR") {
    const next = Number(data.get(key) || 0) + 1;
    data.set(key, next);
    return { result: next };
  }
  if (command === "DEL") {
    data.delete(key);
    return { result: 1 };
  }
  if (command === "EXPIRE") return { result: 1 };
  throw new Error("unexpected_command");
};
const req = { headers: { "x-forwarded-for": "203.0.113.20, 10.0.0.1" } };
const email = "agente@betxico.mx";

assert.equal(loginAttemptKey(req, email), loginAttemptKey(req, email.toUpperCase()));
for (let index = 0; index < 5; index += 1) {
  await assertLoginAllowed(req, email, { request });
  await recordLoginFailure(req, email, { request });
}
await assert.rejects(
  () => assertLoginAllowed(req, email, { request }),
  (error) => error.message === "login_rate_limited" && error.statusCode === 429
);
await clearLoginFailures(req, email, { request });
assert.equal((await assertLoginAllowed(req, email, { request })).failures, 0);

console.log("Login rate limit: 4 pruebas correctas.");
