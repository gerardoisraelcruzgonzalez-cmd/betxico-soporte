import assert from "node:assert/strict";
import { runKycQueueTick } from "../lib/kyc-connector-scheduler.js";

let idleLookups = 0;
let idleCompletions = 0;
const idle = await runKycQueueTick({
  claimJob: async () => ({ job: null }),
  lookupJob: async () => { idleLookups += 1; },
  completeJob: async () => { idleCompletions += 1; }
});
assert.deepEqual(idle, { status: "idle" });
assert.equal(idleLookups, 0, "KYC must not be contacted while the queue is idle");
assert.equal(idleCompletions, 0);

let requestedLookups = 0;
let completedPayload;
const completed = await runKycQueueTick({
  claimJob: async () => ({ job: { id: "job-1", email: "client@example.test" } }),
  lookupJob: async () => { requestedLookups += 1; return { sources: {} }; },
  completeJob: async (payload) => { completedPayload = payload; }
});
assert.equal(requestedLookups, 1);
assert.equal(completed.status, "completed");
assert.equal(completedPayload.jobId, "job-1");
assert.deepEqual(completedPayload.result, { sources: {} });
assert.equal(completedPayload.error, "");

let failedPayload;
const failed = await runKycQueueTick({
  claimJob: async () => ({ job: { id: "job-2" } }),
  lookupJob: async () => { throw new Error("kyc_login_required"); },
  completeJob: async (payload) => { failedPayload = payload; }
});
assert.equal(failed.status, "failed");
assert.equal(failedPayload.error, "kyc_login_required");

console.log("KYC on-demand scheduler contracts passed.");
