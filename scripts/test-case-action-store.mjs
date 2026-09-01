import assert from "node:assert/strict";
import {
  caseActionRecordKey,
  createCaseActionStore,
  createUpstashCaseActionKvAdapter
} from "../lib/case-action-store.js";

const tests = [];

test("persists a sanitized proposal and keeps one idempotency key", async () => {
  const clock = createClock("2026-08-11T18:00:00.000Z");
  const kv = createMemoryKv(clock);
  const store = createStore(kv, clock);
  const proposalInput = proposal({
    payload: {
      issueKey: "SUP-100",
      message: "Seguimiento pin=4312 para 002010077777777771",
      authorization: "Bearer private",
      nested: { apiToken: "private", safe: "ok" },
      fileData: "base64-payload"
    }
  });
  const record = await store.propose(proposalInput);

  assert.equal(record.status, "proposed");
  assert.equal(record.idempotencyKey, "case-action:proposal_store_1");
  assert.equal(record.proposal.payload.authorization, undefined);
  assert.equal(record.proposal.payload.fileData, undefined);
  assert.equal(record.proposal.payload.nested.apiToken, undefined);
  assert.equal(record.proposal.payload.nested.safe, "ok");
  assert.match(record.proposal.payload.message, /\[CREDENTIAL_REDACTED\]/u);
  assert.match(record.proposal.payload.message, /\[CLABE_REDACTED\]/u);
  assert.doesNotMatch(JSON.stringify(record), /4312|private|base64-payload|002010077777777771/u);

  const duplicate = await store.propose(proposalInput);
  assert.deepEqual(duplicate, await store.get("proposal_store_1"));
  const retryWithNewClock = await store.propose({
    ...proposalInput,
    proposedAt: "2026-08-11T18:00:05.000Z",
    expiresAt: "2026-08-11T19:00:05.000Z"
  });
  assert.deepEqual(retryWithNewClock, duplicate);
  assert.equal(await kv.ttlSeconds(caseActionRecordKey("proposal_store_1")), 120);
  assert.equal((await store.getLatestByChat("chat-100")).proposalId, "proposal_store_1");
});

test("approval is consumed once under concurrent execution claims", async () => {
  const clock = createClock("2026-08-11T18:10:00.000Z");
  const kv = createMemoryKv(clock, { latencyMs: 3 });
  const store = createStore(kv, clock);
  await store.propose(proposal());
  const approved = await store.approve("proposal_store_1", approval());
  assert.equal(approved.status, "approved");
  assert.equal(approved.approval.chatId, "chat-100");
  assert.equal(approved.approval.caseRevision, 3);
  assert.equal(approved.approval.actionType, "jira.comment");

  const attempts = await Promise.allSettled([
    store.claimExecution("proposal_store_1", {
      idempotencyKey: approved.idempotencyKey,
      executionId: "execution_a",
      executingBy: { email: "agent-a@betxico.mx", token: "remove-me" }
    }),
    store.claimExecution("proposal_store_1", {
      idempotencyKey: approved.idempotencyKey,
      executionId: "execution_b",
      executingBy: { email: "agent-b@betxico.mx" }
    })
  ]);

  const fulfilled = attempts.filter((item) => item.status === "fulfilled");
  const rejected = attempts.filter((item) => item.status === "rejected");
  assert.equal(fulfilled.length, 1);
  assert.equal(rejected.length, 1);
  assert.equal(rejected[0].reason.code, "case_action_approval_consumed");

  const executing = await store.get("proposal_store_1");
  assert.equal(executing.status, "executing");
  assert.ok(executing.approval.consumedAt);
  assert.equal(executing.execution.idempotencyKey, executing.idempotencyKey);
  assert.equal(executing.approval.consumedBy.token, undefined);
});

test("does not allow approval reuse after failed or verified execution", async () => {
  for (const finalStatus of ["failed", "verified"]) {
    const clock = createClock("2026-08-11T18:20:00.000Z");
    const store = createStore(createMemoryKv(clock), clock);
    const input = proposal({ proposalId: `proposal_${finalStatus}` });
    await store.propose(input);
    await store.approve(input.proposalId, approval({ approvalId: `approval_${finalStatus}` }));
    const executing = await store.claimExecution(input.proposalId, {
      executionId: `execution_${finalStatus}`
    });
    const completed = await store.completeExecution(input.proposalId, {
      status: finalStatus,
      idempotencyKey: executing.idempotencyKey,
      result: { providerReference: "SUP-101", accessToken: "remove-me" },
      error: finalStatus === "failed" ? { code: "provider_unavailable" } : null
    });

    assert.equal(completed.status, finalStatus);
    assert.equal(completed.idempotencyKey, executing.idempotencyKey);
    assert.equal(completed.execution.idempotencyKey, executing.idempotencyKey);
    assert.equal(completed.execution.result.accessToken, undefined);
    await assert.rejects(
      () => store.claimExecution(input.proposalId),
      (error) => error.code === "case_action_approval_consumed" && error.statusCode === 409
    );
  }
});

test("expires proposals, approvals, and retained records", async () => {
  const clock = createClock("2026-08-11T18:30:00.000Z");
  const kv = createMemoryKv(clock);
  const store = createCaseActionStore({
    kv,
    now: clock.now,
    retentionSeconds: 20,
    approvalTtlSeconds: 5,
    lockRetryMs: 1
  });

  await store.propose(proposal({
    proposalId: "proposal_expired_before_approval",
    proposedAt: "2026-08-11T18:30:00.000Z",
    expiresAt: "2026-08-11T18:30:05.000Z"
  }));
  clock.advance(6000);
  await assert.rejects(
    () => store.approve("proposal_expired_before_approval", approval()),
    (error) => error.code === "case_action_proposal_expired"
  );

  await store.propose(proposal({
    proposalId: "proposal_expired_after_approval",
    expiresAt: "2026-08-11T18:30:16.000Z"
  }));
  await store.approve("proposal_expired_after_approval", approval({
    expiresAt: "2026-08-11T18:30:11.000Z"
  }));
  clock.advance(6000);
  await assert.rejects(
    () => store.claimExecution("proposal_expired_after_approval"),
    (error) => error.code === "case_action_approval_expired"
  );

  clock.advance(15000);
  assert.equal(await store.get("proposal_expired_after_approval"), null);
});

test("supports verification pending and rejects invalid transitions", async () => {
  const clock = createClock("2026-08-11T18:40:00.000Z");
  const store = createStore(createMemoryKv(clock), clock);
  await store.propose(proposal());
  await store.approve("proposal_store_1", approval());
  const executing = await store.claimExecution("proposal_store_1");
  const pending = await store.completeExecution("proposal_store_1", {
    status: "verification_pending",
    idempotencyKey: executing.idempotencyKey,
    result: { writeAccepted: true }
  });
  assert.equal(pending.status, "verification_pending");

  const verified = await store.completeExecution("proposal_store_1", {
    status: "verified",
    idempotencyKey: executing.idempotencyKey,
    result: { verifiedByReadBack: true }
  });
  assert.equal(verified.status, "verified");
  assert.equal(verified.execution.result.verifiedByReadBack, true);

  await assert.rejects(
    () => store.reject("proposal_store_1", { reason: "too late" }),
    (error) => error.code === "case_action_cannot_be_rejected"
  );
  await assert.rejects(
    () => store.completeExecution("proposal_store_1", { status: "approved" }),
    (error) => error.code === "invalid_case_action_completion_status"
  );
});

test("keeps simulator actions isolated from normal actions", async () => {
  const clock = createClock("2026-08-11T18:45:00.000Z");
  const kv = createMemoryKv(clock);
  const normalStore = createStore(kv, clock);
  const simulatorStore = createCaseActionStore({
    kv,
    now: clock.now,
    retentionSeconds: 120,
    approvalTtlSeconds: 30,
    lockRetryMs: 1,
    recordPrefix: "support:simulator-action:v1:",
    lockPrefix: "support:simulator-action-lock:v1:",
    latestPrefix: "support:simulator-action-latest:v1:"
  });

  await simulatorStore.propose(proposal());
  assert.equal(await normalStore.get("proposal_store_1"), null);
  assert.equal(await normalStore.getLatestByChat("chat-100"), null);
  assert.equal((await simulatorStore.get("proposal_store_1")).proposalId, "proposal_store_1");
});

test("default Upstash adapter uses atomic lock-owned writes", async () => {
  const originalFetch = globalThis.fetch;
  const calls = [];
  globalThis.fetch = async (url, request) => {
    const command = JSON.parse(request.body)[0];
    calls.push({ url, request, command });
    let result = null;
    if (command[0] === "GET") result = "stored";
    if (command[0] === "SET") result = "OK";
    if (command[0] === "DEL" || command[0] === "EVAL") result = 1;
    return {
      ok: true,
      status: 200,
      json: async () => [{ result }]
    };
  };

  try {
    const kv = createUpstashCaseActionKvAdapter({
      url: "https://kv.example.test/",
      token: "test-token"
    });
    assert.equal(await kv.get("record"), "stored");
    assert.equal(await kv.set("lock", "owner", {
      onlyIfAbsent: true,
      ttlMilliseconds: 5000
    }), true);
    assert.equal(await kv.setIfLockOwned("lock", "owner", "record", "value", {
      ttlSeconds: 60
    }), true);
    assert.equal(await kv.compareDelete("lock", "owner"), true);
    assert.equal(await kv.delete("record"), true);

    assert.equal(calls.every((call) => call.url === "https://kv.example.test/pipeline"), true);
    assert.equal(calls.every((call) => call.request.headers.authorization === "Bearer test-token"), true);
    assert.deepEqual(calls[1].command.slice(-3), ["NX", "PX", "5000"]);
    assert.equal(calls[2].command[0], "EVAL");
    assert.equal(calls[2].command[2], "2");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

for (const { name, fn } of tests) {
  await fn();
  console.log(`ok - ${name}`);
}

console.log(`\n${tests.length} case action store tests passed`);

function test(name, fn) {
  tests.push({ name, fn });
}

function createStore(kv, clock) {
  return createCaseActionStore({
    kv,
    now: clock.now,
    retentionSeconds: 120,
    approvalTtlSeconds: 30,
    lockRetryMs: 1
  });
}

function proposal(overrides = {}) {
  return {
    proposalId: "proposal_store_1",
    chatId: "chat-100",
    caseRevision: 3,
    caseFingerprint: "fingerprint-3",
    actionType: "jira.comment",
    riskLevel: "medium",
    requiresHumanApproval: true,
    payload: { issueKey: "SUP-100", message: "Seguimiento seguro" },
    proposedBy: { type: "human", email: "agent-a@betxico.mx" },
    reason: "Dar seguimiento al expediente",
    proposedAt: "2026-08-11T18:00:00.000Z",
    expiresAt: "2026-08-11T19:00:00.000Z",
    ...overrides
  };
}

function approval(overrides = {}) {
  return {
    approvalId: "approval_store_1",
    approvedBy: { email: "agent@betxico.mx", role: "agent" },
    approvedAt: "2026-08-11T18:00:01.000Z",
    expiresAt: "2026-08-11T18:50:00.000Z",
    ...overrides
  };
}

function createClock(initialIso) {
  let milliseconds = Date.parse(initialIso);
  return {
    now: () => new Date(milliseconds),
    advance: (amount) => {
      milliseconds += amount;
    }
  };
}

function createMemoryKv(clock, options = {}) {
  const records = new Map();
  const latencyMs = Number(options.latencyMs || 0);

  function purge(key) {
    const entry = records.get(key);
    if (entry && entry.expiresAt !== null && entry.expiresAt <= clock.now().getTime()) {
      records.delete(key);
    }
  }

  async function pause() {
    if (latencyMs > 0) await new Promise((resolve) => setTimeout(resolve, latencyMs));
  }

  return {
    async get(key) {
      await pause();
      purge(key);
      return records.get(key)?.value ?? null;
    },
    async set(key, value, setOptions = {}) {
      await pause();
      purge(key);
      if (setOptions.onlyIfAbsent && records.has(key)) return false;
      const ttlMs = setOptions.ttlMilliseconds
        || (setOptions.ttlSeconds ? setOptions.ttlSeconds * 1000 : null);
      records.set(key, {
        value,
        expiresAt: ttlMs === null ? null : clock.now().getTime() + ttlMs
      });
      return true;
    },
    async delete(key) {
      await pause();
      return records.delete(key);
    },
    async compareDelete(key, expectedValue) {
      await pause();
      purge(key);
      if (records.get(key)?.value !== expectedValue) return false;
      records.delete(key);
      return true;
    },
    async setIfLockOwned(lock, expectedValue, key, value, setOptions = {}) {
      await pause();
      purge(lock);
      if (records.get(lock)?.value !== expectedValue) return false;
      const ttlMs = setOptions.ttlSeconds ? setOptions.ttlSeconds * 1000 : null;
      records.set(key, {
        value,
        expiresAt: ttlMs === null ? null : clock.now().getTime() + ttlMs
      });
      return true;
    },
    async ttlSeconds(key) {
      purge(key);
      const entry = records.get(key);
      if (!entry || entry.expiresAt === null) return null;
      return Math.ceil((entry.expiresAt - clock.now().getTime()) / 1000);
    }
  };
}
