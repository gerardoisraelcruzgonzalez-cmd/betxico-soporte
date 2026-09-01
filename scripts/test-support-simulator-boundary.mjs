import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const apiSource = readFileSync(new URL("../api/support-simulator.js", import.meta.url), "utf8");

assert.doesNotMatch(apiSource, /from\s+["']\.\.\/lib\/livechat\.js["']/u);
assert.doesNotMatch(apiSource, /sendLiveChat|livechat\.send_message/u);
assert.match(apiSource, /getSupportSimulatorCase/u);
assert.match(apiSource, /updateSupportSimulatorCase/u);
assert.match(apiSource, /support:simulator-action:v1:/u);
assert.match(apiSource, /requireSimulatorSameOrigin\(req\)/u);
assert.match(apiSource, /authenticateAccount\(account\.email, payload\.pin\)/u);
assert.match(apiSource, /isSimulatorKnowledgeEnabled\(\)/u);
assert.match(apiSource, /lookupCaseKnowledge\(\{ caseRecord: supportCase \}\)/u);

const productionApiSource = readFileSync(new URL("../api/support-ticket.js", import.meta.url), "utf8");
assert.doesNotMatch(productionApiSource, /case-knowledge\.js|lookupCaseKnowledge/u);

console.log(JSON.stringify({
  ok: true,
  checks: [
    "no LiveChat write dependency",
    "isolated simulator case store",
    "isolated simulator action store",
    "same-origin browser boundary",
    "PIN reauthentication before real writes",
    "manual knowledge is simulator-only"
  ]
}, null, 2));
