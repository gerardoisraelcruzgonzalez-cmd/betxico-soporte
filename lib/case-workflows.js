const COMMON_REFERENCE = requiredField(
  "customerReference",
  "correo o AUTH ID",
  "¿Me confirmas el correo registrado o tu AUTH ID?"
);

export const SUPPORT_CASE_WORKFLOWS = [
  workflow({
    id: "account_closure",
    category: "account_safety",
    riskLevel: "high",
    humanApproval: true,
    signals: [
      signal(/\b(?:cerrar|eliminar|cancelar|dar de baja|bloquear)\b.{0,35}\bcuenta\b/u, 14, "solicitud de cierre"),
      signal(/\bauto\s?exclusion\b|\bludopatia\b/u, 16, "autoexclusion")
    ],
    requiredCustomerData: [
      COMMON_REFERENCE,
      requiredField("explicitClosureConsent", "confirmacion explicita", "¿Confirmas que solicitas el cierre de la cuenta y si debe ser definitivo?")
    ],
    systemChecks: ["cierres o autoexclusiones previas", "operaciones pendientes", "bloqueo en sistemas relacionados"]
  }),
  workflow({
    id: "devwallet",
    category: "transactions",
    riskLevel: "high",
    humanApproval: true,
    signals: [
      signal(/\bdev\s?wallet\b|\bdevwallet[123]?\b/u, 18, "Devolucion Wallet"),
      signal(/\bdeposit(?:o|e)\b.{0,70}\b(?:sin jugar|por error|duplicado)\b.{0,70}\breti(?:ro|rar)\b/u, 14, "deposito sin juego"),
      signal(/\breti(?:ro|rar)\b.{0,70}\bdeposit(?:o|e)\b.{0,70}\b(?:sin jugar|por error|duplicado)\b/u, 14, "retiro de deposito no jugado")
    ],
    requiredCustomerData: [
      COMMON_REFERENCE,
      requiredField("amount", "monto", "¿Cuál es el monto del depósito y del retiro?"),
      requiredField("accountOwnership", "titularidad de las cuentas", "¿La cuenta de depósito y la de retiro están a tu nombre?")
    ],
    systemChecks: ["cuenta y titular de deposito", "cuenta y titular de retiro", "actividad de juego", "politica y aprobacion de Transacciones"]
  }),
  workflow({
    id: "bank_account",
    category: "bank_account",
    riskLevel: "high",
    humanApproval: true,
    signals: [
      signal(/\b(?:eliminar|borrar|quitar|cambiar|actualizar|registrar|agregar|nueva)\b.{0,45}\b(?:clabe|cuenta bancaria)\b/u, 15, "cambio de CLABE"),
      signal(/\b(?:clabe|cuenta bancaria)\b.{0,45}\b(?:eliminar|borrar|quitar|cambiar|actualizar|registrar|agregar|nueva)\b/u, 15, "cambio de CLABE")
    ],
    requiredCustomerData: [
      COMMON_REFERENCE,
      requiredField("maskedBankAccount", "cuenta enmascarada", "¿Qué cuenta deseas eliminar o cambiar? Compárteme sólo los últimos cuatro dígitos.")
    ],
    systemChecks: ["retiros activos vinculados", "titularidad", "confirmacion posterior de eliminacion"]
  }),
  workflow({
    id: "kyc_identity",
    category: "kyc",
    riskLevel: "high",
    humanApproval: true,
    signals: [
      signal(/\bkyc\b|\bine\b|\bselfie\b|\bverific(?:ar|acion)\b/u, 10, "verificacion KYC"),
      signal(/\bidentidad\b|\bdatos no coinciden\b|\bnombre.{0,20}diferente\b/u, 12, "inconsistencia de identidad"),
      signal(/\bcomprobante de domicilio\b|\bdomicilio\b.{0,30}\b(?:calle|numero|incompleto)\b/u, 12, "validacion de domicilio"),
      signal(/\bdocumentos?\b.{0,35}\bretiro\b|\bretiro\b.{0,35}\bdocumentos?\b/u, 9, "documentos para retiro")
    ],
    requiredCustomerData: [
      COMMON_REFERENCE,
      requiredField("kycReason", "faltante exacto de verificacion", "¿Qué documento o mensaje de verificación aparece pendiente?")
    ],
    systemChecks: ["estado actual en KYC", "consulta de evidencia KYC", "documentos ya recibidos", "revision humana"]
  }),
  workflow({
    id: "sports_bet",
    category: "sports",
    riskLevel: "high",
    humanApproval: true,
    signals: [
      signal(/\bapuesta(?:s)? deportiva(?:s)?\b|\bfirst\s?sports\b/u, 14, "apuesta deportiva"),
      signal(/\bboleto\b.{0,35}\bapuesta\b|\bapuesta\b.{0,35}\bboleto\b/u, 10, "boleto deportivo"),
      signal(/\b(?:partido|evento deportivo)\b.{0,50}\bapuesta\b/u, 9, "evento deportivo")
    ],
    requiredCustomerData: [
      COMMON_REFERENCE,
      requiredField("sportsTicket", "boleto o evento", "¿Qué boleto o evento deportivo estás reportando?"),
      requiredField("amount", "monto", "¿Cuál fue el monto de la apuesta?"),
      requiredField("occurredAt", "fecha u hora", "¿En qué fecha y hora aproximada realizaste la apuesta?"),
      requiredField("movementEvidence", "historial y movimientos", "Envíame captura del boleto, historial de apuestas y movimientos.")
    ],
    systemChecks: ["movimientos en Atena", "boleto en First Sports", "diferencias entre fuentes"]
  }),
  workflow({
    id: "casino_win_missing",
    category: "casino",
    riskLevel: "high",
    humanApproval: true,
    signals: [
      signal(/\bganancia\b.{0,40}\b(?:no|sin)\b.{0,25}\b(?:reflejar|acreditar|aparecer|pagar)\b/u, 16, "ganancia no reflejada"),
      signal(/\b(?:no me pago|no pag[oó]|premio no aparece|pending win)\b/u, 16, "premio pendiente"),
      signal(/\b(?:saldo|dinero)\b.{0,35}\b(?:descontado|faltante|quito|quit[oó])\b.{0,35}\bjuego\b/u, 12, "saldo afectado en juego")
    ],
    requiredCustomerData: [
      COMMON_REFERENCE,
      requiredField("gameName", "nombre del juego", "¿Cuál es el nombre exacto del juego?"),
      requiredField("occurredAt", "fecha u hora", "¿En qué fecha y hora aproximada ocurrió?"),
      requiredField("amount", "apuesta o ganancia", "¿Cuál fue el monto de la apuesta y la ganancia esperada?"),
      requiredField("movementEvidence", "historial o movimientos", "Envíame captura del historial del juego y de los movimientos.")
    ],
    systemChecks: ["sesion y ronda en BoB", "Pending Win", "saldo antes y despues", "resultado del proveedor"]
  }),
  workflow({
    id: "game_access",
    category: "casino",
    riskLevel: "medium",
    humanApproval: true,
    signals: [
      signal(/\bjuego\b.{0,45}\b(?:no abre|no carga|se traba|trabado|pantalla negra|me saca|me expulsa|se cierra|no inicia|no entra|queda cargando|se queda pensando|no funciona)\b/u, 14, "juego inaccesible"),
      signal(/\b(?:no puedo jugar|no me deja jugar|pantalla negra|no puedo entrar|no me deja entrar|me manda al inicio|me regresa|se congela|se queda cargando)\b/u, 12, "problema de acceso al juego"),
      signal(/\b(?:error|falla|problema|bug)\b.{0,35}\b(?:casino|slot|tragamonedas|juego)\b|\b(?:casino|slot|tragamonedas|juego)\b.{0,35}\b(?:error|falla|problema|bug)\b/u, 9, "error de casino")
    ],
    requiredCustomerData: [
      COMMON_REFERENCE,
      requiredField("gameName", "nombre del juego", "¿Cuál es el nombre exacto del juego?"),
      requiredField("accessChannel", "app o navegador", "¿El problema ocurre en la app o en un navegador?"),
      requiredField("currentEvidence", "captura o video actual", "Envíame una captura o video actual del error.")
    ],
    systemChecks: ["sesiones exactas en BoB", "estado rojo, azul, gris o verde", "Pending Win antes de cualquier cierre"]
  }),
  workflow({
    id: "withdrawal",
    category: "withdrawals",
    riskLevel: "high",
    humanApproval: true,
    signals: [
      signal(/\bretiro\b|\bretirar\b/u, 9, "retiro"),
      signal(/\b(?:pagado|rechazado|devuelto|failed|congelado)\b.{0,35}\b(?:banco|transferencia|retiro)\b/u, 8, "estado de retiro"),
      signal(/\berror\s*403\b/u, 12, "error 403")
    ],
    requiredCustomerData: [
      COMMON_REFERENCE,
      requiredField("amount", "monto", "¿Cuál es el monto del retiro?"),
      requiredField("occurredAt", "fecha", "¿En qué fecha solicitaste el retiro?"),
      requiredField("withdrawalStatus", "estado mostrado", "¿Qué estado o mensaje muestra el retiro?")
    ],
    systemChecks: ["estado en Atena", "estado del procesador", "rechazo o devolucion", "ticket principal y duplicados"]
  }),
  workflow({
    id: "deposit",
    category: "deposits",
    riskLevel: "high",
    humanApproval: true,
    signals: [
      signal(/\bdeposit(?:o|e|ar)\b|\bspei\b|\bcep\b|\bmexpago\b/u, 8, "deposito"),
      signal(/\btransferencia\b.{0,35}\b(?:no llego|no aparece|no refleja)\b/u, 11, "transferencia no reflejada"),
      signal(/\bdoble cargo\b|\bdos cargos\b/u, 14, "doble cargo")
    ],
    requiredCustomerData: [
      COMMON_REFERENCE,
      requiredField("amount", "monto", "¿Cuál es el monto del depósito o cargo?"),
      requiredField("occurredAt", "fecha u hora", "¿En qué fecha y hora se realizó?"),
      requiredField("paymentEvidence", "comprobante completo", "Envíame el comprobante completo o los cargos del banco."),
      requiredField("paymentReference", "clave o referencia", "¿Cuál es la clave de rastreo, CEP o referencia del procesador?")
    ],
    systemChecks: ["CEP o procesador", "deposito en Atena", "conciliacion financiera"]
  }),
  workflow({
    id: "bonus_rollover",
    category: "bonuses",
    riskLevel: "medium",
    humanApproval: true,
    signals: [
      signal(/\bbono\b|\bpromocion\b|\brollover\b|\bcashback\b|\bfreebet\b/u, 9, "bono o rollover"),
      signal(/\b(?:activar|aplicar|usar|recibir|obtener|cumplir|liberar)\b.{0,55}\b(?:bono|promocion|rollover)\b|\b(?:bono|promocion|rollover)\b.{0,55}\b(?:activar|aplicar|usar|recibir|obtener|cumplir|liberar|retirar)\b/u, 12, "consulta principal de promocion"),
      signal(/\b(?:diez|10)\s*(?:por\s*ciento|%)\b/u, 10, "promocion del diez por ciento"),
      signal(/\bsaldo restringido\b/u, 10, "saldo restringido")
    ],
    requiredCustomerData: [
      COMMON_REFERENCE,
      requiredField("promotion", "promocion o bono", "¿Qué promoción o bono estás consultando?"),
      requiredField("amount", "monto del deposito", "¿Cuál fue el monto del depósito relacionado?")
    ],
    systemChecks: ["elegibilidad", "promocion vigente", "bono aplicado", "restriccion real de retiro", "tickets previos"]
  }),
  workflow({
    id: "ticket_followup",
    category: "follow_up",
    riskLevel: "low",
    humanApproval: false,
    signals: [
      signal(/\bbtf-\d+\b/u, 14, "clave Jira"),
      signal(/\b(?:seguimiento|estatus|estado)\b.{0,35}\b(?:ticket|reporte|caso|folio)\b/u, 10, "seguimiento de ticket"),
      signal(/\b(?:ticket|reporte|caso|folio)\b.{0,35}\b(?:seguimiento|estatus|estado)\b/u, 10, "seguimiento de ticket")
    ],
    requiredCustomerData: [
      COMMON_REFERENCE,
      requiredField("ticketKey", "clave del ticket", "¿Cuál es la clave BTF del reporte?")
    ],
    systemChecks: ["ticket principal", "ultimo estado confirmado", "accion ejecutada o solicitada"]
  })
];

export const UNKNOWN_SUPPORT_CASE_WORKFLOW = workflow({
  id: "unknown",
  category: "unclassified",
  riskLevel: "medium",
  humanApproval: true,
  signals: [],
  requiredCustomerData: [
    requiredField("issueSummary", "descripcion del problema", "Cuéntame qué ocurrió y qué resultado esperabas.")
  ],
  systemChecks: []
});

export function classifySupportCase(text) {
  const normalized = normalizeForSearch(text);
  let best = null;

  for (const definition of SUPPORT_CASE_WORKFLOWS) {
    const matches = definition.signals.filter((item) => item.pattern.test(normalized));
    const score = matches.reduce((total, item) => total + item.weight, 0);
    if (!score) continue;
    if (!best || score > best.score) best = { definition, score, matches };
  }

  if (!best) {
    return {
      workflow: UNKNOWN_SUPPORT_CASE_WORKFLOW,
      confidence: 0,
      matchedSignals: []
    };
  }

  return {
    workflow: best.definition,
    confidence: clampConfidence(0.55 + Math.min(0.4, best.score / 30)),
    matchedSignals: [...new Set(best.matches.map((item) => item.label))].slice(0, 6)
  };
}

export function deriveCaseFacts(text, customer) {
  const normalized = normalizeForSearch(text);
  const gameMatch = text.match(
    /(?:juego(?:\s+se\s+llama)?|en\s+el\s+juego)\s+([A-Za-z0-9][A-Za-z0-9 '&._-]{2,50}?)(?=\s+(?:no|me|se|que|y|desde|aparece|marca)\b|[,.!?]|$)/iu
  );
  const amountMatch = text.match(/(?:\$|mxn\s*)\s*([0-9][0-9.,]{0,12})|([0-9][0-9.,]{0,12})\s*(?:pesos|mxn)\b/iu);
  const ticketMatch = text.match(/\bBTF-\d+\b/iu);
  const occurredAtMatch = text.match(
    /\b(?:hoy|ayer|antier|anoche|\d{1,2}:\d{2}(?:\s*[ap]\.?m\.?)?|\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\b/iu
  );

  return {
    customerReference: Boolean(customer.email || customer.authId || customer.liveChatCustomerId),
    issueSummary: normalized.length >= 8,
    explicitClosureConsent: /\bquiero\b.{0,25}\b(?:cerrar|eliminar|cancelar|dar de baja|bloquear)\b.{0,20}\bcuenta\b/u.test(normalized),
    accountOwnership: /\b(?:misma cuenta|mi cuenta|a mi nombre|mismo titular|soy el titular)\b/u.test(normalized),
    maskedBankAccount: /\b(?:terminacion|termina en|ultimos cuatro)\s*\d{4}\b/u.test(normalized),
    kycReason: /\b(?:mensaje|error|falta|pendiente|no coincide|diferente|domicilio|calle|numero|ine|selfie)\b/u.test(normalized),
    sportsTicket: /\b(?:boleto|ticket de apuesta|evento|partido)\b/u.test(normalized),
    movementEvidence: /\b(?:historial|movimientos|ronda|boleto|captura del juego)\b/u.test(normalized),
    currentEvidence: /\b(?:captura|video|imagen|pantallazo|archivo adjunto)\b/u.test(normalized),
    paymentEvidence: /\b(?:comprobante|cep|estado de cuenta|captura del banco|dos cargos)\b/u.test(normalized),
    paymentReference: /\b(?:clave de rastreo|cep|referencia|mexpago)\b/u.test(normalized),
    accessChannel: /\b(?:app|aplicacion|chrome|safari|firefox|navegador|web|android|iphone|ios)\b/u.test(normalized),
    withdrawalStatus: /\b(?:pendiente|pagado|rechazado|devuelto|failed|congelado|error\s*403|en revision)\b/u.test(normalized),
    promotion: /\b(?:bono|promocion|rollover|cashback|freebet|bienvenida)\b/u.test(normalized),
    amount: clean(amountMatch?.[1] || amountMatch?.[2]).slice(0, 24),
    gameName: clean(gameMatch?.[1]).slice(0, 80),
    ticketKey: clean(ticketMatch?.[0]).toUpperCase(),
    occurredAt: clean(occurredAtMatch?.[0]).slice(0, 40)
  };
}

export function normalizeSystemCheckKey(value) {
  return normalizeForSearch(value).replace(/[^a-z0-9]+/gu, "_").replace(/^_+|_+$/gu, "");
}

export function normalizeForSearch(value) {
  return clean(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLowerCase();
}

function workflow(input) {
  return {
    id: input.id,
    category: input.category,
    riskLevel: input.riskLevel,
    humanApproval: input.humanApproval === true,
    signals: input.signals || [],
    requiredCustomerData: input.requiredCustomerData || [],
    systemChecks: input.systemChecks || []
  };
}

function signal(pattern, weight, label) {
  return { pattern, weight, label };
}

function requiredField(key, label, question) {
  return { key, label, question };
}

function clampConfidence(value) {
  return Math.round(Math.max(0, Math.min(1, Number(value) || 0)) * 100) / 100;
}

function clean(value) {
  return String(value || "").replace(/\u0000/gu, "").replace(/\s+/gu, " ").trim();
}
