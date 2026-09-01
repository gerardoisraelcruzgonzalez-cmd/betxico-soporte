import assert from "node:assert/strict";
import { mergeBobResults } from "../lib/bob-bridge-store.js";

const session = (sessionId, game) => ({ sessionId, game, closedAt: "2026-08-15T12:00:00.000Z" });
const partial = mergeBobResults({}, {
  customerId: "397321",
  totalPendingFound: 56,
  closedSessions: [session("s-1", "Juego 1"), session("s-2", "Juego 2")],
  pendingWins: { foundBeforeClosure: [{ sessionId: "s-2", game: "Juego 2", amount: "10" }] }
});
const completed = mergeBobResults(partial, {
  customerId: "397321",
  totalPendingFound: 1,
  closedSessions: [session("s-3", "Juego 3")],
  verifiedPendingCount: 0,
  remainingSessions: [],
  pendingWins: { foundBeforeClosure: [], remainingAfterVerification: [] }
});

assert.equal(completed.totalPendingFound, 56);
assert.equal(completed.closedCount, 3);
assert.deepEqual(completed.closedSessions.map((item) => item.sessionId), ["s-1", "s-2", "s-3"]);
assert.equal(completed.pendingWins.foundBeforeClosure.length, 1);
assert.deepEqual(completed.pendingWins.remainingAfterVerification, []);
console.log("Acumulación de cierres BoB: 5 pruebas correctas");
