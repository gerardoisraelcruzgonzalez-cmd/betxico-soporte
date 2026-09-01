import { isCaseToolResultUsable } from "./case-operation-contracts.js";
import { evaluateCaseResponsePolicy } from "./case-response-policy.js";

export function evaluateCaseActionContext(caseRecord = {}, actionType = "", actionPayload = {}, options = {}) {
  const now = options.now || new Date().toISOString();
  const jira = caseRecord.systemFacts?.caseJiraLookup;
  const slack = caseRecord.systemFacts?.caseSlackLookup;
  const jiraUsable = isCaseToolResultUsable(jira, now);
  const slackUsable = isCaseToolResultUsable(slack, now);

  if (actionType === "jira.comment") {
    const records = Array.isArray(jira?.data?.records) ? jira.data.records : [];
    const exactTicket = records.some((record) => record.ticketKey === actionPayload.issueKey);
    if (!jiraUsable || jira.status !== "available" || !exactTicket) {
      return invalid("case_action_jira_ticket_not_verified");
    }
  }

  if (actionType === "slack.notify") {
    if (!jiraUsable && !slackUsable) {
      return invalid("case_action_verified_source_required");
    }
    if (Number(caseRecord.evidence?.pendingReviewCount || 0) > 0) {
      return invalid("case_action_evidence_review_pending");
    }
  }

  if (actionType === "livechat.send_message") {
    const responsePolicy = evaluateCaseResponsePolicy(caseRecord, actionPayload.text, { now });
    if (!responsePolicy.ok) return invalid(responsePolicy.reason);
  }

  return { ok: true, reason: "case_action_context_verified" };
}

function invalid(reason) {
  return { ok: false, reason };
}
