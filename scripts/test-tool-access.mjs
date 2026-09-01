import assert from "node:assert/strict";
import { ACCESS_GROUPS, accessGroupCapabilities, normalizeAccessGroup } from "../lib/tool-access.js";

assert.equal(normalizeAccessGroup("operations"), ACCESS_GROUPS.OPERATIONS);
assert.equal(normalizeAccessGroup("unknown"), ACCESS_GROUPS.BASIC);
assert.deepEqual(accessGroupCapabilities("basic"), { atena: false, kyc: false, bob: false, ai: false });
assert.deepEqual(accessGroupCapabilities("ai"), { atena: false, kyc: false, bob: false, ai: true });
assert.deepEqual(accessGroupCapabilities("operations"), { atena: true, kyc: true, bob: true, ai: false });
console.log("Tool access groups: 5 pruebas correctas.");
