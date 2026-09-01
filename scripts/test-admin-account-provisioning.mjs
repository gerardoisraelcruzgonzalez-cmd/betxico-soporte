import assert from "node:assert/strict";
import { preserveSessionAdmin } from "../api/admin-config.js";

const first = preserveSessionAdmin({ authorizedUsers: [], adminEmails: [] }, { email: "ADMIN@betxico.mx" });
assert.deepEqual(first.authorizedUsers, [{ email: "admin@betxico.mx", role: "admin", enabled: true }]);
assert.deepEqual(first.adminEmails, ["admin@betxico.mx"]);

const second = preserveSessionAdmin({
  authorizedUsers: [{ email: "admin@betxico.mx", displayName: "Gerardo", role: "agent", accessGroup: "complete", enabled: false }],
  adminEmails: []
}, { email: "admin@betxico.mx" });
assert.equal(second.authorizedUsers.length, 1);
assert.equal(second.authorizedUsers[0].role, "admin");
assert.equal(second.authorizedUsers[0].enabled, true);
assert.equal(second.authorizedUsers[0].accessGroup, "complete");

console.log("Provisionamiento admin: conserva y autoriza la sesión actual.");
