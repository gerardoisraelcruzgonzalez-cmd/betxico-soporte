import assert from "node:assert/strict";
import { runBobQueueTick } from "../lib/bob-connector-scheduler.js";

let completed;
const done = await runBobQueueTick({
  claimJob: async () => ({ job: { id: "job-1", customerId: "397321" } }),
  closeSessions: async (job) => ({ customerId: job.customerId, closedCount: 2, verifiedPendingCount: 0, method: "bob_ui_playwright" }),
  completeJob: async (payload) => { completed = payload; }
});
assert.deepEqual(done, { status: "completed", jobId: "job-1" });
assert.equal(completed.result.closedCount, 2);
assert.equal(completed.error, "");

let retry;
let failed;
const retryWaiting = await runBobQueueTick({
  claimJob: async () => ({ job: { id: "job-2", customerId: "397321" } }),
  closeSessions: async () => { throw new Error("bob_login_required"); },
  scheduleRetry: async (payload) => { retry = payload; },
  completeJob: async (payload) => { failed = payload; }
});
assert.deepEqual(retryWaiting, { status: "retry_waiting", jobId: "job-2", error: "bob_login_required" });
assert.deepEqual(retry, { jobId: "job-2", error: "bob_login_required" });
assert.equal(failed, undefined);

const failure = await runBobQueueTick({
  claimJob: async () => ({ job: { id: "job-3", customerId: "397321" } }),
  closeSessions: async () => { throw new Error("bob_pending_limit_exceeded_151"); },
  scheduleRetry: async () => { throw new Error("must_not_retry"); },
  completeJob: async (payload) => { failed = payload; }
});
assert.equal(failure.status, "failed");
assert.equal(failed.error, "bob_pending_limit_exceeded_151");
assert.deepEqual(await runBobQueueTick({ claimJob: async () => ({ job: null }) }), { status: "idle" });
console.log("BoB connector scheduler: 4 pruebas correctas");
