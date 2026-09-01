import assert from "node:assert/strict";
import { requireBobTicketCustomer } from "../api/atena-bridge.js";

assert.deepEqual(
  requireBobTicketCustomer({ name: "Cliente de prueba", email: "CLIENTE@example.test" }),
  { name: "Cliente de prueba", email: "cliente@example.test" }
);

for (const customer of [
  {},
  { name: "Cliente", email: "" },
  { name: "", email: "cliente@example.test" },
  { name: "Cliente", email: "correo-invalido" }
]) {
  assert.throws(
    () => requireBobTicketCustomer(customer),
    (error) => error.message === "bob_customer_data_required" && error.statusCode === 400
  );
}

console.log("Solicitud BoB: 5 validaciones de datos de cliente correctas.");
