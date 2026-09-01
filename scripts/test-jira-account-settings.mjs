import assert from "node:assert/strict";
import { createJiraIssue, searchJiraTickets } from "../lib/jira.js";

const previousFetch = globalThis.fetch;
const previousProject = process.env.JIRA_PROJECT_KEY;
const previousKycField = process.env.JIRA_KYC_URL_FIELD_ID;
let capturedUrl = "";
let capturedAuth = "";

try {
  process.env.JIRA_PROJECT_KEY = "BTF";
  globalThis.fetch = async (url, options = {}) => {
    capturedUrl = String(url);
    capturedAuth = String(options.headers?.authorization || "");
    return {
      ok: true,
      status: 200,
      json: async () => ({ issues: [] })
    };
  };

  const result = await searchJiraTickets("synthetic lookup", {
    jiraBaseUrl: "https://jira.example.test",
    jiraEmail: "agent@example.test",
    jiraApiToken: "agent-token"
  });

  assert.deepEqual(result, []);
  assert.match(capturedUrl, /^https:\/\/jira\.example\.test\/rest\/api\/3\/search\/jql\?/);
  assert.match(decodeURIComponent(capturedUrl), /project = BTF/);
  assert.equal(
    capturedAuth,
    `Basic ${Buffer.from("agent@example.test:agent-token").toString("base64")}`
  );

  let createdFields = null;
  process.env.JIRA_PROJECT_KEY = "BTS";
  process.env.JIRA_KYC_URL_FIELD_ID = "customfield_10318";
  globalThis.fetch = async (_url, options = {}) => {
    createdFields = JSON.parse(options.body).fields;
    return {
      ok: true,
      status: 201,
      json: async () => ({ key: "BTS-1", id: "1" })
    };
  };
  await createJiraIssue({
    ticket: { issueType: "Servicio al Cliente", summary: "Prueba", description: "Prueba", labels: [], amplifyUrl: "https://backoffice-kyc.paybridge.com.mx/dashboard/" },
    customer: { name: "Cliente", email: "cliente@example.test", authId: "1" },
    livechat: {},
    jiraFields: {
      customfield_10070: { name: "Amplify URL", value: "https://backoffice-kyc.paybridge.com.mx/dashboard/", schema: { type: "string" } }
    },
    attachments: [],
    accountSettings: {
      jiraBaseUrl: "https://jira.example.test",
      jiraEmail: "agent@example.test",
      jiraApiToken: "agent-token",
      reporterAccountId: "reporter-1"
    }
  });
  assert.equal(createdFields.customfield_10318, "https://backoffice-kyc.paybridge.com.mx/dashboard/");
  assert.equal(createdFields.customfield_10070, undefined);
  console.log("Jira account settings: búsqueda con credenciales del agente correcta.");
} finally {
  globalThis.fetch = previousFetch;
  if (previousProject === undefined) delete process.env.JIRA_PROJECT_KEY;
  else process.env.JIRA_PROJECT_KEY = previousProject;
  if (previousKycField === undefined) delete process.env.JIRA_KYC_URL_FIELD_ID;
  else process.env.JIRA_KYC_URL_FIELD_ID = previousKycField;
}
