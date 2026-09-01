const SOURCE_LABELS = Object.freeze({
  jira: "Jira",
  slack: "Slack Lista 8",
  atena: "Atena",
  kyc: "KYC",
  kycReview: "revisión KYC humana",
  knowledge: "manual operativo"
});

export function buildCaseInvestigationTrace(caseRecord = {}) {
  const steps = [];
  const customer = caseRecord.customer || {};
  const corrections = Array.isArray(caseRecord.identityCorrections) ? caseRecord.identityCorrections : [];

  for (const correction of corrections.slice(-3)) {
    steps.push({
      id: `correction-${correction.changedAt || steps.length}`,
      kind: "correction",
      status: "replaced",
      title: "Identidad corregida",
      detail: correction.field === "email"
        ? `Se sustituyó el correo anterior y se reiniciaron las consultas con ${maskEmail(correction.nextValue)}.`
        : "Se sustituyó el ID anterior y se reiniciaron las consultas.",
      branch: "Descartar resultados asociados al dato anterior."
    });
  }

  steps.push({
    id: "identity",
    kind: "identity",
    status: customer.email || customer.authId ? "complete" : "waiting",
    title: "Identidad del cliente",
    detail: [customer.email ? maskEmail(customer.email) : "Correo pendiente", customer.authId ? `ID ${maskId(customer.authId)}` : "ID pendiente"].join(" · "),
    branch: customer.email || customer.authId ? "Usar estos datos para las consultas." : "Solicitar un correo o ID válido."
  });

  const workflowId = String(caseRecord.workflow?.id || "").trim();
  steps.push({
    id: "classification",
    kind: "classification",
    status: workflowId && workflowId !== "unknown" ? "complete" : "waiting",
    title: "Tipo de solicitud",
    detail: workflowId && workflowId !== "unknown" ? humanWorkflow(workflowId) : "Aún no hay información suficiente.",
    branch: workflowId && workflowId !== "unknown"
      ? `Continuar por la ruta de ${humanWorkflow(workflowId).toLowerCase()}.`
      : "Pedir al cliente que describa el problema."
  });

  steps.push(sourceStep("jira", caseRecord.systemFacts?.caseJiraLookup));
  steps.push(sourceStep("slack", caseRecord.systemFacts?.caseSlackLookup));
  if (caseRecord.systemFacts?.caseAtenaLookup) {
    steps.push(sourceStep("atena", caseRecord.systemFacts?.caseAtenaLookup));
  }
  if (workflowId === "kyc_identity" || caseRecord.systemFacts?.caseKycLookup) {
    steps.push(sourceStep("kyc", caseRecord.systemFacts?.caseKycLookup));
  }
  if (caseRecord.systemFacts?.caseKycReview) {
    steps.push(sourceStep("kycReview", caseRecord.systemFacts?.caseKycReview));
  }
  if (caseRecord.systemFacts?.caseKnowledgeLookup) {
    steps.push(sourceStep("knowledge", caseRecord.systemFacts?.caseKnowledgeLookup));
  }

  const operationalDecision = caseRecord.operationalDecision || {};
  if (operationalDecision.route) {
    const sourceReference = String(operationalDecision.sourceReference || "").trim();
    const reason = String(operationalDecision.reason || "").trim();
    steps.push({
      id: "operational-route",
      kind: "decision",
      status: operationalDecision.conflicting === true ? "waiting" : "complete",
      title: operationalDecision.title || "Ruta operativa",
      detail: [humanDecisionSource(operationalDecision.source), sourceReference, reason]
        .filter(Boolean)
        .join(" · ") || "La ruta se determinó con los datos disponibles.",
      branch: operationalDecision.conflicting === true
        ? "Detener la respuesta y comparar las fuentes antes de continuar."
        : decisionBranch(operationalDecision)
    });
  }

  const nextAction = caseRecord.nextAction || {};
  steps.push({
    id: "decision",
    kind: "decision",
    status: "active",
    title: "Siguiente paso",
    detail: String(nextAction.message || "Esperar más información del cliente.").trim(),
    branch: nextAction.requiresHumanApproval === true
      ? "Preparar la propuesta para revisión humana."
      : "El flujo puede continuar sin ejecutar cambios externos."
  });

  return steps;
}

export function detectCustomerIdentityCorrection(text, currentCustomer = {}) {
  const raw = String(text || "").replace(/\s+/gu, " ").trim();
  if (!raw || !correctionCue(raw)) return null;

  const email = normalizeEmail(raw.match(/[^\s<>(),;:]+@[^\s<>(),;:]+\.[A-Za-z]{2,}/u)?.[0]);
  if (email && email !== normalizeEmail(currentCustomer.email)) {
    return { field: "email", previousValue: normalizeEmail(currentCustomer.email), nextValue: email };
  }

  const authId = String(raw.match(/\b(?:auth\s*id|id(?:\s+del\s+cliente)?|usuario)\b[^\d]{0,45}(\d{4,18})\b/iu)?.[1] || "").trim();
  if (authId && authId !== String(currentCustomer.authId || "").trim()) {
    return { field: "authId", previousValue: String(currentCustomer.authId || "").trim(), nextValue: authId };
  }
  return null;
}

function sourceStep(source, result = {}) {
  const label = SOURCE_LABELS[source];
  const status = String(result?.status || "unavailable");
  const records = source === "kycReview"
    ? result?.data?.record ? [result.data.record] : []
    : source === "atena"
      ? result?.data?.latestWithdrawal ? [result.data.latestWithdrawal] : []
      : source === "kyc"
        ? [...(result?.data?.sources?.users?.results || []), ...(result?.data?.sources?.verifications?.results || [])]
        : Array.isArray(result?.data?.records) ? result.data.records : [];
  const queryType = String(result?.query?.type || result?.data?.queryType || "").trim();
  const coverage = result?.data?.coverage || {};
  let detail;
  let branch;

  if (status === "available") {
    const finding = summarizeSourceRecord(source, records[0]);
    detail = `${records.length} ${records.length === 1 ? "coincidencia exacta" : "coincidencias exactas"}${queryType ? ` por ${humanQueryType(queryType)}` : ""}.${finding ? ` ${finding}` : ""}`;
    branch = source === "knowledge"
      ? "Usar estas reglas como guía; confirmar los hechos en las fuentes operativas."
      : `Usar los datos confirmados de ${label} para decidir la respuesta.`;
  } else if (status === "not_found") {
    detail = `Consulta completa${queryType ? ` por ${humanQueryType(queryType)}` : ""}; sin coincidencias exactas.`;
    branch = `Continuar sin afirmar que existe un registro en ${label}.`;
  } else if (status === "stale") {
    detail = source === "slack"
      ? `Caché de Lista 8 incompleta: ${Number(coverage.cachedPanels || 0)} de ${Number(coverage.expectedPanels || 0)} lista disponible.`
      : "El resultado existe, pero perdió vigencia."
    branch = `No usar ${label} como evidencia; continuar y solicitar actualización.`;
  } else {
    const bridgeState = String(result?.data?.bridge?.state || "").trim();
    detail = bridgeState
      ? `Trabajo de consulta ${bridgeState === "processing" ? "en proceso" : "en espera del conector"}.`
      : source === "slack" && Number(coverage.expectedPanels || 0) > 0
      ? `Sin caché utilizable de Lista 8: ${Number(coverage.cachedPanels || 0)} de ${Number(coverage.expectedPanels || 0)} lista disponible.`
      : "La fuente no respondió o no está configurada."
    branch = bridgeState
      ? `Volver a consultar el expediente para continuar el mismo trabajo de ${label}.`
      : `Registrar la indisponibilidad de ${label} y continuar sin inventar resultados.`;
  }

  return {
    id: source,
    kind: "source",
    source,
    status,
    title: `Consulta en ${label}`,
    detail,
    branch,
    checkedAt: String(result?.checkedAt || "")
  };
}

function summarizeSourceRecord(source, record = {}) {
  if (!record || typeof record !== "object") return "";
  if (source === "jira") {
    const key = String(record.ticketKey || "").trim();
    const status = String(record.status || "").trim();
    const summary = String(record.untrustedContent?.summary || record.untrustedContent?.latestComment || "").replace(/\s+/gu, " ").trim();
    return [key, status, summary.slice(0, 220)].filter(Boolean).join(" · ");
  }
  if (source === "slack") {
    const status = String(record.status || "").trim();
    const reason = String(record.untrustedContent?.reason || record.untrustedContent?.note || "").replace(/\s+/gu, " ").trim();
    return ["Lista 8", status, reason.slice(0, 220)].filter(Boolean).join(" · ");
  }
  if (source === "atena") {
    return [String(record.status || "").trim(), String(record.date || "").trim(), String(record.amount || "").trim()].filter(Boolean).join(" · ");
  }
  if (source === "kyc") {
    const missing = [
      record?.documents?.ineFront === false ? "INE frente pendiente" : "",
      record?.documents?.ineBack === false ? "INE reverso pendiente" : "",
      record?.documents?.selfie === false ? "selfie pendiente" : ""
    ].filter(Boolean);
    return [String(record.status || "").trim(), ...missing].filter(Boolean).join(" · ");
  }
  if (source === "knowledge") {
    return String(record.title || "Regla operativa recuperada").trim();
  }
  return String(record.status || "").trim();
}

function humanDecisionSource(value) {
  return ({
    jira: "Fuente: Jira",
    slack_list_8: "Fuente: Slack Lista 8",
    "jira+slack_list_8": "Fuentes: Jira y Slack Lista 8",
    atena: "Fuente: Atena",
    conversation: "Fuente: conversación"
  })[String(value || "").trim()] || "";
}

function decisionBranch(decision = {}) {
  if (decision.route === "lookup_history") return "Consultar Jira y Lista 8 antes de pedir más información.";
  if (decision.route === "kyc_document_required") return "Confirmar el requisito en KYC antes de solicitar documentos.";
  if (decision.route === "withdrawal_not_found") return "Pedir monto y fecha para consultar el retiro por otra referencia.";
  if (decision.route === "source_unavailable") return "Continuar con las fuentes disponibles sin interpretar un error como ausencia.";
  return "Preparar una respuesta basada en el motivo y estado confirmados.";
}

function correctionCue(value) {
  const normalized = String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase();
  return /\b(?:me\s+equivoque|correccion|corrige|corregir|cambia|cambiar|el\s+correcto|la\s+correcta|en\s+realidad|no\s+es|es\s+otro)\b/u.test(normalized);
}

function normalizeEmail(value) {
  const email = String(value || "").trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) ? email : "";
}

function maskEmail(value) {
  const [local, domain] = normalizeEmail(value).split("@");
  if (!local || !domain) return "correo inválido";
  return `${local.slice(0, 2)}${"*".repeat(Math.min(5, Math.max(2, local.length - 2)))}@${domain}`;
}

function maskId(value) {
  const id = String(value || "").trim();
  return id.length > 4 ? `${"*".repeat(id.length - 4)}${id.slice(-4)}` : id;
}

function humanQueryType(value) {
  return ({ email: "correo", auth_id: "ID", ticket_key: "ticket" })[value] || "identidad";
}

function humanWorkflow(value) {
  return ({
    withdrawal: "Retiro",
    deposit: "Depósito",
    kyc_identity: "Verificación KYC",
    ticket_followup: "Seguimiento de ticket",
    game_access: "Acceso a juego",
    casino_win_missing: "Ganancia de casino",
    sports_bet: "Apuesta deportiva",
    bank_account: "Cuenta bancaria",
    account_closure: "Cierre de cuenta",
    bonus_rollover: "Bono o rollover",
    devwallet: "Devolución Wallet"
  })[value] || "Solicitud sin clasificar";
}
