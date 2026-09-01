const elements = {
  connectionState: document.getElementById("connectionState"),
  screenTitle: document.getElementById("screenTitle"),
  screenSubtitle: document.getElementById("screenSubtitle"),
  customerName: document.getElementById("customerName"),
  customerEmail: document.getElementById("customerEmail"),
  authId: document.getElementById("authId"),
  chatId: document.getElementById("chatId"),
  customerAvatar: document.getElementById("customerAvatar"),
  customerDisplayName: document.getElementById("customerDisplayName"),
  customerProfileStatus: document.getElementById("customerProfileStatus"),
  customerKycBadge: document.getElementById("customerKycBadge"),
  customerJiraPanel: document.getElementById("customerJiraPanel"),
  customerJiraStatus: document.getElementById("customerJiraStatus"),
  customerJiraCount: document.getElementById("customerJiraCount"),
  customerJiraResults: document.getElementById("customerJiraResults"),
  customerSlackPanel: document.getElementById("customerSlackPanel"),
  customerSlackStatus: document.getElementById("customerSlackStatus"),
  customerSlackCount: document.getElementById("customerSlackCount"),
  customerSlackResults: document.getElementById("customerSlackResults"),
  kycLookupPanel: document.getElementById("kycLookupPanel"),
  kycActionPanel: document.getElementById("kycActionPanel"),
  kycLookupBtn: document.getElementById("kycLookupBtn"),
  kycLookupStatus: document.getElementById("kycLookupStatus"),
  kycLookupResults: document.getElementById("kycLookupResults"),
  atenaLookupBtn: document.getElementById("atenaLookupBtn"),
  atenaLookupStatus: document.getElementById("atenaLookupStatus"),
  atenaLookupResults: document.getElementById("atenaLookupResults"),
  atenaLookupPanel: document.getElementById("atenaLookupPanel"),
  openOperationalCaseBtn: document.getElementById("openOperationalCaseBtn"),
  caseAgentPanel: document.getElementById("caseAgentPanel"),
  caseAgentWorkflow: document.getElementById("caseAgentWorkflow"),
  caseAgentState: document.getElementById("caseAgentState"),
  caseAgentNextAction: document.getElementById("caseAgentNextAction"),
  caseAgentEvidence: document.getElementById("caseAgentEvidence"),
  caseAgentSources: document.getElementById("caseAgentSources"),
  caseEvidencePanel: document.getElementById("caseEvidencePanel"),
  caseEvidenceCount: document.getElementById("caseEvidenceCount"),
  caseEvidenceList: document.getElementById("caseEvidenceList"),
  caseEvidenceStatus: document.getElementById("caseEvidenceStatus"),
  caseEvidenceReviewBtn: document.getElementById("caseEvidenceReviewBtn"),
  caseDraftPanel: document.getElementById("caseDraftPanel"),
  caseDraftGenerateBtn: document.getElementById("caseDraftGenerateBtn"),
  caseDraftStatus: document.getElementById("caseDraftStatus"),
  caseDraftOutput: document.getElementById("caseDraftOutput"),
  caseDraftAnalysis: document.getElementById("caseDraftAnalysis"),
  caseDraftNextStep: document.getElementById("caseDraftNextStep"),
  caseDraftCustomerText: document.getElementById("caseDraftCustomerText"),
  caseDraftSources: document.getElementById("caseDraftSources"),
  caseDraftWarnings: document.getElementById("caseDraftWarnings"),
  caseDraftUseBtn: document.getElementById("caseDraftUseBtn"),
  caseActionForm: document.getElementById("caseActionForm"),
  caseActionType: document.getElementById("caseActionType"),
  caseActionTargetLabel: document.getElementById("caseActionTargetLabel"),
  caseActionTargetTitle: document.getElementById("caseActionTargetTitle"),
  caseActionTarget: document.getElementById("caseActionTarget"),
  caseActionText: document.getElementById("caseActionText"),
  caseActionSnapshot: document.getElementById("caseActionSnapshot"),
  caseActionSnapshotState: document.getElementById("caseActionSnapshotState"),
  caseActionSnapshotType: document.getElementById("caseActionSnapshotType"),
  caseActionSnapshotTarget: document.getElementById("caseActionSnapshotTarget"),
  caseActionSnapshotText: document.getElementById("caseActionSnapshotText"),
  caseActionSnapshotMeta: document.getElementById("caseActionSnapshotMeta"),
  caseActionStatus: document.getElementById("caseActionStatus"),
  caseActionProposeBtn: document.getElementById("caseActionProposeBtn"),
  caseActionApproveBtn: document.getElementById("caseActionApproveBtn"),
  caseActionExecuteBtn: document.getElementById("caseActionExecuteBtn"),
  caseActionRejectBtn: document.getElementById("caseActionRejectBtn"),
  ticketDestination: document.getElementById("ticketDestination"),
  issueType: document.getElementById("issueType"),
  caseFields: document.getElementById("caseFields"),
  slackFields: document.getElementById("slackFields"),
  slackAgentField: document.getElementById("slackAgentField"),
  slackAgentName: document.getElementById("slackAgentName"),
  slackCustomerIdField: document.getElementById("slackCustomerIdField"),
  slackCustomerId: document.getElementById("slackCustomerId"),
  slackCustomerEmailField: document.getElementById("slackCustomerEmailField"),
  slackCustomerEmail: document.getElementById("slackCustomerEmail"),
  slackGameField: document.getElementById("slackGameField"),
  slackGame: document.getElementById("slackGame"),
  slackTrackingKeyField: document.getElementById("slackTrackingKeyField"),
  slackTrackingKey: document.getElementById("slackTrackingKey"),
  slackAmountField: document.getElementById("slackAmountField"),
  slackAmount: document.getElementById("slackAmount"),
  slackDetailField: document.getElementById("slackDetailField"),
  slackDetail: document.getElementById("slackDetail"),
  slackMessagePreviewField: document.getElementById("slackMessagePreviewField"),
  slackMessagePreview: document.getElementById("slackMessagePreview"),
  jiraFields: document.getElementById("jiraFields"),
  jiraDetailsSection: document.getElementById("jiraDetailsSection"),
  ticketTab: document.getElementById("ticketTab"),
  settingsTab: document.getElementById("settingsTab"),
  searchView: document.getElementById("searchView"),
  searchForm: document.getElementById("searchForm"),
  ticketSearchInput: document.getElementById("ticketSearchInput"),
  clearSearchBtn: document.getElementById("clearSearchBtn"),
  replyInput: document.getElementById("replyInput"),
  detectReplyBtn: document.getElementById("detectReplyBtn"),
  clearReplyBtn: document.getElementById("clearReplyBtn"),
  replySuggestion: document.getElementById("replySuggestion"),
  quickDepositBtn: document.getElementById("quickDepositBtn"),
  quickDepositForm: document.getElementById("quickDepositForm"),
  quickDepositPreview: document.getElementById("quickDepositPreview"),
  quickDepositTrackingKey: document.getElementById("quickDepositTrackingKey"),
  quickDepositAmount: document.getElementById("quickDepositAmount"),
  quickDepositEvidence: document.getElementById("quickDepositEvidence"),
  quickDepositAttachmentList: document.getElementById("quickDepositAttachmentList"),
  quickDepositCancelBtn: document.getElementById("quickDepositCancelBtn"),
  quickDepositSubmitBtn: document.getElementById("quickDepositSubmitBtn"),
  quickIneBtn: document.getElementById("quickIneBtn"),
  quickIneForm: document.getElementById("quickIneForm"),
  quickInePreview: document.getElementById("quickInePreview"),
  quickIneNotifyWithdrawal: document.getElementById("quickIneNotifyWithdrawal"),
  quickIneWithdrawalFields: document.getElementById("quickIneWithdrawalFields"),
  quickIneWithdrawalDate: document.getElementById("quickIneWithdrawalDate"),
  quickIneWithdrawalAmount: document.getElementById("quickIneWithdrawalAmount"),
  quickIneEvidence: document.getElementById("quickIneEvidence"),
  quickIneAttachmentList: document.getElementById("quickIneAttachmentList"),
  quickIneCancelBtn: document.getElementById("quickIneCancelBtn"),
  quickIneSubmitBtn: document.getElementById("quickIneSubmitBtn"),
  traceabilityBtn: document.getElementById("traceabilityBtn"),
  closeSessionsBtn: document.getElementById("closeSessionsBtn"),
  closeSessionsForm: document.getElementById("closeSessionsForm"),
  closeSessionsCustomerId: document.getElementById("closeSessionsCustomerId"),
  closeSessionsReportedGame: document.getElementById("closeSessionsReportedGame"),
  closeSessionsCustomerName: document.getElementById("closeSessionsCustomerName"),
  closeSessionsCustomerEmail: document.getElementById("closeSessionsCustomerEmail"),
  closeSessionsSubmitBtn: document.getElementById("closeSessionsSubmitBtn"),
  closeSessionsCancelBtn: document.getElementById("closeSessionsCancelBtn"),
  closeSessionsStatus: document.getElementById("closeSessionsStatus"),
  bobSessionsPanel: document.getElementById("bobSessionsPanel"),
  bobSessionsBackBtn: document.getElementById("bobSessionsBackBtn"),
  bobHistoryRefreshBtn: document.getElementById("bobHistoryRefreshBtn"),
  bobSessionsQueue: document.getElementById("bobSessionsQueue"),
  bobSessionsHistory: document.getElementById("bobSessionsHistory"),
  kycEmailInput: document.getElementById("kycEmailInput"),
  openKycSearchBtn: document.getElementById("openKycSearchBtn"),
  kycCompleteBtn: document.getElementById("kycCompleteBtn"),
  kycIncompleteBtn: document.getElementById("kycIncompleteBtn"),
  kycStatusBadge: document.getElementById("kycStatusBadge"),
  dashboardSettingsBtn: document.getElementById("dashboardSettingsBtn"),
  traceabilityPanel: document.getElementById("traceabilityPanel"),
  traceabilityCloseBtn: document.getElementById("traceabilityCloseBtn"),
  traceabilityDepositFile: document.getElementById("traceabilityDepositFile"),
  traceabilityDepositText: document.getElementById("traceabilityDepositText"),
  traceabilityWithdrawalFile: document.getElementById("traceabilityWithdrawalFile"),
  traceabilityWithdrawalText: document.getElementById("traceabilityWithdrawalText"),
  traceabilityRunBtn: document.getElementById("traceabilityRunBtn"),
  traceabilityDownloadCsvBtn: document.getElementById("traceabilityDownloadCsvBtn"),
  traceabilityDownloadExcelBtn: document.getElementById("traceabilityDownloadExcelBtn"),
  traceabilityStatus: document.getElementById("traceabilityStatus"),
  traceabilitySummary: document.getElementById("traceabilitySummary"),
  traceabilityResults: document.getElementById("traceabilityResults"),
  liveChatAutomationPanel: document.getElementById("liveChatAutomationPanel"),
  liveChatWelcomePreview: document.getElementById("liveChatWelcomePreview"),
  sendWelcomeBtn: document.getElementById("sendWelcomeBtn"),
  liveChatAutomationStatus: document.getElementById("liveChatAutomationStatus"),
  searchTicketBtn: document.getElementById("searchTicketBtn"),
  searchResults: document.getElementById("searchResults"),
  newTicketBtn: document.getElementById("newTicketBtn"),
  ticketForm: document.getElementById("ticketForm"),
  settingsView: document.getElementById("settingsView"),
  loginForm: document.getElementById("loginForm"),
  slackLoginBtn: document.getElementById("slackLoginBtn"),
  accountForm: document.getElementById("accountForm"),
  accountDisplayName: document.getElementById("accountDisplayName"),
  accountEmail: document.getElementById("accountEmail"),
  accountPin: document.getElementById("accountPin"),
  jiraEmail: document.getElementById("jiraEmail"),
  jiraApiToken: document.getElementById("jiraApiToken"),
  reporterAccountId: document.getElementById("reporterAccountId"),
  defaultAssigneeAccountId: document.getElementById("defaultAssigneeAccountId"),
  defaultLabels: document.getElementById("defaultLabels"),
  traceabilitySettingsBtn: document.getElementById("traceabilitySettingsBtn"),
  slackUserConnectBtn: document.getElementById("slackUserConnectBtn"),
  slackUserStatus: document.getElementById("slackUserStatus"),
  logoutBtn: document.getElementById("logoutBtn"),
  adminConfigForm: document.getElementById("adminConfigForm"),
  reloadSupportConfigBtn: document.getElementById("reloadSupportConfigBtn"),
  addAttachmentBtn: document.getElementById("addAttachmentBtn"),
  attachmentInput: document.getElementById("attachmentInput"),
  attachmentDropzone: document.getElementById("attachmentDropzone"),
  attachmentList: document.getElementById("attachmentList"),
  clearBtn: document.getElementById("clearBtn"),
  form: document.getElementById("ticketForm"),
  submitBtn: document.getElementById("submitBtn"),
  result: document.getElementById("result"),
  agentAlertOverlay: document.getElementById("agentAlertOverlay"),
  agentAlertSeverity: document.getElementById("agentAlertSeverity"),
  agentAlertTitle: document.getElementById("agentAlertTitle"),
  agentAlertMessage: document.getElementById("agentAlertMessage"),
  agentAlertAckBtn: document.getElementById("agentAlertAckBtn"),
  kycDocumentOverlay: document.getElementById("kycDocumentOverlay"),
  kycDocumentTitle: document.getElementById("kycDocumentTitle"),
  kycDocumentImage: document.getElementById("kycDocumentImage"),
  kycDocumentOpenBtn: document.getElementById("kycDocumentOpenBtn"),
  kycDocumentCloseBtn: document.getElementById("kycDocumentCloseBtn")
};

// Las pantallas consumen la caché controlada de Lista 8. Nunca llaman a Slack desde el navegador.
const SLACK_LIST_LOOKUPS_ENABLED = true;
const SLACK_LIST_LOOKUPS_PAUSED_MESSAGE = "Lista 8 no está disponible temporalmente.";
const ALLOWED_ATTACHMENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_ATTACHMENT_COUNT = 6;
const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024;
const MAX_TOTAL_ATTACHMENT_BYTES = 20 * 1024 * 1024;
// Base64 aumenta el peso de una foto antes de que Vercel reciba el JSON.
// Este límite aplica únicamente al flujo de INE, que reduce las imágenes localmente.
const MAX_INE_ATTACHMENT_COUNT = 3;
const MAX_INE_TRANSPORT_ATTACHMENT_BYTES = 900 * 1024;
const MAX_INE_TRANSPORT_TOTAL_BYTES = 3 * 1024 * 1024;

let livechatProfile = null;
let jiraFields = [];
let issueTypes = [];
let attachments = [];
let jiraDefaults = {};
let currentAccount = null;
let searchTickets = [];
let searchSlackPanels = [];
let pendingCustomerPrefill = null;
let supportConfig = { slackRoutes: [], listPanels: [], liveChatAutomation: null, traceability: null };
let activeProfileKey = "";
let currentReplyMatches = [];
let activeListPanelId = "";
let activeListPanelEmail = "";
let pendingAgentAlerts = [];
let activeAgentAlert = null;
let supportConfigPollId = null;
let lastSupportConfigCheckAt = 0;
let autoWelcomeAttempts = new Set();
let traceabilityReport = null;
let autoSafeTemplateAttempts = new Map();
let customerContextRequestId = 0;
let customerContextTimerId = null;
let caseEvidencePollTimerId = null;
let caseEvidencePollGeneration = 0;
let searchRequestId = 0;
let currentCaseView = null;
let currentCaseAction = null;
let currentCaseDraft = null;
let currentCaseDraftChatId = "";
let lastKycLookupEmail = "";
const ACTIVE_CASE_ACTION_STATUSES = new Set(["proposed", "approved", "executing", "verification_pending"]);
const CASE_ACTION_SESSION_PREFIX = "betxico.support.caseAction.";
const TRACEABILITY_DEPOSIT_TEXT_KEY = "betxico.traceability.depositText";
const TRACEABILITY_WITHDRAWAL_TEXT_KEY = "betxico.traceability.withdrawalText";

const QUICK_REPLIES = [
  {
    id: "correo",
    title: "Pedir correo",
    keywords: ["correo", "email", "cuenta", "revisar mi cuenta"],
    response: "Correo por favor para revisar tu cuenta."
  },
  {
    id: "hola",
    title: "Saludo",
    keywords: ["hola", "buenas", "buen dia", "buenos dias", "buenas tardes", "buenas noches"],
    response: "Hola. ¿En qué te puedo ayudar?"
  },
  {
    id: "bono",
    title: "Bono primer depósito",
    keywords: ["bono", "primer deposito", "promocion", "promos", "bono bienvenida"],
    response: "A partir de ahora, contamos con 2 bonos por TU PRIMER DEPOSITO:\nSe otorgara un bono de $50 a los que depositen de $50 pesos en adelante.\nSe otorgara un bono de $100 a los que depositen de $100 pesos en adelante.\nEsto solo es valido en tu primer deposito, dependiendo del monto depositado, sera el monto del bono otorgado. Una vez hecho esto, tu bono se acreditará automáticamente en tu cuenta para que comiences a jugar.\nESTE BONO SOLO APLICA A NUEVOS USUARIOS"
  },
  {
    id: "bono10",
    title: "Bono 10%",
    keywords: ["10%", "bono 10", "activar bono", "promocion del 10"],
    response: "Para activar la promoción del 10% de bono en todos tus depósitos sigue estos pasos:\n1. Realiza tu depósito por un monto igual o superior a $150 pesos desde tu cuenta.\n2. Una vez confirmado el depósito, entra al area de Promociones/Promos.\n3. Dentro de la sección de promociones, selecciona y activa el bono del 10%.\n¡Listo! Al completar estos pasos, tu promoción quedará activa y podrás disfrutar del bono en tu depósito.\nIMPORTANTE: Si juegas o apuestas antes de habilitar el bono, lo perderás y tendrás que hacer un nuevo depósito para acceder a él.\n\nEste bono solo aplica en áreas de casino y casino en vivo.\n\nPara cualquier duda adicional, nuestro equipo de soporte está disponible para ayudarte."
  },
  {
    id: "deposito-ayuda",
    title: "Depósito no reflejado: pedir comprobante",
    keywords: ["deposito no reflejado", "no me llego", "no se refleja", "transferencia", "spei", "pago", "deposito", "captura"],
    response: "Necesito que me envíes por favor captura de tu deposito donde venga clabe de rastreo, fecha y monto por favor."
  },
  {
    id: "reporte-deposito",
    title: "Depósito reportado",
    keywords: ["ya reporte", "quedo el reporte", "monitoreo", "captura de deposito", "reporte deposito"],
    response: "Listo, ya quedo el reporte! %customer-name%\nla captura de tu deposito se revisara para que pueda\nser abonado✅ 💸\nmuchas gracias por la información y tiempo de espera.⌛️ agradeceré puedas calificar mi chat al salir, bonita noche! 💚🙂‍↔️"
  },
  {
    id: "cep",
    title: "Pedir CEP Banxico",
    keywords: ["cep", "banxico", "comprobante electronico", "clave de rastreo", "rastrear"],
    response: "Para poder validar tu depósito necesito que descargues tu Comprobante Electrónico de Pago (CEP) directamente desde Banxico.\nTe indico cómo hacerlo paso a paso:\n1. Ingresa a la página oficial de Banxico: 👉 https://www.banxico.org.mx/cep/\n2. Da clic en Consultar CEP.\n3. Llena los datos que te pide el sistema:\n• CLABE de rastreo\n• Fecha de operación\n• Monto exacto\n• Banco emisor\n4. Descarga el comprobante en PDF y compártelo en este chat.\n\nCon ese documento podremos rastrear tu movimiento directamente con el banco y dar seguimiento a tu caso. ✅"
  },
  {
    id: "spei",
    title: "SPEI en mantenimiento",
    keywords: ["spei mantenimiento", "mantenimiento spei", "stp", "banxico caido", "intermitencia bancaria"],
    response: "Te comento que en este momento el sistema SPEI se encuentra en mantenimiento, por lo que es probable que se presenten retrasos en la acreditación de depósitos durante ese horario.\n\nUna vez que concluya el mantenimiento, las operaciones pendientes comienzan a reflejarse de manera normal.\n\nPara poder darle seguimiento y mantener el monitoreo de tu depósito, ¿me puedes compartir por favor tu correo registrado en la cuenta y la captura del comprobante desde tu app bancaria donde se vea la clave de rastreo o número de referencia?\n\nCon esa información podemos validar y dar seguimiento puntual."
  },
  {
    id: "intermitencia",
    title: "Intermitencia general",
    keywords: ["intermitencia", "sistema lento", "no carga", "servicio caido", "problemas tecnicos"],
    response: "En estos momentos estamos experimentando una intermitencia en nuestros sistemas, lamentamos mucho el inconveniente pero estamos trabajando para solucionarlo a la brevedad posible, no se preocupe su saldo y sus depositos estan seguros, muchas gracias por su comprension."
  },
  {
    id: "cookies",
    title: "Borrar cookies/cache",
    keywords: ["cookies", "cache", "caché", "no puedo entrar", "no puedo jugar", "juegos", "pantalla negra", "refresh"],
    response: "Te sugiero que cierres aplicaciones que tengas abiertas y paginas de navegador, ya que aunque estén inactivas, jalan recursos que no dejan que los juegos corran correctamente, borra cache, cookies e historial, cierra sesión, actualiza navegador (dale refresh) e inicia sesión nuevamente.\n\nUna vez que hayas realizado el procedimiento intenta ingresar nuevamente en tu sesion en 15 minutos."
  },
  {
    id: "cierre-sesiones",
    title: "Cierre de sesiones",
    keywords: ["cierre de sesiones", "sesion abierta", "no me deja entrar al juego", "ventanas abiertas", "cerrar sesiones"],
    response: "Mira acabo de realizar un cierre de sesiones para este juego. Por lo tanto apóyame intentando eliminar cookies de tu teléfono o cerrar ventanas externas si hay demasiadas abiertas. Al igual revisar si tu navegador está actualizado o ingresando con otro navegador, salir de tu sesión y volver a ingresar en 20 minutos, en caso de que no te permita aún entrar, puedes regresar y con gusto te apoyamos por lo pronto apóyame con esto por favor."
  },
  {
    id: "session-game",
    title: "Falla en juego: pedir evidencia",
    keywords: ["juego", "me saco", "se cerro", "ganancia", "jugada", "historial", "error en juego"],
    response: "Necesito que por favor me compartas la siguiente información:\n\n🔹 Captura completa del error que te aparece al intentar entrar o mientras estás dentro del juego.\n🔹 Nombre exacto del juego donde ocurre el problema (ej. Lava Coins, Coin Up, Fortune Gems, etc.).\n🔹 Hora y fecha aproximada en la que ocurrió el fallo o no se reflejó la ganancia.\n🔹 Captura del historial del juego donde debería verse la jugada o la ganancia pendiente.\n🔹 Si el juego te saca o cierra sesión, por favor una captura del mensaje exacto que aparece.\n\nCon estos datos podemos escalar el incidente con el proveedor para revisar tu sesión, los registros de la jugada y confirmar que no haya una ganancia pendiente.\nQuedo atento para apoyarte de inmediato. 💚🎰"
  },
  {
    id: "retiro-tiempo",
    title: "Tiempo de retiro",
    keywords: ["retiro", "cuanto tarda", "tiempo de retiro", "retirar", "retiro pendiente"],
    response: "Depende de cada usuario, el tiempo de procesamiento normal si no se requiere alguna verificación extra es de 3-8 min.🎰\nSolo confírmame tu correo y verifico el estatus de tu retiro para poder darte la información 🙂"
  },
  {
    id: "retiro-demora",
    title: "Demora en retiros",
    keywords: ["demora retiro", "retiro tardando", "no llega mi retiro", "retiro no reflejado", "alto trafico"],
    response: "Entendemos tu preocupación y queremos aclararte la situación. Actualmente estamos experimentando demoras en la acreditación de retiros debido al alto volumen de transacciones que se están procesando. Esto no significa que tu dinero esté perdido; tu retiro está seguro y ya se encuentra en proceso de validación por nuestro sistema.\nEn estos casos, el tiempo de acreditación puede variar un poco dependiendo del método de retiro. Apreciamos mucho tu comprensión y paciencia mientras resolvemos esta situación.\nTe aseguramos que tan pronto se normalice el sistema, tu retiro se acreditará automáticamente en la cuenta que indicaste, sin que tengas que hacer nada más. Te mantendremos informado si hubiera algún cambio relevante.\nGracias por tu confianza y por elegirnos. 💚"
  },
  {
    id: "rechazo-banco",
    title: "Retiro rechazado por banco",
    keywords: ["rechazado", "rechazo", "banco rechazo", "limites banco", "retiro devuelto"],
    response: "Esto es un rechazo por la cuenta de tu banco disculpa, puede ser por muchas razones, a veces los bancos rechazan por distintos motivos como límites en la tarjeta, porque la cuenta clabe es errónea, distinto nombre en la cuenta, restricciones por compras en internet, entre otras cosas. Te recomiendo revisar con tu banco el motivo del rechazo para que no se te vuelva a rechazar."
  },
  {
    id: "documentos",
    title: "Documentos para retiro",
    keywords: ["documentos", "selfie", "ine", "estado de cuenta", "caratula", "validacion de seguridad"],
    response: "Gracias por tu paciencia. Te explico claramente la situación de tu retiro:\n\nActualmente tu solicitud se encuentra en proceso de validación de seguridad. Este procedimiento se activa cuando el sistema requiere confirmar la titularidad de los métodos de pago utilizados, tanto para depósito como para retiro. Es un protocolo estándar para proteger tu cuenta y tus fondos.\n\n🔎 Documentación solicitada:\n• ✅ Selfie sosteniendo INE\n• ✅ INE por ambos lados\n• ✅ Carátula estados de cuenta de depósito y retiro\n\n⚠️ Es importante que el estado de cuenta:\n• Sea en formato PDF o captura completa.\n• Muestre tu nombre completo y cuenta clabe.\n• No esté editado ni recortado.\n\nEn cuanto recibamos esos documentos, se mandara a revisión para seguir con el proceso de su retiro.\n\nNOTA IMPORTANTE: para la entrega de documentos se tienen 5 días naturales a partir del momento que se da el aviso, de lo contrario no podrá proceder dicho retiro."
  },
  {
    id: "verificacion-duplicada",
    title: "Cuenta ya verificada",
    keywords: ["ya tengo cuenta", "no puedo verificar", "verificar dos cuentas", "cuenta duplicada", "foto de foto"],
    response: "El sistema me arroja una alerta, ud ya cuenta con una verificada previamente, por temas de seguridad y por ley solo se permite una cuenta verificada. Es importante solo usar una cuenta ya que corre el riesgo que su cuenta quede bloqueada de forma permanente. Lamento no poder avanzar en el proceso."
  },
  {
    id: "recuperacion",
    title: "Recuperar cuenta",
    keywords: ["recuperar cuenta", "no tengo acceso", "olvide contraseña", "contraseña", "cambiar contraseña"],
    response: "No te preocupes, vamos a ayudarte a iniciar sesion. Para eso necesito me envíes una foto tuya sosteniendo tu INE, de esa manera puedo darte el acceso y la información de tu cuenta."
  },
  {
    id: "cuenta-invalida",
    title: "Cuenta inválida",
    keywords: ["cuenta invalida", "datos inconsistentes", "no liquidacion", "no puedo retirar por verificacion"],
    response: "Ya revise tu caso y te explico lo que ocurrió de forma puntual.\n\nTe comento que tu cuenta no esta correctamente verificada ya que tiene inconsistencias en sus datos.\nPor este motivo, el sistema no permite hacer la liquidación de su retiro.\n\n- El procedimiento correcto en estos casos es el siguiente:\n1.- Crear una nueva cuenta (con correo y número nuevos).\n2.- Verificarla correctamente solo con los datos del titular original (INE por ambos lados + selfie clara donde solo aparezcas tú).\n3.- Una vez que completes la verificación, regresa a este chat y avísanos.\n\nEn cuanto confirmemos que la nueva cuenta quedó validada correctamente, te apoyaremos con el traspaso de tu saldo que quedó pendiente.\n\nTu dinero no está perdido, solo está retenido por el proceso de validación.\nQuedo atento para acompañarte paso a paso y cerrar esto correctamente."
  },
  {
    id: "rollover",
    title: "Rollover",
    keywords: ["rollover", "bono activo", "saldo restringido", "no puedo retirar por bono"],
    response: "Gracias por confirmar tu correo. Ya revisé tu cuenta y te explico el motivo 👇\n\nTu saldo aparece como restringido porque actualmente tienes activo el bono del 10%, el cual está sujeto a un rollover (requisito de apuesta).\n\n📊 Detalle del bono:\n\nRollover total requerido:\n\nRollover ya ejecutado:\n\nRollover pendiente por completar:\n\nMientras el rollover no se complete al 100%, el saldo promocional y las ganancias asociadas no pueden retirarse. Una vez que finalices el requisito de apuesta, el saldo se liberará automáticamente y podrás disponer de él sin problema.\n¿algo mas en lo que te pueda apoyar?\nEstoy atento para ayudarte. 🎰💼"
  },
  {
    id: "oxxo-rollover",
    title: "OXXO rollover",
    keywords: ["oxxo", "oxxopay", "deposito oxxo", "retirar oxxo"],
    response: "De acuerdo a nuestros términos y condiciones, por tema de seguridad, para poder retirar debe haber jugado el total del depósito. Por lo tanto, se procederá con la cancelación del retiro en curso para poder terminar con este rollover, una vez utilizado, se podrá solicitar el retiro sin ningún problema. Agradecemos tu comprensión."
  },
  {
    id: "tarjeta-rollover",
    title: "Tarjeta rollover",
    keywords: ["tarjeta", "deposito tarjeta", "rollover tarjeta", "pago con tarjeta"],
    response: "Por tema de seguridad, cuando es un deposito por tarjeta, para poder realizar retiros se debe jugar todo el saldo mas el bono o eliminar el bono, previo a su primer jugada para ser sujeto a devolución. Por lo tanto, se procederá con la cancelación del retiro en curso para poder terminar con este rollover, una vez utilizado, se podrá solicitar el retiro sin ningún problema. Agradecemos tu comprensión.\nNota: En los pagos via spei no aplica esta restricción."
  },
  {
    id: "cierre-cuenta",
    title: "Cierre de cuenta",
    keywords: ["cerrar cuenta", "eliminar cuenta", "autoexclusion", "auto exclusión", "cierre definitivo"],
    response: "Claro, podemos ayudarte con el cierre de tu cuenta.\nSolo considera que este proceso es definitivo, sin posibilidad de volver a abrir la cuenta o crear otra con tu identidad.\n\nPara continuar, por favor envíanos una selfie sosteniendo tu INE (credencial de elector) de forma clara y legible.\nEsto es parte del protocolo de seguridad para confirmar que la solicitud proviene del titular de la cuenta.\n\nUna vez que recibamos la verificación, procederemos con el cierre conforme a la cláusula 14 de nuestros Términos y Condiciones, en apego a nuestra política de Juego Responsable."
  },
  {
    id: "responsable",
    title: "Cliente molesto por pérdidas",
    keywords: ["perdi", "perdí", "casino roba", "no paga", "chillones", "pérdidas", "perdidas", "mala racha"],
    response: "Gracias por escribirnos. Entendemos perfectamente cómo se siente y lamentamos que su experiencia reciente no haya sido la esperada.\nCon respecto a los resultados del casino, es importante recordar que todos nuestros juegos funcionan mediante generadores de números aleatorios certificados, lo que garantiza que cada jugada sea completamente imparcial y al azar. Aunque a veces se puede pasar por rachas negativas, también existen momentos de ganancia. Es parte natural de cualquier juego de azar.\n\nQuedamos atentos a cualquier duda adicional que tenga."
  },
  {
    id: "calificacion",
    title: "Pedir calificación",
    keywords: ["calificar", "calificacion", "cerrar chat", "gracias", "todo bien"],
    response: "Estamos para servirte ☺️, agradecería mucho si calificaras mi servicio; al cerrar el chat se mostrará la opción de calificación y algún comentario que desees agregar. Fue un placer atenderte ¡que tengas excelente día! 🤗"
  },
  {
    id: "salida",
    title: "Cierre de atención",
    keywords: ["algo mas", "seria todo", "nada mas", "gracias bye"],
    response: "¿Hay algo más en lo que te pueda apoyar?"
  }
];

const DEFAULT_REPORT_WORKFLOWS = {
  "deposito-no-reflejado": {
    id: "deposito-no-reflejado",
    label: "Deposito no reflejado",
    destination: "both",
    jiraIssueType: "Transacciones",
    slackRouteId: "deposito-no-reflejado",
    slackTemplate: "deposit",
    requiredSlackFields: ["agentName", "customerId", "customerEmail", "trackingKey", "amount"]
  },
  jira: {
    id: "jira",
    label: "Jira",
    destination: "jira",
    slackTemplate: ""
  }
};
let reportWorkflows = { ...DEFAULT_REPORT_WORKFLOWS };

initialize();

function initialize() {
  renderReportWorkflowOptions(elements.ticketDestination.value);
  elements.form.addEventListener("submit", handleSubmit);
  elements.form.addEventListener("input", renderDestinationMode);
  elements.form.addEventListener("change", renderDestinationMode);
  elements.searchForm.addEventListener("submit", handleSearchTickets);
  elements.caseActionForm?.addEventListener("submit", handleCaseActionPropose);
  elements.caseActionType?.addEventListener("change", renderCaseActionTarget);
  elements.caseActionApproveBtn?.addEventListener("click", handleCaseActionApprove);
  elements.caseActionExecuteBtn?.addEventListener("click", handleCaseActionExecute);
  elements.caseActionRejectBtn?.addEventListener("click", handleCaseActionReject);
  elements.caseEvidenceReviewBtn?.addEventListener("click", handleCaseEvidenceReview);
  elements.caseDraftGenerateBtn?.addEventListener("click", handleCaseDraftGenerate);
  elements.caseDraftUseBtn?.addEventListener("click", handleCaseDraftUseAction);
  elements.clearSearchBtn.addEventListener("click", handleClearSearch);
  elements.detectReplyBtn?.addEventListener("click", handleDetectReplyFromChat);
  elements.clearReplyBtn?.addEventListener("click", handleClearReply);
  elements.replyInput?.addEventListener("input", renderReplySuggestion);
  elements.replySuggestion?.addEventListener("click", handleReplySuggestionClick);
  elements.quickDepositBtn?.addEventListener("click", handleQuickDepositOpen);
  elements.quickIneBtn?.addEventListener("click", handleQuickIneOpen);
  elements.kycLookupBtn?.addEventListener("click", handleKycLookup);
  elements.kycLookupResults?.addEventListener("click", handleKycDocumentClick);
  elements.kycDocumentCloseBtn?.addEventListener("click", closeKycDocument);
  elements.kycDocumentOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.kycDocumentOverlay) closeKycDocument();
  });
  elements.atenaLookupBtn?.addEventListener("click", handleAtenaLookup);
  elements.quickDepositForm?.addEventListener("submit", handleQuickDepositSubmit);
  elements.quickDepositCancelBtn?.addEventListener("click", handleQuickDepositCancel);
  elements.quickDepositTrackingKey?.addEventListener("input", renderQuickDepositPreview);
  elements.quickDepositAmount?.addEventListener("input", renderQuickDepositPreview);
  elements.quickIneForm?.addEventListener("submit", handleQuickIneSubmit);
  elements.quickIneCancelBtn?.addEventListener("click", handleQuickIneCancel);
  elements.quickIneNotifyWithdrawal?.addEventListener("change", handleQuickIneWithdrawalToggle);
  elements.quickIneWithdrawalDate?.addEventListener("input", renderQuickInePreview);
  elements.quickIneWithdrawalAmount?.addEventListener("input", renderQuickInePreview);
  elements.traceabilityBtn?.addEventListener("click", handleTraceabilityOpen);
  elements.closeSessionsBtn?.addEventListener("click", openCloseSessionsForm);
  elements.closeSessionsForm?.addEventListener("submit", handleCloseSessions);
  elements.closeSessionsCancelBtn?.addEventListener("click", closeCloseSessionsForm);
  elements.bobSessionsBackBtn?.addEventListener("click", () => showView("search"));
  elements.bobHistoryRefreshBtn?.addEventListener("click", loadBobHistory);
  elements.bobSessionsHistory?.addEventListener("click", handleBobHistoryAction);
  elements.openOperationalCaseBtn?.addEventListener("click", () => showView("case"));
  elements.dashboardSettingsBtn?.addEventListener("click", () => showView("settings"));
  elements.openKycSearchBtn?.addEventListener("click", openKycBackofficeSearch);
  elements.kycCompleteBtn?.addEventListener("click", () => submitKycReviewStatus("complete"));
  elements.kycIncompleteBtn?.addEventListener("click", () => submitKycReviewStatus("incomplete"));
  elements.traceabilityCloseBtn?.addEventListener("click", handleTraceabilityClose);
  elements.traceabilityRunBtn?.addEventListener("click", handleTraceabilityRun);
  elements.traceabilityDownloadCsvBtn?.addEventListener("click", handleTraceabilityDownloadCsv);
  elements.traceabilityDownloadExcelBtn?.addEventListener("click", handleTraceabilityDownloadExcel);
  elements.traceabilityDepositFile?.addEventListener("change", handleTraceabilityFileChange);
  elements.traceabilityWithdrawalFile?.addEventListener("change", handleTraceabilityWithdrawalFileChange);
  elements.traceabilityDepositText?.addEventListener("input", resetTraceabilityReport);
  elements.traceabilityWithdrawalText?.addEventListener("input", resetTraceabilityReport);
  elements.traceabilitySettingsBtn?.addEventListener("click", handleTraceabilityOpen);
  restoreTraceabilityDraft();
  elements.sendWelcomeBtn?.addEventListener("click", () => sendLiveChatWelcome({ manual: true }));
  elements.quickDepositEvidence?.addEventListener("click", () => {
    elements.quickDepositEvidence.focus();
    elements.attachmentInput.click();
  });
  elements.quickDepositEvidence?.addEventListener("dragover", handleQuickEvidenceDragOver);
  elements.quickDepositEvidence?.addEventListener("dragleave", handleQuickEvidenceDragLeave);
  elements.quickDepositEvidence?.addEventListener("drop", handleQuickEvidenceDrop);
  elements.quickDepositEvidence?.addEventListener("paste", handleAttachmentPaste);
  elements.quickDepositForm?.addEventListener("paste", handleAttachmentPaste);
  elements.quickIneEvidence?.addEventListener("click", () => {
    elements.quickIneEvidence.focus();
    elements.attachmentInput.click();
  });
  elements.quickIneEvidence?.addEventListener("dragover", handleQuickEvidenceDragOver);
  elements.quickIneEvidence?.addEventListener("dragleave", handleQuickEvidenceDragLeave);
  elements.quickIneEvidence?.addEventListener("drop", handleQuickEvidenceDrop);
  elements.quickIneEvidence?.addEventListener("paste", handleAttachmentPaste);
  elements.quickIneForm?.addEventListener("paste", handleAttachmentPaste);
  elements.newTicketBtn.addEventListener("click", () => openTicketForm());
  elements.searchResults.addEventListener("click", handleSearchResultAction);
  elements.searchResults.addEventListener("submit", handleTicketCommentSubmit);
  elements.ticketTab.addEventListener("click", () => showView("search"));
  elements.settingsTab.addEventListener("click", () => showView("settings"));
  [elements.customerName, elements.customerEmail, elements.authId, elements.chatId].forEach((input) => {
    input?.addEventListener("input", () => {
      renderCustomerProfileSummary();
      if (input === elements.customerEmail) syncKycEmailInput();
      if ([elements.customerEmail, elements.authId, elements.chatId].includes(input)) scheduleCustomerContextLoad();
    });
  });
  elements.slackLoginBtn.addEventListener("click", handleSlackLoginStart);
  elements.accountForm.addEventListener("submit", handleSaveAccount);
  elements.slackUserConnectBtn.addEventListener("click", handleSlackUserConnect);
  elements.reloadSupportConfigBtn.addEventListener("click", loadSupportConfig);
  elements.logoutBtn.addEventListener("click", handleLogout);
  elements.issueType.addEventListener("change", () => loadIssueTypeFields(elements.issueType.value));
  elements.ticketDestination.addEventListener("change", handleReportTypeChange);
  elements.addAttachmentBtn.addEventListener("click", () => elements.attachmentInput.click());
  elements.clearBtn.addEventListener("click", handleClearForm);
  elements.attachmentDropzone.addEventListener("click", () => elements.attachmentInput.click());
  elements.attachmentInput.addEventListener("change", () => addFiles(elements.attachmentInput.files));
  elements.attachmentDropzone.addEventListener("dragover", handleAttachmentDragOver);
  elements.attachmentDropzone.addEventListener("dragleave", handleAttachmentDragLeave);
  elements.attachmentDropzone.addEventListener("drop", handleAttachmentDrop);
  elements.ticketForm.addEventListener("dragover", handleAttachmentDragOver);
  elements.ticketForm.addEventListener("dragleave", handleAttachmentDragLeave);
  elements.ticketForm.addEventListener("drop", handleAttachmentDrop);
  elements.agentAlertAckBtn?.addEventListener("click", handleAgentAlertAck);
  document.addEventListener("paste", handleAttachmentPaste);
  window.addEventListener("message", handleSlackLoginComplete);
  window.addEventListener("storage", handleSlackLoginStorage);
  window.addEventListener("focus", () => refreshSupportConfigIfDue(30000));
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
      refreshSupportConfigIfDue(30000);
    }
  });
  renderAttachments();
  renderCustomerProfileSummary();
  renderKycReviewStatus();
  renderCaseAgentPanel();
  renderCaseActionTarget();
  renderCustomerContextEmpty();
  loadAccount();
  loadPublicSupportConfig();

  if (!isLiveChatEmbeddedContext() || !window.LiveChat?.createDetailsWidget) {
    setConnection("Modo navegador");
    return;
  }

  window.LiveChat.createDetailsWidget()
    .then((widget) => {
      setConnection("Conectado");
      clearLiveChatConnectionError();
      widget.on("customer_profile", handleCustomerProfile);
      const currentProfile = typeof widget.getCustomerProfile === "function" ? widget.getCustomerProfile() : null;
      if (currentProfile) {
        handleCustomerProfile(currentProfile);
      }
    })
    .catch((error) => {
      setConnection("Sin conexion");
      showResult(buildLiveChatConnectionError(error), "error");
    });
}

function buildLiveChatConnectionError(error) {
  const message = String(error?.message || "error_desconocido");
  if (/timeout/i.test(message)) {
    return "No pude conectar con LiveChat. Revisa que la app este instalada como LiveChat Widgets con placement Chat Details y que el Widget source URL sea https://support-livechat-app.vercel.app.";
  }
  return `No pude iniciar el widget de LiveChat: ${message}`;
}

function clearLiveChatConnectionError() {
  const text = elements.result.textContent || "";
  if (text.includes("No pude conectar con LiveChat") || text.includes("No pude iniciar el widget de LiveChat")) {
    hideResult();
  }
}

function isLiveChatEmbeddedContext() {
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

async function loadAccount() {
  try {
    const data = await fetchJson("/api/account-settings");
    currentAccount = data.account || null;
    renderAccount();
    if (currentAccount) {
      showView("search");
      startSupportConfigPolling();
    }
    loadSupportConfig();
    loadPublicSupportConfig();
  } catch (error) {
    showResult(`No pude cargar la sesión: ${formatError(error.message)}`, "error");
  }
}

function renderAccount() {
  fillUserSelects();
  if (!currentAccount) {
    document.body.dataset.auth = "unauthenticated";
    elements.loginForm.hidden = false;
    elements.accountForm.hidden = true;
    elements.adminConfigForm.hidden = true;
    elements.liveChatAutomationPanel.hidden = true;
    pendingAgentAlerts = [];
    activeAgentAlert = null;
    renderAgentAlert();
    stopSupportConfigPolling();
    showView("settings");
    return;
  }

  document.body.dataset.auth = "authenticated";
  renderToolAccess();
  elements.loginForm.hidden = true;
  elements.accountForm.hidden = false;
  elements.accountDisplayName.value = currentAccount.displayName || "";
  elements.accountEmail.value = currentAccount.email || "";
  elements.jiraEmail.value = currentAccount.jiraEmail || currentAccount.email || "";
  elements.reporterAccountId.value = currentAccount.reporterAccountId || getFieldDefault("reporterAccountId");
  elements.defaultAssigneeAccountId.value = currentAccount.defaultAssigneeAccountId || getFieldDefault("assigneeAccountId");
  elements.defaultLabels.value = currentAccount.defaultLabels || getFieldDefault("labels") || "";
  elements.jiraApiToken.placeholder = currentAccount.hasJiraToken ? "Token guardado. Pega uno nuevo sólo para cambiarlo." : "Pegar token de Jira";
  if (!issueTypes.length) {
    loadIssueTypes();
  }
  refreshSlackUserStatus();
  renderLiveChatAutomationPanel();
}

function renderToolAccess() {
  const capabilities = currentAccount?.toolAccess?.capabilities || { atena: false, kyc: false, bob: false, ai: false };
  if (elements.atenaLookupPanel) elements.atenaLookupPanel.hidden = capabilities.atena !== true;
  if (elements.kycLookupPanel) elements.kycLookupPanel.hidden = capabilities.kyc !== true;
  if (elements.kycActionPanel) elements.kycActionPanel.hidden = capabilities.kyc !== true;
  if (elements.closeSessionsBtn) elements.closeSessionsBtn.hidden = capabilities.bob !== true;
  if (elements.closeSessionsForm && capabilities.bob !== true) elements.closeSessionsForm.hidden = true;
  if (elements.closeSessionsStatus && capabilities.bob !== true) elements.closeSessionsStatus.hidden = true;
  if (elements.bobSessionsPanel) elements.bobSessionsPanel.hidden = capabilities.bob !== true;
  document.body.dataset.agentAiAccess = capabilities.ai === true ? "enabled" : "disabled";
  document.body.dataset.agentBobAccess = capabilities.bob === true ? "enabled" : "disabled";
}

function openCloseSessionsForm() {
  if (!elements.closeSessionsForm || !currentAccount?.toolAccess?.capabilities?.bob) return;
  showView("bob");
  elements.closeSessionsForm.hidden = false;
  elements.closeSessionsStatus.hidden = true;
  if (elements.closeSessionsCustomerName && !elements.closeSessionsCustomerName.value.trim()) {
    elements.closeSessionsCustomerName.value = String(elements.customerName?.value || "").trim();
  }
  if (elements.closeSessionsCustomerEmail && !elements.closeSessionsCustomerEmail.value.trim()) {
    elements.closeSessionsCustomerEmail.value = String(elements.customerEmail?.value || "").trim().toLowerCase();
  }
  loadBobHistory();
  elements.closeSessionsCustomerId?.focus();
}

function closeCloseSessionsForm() {
  if (elements.closeSessionsCustomerId) elements.closeSessionsCustomerId.value = "";
  if (elements.closeSessionsReportedGame) elements.closeSessionsReportedGame.value = "";
  if (elements.closeSessionsCustomerName) elements.closeSessionsCustomerName.value = "";
  if (elements.closeSessionsCustomerEmail) elements.closeSessionsCustomerEmail.value = "";
  if (elements.closeSessionsStatus) elements.closeSessionsStatus.hidden = true;
}

async function handleCloseSessions(event) {
  event?.preventDefault();
  const customerId = String(elements.closeSessionsCustomerId?.value || "").replace(/\s+/g, "");
  const reportedGame = String(elements.closeSessionsReportedGame?.value || "").trim();
  const customer = currentBobCustomerContext(customerId);
  if (!customerId) {
    setCloseSessionsStatus("Escribe el ID del cliente antes de solicitar el cierre.", "error");
    elements.closeSessionsCustomerId?.focus();
    return;
  }
  if (!/^\d{3,20}$/.test(customerId)) {
    setCloseSessionsStatus("El ID debe contener únicamente entre 3 y 20 dígitos.", "error");
    elements.closeSessionsCustomerId?.focus();
    return;
  }
  if (!customer.name || !looksLikeEmail(customer.email)) {
    setCloseSessionsStatus("Completa el nombre y correo válido del cliente para crear el ticket Jira al finalizar el cierre.", "error");
    (!customer.name ? elements.closeSessionsCustomerName : elements.closeSessionsCustomerEmail)?.focus();
    return;
  }
  elements.closeSessionsSubmitBtn.disabled = true;
  setCloseSessionsStatus("Solicitando cierre en BoB...", "pending");
  try {
    const response = await fetch("/api/atena-bridge?service=bob&action=request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customerId,
        reportedGame,
        chatId: String(elements.chatId?.value || elements.chatId?.textContent || "").trim(),
        customer
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.job?.id) throw new Error(data.error || "bob_request_failed");
    await waitForBobResult(data.job.id);
    await loadBobHistory();
  } catch (error) {
    const message = String(error?.message || error);
    const displayMessage = message === "bob_request_timeout"
      ? "El cierre sigue procesándose en BoB. No envíes otra solicitud; espera unos minutos y revisa el resultado antes de repetirlo."
      : `No se pudo completar el cierre: ${message}`;
    setCloseSessionsStatus(displayMessage, "error");
  } finally {
    elements.closeSessionsSubmitBtn.disabled = false;
  }
}

async function waitForBobResult(jobId) {
  // BoB can take more than ten minutes when a customer has many open sessions.
  const deadline = Date.now() + 20 * 60_000;
  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 2_000));
    const response = await fetch("/api/atena-bridge?service=bob&action=result", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobId }) });
    const data = await response.json().catch(() => ({}));
    const job = data.job;
    if (!response.ok || !job) throw new Error(data.error || "bob_result_failed");
    if (job.status === "completed") {
      setCloseSessionsStatus(`BoB verificó el cierre: ${job.result?.closedCount || 0} sesión(es) finalizada(s).`, "success");
      return;
    }
    if (job.status === "failed") throw new Error(job.error || "bob_session_close_failed");
    const progress = job.progress;
    const count = progress?.total ? ` ${progress.completed || 0}/${progress.total}.` : "";
    setCloseSessionsStatus(`${progress?.message || "BoB está revisando las sesiones del cliente..."}${count}`, "pending");
  }
  throw new Error("bob_request_timeout");
}

async function loadBobHistory() {
  if (!currentAccount?.toolAccess?.capabilities?.bob || !elements.bobSessionsHistory) return;
  if (elements.bobHistoryRefreshBtn) elements.bobHistoryRefreshBtn.disabled = true;
  try {
    const response = await fetch("/api/atena-bridge?service=bob&action=history", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ limit: 40 })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "bob_history_failed");
    renderBobHistory(data.jobs || []);
  } catch (error) {
    elements.bobSessionsQueue.innerHTML = "";
    elements.bobSessionsHistory.innerHTML = `<p class="bob-empty">No pude cargar el historial de BoB: ${escapeHtml(formatError(String(error?.message || error)))}</p>`;
  } finally {
    if (elements.bobHistoryRefreshBtn) elements.bobHistoryRefreshBtn.disabled = false;
  }
}

function renderBobHistory(jobs) {
  const active = jobs.filter((job) => ["pending", "processing", "retry_waiting"].includes(job.status));
  const completed = jobs.filter((job) => !["pending", "processing", "retry_waiting"].includes(job.status));
  elements.bobSessionsQueue.innerHTML = active.length
    ? active.map(renderBobJob).join("")
    : '<p class="bob-empty">No hay cierres en cola o en proceso.</p>';
  elements.bobSessionsHistory.innerHTML = completed.length
    ? `<h4>Historial</h4>${completed.map(renderBobJob).join("")}`
    : '<p class="bob-empty">Todavía no hay cierres finalizados registrados.</p>';
}

function renderBobJob(job) {
  const status = String(job.status || "pending").toLowerCase();
  const result = job.result || {};
  const progress = job.progress || {};
  const summary = status === "completed"
    ? `${Number(result.closedCount || 0)} cerradas · ${Number(result.verifiedPendingCount || 0)} pendientes después de verificar`
    : status === "retry_waiting"
      ? "BoB no estuvo disponible. La solicitud conserva el ID y se reintentará automáticamente."
    : status === "failed"
      ? `No se completó: ${formatError(job.error || "sin detalle")}`
      : progress.message || "Esperando el conector local de BoB.";
  const metrics = status === "completed"
    ? `Detectadas: ${Number(result.totalPendingFound || 0)} · Omitidas: ${Number(result.skippedCount || 0)}`
    : status === "retry_waiting"
      ? `Intentos: ${Number(job.attempts || 0)} · Próximo intento: ${formatBobTime(job.retryAt)}`
    : progress.total ? `Avance: ${Number(progress.completed || 0)} de ${Number(progress.total)}` : "";
  const details = status === "completed" ? renderBobResultDetails(result) : "";
  const jiraTicket = status === "completed" ? renderBobJiraTicket(job) : "";
  return `<article class="bob-job bob-job-${escapeHtml(status)}">
    <header><strong>ID ${escapeHtml(job.customerId || "-")}</strong><span>${escapeHtml(bobStatusLabel(status))}</span></header>
    <p>${escapeHtml(summary)}</p>
    ${metrics ? `<small>${escapeHtml(metrics)}</small>` : ""}
    ${jiraTicket}
    ${details}
    <time>${escapeHtml(formatBobTime(job.completedAt || job.startedAt || job.createdAt))}</time>
  </article>`;
}

function renderBobJiraTicket(job) {
  const ticket = job?.jiraTicket;
  if (!ticket) return '<p class="bob-legacy-note">Ticket Jira: esperando confirmación.</p>';
  if (ticket.status === "created") {
    const key = escapeHtml(ticket.key || "Ticket creado");
    const url = String(ticket.url || "");
    const link = /^https:\/\//i.test(url)
      ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${key}</a>`
      : key;
    return `<p class="bob-clear-state">Ticket Jira: ${link}</p>`;
  }
  if (ticket.status === "failed") return `<div class="bob-jira-ticket-failure"><p class="bob-session-results-warning">El cierre se verificó, pero Jira no creó el ticket: ${escapeHtml(formatError(ticket.error || "sin detalle"))}</p><button type="button" class="bob-jira-retry" data-bob-jira-retry="${escapeHtml(job.id || "")}" data-bob-customer-id="${escapeHtml(job.customerId || "")}">Reintentar ticket Jira</button></div>`;
  return '<p class="bob-legacy-note">Creando ticket Jira a nombre del agente...</p>';
}

async function handleBobHistoryAction(event) {
  const button = event.target.closest("[data-bob-jira-retry]");
  if (!button) return;
  const jobId = String(button.dataset.bobJiraRetry || "").trim();
  if (!jobId) return;
  button.disabled = true;
  try {
    const response = await fetch("/api/atena-bridge?service=bob&action=jira-ticket-retry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ jobId, customer: currentBobCustomerContext(button.dataset.bobCustomerId) })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "bob_jira_ticket_retry_failed");
    setCloseSessionsStatus("Revisé la creación del ticket Jira. El cierre en BoB no se volvió a ejecutar.", "pending");
    await loadBobHistory();
  } catch (error) {
    setCloseSessionsStatus(`No pude reintentar el ticket Jira: ${formatError(String(error?.message || error))}`, "error");
    button.disabled = false;
  }
}

function currentBobCustomerContext(expectedCustomerId = "") {
  const visibleCustomerId = String(elements.authId?.value || "").replace(/\s+/g, "");
  if (expectedCustomerId && visibleCustomerId && visibleCustomerId !== String(expectedCustomerId).replace(/\s+/g, "")) return {};
  return {
    name: String(elements.closeSessionsCustomerName?.value || elements.customerName?.value || "").trim(),
    email: String(elements.closeSessionsCustomerEmail?.value || elements.customerEmail?.value || "").trim().toLowerCase()
  };
}

function renderBobResultDetails(result) {
  const closedSessions = Array.isArray(result?.closedSessions) ? result.closedSessions : [];
  const remainingSessions = Array.isArray(result?.remainingSessions) ? result.remainingSessions : [];
  const pendingWins = result?.pendingWins || {};
  const pendingAfter = Array.isArray(pendingWins.remainingAfterVerification) ? pendingWins.remainingAfterVerification : [];
  if (!closedSessions.length && !remainingSessions.length && !Object.prototype.hasOwnProperty.call(result || {}, "pendingWins")) {
    return '<p class="bob-legacy-note">Registro anterior: conserva los totales, pero no el detalle por juego.</p>';
  }
  const closed = closedSessions.length
    ? `<ul class="bob-session-results">${closedSessions.map((session) => renderBobSession(session, "Cerrada")).join("")}</ul>`
    : '<p class="bob-empty">No hubo sesiones pendientes para cerrar.</p>';
  const remaining = remainingSessions.length
    ? `<ul class="bob-session-results bob-session-results-warning">${remainingSessions.map((session) => renderBobSession(session, "Pendiente")).join("")}</ul>`
    : '<p class="bob-clear-state">Sin sesiones pendientes después de verificar.</p>';
  const wins = pendingAfter.length
    ? `<ul class="bob-session-results bob-session-results-warning">${pendingAfter.map((item) => `<li><strong>${escapeHtml(item.game || "Juego sin codigo")}</strong><span>Pending Win: ${escapeHtml(item.amount || "reportado")}</span></li>`).join("")}</ul>`
    : '<p class="bob-clear-state">Sin Pending Win reportado después de la verificación.</p>';
  return `<div class="bob-result-detail">
    <section><h4>Sesiones cerradas</h4>${closed}</section>
    <section><h4>Pendientes después de verificar</h4>${remaining}</section>
    <section><h4>Pending Win</h4>${wins}</section>
  </div>`;
}

function renderBobSession(session, label) {
  const game = escapeHtml(session?.game || "Juego sin codigo");
  const createdAt = escapeHtml(formatBobTime(session?.createdAt));
  const closedAt = escapeHtml(formatBobTime(session?.closedAt || session?.finalizedAt));
  return `<li><strong>${game}</strong><span>${escapeHtml(label)} · Inicio: ${createdAt} · Cierre: ${closedAt}</span></li>`;
}

function bobStatusLabel(status) {
  return ({ pending: "En cola", processing: "En proceso", retry_waiting: "Reintentando", completed: "Completado", failed: "Requiere revisión" })[status] || "Sin estado";
}

function formatBobTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Sin hora" : date.toLocaleString("es-MX", { dateStyle: "short", timeStyle: "short" });
}

function setCloseSessionsStatus(message, state) {
  if (!elements.closeSessionsStatus) return;
  elements.closeSessionsStatus.hidden = false;
  elements.closeSessionsStatus.textContent = message;
  elements.closeSessionsStatus.dataset.state = state || "";
}

async function handleSlackLoginStart() {
  hideResult();
  elements.slackLoginBtn.disabled = true;
  elements.slackLoginBtn.textContent = "Abriendo Slack...";
  try {
    const data = await fetchJson("/api/slack-user?action=signin-start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}"
    });
    if (!data.url) throw new Error("slack_oauth_url_missing");
    const popup = window.open(data.url, "betxicoSlackLogin", "width=520,height=720");
    if (!popup) {
      window.location.href = data.url;
      return;
    }
    popup.focus?.();
    showResult("Se abrió Slack para iniciar sesión. Al terminar, vuelve a esta ventana.", "success");
  } catch (error) {
    showResult(`No pude iniciar con Slack: ${formatError(error.message)}`, "error");
  } finally {
    elements.slackLoginBtn.disabled = false;
    elements.slackLoginBtn.innerHTML = '<span class="slack-mark" aria-hidden="true"><span></span><span></span><span></span><span></span></span>INICIAR SESIÓN CON SLACK';
  }
}

function handleSlackLoginComplete(event) {
  if (event.origin !== window.location.origin || event.data?.type !== "betxico-slack-login-complete") return;
  loadAccount().then(() => {
    if (currentAccount) showView("search");
  });
  showResult("Sesión de Slack iniciada.", "success");
}

function handleSlackLoginStorage(event) {
  if (event.key !== "betxicoSlackLoginComplete") return;
  loadAccount().then(() => {
    if (currentAccount) showView("search");
  });
  showResult("Sesión de Slack iniciada.", "success");
}

function fillUserSelects() {
  const users = jiraDefaults.supportUsers || [];
  const options = users
    .map((user) => `<option value="${escapeHtml(user.accountId)}">${escapeHtml(user.name)}</option>`)
    .join("");
  elements.reporterAccountId.innerHTML = options;
  elements.defaultAssigneeAccountId.innerHTML = options;
  if (getFieldDefault("reporterAccountId")) {
    elements.reporterAccountId.value = getFieldDefault("reporterAccountId");
  }
  if (getFieldDefault("assigneeAccountId")) {
    elements.defaultAssigneeAccountId.value = getFieldDefault("assigneeAccountId");
  }
}

async function handleSaveAccount(event) {
  event.preventDefault();
  hideResult();

  try {
    const data = await fetchJson("/api/account-settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        displayName: elements.accountDisplayName.value.trim(),
        email: elements.accountEmail.value.trim(),
        pin: elements.accountPin.value.trim(),
        jiraEmail: elements.jiraEmail.value.trim(),
        jiraApiToken: elements.jiraApiToken.value.trim(),
        reporterAccountId: elements.reporterAccountId.value,
        defaultAssigneeAccountId: elements.defaultAssigneeAccountId.value,
        defaultLabels: elements.defaultLabels.value.trim()
      })
    });
    currentAccount = data.account;
    elements.accountPin.value = "";
    elements.jiraApiToken.value = "";
    renderAccount();
    loadSupportConfig();
    showResult("Configuración guardada.", "success");
  } catch (error) {
    showResult(`No pude guardar configuración: ${formatError(error.message)}`, "error");
  }
}

async function handleLogout() {
  await fetch("/api/auth-logout", { method: "POST" }).catch(() => null);
  currentAccount = null;
  pendingAgentAlerts = [];
  activeAgentAlert = null;
  renderAgentAlert();
  stopSupportConfigPolling();
  renderAccount();
  elements.adminConfigForm.hidden = true;
  showView("settings");
  showResult("Sesión cerrada.", "success");
}

async function handleSlackUserConnect() {
  hideResult();
  if (!currentAccount) {
    showResult("Primero inicia sesión para conectar Slack personal.", "error");
    return;
  }

  elements.slackUserConnectBtn.disabled = true;
  const connected = elements.slackUserConnectBtn.dataset.connected === "true";
  elements.slackUserStatus.textContent = connected
    ? "Sincronizando la caché de Lista 8..."
    : "Preparando conexión con Slack...";
  try {
    if (connected) {
      const data = await fetchJson("/api/slack-user?action=sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}"
      });
      const count = Number(data.sync?.itemCount) || 0;
      elements.slackUserStatus.textContent = `Lista 8 sincronizada: ${count} registros disponibles.`;
      showResult("La caché de Lista 8 se actualizó. Los chats usarán estos datos sin consultar Slack directamente.", "success");
      return;
    }
    const data = await fetchJson("/api/slack-user?action=start", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{}"
    });
    if (!data.url) throw new Error("slack_oauth_url_missing");
    const popup = window.open(data.url, "betxicoSlackConnect", "width=520,height=720");
    if (!popup) {
      window.location.href = data.url;
      return;
    }
    popup.focus?.();
    elements.slackUserStatus.textContent = "Termina la autorización en Slack y luego vuelve a esta ventana.";
    showResult("Se abrió Slack para autorizar tu usuario. Al terminar, vuelve y guarda o recarga la configuración.", "success");
  } catch (error) {
    elements.slackUserStatus.textContent = `No pude conectar Slack personal: ${formatError(error.message)}`;
  } finally {
    elements.slackUserConnectBtn.disabled = false;
  }
}

async function refreshSlackUserStatus() {
  if (!currentAccount || !elements.slackUserStatus) return;
  try {
    const data = await fetchJson("/api/slack-user?action=status");
    elements.slackUserConnectBtn.dataset.connected = data.connected ? "true" : "false";
    elements.slackUserConnectBtn.textContent = data.connected
      ? "Sincronizar Lista 8"
      : "Conectar Slack para leer y publicar";
    elements.slackUserStatus.textContent = data.connected
      ? "Slack personal conectado. La sincronización de Lista 8 usará tu vista y los mensajes saldrán con tu usuario."
      : "Slack personal no conectado. Conéctalo para sincronizar la Lista 8 que ves en Slack.";
  } catch (error) {
    elements.slackUserConnectBtn.dataset.connected = "false";
    elements.slackUserStatus.textContent = `No pude revisar Slack personal: ${formatError(error.message)}`;
  }
}

async function loadSupportConfig() {
  if (!currentAccount) {
    elements.adminConfigForm.hidden = true;
    return;
  }

  try {
    const data = await fetchJson("/api/admin-config");
    elements.adminConfigForm.hidden = false;
    supportConfig = {
      slackRoutes: data.config?.slackRoutes || supportConfig.slackRoutes || [],
      listPanels: data.config?.listPanels || supportConfig.listPanels || [],
      liveChatAutomation: data.config?.liveChatAutomation || supportConfig.liveChatAutomation || null,
      traceability: data.config?.traceability || supportConfig.traceability || null
    };
    setReportWorkflows(data.config?.reportWorkflows || []);
    renderListPanelTabs();
    renderDestinationMode();
  } catch {
    elements.adminConfigForm.hidden = true;
  }
}

function formatDateTime(value) {
  if (!value) return "Sin fecha";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

async function loadPublicSupportConfig() {
  try {
    lastSupportConfigCheckAt = Date.now();
    const data = await fetchJson("/api/support-config");
    supportConfig = {
      slackRoutes: data.slackRoutes || [],
      listPanels: data.listPanels || [],
      liveChatAutomation: data.liveChatAutomation || null,
      traceability: data.traceability || null
    };
    setReportWorkflows(data.reportWorkflows || []);
    pendingAgentAlerts = Array.isArray(data.activeAlerts) ? data.activeAlerts : [];
    renderAgentAlert();
    renderLiveChatAutomationPanel();
    renderListPanelTabs();
    renderDestinationMode();
    if (getCustomerContextQuery()) {
      loadCustomerContext().catch(() => null);
    }
  } catch {}
}

function refreshSupportConfigIfDue(minIntervalMs = 300000) {
  if (!currentAccount || document.hidden) return;
  if (Date.now() - lastSupportConfigCheckAt < minIntervalMs) return;
  loadPublicSupportConfig();
}

function startSupportConfigPolling() {
  if (supportConfigPollId || !currentAccount) return;
  supportConfigPollId = window.setInterval(() => {
    if (currentAccount && !document.hidden) {
      loadPublicSupportConfig();
    }
  }, 300000);
}

function stopSupportConfigPolling() {
  if (!supportConfigPollId) return;
  window.clearInterval(supportConfigPollId);
  supportConfigPollId = null;
}

function renderAgentAlert() {
  if (!elements.agentAlertOverlay) return;
  activeAgentAlert = pendingAgentAlerts[0] || null;
  if (!currentAccount || !activeAgentAlert) {
    elements.agentAlertOverlay.hidden = true;
    document.body.classList.remove("has-agent-alert");
    return;
  }

  const severity = activeAgentAlert.severity || "info";
  elements.agentAlertOverlay.hidden = false;
  elements.agentAlertOverlay.dataset.severity = severity;
  elements.agentAlertSeverity.textContent = severity === "critical" ? "Alerta critica" : severity === "warning" ? "Aviso importante" : "Aviso operativo";
  elements.agentAlertTitle.textContent = activeAgentAlert.title || "Alerta";
  elements.agentAlertMessage.textContent = activeAgentAlert.message || "";
  elements.agentAlertAckBtn.disabled = false;
  elements.agentAlertAckBtn.textContent = "Ya lo vi";
  document.body.classList.add("has-agent-alert");
}

async function handleAgentAlertAck() {
  if (!activeAgentAlert) return;
  elements.agentAlertAckBtn.disabled = true;
  elements.agentAlertAckBtn.textContent = "Guardando...";
  try {
    await fetchJson("/api/support-config?action=ack-alert", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        alertId: activeAgentAlert.id,
        version: activeAgentAlert.updatedAt
      })
    });
    pendingAgentAlerts = pendingAgentAlerts.filter((alert) => alert.id !== activeAgentAlert.id);
    renderAgentAlert();
    loadPublicSupportConfig();
  } catch (error) {
    elements.agentAlertAckBtn.disabled = false;
    elements.agentAlertAckBtn.textContent = "Ya lo vi";
    showResult(`No pude marcar la alerta como vista: ${formatError(error.message)}`, "error");
  }
}

function renderListPanelTabs() {
  if (!elements.listPanelTabs || !elements.listPanelWidget) return;
  const panels = Array.isArray(supportConfig.listPanels) ? supportConfig.listPanels : [];
  elements.listPanelTabs.hidden = !panels.length;
  elements.listPanelTabs.innerHTML = panels
    .map((panel) => `
      <button
        type="button"
        class="list-panel-tab${activeListPanelId === panel.id ? " active" : ""}"
        data-panel-id="${escapeHtml(panel.id)}"
      >${escapeHtml(panel.label || panel.id)}</button>
    `)
    .join("");

  if (!panels.some((panel) => panel.id === activeListPanelId)) {
    activeListPanelId = "";
    elements.listPanelWidget.hidden = true;
    elements.listPanelWidget.innerHTML = "";
  }
}

async function handleListPanelClick(event) {
  if (!ensureAuthenticated()) return;
  const button = event.target.closest("[data-panel-id]");
  if (!button) return;
  const panelId = button.dataset.panelId || "";
  if (elements.slackListDrawer) elements.slackListDrawer.open = true;
  activeListPanelId = panelId;
  activeListPanelEmail = "";
  renderListPanelTabs();
  await loadListPanelItems(panelId, "");
}

async function loadListPanelItems(panelId, email) {
  if (!ensureAuthenticated()) return;
  if (!SLACK_LIST_LOOKUPS_ENABLED) {
    renderListPanelPaused();
    return;
  }
  renderListPanelLoading(panelId, email);
  try {
    const query = new URLSearchParams({
      mode: "items",
      panel: panelId
    });
    if (email) query.set("email", email);
    const data = await fetchJson(`/api/slack-list-schema?${query.toString()}`);
    activeListPanelEmail = data.panel?.email || email || "";
    renderListPanelItems(data.panel || {}, data.items || []);
  } catch (error) {
    renderListPanelError(formatError(error.message));
  }
}

function handleListPanelWidgetClick(event) {
  if (!ensureAuthenticated()) return;
  const refreshButton = event.target.closest("[data-list-panel-refresh]");
  if (refreshButton) {
    loadListPanelItems(activeListPanelId || refreshButton.dataset.panelId || "", activeListPanelEmail);
    return;
  }

  const clearButton = event.target.closest("[data-list-panel-clear]");
  if (clearButton) {
    activeListPanelEmail = "";
    loadListPanelItems(activeListPanelId || clearButton.dataset.panelId || "", "");
  }
}

function handleListPanelSearchSubmit(event) {
  if (!event.target.matches("[data-list-panel-search]")) return;
  event.preventDefault();
  if (!ensureAuthenticated()) return;
  const formData = new FormData(event.target);
  const email = String(formData.get("email") || "").trim();
  activeListPanelEmail = email;
  loadListPanelItems(activeListPanelId, email);
}

function openSlackListsForCustomer() {
  if (!ensureAuthenticated()) return;
  const panels = Array.isArray(supportConfig.listPanels) ? supportConfig.listPanels.filter((panel) => panel?.id) : [];
  if (!panels.length) {
    showResult("No hay listas de Slack configuradas para consultar.", "error");
    return;
  }

  showView("search");
  if (elements.slackListDrawer) elements.slackListDrawer.open = true;
  const panel = panels.find((item) => item.id === activeListPanelId) || panels[0];
  activeListPanelId = panel.id;
  const email = looksLikeEmail(elements.customerEmail.value) ? elements.customerEmail.value.trim().toLowerCase() : "";
  activeListPanelEmail = email;
  renderListPanelTabs();
  loadListPanelItems(panel.id, email);
  requestAnimationFrame(() => elements.slackListDrawer?.scrollIntoView({ block: "start", behavior: "smooth" }));
}

function runCustomerUnifiedSearch() {
  if (!ensureAuthenticated()) return;
  const query = [elements.customerEmail.value, elements.authId.value, elements.customerName.value]
    .map((value) => String(value || "").trim())
    .find(Boolean);
  if (!query) {
    showResult("LiveChat todavía no entregó un correo, ID o nombre para buscar.", "error");
    return;
  }

  showView("search");
  elements.ticketSearchInput.value = query;
  elements.searchForm.requestSubmit();
}

async function handleKycLookup() {
  const email = String(elements.customerEmail?.value || "").trim().toLowerCase();
  if (!looksLikeEmail(email)) {
    elements.kycLookupStatus.textContent = "LiveChat no entregó un correo válido";
    return;
  }
  elements.kycLookupBtn.disabled = true;
  elements.kycLookupStatus.textContent = "Buscando en Usuarios KYC y Verificaciones...";
  elements.kycLookupResults.innerHTML = "";
  closeKycDocument();
  try {
    const request = await fetchJson("/api/atena-bridge?service=kyc&action=request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email })
    });
    const data = await waitForKycBridgeResult(request.job?.id);
    if (String(elements.customerEmail?.value || "").trim().toLowerCase() !== email) return;
    lastKycLookupEmail = email;
    renderKycLookup(data.result);
  } catch (error) {
    const message = String(error?.message || "kyc_lookup_failed");
    const labels = {
      kyc_login_required: "Inicia sesión en la ventana de KYC y vuelve a consultar",
      kyc_job_expired: "La consulta caducó antes de que KYC estuviera listo",
      kyc_connector_timeout: "El conector KYC no respondió dentro del tiempo esperado",
      kyc_job_not_found: "La consulta KYC expiró; vuelve a consultar",
      connector_unauthorized: "El conector KYC no está autorizado"
    };
    elements.kycLookupStatus.textContent = labels[message] || `Consulta KYC: ${message}`;
  } finally {
    elements.kycLookupBtn.disabled = false;
  }
}

async function waitForKycBridgeResult(jobId) {
  if (!jobId) throw new Error("kyc_job_not_created");
  let networkFailures = 0;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    let response;
    try {
      response = await fetchJson("/api/atena-bridge?service=kyc&action=result", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jobId })
      });
      networkFailures = 0;
    } catch (error) {
      networkFailures += 1;
      if (networkFailures < 4) continue;
      throw error;
    }
    if (response.job?.status === "pending") elements.kycLookupStatus.textContent = "Esperando que la sesión de KYC esté lista...";
    if (response.job?.status === "processing") elements.kycLookupStatus.textContent = "Consultando Usuarios KYC, Verificaciones y documentos...";
    if (response.job?.status === "completed") return response.job;
    if (response.job?.status === "failed") throw new Error(response.job.error || "kyc_lookup_failed");
  }
  throw new Error("kyc_connector_timeout");
}

function renderKycLookup(data) {
  const sources = data?.sources || {};
  const users = sources.users || { label: "Usuarios KYC", results: [] };
  const verifications = sources.verifications || { label: "Verificaciones", results: [] };
  const usersCount = Array.isArray(users.results) ? users.results.length : 0;
  const verificationsCount = Array.isArray(verifications.results) ? verifications.results.length : 0;
  elements.kycLookupStatus.textContent = `Usuarios KYC: ${usersCount} · Verificaciones: ${verificationsCount}`;
  elements.kycLookupResults.innerHTML = [
    renderKycSource(users, "users"),
    renderKycSource(verifications, "verifications")
  ].join("");
}

function renderKycSource(source, sourceKey) {
  const results = Array.isArray(source?.results) ? source.results : [];
  const label = source?.label || (sourceKey === "users" ? "Usuarios KYC" : "Verificaciones");
  const body = results.length
    ? results.map((result, index) => renderKycResult(result, index)).join("")
    : '<p class="kyc-source-empty">Sin coincidencias exactas para este correo.</p>';
  return `
    <section class="kyc-source-block" data-source="${escapeHtml(sourceKey)}">
      <header><b>${escapeHtml(label)}</b><span>${results.length} ${results.length === 1 ? "resultado" : "resultados"}</span></header>
      <div class="kyc-source-results">${body}</div>
    </section>`;
}

function renderKycResult(result, index) {
  const personal = result?.personal || {};
  const checks = result?.checks || {};
  const state = formatKycState(result?.status);
  const fields = [
    ["Nombre", personal.firstName],
    ["Apellido paterno", personal.paternalSurname],
    ["Apellido materno", personal.maternalSurname],
    ["Email", personal.email],
    ["Teléfono", personal.phone],
    ["Fecha de nacimiento", formatKycDate(personal.dateOfBirth)],
    ["CURP", personal.curp],
    ["Sexo", personal.sex],
    ["Profesión", personal.profession],
    ["Tipo de documento", personal.documentType],
    ["Número de documento", personal.documentNumber]
  ];
  const checkItems = [
    ["Selfie", checks.selfieVerified],
    ["Documento", checks.documentVerified],
    ["Domicilio", checks.addressVerified],
    ["Prueba de vida", checks.livenessVerified]
  ].map(([label, value]) => `<span class="kyc-check ${value === true ? "is-ok" : value === false ? "is-fail" : "is-unknown"}">${escapeHtml(label)}: ${value === true ? "verificado" : value === false ? "pendiente" : "sin dato"}</span>`).join("");
  const documents = [result?.documents?.selfie, result?.documents?.ineFront, result?.documents?.ineBack]
    .filter(Boolean)
    .map(renderKycDocument)
    .join("");
  const duplicate = checks.hasDuplicates ? '<span class="kyc-risk-flag">ALERTA DE DUPLICADO</span>' : "";
  const profileLink = result?.profileUrl
    ? `<a class="kyc-profile-link" href="${escapeHtml(result.profileUrl)}" target="_blank" rel="noopener noreferrer">Abrir registro en KYC</a>`
    : "";
  return `
    <article class="kyc-result-card">
      <div class="kyc-result-title">
        <span><b>Resultado ${index + 1}</b><small>${escapeHtml(formatKycDate(result?.createdAt) || "Sin fecha")}</small></span>
        <em class="${state.className}">${escapeHtml(state.label)}</em>
      </div>
      ${duplicate}
      <dl class="kyc-personal-grid">
        ${fields.map(([label, value]) => `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value || "—")}</dd></div>`).join("")}
      </dl>
      <div class="kyc-checks">${checkItems}</div>
      <section class="kyc-documents">
        <div class="kyc-documents-heading"><b>Documentos</b><span>Haz clic para revisar legibilidad</span></div>
        <div class="kyc-document-grid">${documents}</div>
      </section>
      ${profileLink}
    </article>`;
}

function renderKycDocument(document) {
  if (!document?.url) {
    return `<div class="kyc-document-missing"><b>${escapeHtml(document?.label || "Documento")}</b><span>No disponible</span></div>`;
  }
  return `
    <button type="button" class="kyc-document-thumb" data-kyc-document-url="${escapeHtml(document.url)}" data-kyc-document-label="${escapeHtml(document.label || "Documento KYC")}">
      <img src="${escapeHtml(document.url)}" alt="${escapeHtml(document.label || "Documento KYC")}" loading="lazy" referrerpolicy="no-referrer">
      <span><b>${escapeHtml(document.label || "Documento")}</b><small>${escapeHtml(document.status || "Disponible")}</small></span>
    </button>`;
}

function formatKycState(value) {
  const normalized = normalizeText(value || "");
  if (/approved|aprob/.test(normalized)) return { label: "APROBADO", className: "is-approved" };
  if (/rejected|rechaz/.test(normalized)) return { label: "RECHAZADO", className: "is-rejected" };
  if (/needs.review|review|revision|revis/.test(normalized)) return { label: "REQUIERE REVISIÓN", className: "is-review" };
  if (/in.progress|documents.uploaded|process|flujo/.test(normalized)) return { label: "EN PROCESO", className: "is-pending" };
  if (/blocked|bloque/.test(normalized)) return { label: "BLOQUEADO", className: "is-rejected" };
  if (/abandoned|abandon/.test(normalized)) return { label: "ABANDONADO", className: "is-neutral" };
  if (/pending|pend/.test(normalized)) return { label: "PENDIENTE", className: "is-pending" };
  return { label: value ? String(value).toUpperCase() : "SIN ESTADO", className: "is-neutral" };
}

function formatKycDate(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return text;
  return date.toLocaleString("es-MX", { timeZone: "America/Mexico_City", dateStyle: "medium", timeStyle: text.includes("T") ? "short" : undefined });
}

function handleKycDocumentClick(event) {
  const button = event.target.closest("[data-kyc-document-url]");
  if (!button) return;
  const url = String(button.dataset.kycDocumentUrl || "");
  if (!url.startsWith("https://")) return;
  const label = String(button.dataset.kycDocumentLabel || "Documento KYC");
  elements.kycDocumentTitle.textContent = label;
  elements.kycDocumentImage.src = url;
  elements.kycDocumentImage.alt = label;
  elements.kycDocumentOpenBtn.href = url;
  elements.kycDocumentOverlay.hidden = false;
}

function closeKycDocument() {
  if (!elements.kycDocumentOverlay) return;
  elements.kycDocumentOverlay.hidden = true;
  if (elements.kycDocumentImage) elements.kycDocumentImage.removeAttribute("src");
  if (elements.kycDocumentOpenBtn) elements.kycDocumentOpenBtn.href = "#";
}

function clearKycLookupIfCustomerChanged() {
  const currentEmail = String(elements.customerEmail?.value || "").trim().toLowerCase();
  if (!lastKycLookupEmail || currentEmail === lastKycLookupEmail) return;
  lastKycLookupEmail = "";
  closeKycDocument();
  if (elements.kycLookupStatus) elements.kycLookupStatus.textContent = "Usuarios y Verificaciones no consultados";
  if (elements.kycLookupResults) elements.kycLookupResults.innerHTML = "";
}

async function handleAtenaLookup() {
  const email = String(elements.customerEmail?.value || "").trim().toLowerCase();
  if (!looksLikeEmail(email)) {
    elements.atenaLookupStatus.textContent = "LiveChat no entregó un correo válido";
    return;
  }
  const end = new Date();
  const start = new Date(end);
  start.setDate(start.getDate() - 6);
  const date = (value) => value.toLocaleDateString("en-CA", { timeZone: "America/Mexico_City" });
  elements.atenaLookupBtn.disabled = true;
  elements.atenaLookupStatus.textContent = "Enviando consulta a Atena...";
  elements.atenaLookupResults.innerHTML = "";
  try {
    const request = await fetchJson("/api/atena-bridge?action=request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, startDate: date(start), endDate: date(end) }) });
    const data = await waitForAtenaBridgeResult(request.job?.id);
    renderAtenaLookup(data.result);
  } catch (error) {
    const message = String(error?.message || "atena_lookup_failed");
    const labels = {
      atena_session_required: "Atena requiere iniciar sesión",
      atena_login_required: "Inicia sesión en la ventana de Atena y vuelve a consultar",
      atena_customer_not_found: "No encontré ese correo en Atena",
      atena_job_expired: "La consulta caducó antes de que Atena estuviera lista",
      atena_connector_timeout: "Atena no respondió dentro del tiempo esperado",
      atena_lookup_unavailable: "Atena no terminó la consulta; inténtalo una vez más",
      "Timeout 15000ms exceeded.": "Atena tardó demasiado en responder"
    };
    elements.atenaLookupStatus.textContent = labels[message] || `Consulta Atena: ${message}`;
  } finally {
    elements.atenaLookupBtn.disabled = false;
  }
}

async function waitForAtenaBridgeResult(jobId) {
  if (!jobId) throw new Error("atena_job_not_created");
  let networkFailures = 0;
  for (let attempt = 0; attempt < 90; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    let response;
    try {
      response = await fetchJson("/api/atena-bridge?action=result", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jobId }) });
      networkFailures = 0;
    } catch (error) {
      networkFailures += 1;
      if (networkFailures < 4) continue;
      throw error;
    }
    if (response.job?.status === "pending") elements.atenaLookupStatus.textContent = "Esperando que la sesión de Atena esté lista...";
    if (response.job?.status === "processing") elements.atenaLookupStatus.textContent = "Consultando retiro, saldo y extracto...";
    if (response.job?.status === "completed") return response.job;
    if (response.job?.status === "failed") throw new Error(response.job.error || "atena_lookup_failed");
  }
  throw new Error("atena_connector_timeout");
}

function renderAtenaLookup(data) {
  const customer = data.customer || {};
  const withdrawal = data.latestWithdrawal || null;
  const withdrawalState = formatAtenaWithdrawalState(withdrawal?.status);
  const balance = String(customer.balance || "").trim();
  const balanceAmount = Number(balance.replace(/[^0-9.-]/g, ""));
  const balanceState = Number.isFinite(balanceAmount)
    ? balanceAmount > 0
      ? { label: "CON SALDO", className: "has-balance" }
      : { label: "SIN SALDO", className: "no-balance" }
    : { label: "SALDO NO DISPONIBLE", className: "unknown-balance" };
  const withdrawals = Array.isArray(data.latestWithdrawals) && data.latestWithdrawals.length
    ? data.latestWithdrawals
    : withdrawal ? [withdrawal] : [];
  const movements = Array.isArray(data.dailyExtractMovements)
    ? data.dailyExtractMovements
    : Array.isArray(data.latestExtractMovements) ? data.latestExtractMovements : [];
  const withdrawalRows = withdrawals.length
    ? withdrawals.map((item) => {
      const state = formatAtenaWithdrawalState(item.status);
      return `<li><span><b>${escapeHtml(item.amount || "Monto no disponible")}</b><small>${escapeHtml([item.date, item.detail].filter(Boolean).join(" · ") || "Sin detalle")}</small></span><em class="${state.className}">${escapeHtml(state.label)}</em></li>`;
    }).join("")
    : '<li class="atena-empty-movement">No hay retiros registrados en el periodo.</li>';
  const movementRows = movements.length
    ? movements.map((movement) => `<li><span><b>${escapeHtml(movement.detail || "Movimiento")}</b><small>${escapeHtml(movement.date || "Sin fecha")}${movement.status ? ` · ${escapeHtml(movement.status)}` : ""}</small></span><strong>${escapeHtml(movement.amount || "—")}</strong></li>`).join("")
    : '<li class="atena-empty-movement">No hay movimientos para el día consultado.</li>';
  elements.atenaLookupStatus.textContent = `${customer.name || "Cliente"} · saldo ${customer.balance || "sin saldo"}`;
  elements.atenaLookupResults.innerHTML = `
    <article class="customer-auto-result atena-result">
      <div class="atena-client-line"><b>${escapeHtml(customer.email || "")}</b><span>${escapeHtml(data.range?.startDate || "")} a ${escapeHtml(data.range?.endDate || "")}</span></div>
      <section class="atena-current-withdrawal ${withdrawal ? "" : "is-empty"}">
        <span class="atena-section-label">RETIRO ACTUAL</span>
        ${withdrawal
          ? `<div class="atena-withdrawal-main"><strong>${escapeHtml(withdrawal.amount || "Monto no disponible")}</strong><em class="${withdrawalState.className}">${escapeHtml(withdrawalState.label)}</em></div><p>${escapeHtml([withdrawal.date, withdrawal.detail].filter(Boolean).join(" · ") || "Sin detalle del retiro")}</p>`
          : "<p>No hay retiros registrados en este periodo.</p>"}
      </section>
      <section class="atena-movements atena-withdrawal-history">
        <span class="atena-section-label">ÚLTIMOS 3 RETIROS</span>
        <ol>${withdrawalRows}</ol>
      </section>
      <section class="atena-balance">
        <span><small>SALDO EN CUENTA</small><strong>${escapeHtml(balance || "No disponible")}</strong></span>
        <em class="${balanceState.className}">${balanceState.label}</em>
      </section>
      <section class="atena-movements">
        <span class="atena-section-label">MOVIMIENTOS DEL DÍA</span>
        <ol>${movementRows}</ol>
      </section>
    </article>`;
}

function formatAtenaWithdrawalState(value) {
  const normalized = normalizeText(value || "");
  if (/pagad|pago|paid|concluid|complet/.test(normalized)) return { label: "PAGADO", className: "is-approved" };
  if (/anal|revision|revisao|review|ret(en|id)/.test(normalized)) return { label: "EN ANÁLISIS", className: "is-pending" };
  if (/esper|pend|aguard|aprov/.test(normalized)) return { label: "AGUARDANDO APROBACIÓN", className: "is-pending" };
  if (/cancel|rechaz|declin/.test(normalized)) return { label: "CANCELADO", className: "is-rejected" };
  return { label: value ? String(value).toUpperCase() : "SIN ESTADO", className: "is-neutral" };
}

function renderListPanelLoading(panelId, email = "") {
  const panel = (supportConfig.listPanels || []).find((item) => item.id === panelId) || {};
  const listLabel = getListPanelShortLabel(panel);
  elements.listPanelWidget.hidden = false;
  elements.listPanelWidget.innerHTML = `
    <div class="list-panel-heading">
      <div>
        <h2>${escapeHtml(panel.label || "Lista Slack")}</h2>
        <p>${email ? `Buscando ${escapeHtml(email)} en todos los estados de ${escapeHtml(listLabel)}.` : `Cargando los ultimos ${panel.limit || 25} registros desde ${escapeHtml(listLabel)}.`}</p>
      </div>
    </div>
    <div class="list-panel-empty">Consultando la lista...</div>
  `;
}

function renderListPanelItems(panel, items) {
  const email = panel.email || activeListPanelEmail || "";
  elements.listPanelWidget.hidden = false;
  elements.listPanelWidget.innerHTML = `
    <div class="list-panel-heading">
      <div>
        <h2>${escapeHtml(panel.label || "Lista Slack")}</h2>
        <p>${email ? `${items.length} coincidencias por correo` : `${items.length} ultimos registros`}</p>
      </div>
      <button type="button" class="secondary-button list-panel-refresh" data-list-panel-refresh data-panel-id="${escapeHtml(panel.id || activeListPanelId)}">ACTUALIZAR</button>
    </div>
    <form class="list-panel-search" data-list-panel-search>
      <label>
        <span class="field-label">Buscar por correo</span>
        <input name="email" type="email" autocomplete="off" placeholder="cliente@correo.com" value="${escapeHtml(email)}">
      </label>
      <button type="submit">BUSCAR</button>
      ${email ? `<button type="button" class="secondary-button" data-list-panel-clear data-panel-id="${escapeHtml(panel.id || activeListPanelId)}">LIMPIAR</button>` : ""}
    </form>
    ${items.length ? `
      <div class="list-panel-grid">
        ${items.map((item) => renderListPanelCard(item, panel)).join("")}
      </div>
    ` : `
      <div class="list-panel-empty">${email ? "No encontré ese correo en la lista revisada." : "No encontré registros recientes en la lista."}</div>
    `}
  `;
}

function renderListPanelCard(item, panel = {}) {
  const trace = resolveCardTraceability(item);
  const listLabel = getListPanelShortLabel(panel);
  const meta = [
    item.amount ? `$${item.amount}` : "",
    item.listStatus ? `${listLabel}: ${item.listStatus}` : "",
    item.rvc ? `RVC: ${item.rvc}` : "",
    item.kycCompleto ? `KYC: ${item.kycCompleto}` : ""
  ].filter(Boolean);
  const retentionReason = item.retentionReason || [item.reviewTopic, item.detail, item.reviewDetail, item.rvc].filter(Boolean).join(" · ");
  const approvalStatus = formatApprovalStatus(item.withdrawalStatus || item.approvalStatus);
  const kycSummary = [
    item.validas ? `Validas ${item.validas}` : "",
    item.noPasan ? `No pasan ${item.noPasan}` : "",
    item.total ? `Total ${item.total}` : ""
  ].filter(Boolean);
  const title = item.authId || item.email || item.jiraKey || "Registro Slack";
  return `
    <article class="list-panel-card">
      <div class="list-panel-card-header">
        <strong>${escapeHtml(title)}</strong>
        ${item.updatedAt ? `<time>${escapeHtml(formatDate(item.updatedAt))}</time>` : ""}
      </div>
      <span class="approval-status ${approvalStatus.className}">${escapeHtml(approvalStatus.label)}</span>
      ${meta.length ? `<p class="list-panel-meta">${escapeHtml(meta.join(" · "))}</p>` : ""}
      <dl>
        ${item.email ? `<div><dt>Correo</dt><dd>${escapeHtml(item.email)}</dd></div>` : ""}
        ${item.authId ? `<div><dt>AUTH ID</dt><dd>${escapeHtml(item.authId)}</dd></div>` : ""}
        ${item.assignedPerson ? `<div><dt>Asignado</dt><dd>${escapeHtml(item.assignedPerson)}</dd></div>` : ""}
        ${trace ? `<div class="traceability-card-row"><dt>cuentaclabe</dt><dd>${renderTraceabilityCardValue(trace)}</dd></div>` : ""}
      </dl>
      ${kycSummary.length ? `<p class="list-panel-meta">${escapeHtml(kycSummary.join(" · "))}</p>` : ""}
      ${retentionReason ? `<p class="list-panel-retention"><strong>Motivo de retención</strong><span>${escapeHtml(truncateText(retentionReason, 220))}</span></p>` : ""}
      ${item.jiraUrl ? `<a class="list-panel-link" href="${escapeHtml(item.jiraUrl)}" target="_blank" rel="noreferrer">Abrir Jira</a>` : ""}
    </article>
  `;
}

function getListPanelShortLabel(panel = {}) {
  const label = String(panel.label || panel.panelLabel || "Lista Slack").trim();
  return label.match(/lista\s+\d+/i)?.[0] || label;
}

function resolveCardTraceability(item) {
  if (supportConfig.traceability?.enabled === false) return null;
  const email = normalizeTraceabilityEmail(item.email);
  const withdrawalClabe = normalizeTraceabilityClabe(item.withdrawalClabe || extractTraceabilityClabe(item.detail));
  if (!email || !withdrawalClabe) return null;
  const deposits = Array.isArray(supportConfig.traceability?.deposits) ? supportConfig.traceability.deposits : [];
  const deposit = deposits
    .filter((entry) => normalizeTraceabilityEmail(entry.email) === email)
    .sort((left, right) => Number(right.dateTs || 0) - Number(left.dateTs || 0))[0];
  if (!deposit?.depositClabe) return null;
  const depositClabe = normalizeTraceabilityClabe(deposit.depositClabe);
  if (!depositClabe) return null;
  const same = withdrawalClabe === depositClabe;
  return {
    same,
    withdrawalClabe,
    depositClabe
  };
}

function renderTraceabilityCardValue(trace) {
  if (trace.same) {
    return `<span class="traceability-card-match">misma cuenta</span> <span>${escapeHtml(trace.withdrawalClabe)}</span>`;
  }
  return `
    <span class="traceability-card-mismatch">cuenta diferente</span>
    <span>retiro: ${escapeHtml(trace.withdrawalClabe)}</span>
    <span>deposito: ${escapeHtml(trace.depositClabe)}</span>
  `;
}

function formatApprovalStatus(value) {
  const label = String(value || "").trim();
  const normalized = normalizeText(label);
  if (normalized === "aprobar") {
    return { label: "APROBAR", className: "is-approved" };
  }
  if (normalized === "pedir documentos") {
    return { label: "PEDIR DOCUMENTOS", className: "is-documents" };
  }
  if (normalized === "cancelar" || normalized === "cancelado") {
    return { label: "CANCELADO", className: "is-rejected" };
  }
  if (normalized === "advertencia") {
    return { label: "ADVERTENCIA", className: "is-documents" };
  }
  if (normalized.includes("retenido") || normalized === "pendiente") {
    return { label: "RETENIDO / EN REVISIÓN", className: "is-pending" };
  }
  if (normalized === "completado") {
    return { label: "COMPLETADO", className: "is-neutral" };
  }
  if (!normalized) {
    return { label: "RETENIDO / EN REVISIÓN", className: "is-pending" };
  }
  return { label: label.toUpperCase(), className: "is-neutral" };
}

function renderListPanelError(message) {
  elements.listPanelWidget.hidden = false;
  elements.listPanelWidget.innerHTML = `
    <div class="list-panel-heading">
      <div>
        <h2>Lista Slack</h2>
        <p>No pude cargar los registros.</p>
      </div>
    </div>
    <div class="list-panel-empty error">${escapeHtml(message)}</div>
  `;
}

function renderListPanelPaused() {
  if (!elements.listPanelWidget) return;
  elements.listPanelWidget.hidden = false;
  elements.listPanelWidget.innerHTML = `
    <div class="list-panel-heading">
      <div>
        <h2>Listas Slack</h2>
        <p>Consulta temporalmente pausada.</p>
      </div>
    </div>
    <div class="list-panel-empty">${escapeHtml(SLACK_LIST_LOOKUPS_PAUSED_MESSAGE)}</div>
  `;
}

function setReportWorkflows(workflows) {
  if (!Array.isArray(workflows) || !workflows.length) return;
  const previous = elements.ticketDestination.value;
  reportWorkflows = workflows.reduce((acc, workflow) => {
    if (!workflow?.id || workflow.enabled === false || ["cierre-sesiones", "cierre-sesiones-jira"].includes(workflow.id)) return acc;
    acc[workflow.id] = {
      id: workflow.id,
      label: workflow.label || workflow.id,
      destination: ["jira", "slack", "both"].includes(workflow.destination) ? workflow.destination : "jira",
      jiraIssueType: workflow.jiraIssueType || "",
      slackRouteId: workflow.slackRouteId || "",
      slackTemplate: workflow.slackTemplate || "",
      requiredSlackFields: Array.isArray(workflow.requiredSlackFields) ? workflow.requiredSlackFields : []
    };
    return acc;
  }, {});
  if (!reportWorkflows.jira) {
    reportWorkflows.jira = DEFAULT_REPORT_WORKFLOWS.jira;
  }
  renderReportWorkflowOptions(previous);
}

function renderReportWorkflowOptions(previousValue = "") {
  const workflows = Object.values(reportWorkflows);
  elements.ticketDestination.innerHTML = workflows
    .map((workflow) => `<option value="${escapeHtml(workflow.id)}">${escapeHtml(workflow.label)}</option>`)
    .join("");
  elements.ticketDestination.value = reportWorkflows[previousValue] ? previousValue : workflows[0]?.id || "jira";
}

function showView(view) {
  if (!currentAccount && view !== "settings") {
    view = "settings";
    showResult("Primero inicia sesión con Slack.", "error");
  }

  const isTicket = view === "ticket";
  const isSettings = view === "settings";
  const isCase = view === "case";
  const isBob = view === "bob";
  const isSearch = view === "search" || isCase;
  document.body.dataset.view = view;
  elements.ticketTab.classList.toggle("active", !isSearch || isCase);
  elements.ticketTab.textContent = isCase || isBob ? "VOLVER AL INICIO" : "VOLVER AL CONTEXTO";
  elements.searchView.classList.toggle("active", isSearch);
  elements.bobSessionsPanel?.classList.toggle("active", isBob);
  elements.ticketForm.classList.toggle("active", isTicket);
  elements.settingsView.classList.toggle("active", isSettings);
  requestAnimationFrame(() => {
    document.querySelector(".app-shell")?.scrollTo({ top: 0, left: 0 });
    window.scrollTo({ top: 0, left: 0 });
  });

  if (view === "search") {
    setScreenCopy("Centro de tickets", "Busca y gestiona las incidencias de nuestros clientes");
    applyDefaultTicketSearch();
  } else if (isCase) {
    setScreenCopy("Expediente operativo", "Revisa el caso y prepara acciones supervisadas");
    if (elements.caseAgentPanel) elements.caseAgentPanel.hidden = false;
  } else if (isBob) {
    setScreenCopy("Cierre de sesiones", "Consulta el estado de cada solicitud de BoB");
    loadBobHistory();
  } else if (isTicket) {
    setScreenCopy("Crear ticket", "Registra una nueva incidencia para dar seguimiento");
    renderDestinationMode();
  } else if (!currentAccount) {
    setScreenCopy("Iniciar sesión", "Acceso al centro de tickets");
  } else {
    setScreenCopy("Configuración", "Administra la sesión y credenciales del agente");
  }
}

function setScreenCopy(title, subtitle) {
  elements.screenTitle.textContent = title;
  elements.screenSubtitle.textContent = subtitle;
}

function ensureAuthenticated() {
  if (currentAccount) {
    refreshSupportConfigIfDue(30000);
    return true;
  }
  showView("settings");
  showResult("Primero inicia sesión con Slack para usar el centro de tickets.", "error");
  return false;
}

function openKycBackofficeSearch() {
  if (!ensureAuthenticated()) return;
  syncKycEmailInput();
  const email = readKycEmail();
  if (!looksLikeEmail(email)) {
    showResult("Escribe un correo válido para abrir KYC.", "error");
    return;
  }

  const usersPopup = window.open(buildKycBackofficeUrl("users", email), "_blank", "noopener,noreferrer");
  const verificationsPopup = window.open(buildKycBackofficeUrl("verifications", email), "_blank", "noopener,noreferrer");
  copyTextToClipboard(email).catch(() => null);
  if (!usersPopup && !verificationsPopup) {
    showResult(`No pude abrir KYC automáticamente. Copié el correo: ${email}`, "error");
    return;
  }

  showResult(`Abrí Usuarios y Verificaciones KYC. Copié el correo ${email}.`, "success");
}

function buildKycBackofficeUrl(section, email) {
  const base = "https://backoffice-kyc.paybridge.com.mx";
  const path = section === "verifications" ? "/dashboard/verifications" : "/dashboard/users";
  const params = new URLSearchParams({
    search: email,
    page: "1",
    limit: "20",
    sort_by: "created_at",
    sort_order: "desc"
  });
  return `${base}${path}?${params.toString()}`;
}

function syncKycEmailInput(options = {}) {
  if (!elements.kycEmailInput) return;
  const detectedEmail = elements.customerEmail.value.trim().toLowerCase();
  if (options.force || (!elements.kycEmailInput.value.trim() && looksLikeEmail(detectedEmail))) {
    elements.kycEmailInput.value = detectedEmail;
  }
}

function readKycEmail() {
  return String(elements.kycEmailInput?.value || elements.customerEmail.value || "").trim().toLowerCase();
}

async function submitKycReviewStatus(status) {
  if (!ensureAuthenticated()) return;
  syncKycEmailInput();
  const email = readKycEmail();
  if (!looksLikeEmail(email)) {
    showResult("Escribe un correo válido para registrar KYC.", "error");
    return;
  }

  const button = status === "complete" ? elements.kycCompleteBtn : elements.kycIncompleteBtn;
  const previousHtml = button?.innerHTML || "";
  if (button) {
    button.disabled = true;
    button.textContent = "Guardando...";
  }

  try {
    const data = await fetchJson("/api/support-config?action=kyc-review-status", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email,
        status,
        customerName: elements.customerName.value.trim(),
        customerId: elements.authId.value.trim(),
        chatId: elements.chatId.value.trim()
      })
    });
    const label = data.review?.status === "complete" ? "KYC completo" : "KYC incompleto";
    renderKycReviewStatus(data.review?.status || status);
    if (String(elements.chatId?.value || "").trim()) {
      await loadCustomerContext().catch(() => null);
    }
    showResult(`${label} registrado para ${email}.`, "success");
  } catch (error) {
    showResult(`No pude registrar KYC: ${formatError(error.message)}`, "error");
  } finally {
    if (button) {
      button.disabled = false;
      button.innerHTML = previousHtml;
    }
  }
}

async function copyTextToClipboard(text) {
  if (!navigator.clipboard?.writeText) return;
  await navigator.clipboard.writeText(text);
}

function handleCustomerProfile(profile) {
  const nextProfileKey = buildProfileKey(profile);
  const changedProfile = Boolean(activeProfileKey && nextProfileKey && activeProfileKey !== nextProfileKey);
  if (changedProfile) {
    clearCustomerScopedFields();
  }
  activeProfileKey = nextProfileKey || activeProfileKey;
  livechatProfile = profile || null;
  elements.customerName.value = profile?.name || readProfileValue(profile, [
    "default_NombreCompleto",
    "Nombre Completo",
    "NombreCompleto",
    "name"
  ]);
  elements.customerEmail.value = profile?.email || readProfileValue(profile, [
    "default_E-mail",
    "default_Email",
    "E-mail",
    "Email",
    "email"
  ]);
  elements.chatId.value = profile?.chat?.chat_id || "";
  elements.authId.value = readProfileValue(profile, [
    "externalId",
    "external_id",
    "externalID",
    "external_id_cliente",
    "External ID",
    "default_IDdeJugador",
    "ID de Jugador",
    "IDdeJugador",
    "idJugador",
    "playerId"
  ]);
  renderCustomerProfileSummary();
  renderKycReviewStatus();
  syncKycEmailInput({ force: true });
  applyAutofill({ force: true });
  applySlackAutofill({ force: true });
  applyDefaultTicketSearch();
  if (elements.replyInput) loadChatMessagesForSuggestion();
  maybeSendLiveChatWelcome();
  scheduleLiveChatSafeTemplateCheck(4500);
  window.setTimeout(() => loadCustomerContext().catch(() => null), 800);
  renderDestinationMode();
}

function renderCustomerProfileSummary() {
  clearKycLookupIfCustomerChanged();
  const name = elements.customerName?.value?.trim() || "Cliente sin detectar";
  const email = elements.customerEmail?.value?.trim() || "Esperando datos de LiveChat";
  const initials = name === "Cliente sin detectar"
    ? "--"
    : name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
  if (elements.customerAvatar) elements.customerAvatar.textContent = initials || "--";
  if (elements.customerDisplayName) elements.customerDisplayName.textContent = name;
  if (elements.customerProfileStatus) {
    elements.customerProfileStatus.textContent = elements.authId?.value?.trim()
      ? `ID ${elements.authId.value.trim()} · ${email}`
      : email;
  }
}

function renderKycReviewStatus(status = "") {
  const normalized = String(status || "").trim().toLowerCase();
  const label = normalized === "complete" ? "Completo" : normalized === "incomplete" ? "Incompleto" : "Sin revisar";
  [elements.kycStatusBadge, elements.customerKycBadge].filter(Boolean).forEach((badge) => {
    badge.textContent = badge === elements.customerKycBadge && !normalized ? "KYC" : label;
    badge.dataset.status = normalized;
  });
}

function renderLiveChatAutomationPanel() {
  if (!elements.liveChatAutomationPanel) return;
  const automation = supportConfig.liveChatAutomation;
  const autoWelcome = automation?.autoWelcome || {};
  const enabled = Boolean(currentAccount && automation?.enabled !== false && autoWelcome.enabled !== false);
  elements.liveChatAutomationPanel.hidden = !enabled;
  if (!enabled) return;

  const message = autoWelcome.message || "Buenas noches, bienvenido a Betxico💚\n¿En que te puedo ayudar? 🙂‍↔️";
  elements.liveChatWelcomePreview.textContent = message;
  renderLiveChatAutomationStatus(elements.chatId?.value ? "Listo para enviar bienvenida." : "Esperando chat activo.");
}

async function handleSendSupportAlert(event) {
  event.preventDefault();

  const customerName = elements.customerName.value.trim();
  const customerEmail = elements.customerEmail.value.trim();
  const customerId = elements.authId.value.trim();
  const chatId = elements.chatId.value.trim();
  const note = elements.supportAlertMessage.value.trim();

  if (!customerEmail && !customerName && !customerId) {
    showResult("No hay datos de cliente para enviar la alerta.", "error");
    return;
  }

  elements.sendSupportAlertBtn.disabled = true;
  elements.sendSupportAlertBtn.textContent = "Enviando...";

  try {
    await fetchJson("/api/support-config?action=assistant-alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Alerta de LiveChat",
        message: note || "Revisar cliente desde Betxico Soporte.",
        severity: "critical",
        customerName,
        customerEmail,
        customerId,
        chatId,
        agentName: currentAccount?.displayName || currentAccount?.email || "",
        source: "betxico-soporte"
      })
    });

    elements.supportAlertMessage.value = "";
    showResult("Alerta enviada a APP Betxico.", "success");
  } catch (error) {
    showResult(`No pude enviar alerta a APP Betxico: ${formatError(error.message)}`, "error");
  } finally {
    elements.sendSupportAlertBtn.disabled = false;
    elements.sendSupportAlertBtn.textContent = "Enviar Alerta";
  }
}

function getCustomerContextQuery() {
  const email = String(elements.customerEmail?.value || "").trim().toLowerCase();
  const authId = String(elements.authId?.value || "").trim();
  const chatId = String(elements.chatId?.value || "").trim();
  return email || authId || chatId;
}

function scheduleCustomerContextLoad(delayMs = 450) {
  window.clearTimeout(customerContextTimerId);
  customerContextRequestId += 1;
  const query = getCustomerContextQuery();
  if (!query) {
    renderCustomerContextEmpty();
    return;
  }
  const scheduledRequestId = customerContextRequestId;
  customerContextTimerId = window.setTimeout(() => {
    if (scheduledRequestId !== customerContextRequestId) return;
    loadCustomerContext().catch(() => null);
  }, Math.max(150, Number(delayMs) || 450));
}

async function loadCustomerContext() {
  const query = getCustomerContextQuery();
  if (!query) {
    renderCustomerContextEmpty();
    return;
  }
  if (!currentAccount) return;

  const requestId = ++customerContextRequestId;
  renderCustomerContextLoading(query);
  const chatId = String(elements.chatId?.value || "").trim();
  if (chatId) {
    try {
      renderCaseAgentLoading();
      const data = await fetchJson("/api/support-ticket?action=case-refresh", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chatId,
          customer: {
            email: String(elements.customerEmail?.value || "").trim(),
            name: String(elements.customerName?.value || "").trim(),
            authId: String(elements.authId?.value || "").trim()
          }
        })
      });
      if (requestId !== customerContextRequestId) return;
      currentCaseView = data.case || null;
      if (currentCaseDraftChatId && currentCaseDraftChatId !== chatId) {
        currentCaseDraft = null;
        currentCaseDraftChatId = "";
      }
      currentCaseAction = await recoverCaseAction(chatId, data.action || data.activeAction || null);
      if (requestId !== customerContextRequestId) return;
      renderCaseAgentPanel();
      renderCaseToolPanels(data.case?.systemFacts || {});
      schedulePendingCaseEvidencePoll(chatId, requestId);
      // La caché de Lista 8 es la fuente visible final. El expediente puede
      // estar vacío, vencido o contener un resultado previo, pero no reemplaza
      // el registro actual disponible para el agente.
      await loadCustomerSlackCache(query, requestId);
      return;
    } catch (error) {
      if (requestId !== customerContextRequestId) return;
      currentCaseView = null;
      if (!caseActionBelongsToChat(currentCaseAction, chatId)) currentCaseAction = null;
      renderCaseAgentPanel(formatError(error.message));
      if (error.message !== "support_case_not_found") {
        renderCustomerJiraResults([], formatError(error.message));
      }
    }
  }

  const jiraTask = fetchJson(`/api/jira-search?query=${encodeURIComponent(query)}`)
    .then((data) => {
      if (requestId !== customerContextRequestId) return;
      renderCustomerJiraResults(data.tickets || []);
    })
    .catch((error) => {
      if (requestId !== customerContextRequestId) return;
      renderCustomerJiraResults([], formatError(error.message));
    });

  const slackTask = loadCustomerSlackCache(query, requestId);

  await Promise.allSettled([jiraTask, slackTask]);
}

function schedulePendingCaseEvidencePoll(chatId, requestId, attempt = 0) {
  window.clearTimeout(caseEvidencePollTimerId);
  caseEvidencePollGeneration += 1;
  const generation = caseEvidencePollGeneration;
  if (!chatId || requestId !== customerContextRequestId || !hasPendingCaseEvidence(currentCaseView)) return;
  if (attempt >= 30) return;
  caseEvidencePollTimerId = window.setTimeout(async () => {
    if (generation !== caseEvidencePollGeneration || requestId !== customerContextRequestId) return;
    try {
      const data = await fetchJson("/api/support-ticket?action=case-evidence-status", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ chatId })
      });
      if (generation !== caseEvidencePollGeneration || requestId !== customerContextRequestId) return;
      currentCaseView = data.case || currentCaseView;
      renderCaseAgentPanel();
      if (data.evidencePending === true) schedulePendingCaseEvidencePoll(chatId, requestId, attempt + 1);
    } catch {
      if (generation === caseEvidencePollGeneration && requestId === customerContextRequestId) {
        schedulePendingCaseEvidencePoll(chatId, requestId, attempt + 1);
      }
    }
  }, 2_000);
}

function hasPendingCaseEvidence(caseView) {
  return [caseView?.systemFacts?.atena, caseView?.systemFacts?.kyc].some((value) => (
    value?.status === "unavailable"
    && value?.error?.retryable === true
    && /_lookup_pending$/u.test(String(value?.error?.code || ""))
  ));
}

async function loadCustomerSlackCache(query, requestId) {
  try {
    const panels = Array.isArray(supportConfig.listPanels) && supportConfig.listPanels.length
      ? supportConfig.listPanels.filter((panel) => panel?.id)
      : [
        { id: "revision", label: "Slack Lista 8" },
        { id: "revision-7", label: "Slack Lista 7 (historica)" }
      ];
    const panelResults = await fetchSlackPanelsForSearch(panels, query, { timeoutMs: 7000 });
    if (requestId !== customerContextRequestId) return;
    renderCustomerSlackResults(panelResults);
  } catch (error) {
    if (requestId !== customerContextRequestId) return;
    renderCustomerSlackResults([], formatError(error.message));
  }
}

function renderCaseToolPanels(systemFacts = {}) {
  const jira = systemFacts.jira;
  const slack = systemFacts.slack;
  const jiraRecords = Array.isArray(jira?.data?.records) ? jira.data.records : [];
  renderCustomerJiraResults(jiraRecords.map((record) => ({
    key: record.ticketKey,
    status: record.status,
    summary: record.untrustedContent?.summary,
    description: record.untrustedContent?.description,
    url: record.url
  })), toolResultMessage(jira, "Jira"));

  const slackRecords = Array.isArray(slack?.data?.records) ? slack.data.records : [];
  const grouped = [...new Set(slackRecords.map((record) => record.listId || "Cache Slack"))].map((listId) => ({
    panel: { id: listId, label: listId },
    items: slackRecords.filter((record) => (record.listId || "Cache Slack") === listId).map((record) => ({
      id: record.recordId,
      email: record.customer?.email,
      authId: record.customer?.authId,
      withdrawalStatus: record.status,
      retentionReason: record.untrustedContent?.reason,
      reviewDetail: record.untrustedContent?.note,
      updatedAt: record.updatedAt
    }))
  }));
  renderCustomerSlackResults(grouped, toolResultMessage(slack, "Slack"));
}

function toolResultMessage(result, source) {
  if (!result) return `${source} no consultado`;
  if (result.status === "unavailable") return `${source} no disponible`;
  if (result.status === "stale") return `${source} con datos pendientes de actualizar`;
  return "";
}

function renderCaseAgentLoading() {
  if (!elements.caseAgentPanel) return;
  elements.caseAgentPanel.hidden = false;
  elements.caseAgentPanel.dataset.state = "loading";
  elements.caseAgentWorkflow.textContent = "Actualizando expediente";
  elements.caseAgentState.textContent = "Consultando";
  elements.caseAgentNextAction.textContent = "Verificando fuentes";
  elements.caseAgentEvidence.textContent = "...";
  elements.caseAgentSources.innerHTML = '<span class="is-loading">Jira</span><span class="is-loading">Slack cache</span><span class="is-loading">Atena</span><span class="is-loading">KYC</span>';
  if (elements.caseEvidencePanel) elements.caseEvidencePanel.hidden = true;
  if (elements.caseDraftGenerateBtn) elements.caseDraftGenerateBtn.disabled = true;
}

function renderCaseAgentPanel(errorMessage = "") {
  if (!elements.caseAgentPanel) return;
  const active = Boolean(currentCaseView);
  elements.caseAgentPanel.hidden = !active && !errorMessage;
  if (!active) {
    elements.caseAgentPanel.dataset.state = errorMessage ? "error" : "idle";
    if (errorMessage) {
      elements.caseAgentWorkflow.textContent = "Expediente no disponible";
      elements.caseAgentState.textContent = "Sin datos";
      elements.caseAgentNextAction.textContent = errorMessage;
      elements.caseAgentEvidence.textContent = "0 recibidos";
      elements.caseAgentSources.innerHTML = "";
    }
    renderCaseEvidenceItems();
    renderCaseActionControls();
    return;
  }

  elements.caseAgentPanel.dataset.state = currentCaseView.state || "new";
  elements.caseAgentWorkflow.textContent = formatCaseLabel(currentCaseView.workflow?.id || "Sin clasificar");
  elements.caseAgentState.textContent = formatCaseLabel(currentCaseView.state || "new");
  elements.caseAgentNextAction.textContent = currentCaseView.nextAction?.message || "Esperando siguiente evento";
  const evidence = currentCaseView.evidence || {};
  elements.caseAgentEvidence.textContent = `${Number(evidence.receivedCount || 0)} recibidos · ${Number(evidence.reviewedCount || 0)} revisados`;
  elements.caseAgentSources.innerHTML = [
    renderCaseSource("Jira", currentCaseView.systemFacts?.jira),
    renderCaseSource("Slack cache", currentCaseView.systemFacts?.slack),
    renderCaseSource("Atena", currentCaseView.systemFacts?.atena),
    renderCaseSource("KYC", currentCaseView.systemFacts?.kyc),
    renderCaseSource("KYC humano", currentCaseView.systemFacts?.kycReview),
    renderCaseResponseAutomation(currentCaseView.responseAutomation)
  ].join("");
  renderCaseEvidenceItems();
  renderCaseActionControls();
}

function renderCaseResponseAutomation(value) {
  if (!value?.state) return "";
  const state = String(value.state || "").trim();
  const source = String(value.source || "").trim();
  const label = state === "sent_verified"
    ? "Respuesta enviada y verificada"
    : state === "sent_verification_pending"
      ? "Respuesta enviada; verificando entrega"
      : state === "ready_for_review"
        ? "Respuesta lista para revisión"
        : state === "send_failed"
          ? "No se pudo enviar la respuesta"
          : "Respuesta automática en proceso";
  return `<span class="case-source is-${escapeHtml(state)}">${escapeHtml(label)}${source ? ` · ${escapeHtml(formatCaseLabel(source))}` : ""}</span>`;
}

function renderCaseEvidenceItems() {
  if (!elements.caseEvidencePanel || !elements.caseEvidenceList) return;
  const items = Array.isArray(currentCaseView?.evidenceItems) ? currentCaseView.evidenceItems : [];
  elements.caseEvidencePanel.hidden = !currentCaseView || !items.length;
  if (!items.length) {
    elements.caseEvidenceList.innerHTML = "";
    elements.caseEvidenceCount.textContent = "0";
    elements.caseEvidenceReviewBtn.disabled = true;
    elements.caseEvidenceStatus.textContent = "";
    return;
  }

  const pending = items.filter((item) => normalizeEvidenceReviewStatus(item.reviewStatus) !== "reviewed");
  const reviewablePending = pending.filter((item) => String(item.id || "").trim());
  elements.caseEvidenceCount.textContent = String(items.length);
  elements.caseEvidenceList.innerHTML = items.map((item) => {
    const reviewStatus = normalizeEvidenceReviewStatus(item.reviewStatus);
    const displayName = String(item.name || (item.kind === "image" ? "Imagen de LiveChat" : "Archivo de LiveChat"));
    const type = formatEvidenceType(item);
    const statusLabel = reviewStatus === "reviewed" ? "Revisado" : "Pendiente";
    return `
      <article class="case-evidence-item is-${escapeHtml(reviewStatus)}">
        <span class="case-evidence-kind" aria-hidden="true">${item.kind === "image" ? "IMG" : "DOC"}</span>
        <div>
          <strong>${escapeHtml(displayName)}</strong>
          <small>${escapeHtml(type)}</small>
        </div>
        <em>${escapeHtml(statusLabel)}</em>
      </article>
    `;
  }).join("");
  elements.caseEvidenceReviewBtn.disabled = reviewablePending.length === 0;
  elements.caseEvidenceReviewBtn.textContent = reviewablePending.length
    ? `Marcar ${reviewablePending.length} pendiente${reviewablePending.length === 1 ? "" : "s"} revisado${reviewablePending.length === 1 ? "" : "s"}`
    : "Toda la evidencia está revisada";
  elements.caseEvidenceStatus.textContent = reviewablePending.length
    ? `${reviewablePending.length} archivo${reviewablePending.length === 1 ? "" : "s"} requiere${reviewablePending.length === 1 ? "" : "n"} revisión.`
    : pending.length
      ? "La evidencia pendiente no tiene un identificador válido para registrar su revisión."
    : "Revisión de evidencia completa.";
}

function normalizeEvidenceReviewStatus(value) {
  return String(value || "").trim().toLowerCase() === "reviewed" ? "reviewed" : "pending";
}

function formatEvidenceType(item = {}) {
  const mimeType = String(item.mimeType || "").trim();
  const size = Number(item.size || 0);
  return [mimeType || (item.kind === "image" ? "Imagen" : "Archivo"), size > 0 ? formatBytes(size) : ""]
    .filter(Boolean)
    .join(" · ");
}

async function handleCaseEvidenceReview() {
  const chatId = String(currentCaseView?.chatId || "").trim();
  const pendingIds = (currentCaseView?.evidenceItems || [])
    .filter((item) => normalizeEvidenceReviewStatus(item.reviewStatus) !== "reviewed")
    .map((item) => String(item.id || "").trim())
    .filter(Boolean);
  if (!chatId || !pendingIds.length) return;

  elements.caseEvidenceReviewBtn.disabled = true;
  elements.caseEvidenceReviewBtn.textContent = "Guardando revisión...";
  elements.caseEvidenceStatus.textContent = "Actualizando expediente...";
  try {
    const data = await fetchJson("/api/support-ticket?action=case-evidence-review", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chatId, attachmentIds: pendingIds })
    });
    currentCaseView = data.case || currentCaseView;
    renderCaseAgentPanel();
  } catch (error) {
    elements.caseEvidenceStatus.textContent = `No se pudo registrar la revisión: ${formatError(error.message)}`;
    elements.caseEvidenceReviewBtn.disabled = false;
    elements.caseEvidenceReviewBtn.textContent = "Reintentar revisión";
  }
}

function renderCaseDraftPanel() {
  if (!elements.caseDraftPanel) return;
  const chatId = String(currentCaseView?.chatId || "").trim();
  const hasDraft = Boolean(currentCaseDraft && currentCaseDraftChatId === chatId);
  const activeAction = ACTIVE_CASE_ACTION_STATUSES.has(currentCaseAction?.status);
  const evidencePending = hasPendingCaseEvidence(currentCaseView);
  elements.caseDraftPanel.hidden = !chatId;
  elements.caseDraftGenerateBtn.disabled = !chatId || activeAction || evidencePending;
  elements.caseDraftOutput.hidden = !hasDraft;

  if (!hasDraft) {
    elements.caseDraftStatus.textContent = activeAction
      ? "Termina o rechaza la acción activa antes de generar otro borrador."
      : evidencePending
        ? "Esperando resultados de Atena y KYC antes de analizar."
      : "Listo para analizar.";
    elements.caseDraftUseBtn.hidden = true;
    return;
  }

  elements.caseDraftAnalysis.textContent = currentCaseDraft.analysis || "Sin análisis adicional.";
  elements.caseDraftNextStep.textContent = currentCaseDraft.nextStep || "Revisión manual del expediente.";
  elements.caseDraftCustomerText.textContent = currentCaseDraft.customerDraft || "Sin respuesta sugerida.";
  const usedSources = Array.isArray(currentCaseDraft.usedSources) ? currentCaseDraft.usedSources : [];
  elements.caseDraftSources.textContent = usedSources.length
    ? `Fuentes vigentes utilizadas: ${usedSources.map(formatCaseLabel).join(", ")}.`
    : "No se usaron resultados externos vigentes.";
  const warnings = Array.isArray(currentCaseDraft.warnings) ? currentCaseDraft.warnings : [];
  elements.caseDraftWarnings.innerHTML = warnings.map((warning) => `<li>${escapeHtml(warning)}</li>`).join("");
  elements.caseDraftWarnings.hidden = warnings.length === 0;
  elements.caseDraftUseBtn.hidden = !currentCaseDraft.suggestedAction || activeAction;
  elements.caseDraftStatus.textContent = "Borrador generado. Requiere revisión humana.";
}

async function handleCaseDraftGenerate() {
  const chatId = String(currentCaseView?.chatId || "").trim();
  if (!chatId || ACTIVE_CASE_ACTION_STATUSES.has(currentCaseAction?.status)) return;
  elements.caseDraftGenerateBtn.disabled = true;
  elements.caseDraftStatus.textContent = "Analizando expediente redactado...";
  try {
    const data = await fetchJson("/api/support-ticket?action=case-draft", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chatId })
    });
    currentCaseDraft = data.draft || null;
    currentCaseDraftChatId = currentCaseDraft ? chatId : "";
    renderCaseDraftPanel();
  } catch (error) {
    elements.caseDraftStatus.textContent = `No se pudo generar el borrador: ${formatError(error.message)}`;
    elements.caseDraftGenerateBtn.disabled = false;
  }
}

function handleCaseDraftUseAction() {
  const suggestion = currentCaseDraft?.suggestedAction;
  if (!suggestion || ACTIVE_CASE_ACTION_STATUSES.has(currentCaseAction?.status)) return;
  elements.caseActionType.value = suggestion.actionType;
  renderCaseActionTarget();
  if (elements.caseActionTarget && suggestion.actionType !== "livechat.send_message") {
    elements.caseActionTarget.value = suggestion.target || "";
  }
  elements.caseActionText.value = suggestion.text || "";
  elements.caseActionStatus.textContent = "Sugerencia cargada. Revísala y presiona Proponer; todavía no se ha enviado nada.";
  elements.caseActionForm?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  elements.caseActionText?.focus({ preventScroll: true });
}

function renderCaseSource(label, result) {
  const status = String(result?.status || "unavailable");
  const count = Number(result?.data?.count || 0);
  const recordStatus = String(result?.data?.record?.status || "");
  const suffix = status === "available"
    ? recordStatus
      ? formatCaseLabel(recordStatus)
      : `${count}`
    : formatCaseLabel(status);
  return `<span class="is-${escapeHtml(status)}"><b>${escapeHtml(label)}</b>${escapeHtml(suffix)}</span>`;
}

function renderCaseActionTarget() {
  if (!elements.caseActionType || !elements.caseActionTargetLabel) return;
  const type = elements.caseActionType.value;
  const needsTarget = type !== "livechat.send_message";
  elements.caseActionTargetLabel.hidden = !needsTarget;
  if (type === "jira.comment") {
    elements.caseActionTargetTitle.textContent = "Ticket Jira";
    elements.caseActionTarget.placeholder = "BTF-0000";
    if (!elements.caseActionTarget.value) {
      elements.caseActionTarget.value = currentCaseView?.systemFacts?.jira?.data?.records?.[0]?.ticketKey || "";
    }
  } else if (type === "slack.notify") {
    elements.caseActionTargetTitle.textContent = "Ruta Slack";
    elements.caseActionTarget.placeholder = "retiros";
    if (!elements.caseActionTarget.value) {
      elements.caseActionTarget.value = supportConfig.slackRoutes?.find((route) => route.channelId)?.id || "";
    }
  }
}

function renderCaseActionControls() {
  const status = currentCaseAction?.status || "";
  const hasCase = Boolean(currentCaseView);
  const executionEnabled = currentCaseView?.agentMode === "approved_actions";
  const actionLocked = ACTIVE_CASE_ACTION_STATUSES.has(status);
  [elements.caseActionType, elements.caseActionTarget, elements.caseActionText].forEach((control) => {
    if (control) control.disabled = actionLocked;
  });
  elements.caseActionProposeBtn.disabled = !hasCase || actionLocked;
  elements.caseActionApproveBtn.disabled = status !== "proposed";
  elements.caseActionRejectBtn.disabled = !["proposed", "approved"].includes(status);
  elements.caseActionExecuteBtn.disabled = !["approved", "executing", "verification_pending"].includes(status) || !executionEnabled;
  elements.caseActionExecuteBtn.textContent = status === "verification_pending"
    ? "Reintentar verificación"
    : status === "executing"
      ? "Conciliar sin reenviar"
      : "Ejecutar";
  syncCaseActionDraftFromRecord(currentCaseAction);
  renderCaseActionSnapshot();
  if (status) {
    elements.caseActionStatus.textContent = status === "verified"
      ? "Acción ejecutada y verificada."
      : status === "verification_pending"
        ? "La acción fue aceptada, pero aún no está confirmada."
        : `Estado: ${formatCaseActionStatus(status)}${status === "approved" && !executionEnabled ? " · ejecución desactivada en este entorno" : ""}`;
  } else {
    elements.caseActionStatus.textContent = hasCase ? "Sin acción propuesta." : "Esperando expediente.";
  }
  renderCaseActionTarget();
  renderCaseDraftPanel();
}

async function handleCaseActionPropose(event) {
  event.preventDefault();
  if (!currentCaseView?.chatId) return;
  const text = String(elements.caseActionText.value || "").trim();
  if (!text) {
    elements.caseActionStatus.textContent = "Escribe el contenido de la acción.";
    return;
  }
  const actionType = elements.caseActionType.value;
  elements.caseActionProposeBtn.disabled = true;
  try {
    const data = await fetchJson("/api/support-ticket?action=case-action-propose", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chatId: currentCaseView.chatId,
        actionType,
        payload: buildCaseActionPayload(actionType, text),
        reason: currentCaseView.nextAction?.message || "Acción revisada por el agente."
      })
    });
    currentCaseAction = data.action;
    rememberCaseAction(currentCaseAction);
    renderCaseActionControls();
  } catch (error) {
    elements.caseActionStatus.textContent = `No se pudo proponer: ${formatError(error.message)}`;
  } finally {
    renderCaseActionControls();
  }
}

async function handleCaseActionApprove() {
  await runCaseActionTransition("case-action-approve", "Aprobando...");
}

async function handleCaseActionReject() {
  await runCaseActionTransition("case-action-reject", "Rechazando...");
}

async function handleCaseActionExecute() {
  const retryVerification = currentCaseAction?.status === "verification_pending";
  const reconcileExecution = currentCaseAction?.status === "executing";
  await runCaseActionTransition(
    retryVerification
      ? "case-action-verify"
      : reconcileExecution
        ? "case-action-reconcile"
        : "case-action-execute",
    retryVerification
      ? "Reintentando verificación..."
      : reconcileExecution
        ? "Buscando la acción externa sin reenviar..."
        : "Ejecutando y verificando..."
  );
}

async function runCaseActionTransition(action, pendingLabel) {
  const proposalId = currentCaseAction?.proposalId;
  if (!proposalId) return;
  elements.caseActionStatus.textContent = pendingLabel;
  [elements.caseActionApproveBtn, elements.caseActionRejectBtn, elements.caseActionExecuteBtn].forEach((button) => {
    button.disabled = true;
  });
  try {
    const data = await fetchJson(`/api/support-ticket?action=${encodeURIComponent(action)}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ proposalId })
    });
    currentCaseAction = data.action || currentCaseAction;
    rememberCaseAction(currentCaseAction);
    renderCaseActionControls();
  } catch (error) {
    elements.caseActionStatus.textContent = `No se pudo completar: ${formatError(error.message)}`;
    renderCaseActionControls();
  }
}

function renderCaseActionSnapshot() {
  if (!elements.caseActionSnapshot) return;
  const action = currentCaseAction;
  const proposal = action?.proposal;
  elements.caseActionSnapshot.hidden = !proposal;
  if (!proposal) return;

  const payload = proposal.payload || {};
  const actionType = String(proposal.actionType || "");
  const exactText = actionType === "jira.comment" ? payload.body : payload.text;
  const target = actionType === "jira.comment"
    ? payload.issueKey
    : actionType === "slack.notify"
      ? payload.routeId
      : payload.chatId || proposal.chatId;
  const approvedBy = action.approval?.approvedBy?.email || "";
  const expiresAt = formatCaseTimestamp(action.approval?.expiresAt || proposal.expiresAt);
  const verificationRef = action.execution?.result?.verificationRef || "";

  elements.caseActionSnapshot.dataset.status = action.status || "proposed";
  elements.caseActionSnapshotState.textContent = formatCaseActionStatus(action.status);
  elements.caseActionSnapshotType.textContent = formatCaseActionType(actionType);
  elements.caseActionSnapshotTarget.textContent = String(target || "Sin destino");
  elements.caseActionSnapshotText.textContent = String(exactText || "Sin contenido");
  elements.caseActionSnapshotMeta.textContent = [
    approvedBy ? `Aprobó: ${approvedBy}` : "Pendiente de aprobación",
    expiresAt ? `Vence: ${expiresAt}` : "",
    verificationRef ? `Verificación: ${verificationRef}` : ""
  ].filter(Boolean).join(" · ");
}

function syncCaseActionDraftFromRecord(action) {
  if (!action?.proposal || !ACTIVE_CASE_ACTION_STATUSES.has(action.status)) return;
  const { actionType = "", payload = {} } = action.proposal;
  if (elements.caseActionType && actionType) elements.caseActionType.value = actionType;
  renderCaseActionTarget();
  if (elements.caseActionTarget) {
    elements.caseActionTarget.value = actionType === "jira.comment"
      ? payload.issueKey || ""
      : actionType === "slack.notify"
        ? payload.routeId || ""
        : "";
  }
  if (elements.caseActionText) {
    elements.caseActionText.value = actionType === "jira.comment" ? payload.body || "" : payload.text || "";
  }
}

function formatCaseActionType(value) {
  return {
    "livechat.send_message": "Responder en LiveChat",
    "jira.comment": "Comentar en Jira",
    "slack.notify": "Notificar en Slack"
  }[value] || formatCaseLabel(value || "Acción");
}

function formatCaseActionStatus(value) {
  return {
    proposed: "Propuesta",
    approved: "Aprobada",
    executing: "Ejecutando",
    verified: "Verificada",
    verification_pending: "Verificación pendiente",
    failed: "Fallida",
    rejected: "Rechazada"
  }[value] || formatCaseLabel(value || "Sin estado");
}

function formatCaseTimestamp(value) {
  const date = new Date(value || "");
  if (!Number.isFinite(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

async function recoverCaseAction(chatId, returnedAction) {
  if (returnedAction) {
    rememberCaseAction(returnedAction);
    return returnedAction;
  }
  if (caseActionBelongsToChat(currentCaseAction, chatId) && ACTIVE_CASE_ACTION_STATUSES.has(currentCaseAction.status)) {
    return currentCaseAction;
  }

  const proposalId = readRememberedCaseActionId(chatId);
  if (!proposalId) return null;
  try {
    const data = await fetchJson("/api/support-ticket?action=case-get", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chatId, proposalId })
    });
    if (data.action && ACTIVE_CASE_ACTION_STATUSES.has(data.action.status)) {
      rememberCaseAction(data.action);
      return data.action;
    }
  } catch (error) {
    if (!new Set(["case_action_not_found", "support_case_not_found"]).has(error.message)) {
      return caseActionBelongsToChat(currentCaseAction, chatId) ? currentCaseAction : null;
    }
  }
  forgetCaseAction(chatId);
  return null;
}

function rememberCaseAction(action) {
  const chatId = String(action?.proposal?.chatId || "").trim();
  const proposalId = String(action?.proposalId || "").trim();
  if (!chatId) return;
  try {
    if (proposalId && ACTIVE_CASE_ACTION_STATUSES.has(action.status)) {
      window.sessionStorage.setItem(`${CASE_ACTION_SESSION_PREFIX}${chatId}`, proposalId);
    } else {
      window.sessionStorage.removeItem(`${CASE_ACTION_SESSION_PREFIX}${chatId}`);
    }
  } catch {
    // The panel still works when browser storage is unavailable.
  }
}

function readRememberedCaseActionId(chatId) {
  try {
    return String(window.sessionStorage.getItem(`${CASE_ACTION_SESSION_PREFIX}${chatId}`) || "").trim();
  } catch {
    return "";
  }
}

function forgetCaseAction(chatId) {
  try {
    window.sessionStorage.removeItem(`${CASE_ACTION_SESSION_PREFIX}${chatId}`);
  } catch {
    // Nothing else is required when browser storage is unavailable.
  }
}

function caseActionBelongsToChat(action, chatId) {
  return String(action?.proposal?.chatId || "").trim() === String(chatId || "").trim();
}

function buildCaseActionPayload(actionType, text) {
  if (actionType === "jira.comment") {
    return { issueKey: elements.caseActionTarget.value.trim(), body: text };
  }
  if (actionType === "slack.notify") {
    return { routeId: elements.caseActionTarget.value.trim(), text };
  }
  return { chatId: currentCaseView.chatId, text };
}

function formatCaseLabel(value) {
  const normalized = String(value || "").trim().toLowerCase();
  const labels = {
    approved: "Aprobado",
    available: "Disponible",
    blocked: "Bloqueado",
    completed: "Completado",
    complete: "Completo",
    failed: "Fallido",
    investigating: "En investigación",
    incomplete: "Incompleto",
    jira: "Jira",
    kyc: "KYC",
    livechat: "LiveChat",
    new: "Nuevo",
    not_found: "Sin registro",
    pending: "Pendiente",
    rejected: "Rechazado",
    slack: "Slack",
    stale: "Desactualizado",
    unavailable: "No disponible",
    waiting_approval: "En espera de aprobación",
    waiting_customer: "En espera del cliente",
    withdrawal: "Retiro"
  };
  if (labels[normalized]) return labels[normalized];
  return String(value || "")
    .replace(/[_.-]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function renderCustomerContextEmpty() {
  customerContextRequestId += 1;
  renderCustomerJiraResults([], "Esperando datos del cliente", { idle: true });
  renderCustomerSlackResults([], "Esperando datos del cliente", { idle: true });
}

function renderCustomerContextLoading(query) {
  const displayQuery = truncateText(query, 42);
  if (elements.customerJiraPanel) elements.customerJiraPanel.dataset.state = "loading";
  if (elements.customerJiraStatus) elements.customerJiraStatus.textContent = `Buscando ${displayQuery}`;
  if (elements.customerJiraCount) elements.customerJiraCount.textContent = "...";
  if (elements.customerJiraResults) elements.customerJiraResults.innerHTML = '<p class="customer-auto-empty">Consultando tickets...</p>';
  if (elements.customerSlackPanel) elements.customerSlackPanel.dataset.state = "loading";
  if (elements.customerSlackCount) elements.customerSlackCount.textContent = "...";
  if (elements.customerSlackStatus) elements.customerSlackStatus.textContent = `Consultando Lista 8 para ${displayQuery}`;
  if (elements.customerSlackResults) elements.customerSlackResults.innerHTML = '<p class="customer-auto-empty">Consultando caché de Lista 8...</p>';
}

function renderCustomerJiraResults(tickets = [], message = "", options = {}) {
  if (!elements.customerJiraResults) return;
  const items = Array.isArray(tickets) ? tickets : [];
  elements.customerJiraPanel.dataset.state = options.idle ? "idle" : message && !options.idle ? "error" : items.length ? "found" : "empty";
  elements.customerJiraCount.textContent = String(items.length);
  elements.customerJiraStatus.textContent = options.idle
    ? message
    : message
      ? `No se pudo consultar: ${message}`
      : items.length
        ? `${items.length} ticket${items.length === 1 ? "" : "s"} encontrado${items.length === 1 ? "" : "s"}`
        : "Sin tickets para este cliente";
  elements.customerJiraResults.innerHTML = items.length
    ? items.map(renderCustomerJiraResult).join("")
    : `<p class="customer-auto-empty">${escapeHtml(options.idle ? "Al detectar correo o ID se consultará automáticamente." : message ? "Jira no respondió en esta consulta." : "No existen coincidencias en Jira.")}</p>`;
}

function renderCustomerJiraResult(ticket = {}) {
  const content = `
    <span class="customer-auto-result-top">
      <b>${escapeHtml(ticket.key || "Ticket")}</b>
      <em>${escapeHtml(ticket.status || "Sin estado")}</em>
    </span>
    <small>${escapeHtml(truncateText(ticket.summary || ticket.description || "Sin resumen", 150))}</small>
  `;
  return ticket.url
    ? `<a class="customer-auto-result" href="${escapeHtml(ticket.url)}" target="_blank" rel="noreferrer">${content}</a>`
    : `<article class="customer-auto-result">${content}</article>`;
}

function renderCustomerSlackResults(panelResults = [], message = "", options = {}) {
  if (!elements.customerSlackResults) return;
  const results = Array.isArray(panelResults) ? panelResults : [];
  const items = results.flatMap((panelResult) =>
    (panelResult.items || []).map((item) => ({
      ...item,
      panelLabel: panelResult.panel?.label || panelResult.panel?.id || "Lista Slack"
    }))
  );
  const panelErrors = results.filter((panelResult) => panelResult.error).length;
  const errorMessage = message || (panelErrors && panelErrors === results.length ? "Las listas no respondieron" : "");
  elements.customerSlackPanel.dataset.state = options.idle ? "idle" : errorMessage && !items.length ? "error" : items.length ? "found" : "empty";
  elements.customerSlackCount.textContent = String(items.length);
  elements.customerSlackStatus.textContent = options.idle
    ? message
    : items.length
      ? `${items.length} registro${items.length === 1 ? "" : "s"} en Lista 8${panelErrors ? ` · ${panelErrors} con error` : ""}`
      : errorMessage
        ? errorMessage
        : "Sin registros para este cliente";
  elements.customerSlackResults.innerHTML = items.length
    ? items.map(renderCustomerSlackResult).join("")
    : `<p class="customer-auto-empty">${escapeHtml(options.idle ? "Al detectar correo o ID se consultará la caché de Lista 8." : errorMessage ? "No fue posible consultar Lista 8 en este momento." : "No existen coincidencias en Lista 8.")}</p>`;
}

function renderCustomerSlackResult(item = {}) {
  const approval = formatContextSlackApproval(item.withdrawalStatus || item.approvalStatus);
  const listLabel = getListPanelShortLabel({ label: item.panelLabel });
  const meta = [
    listLabel,
    item.amount ? `$${item.amount}` : "",
    item.listStatus || ""
  ].filter(Boolean).join(" · ");
  const retentionReason = item.retentionReason || [item.reviewTopic, item.detail, item.reviewDetail, item.rvc].filter(Boolean).join(" · ");
  return `
    <article class="customer-auto-result">
      <span class="customer-auto-result-top">
        <b>${escapeHtml(item.authId || item.email || listLabel)}</b>
        <em class="${escapeHtml(approval.className)}">${escapeHtml(approval.label)}</em>
      </span>
      <small>${escapeHtml(meta)}</small>
      ${retentionReason ? `<p><b>Motivo:</b> ${escapeHtml(truncateText(retentionReason, 180))}</p>` : ""}
    </article>
  `;
}

function getDevWalletClass(intent) {
  if (intent === "devwallet1") return "is-approved";
  if (intent === "devwallet2") return "is-rejected";
  if (intent === "devwallet3") return "is-documents";
  return "is-documents";
}

function isOpenJiraTicket(ticket = {}) {
  const status = normalizeText(ticket.status || "");
  if (!status) return true;
  return !/\bcerrad|\bclosed\b|\bresuelt|\bresolved\b|\bcancelad|\bcanceled\b|\bcancelled\b|\bfinalizad|\bdone\b|\brechazad|\bdeclined\b/.test(status);
}

function formatContextSlackApproval(value) {
  const normalized = normalizeText(value || "");
  if (normalized === "aprobar" || normalized === "aprobado" || normalized === "approved") {
    return { label: "APROBADO", className: "is-approved" };
  }
  if (normalized === "cancelar" || normalized === "cancelado" || normalized === "canceled" || normalized === "cancelled") {
    return { label: "CANCELADO", className: "is-rejected" };
  }
  if (normalized === "pedir documentos") {
    return { label: "PENDIENTE DE DOCUMENTOS", className: "is-documents" };
  }
  if (normalized === "advertencia") {
    return { label: "ADVERTENCIA", className: "is-documents" };
  }
  if (normalized.includes("retenido") || normalized === "pendiente") {
    return { label: "RETENIDO / EN REVISIÓN", className: "is-pending" };
  }
  if (normalized === "completado") {
    return { label: "COMPLETADO", className: "is-neutral" };
  }
  return { label: value ? String(value).toUpperCase() : "RETENIDO / EN REVISIÓN", className: value ? "is-neutral" : "is-pending" };
}

function maybeSendLiveChatWelcome() {
  const automation = supportConfig.liveChatAutomation;
  const autoWelcome = automation?.autoWelcome || {};
  if (!currentAccount || automation?.enabled === false || autoWelcome.enabled === false) return;
  const chatId = elements.chatId.value.trim();
  if (!chatId || autoWelcomeAttempts.has(chatId)) return;
  autoWelcomeAttempts.add(chatId);
  sendLiveChatWelcome({ manual: false });
}

function scheduleLiveChatSafeTemplateCheck(delayMs = 3000) {
  const chatId = elements.chatId.value.trim();
  if (!chatId || !currentAccount) return;
  if (supportConfig.liveChatAutomation?.enabled === false) return;
  if (supportConfig.liveChatAutomation?.safeTemplateMode !== "auto_send_safe") return;
  window.setTimeout(() => {
    maybeSendLiveChatSafeTemplate().catch(() => null);
  }, Math.max(1000, Number(delayMs) || 3000));
}

async function maybeSendLiveChatSafeTemplate() {
  if (!currentAccount) return;
  const automation = supportConfig.liveChatAutomation || {};
  if (automation.enabled === false || automation.safeTemplateMode !== "auto_send_safe") return;

  const chatId = elements.chatId.value.trim();
  if (!chatId) return;

  const attempts = Number(autoSafeTemplateAttempts.get(chatId) || 0);
  if (attempts >= 6) return;
  autoSafeTemplateAttempts.set(chatId, attempts + 1);

  try {
    const data = await fetchJson("/api/support-ticket?action=livechat-auto-safe-template", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chatId })
    });

    if (data.sent) {
      renderLiveChatAutomationStatus(`Plantilla segura enviada: ${data.intent || "respuesta automatica"}.`);
      return;
    }
    if (data.reason === "safe_template_already_sent") {
      renderLiveChatAutomationStatus("Plantilla segura ya enviada en este chat.");
      return;
    }
    if (data.reason === "no_useful_customer_message") {
      renderLiveChatAutomationStatus("Esperando respuesta del cliente para detectar plantilla.");
      scheduleLiveChatSafeTemplateCheck(10000);
      return;
    }
    if (data.riskBlocked) {
      renderLiveChatAutomationStatus("Caso delicado: queda para agente.", "error");
      return;
    }
    if (data.skipped) {
      renderLiveChatAutomationStatus("Sin plantilla segura para este mensaje.");
    }
  } catch (error) {
    renderLiveChatAutomationStatus(`No pude revisar plantilla segura: ${formatError(error.message)}`, "error");
  }
}

async function sendLiveChatWelcome({ manual = false } = {}) {
  if (!ensureAuthenticated()) return;
  const automation = supportConfig.liveChatAutomation;
  const autoWelcome = automation?.autoWelcome || {};
  const chatId = elements.chatId.value.trim();
  const message = autoWelcome.message || "Buenas noches, bienvenido a Betxico💚\n¿En que te puedo ayudar? 🙂‍↔️";
  if (!chatId) {
    renderLiveChatAutomationStatus("No hay chat activo para enviar bienvenida.", "error");
    if (manual) showResult("No hay chat activo para enviar bienvenida.", "error");
    return;
  }

  elements.sendWelcomeBtn.disabled = true;
  renderLiveChatAutomationStatus("Enviando bienvenida...");
  try {
    const data = await fetchJson("/api/support-ticket?action=livechat-send-welcome", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chatId, message })
    });
    if (data.skipped) {
      renderLiveChatAutomationStatus("Bienvenida ya enviada en este chat.");
      if (manual) showResult("La bienvenida ya se habia enviado en este chat.", "success");
      return;
    }
    renderLiveChatAutomationStatus("Bienvenida enviada.");
    scheduleLiveChatSafeTemplateCheck(8000);
    if (manual) showResult("Bienvenida enviada a LiveChat.", "success");
  } catch (error) {
    autoWelcomeAttempts.delete(chatId);
    const message = `No pude enviar bienvenida: ${formatError(error.message)}`;
    renderLiveChatAutomationStatus(message, "error");
    if (manual) showResult(message, "error");
  } finally {
    elements.sendWelcomeBtn.disabled = false;
  }
}

function renderLiveChatAutomationStatus(message, type = "") {
  if (!elements.liveChatAutomationStatus) return;
  elements.liveChatAutomationStatus.textContent = message;
  elements.liveChatAutomationStatus.dataset.type = type;
}

async function handleSearchTickets(event) {
  event.preventDefault();
  if (!ensureAuthenticated()) return;
  const query = elements.ticketSearchInput.value.trim();
  showView("search");
  hideResult();
  if (!query) {
    searchTickets = [];
    searchSlackPanels = [];
    elements.searchResults.innerHTML = "";
    return;
  }

  elements.searchTicketBtn.disabled = true;
  elements.searchTicketBtn.innerHTML = '<span class="dashboard-search-spinner" aria-hidden="true"></span>';
  elements.searchTicketBtn.setAttribute("aria-label", "Buscando en Jira");
  elements.searchResults.innerHTML = '<p class="search-state">Buscando en Jira...</p>';
  const requestId = ++searchRequestId;

  try {
    const jiraResult = await Promise.resolve(fetchJson(`/api/jira-search?query=${encodeURIComponent(query)}`))
      .then((value) => ({ status: "fulfilled", value }))
      .catch((reason) => ({ status: "rejected", reason }));
    const panels = SLACK_LIST_LOOKUPS_ENABLED && Array.isArray(supportConfig.listPanels)
      ? supportConfig.listPanels.filter((panel) => panel?.id)
      : [];
    const slackResults = [];

    searchTickets = jiraResult.status === "fulfilled" ? jiraResult.value.tickets || [] : [];
    searchSlackPanels = slackResults
      .map((result, index) => {
        const configPanel = panels[index] || {};
        if (result.status !== "fulfilled") {
          return {
            panel: {
              id: configPanel.id || "",
              label: configPanel.label || configPanel.id || "Lista Slack"
            },
            items: [],
            error: formatError(result.reason?.message || result.reason || "slack_search_failed")
          };
        }
        return {
          panel: result.value.panel || {
            id: configPanel.id || "",
            label: configPanel.label || configPanel.id || "Lista Slack"
          },
          items: result.value.items || [],
          warning: result.value.warning || ""
        };
      });

    const errors = [];
    if (jiraResult.status !== "fulfilled") {
      errors.push(`Jira: ${formatError(jiraResult.reason?.message || jiraResult.reason || "jira_search_failed")}`);
    }
    searchSlackPanels.forEach((panelResult) => {
      if (panelResult.error) {
        errors.push(`${panelResult.panel.label || "Slack"}: ${panelResult.error}`);
      }
    });

    renderUnifiedSearchResults({ tickets: searchTickets, slackPanels: searchSlackPanels, errors });
    if (requestId === searchRequestId && panels.length) {
      elements.searchResults.insertAdjacentHTML("beforeend", '<p class="search-state" data-slack-loading>Buscando reportes en Slack...</p>');
      fetchSlackPanelsForSearch(panels, query, { timeoutMs: 15000 }).then((panelResults) => {
        if (requestId !== searchRequestId) return;
        searchSlackPanels = panelResults;
        renderUnifiedSearchResults({ tickets: searchTickets, slackPanels: searchSlackPanels, errors });
      }).catch(() => {
        if (requestId !== searchRequestId) return;
        const loading = elements.searchResults.querySelector("[data-slack-loading]");
        if (loading) loading.textContent = "Slack tardó demasiado; Jira ya está disponible.";
      });
    }
  } catch (error) {
    searchTickets = [];
    searchSlackPanels = [];
    renderSearchResults([], `No pude buscar: ${formatError(error.message)}`);
  } finally {
    elements.searchTicketBtn.disabled = false;
    elements.searchTicketBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"></path></svg>';
    elements.searchTicketBtn.setAttribute("aria-label", "Buscar en Jira");
  }
}

async function fetchSlackPanelsForSearch(panels, query, { timeoutMs = 4500 } = {}) {
  if (!SLACK_LIST_LOOKUPS_ENABLED) return [];
  const results = [];
  for (const panel of panels) {
    const params = new URLSearchParams({
      mode: "items",
      panel: panel.id || ""
    });
    if (looksLikeEmail(query)) {
      params.set("email", query);
    } else {
      params.set("query", query);
    }
    const result = await fetchJsonWithTimeout(
      `/api/slack-list-schema?${params.toString()}`,
      { timeoutMs }
    )
      .then((value) => ({
        panel: value.panel || { id: panel.id || "", label: panel.label || panel.id || "Lista Slack" },
        items: value.items || [],
        warning: value.warning || ""
      }))
      .catch((error) => ({
        panel: { id: panel.id || "", label: panel.label || panel.id || "Lista Slack" },
        items: [],
        warning: /timeout|ratelimited|rate/i.test(String(error.message || error)) ? "slack_unavailable" : "",
        error: /timeout|ratelimited|rate/i.test(String(error.message || error)) ? "" : formatError(error.message || error)
      }));
    results.push(result);
  }
  return results;
}

function looksLikeEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || "").trim());
}

function handleClearSearch() {
  elements.ticketSearchInput.value = defaultTicketSearchValue();
  searchTickets = [];
  searchSlackPanels = [];
  elements.searchResults.innerHTML = "";
}

function handleQuickDepositOpen() {
  if (!ensureAuthenticated()) return;
  if (elements.quickIneForm) elements.quickIneForm.hidden = true;
  elements.quickDepositTrackingKey.value = "";
  elements.quickDepositAmount.value = "";
  attachments = [];
  renderAttachments();
  elements.quickDepositForm.hidden = false;
  updateQuickActionLayout();
  renderQuickDepositPreview();
  elements.quickDepositTrackingKey.focus();
}

function handleQuickDepositCancel() {
  elements.quickDepositForm.hidden = true;
  updateQuickActionLayout();
  elements.quickDepositTrackingKey.value = "";
  elements.quickDepositAmount.value = "";
  attachments = [];
  renderAttachments();
  hideResult();
}

function handleQuickIneOpen() {
  if (!ensureAuthenticated()) return;
  if (elements.quickDepositForm) elements.quickDepositForm.hidden = true;
  elements.quickIneNotifyWithdrawal.checked = false;
  elements.quickIneWithdrawalFields.hidden = true;
  elements.quickIneWithdrawalDate.value = "";
  elements.quickIneWithdrawalAmount.value = "";
  attachments = [];
  renderAttachments();
  elements.quickIneForm.hidden = false;
  updateQuickActionLayout();
  renderQuickInePreview();
  elements.quickIneEvidence.focus();
}

function handleQuickIneCancel() {
  elements.quickIneForm.hidden = true;
  elements.quickIneNotifyWithdrawal.checked = false;
  elements.quickIneWithdrawalFields.hidden = true;
  elements.quickIneWithdrawalDate.value = "";
  elements.quickIneWithdrawalAmount.value = "";
  attachments = [];
  renderAttachments();
  updateQuickActionLayout();
  hideResult();
}

function handleQuickIneWithdrawalToggle() {
  const enabled = Boolean(elements.quickIneNotifyWithdrawal.checked);
  elements.quickIneWithdrawalFields.hidden = !enabled;
  renderQuickInePreview();
  if (enabled) elements.quickIneWithdrawalDate.focus();
}

function updateQuickActionLayout() {
  const quickActionOpen = Boolean(
    (elements.quickDepositForm && !elements.quickDepositForm.hidden) ||
    (elements.quickIneForm && !elements.quickIneForm.hidden)
  );
  elements.searchView?.classList.toggle("quick-action-expanded", quickActionOpen);
}

function handleTraceabilityOpen() {
  if (!ensureAuthenticated()) return;
  if (elements.quickDepositForm) elements.quickDepositForm.hidden = true;
  if (elements.quickIneForm) elements.quickIneForm.hidden = true;
  showView("settings");
  elements.traceabilityPanel.hidden = false;
  updateQuickActionLayout();
  setTraceabilityStatus("Pega o sube el archivo de depositos de Paybridge para cruzarlo contra los retiros reportados.", "");
  requestAnimationFrame(() => {
    elements.traceabilityPanel?.scrollIntoView({ block: "start", behavior: "smooth" });
    elements.traceabilityDepositText?.focus();
  });
}

function handleTraceabilityClose() {
  elements.traceabilityPanel.hidden = true;
  hideResult();
}

async function handleTraceabilityFileChange() {
  const files = [...(elements.traceabilityDepositFile?.files || [])];
  if (!files.length) return;
  try {
    const texts = [];
    for (const file of files) {
      texts.push(await traceabilityFileToText(file));
    }
    elements.traceabilityDepositText.value = texts.filter(Boolean).join("\n");
    resetTraceabilityReport();
    saveTraceabilityDraft();
    setTraceabilityStatus(`${files.length} archivo(s) de depositos cargados.`, "success");
  } catch {
    setTraceabilityStatus("No pude leer los depositos. Usa CSV, TXT o XLSX de Paybridge.", "error");
  }
}

async function handleTraceabilityWithdrawalFileChange() {
  const file = elements.traceabilityWithdrawalFile?.files?.[0];
  if (!file) return;
  try {
    elements.traceabilityWithdrawalText.value = await traceabilityFileToText(file);
    resetTraceabilityReport();
    saveTraceabilityDraft();
    setTraceabilityStatus(`Archivo de retiros cargado: ${file.name}`, "success");
  } catch {
    setTraceabilityStatus("No pude leer los retiros. Usa CSV, TXT, JSON o el PDF de saques.", "error");
  }
}

async function traceabilityFileToText(file) {
  const lowerName = String(file?.name || "").toLowerCase();
  if (lowerName.endsWith(".xlsx")) {
    if (!globalThis.ExcelJS) throw new Error("xlsx_reader_unavailable");
    const workbook = new globalThis.ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    return workbook.worksheets
      .map((worksheet) => worksheetToDelimitedText(worksheet))
      .filter(Boolean)
      .join("\n");
  }
  if (lowerName.endsWith(".pdf")) {
    const pdfjs = await import("/vendor/pdf.min.mjs");
    pdfjs.GlobalWorkerOptions.workerSrc = "/vendor/pdf.worker.min.mjs";
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map((item) => item.str || "").join(" "));
    }
    return pages.join("\n");
  }
  return file.text();
}

function worksheetToDelimitedText(worksheet) {
  const lines = [];
  worksheet.eachRow({ includeEmpty: false }, (row) => {
    const values = Array.isArray(row.values) ? row.values.slice(1) : [];
    lines.push(values.map((value) => csvEscape(resolveSpreadsheetCellValue(value))).join(","));
  });
  return lines.join("\n");
}

function resolveSpreadsheetCellValue(value) {
  if (value == null) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") {
    if (value.result != null) return value.result;
    if (value.text != null) return value.text;
    if (Array.isArray(value.richText)) return value.richText.map((part) => part.text || "").join("");
  }
  return String(value);
}

function resetTraceabilityReport() {
  traceabilityReport = null;
  saveTraceabilityDraft();
  renderTraceabilityDownloadState(false);
  if (elements.traceabilitySummary) {
    elements.traceabilitySummary.hidden = true;
    elements.traceabilitySummary.innerHTML = "";
  }
  if (elements.traceabilityResults) elements.traceabilityResults.innerHTML = "";
}

function restoreTraceabilityDraft() {
  if (!elements.traceabilityDepositText) return;
  try {
    const draft = sessionStorage.getItem(TRACEABILITY_DEPOSIT_TEXT_KEY) || "";
    if (draft && !elements.traceabilityDepositText.value) {
      elements.traceabilityDepositText.value = draft;
      setTraceabilityStatus("Lista de depositos cargada en esta sesion. Puedes volver a comparar.", "");
    }
    const withdrawalDraft = sessionStorage.getItem(TRACEABILITY_WITHDRAWAL_TEXT_KEY) || "";
    if (withdrawalDraft && elements.traceabilityWithdrawalText && !elements.traceabilityWithdrawalText.value) {
      elements.traceabilityWithdrawalText.value = withdrawalDraft;
    }
  } catch {}
}

function saveTraceabilityDraft() {
  if (!elements.traceabilityDepositText) return;
  try {
    const text = elements.traceabilityDepositText.value || "";
    if (text) sessionStorage.setItem(TRACEABILITY_DEPOSIT_TEXT_KEY, text);
    else sessionStorage.removeItem(TRACEABILITY_DEPOSIT_TEXT_KEY);
    const withdrawalText = elements.traceabilityWithdrawalText?.value || "";
    if (withdrawalText) sessionStorage.setItem(TRACEABILITY_WITHDRAWAL_TEXT_KEY, withdrawalText);
    else sessionStorage.removeItem(TRACEABILITY_WITHDRAWAL_TEXT_KEY);
  } catch {}
}

async function handleTraceabilityRun() {
  if (!ensureAuthenticated()) return;
  hideResult();

  const depositText = elements.traceabilityDepositText?.value?.trim() || "";
  if (!depositText) {
    setTraceabilityStatus("Pega o sube primero la lista de depositos de Paybridge.", "error");
    return;
  }

  elements.traceabilityRunBtn.disabled = true;
  elements.traceabilityRunBtn.textContent = "Comparando...";
  renderTraceabilityDownloadState(false);
  setTraceabilityStatus("Leyendo depositos y consultando retiros reportados...", "");

  try {
    const deposits = parseTraceabilityDeposits(depositText);
    if (!deposits.length) {
      throw new Error("No encontre depositos validos con correo en la lista.");
    }

    const withdrawalText = elements.traceabilityWithdrawalText?.value?.trim() || "";
    const withdrawals = withdrawalText
      ? parseTraceabilityWithdrawals(withdrawalText)
      : await loadTraceabilityWithdrawals();
    if (!withdrawals.length) {
      throw new Error("No encontre retiros reportados con correo y CLABE detectada.");
    }

    traceabilityReport = buildTraceabilityReport(withdrawals, deposits);
    renderTraceabilityReport(traceabilityReport);
    renderTraceabilityDownloadState(true);
    setTraceabilityStatus("Comparacion generada con el ultimo retiro y el ultimo deposito identificables por cliente.", "success");
  } catch (error) {
    resetTraceabilityReport();
    setTraceabilityStatus(formatError(error.message), "error");
  } finally {
    elements.traceabilityRunBtn.disabled = false;
    elements.traceabilityRunBtn.textContent = "Comparar cuentas";
  }
}

async function loadTraceabilityWithdrawals() {
  if (!SLACK_LIST_LOOKUPS_ENABLED) {
    throw new Error("slack_list_reads_paused");
  }
  const panel = resolveTraceabilityPanel();
  const query = new URLSearchParams({
    mode: "items",
    panel: panel.id,
    limit: "1000"
  });
  const data = await fetchJson(`/api/slack-list-schema?${query.toString()}`);
  return (data.items || [])
    .map(normalizeTraceabilityWithdrawal)
    .filter((item) => item.email && item.withdrawalClabe);
}

function resolveTraceabilityPanel() {
  const panels = Array.isArray(supportConfig.listPanels) ? supportConfig.listPanels.filter((panel) => panel?.id) : [];
  const panel = panels.find((item) => item.id === "revision")
    || panels.find((item) => /revision|retiro|transaccion/i.test(`${item.id} ${item.label || ""}`))
    || panels[0];
  if (!panel) {
    throw new Error("No hay una lista de Slack configurada para leer retiros reportados.");
  }
  return panel;
}

function normalizeTraceabilityWithdrawal(item) {
  const dateValue = item.updatedAt || item.createdAt || "";
  return {
    name: item.customerName || item.name || "",
    email: normalizeTraceabilityEmail(item.email),
    withdrawalAmount: normalizeMoneyInput(item.amount || ""),
    withdrawalClabe: normalizeTraceabilityClabe(item.withdrawalClabe || extractTraceabilityClabe(item.detail)),
    withdrawalDate: dateValue,
    dateTs: parseTraceabilityDate(dateValue),
    sourceId: item.id || item.authId || ""
  };
}

function parseTraceabilityDeposits(text) {
  const rows = parseDelimitedRows(text);
  if (rows.length < 2) return [];

  const headers = rows[0].map(normalizeTraceabilityHeader);
  const indexes = {
    email: findTraceabilityColumn(headers, ["correo", "email", "cliente", "customeremail", "loginusuario", "usuario"]),
    amount: findTraceabilityColumn(headers, ["monto", "importe", "amount", "valor", "cantidad"]),
    sourceClabe: findTraceabilitySourceClabeColumn(headers),
    createdAt: findTraceabilityColumn(headers, ["createdat", "created", "fecha", "fechadeposito", "fechadecreacion", "date"]),
    depositorName: findTraceabilityColumn(headers, ["depositante", "nombredepositante", "nombre", "name", "sender", "ordenante"])
  };

  if (indexes.sourceClabe < 0) {
    throw new Error("La lista de depositos no trae una columna CLABE origen identificable o trae varias columnas ambiguas.");
  }
  if (indexes.createdAt < 0) {
    throw new Error("La lista de depositos no trae una columna de fecha identificable.");
  }

  const deposits = rows.slice(1).flatMap((row, index) => {
    const repeatedHeader = normalizeTraceabilityHeader(cellAt(row, indexes.sourceClabe)) === headers[indexes.sourceClabe]
      && normalizeTraceabilityHeader(cellAt(row, indexes.createdAt)) === headers[indexes.createdAt];
    if (repeatedHeader) return [];
    const createdAt = cellAt(row, indexes.createdAt);
    return [{
      name: cellAt(row, indexes.depositorName),
      email: normalizeTraceabilityEmail(cellAt(row, indexes.email)),
      nameKey: normalizeTraceabilityName(cellAt(row, indexes.depositorName)),
      depositAmount: normalizeMoneyInput(cellAt(row, indexes.amount)),
      depositClabe: normalizeTraceabilityClabe(cellAt(row, indexes.sourceClabe)),
      depositDate: createdAt,
      dateTs: parseTraceabilityDate(createdAt),
      sourceRow: index + 2
    }];
  }).filter((item) => item.email || item.nameKey);

  const invalidClabe = deposits.find((deposit) => !deposit.depositClabe);
  if (invalidClabe) {
    throw new Error(`La fila ${invalidClabe.sourceRow} no tiene una CLABE origen valida.`);
  }
  const invalidDate = deposits.find((deposit) => !deposit.dateTs);
  if (invalidDate) {
    throw new Error(`La fila ${invalidDate.sourceRow} tiene correo, pero no una fecha valida.`);
  }
  return deposits;
}

function parseTraceabilityWithdrawals(text) {
  const jsonLike = parseTraceabilityWithdrawalJsonLike(text);
  if (jsonLike.length) return jsonLike;

  const rows = parseDelimitedRows(text);
  if (rows.length < 2) return [];
  const headers = rows[0].map(normalizeTraceabilityHeader);
  const indexes = {
    name: findTraceabilityColumn(headers, ["nombre", "name", "nomeusuario", "cliente"]),
    lastName: findTraceabilityColumn(headers, ["apellido", "lastname", "sobrenomeusuario"]),
    email: findTraceabilityColumn(headers, ["correo", "email", "loginusuario", "usuario"]),
    amount: findTraceabilityColumn(headers, ["monto", "importe", "amount", "valor", "cantidad"]),
    clabe: findTraceabilityColumn(headers, ["cuentaclabe", "claberetiro", "clabedestino", "withdrawalclabe"]),
    createdAt: findTraceabilityColumn(headers, ["momentosolicitacao", "createdat", "created", "fecha", "fecharetiro", "date"]),
    authId: findTraceabilityColumn(headers, ["idusuarioauth", "authid", "idautenticacion"])
  };
  if (indexes.email < 0 || indexes.clabe < 0 || indexes.createdAt < 0) {
    throw new Error("El archivo de retiros no trae correo, cuentaClabe y fecha detectables.");
  }
  return rows.slice(1).map((row, index) => normalizeUploadedWithdrawal({
    name: `${cellAt(row, indexes.name)} ${cellAt(row, indexes.lastName)}`.trim(),
    email: cellAt(row, indexes.email),
    withdrawalAmount: cellAt(row, indexes.amount),
    withdrawalClabe: cellAt(row, indexes.clabe),
    withdrawalDate: cellAt(row, indexes.createdAt),
    sourceId: cellAt(row, indexes.authId) || String(index + 2)
  })).filter((item) => item.email && item.withdrawalClabe && item.dateTs);
}

function parseTraceabilityWithdrawalJsonLike(text) {
  const source = String(text || "").replace(/\\"/g, '"');
  const starts = [...source.matchAll(/["']?id["']?\s*:\s*(\d+)/gi)];
  const records = [];
  starts.forEach((start, index) => {
    const block = source.slice(start.index, starts[index + 1]?.index || source.length);
    const value = (key) => {
      const match = block.match(new RegExp(`["']?${key}["']?\\s*:\\s*["']([^"']*)["']`, "i"));
      return match?.[1] || "";
    };
    const number = (key) => {
      const match = block.match(new RegExp(`["']?${key}["']?\\s*:\\s*(\\d+)`, "i"));
      return match?.[1] || "";
    };
    const clabe = block.match(/cuentaClabe\D{0,50}(\d{17,18})/i)?.[1] || "";
    const item = normalizeUploadedWithdrawal({
      name: `${value("nome_usuario")} ${value("sobrenome_usuario")}`.trim(),
      email: value("login_usuario"),
      withdrawalAmount: value("valor"),
      withdrawalClabe: clabe,
      withdrawalDate: value("momento_solicitacao"),
      sourceId: number("id_usuario_auth") || start[1]
    });
    if (item.email && item.withdrawalClabe && item.dateTs) records.push(item);
  });
  return records;
}

function normalizeUploadedWithdrawal(item) {
  return {
    name: String(item.name || "").trim(),
    nameKey: normalizeTraceabilityName(item.name),
    email: normalizeTraceabilityEmail(item.email),
    withdrawalAmount: normalizeMoneyInput(item.withdrawalAmount || ""),
    withdrawalClabe: normalizeTraceabilityClabe(item.withdrawalClabe),
    withdrawalDate: String(item.withdrawalDate || "").trim(),
    dateTs: parseTraceabilityDate(item.withdrawalDate),
    sourceId: String(item.sourceId || "").trim()
  };
}

function buildTraceabilityReport(withdrawals, deposits) {
  const latestWithdrawalByEmail = latestByEmail(withdrawals);
  const latestDepositByEmail = latestByIdentity(deposits, (item) => item.email);
  const latestDepositByName = latestByIdentity(deposits, (item) => item.nameKey);
  const matched = [];
  const unmatched = [];
  const missingDeposit = [];

  for (const withdrawal of latestWithdrawalByEmail.values()) {
    const depositByEmail = latestDepositByEmail.get(withdrawal.email);
    const deposit = depositByEmail || findUniqueDepositByName(withdrawal, latestDepositByName);
    if (!deposit) {
      missingDeposit.push(buildTraceabilityRow(withdrawal, null, "SIN DEPOSITO"));
      continue;
    }

    const isMatch = Boolean(withdrawal.withdrawalClabe && deposit.depositClabe && withdrawal.withdrawalClabe === deposit.depositClabe);
    const matchedNameTokens = countTraceabilityNameOverlap(withdrawal.name, deposit.name);
    if (!isMatch && !depositByEmail && matchedNameTokens < 3) {
      missingDeposit.push(buildTraceabilityRow(withdrawal, null, "SIN DEPOSITO"));
      continue;
    }
    const row = buildTraceabilityRow(withdrawal, deposit, isMatch ? "SI" : "NO");
    if (isMatch) matched.push(row);
    else unmatched.push(row);
  }

  return {
    generatedAt: new Date().toISOString(),
    matched,
    unmatched,
    missingDeposit,
    summary: {
      withdrawalsRead: withdrawals.length,
      depositsRead: deposits.length,
      withdrawalsCompared: latestWithdrawalByEmail.size,
      matched: matched.length,
      unmatched: unmatched.length,
      missingDeposit: missingDeposit.length
    }
  };
}

function countTraceabilityNameOverlap(left, right) {
  const leftTokens = new Set(normalizeTraceabilityName(left).split(" ").filter(Boolean));
  const rightTokens = new Set(normalizeTraceabilityName(right).split(" ").filter(Boolean));
  return [...leftTokens].filter((token) => rightTokens.has(token)).length;
}

function findUniqueDepositByName(withdrawal, latestDepositByName) {
  const withdrawalTokens = new Set(normalizeTraceabilityName(withdrawal.name).split(" ").filter(Boolean));
  if (withdrawalTokens.size < 2) return null;
  const candidates = [...latestDepositByName.values()].filter((deposit) => {
    const depositTokens = new Set(String(deposit.nameKey || "").split(" ").filter(Boolean));
    return [...withdrawalTokens].every((token) => depositTokens.has(token));
  });
  return candidates.length === 1 ? candidates[0] : null;
}

function buildTraceabilityRow(withdrawal, deposit, matchLabel) {
  return {
    name: withdrawal.name || deposit?.name || "",
    email: withdrawal.email,
    withdrawalAmount: withdrawal.withdrawalAmount || "",
    depositAmount: deposit?.depositAmount || "",
    match: matchLabel,
    withdrawalClabe: withdrawal.withdrawalClabe || "",
    depositClabe: deposit?.depositClabe || "",
    withdrawalDate: withdrawal.withdrawalDate || "",
    depositDate: deposit?.depositDate || "",
    depositorName: deposit?.name || ""
  };
}

function latestByEmail(items) {
  return latestByIdentity(items, (item) => item.email);
}

function latestByIdentity(items, identity) {
  const grouped = new Map();
  for (const item of items) {
    const key = String(identity(item) || "").trim();
    if (!key) continue;
    const current = grouped.get(key);
    if (!current || item.dateTs > current.dateTs || (item.dateTs === current.dateTs && String(item.sourceRow || item.sourceId || "") > String(current.sourceRow || current.sourceId || ""))) {
      grouped.set(key, item);
    }
  }
  return grouped;
}

function renderTraceabilityReport(report) {
  elements.traceabilitySummary.hidden = false;
  elements.traceabilitySummary.innerHTML = `
    <span>Retiros comparados: ${report.summary.withdrawalsCompared}</span>
    <span>Coinciden: ${report.summary.matched}</span>
    <span>No coinciden: ${report.summary.unmatched}</span>
    <span>Sin deposito: ${report.summary.missingDeposit}</span>
  `;

  elements.traceabilityResults.innerHTML = [
    renderTraceabilityTable("Coinciden", report.matched, "No hay clientes con cuenta coincidente."),
    renderTraceabilityTable("No coinciden", report.unmatched, "No hay clientes con cuenta distinta."),
    renderTraceabilityTable("Sin deposito encontrado", report.missingDeposit, "Todos los retiros comparados tuvieron deposito en la lista.")
  ].join("");
}

function renderTraceabilityTable(title, rows, emptyMessage) {
  if (!rows.length) {
    return `
      <section>
        <h4 class="traceability-table-title">${escapeHtml(title)}</h4>
        <div class="traceability-empty">${escapeHtml(emptyMessage)}</div>
      </section>
    `;
  }

  return `
    <section>
      <h4 class="traceability-table-title">${escapeHtml(title)} (${rows.length})</h4>
      <div class="traceability-table-wrap">
        <table class="traceability-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Monto retiro</th>
              <th>Monto deposito</th>
              <th>Coincide cuenta</th>
              <th>Cuenta a la que retira</th>
              <th>Cuenta de la que deposita</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td>${escapeHtml(row.name)}</td>
                <td>${escapeHtml(row.email)}</td>
                <td>${escapeHtml(row.withdrawalAmount)}</td>
                <td>${escapeHtml(row.depositAmount)}</td>
                <td>${escapeHtml(row.match)}</td>
                <td>${escapeHtml(row.withdrawalClabe)}</td>
                <td>${escapeHtml(row.depositClabe)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function handleTraceabilityDownloadCsv() {
  if (!traceabilityReport) return;
  const csv = buildTraceabilityCsv(traceabilityReport);
  downloadTextFile(`trazabilidad-cuentas-${dateSlug()}.csv`, "text/csv;charset=utf-8", csv);
}

function handleTraceabilityDownloadExcel() {
  if (!traceabilityReport) return;
  const workbook = buildTraceabilityExcelXml(traceabilityReport);
  downloadTextFile(`trazabilidad-cuentas-${dateSlug()}.xls`, "application/vnd.ms-excel;charset=utf-8", workbook);
}

function buildTraceabilityCsv(report) {
  const header = ["seccion", ...traceabilityExportHeaders()];
  const lines = [header.map(csvEscape).join(",")];
  [
    ["Coinciden", report.matched],
    ["No coinciden", report.unmatched],
    ["Sin deposito encontrado", report.missingDeposit]
  ].forEach(([section, rows]) => {
    rows.forEach((row) => {
      lines.push([section, ...traceabilityExportValues(row)].map(csvEscape).join(","));
    });
  });
  return `${lines.join("\n")}\n`;
}

function buildTraceabilityExcelXml(report) {
  const sheets = [
    ["Coinciden", report.matched],
    ["No coinciden", report.unmatched],
    ["Resumen", [
      { metric: "Retiros leidos", value: report.summary.withdrawalsRead },
      { metric: "Depositos leidos", value: report.summary.depositsRead },
      { metric: "Retiros comparados", value: report.summary.withdrawalsCompared },
      { metric: "Coinciden", value: report.summary.matched },
      { metric: "No coinciden", value: report.summary.unmatched },
      { metric: "Sin deposito encontrado", value: report.summary.missingDeposit }
    ]],
    ["Sin deposito encontrado", report.missingDeposit]
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${sheets.map(([name, rows]) => name === "Resumen" ? renderTraceabilitySummarySheet(name, rows) : renderTraceabilityDataSheet(name, rows)).join("\n")}
</Workbook>`;
}

function renderTraceabilityDataSheet(name, rows) {
  const headers = traceabilityExportHeaders();
  return `<Worksheet ss:Name="${excelXmlEscape(name)}"><Table>
<Row>${headers.map((header) => `<Cell><Data ss:Type="String">${excelXmlEscape(header)}</Data></Cell>`).join("")}</Row>
${rows.map((row) => `<Row>${traceabilityExportValues(row).map((value) => `<Cell><Data ss:Type="String">${excelXmlEscape(value)}</Data></Cell>`).join("")}</Row>`).join("\n")}
</Table></Worksheet>`;
}

function renderTraceabilitySummarySheet(name, rows) {
  return `<Worksheet ss:Name="${excelXmlEscape(name)}"><Table>
<Row><Cell><Data ss:Type="String">Metrica</Data></Cell><Cell><Data ss:Type="String">Valor</Data></Cell></Row>
${rows.map((row) => `<Row><Cell><Data ss:Type="String">${excelXmlEscape(row.metric)}</Data></Cell><Cell><Data ss:Type="Number">${Number(row.value || 0)}</Data></Cell></Row>`).join("\n")}
</Table></Worksheet>`;
}

function traceabilityExportHeaders() {
  return [
    "nombre",
    "correo",
    "monto retiro",
    "monto deposito",
    "coincide cuenta",
    "cuenta a la que retira",
    "cuenta de la que deposita",
    "fecha retiro",
    "fecha deposito",
    "nombre depositante"
  ];
}

function traceabilityExportValues(row) {
  return [
    row.name,
    row.email,
    row.withdrawalAmount,
    row.depositAmount,
    row.match,
    row.withdrawalClabe,
    row.depositClabe,
    row.withdrawalDate,
    row.depositDate,
    row.depositorName
  ];
}

function renderTraceabilityDownloadState(enabled) {
  if (elements.traceabilityDownloadCsvBtn) elements.traceabilityDownloadCsvBtn.disabled = !enabled;
  if (elements.traceabilityDownloadExcelBtn) elements.traceabilityDownloadExcelBtn.disabled = !enabled;
}

function setTraceabilityStatus(message, type = "") {
  if (!elements.traceabilityStatus) return;
  elements.traceabilityStatus.textContent = message || "";
  elements.traceabilityStatus.dataset.type = type;
}

function parseDelimitedRows(text) {
  const lines = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const delimiter = detectDelimiter(lines[0]);
  return lines.map((line) => splitDelimitedLine(line, delimiter));
}

function detectDelimiter(line) {
  const candidates = ["\t", ";", ","];
  return candidates
    .map((delimiter) => ({ delimiter, count: splitDelimitedLine(line, delimiter).length }))
    .sort((a, b) => b.count - a.count)[0]?.delimiter || ",";
}

function splitDelimitedLine(line, delimiter) {
  const cells = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell.trim());
  return cells;
}

function findTraceabilityColumn(headers, aliases) {
  for (const alias of aliases) {
    const exactIndex = headers.findIndex((header) => header === alias);
    if (exactIndex >= 0) return exactIndex;
  }
  for (const alias of aliases) {
    const fuzzyIndex = headers.findIndex((header) => header.includes(alias) || alias.includes(header));
    if (fuzzyIndex >= 0) return fuzzyIndex;
  }
  return -1;
}

function findTraceabilitySourceClabeColumn(headers) {
  const aliases = [
    "clabeorigen",
    "cuentaorigen",
    "cuentadeorigen",
    "originclabe",
    "sourceclabe",
    "sourceaccount",
    "originaccount",
    "clabeordenante",
    "cuentaordenante"
  ];
  let explicit = aliases
    .map((alias) => headers.findIndex((header) => header === alias))
    .find((index) => index >= 0);
  if (explicit == null) {
    explicit = aliases
      .map((alias) => headers.findIndex((header) => header.includes(alias)))
      .find((index) => index >= 0);
  }
  if (explicit >= 0) return explicit;

  const candidates = headers
    .map((header, index) => ({ header, index }))
    .filter(({ header }) => /clabe|cuenta|account/.test(header));
  return candidates.length === 1 ? candidates[0].index : -1;
}

function cellAt(row, index) {
  return index >= 0 ? String(row[index] || "").trim() : "";
}

function normalizeTraceabilityHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function normalizeTraceabilityEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeTraceabilityClabe(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 17) return `0${digits}`;
  return digits.length === 18 ? digits : "";
}

function normalizeTraceabilityName(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^A-Z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTraceabilityClabe(value) {
  const text = String(value || "");
  const labeled = text.match(/(?:clabe|cuenta)\s*(?:retiro|destino|origen)?\D{0,40}(\d[\d\s-]{16,30}\d)/i);
  const direct = normalizeTraceabilityClabe(labeled?.[1] || "");
  if (direct) return direct;
  return "";
}

function parseTraceabilityDate(value) {
  const raw = String(value || "").trim();
  if (!raw) return 0;
  const localMatch = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})(?:[ T,]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (localMatch) {
    const [, day, month, year, hour = "0", minute = "0", second = "0"] = localMatch;
    const fullYear = Number(year.length === 2 ? `20${year}` : year);
    const date = new Date(fullYear, Number(month) - 1, Number(day), Number(hour), Number(minute), Number(second));
    if (
      date.getFullYear() === fullYear &&
      date.getMonth() === Number(month) - 1 &&
      date.getDate() === Number(day)
    ) {
      return date.getTime();
    }
    return 0;
  }
  const parsed = Date.parse(raw);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function excelXmlEscape(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function downloadTextFile(filename, contentType, content) {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function dateSlug() {
  return new Date().toISOString().slice(0, 10);
}

function renderQuickDepositPreview() {
  if (!elements.quickDepositPreview) return;
  const values = getQuickDepositValues();
  elements.quickDepositPreview.innerHTML = `
    <strong>Mensaje a #depositos_exce</strong>
    <pre>${escapeHtml(buildDepositSlackMessage(values))}</pre>
  `;
}

function renderQuickInePreview() {
  if (!elements.quickInePreview) return;
  const email = elements.customerEmail.value.trim().toLowerCase() || "cliente@correo.com";
  const notifyWithdrawal = elements.quickIneNotifyWithdrawal.checked;
  const amount = normalizeMoneyInput(elements.quickIneWithdrawalAmount.value) || "$0.00";
  const date = elements.quickIneWithdrawalDate.value || "fecha del retiro";
  const withdrawalText = notifyWithdrawal
    ? `\n\nTambién a #retiros-kyc:\n${email}\nKYC actualizado - ${formatQuickIneDate(date)} $${amount.replace(/^\$+/, "")}`
    : "";
  elements.quickInePreview.innerHTML = `
    <strong>Mensaje a #ine-recibida</strong>
    <pre>${escapeHtml(email)}${escapeHtml(withdrawalText)}</pre>
  `;
}

function formatQuickIneDate(value) {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return match ? `${match[3]}/${match[2]}/${match[1]}` : String(value || "");
}

async function handleQuickDepositSubmit(event) {
  event.preventDefault();
  if (!ensureAuthenticated()) return;
  hideResult();

  const values = getQuickDepositValues();
  if (!values.trackingKey || !values.amount) {
    showResult("Completa clave de rastreo y monto para enviar el reporte.", "error");
    return;
  }
  if (!values.customerId || !values.customerEmail) {
    showResult("Falta ID o correo del cliente. Revisa que LiveChat haya detectado esos datos.", "error");
    return;
  }

  elements.quickDepositSubmitBtn.disabled = true;
  elements.quickDepositSubmitBtn.textContent = "Creando...";
  try {
    const description = `Deposito no reflejado de $${values.amount}`;
    const summary = `ID ${values.customerId} Deposito no reflejado`;
    const payload = {
      source: "quick_deposit_action",
      destination: "both",
      workflow: {
        id: "deposito-no-reflejado",
        label: "Deposito no reflejado",
        slackRouteId: "deposito-no-reflejado",
        slackTemplate: "deposit",
        messageOnly: true,
        requiredSlackFields: ["agentName", "customerId", "customerEmail", "trackingKey", "amount"]
      },
      livechat: {
        customerId: livechatProfile?.id || "",
        chatId: elements.chatId.value.trim(),
        threadId: livechatProfile?.chat?.id || "",
        groupId: livechatProfile?.chat?.groupID || "",
        source: livechatProfile?.source || ""
      },
      customer: {
        name: elements.customerName.value.trim(),
        email: values.customerEmail,
        authId: values.customerId
      },
      ticket: {
        issueTypeId: "",
        issueType: "Transacciones",
        priority: "Media",
        summary,
        description,
        labels: "deposito_no_reflejado",
        amplifyUrl: buildAmplifyUrl()
      },
      jiraFields: buildQuickDepositJiraFields({ values, summary, description }),
      slackFields: values,
      attachments: await serializeAttachments()
    };

    const response = await fetch("/api/support-ticket", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || `http_${response.status}`);
    }

    const jiraText = data.jira?.url ? ` Jira: ${data.jira.url}` : "";
    showResult(`Depósito no reflejado creado y enviado a #depositos_exce.${jiraText}`, "success");
    elements.quickDepositForm.hidden = true;
    updateQuickActionLayout();
    elements.quickDepositTrackingKey.value = "";
    elements.quickDepositAmount.value = "";
    attachments = [];
    renderAttachments();
  } catch (error) {
    showResult(`No pude crear el reporte automático: ${formatError(error.message)}`, "error");
  } finally {
    elements.quickDepositSubmitBtn.disabled = false;
    elements.quickDepositSubmitBtn.textContent = "Crear ticket y enviar";
  }
}

async function handleQuickIneSubmit(event) {
  event.preventDefault();
  if (!ensureAuthenticated()) return;
  hideResult();

  const email = elements.customerEmail.value.trim().toLowerCase();
  const notifyWithdrawal = elements.quickIneNotifyWithdrawal.checked;
  const withdrawalDate = elements.quickIneWithdrawalDate.value;
  const withdrawalAmount = normalizeMoneyInput(elements.quickIneWithdrawalAmount.value);
  if (!looksLikeEmail(email)) {
    showResult("Falta un correo válido del cliente. Revisa que LiveChat haya detectado el correo.", "error");
    return;
  }
  if (!attachments.length) {
    showResult("Agrega la INE antes de enviarla a validación.", "error");
    return;
  }
  if (attachments.length > MAX_INE_ATTACHMENT_COUNT) {
    showResult("Para INE recibida puedes enviar máximo 3 archivos: frente, reverso y selfie.", "error");
    return;
  }
  if (notifyWithdrawal && (!withdrawalDate || !withdrawalAmount)) {
    showResult("Indica fecha y monto del retiro para avisar a retiros-kyc.", "error");
    return;
  }

  elements.quickIneSubmitBtn.disabled = true;
  elements.quickIneSubmitBtn.textContent = "Enviando...";
  try {
    const response = await fetch("/api/support-ticket?action=ine-received", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        action: "ine-received",
        customer: {
          email,
          name: elements.customerName.value.trim(),
          authId: elements.authId.value.trim()
        },
        livechat: {
          chatId: elements.chatId.value.trim(),
          threadId: livechatProfile?.chat?.id || ""
        },
        withdrawal: {
          notify: notifyWithdrawal,
          date: withdrawalDate,
          amount: withdrawalAmount
        },
        attachments: await serializeIneReceivedAttachments()
      })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.ok === false) {
      throw new Error(data.error || `http_${response.status}`);
    }

    const withdrawalMessage = notifyWithdrawal
      ? (data.withdrawal?.ok
        ? " También se avisó a #retiros-kyc."
        : " La INE se publicó, pero no se pudo avisar a retiros-kyc.")
      : "";
    showResult(`INE enviada a #ine-recibida.${withdrawalMessage}`, data.partial ? "warning" : "success");
    elements.quickIneForm.hidden = true;
    elements.quickIneNotifyWithdrawal.checked = false;
    elements.quickIneWithdrawalFields.hidden = true;
    elements.quickIneWithdrawalDate.value = "";
    elements.quickIneWithdrawalAmount.value = "";
    attachments = [];
    renderAttachments();
    updateQuickActionLayout();
  } catch (error) {
    showResult(`No pude enviar la INE: ${formatError(error.message)}`, "error");
  } finally {
    elements.quickIneSubmitBtn.disabled = false;
    elements.quickIneSubmitBtn.textContent = "Enviar INE";
  }
}

function getQuickDepositValues() {
  return {
    agentName: currentAccount?.displayName || currentAccount?.email || "default",
    customerId: elements.authId.value.trim(),
    customerEmail: elements.customerEmail.value.trim().toLowerCase(),
    trackingKey: elements.quickDepositTrackingKey.value.trim(),
    amount: normalizeMoneyInput(elements.quickDepositAmount.value),
    game: "",
    detail: ""
  };
}

function buildDepositSlackMessage(values) {
  return [
    "💸 DEPOSITO NO REFLEJADO 💸",
    `AGENTE:${values.agentName || "default"}`,
    `ID:${values.customerId || "default"}`,
    `CORREO:${values.customerEmail || "default"}`,
    `CLAVE DE RASTREO:${values.trackingKey || ""}`,
    `MONTO:$${normalizeMoneyInput(values.amount)}`
  ].join("\n");
}

function buildQuickDepositJiraFields({ values, summary, description }) {
  const schema = { type: "string" };
  return {
    summary: { name: "Resumen", value: summary, schema },
    description: { name: "Descripción", value: description, schema: { type: "textarea" } },
    labels: { name: "Etiquetas", value: "deposito_no_reflejado", schema: { type: "array", items: "string" } },
    customfield_10071: { name: "Email del cliente", value: values.customerEmail, schema },
    customfield_10073: { name: "Nombre y apellido del cliente", value: elements.customerName.value.trim(), schema },
    customfield_10072: { name: "AUTH ID", value: values.customerId, schema },
    customfield_10070: { name: "KYC URL", value: buildAmplifyUrl(), schema }
  };
}

function normalizeMoneyInput(value) {
  return String(value || "").trim().replace(/^\$+/, "");
}

async function handleDetectReplyFromChat() {
  await loadChatMessagesForSuggestion({ forceResult: true });
}

function handleClearReply() {
  if (!elements.replyInput || !elements.replySuggestion) return;
  elements.replyInput.value = "";
  currentReplyMatches = [];
  elements.replySuggestion.hidden = true;
  elements.replySuggestion.innerHTML = "";
}

async function loadChatMessagesForSuggestion(options = {}) {
  if (!elements.replyInput || !elements.replySuggestion) return;
  const chatId = elements.chatId.value.trim();
  if (!chatId) {
    if (options.forceResult) {
      renderReplyEmpty("No hay chat activo para analizar.");
    }
    return;
  }

  try {
    const data = await fetchJson(`/api/livechat-webhook?chatId=${encodeURIComponent(chatId)}`);
    if (data.text) {
      elements.replyInput.value = data.text;
      renderReplySuggestion();
      return;
    }
    const liveChatData = await fetchJson("/api/support-ticket?action=livechat-get-chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ chatId })
    });
    if (liveChatData.text) {
      elements.replyInput.value = liveChatData.text;
      renderReplySuggestion();
      return;
    }
    if (options.forceResult) {
      renderReplyEmpty("Todavía no tengo mensajes útiles del cliente para este chat.");
    }
  } catch (error) {
    if (options.forceResult) {
      renderReplyEmpty(`No pude leer mensajes del chat: ${formatError(error.message)}`);
    }
  }
}

function renderReplySuggestion() {
  if (!elements.replyInput || !elements.replySuggestion) return;
  const text = elements.replyInput.value.trim();
  if (!text) {
    elements.replySuggestion.hidden = true;
    elements.replySuggestion.innerHTML = "";
    return;
  }

  currentReplyMatches = findQuickReplies(text).slice(0, 3);
  if (!currentReplyMatches.length) {
    renderReplyEmpty("No encontré una respuesta clara para este mensaje. El agente debe revisar manualmente.");
    return;
  }

  elements.replySuggestion.hidden = false;
  elements.replySuggestion.innerHTML = `
    <div class="reply-match-heading">
      <strong>Respuesta sugerida</strong>
      <span>${escapeHtml(currentReplyMatches[0].title)} · ${currentReplyMatches[0].score} coincidencia${currentReplyMatches[0].score === 1 ? "" : "s"}</span>
    </div>
    ${currentReplyMatches.map(renderReplyMatch).join("")}
  `;
}

function renderReplyMatch(match, index) {
  const response = personalizeReply(match.response);
  return `
    <article class="reply-match ${index === 0 ? "primary" : ""}">
      <div>
        <strong>${escapeHtml(match.title)}</strong>
        <span>#${escapeHtml(match.id)}</span>
      </div>
      <pre>${escapeHtml(response)}</pre>
      <button type="button" class="secondary-button" data-copy-reply-index="${index}">COPIAR RESPUESTA</button>
    </article>
  `;
}

function renderReplyEmpty(message) {
  if (!elements.replySuggestion) return;
  currentReplyMatches = [];
  elements.replySuggestion.hidden = false;
  elements.replySuggestion.innerHTML = `<p class="search-state">${escapeHtml(message)}</p>`;
}

async function handleReplySuggestionClick(event) {
  if (!elements.replyInput) return;
  const button = event.target.closest("[data-copy-reply-index]");
  if (!button) return;
  const match = currentReplyMatches[Number(button.dataset.copyReplyIndex)];
  const text = personalizeReply(match?.response || "");
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = "COPIADO";
    setTimeout(() => {
      button.textContent = "COPIAR RESPUESTA";
    }, 1200);
  } catch {
    elements.replyInput.value = text;
    elements.replyInput.select();
  }
}

function findQuickReplies(text) {
  const normalized = normalizeText(text);
  const words = new Set(normalized.split(/[^a-z0-9]+/).filter((word) => word.length >= 3));
  return QUICK_REPLIES.map((reply) => {
    const score = reply.keywords.reduce((total, keyword) => {
      const clean = normalizeText(keyword);
      if (!clean) return total;
      if (normalized.includes(clean)) return total + Math.max(2, clean.split(/\s+/).length + 1);
      return clean.split(/\s+/).some((word) => words.has(word)) ? total + 1 : total;
    }, 0);
    return { ...reply, score };
  }).filter((reply) => reply.score > 0).sort((a, b) => b.score - a.score || a.title.localeCompare(b.title));
}

function personalizeReply(response) {
  const name = elements.customerName.value.trim() || "Usuario";
  return String(response || "").replaceAll("%customer-name%", name);
}

function renderSearchResults(tickets, message = "") {
  if (message) {
    elements.searchResults.innerHTML = `<p class="search-state">${escapeHtml(message)}</p>`;
    return;
  }

  if (!tickets.length) {
    elements.searchResults.innerHTML = '<p class="search-state">No encontré tickets con esos datos.</p>';
    return;
  }

  elements.searchResults.innerHTML = `
    <div class="results-heading">
      <strong>${tickets.length} resultado${tickets.length === 1 ? "" : "s"} encontrado${tickets.length === 1 ? "" : "s"}</strong>
      <span>Selecciona un ticket para consultar o reutilizar datos del cliente.</span>
    </div>
    ${tickets.map(renderTicketResult).join("")}
  `;
}

function renderUnifiedSearchResults({ tickets = [], slackPanels = [], errors = [] } = {}) {
  if (!SLACK_LIST_LOOKUPS_ENABLED) {
    if (!tickets.length && !errors.length) {
      elements.searchResults.innerHTML = `
        <p class="search-state">No encontré coincidencias en Jira.</p>
        <p class="search-state">${escapeHtml(SLACK_LIST_LOOKUPS_PAUSED_MESSAGE)}</p>
      `;
      return;
    }

    elements.searchResults.innerHTML = `
      <div class="results-heading unified-heading">
        <strong>${tickets.length} coincidencia${tickets.length === 1 ? "" : "s"} encontrada${tickets.length === 1 ? "" : "s"}</strong>
        <span>${tickets.length} en Jira · Slack pausado</span>
      </div>
      ${errors.length ? `<div class="search-warning">${errors.map((error) => `<p>${escapeHtml(error)}</p>`).join("")}</div>` : ""}
      <section class="combined-results-section">
        <div class="combined-results-title">
          <strong>Tickets Jira</strong>
          <span>${tickets.length}</span>
        </div>
        ${tickets.length ? tickets.map(renderTicketResult).join("") : '<p class="search-state">Sin tickets de Jira para esta búsqueda.</p>'}
      </section>
      <p class="search-state">${escapeHtml(SLACK_LIST_LOOKUPS_PAUSED_MESSAGE)}</p>
    `;
    return;
  }

  const slackTotal = slackPanels.reduce((total, panelResult) => total + (panelResult.items?.length || 0), 0);
  const hasPanels = slackPanels.length > 0;
  const hasResults = tickets.length || slackTotal;

  if (!hasResults && !errors.length) {
    elements.searchResults.innerHTML = `
      <p class="search-state">No encontré coincidencias en Jira ni en Slack Lista 8.</p>
      ${!hasPanels ? '<p class="search-state">No hay listas de Slack configuradas para consultar desde este buscador.</p>' : ""}
    `;
    return;
  }

  elements.searchResults.innerHTML = `
    <div class="results-heading unified-heading">
      <strong>${tickets.length + slackTotal} coincidencia${tickets.length + slackTotal === 1 ? "" : "s"} encontrada${tickets.length + slackTotal === 1 ? "" : "s"}</strong>
      <span>${tickets.length} en Jira · ${slackTotal} en Slack</span>
    </div>
    ${errors.length ? `<div class="search-warning">${errors.map((error) => `<p>${escapeHtml(error)}</p>`).join("")}</div>` : ""}
    <section class="combined-results-section">
      <div class="combined-results-title">
        <strong>Tickets Jira</strong>
        <span>${tickets.length}</span>
      </div>
      ${tickets.length ? tickets.map(renderTicketResult).join("") : '<p class="search-state">Sin tickets de Jira para esta búsqueda.</p>'}
    </section>
    <section class="combined-results-section">
      <div class="combined-results-title">
        <strong>Lista Slack</strong>
        <span>${slackTotal}</span>
      </div>
      ${hasPanels ? slackPanels.map(renderSlackPanelSearchResult).join("") : '<p class="search-state">No hay listas de Slack configuradas para este buscador.</p>'}
    </section>
  `;
}

function renderSlackPanelSearchResult(panelResult) {
  const items = Array.isArray(panelResult.items) ? panelResult.items : [];
  const panel = panelResult.panel || {};
  return `
    <div class="slack-search-panel">
      <div class="slack-search-panel-heading">
        <strong>${escapeHtml(panel.label || "Lista Slack")}</strong>
        <span>${items.length} resultado${items.length === 1 ? "" : "s"}</span>
      </div>
      ${items.length ? `
        <div class="list-panel-grid">
          ${items.map((item) => renderListPanelCard(item, panel)).join("")}
        </div>
      ` : `
        <p class="search-state">${panelResult.error ? `No pude consultar esta lista: ${escapeHtml(panelResult.error)}` : panelResult.warning ? "Slack está limitado por ahora; no hay coincidencias disponibles de esta lista." : "Sin coincidencias en esta lista."}</p>
      `}
    </div>
  `;
}

function renderTicketResult(ticket, index) {
  const customer = ticket.customer || {};
  const comments = Array.isArray(ticket.comments) ? ticket.comments : [];
  return `
    <article class="ticket-result">
      <div class="ticket-result-main">
        <div>
          <strong>${escapeHtml(ticket.key || "Ticket")}</strong>
          <h3>${escapeHtml(ticket.summary || "Sin resumen")}</h3>
        </div>
        <span>${escapeHtml(ticket.status || "Sin estado")}</span>
      </div>
      <dl>
        <div><dt>CLIENTE</dt><dd>${escapeHtml(customer.name || "Sin nombre")}</dd></div>
        <div><dt>CORREO</dt><dd>${escapeHtml(customer.email || "Sin correo")}</dd></div>
        <div><dt>AUTH ID</dt><dd>${escapeHtml(customer.authId || "Sin AUTH ID")}</dd></div>
        <div><dt>PRIORIDAD</dt><dd>${escapeHtml(ticket.priority || "Sin prioridad")}</dd></div>
      </dl>
      ${renderTicketTextBlock("DESCRIPCIÓN", ticket.description || "Sin descripción registrada.")}
      ${comments.length ? renderTicketComments(comments, ticket.commentsTotal) : ""}
      <div class="ticket-result-actions">
        <a href="${escapeHtml(ticket.url)}" target="_blank" rel="noreferrer">ABRIR EN JIRA</a>
        <button type="button" data-copy-ticket="${index}">CREAR OTRO CON ESTE CLIENTE</button>
      </div>
      <form class="ticket-comment-form" data-comment-ticket="${index}">
        <label>
          COMENTAR
          <textarea name="comment" rows="3" maxlength="2000" placeholder="Escribe el seguimiento para este ticket..."></textarea>
        </label>
        <button type="submit">PREPARAR COMENTARIO</button>
        <p class="ticket-comment-status" data-comment-status="${index}" aria-live="polite"></p>
      </form>
    </article>
  `;
}

function renderTicketTextBlock(title, value) {
  return `
    <div class="ticket-result-notes">
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(truncateText(value, 520))}</p>
    </div>
  `;
}

function renderTicketComments(comments, total = 0) {
  const title = total > comments.length
    ? `COMENTARIOS (${comments.length} DE ${total})`
    : `COMENTARIOS (${comments.length})`;
  return `
    <div class="ticket-comments">
      <strong>${escapeHtml(title)}</strong>
      ${comments.map(renderTicketComment).join("")}
    </div>
  `;
}

function renderTicketComment(comment) {
  return `
    <div class="ticket-comment">
      <span>${escapeHtml(comment.author || "Sin autor")}${comment.created ? ` · ${escapeHtml(formatDate(comment.created))}` : ""}</span>
      <p>${escapeHtml(truncateText(comment.body, 360))}</p>
    </div>
  `;
}

function handleSearchResultAction(event) {
  const button = event.target.closest("[data-copy-ticket]");
  if (!button) return;
  const ticket = searchTickets[Number(button.dataset.copyTicket)];
  if (!ticket) return;
  openTicketForm(ticket.customer || {});
}

function handleTicketCommentSubmit(event) {
  const form = event.target.closest("[data-comment-ticket]");
  if (!form) return;
  event.preventDefault();

  const index = Number(form.dataset.commentTicket);
  const ticket = searchTickets[index];
  const textarea = form.elements.comment;
  const submitButton = form.querySelector('button[type="submit"]');
  const status = form.querySelector("[data-comment-status]");
  const body = String(textarea?.value || "").trim();

  if (!ticket?.key) {
    if (status) status.textContent = "No tengo la clave del ticket para comentar.";
    return;
  }

  if (!body) {
    if (status) status.textContent = "Escribe el comentario antes de prepararlo.";
    textarea?.focus();
    return;
  }

  if (!currentCaseView?.chatId) {
    if (status) status.textContent = "Abre un chat con expediente activo para preparar una acción supervisada.";
    return;
  }

  if (ACTIVE_CASE_ACTION_STATUSES.has(currentCaseAction?.status)) {
    if (status) status.textContent = "Hay una acción activa. Apruébala, ejecútala o recházala antes de preparar otra.";
    elements.caseAgentPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }

  currentCaseAction = null;
  elements.caseActionType.value = "jira.comment";
  renderCaseActionTarget();
  elements.caseActionTarget.value = ticket.key;
  elements.caseActionText.value = body;
  renderCaseActionControls();

  submitButton.disabled = false;
  if (status) status.textContent = "Comentario cargado en Acción supervisada. Revísalo y presiona Proponer; aún no se ha enviado a Jira.";
  elements.caseActionStatus.textContent = "Comentario de Jira preparado. Revisa el contenido y presiona Proponer.";
  elements.caseAgentPanel?.scrollIntoView({ behavior: "smooth", block: "start" });
  window.setTimeout(() => elements.caseActionProposeBtn?.focus({ preventScroll: true }), 350);
}

function openTicketForm(customer = {}) {
  if (!ensureAuthenticated()) return;
  pendingCustomerPrefill = hasCustomerPrefill(customer) ? { ...customer } : null;
  if (customer.name) elements.customerName.value = customer.name;
  if (customer.email) elements.customerEmail.value = customer.email;
  if (customer.authId) elements.authId.value = customer.authId;
  showView("ticket");
  applyAutofill({ force: true });
  applyCustomerTicketFields(customer);
  applySlackAutofill({ force: true });
  renderDestinationMode();
}

function hasCustomerPrefill(customer = {}) {
  return Boolean(customer.name || customer.email || customer.authId || customer.kycUrl);
}

function applyCustomerTicketFields(customer = {}) {
  const values = {
    customfield_10071: customer.email,
    customfield_10073: customer.name,
    customfield_10072: customer.authId,
    customfield_10070: customer.kycUrl
  };

  for (const [fieldId, value] of Object.entries(values)) {
    const input = elements.form.querySelector(`[data-field-id="${cssEscape(fieldId)}"]`);
    if (input && value) {
      input.value = value;
    }
  }
}

async function handleSubmit(event) {
  event.preventDefault();
  if (!ensureAuthenticated()) return;
  setBusy(true);
  hideResult();

  try {
    const workflow = getSelectedWorkflow();
    const selectedIssueType = issueTypes.find((issueType) => issueType.id === elements.issueType.value);
    const fieldValues = collectJiraFieldValues();
    const destination = resolveTicketDestination();
    const slackFields = collectSlackFields();
    if ((destination === "slack" || destination === "both") && !hasRequiredSlackFields(slackFields, workflow)) {
      throw new Error("invalid_slack_payload");
    }
    const summary = destination === "slack" ? buildSlackSummary(slackFields, workflow) : fieldValues.summary?.value || buildSlackSummary(slackFields, workflow);
    const description = destination === "slack"
      ? slackFields.detail || buildSlackMessageText(slackFields)
      : fieldValues.description?.value || slackFields.detail || buildSlackMessageText(slackFields);

    const payload = {
      source: "livechat_agent_widget",
      destination,
      workflow: {
        id: workflow.id,
        label: workflow.label,
        slackRouteId: workflow.slackRouteId || "",
        slackTemplate: workflow.slackTemplate || "",
        requiredSlackFields: workflow.requiredSlackFields || []
      },
      livechat: {
        customerId: livechatProfile?.id || "",
        chatId: elements.chatId.value.trim(),
        threadId: livechatProfile?.chat?.id || "",
        groupId: livechatProfile?.chat?.groupID || "",
        source: livechatProfile?.source || ""
      },
      customer: {
        name: elements.customerName.value.trim(),
        email: slackFields.customerEmail || elements.customerEmail.value.trim(),
        authId: slackFields.customerId || elements.authId.value.trim()
      },
      ticket: {
        issueTypeId: selectedIssueType?.id || "",
        issueType: selectedIssueType?.name || "",
        priority: fieldValues.priority?.value || "Media",
        summary,
        description,
        labels: fieldValues.labels?.value || "",
        amplifyUrl: buildAmplifyUrl()
      },
      jiraFields: fieldValues,
      slackFields,
      attachments: await serializeAttachments()
    };

    const response = await fetch("/api/support-ticket", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.ok === false) {
      throw new Error(data.error || `http_${response.status}`);
    }

    showCreatedTicketResult(data.jira || {}, data.slack || {});
  } catch (error) {
    showResult(`No pude crear el reporte: ${formatError(error.message)}`, "error");
  } finally {
    setBusy(false);
  }
}

function renderDestinationMode() {
  if (!elements.ticketDestination) return;
  const workflow = getSelectedWorkflow();
  const destination = resolveTicketDestination();
  const showJira = destination === "jira" || destination === "both";
  const showSlack = destination === "slack" || destination === "both";
  const isSessionClose = workflow.id === "cierre-sesiones";
  const isDeposit = workflow.slackTemplate === "deposit";
  const showCustomerSlackFields = showSlack && !showJira && !isDeposit;
  const showDepositFields = showSlack && isDeposit;

  elements.caseFields.hidden = !showJira;
  elements.jiraDetailsSection.hidden = !showJira;
  elements.issueType.closest("label").hidden = destination === "slack";
  elements.issueType.disabled = destination === "slack";
  elements.slackFields.hidden = !showSlack;
  setFormControlsDisabled(elements.slackFields, !showSlack);
  setFieldVisible(elements.slackAgentField, elements.slackAgentName, false);
  setFieldVisible(elements.slackCustomerIdField, elements.slackCustomerId, showCustomerSlackFields);
  setFieldVisible(elements.slackCustomerEmailField, elements.slackCustomerEmail, showCustomerSlackFields);
  setFieldVisible(elements.slackGameField, elements.slackGame, showSlack && isSessionClose);
  setFieldVisible(elements.slackTrackingKeyField, elements.slackTrackingKey, showDepositFields);
  setFieldVisible(elements.slackAmountField, elements.slackAmount, showDepositFields);
  setFieldVisible(elements.slackDetailField, elements.slackDetail, false);
  elements.slackMessagePreviewField.hidden = true;
  setFormControlsDisabled(elements.caseFields, !showJira);
  setFormControlsDisabled(elements.jiraDetailsSection, !showJira);

  if (showSlack) {
    applySlackAutofill();
    renderSlackMessagePreview();
  }
  renderSubmitButton(false);
}

function setFieldVisible(container, input, visible) {
  if (container) container.hidden = !visible;
  if (input) input.disabled = !visible;
}

async function handleReportTypeChange() {
  const workflow = getSelectedWorkflow();
  if (workflow.jiraIssueType) {
    const issueType = findIssueTypeByName(workflow.jiraIssueType);
    if (issueType && elements.issueType.value !== issueType.id) {
      elements.issueType.value = issueType.id;
      await loadIssueTypeFields(issueType.id);
      return;
    }
  }
  renderDestinationMode();
}

function getSelectedSlackRoute() {
  const routes = supportConfig.slackRoutes || [];
  if (!routes.length) return null;
  const selectedIssueType = issueTypes.find((issueType) => issueType.id === elements.issueType.value);
  const issueType = normalizeText(selectedIssueType?.name || "");
  return routes.find((route) => {
    const issueTypes = route.match?.issueTypes || [];
    return issueTypes.map(normalizeText).includes(issueType);
  }) || routes[0];
}

function collectSlackFields() {
  return {
    agentName: elements.slackAgentName.value.trim(),
    customerId: elements.slackCustomerId.value.trim(),
    customerEmail: elements.slackCustomerEmail.value.trim(),
    game: elements.slackGame.value.trim(),
    trackingKey: elements.slackTrackingKey.value.trim(),
    amount: elements.slackAmount.value.trim(),
    detail: elements.slackDetail.value.trim()
  };
}

function hasRequiredSlackFields(values, workflow = getSelectedWorkflow()) {
  return (workflow.requiredSlackFields || []).every((field) => Boolean(values[field]));
}

function setFormControlsDisabled(container, disabled) {
  if (!container) return;
  container.querySelectorAll("input, select, textarea, button").forEach((control) => {
    control.disabled = Boolean(disabled);
  });
}

function applySlackAutofill(options = {}) {
  const force = Boolean(options.force);
  const values = {
    slackAgentName: currentAccount?.displayName || currentAccount?.email || "",
    slackCustomerId: elements.authId.value.trim(),
    slackCustomerEmail: elements.customerEmail.value.trim()
  };

  for (const [key, value] of Object.entries(values)) {
    const input = elements[key];
    if (input && (force || !input.value.trim())) {
      input.value = value;
    }
  }
}

function renderSlackMessagePreview() {
  elements.slackMessagePreview.textContent = buildSlackMessageText(collectSlackFields());
}

function buildSlackMessageText(values) {
  const workflow = getSelectedWorkflow();
  const isDeposit = workflow.slackTemplate === "deposit";
  if (workflow.slackTemplate === "session-close") {
    return [
      "CIERRE DE SESIONES",
      `JUEGO:${values.game || ""}`,
      `ID:${values.customerId || ""}`,
      `CORREO:${values.customerEmail || ""}`
    ].join("\n");
  }

  if (isDeposit) {
    return [
    "💸 DEPOSITO NO REFLEJADO 💸",
    `AGENTE:${values.agentName || ""}`,
    `ID:${values.customerId || ""}`,
    `CORREO:${values.customerEmail || ""}`,
    `CLAVE DE RASTREO:${values.trackingKey || ""}`,
    `MONTO:$${normalizeMoneyInput(values.amount)}`
    ].join("\n");
  }

  return [
    workflow.label || "Reporte Slack",
    `ID:${values.customerId || ""}`,
    `CORREO:${values.customerEmail || ""}`
  ].join("\n");
}

function buildSlackSummary(values, workflow = getSelectedWorkflow()) {
  const customer = values.customerEmail || values.customerId || "cliente";
  if (workflow.id === "cierre-sesiones") {
    return `Cierre de sesiones | ${values.game || "juego"} | ${customer}`;
  }
  if (workflow.id === "cierre-sesiones-jira") {
    return buildDefaultSummary();
  }
  return `${workflow.label || "Deposito no reflejado"} | ${customer}`;
}

function resolveTicketDestination() {
  return getSelectedWorkflow().destination || "jira";
}

function getSelectedWorkflow() {
  return reportWorkflows[elements.ticketDestination?.value] || reportWorkflows.jira || DEFAULT_REPORT_WORKFLOWS.jira;
}

function findIssueTypeByName(name) {
  const target = normalizeText(name);
  return issueTypes.find((issueType) => normalizeText(issueType.name) === target);
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function setConnection(value) {
  elements.connectionState.textContent = value;
}

function setBusy(isBusy) {
  renderSubmitButton(isBusy);
}

function renderSubmitButton(isBusy) {
  const labels = {
    jira: "CREAR TICKET EN JIRA",
    slack: "ENVIAR A SLACK",
    both: "CREAR EN JIRA Y SLACK"
  };
  const destination = resolveTicketDestination();
  elements.submitBtn.disabled = Boolean(isBusy);
  elements.submitBtn.innerHTML = isBusy
    ? "Procesando..."
    : `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 12.4 12.4 8.5a2.6 2.6 0 0 1 3.7 3.7l-3.9 3.9a2.6 2.6 0 0 1-3.7-3.7Z"></path><path d="m9.9 10.9 3.2 3.2"></path></svg>${labels[destination] || labels.jira}`;
}

function showResult(message, type) {
  elements.result.hidden = false;
  elements.result.className = `result ${type}`;
  elements.result.textContent = message;
}

function showCreatedTicketResult(jira = {}, slack = {}) {
  const attachmentCount = jira.attachments?.length || 0;
  const slackStatus = formatSlackStatus(slack);
  const title = jira.key ? "Ticket creado" : "Reporte enviado";
  const detail = jira.key || slackStatus || "Operacion completada";
  elements.result.hidden = false;
  elements.result.className = "result success created-ticket-result";
  elements.result.innerHTML = `
    <div>
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(detail)}${attachmentCount ? ` · ${attachmentCount} adjunto${attachmentCount === 1 ? "" : "s"}` : ""}</span>
      ${slackStatus ? `<span>${escapeHtml(slackStatus)}</span>` : ""}
    </div>
    ${jira.url ? `<a href="${escapeHtml(jira.url)}" target="_blank" rel="noreferrer">ABRIR TICKET</a>` : ""}
  `;
  elements.result.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function formatSlackStatus(slack = {}) {
  if (slack.ok && slack.list?.rowId && slack.channel?.ts) {
    return `Slack: enviado a ${slack.routeName || "ruta"} y lista actualizada`;
  }
  if (slack.ok && slack.list?.rowId) {
    return `Slack: lista actualizada en ${slack.routeName || "ruta"}`;
  }
  if (slack.ok && slack.channel?.ts) {
    if (slack.channel.asUser) {
      return `Slack: mensaje enviado con tu usuario a ${slack.routeName || "canal"}`;
    }
    if (slack.channel.userFallback) {
      return `Slack: mensaje enviado con bot; tu Slack personal falló (${formatError(slack.channel.userFallback)})`;
    }
    return `Slack: mensaje enviado a ${slack.routeName || "canal"}`;
  }
  if (slack.skipped) {
    return "Slack: sin configuración";
  }
  if (slack.error) {
    return `Slack: pendiente (${formatError(slack.error)})`;
  }
  return "";
}

function hideResult() {
  elements.result.hidden = true;
  elements.result.textContent = "";
}

function formatError(message) {
  const raw = String(message || "error_desconocido");
  const dictionary = {
    unauthenticated_widget_call: "el backend aun requiere autenticacion. Activa temporalmente ALLOW_UNAUTHENTICATED_WIDGET=true para pruebas privadas o agrega OAuth de LiveChat.",
    missing_jira_config: "faltan variables de Jira en Vercel.",
    jira_create_failed: "Jira rechazo la creacion del ticket.",
    slack_notification_failed: "Slack rechazo la notificacion.",
    missing_slack_config: "faltan variables de Slack en Vercel.",
    slack_row_not_created: "Slack no devolvio la fila creada en la lista.",
    slack_list_write_not_granted: "el token de Slack no tiene permiso de escritura en esa lista.",
    slack_list_has_no_items: "la lista de Slack no tiene registros para mostrar.",
    slack_list_reads_paused: "la consulta de Listas Slack está pausada temporalmente.",
    missing_scope: "faltan permisos en la app de Slack.",
    invalid_auth: "el token de Slack no es valido o vencio.",
    list_not_found: "Slack no encontro la lista o el token no tiene acceso.",
    invalid_arguments: "Slack rechazo el formato de alguna columna de la lista.",
    slack_route_not_configured: "esa opcion aun no tiene canal o lista Slack configurada en el panel remoto.",
    invalid_payload: "faltan datos obligatorios del caso.",
    invalid_slack_payload: "faltan datos obligatorios para Slack: agente, ID, correo, clave de rastreo y monto.",
    jira_metadata_failed: "no pude leer los campos de Jira.",
    jira_attachment_failed: "Jira creo el ticket, pero rechazo uno de los adjuntos.",
    jira_search_failed: "no pude buscar tickets en Jira.",
    invalid_jira_comment: "escribe un comentario valido para Jira.",
    jira_comment_failed: "Jira rechazo el comentario.",
    missing_kv_config: "falta conectar KV/Redis en Vercel.",
    missing_encryption_key: "falta SUPPORT_ENCRYPTION_KEY en Vercel.",
    missing_session_secret: "falta SUPPORT_SESSION_SECRET en Vercel.",
    missing_groq_api_key: "falta GROQ_API_KEY en Vercel para activar Groq.",
    groq_rate_limited: "Groq llego al limite temporal de la cuenta. Intenta mas tarde o usa una plantilla mientras se libera el limite.",
    groq_quota_exceeded: "Groq indica que la cuenta no tiene cuota disponible o llego al limite configurado.",
    groq_request_failed: "Groq rechazo la consulta. Revisa el modelo, la llave o los limites de la cuenta.",
    missing_openai_api_key: "falta OPENAI_API_KEY en Vercel para activar el proveedor OpenAI opcional.",
    openai_rate_limited: "OpenAI llego al limite temporal de tokens de la cuenta. Intenta mas tarde o usa una plantilla mientras se libera el limite.",
    openai_quota_exceeded: "OpenAI indica que la cuenta no tiene cuota disponible o falta billing activo. Revisa plan, saldo o metodo de pago de OpenAI.",
    openai_request_failed: "OpenAI rechazo la consulta. Revisa el modelo, la llave o los limites de la cuenta.",
    missing_message: "escribe una consulta para el asistente IA.",
    invalid_login: "no se pudo validar la sesión.",
    slack_login_required: "debes iniciar sesión con Slack para usar la app.",
    bob_customer_data_required: "completa nombre y correo válido del cliente antes de solicitar el cierre.",
    login_required: "primero inicia sesión con Slack.",
    slack_signin_not_configured: "falta configurar Sign in with Slack en Vercel.",
    invalid_slack_signin_state: "la autorización de Slack venció o no corresponde a esta sesión.",
    slack_signin_email_missing: "Slack no devolvió el correo del usuario.",
    slack_oauth_not_configured: "falta configurar OAuth de Slack en Vercel.",
    invalid_slack_oauth_state: "la autorización de Slack venció o no corresponde a tu sesión.",
    slack_oauth_url_missing: "Slack no devolvió URL de autorización.",
    missing_pin: "debes poner un PIN para guardar la cuenta.",
    user_not_authorized: "este correo no esta autorizado para usar la app de soporte.",
    admin_not_authorized: "tu usuario no tiene permiso de administración.",
    invalid_customer_email: "el correo del cliente no es válido.",
    invalid_kyc_status: "el estatus KYC no es válido.",
    invalid_customer_id: "el ID del cliente no es válido.",
    missing_betxico_assistant_api_url: "falta BETXICO_ASSISTANT_API_URL para conectar con APP Betxico.",
    missing_betxico_assistant_token: "falta token admin para conectar con APP Betxico.",
    missing_access_token: "APP Betxico rechazó la llamada porque falta token.",
    sensitive_action_requires_local_token: "APP Betxico rechazó el cierre: el token no tiene permiso admin.",
    "Game session closure is disabled by ACTION_CLOSE_GAME_SESSIONS": "el cierre de sesiones está desactivado en APP Betxico.",
    betxico_assistant_timeout: "APP Betxico tardó demasiado en responder.",
    game_sessions_close_failed: "APP Betxico no pudo cerrar sesiones.",
    game_sessions_request_failed: "no pude enviar la solicitud a APP Betxico.",
    game_sessions_requests_failed: "no pude leer las solicitudes de cierre.",
    session_close_request_already_processing: "esa solicitud ya está en proceso en APP Betxico.",
    session_close_request_already_finished: "esa solicitud ya fue atendida en APP Betxico.",
    http_413: "los archivos pesan demasiado para enviarlos. Prueba otra vez: las fotos de INE se reducirán automáticamente.",
    ine_received_evidence_too_large: "las fotos siguen siendo demasiado pesadas después de prepararlas. Envía frente, reverso y selfie por separado o reduce su resolución."
  };
  return dictionary[raw] || raw;
}

async function loadIssueTypes() {
  try {
    const data = await fetchJson("/api/jira-metadata");
    issueTypes = data.issueTypes || [];

    elements.issueType.innerHTML = issueTypes
      .map((issueType) => `<option value="${escapeHtml(issueType.id)}">${escapeHtml(issueType.name)}</option>`)
      .join("");

    const workflowIssueType = getSelectedWorkflow().jiraIssueType;
    const preferred = findIssueTypeByName(workflowIssueType) || issueTypes.find((issueType) => issueType.name === "Servicio al Cliente") || issueTypes[0];
    if (preferred) {
      elements.issueType.value = preferred.id;
      await loadIssueTypeFields(preferred.id);
    }
  } catch (error) {
    elements.issueType.innerHTML = '<option value="">No pude cargar Jira</option>';
    showResult(`No pude leer campos de Jira: ${formatError(error.message)}`, "error");
  }
}

async function loadIssueTypeFields(issueTypeId) {
  if (!issueTypeId) return;

  elements.caseFields.innerHTML = "";
  elements.jiraFields.innerHTML = '<p class="loading">Cargando campos de Jira...</p>';
  try {
    const data = await fetchJson(`/api/jira-metadata?issueTypeId=${encodeURIComponent(issueTypeId)}`);
    jiraFields = data.fields || [];
    jiraDefaults = data.defaults || {};
    renderJiraFields(jiraFields);
    renderAccount();
    applyAutofill();
    if (pendingCustomerPrefill) {
      applyCustomerTicketFields(pendingCustomerPrefill);
    }
    applySlackAutofill();
    renderDestinationMode();
  } catch (error) {
    elements.jiraFields.innerHTML = "";
    showResult(`No pude leer campos de Jira: ${formatError(error.message)}`, "error");
  }
}

function renderJiraFields(fields) {
  const supportedFields = fields.filter((field) => field.supported && shouldShowField(field)).sort(sortJiraFields);
  const groups = {
    case: orderFields(supportedFields.filter((field) => [
      "summary",
      "customfield_10071",
      "customfield_10073",
      "customfield_10072",
      "customfield_10070",
      "labels"
    ].includes(field.id)), ["summary", "customfield_10071", "customfield_10073", "customfield_10072", "customfield_10070", "labels"]),
    description: supportedFields.filter((field) => field.id === "description"),
    other: supportedFields.filter((field) => ![
      "summary",
      "priority",
      "labels",
      "customfield_10073",
      "customfield_10071",
      "customfield_10072",
      "customfield_10070",
      "description"
    ].includes(field.id))
  };

  elements.caseFields.innerHTML = groups.case.map(renderField).join("");
  elements.jiraFields.innerHTML = [
    groups.description.map(renderField).join(""),
    groups.other.length ? renderFieldGroup("Datos adicionales", "file", groups.other) : ""
  ].join("");
  wireDescriptionCounters();
}

function shouldShowField(field) {
  return !["assignee", "reporter", "priority", "customfield_10001", "customfield_10015"].includes(field.id);
}

function sortJiraFields(a, b) {
  return getFieldOrder(a.id) - getFieldOrder(b.id);
}

function getFieldOrder(fieldId) {
  const order = {
    summary: 10,
    priority: 20,
    customfield_10070: 30,
    customfield_10073: 40,
    customfield_10071: 50,
    customfield_10072: 60,
    labels: 70,
    description: 90
  };
  return order[fieldId] || 80;
}

function renderField(field) {
  const isRequired = field.required && field.id !== "labels" && field.id !== "customfield_10001";
  const required = isRequired ? "required" : "";
  const requiredText = isRequired ? '<span class="required">*</span>' : "";
  const id = escapeHtml(field.id);
  const displayName = getDisplayName(field);
  const label = `<span class="field-label">${escapeHtml(displayName)}${requiredText}</span>`;
  const common = `id="field-${id}" data-field-id="${id}" ${required}`;

  if (field.id === "summary") {
    return `<label class="jira-field">${label}<input ${common} type="text" placeholder="Ej. Retiro no reflejado / Depósito pendiente"></label>`;
  }

  if (field.type === "select") {
    const options = field.allowedValues
      .map((option) => {
        const selected = field.id === "priority" && option.name === "Media" ? "selected" : "";
        return `<option value="${escapeHtml(option.name)}" ${selected}>${escapeHtml(option.name)}</option>`;
      })
      .join("");
    return `<label class="jira-field">${label}<select ${common}>${options}</select></label>`;
  }

  if (field.type === "user") {
    const users = jiraDefaults.supportUsers || [];
    if (users.length && (field.id === "assignee" || field.id === "reporter")) {
      const options = users
        .map((user) => `<option value="${escapeHtml(user.accountId)}">${escapeHtml(user.name)}</option>`)
        .join("");
      return `<label class="jira-field">${label}<select ${common}>${options}</select></label>`;
    }

    return `<label class="jira-field">${label}<input ${common} type="text" placeholder="Account ID de Jira"></label>`;
  }

  if (field.type === "team") {
    return `<label class="jira-field">${label}<input ${common} type="text" placeholder="Betxico - Servicio al Cliente"></label>`;
  }

  if (field.type === "textarea") {
    return `<label class="jira-field span-2">${label}<textarea ${common} rows="6" maxlength="2000" placeholder="Describe brevemente el problema del cliente, monto, fecha, canal y evidencia disponible."></textarea><span class="description-counter">0 / 2000</span></label>`;
  }

  if (field.type === "date") {
    return `<label class="jira-field">${label}<input ${common} type="date"></label>`;
  }

  if (field.type === "url") {
    return `<label class="jira-field">${label}<input ${common} type="url" placeholder="https://..."></label>`;
  }

  return `<label class="jira-field">${label}<input ${common} type="text" placeholder="${escapeHtml(getPlaceholder(field))}"></label>`;
}

function orderFields(fields, order) {
  return [...fields].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
}

function renderFieldGroup(title, icon, fields, description = "") {
  if (!fields.length) return "";
  return `
    <section class="form-card" aria-label="${escapeHtml(title)}">
      <div class="section-heading">
        <span class="section-icon" aria-hidden="true">${renderIcon(icon)}</span>
        <div>
          <h2>${escapeHtml(title)}</h2>
          ${description ? `<p>${escapeHtml(description)}</p>` : ""}
        </div>
      </div>
      <div class="section-grid">
        ${fields.map(renderField).join("")}
      </div>
    </section>
  `;
}

function renderIcon(icon) {
  const icons = {
    user: '<svg viewBox="0 0 24 24"><path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z"></path><path d="M5 21a7 7 0 0 1 14 0"></path></svg>',
    message: '<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-8 8H7l-4 3v-6a8 8 0 1 1 18-5Z"></path></svg>',
    file: '<svg viewBox="0 0 24 24"><path d="M8 4h6l4 4v12H8V4Z"></path><path d="M14 4v5h5"></path></svg>'
  };
  return icons[icon] || icons.file;
}

function getDisplayName(field) {
  if (getSelectedWorkflow().id === "cierre-sesiones-jira") {
    const sessionCloseNames = {
      customfield_10071: "Correo",
      customfield_10072: "External UID",
      customfield_10073: "Nombre del cliente"
    };
    if (sessionCloseNames[field.id]) return sessionCloseNames[field.id];
  }

  const names = {
    customfield_10070: "KYC URL",
    customfield_10071: "Email del cliente",
    customfield_10072: "AUTH ID",
    customfield_10073: "Nombre y apellido del cliente",
    labels: "Etiquetas",
    priority: "Prioridad",
    summary: "Resumen",
    description: "Descripción"
  };
  return names[field.id] || field.name;
}

function getPlaceholder(field) {
  const placeholders = {
    customfield_10071: "correo@ejemplo.com",
    customfield_10072: "ID de autenticación del cliente",
    customfield_10073: "Nombre completo del cliente",
    labels: "Agrega una o más etiquetas"
  };
  return placeholders[field.id] || "";
}

function collectJiraFieldValues() {
  return jiraFields.reduce((acc, field) => {
    if (!field.supported) return acc;
    const input = elements.form.querySelector(`[data-field-id="${cssEscape(field.id)}"]`);
    if (!input) return acc;

    acc[field.id] = {
      name: field.name,
      value: input.value.trim(),
      schema: field.schema
    };
    return acc;
  }, {});
}

function getFieldValue(fieldId) {
  const input = elements.form.querySelector(`[data-field-id="${cssEscape(fieldId)}"]`);
  return input ? input.value.trim() : "";
}

function applyAutofill(options = {}) {
  if (!jiraFields.length) return;
  const force = Boolean(options.force);

  const autofill = {
    summary: buildDefaultSummary(),
    description: "",
    labels: getDefaultLabels(),
    priority: "Media",
    customfield_10070: buildAmplifyUrl(),
    customfield_10071: elements.customerEmail.value.trim(),
    customfield_10072: elements.authId.value.trim(),
    customfield_10073: elements.customerName.value.trim(),
    assignee: getFieldDefault("assigneeAccountId"),
    reporter: getFieldDefault("reporterAccountId"),
    customfield_10001: getFieldDefault("teamId")
  };

  for (const [fieldId, value] of Object.entries(autofill)) {
    const input = elements.form.querySelector(`[data-field-id="${cssEscape(fieldId)}"]`);
    if (input && (force || !input.value.trim())) {
      input.value = value;
    }
  }
  updateDescriptionCounters();
}

function buildProfileKey(profile) {
  return [
    profile?.chat?.chat_id,
    profile?.chat?.id,
    profile?.id,
    profile?.email,
    profile?.name
  ].filter(Boolean).join("|");
}

function clearCustomerScopedFields() {
  currentCaseView = null;
  currentCaseAction = null;
  if (elements.caseActionText) elements.caseActionText.value = "";
  if (elements.caseActionTarget) elements.caseActionTarget.value = "";
  renderCaseAgentPanel();
  elements.authId.value = "";
  [elements.slackCustomerId, elements.slackCustomerEmail, elements.slackGame, elements.slackTrackingKey, elements.slackAmount, elements.slackDetail]
    .filter(Boolean)
    .forEach((input) => {
      input.value = "";
    });

  ["customfield_10070", "customfield_10071", "customfield_10072", "customfield_10073", "description"].forEach((fieldId) => {
    const input = elements.form.querySelector(`[data-field-id="${cssEscape(fieldId)}"]`);
    if (input) input.value = "";
  });
}

function handleClearForm() {
  elements.form.querySelectorAll("[data-field-id]").forEach((input) => {
    if (["priority"].includes(input.dataset.fieldId)) {
      input.value = "Media";
      return;
    }
    input.value = "";
  });
  [elements.slackAgentName, elements.slackCustomerId, elements.slackCustomerEmail, elements.slackGame, elements.slackTrackingKey, elements.slackAmount, elements.slackDetail]
    .filter(Boolean)
    .forEach((input) => {
      input.value = "";
    });
  attachments = [];
  renderAttachments();
  applyAutofill({ force: true });
  applySlackAutofill({ force: true });
  renderDestinationMode();
  hideResult();
}

function getFieldDefault(key) {
  return jiraDefaults?.[key] || "";
}

function buildDefaultSummary() {
  const authId = elements.authId.value.trim();
  if (getSelectedWorkflow().id === "cierre-sesiones-jira") {
    return authId ? `ID ${authId} __ CIERRE DE SESIONES` : "ID __ CIERRE DE SESIONES";
  }
  return authId ? `ID ${authId}` : "ID";
}

function getDefaultLabels() {
  if (getSelectedWorkflow().id === "cierre-sesiones-jira") {
    return "CIERRE_SESIONES";
  }
  return "";
}

function applyDefaultTicketSearch(options = {}) {
  const value = defaultTicketSearchValue();
  if (!value) return;
  if (options.force || !elements.ticketSearchInput.value.trim()) {
    elements.ticketSearchInput.value = value;
  }
}

function defaultTicketSearchValue() {
  const authId = elements.authId.value.trim();
  if (isUsableAuthId(authId)) return authId;
  return elements.customerEmail.value.trim();
}

function isUsableAuthId(value) {
  const clean = String(value || "").trim();
  return /^\d{4,}$/.test(clean);
}

function buildAmplifyUrl() {
  const chatId = elements.chatId.value.trim();
  return chatId ? `https://my.livechatinc.com/chats/${encodeURIComponent(chatId)}` : "";
}

function readProfileValue(profile, keys) {
  const keySet = new Set(keys.map(normalizeProfileKey));
  return findProfileValue(profile, keySet, new Set());
}

function findProfileValue(value, keySet, visited) {
  if (!value || typeof value !== "object" || visited.has(value)) return "";
  visited.add(value);

  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findProfileValue(item, keySet, visited);
      if (found) return found;
    }
    return "";
  }

  const entries = Object.entries(value);
  for (const [key, item] of entries) {
    if (keySet.has(normalizeProfileKey(key)) && isScalarProfileValue(item)) {
      return String(item).trim();
    }

    if (item && typeof item === "object") {
      const name = item.name || item.key || item.label || item.id;
      const itemValue = item.value || item.text || item.content;
      if (name && keySet.has(normalizeProfileKey(name)) && isScalarProfileValue(itemValue)) {
        return String(itemValue).trim();
      }
    }
  }

  for (const [, item] of entries) {
    const found = findProfileValue(item, keySet, visited);
    if (found) return found;
  }
  return "";
}

function isScalarProfileValue(value) {
  return ["string", "number", "boolean"].includes(typeof value) && String(value).trim();
}

function normalizeProfileKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) {
    throw new Error(data.error || `http_${response.status}`);
  }
  return data;
}

async function fetchJsonWithTimeout(url, options = {}) {
  const { timeoutMs = 4500, signal: upstreamSignal, ...fetchOptions } = options;
  const controller = new AbortController();
  const abortFromUpstream = () => controller.abort();
  const timer = window.setTimeout(() => controller.abort(), Math.max(250, Number(timeoutMs) || 4500));

  if (upstreamSignal?.aborted) controller.abort();
  else upstreamSignal?.addEventListener?.("abort", abortFromUpstream, { once: true });

  try {
    return await fetchJson(url, { ...fetchOptions, signal: controller.signal });
  } catch (error) {
    if (controller.signal.aborted && error?.name === "AbortError") {
      throw new Error("request_timeout");
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
    upstreamSignal?.removeEventListener?.("abort", abortFromUpstream);
  }
}

function handleAttachmentDragOver(event) {
  event.preventDefault();
  elements.attachmentDropzone.classList.add("dragover");
}

function handleAttachmentDragLeave(event) {
  if (event.currentTarget === elements.ticketForm && elements.ticketForm.contains(event.relatedTarget)) {
    return;
  }
  elements.attachmentDropzone.classList.remove("dragover");
}

function handleQuickEvidenceDragOver(event) {
  event.preventDefault();
  event.stopPropagation();
  getQuickEvidenceElement()?.classList.add("dragover");
}

function handleQuickEvidenceDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  getQuickEvidenceElement()?.classList.remove("dragover");
}

async function handleQuickEvidenceDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  getQuickEvidenceElement()?.classList.remove("dragover");
  await addFilesFromTransfer(event.dataTransfer, {
    emptyMessage: "No pude leer ese archivo. Abre la imagen del chat y usa copiar/pegar, o descargala y seleccionala desde tu equipo.",
    successMessage: "Evidencia agregada al reporte automático."
  });
}

function getQuickEvidenceElement() {
  if (elements.quickIneForm && !elements.quickIneForm.hidden) return elements.quickIneEvidence;
  if (elements.quickDepositForm && !elements.quickDepositForm.hidden) return elements.quickDepositEvidence;
  return null;
}

async function handleAttachmentDrop(event) {
  event.preventDefault();
  elements.attachmentDropzone.classList.remove("dragover");
  await addFilesFromTransfer(event.dataTransfer, {
    emptyMessage: "No pude leer el archivo arrastrado. Si viene del chat, abre la imagen y usa copiar/pegar o descargala primero."
  });
}

async function addFilesFromTransfer(dataTransfer, messages = {}) {
  const directFiles = Array.from(dataTransfer?.files || []);
  if (directFiles.length) {
    addFiles(directFiles);
    if (messages.successMessage) showResult(messages.successMessage, "success");
    return;
  }
  showResult(messages.emptyMessage || "No pude leer el archivo arrastrado. Descárgalo o pégalo como imagen desde el portapapeles.", "error");
}

async function handleAttachmentPaste(event) {
  const quickDepositOpen = elements.quickDepositForm && !elements.quickDepositForm.hidden;
  const quickIneOpen = elements.quickIneForm && !elements.quickIneForm.hidden;
  const quickActionOpen = quickDepositOpen || quickIneOpen;
  if (!elements.ticketForm.classList.contains("active") && !quickActionOpen) return;
  const files = filesFromClipboard(event.clipboardData);
  if (!files.length) {
    if (quickActionOpen) {
      showResult("No encontré imagen en el portapapeles. Copia la imagen del chat o usa clic para seleccionarla.", "error");
    }
    return;
  }
  event.preventDefault();
  if (files.length) {
    addFiles(files);
    if (quickActionOpen) {
      showResult("Evidencia agregada al reporte automático.", "success");
    }
  }
}

function filesFromClipboard(clipboardData) {
  const directFiles = Array.from(clipboardData?.files || []);
  if (directFiles.length) return directFiles;

  return Array.from(clipboardData?.items || [])
    .filter((item) => item.kind === "file")
    .map((item, index) => normalizeClipboardFile(item.getAsFile(), index))
    .filter(Boolean);
}

function normalizeClipboardFile(file, index) {
  if (!file) return null;
  const extension = {
    "image/png": "png",
    "image/jpeg": "jpg",
    "image/webp": "webp",
    "application/pdf": "pdf"
  }[file.type] || "bin";
  const name = file.name || `captura-pegada-${Date.now()}-${index + 1}.${extension}`;
  return file.name ? file : new File([file], name, { type: file.type || "application/octet-stream" });
}

function addFiles(fileList) {
  const files = Array.from(fileList || []);
  for (const file of files) {
    if (!file) continue;
    if (attachments.length >= MAX_ATTACHMENT_COUNT) {
      showResult("Puedes adjuntar máximo 6 archivos por ticket.", "error");
      break;
    }
    if (!ALLOWED_ATTACHMENT_TYPES.has(String(file.type || "").toLowerCase())) {
      showResult(`El archivo ${file.name || "seleccionado"} no es JPG, PNG, WEBP o PDF.`, "error");
      continue;
    }
    if (file.size > MAX_ATTACHMENT_BYTES) {
      showResult(`El archivo ${file.name} pesa más de 10 MB. Súbelo directo en Jira.`, "error");
      continue;
    }
    const duplicate = attachments.some((attachment) => (
      attachment.file.name === file.name
      && attachment.file.size === file.size
      && attachment.file.lastModified === file.lastModified
    ));
    if (duplicate) continue;
    const nextTotal = attachments.reduce((total, attachment) => total + Number(attachment.file.size || 0), 0) + file.size;
    if (nextTotal > MAX_TOTAL_ATTACHMENT_BYTES) {
      showResult("Los adjuntos no pueden superar 20 MB en total.", "error");
      break;
    }
    attachments.push({
      id: crypto.randomUUID(),
      file
    });
  }
  elements.attachmentInput.value = "";
  renderAttachments();
}

function wireDescriptionCounters() {
  elements.form.querySelectorAll("textarea[data-field-id]").forEach((textarea) => {
    const counter = textarea.parentElement?.querySelector(".description-counter");
    textarea.addEventListener("input", () => updateDescriptionCounter(textarea, counter));
    updateDescriptionCounter(textarea, counter);
  });
}

function updateDescriptionCounters() {
  elements.form.querySelectorAll("textarea[data-field-id]").forEach((textarea) => {
    updateDescriptionCounter(textarea, textarea.parentElement?.querySelector(".description-counter"));
  });
}

function updateDescriptionCounter(textarea, counter) {
  if (counter) counter.textContent = `${textarea.value.length} / ${textarea.maxLength || 2000}`;
}

function renderAttachments() {
  if (!attachments.length) {
    elements.attachmentList.innerHTML = '<p class="attachment-empty">Sin adjuntos seleccionados.</p>';
    if (elements.quickDepositAttachmentList) {
      elements.quickDepositAttachmentList.innerHTML = '<p class="attachment-empty">Sin evidencia pegada.</p>';
    }
    if (elements.quickIneAttachmentList) {
      elements.quickIneAttachmentList.innerHTML = '<p class="attachment-empty">Sin INE pegada.</p>';
    }
    return;
  }

  const html = attachments.map((attachment) => {
    const file = attachment.file;
    return `
      <article class="attachment-card">
        <div>
          <strong>${escapeHtml(file.name)}</strong>
          <span>${formatBytes(file.size)}</span>
        </div>
        <button type="button" class="remove-attachment" data-attachment-id="${escapeHtml(attachment.id)}">Quitar</button>
      </article>
    `;
  }).join("");

  elements.attachmentList.innerHTML = html;
  if (elements.quickDepositAttachmentList) {
    elements.quickDepositAttachmentList.innerHTML = html;
  }
  if (elements.quickIneAttachmentList) {
    elements.quickIneAttachmentList.innerHTML = html;
  }

  document.querySelectorAll("[data-attachment-id]").forEach((button) => {
    button.addEventListener("click", () => {
      attachments = attachments.filter((attachment) => attachment.id !== button.dataset.attachmentId);
      renderAttachments();
    });
  });
}

async function serializeAttachments() {
  const serialized = [];
  for (const attachment of attachments) {
    const file = attachment.file;
    serialized.push({
      filename: file.name,
      contentType: file.type || "application/octet-stream",
      dataBase64: await fileToBase64(file)
    });
  }
  return serialized;
}

async function serializeIneReceivedAttachments() {
  const prepared = [];
  for (const attachment of attachments) {
    prepared.push(await compactIneAttachmentForTransport(attachment.file));
  }

  const totalBytes = prepared.reduce((total, file) => total + Number(file.size || 0), 0);
  if (prepared.some((file) => file.size > MAX_INE_TRANSPORT_ATTACHMENT_BYTES)
    || totalBytes > MAX_INE_TRANSPORT_TOTAL_BYTES) {
    throw new Error("ine_received_evidence_too_large");
  }

  return Promise.all(prepared.map(async (file) => ({
    filename: file.name,
    contentType: file.type || "application/octet-stream",
    dataBase64: await fileToBase64(file)
  })));
}

async function compactIneAttachmentForTransport(file) {
  const contentType = String(file?.type || "").toLowerCase();
  if (!contentType.startsWith("image/") || typeof createImageBitmap !== "function") return file;

  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const maxSide = 1800;
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) return file;

    let best = null;
    for (const reduction of [1, 0.85, 0.72]) {
      canvas.width = Math.max(1, Math.round(width * reduction));
      canvas.height = Math.max(1, Math.round(height * reduction));
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      for (const quality of [0.9, 0.82, 0.74, 0.66]) {
        const blob = await canvasToBlob(canvas, "image/jpeg", quality);
        if (!blob) continue;
        best = blob;
        if (blob.size <= MAX_INE_TRANSPORT_ATTACHMENT_BYTES) {
          return new File([blob], ineJpegFilename(file.name), { type: "image/jpeg" });
        }
      }
    }
    return best ? new File([best], ineJpegFilename(file.name), { type: "image/jpeg" }) : file;
  } catch {
    return file;
  } finally {
    bitmap?.close?.();
  }
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

function ineJpegFilename(name) {
  const base = String(name || "ine").replace(/\.[^/.]+$/, "").replace(/[^a-z0-9._-]+/gi, "-").slice(0, 100) || "ine";
  return `${base}.jpg`;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || "").split(",")[1] || "");
    reader.onerror = () => reject(reader.error || new Error("file_read_failed"));
    reader.readAsDataURL(file);
  });
}

function formatBytes(value) {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function cssEscape(value) {
  if (window.CSS?.escape) {
    return window.CSS.escape(value);
  }
  return String(value).replace(/"/g, '\\"');
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncateText(value, maxLength) {
  const clean = String(value || "").replace(/\s+/g, " ").trim();
  if (clean.length <= maxLength) return clean;
  return `${clean.slice(0, maxLength - 1).trim()}…`;
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}
