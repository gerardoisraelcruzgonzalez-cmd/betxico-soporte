import assert from "node:assert/strict";
import { getAccount } from "../lib/account-store.js";

const previous = {
  mode: process.env.SUPPORT_TEST_MODE,
  email: process.env.SUPPORT_TEST_LOGIN_EMAIL,
  pin: process.env.SUPPORT_TEST_LOGIN_PIN,
  name: process.env.SUPPORT_TEST_LOGIN_NAME,
  kvUrl: process.env.KV_REST_API_URL,
  kvToken: process.env.KV_REST_API_TOKEN
};

process.env.SUPPORT_TEST_MODE = "true";
process.env.SUPPORT_TEST_LOGIN_EMAIL = "prueba@betxico.mx";
process.env.SUPPORT_TEST_LOGIN_PIN = "12345678";
process.env.SUPPORT_TEST_LOGIN_NAME = "Prueba aislada";
delete process.env.KV_REST_API_URL;
delete process.env.KV_REST_API_TOKEN;

const account = await getAccount("PRUEBA@BETXICO.MX");
assert.equal(account.email, "prueba@betxico.mx");
assert.equal(account.displayName, "Prueba aislada");
assert.ok(account.pin.includes("."));
assert.equal(await getAccount("otra@betxico.mx"), null);

for (const [key, value] of Object.entries({
  SUPPORT_TEST_MODE: previous.mode,
  SUPPORT_TEST_LOGIN_EMAIL: previous.email,
  SUPPORT_TEST_LOGIN_PIN: previous.pin,
  SUPPORT_TEST_LOGIN_NAME: previous.name,
  KV_REST_API_URL: previous.kvUrl,
  KV_REST_API_TOKEN: previous.kvToken
})) {
  if (value === undefined) delete process.env[key];
  else process.env[key] = value;
}

console.log("Cuenta bootstrap de prueba: 4 pruebas correctas.");
