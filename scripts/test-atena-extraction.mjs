import assert from "node:assert/strict";
import {
  dailyAtenaExtractMovements,
  latestAtenaExtractMovements,
  latestAtenaWithdrawal,
  latestAtenaWithdrawals
} from "../lib/atena-extraction.js";

const withdrawal = latestAtenaWithdrawal({
  headers: ["Acciones", "Solicitud (Click to sort ascending)", "Pago", "Afiliado (Estab.)", "ID Invoice", "Medio de pago", "Estado (Click to sort ascending)", "Valor (Click to sort ascending)"],
  rows: [
    ["", "12/08/2026 12:46:55", "---", "Betxico", "No definido", "Paybridge Wallet", "Aguardando Aprovação", "$190.00"],
    ["", "12/08/2026 10:51:08", "12/08/2026 12:25:47", "Betxico", "invoice", "Paybridge Wallet", "Pago", "$100.00"]
  ]
});

assert.deepEqual(withdrawal, {
  date: "12/08/2026 12:46:55",
  detail: "Paybridge Wallet",
  amount: "$190.00",
  status: "Aguardando Aprovação",
  order: Date.UTC(2026, 7, 12, 12, 46, 55)
});

const withdrawals = latestAtenaWithdrawals({
  headers: ["Solicitud", "Medio de pago", "Estado", "Valor"],
  rows: [
    ["10/08/2026 10:00:00", "Wallet", "Pago", "$100.00"],
    ["12/08/2026 10:00:00", "Wallet", "Aguardando Aprovação", "$200.00"],
    ["11/08/2026 10:00:00", "Wallet", "Em análise", "$150.00"],
    ["09/08/2026 10:00:00", "Wallet", "Pago", "$90.00"]
  ]
}, 3);
assert.deepEqual(withdrawals.map((item) => item.amount), ["$200.00", "$150.00", "$100.00"]);

const movements = latestAtenaExtractMovements({
  headers: ["Detalle", "Data movimiento", "Descripción", "Valor", "Saldo"],
  rows: [
    ["", "05/08/2026", "Saldo anterior", "", "$0.26"],
    ["", "10/08/2026 08:00:00", "Juego A", "-$10.00", "$20.00"],
    ["", "11/08/2026 09:00:00", "Juego B", "$25.00", "$45.00"],
    ["", "12/08/2026 10:00:00", "Juego C", "-$5.00", "$40.00"],
    ["", "12/08/2026 11:00:00", "Juego D", "$12.00", "$52.00"]
  ]
});

assert.equal(movements.length, 3);
assert.deepEqual(movements.map((item) => item.detail), ["Juego D", "Juego C", "Juego B"]);

const dailyMovements = dailyAtenaExtractMovements({
  headers: ["Detalle", "Data movimiento", "Descripción", "Valor", "Saldo"],
  rows: [
    ["", "11/08/2026 23:59:00", "Anterior", "$10.00", "$10.00"],
    ["", "12/08/2026 07:30:00", "Depósito", "$200.00", "$210.00"],
    ["", "12/08/2026 08:00:00", "Juego A", "-$50.00", "$160.00"],
    ["", "12/08/2026 10:00:00", "Retiro", "-$100.00", "$60.00"],
    ["", "12/08/2026 00:00:00", "Saldo anterior", "$0.00", "$0.00"]
  ]
}, "2026-08-12");
assert.deepEqual(dailyMovements.map((item) => item.detail), ["Retiro", "Juego A", "Depósito"]);
console.log("Atena extraction contracts passed.");
