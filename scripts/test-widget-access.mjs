import assert from "node:assert/strict";
import { isSameOriginBrowserRequest, requireWidgetAccess } from "../lib/http.js";

const previousNodeEnv = process.env.NODE_ENV;
const previousAllow = process.env.ALLOW_UNAUTHENTICATED_WIDGET;
const previousKey = process.env.INTERNAL_API_KEY;
process.env.NODE_ENV = "production";
process.env.ALLOW_UNAUTHENTICATED_WIDGET = "true";
process.env.INTERNAL_API_KEY = "internal-test";

try {
  const sameOrigin = { headers: { host: "support.example.com", origin: "https://support.example.com" } };
  assert.equal(isSameOriginBrowserRequest(sameOrigin), true);
  assert.doesNotThrow(() => requireWidgetAccess(sameOrigin));

  assert.throws(
    () => requireWidgetAccess({ headers: { host: "support.example.com", origin: "https://attacker.example" } }),
    (error) => error.message === "unauthenticated_widget_call" && error.statusCode === 401
  );

  assert.doesNotThrow(() => requireWidgetAccess({
    headers: { host: "support.example.com", "x-internal-api-key": "internal-test" }
  }));
  assert.doesNotThrow(() => requireWidgetAccess({
    headers: { host: "support.example.com", authorization: `Bearer btq_${"a".repeat(40)}` }
  }));
} finally {
  if (previousNodeEnv === undefined) delete process.env.NODE_ENV;
  else process.env.NODE_ENV = previousNodeEnv;
  if (previousAllow === undefined) delete process.env.ALLOW_UNAUTHENTICATED_WIDGET;
  else process.env.ALLOW_UNAUTHENTICATED_WIDGET = previousAllow;
  if (previousKey === undefined) delete process.env.INTERNAL_API_KEY;
  else process.env.INTERNAL_API_KEY = previousKey;
}

console.log("Widget access: 5 pruebas correctas.");
