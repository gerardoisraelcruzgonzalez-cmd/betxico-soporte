import assert from "node:assert/strict";
import { runAtenaQueueTick } from "../lib/atena-connector-scheduler.js";

let lookups = 0;
let completions = 0;

const idle = await runAtenaQueueTick({
  claimJob: async () => ({ ok: true, job: null }),
  lookupJob: async () => {
    lookups += 1;
    throw new Error("idle_lookup_must_not_run");
  },
  completeJob: async () => {
    completions += 1;
  }
});

assert.equal(idle.status, "idle");
assert.equal(lookups, 0, "Atena must not inspect or navigate its browser while the queue is idle");
assert.equal(completions, 0);

let completedPayload;
const completed = await runAtenaQueueTick({
  claimJob: async () => ({ job: { id: "atena-job-1", email: "cliente@example.com" } }),
  lookupJob: async (job) => {
    lookups += 1;
    return { email: job.email };
  },
  completeJob: async (payload) => {
    completedPayload = payload;
  }
});

assert.equal(completed.status, "completed");
assert.equal(lookups, 1);
assert.deepEqual(completedPayload, {
  jobId: "atena-job-1",
  result: { email: "cliente@example.com" },
  error: ""
});

let failedPayload;
const failed = await runAtenaQueueTick({
  claimJob: async () => ({ job: { id: "atena-job-2" } }),
  lookupJob: async () => {
    throw new Error("atena_login_required");
  },
  completeJob: async (payload) => {
    failedPayload = payload;
  }
});

assert.equal(failed.status, "failed");
assert.equal(failed.error, "atena_login_required");
assert.deepEqual(failedPayload, {
  jobId: "atena-job-2",
  result: undefined,
  error: "atena_login_required"
});

console.log("Atena on-demand scheduler contracts passed.");
