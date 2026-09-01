import assert from "node:assert/strict";
import { pendingWinsFromSessions, summariseBobSession } from "../lib/bob-native-client.js";

const session = summariseBobSession({
  session_id: "session-12345678",
  game_code: "SUGARRUSH1000PR409",
  provider_name: "Pragmatic Play",
  date_created: "2026-08-15 07:30:00",
  session_status: "relayClosePlay",
  pending_total_win: "25.50"
}, { closedAt: "2026-08-15T13:45:00.000Z" });

assert.equal(session.game, "SUGARRUSH1000PR409");
assert.equal(session.provider, "Pragmatic Play");
assert.equal(session.pendingWin.hasValue, true);
assert.equal(session.closedAt, "2026-08-15T13:45:00.000Z");
assert.deepEqual(pendingWinsFromSessions([
  { session_id: "a", game_code: "Juego A", date_created: "2026-08-15", pending_total_win: "0" },
  { session_id: "b", game_code: "Juego B", date_created: "2026-08-15", pending_total_win: "11.20" },
  { session_id: "c", game_code: "Juego C", date_created: "2026-08-15", pending_total_win: "null" }
]), [{ sessionId: "b", game: "Juego B", createdAt: "2026-08-15", amount: "11.20" }]);

console.log("Resumen de sesiones BoB: 2 pruebas correctas");
