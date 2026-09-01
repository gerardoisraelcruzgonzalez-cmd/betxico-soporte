import { isCaseToolResultUsable } from "./case-operation-contracts.js";
import { SUPPORT_SLACK_LIST_ID } from "./remote-config.js";

// The List wording varies by agent and by operational period. These terms describe
// one family of identity-review requirements, not separate exact commands.
const KYC_PATTERN = /\b(?:kyc|ine|selfie|ident(?:idad|ificacion)|document(?:o|os|acion)|comprobante\s+de\s+domicilio|datos?\s+no\s+coincid)/u;
const BANK_PATTERN = /\b(?:banco|bancari|clabe|cuenta\s+de\s+retiro|rechazad|devuelt|retornad)/u;
const WALLET_PATTERN = /\b(?:dev\s*wallet|devolucion\s+wallet|deposito\s+sin\s+jugar|sin\s+actividad\s+de\s+juego)/u;
const TECHNICAL_PATTERN = /\b(?:error\s*403|error\s+tecnico|falla\s+tecnica|incidencia\s+tecnica)/u;
const REVIEW_PATTERN = /\b(?:retenid|revision|revisando|pendiente|validacion|monitoreo)/u;
const SLACK_LIST_8_ID = SUPPORT_SLACK_LIST_ID;
const DOCUMENT_REQUIREMENTS = Object.freeze([
  ["ine_front", /\b(?:ine\s+(?:frente|frontal)|frente\s+(?:de\s+)?(?:la\s+)?ine)\b/u, "INE de frente"],
  ["ine_back", /\b(?:ine\s+(?:reverso|atras|posterior)|ine\b.{0,30}\b(?:reverso|atras|posterior)|reverso\s+(?:de\s+)?(?:la\s+)?ine)\b/u, "INE del reverso"],
  ["official_id", /\b(?:ine|identificacion|identidad|documento\s+de\s+identidad)\b/u, "identificación oficial vigente"],
  ["selfie_ine", /\b(?:selfie|foto\s+sosteniendo\s+(?:la\s+)?ine)\b/u, "selfie de validación"],
  ["bank_statement", /\b(?:caratula|estado\s+de\s+cuenta)\b/u, "carátula o estado de cuenta"],
  ["proof_of_address", /\bcomprobante\s+de\s+domicilio\b/u, "comprobante de domicilio"]
]);

export function evaluateOperationalCase(caseRecord = {}, options = {}) {
  const now = validIso(options.now) || new Date().toISOString();
  const workflowId = clean(caseRecord.workflow?.id);
  const base = {
    version: 1,
    route: "generic",
    title: "Revisión general",
    source: "conversation",
    sourceReference: "",
    reason: "",
    documentRequirements: [],
    requiredSources: [],
    completedSources: [],
    unavailableSources: [],
    conflicting: false,
    customerMessage: "",
    evaluatedAt: now
  };

  if (!workflowId || workflowId === "unknown") {
    return { ...base, route: "clarify_issue", title: "Aclarar solicitud" };
  }
  if (!new Set(["withdrawal", "game_access"]).has(workflowId)
    && Array.isArray(caseRecord.missingData) && caseRecord.missingData.length) {
    return {
      ...base,
      route: "collect_evidence",
      title: "Completar datos",
      reason: clean(caseRecord.missingData[0]?.label)
    };
  }
  if (workflowId === "kyc_identity") {
    const kyc = kycEvidenceSnapshot(caseRecord.systemFacts?.caseKycLookup, now);
    if (kyc.present && !kyc.complete) {
      return {
        ...base,
        route: "source_unavailable",
        title: "KYC no disponible",
        requiredSources: ["kyc"],
        unavailableSources: ["kyc"],
        reason: "La consulta KYC no terminó con evidencia vigente."
      };
    }
    return {
      ...base,
      route: "kyc_review",
      title: "Revisión KYC",
      requiredSources: ["kyc"],
      completedSources: kyc.complete ? ["kyc"] : [],
      reason: kyc.summary,
      customerMessage: kyc.complete
        ? "Ya consulté el estado de tu verificación. Un agente revisará el resultado antes de indicarte el siguiente paso."
      : "Voy a revisar el estado de verificación antes de indicarte qué documento o paso corresponde."
    };
  }
  if (workflowId === "game_access") {
    const authId = clean(caseRecord.customer?.authId || caseRecord.customer?.id);
    const bob = caseRecord.systemFacts?.caseBobClosure;
    if (!/^\d{3,20}$/u.test(authId)) {
      return {
        ...base,
        route: "identify_game_customer",
        title: "Identificar cliente para cerrar sesiones",
        reason: "El cierre de sesiones requiere un AUTH ID válido.",
        customerMessage: "Para ayudarte con el acceso al juego, compárteme el correo con el que registraste tu cuenta para revisar tus sesiones."
      };
    }
    if (bob?.status === "completed") {
      return {
        ...base,
        route: "game_sessions_closed",
        title: "Sesiones cerradas en BoB",
        source: "bob",
        completedSources: ["bob"],
        reason: "El cierre de sesiones fue verificado en BoB.",
        customerMessage: "Listo, ya realizamos el cierre de sesiones de tu cuenta. Por favor espera aproximadamente 10 minutos e intenta ingresar nuevamente al juego."
      };
    }
    return {
      ...base,
      route: "game_sessions_closing",
      title: "Cierre de sesiones en proceso",
      source: "bob",
      requiredSources: ["bob"],
      reason: "Se solicitará el cierre de sesiones antes de pedir una nueva prueba al cliente.",
      customerMessage: "Estoy revisando tus sesiones para ayudarte a restablecer el acceso al juego."
    };
  }
  if (workflowId !== "withdrawal") return base;

  return evaluateWithdrawal(caseRecord, base, now);
}

export function shouldLookupKycForCase(caseRecord = {}, options = {}) {
  const decision = caseRecord.operationalDecision || evaluateOperationalCase(caseRecord, options);
  return decision.requiredSources?.includes("kyc") === true;
}

export function shouldLookupAtenaForCase(caseRecord = {}) {
  return new Set([
    "withdrawal",
    "deposit",
    "devwallet",
    "sports_bet",
    "casino_win_missing",
    "game_access",
    "bonus_rollover"
  ]).has(clean(caseRecord.workflow?.id));
}

export function shouldLookupKycEvidenceForCase(caseRecord = {}) {
  return new Set(["withdrawal", "kyc_identity", "bank_account"])
    .has(clean(caseRecord.workflow?.id));
}

export function caseDecisionNextAction(caseRecord = {}, decision = caseRecord.operationalDecision) {
  if (!decision || decision.route === "generic") return null;
  const requirement = naturalList(decision.documentRequirements || []);
  switch (decision.route) {
  case "collect_evidence":
    return null;
  case "lookup_history":
    return action("investigate", "Consultar Jira y Slack Lista 8 antes de decidir.", false, ["Jira", "Slack Lista 8"]);
  case "identify_withdrawal":
    return action("verify_withdrawal", "Confirmar monto y fecha antes de asociar un movimiento o antecedente a este retiro.", false);
  case "source_unavailable":
    return action(
      "continue_without_source",
      `Continuar con las fuentes disponibles. No interpretar ${naturalList(decision.unavailableSources)} como ausencia de registro.`,
      true,
      decision.unavailableSources
    );
  case "source_conflict":
    return action("review_source_conflict", "Comparar los resultados de Jira y Lista 8 antes de responder o pedir documentos.", true, ["Jira", "Slack Lista 8"]);
  case "kyc_document_required":
    return action(
      "review_kyc",
      requirement
        ? `Lista 8 o Jira indica ${requirement}. Solicitar el documento y esperar la validación humana de KYC.`
        : "Lista 8 o Jira indica una revisión de identidad. Solicitar el documento correspondiente y esperar la validación humana de KYC.",
      true,
      ["KYC"]
    );
  case "kyc_updated_withdrawal_ready":
    return action(
      "prepare_verified_response",
      "KYC fue actualizado por un agente. Informar al cliente que el retiro será canalizado al área correspondiente para continuar su proceso normal.",
      true,
      ["KYC"]
    );
  case "bank_rejection":
    return action("prepare_verified_response", "Preparar respuesta con el motivo bancario confirmado en Lista 8.", true);
  case "wallet_review":
    return action("prepare_verified_response", "Preparar respuesta con la revisión de política Wallet confirmada en Lista 8.", true);
  case "technical_withdrawal":
    return action("prepare_verified_response", "Preparar respuesta con la incidencia técnica confirmada en la fuente operativa.", true);
  case "retention_reason_found":
    return action("prepare_verified_response", "Preparar respuesta usando el motivo y estado confirmados en Lista 8.", true);
  case "jira_followup_found":
    return action("prepare_verified_response", "Preparar respuesta usando el seguimiento confirmado en Jira.", true);
  case "withdrawal_paid":
    return action("prepare_verified_response", "Preparar una respuesta basada en el estado PAGADO confirmado por Atena.", true, ["Atena"]);
  case "withdrawal_in_analysis":
    return action("prepare_verified_response", "Explicar el estado EN ANALISIS confirmado por Atena y conservar los antecedentes como contexto.", true, ["Atena"]);
  case "withdrawal_awaiting_approval":
    return action("prepare_verified_response", "Explicar el estado AGUARDANDO APROBACION confirmado por Atena sin prometer un plazo.", true, ["Atena"]);
  case "withdrawal_cancelled":
    return action("prepare_verified_response", "Explicar el estado CANCELADO confirmado por Atena y revisar el motivo antes de sugerir el siguiente paso.", true, ["Atena"]);
  case "withdrawal_not_found":
    return action("verify_withdrawal", "Confirmar monto, fecha y referencia y consultar el estado actual del retiro; no abrir KYC sin una causa verificada.", false);
  case "kyc_review":
    return action("review_kyc", "Revisar KYC y registrar el resultado antes de solicitar documentos.", true, ["KYC"]);
  default:
    return null;
  }
}

export function isAcknowledgementWithoutNewEvidence(text = "", attachments = []) {
  const normalized = normalize(text).replace(/[^a-z0-9\s]/gu, " ").replace(/\s+/gu, " ").trim();
  if ((Array.isArray(attachments) ? attachments : []).length) return false;
  return /^(?:ok|okay|listo|lista|ya|si|sí|entonces|gracias|de acuerdo|esta bien|está bien|va|sale)$/u.test(normalized);
}

export function deterministicCaseReply(caseRecord = {}) {
  const decision = caseRecord.operationalDecision || evaluateOperationalCase(caseRecord);
  if (decision.route === "identify_withdrawal") {
    return "Para identificar correctamente el retiro que deseas revisar, compárteme el monto y la fecha aproximada en que lo solicitaste. Así podré revisar el movimiento correcto sin confundirte con una operación anterior.";
  }
  if (decision.route === "withdrawal_awaiting_approval") {
    return awaitingApprovalCustomerReply(caseRecord);
  }
  if (decision.route === "kyc_document_required") {
    const received = Number(caseRecord.evidence?.receivedCount || 0);
    if (!received) {
      return documentRequestMessage(decision.documentRequirements);
    }
    if (Number(caseRecord.evidence?.reviewedCount || 0) < received) {
      return "Gracias, ya recibimos tus imágenes. Voy a revisarlas y actualizar tu verificación antes de continuar con el retiro.";
    }
    return "Ya revisé la evidencia. La validación KYC sigue pendiente de confirmación humana antes de continuar con el retiro.";
  }
  return decision.customerMessage || "Ya inicié la revisión con las fuentes disponibles. Te indicaré el siguiente paso cuando tenga un dato confirmado."
}

function awaitingApprovalCustomerReply(caseRecord = {}) {
  const withdrawal = caseRecord.systemFacts?.caseAtenaLookup?.data?.latestWithdrawal || {};
  const amount = clean(withdrawal.amount);
  const date = customerWithdrawalDate(withdrawal.date);
  const description = amount
    ? `Revisé tu retiro de ${amount}${date ? ` solicitado ${date}` : ""}.`
    : "Revisé el estado de tu retiro.";
  return `${description} Por el momento aparece como “Aguardando aprobación”, lo que significa que todavía está pendiente de ser revisado y aprobado. Por ahora no necesitas realizar ninguna acción adicional, únicamente esperar a que finalice el proceso. Una vez aprobado, el retiro continuará con el proceso de pago. Ten en cuenta que el tiempo puede variar según la revisión, por lo que no podemos indicarte un tiempo exacto de acreditación.`;
}

function customerWithdrawalDate(value) {
  const date = clean(value).replace(/\s+\d{1,2}:\d{2}(?::\d{2})?$/u, "");
  if (!date) return "";
  return /^(?:hoy|el dia de hoy)$/u.test(normalize(date)) ? "el día de hoy" : `el ${date}`;
}

function evaluateWithdrawal(caseRecord, base, now) {
  const jira = sourceSnapshot(caseRecord.systemFacts?.caseJiraLookup, "jira", now);
  const slack = sourceSnapshot(caseRecord.systemFacts?.caseSlackLookup, "slack", now);
  const atena = atenaEvidenceSnapshot(caseRecord.systemFacts?.caseAtenaLookup, now);
  const kyc = kycEvidenceSnapshot(caseRecord.systemFacts?.caseKycLookup, now);
  const sources = [jira, slack, atena, kyc];
  const completedSources = sources.filter((source) => source.complete).map((source) => source.id);
  const unavailableSources = sources.filter((source) => source.unavailable).map((source) => source.id);

  if (!jira.present && !slack.present && !atena.present && !kyc.present) {
    return {
      ...base,
      route: "lookup_history",
      title: "Consultar antecedentes",
      requiredSources: ["jira", "slack", "atena", "kyc"],
      completedSources,
      unavailableSources
    };
  }

  const slackFinding = bestFinding(slack.records, "slack");
  // Lista 8 is a current retention register. Jira is historical context and
  // cannot be attached to a withdrawal without the movement identity.
  const jiraFinding = hasWithdrawalIdentityFacts(caseRecord.facts)
    ? bestFinding(jira.records, "jira")
    : null;
  const atenaRoute = (withdrawalMatchesCustomerFacts(atena.withdrawal, caseRecord.facts, now)
    || isUnambiguousCurrentWithdrawal(atena, caseRecord.facts, now))
    ? withdrawalRouteFromAtena(atena.withdrawalStatus)
    : null;
  if (!slackFinding && !hasWithdrawalIdentityFacts(caseRecord.facts) && !atenaRoute) {
    return {
      ...base,
      route: "identify_withdrawal",
      title: "Identificar retiro consultado",
      requiredSources: [],
      completedSources,
      unavailableSources,
      reason: "Falta monto o fecha para asociar de forma segura un movimiento o antecedente histórico al retiro consultado.",
      customerMessage: "Para identificar correctamente el retiro que deseas revisar, compárteme el monto y la fecha aproximada en que lo solicitaste."
    };
  }
  const selected = slackFinding || jiraFinding;
  // Atena describes the current operational state. Historical requirements do
  // not make a withdrawal that is already paid look blocked again.
  if (atenaRoute?.route === "withdrawal_paid") {
    return {
      ...base,
      route: atenaRoute.route,
      title: atenaRoute.title,
      source: "atena",
      reason: [atena.summary, selected?.reason].filter(Boolean).join(" · ").slice(0, 1200),
      completedSources,
      unavailableSources,
      customerMessage: atenaRoute.customerMessage
    };
  }
  const conflicting = Boolean(
    slackFinding
    && jiraFinding
    && isSpecificFinding(slackFinding)
    && isSpecificFinding(jiraFinding)
    && slackFinding.route !== jiraFinding.route
  );

  if (conflicting) {
    return {
      ...base,
      route: "source_conflict",
      title: "Resultados diferentes",
      source: "jira+slack_list_8",
      reason: "Jira y Lista 8 indican rutas operativas distintas.",
      completedSources,
      unavailableSources,
      conflicting: true
    };
  }

  if (selected) {
    if (selected.route === "kyc_document_required" && hasHumanCompletedKyc(caseRecord, now)) {
      return {
        ...base,
        route: "kyc_updated_withdrawal_ready",
        title: "KYC actualizado; retiro en continuación",
        source: "slack_list_8+kyc_manual_review",
        sourceReference: selected.reference,
        reason: selected.reason,
        completedSources: [...completedSources, "kyc"],
        unavailableSources,
        customerMessage: "Listo, ya actualizamos tus datos. Voy a compartir tu retiro con el área correspondiente para que continúe su proceso normal. No debería tardar en verse reflejado; te avisaremos si hay alguna actualización."
      };
    }
    const requiredSources = selected.route === "kyc_document_required" ? ["kyc"] : [];
    const documentRequirements = selected.route === "kyc_document_required"
      ? mergeDocumentRequirements(selected.documentRequirements, kyc.documentRequirements)
      : selected.documentRequirements;
    return {
      ...base,
      route: selected.route,
      title: selected.title,
      source: selected.source,
      sourceReference: selected.reference,
      reason: [selected.reason, atena.summary, kyc.summary].filter(Boolean).join(" · ").slice(0, 1200),
      documentRequirements,
      requiredSources,
      completedSources,
      unavailableSources,
      customerMessage: customerMessageForFinding(selected)
    };
  }

  if (kyc.complete && kyc.documentRequirements.length) {
    return {
      ...base,
      route: "kyc_document_required",
      title: "Requisito KYC identificado",
      source: "kyc",
      reason: kyc.summary,
      documentRequirements: kyc.documentRequirements,
      requiredSources: ["kyc"],
      completedSources,
      unavailableSources,
      customerMessage: documentRequestMessage(kyc.documentRequirements)
    };
  }

  if (atenaRoute) {
    return {
      ...base,
      route: atenaRoute.route,
      title: atenaRoute.title,
      source: "atena",
      reason: atena.summary,
      completedSources,
      unavailableSources,
      customerMessage: atenaRoute.customerMessage
    };
  }

  if (unavailableSources.length) {
    return {
      ...base,
      route: "source_unavailable",
      title: "Fuente no disponible",
      source: completedSources.join("+") || "conversation",
      completedSources,
      unavailableSources,
      reason: "No todas las fuentes respondieron con cobertura verificable."
    };
  }

  return {
    ...base,
    route: "withdrawal_not_found",
    title: "Retiro no localizado en antecedentes",
    source: "jira+slack_list_8",
    completedSources,
    unavailableSources,
    reason: "Jira, Lista 8, Atena y KYC terminaron sin evidencia de un retiro vigente con los datos actuales.",
    customerMessage: "No localicé un antecedente exacto con los datos actuales. Necesito confirmar el monto y la fecha aproximada del retiro para continuar."
  };
}

function atenaEvidenceSnapshot(result, now) {
  const present = Boolean(result && typeof result === "object");
  const complete = isCaseToolResultUsable(result, now);
  const withdrawal = complete && result.status === "available"
    ? result?.data?.latestWithdrawal
    : null;
  const withdrawalStatus = clean(withdrawal?.status).toUpperCase();
  return {
    id: "atena",
    present,
    complete,
    unavailable: present && !complete,
    withdrawalStatus,
    withdrawal,
    allWithdrawals: complete && result.status === "available"
      ? (Array.isArray(result?.data?.latestWithdrawals) ? result.data.latestWithdrawals : [withdrawal]).filter(Boolean)
      : [],
    summary: withdrawal
      ? `Atena: retiro ${withdrawalStatus || "SIN ESTADO"}${withdrawal?.date ? ` del ${clean(withdrawal.date)}` : ""}${withdrawal?.amount ? ` por ${clean(withdrawal.amount)}` : ""}.`
      : complete ? "Atena no devolvió un retiro en el periodo consultado." : ""
  };
}

function hasWithdrawalIdentityFacts(facts = {}) {
  return Boolean(normalizeAmount(facts?.amount) && normalizeCustomerDate(facts?.occurredAt));
}

function withdrawalMatchesCustomerFacts(withdrawal = {}, facts = {}, now) {
  const expectedAmount = normalizeAmount(facts?.amount);
  const actualAmount = normalizeAmount(withdrawal?.amount);
  const expectedDate = normalizeCustomerDate(facts?.occurredAt, now);
  const actualDate = normalizeCustomerDate(withdrawal?.date, now);
  return Boolean(expectedAmount && actualAmount && expectedDate && actualDate
    && expectedAmount === actualAmount
    && expectedDate === actualDate);
}

// If there is a single current operational withdrawal, the customer should not
// have to repeat its amount and date merely to receive the verified status.
function isUnambiguousCurrentWithdrawal(atena = {}, facts = {}, now) {
  if (!atena?.complete || !atena.withdrawal || hasWithdrawalIdentityFacts(facts)) return false;
  const status = clean(atena.withdrawalStatus).toUpperCase();
  if (!new Set(["AGUARDANDO APROBACIÓN", "EN ANÁLISIS", "PAGADO", "CANCELADO"]).has(status)) return false;
  const matches = (Array.isArray(atena.allWithdrawals) ? atena.allWithdrawals : [atena.withdrawal])
    .filter((item) => clean(item?.status).toUpperCase() === status);
  return matches.length <= 1 && normalizeCustomerDate(atena.withdrawal?.date, now) === operationalDate(now);
}

function operationalDate(now) {
  const date = new Date(now);
  if (!Number.isFinite(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function normalizeAmount(value) {
  const digits = clean(value).replace(/[^0-9.,]/gu, "").replace(/,/gu, "");
  const amount = Number(digits);
  return Number.isFinite(amount) && amount > 0 ? Math.round(amount * 100) : 0;
}

function normalizeCustomerDate(value, now = new Date().toISOString()) {
  const normalized = normalize(value);
  const base = new Date(now);
  if (!Number.isFinite(base.getTime())) return "";
  if (normalized === "hoy" || normalized === "el dia de hoy") return isoDate(base);
  if (normalized === "ayer") return isoDate(new Date(base.getTime() - 24 * 60 * 60 * 1000));
  const iso = clean(value).match(/\b(\d{4})-(\d{2})-(\d{2})\b/u);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const numeric = normalized.match(/\b(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\b/u);
  if (numeric) {
    const year = Number(numeric[3] || base.getUTCFullYear());
    const fullYear = year < 100 ? 2000 + year : year;
    return `${fullYear.toString().padStart(4, "0")}-${numeric[2].padStart(2, "0")}-${numeric[1].padStart(2, "0")}`;
  }
  const dateMatch = clean(value).match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/u);
  if (!dateMatch) return "";
  return `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
}

function isoDate(value) {
  return value.toISOString().slice(0, 10);
}

function kycEvidenceSnapshot(result, now) {
  const present = Boolean(result && typeof result === "object");
  const complete = isCaseToolResultUsable(result, now);
  const records = complete && result.status === "available"
    ? [
        ...(result?.data?.sources?.users?.results || []),
        ...(result?.data?.sources?.verifications?.results || [])
      ]
    : [];
  const documentRequirements = [];
  if (records.length && records.some((record) => record?.documents?.ineFront !== true)) {
    documentRequirements.push({ key: "ine_front", label: "INE de frente" });
  }
  if (records.length && records.some((record) => record?.documents?.ineBack !== true)) {
    documentRequirements.push({ key: "ine_back", label: "INE del reverso" });
  }
  if (records.length && records.some((record) => record?.documents?.selfie !== true)) {
    documentRequirements.push({ key: "selfie_ine", label: "selfie de validación" });
  }
  const overallStatus = clean(result?.data?.overallStatus);
  return {
    id: "kyc",
    present,
    complete,
    unavailable: present && !complete,
    documentRequirements,
    summary: complete
      ? `KYC: ${overallStatus || result.status}; ${Number(result?.data?.exactMatches?.total || 0)} coincidencias exactas.`
      : ""
  };
}

function withdrawalRouteFromAtena(status) {
  if (status === "PAGADO") return {
    route: "withdrawal_paid",
    title: "Retiro pagado en Atena",
    customerMessage: "Atena muestra el retiro como pagado. Un agente revisará el expediente antes de confirmar la respuesta final."
  };
  if (status === "EN ANÁLISIS") return {
    route: "withdrawal_in_analysis",
    title: "Retiro en análisis",
    customerMessage: "Atena muestra el retiro en análisis. Revisaré si existe un antecedente que explique el seguimiento."
  };
  if (status === "AGUARDANDO APROBACIÓN") return {
    route: "withdrawal_awaiting_approval",
    title: "Retiro aguardando aprobación",
    customerMessage: "El retiro permanece pendiente de revisión y aprobación. Por ahora no se requiere ninguna acción adicional del cliente."
  };
  if (status === "CANCELADO") return {
    route: "withdrawal_cancelled",
    title: "Retiro cancelado",
    customerMessage: "Atena muestra el retiro cancelado. Revisaré el antecedente y el motivo confirmado antes de indicarte el siguiente paso."
  };
  return null;
}

function mergeDocumentRequirements(...groups) {
  const byKey = new Map();
  for (const item of groups.flat()) {
    const key = clean(item?.key);
    const label = clean(item?.label);
    if (key && label) byKey.set(key, { key, label });
  }
  return [...byKey.values()];
}

function sourceSnapshot(result, id, now) {
  const present = Boolean(result && typeof result === "object");
  const usable = isCaseToolResultUsable(result, now);
  const status = clean(result?.status);
  const records = usable && status === "available" && Array.isArray(result?.data?.records)
    ? result.data.records.filter((record) => id !== "slack" || clean(record?.listId) === SLACK_LIST_8_ID)
    : [];
  return {
    id,
    present,
    status,
    records,
    complete: usable,
    unavailable: present && !usable
  };
}

function bestFinding(records = [], source) {
  const findings = records.map((record) => findingFromRecord(record, source)).filter(Boolean);
  return findings.sort((left, right) => right.rank - left.rank)[0] || null;
}

function findingFromRecord(record = {}, source) {
  const reason = source === "slack"
    ? clean(`${record?.untrustedContent?.reason || ""} ${record?.untrustedContent?.note || ""} ${record?.status || ""}`)
    : clean(`${record?.untrustedContent?.summary || ""} ${record?.untrustedContent?.description || ""} ${record?.untrustedContent?.latestComment || ""} ${record?.status || ""}`);
  const normalized = normalize(reason);
  if (!normalized) return null;
  const reference = clean(source === "slack" ? record?.recordId : record?.ticketKey);
  const sourceName = source === "slack" ? "slack_list_8" : "jira";
  const documentRequirements = extractDocumentRequirements(normalized);

  if (KYC_PATTERN.test(normalized)) {
    return finding("kyc_document_required", "Requisito KYC identificado", sourceName, reference, reason, documentRequirements, 100);
  }
  if (WALLET_PATTERN.test(normalized)) {
    return finding("wallet_review", "Revisión de política Wallet", sourceName, reference, reason, [], 90);
  }
  if (BANK_PATTERN.test(normalized)) {
    return finding("bank_rejection", "Motivo bancario identificado", sourceName, reference, reason, [], 80);
  }
  if (TECHNICAL_PATTERN.test(normalized)) {
    return finding("technical_withdrawal", "Incidencia técnica identificada", sourceName, reference, reason, [], 70);
  }
  if (source === "slack" || REVIEW_PATTERN.test(normalized)) {
    return finding(
      source === "slack" ? "retention_reason_found" : "jira_followup_found",
      source === "slack" ? "Motivo de retención localizado" : "Seguimiento Jira localizado",
      sourceName,
      reference,
      reason,
      [],
      50
    );
  }
  return null;
}

function extractDocumentRequirements(text) {
  const requirements = DOCUMENT_REQUIREMENTS
    .filter(([, pattern]) => pattern.test(text))
    .map(([key, , label]) => ({ key, label }));
  const hasSpecificIneSide = requirements.some((item) => ["ine_front", "ine_back"].includes(item.key));
  return requirements.filter((item) => item.key !== "official_id" || !hasSpecificIneSide);
}

function finding(route, title, source, reference, reason, documentRequirements, rank) {
  return { route, title, source, reference, reason: reason.slice(0, 1200), documentRequirements, rank };
}

function isSpecificFinding(value) {
  return !new Set(["retention_reason_found", "jira_followup_found"]).has(value?.route);
}

function customerMessageForFinding(finding) {
  if (finding.route === "kyc_document_required") {
    return documentRequestMessage(finding.documentRequirements);
  }
  if (finding.route === "bank_rejection") {
    return "Localicé el seguimiento de tu retiro y revisaré contigo el motivo bancario registrado."
  }
  if (finding.route === "wallet_review") {
    return "Localicé el seguimiento de tu retiro y se encuentra relacionado con una revisión de política Wallet."
  }
  if (finding.route === "technical_withdrawal") {
    return "Localicé una incidencia técnica relacionada con tu retiro y revisaré el seguimiento confirmado."
  }
  return "Localicé tu retiro en Lista 8. Revisaré el motivo y estado registrados para darte el siguiente paso correcto."
}

function documentRequestMessage(requirements = []) {
  const keys = new Set(requirements.map((item) => clean(item?.key || item)).filter(Boolean));
  // In Lista 8, "INE" can be combined with older wording about a selfie. The
  // current support flow starts with the two sides of the official ID; KYC is
  // then confirmed by a human before any additional request is made.
  if (keys.has("ine_front") || keys.has("ine_back") || keys.has("official_id")) {
    return "Para continuar con la revisión, por favor envíanos una foto clara de tu INE por ambos lados y una selfie sosteniendo tu INE. En cuanto recibamos las imágenes, validaremos tus datos para continuar con tu solicitud.";
  }
  if (keys.has("selfie_ine")) {
    return "Ya revisé el seguimiento de tu retiro. Para continuar, por favor envíame una selfie clara para validar tu identidad. En cuanto la recibamos, seguimos con la revisión.";
  }
  const requirement = naturalList(requirements);
  return requirement
    ? `Ya revisé el seguimiento de tu retiro. Para continuar, por favor compárteme ${requirement}. En cuanto lo recibamos, seguimos con la revisión.`
    : "Ya revisé el seguimiento de tu retiro. Necesito validar tu identidad antes de continuar; por favor comparte una identificación oficial vigente.";
}

function hasHumanCompletedKyc(caseRecord, now) {
  const review = caseRecord.systemFacts?.caseKycReview;
  return isCaseToolResultUsable(review, now)
    && clean(review?.data?.record?.status).toLowerCase() === "complete"
    && review?.data?.record?.reviewedByHuman === true;
}

function action(type, message, requiresHumanApproval, checks = []) {
  return { type, message, checks, requiresHumanApproval };
}

function naturalList(items) {
  const labels = items.map((item) => clean(item?.label || item)).filter(Boolean);
  if (labels.length < 2) return labels[0] || "";
  return `${labels.slice(0, -1).join(", ")} y ${labels.at(-1)}`;
}

function normalize(value) {
  return clean(value).normalize("NFD").replace(/[\u0300-\u036f]/gu, "").toLowerCase();
}

function clean(value) {
  return String(value || "").replace(/\s+/gu, " ").trim();
}

function validIso(value) {
  const text = String(value || "").trim();
  return text && Number.isFinite(Date.parse(text)) ? new Date(text).toISOString() : "";
}
