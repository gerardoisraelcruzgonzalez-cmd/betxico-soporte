import assert from "node:assert/strict";
import { bobClosureLabel, bobClosureReference, buildBobClosureJiraReport, createBobClosureJiraTicket, summarizeBobJiraError } from "../lib/bob-jira-ticket.js";

const account = {
  configured: true,
  displayName: "Agente de prueba",
  email: "agent@example.test",
  jiraEmail: "agent@example.test",
  jiraApiToken: "test-token",
  reporterAccountId: "reporter-1",
  defaultAssigneeAccountId: "assignee-1"
};
const job = {
  id: "job-123",
  customerId: "513228",
  reportedGame: "Cosmic Cash",
  customer: { name: "Cliente de prueba", email: "cliente@example.test" },
  chatId: "chat-1",
  createdAt: "2026-08-15T12:00:00.000Z",
  completedAt: "2026-08-15T12:05:00.000Z",
  result: {
    closedSessions: [{
      sessionId: "session-1",
      game: "COCKTAIL NIGHTS PG SOFT GAMING",
      createdAt: "2026-08-15T10:00:00.000Z",
      closedAt: "2026-08-15T12:04:00.000Z",
      pendingWin: { hasValue: true, amount: "20.00" }
    }],
    remainingSessions: [],
    pendingWins: { foundBeforeClosure: [{ sessionId: "session-1", game: "COCKTAIL NIGHTS PG SOFT GAMING", amount: "20.00" }], remainingAfterVerification: [] },
    jiraEvidence: [
      { filename: "bob-sesiones-513228-antes.jpg", contentType: "image/jpeg", dataBase64: "cHJldmlvdXM=" },
      { filename: "bob-sesiones-513228-despues.jpg", contentType: "image/jpeg", dataBase64: "YWZ0ZXI=" }
    ]
  }
};

const report = buildBobClosureJiraReport({ job, account });
assert.equal(report.ticket.issueType, "Servicio al Cliente");
assert.equal(report.ticket.summary, "ID 513228_CIERRE DE SESIONES_Cosmic Cash");
assert.equal(report.ticket.amplifyUrl, "https://backoffice-kyc.paybridge.com.mx/dashboard/");
assert.equal(report.customer.email, "cliente@example.test");
assert.equal(report.jiraFields.customfield_10072.value, "513228");
assert.equal(report.jiraFields.customfield_10070.value, "https://backoffice-kyc.paybridge.com.mx/dashboard/");
assert.equal(report.jiraFields.customfield_10015.value, "2026-08-15");
assert.equal(report.attachments.length, 2);
assert.equal(report.attachments[0].filename, "bob-sesiones-513228-antes.jpg");
assert.match(report.ticket.description, /Sesion: session-1/);
assert.match(report.ticket.description, /Cliente solicitó cierre de sesiones del juego Cosmic Cash/);
assert.match(report.ticket.description, /Pending Win detectado antes del cierre: 1/);
assert.doesNotMatch(report.ticket.description, /Proveedor:/);
assert.ok(report.ticket.labels.includes(bobClosureLabel(job.id)));
assert.match(report.ticket.description, new RegExp(bobClosureReference(job.id)));

process.env.JIRA_KYC_URL_FIELD_ID = "customfield_10318";
let btsCreated;
await createBobClosureJiraTicket({
  job,
  account,
  dependencies: {
    searchIssues: async () => [],
    createIssue: async (payload) => {
      btsCreated = payload;
      return { key: "BTS-1", id: "2", url: "https://jira.example.test/browse/BTS-1" };
    }
  }
});
assert.equal(btsCreated.jiraFields.customfield_10070.value, "https://backoffice-kyc.paybridge.com.mx/dashboard/");
delete process.env.JIRA_KYC_URL_FIELD_ID;

let created;
const ticket = await createBobClosureJiraTicket({
  job,
  account,
  dependencies: {
    searchIssues: async () => [],
    createIssue: async (payload) => { created = payload; return { key: "BTF-1", id: "1", url: "https://jira.example.test/browse/BTF-1" }; }
  }
});
assert.equal(ticket.key, "BTF-1");
assert.equal(created.accountSettings.reporterAccountId, "reporter-1");
assert.equal(created.accountSettings.defaultAssigneeAccountId, "assignee-1");

let duplicateCreateCalled = false;
const duplicate = await createBobClosureJiraTicket({
  job,
  account,
  dependencies: {
    searchIssues: async () => [{ key: "BTF-1", id: "1", url: "https://jira.example.test/browse/BTF-1", labels: [bobClosureLabel(job.id)], description: bobClosureReference(job.id) }],
    createIssue: async () => { duplicateCreateCalled = true; }
  }
});
assert.equal(duplicate.reused, true);
assert.equal(duplicateCreateCalled, false);

await assert.rejects(
  () => createBobClosureJiraTicket({ job, account: {}, dependencies: {} }),
  /bob_jira_agent_not_configured/
);
await assert.rejects(
  () => createBobClosureJiraTicket({ job: { ...job, customer: {} }, account, dependencies: {} }),
  /bob_jira_customer_data_required/
);
assert.equal(
  summarizeBobJiraError({ statusCode: 400, details: { errors: { reporter: "No se puede asignar el reporter a agent@example.test" } } }),
  "jira_create_failed_400_reporter: No se puede asignar el reporter a [correo oculto]"
);
console.log("Ticket Jira de cierre BoB: 13 pruebas correctas");
