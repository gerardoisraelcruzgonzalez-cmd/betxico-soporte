const elements = {
  connectionState: document.getElementById("connectionState"),
  screenTitle: document.getElementById("screenTitle"),
  screenSubtitle: document.getElementById("screenSubtitle"),
  listPanelTabs: document.getElementById("listPanelTabs"),
  listPanelWidget: document.getElementById("listPanelWidget"),
  customerName: document.getElementById("customerName"),
  customerEmail: document.getElementById("customerEmail"),
  authId: document.getElementById("authId"),
  chatId: document.getElementById("chatId"),
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
  customerContextPanel: document.getElementById("customerContextPanel"),
  customerContextStatus: document.getElementById("customerContextStatus"),
  customerContextContent: document.getElementById("customerContextContent"),
  supportAlertForm: document.getElementById("supportAlertForm"),
  supportAlertMessage: document.getElementById("supportAlertMessage"),
  sendSupportAlertBtn: document.getElementById("sendSupportAlertBtn"),
  refreshCustomerContextBtn: document.getElementById("refreshCustomerContextBtn"),
  traceabilityBtn: document.getElementById("traceabilityBtn"),
  sessionCloseCustomerId: document.getElementById("sessionCloseCustomerId"),
  sessionCloseReason: document.getElementById("sessionCloseReason"),
  closeGameSessionsBtn: document.getElementById("closeGameSessionsBtn"),
  closeGameSessionsStatus: document.getElementById("closeGameSessionsStatus"),
  sessionCloseRequestList: document.getElementById("sessionCloseRequestList"),
  sessionCloseOverlay: document.getElementById("sessionCloseOverlay"),
  sessionCloseBadge: document.getElementById("sessionCloseBadge"),
  sessionCloseTitle: document.getElementById("sessionCloseTitle"),
  sessionCloseSubtitle: document.getElementById("sessionCloseSubtitle"),
  sessionCloseCountLabel: document.getElementById("sessionCloseCountLabel"),
  sessionCloseCount: document.getElementById("sessionCloseCount"),
  sessionCloseRange: document.getElementById("sessionCloseRange"),
  sessionClosePendingCount: document.getElementById("sessionClosePendingCount"),
  sessionClosePendingList: document.getElementById("sessionClosePendingList"),
  sessionCloseGamesList: document.getElementById("sessionCloseGamesList"),
  sessionCloseDate: document.getElementById("sessionCloseDate"),
  sessionCloseModalCloseBtn: document.getElementById("sessionCloseModalCloseBtn"),
  sessionCloseModalOkBtn: document.getElementById("sessionCloseModalOkBtn"),
  sessionCloseConfirmBtn: document.getElementById("sessionCloseConfirmBtn"),
  kycEmailInput: document.getElementById("kycEmailInput"),
  openKycSearchBtn: document.getElementById("openKycSearchBtn"),
  kycCompleteBtn: document.getElementById("kycCompleteBtn"),
  kycIncompleteBtn: document.getElementById("kycIncompleteBtn"),
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
  aiAssistantPanel: document.getElementById("aiAssistantPanel"),
  aiChatForm: document.getElementById("aiChatForm"),
  aiChatInput: document.getElementById("aiChatInput"),
  aiAskBtn: document.getElementById("aiAskBtn"),
  aiCopyBtn: document.getElementById("aiCopyBtn"),
  aiClearBtn: document.getElementById("aiClearBtn"),
  aiSaveGoodBtn: document.getElementById("aiSaveGoodBtn"),
  aiBadBtn: document.getElementById("aiBadBtn"),
  aiChatOutput: document.getElementById("aiChatOutput"),
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
  loginEmail: document.getElementById("loginEmail"),
  loginPin: document.getElementById("loginPin"),
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
  agentAlertAckBtn: document.getElementById("agentAlertAckBtn")
};

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
let lastAiAnswer = "";
let currentSessionClosePreview = null;
let sessionCloseRequests = [];
let sessionCloseRequestPollId = null;
let lastAiQuestion = "";
let lastAiTopic = "general";
let pendingAgentAlerts = [];
let activeAgentAlert = null;
let supportConfigPollId = null;
let lastSupportConfigCheckAt = 0;
let autoWelcomeAttempts = new Set();
let traceabilityReport = null;
let autoSafeTemplateAttempts = new Map();
let customerContextRequestId = 0;
let searchRequestId = 0;

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
  "cierre-sesiones": {
    id: "cierre-sesiones",
    label: "Cierre de sesiones",
    destination: "slack",
    slackRouteId: "cierre-sesiones",
    slackTemplate: "session-close",
    requiredSlackFields: ["game", "customerId", "customerEmail"]
  },
  "cierre-sesiones-jira": {
    id: "cierre-sesiones-jira",
    label: "Cierre de sesiones - Jira",
    destination: "jira",
    jiraIssueType: "Servicio al Cliente",
    slackTemplate: ""
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
  elements.clearSearchBtn.addEventListener("click", handleClearSearch);
  elements.detectReplyBtn?.addEventListener("click", handleDetectReplyFromChat);
  elements.clearReplyBtn?.addEventListener("click", handleClearReply);
  elements.replyInput?.addEventListener("input", renderReplySuggestion);
  elements.replySuggestion?.addEventListener("click", handleReplySuggestionClick);
  elements.quickDepositBtn?.addEventListener("click", handleQuickDepositOpen);
  elements.quickDepositForm?.addEventListener("submit", handleQuickDepositSubmit);
  elements.quickDepositCancelBtn?.addEventListener("click", handleQuickDepositCancel);
  elements.quickDepositTrackingKey?.addEventListener("input", renderQuickDepositPreview);
  elements.quickDepositAmount?.addEventListener("input", renderQuickDepositPreview);
  elements.traceabilityBtn?.addEventListener("click", handleTraceabilityOpen);
  elements.closeGameSessionsBtn?.addEventListener("click", handleCloseGameSessions);
  elements.sessionCloseRequestList?.addEventListener("click", handleSessionCloseRequestListClick);
  elements.sessionCloseModalCloseBtn?.addEventListener("click", closeGameSessionsModal);
  elements.sessionCloseModalOkBtn?.addEventListener("click", closeGameSessionsModal);
  elements.sessionCloseConfirmBtn?.addEventListener("click", handleConfirmCloseGameSessions);
  elements.sessionCloseOverlay?.addEventListener("click", (event) => {
    if (event.target === elements.sessionCloseOverlay) closeGameSessionsModal();
  });
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
  elements.aiChatForm?.addEventListener("submit", handleAiChatSubmit);
  elements.aiCopyBtn?.addEventListener("click", handleAiCopy);
  elements.aiClearBtn?.addEventListener("click", handleAiClear);
  elements.aiSaveGoodBtn?.addEventListener("click", handleAiSaveGood);
  elements.aiBadBtn?.addEventListener("click", handleAiBad);
  elements.sendWelcomeBtn?.addEventListener("click", () => sendLiveChatWelcome({ manual: true }));
  elements.refreshCustomerContextBtn?.addEventListener("click", () => loadCustomerContext({ force: true }));
  elements.supportAlertForm?.addEventListener("submit", handleSendSupportAlert);
  elements.quickDepositEvidence?.addEventListener("click", () => {
    elements.quickDepositEvidence.focus();
    elements.attachmentInput.click();
  });
  elements.quickDepositEvidence?.addEventListener("dragover", handleQuickEvidenceDragOver);
  elements.quickDepositEvidence?.addEventListener("dragleave", handleQuickEvidenceDragLeave);
  elements.quickDepositEvidence?.addEventListener("drop", handleQuickEvidenceDrop);
  elements.quickDepositEvidence?.addEventListener("paste", handleAttachmentPaste);
  elements.quickDepositForm?.addEventListener("paste", handleAttachmentPaste);
  elements.newTicketBtn.addEventListener("click", () => openTicketForm());
  elements.searchResults.addEventListener("click", handleSearchResultAction);
  elements.searchResults.addEventListener("submit", handleTicketCommentSubmit);
  elements.ticketTab.addEventListener("click", () => showView("search"));
  elements.settingsTab.addEventListener("click", () => showView("settings"));
  elements.slackLoginBtn.addEventListener("click", handleSlackLoginStart);
  elements.loginForm.addEventListener("submit", handleLogin);
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
  elements.listPanelTabs.addEventListener("click", handleListPanelClick);
  elements.listPanelWidget.addEventListener("click", handleListPanelWidgetClick);
  elements.listPanelWidget.addEventListener("submit", handleListPanelSearchSubmit);
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
      startSessionCloseRequestPolling();
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
    elements.aiAssistantPanel.hidden = true;
    elements.liveChatAutomationPanel.hidden = true;
    elements.aiChatOutput.hidden = true;
    pendingAgentAlerts = [];
    activeAgentAlert = null;
    renderAgentAlert();
    stopSupportConfigPolling();
    stopSessionCloseRequestPolling();
    showView("settings");
    return;
  }

  document.body.dataset.auth = "authenticated";
  const isAdmin = Boolean(currentAccount.isAdmin);
  elements.loginForm.hidden = true;
  elements.accountForm.hidden = false;
  elements.aiAssistantPanel.hidden = !isAdmin;
  if (!isAdmin) {
    handleAiClear();
  }
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

async function handleLogin(event) {
  event.preventDefault();
  hideResult();

  try {
    const data = await fetchJson("/api/auth-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        email: elements.loginEmail.value.trim(),
        pin: elements.loginPin.value.trim()
      })
    });
    currentAccount = data.account;
    elements.loginPin.value = "";
    renderAccount();
    showView("search");
    showResult("Sesión iniciada.", "success");
    loadSupportConfig();
    loadPublicSupportConfig();
    startSupportConfigPolling();
    startSessionCloseRequestPolling();
  } catch (error) {
    showResult(`No pude iniciar sesión: ${formatError(error.message)}`, "error");
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
  stopSessionCloseRequestPolling();
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
  elements.slackUserStatus.textContent = "Preparando conexión con Slack...";
  try {
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
    elements.slackUserStatus.textContent = data.connected
      ? "Slack personal conectado. Los mensajes al canal se publicarán con tu usuario."
      : "Slack personal no conectado. Si no lo conectas, los mensajes saldrán con el bot.";
  } catch (error) {
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
    if (elements.chatId.value.trim()) {
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

function startSessionCloseRequestPolling() {
  if (sessionCloseRequestPollId || !currentAccount) return;
  loadSessionCloseRequests().catch(() => null);
  sessionCloseRequestPollId = window.setInterval(() => {
    if (currentAccount && !document.hidden) {
      loadSessionCloseRequests().catch(() => null);
    }
  }, 15000);
}

function stopSessionCloseRequestPolling() {
  if (sessionCloseRequestPollId) {
    window.clearInterval(sessionCloseRequestPollId);
    sessionCloseRequestPollId = null;
  }
  sessionCloseRequests = [];
  renderSessionCloseRequests();
}

async function loadSessionCloseRequests() {
  if (!currentAccount) return;
  const data = await fetchJson("/api/support-ticket?action=game-sessions-requests", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status: "all", limit: 12 })
  });
  sessionCloseRequests = Array.isArray(data.requests) ? data.requests : [];
  renderSessionCloseRequests();
}

function renderSessionCloseRequests() {
  if (!elements.sessionCloseRequestList) return;
  const activeOrRecent = sessionCloseRequests
    .filter((request) => request && request.customerId)
    .slice(0, 6);

  elements.sessionCloseRequestList.hidden = activeOrRecent.length === 0;
  if (!activeOrRecent.length) {
    elements.sessionCloseRequestList.innerHTML = "";
    return;
  }

  elements.sessionCloseRequestList.innerHTML = activeOrRecent.map((request) => {
    const status = String(request.status || "pending");
    const result = request.result && typeof request.result === "object" ? request.result : null;
    const closed = Number(result?.cantidadCerradas ?? 0);
    const games = Array.isArray(result?.detalle?.juegos) ? result.detalle.juegos.length : 0;
    const subtitle = status === "completed"
      ? `Completado · ${closed} sesiones · ${games} juegos`
      : status === "processing"
        ? "APP Betxico está cerrando sesiones"
        : status === "pending"
          ? "Pendiente de autorización en APP Betxico"
          : status === "rejected"
            ? "Rechazado desde APP Betxico"
            : (request.lastError || "Error en el proceso");
    return `
      <div class="session-close-request-item" data-status="${escapeHtml(status)}">
        <div>
          <strong>ID ${escapeHtml(request.customerId)}</strong>
          <span>${escapeHtml(subtitle)}</span>
        </div>
        ${status === "completed" && result ? `<button type="button" data-session-close-result="${escapeHtml(request.id)}">Ver</button>` : ""}
      </div>
    `;
  }).join("");
}

function handleSessionCloseRequestListClick(event) {
  const button = event.target.closest("[data-session-close-result]");
  if (!button) return;
  const id = button.getAttribute("data-session-close-result");
  const request = sessionCloseRequests.find((item) => item.id === id);
  if (request?.result) {
    showGameSessionsCloseDetail(request.result, request.customerId, { allowConfirm: false });
  }
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
  activeListPanelId = panelId;
  activeListPanelEmail = "";
  renderListPanelTabs();
  await loadListPanelItems(panelId, "");
}

async function loadListPanelItems(panelId, email) {
  if (!ensureAuthenticated()) return;
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

function renderListPanelLoading(panelId, email = "") {
  const panel = (supportConfig.listPanels || []).find((item) => item.id === panelId) || {};
  elements.listPanelWidget.hidden = false;
  elements.listPanelWidget.innerHTML = `
    <div class="list-panel-heading">
      <div>
        <h2>${escapeHtml(panel.label || "Lista Slack")}</h2>
        <p>${email ? `Buscando ${escapeHtml(email)} en Slack.` : "Cargando los ultimos 8 registros desde Slack."}</p>
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
        ${items.map(renderListPanelCard).join("")}
      </div>
    ` : `
      <div class="list-panel-empty">${email ? "No encontré ese correo en la lista revisada." : "No encontré registros recientes en la lista."}</div>
    `}
  `;
}

function renderListPanelCard(item) {
  const trace = resolveCardTraceability(item);
  const meta = [
    item.reviewTopic,
    item.amount ? `$${item.amount}` : "",
    item.kycCompleto ? `KYC: ${item.kycCompleto}` : ""
  ].filter(Boolean);
  const approvalStatus = formatApprovalStatus(item.approvalStatus);
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
      <p class="list-panel-detail">${escapeHtml(truncateText(item.detail, 180))}</p>
      ${item.jiraUrl ? `<a class="list-panel-link" href="${escapeHtml(item.jiraUrl)}" target="_blank" rel="noreferrer">Abrir Jira</a>` : ""}
    </article>
  `;
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
  if (!normalized) {
    return { label: "SIN ESTATUS", className: "is-rejected" };
  }
  return { label: label.toUpperCase(), className: "is-rejected" };
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

function setReportWorkflows(workflows) {
  if (!Array.isArray(workflows) || !workflows.length) return;
  const previous = elements.ticketDestination.value;
  reportWorkflows = workflows.reduce((acc, workflow) => {
    if (!workflow?.id || workflow.enabled === false) return acc;
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
    showResult("Primero inicia sesión con Slack para usar el centro de tickets.", "error");
  }

  const isTicket = view === "ticket";
  const isSettings = view === "settings";
  const isSearch = view === "search";
  document.body.dataset.view = view;
  elements.ticketTab.classList.toggle("active", !isSearch);
  elements.searchView.classList.toggle("active", isSearch);
  elements.ticketForm.classList.toggle("active", isTicket);
  elements.settingsView.classList.toggle("active", isSettings);
  requestAnimationFrame(() => {
    document.querySelector(".app-shell")?.scrollTo({ top: 0, left: 0 });
    window.scrollTo({ top: 0, left: 0 });
  });

  if (isSearch) {
    setScreenCopy("Centro de tickets", "Busca y gestiona las incidencias de nuestros clientes");
    applyDefaultTicketSearch();
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

function syncSessionCloseCustomerId(options = {}) {
  if (!elements.sessionCloseCustomerId) return;
  const detectedId = elements.authId.value.trim();
  if (options.force || (!elements.sessionCloseCustomerId.value.trim() && isValidCustomerId(detectedId))) {
    elements.sessionCloseCustomerId.value = detectedId;
  }
}

function readSessionCloseCustomerId() {
  return String(elements.sessionCloseCustomerId?.value || elements.authId.value || "").trim();
}

function isValidCustomerId(value) {
  return /^\d{3,20}$/.test(String(value || "").trim());
}

async function handleCloseGameSessions() {
  if (!ensureAuthenticated()) return;
  syncSessionCloseCustomerId();
  const customerId = readSessionCloseCustomerId();
  if (!isValidCustomerId(customerId)) {
    showResult("Escribe un ID numérico válido para cerrar sesiones.", "error");
    renderCloseGameSessionsStatus("ID inválido. Usa solo números.", "error");
    elements.sessionCloseCustomerId?.focus();
    return;
  }

  const previousHtml = elements.closeGameSessionsBtn?.innerHTML || "";
  if (elements.closeGameSessionsBtn) {
    elements.closeGameSessionsBtn.disabled = true;
    elements.closeGameSessionsBtn.textContent = "Enviando...";
  }
  renderCloseGameSessionsStatus(`Enviando solicitud para ${customerId} a APP Betxico...`, "loading");

  try {
    const data = await fetchJson("/api/support-ticket?action=game-sessions-request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customerId,
        reason: elements.sessionCloseReason?.value.trim() || "",
        chatId: elements.chatId.value.trim(),
        customerEmail: elements.customerEmail.value.trim(),
        customerName: elements.customerName.value.trim()
      })
    });

    const status = data.duplicate
      ? `Ya existe una solicitud activa para ${customerId}.`
      : `Solicitud enviada para ${customerId}. APP Betxico la autoriza y cierra.`;
    renderCloseGameSessionsStatus(status, "success");
    showResult(status, "success");
    elements.sessionCloseReason && (elements.sessionCloseReason.value = "");
    await loadSessionCloseRequests();
  } catch (error) {
    const message = formatError(error.message);
    currentSessionClosePreview = null;
    renderCloseGameSessionsStatus(message, "error");
    showResult(`No pude enviar la solicitud: ${message}`, "error");
  } finally {
    if (elements.closeGameSessionsBtn) {
      elements.closeGameSessionsBtn.disabled = false;
      elements.closeGameSessionsBtn.innerHTML = previousHtml;
    }
  }
}

async function handleConfirmCloseGameSessions() {
  if (!ensureAuthenticated()) return;
  const preview = currentSessionClosePreview;
  const customerId = preview?.customerId || readSessionCloseCustomerId();
  if (!isValidCustomerId(customerId) || !canConfirmGameSessionClose(preview?.result || {})) {
    renderCloseGameSessionsStatus("Primero revisa sesiones y confirma que estén dentro del límite seguro.", "error");
    return;
  }

  const previousHtml = elements.sessionCloseConfirmBtn?.innerHTML || "";
  if (elements.sessionCloseConfirmBtn) {
    elements.sessionCloseConfirmBtn.disabled = true;
    elements.sessionCloseConfirmBtn.textContent = "Cerrando...";
  }
  renderCloseGameSessionsStatus(`Cierre confirmado para ${customerId}. Si otro agente ya inició uno, esta solicitud quedará en cola.`, "loading");

  try {
    const data = await fetchJson("/api/support-ticket?action=game-sessions-close", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        customerId,
        dryRun: false,
        chatId: elements.chatId.value.trim(),
        customerEmail: elements.customerEmail.value.trim(),
        customerName: elements.customerName.value.trim()
      })
    });

    const summary = formatGameSessionsCloseSummary(data.result || {});
    currentSessionClosePreview = null;
    renderCloseGameSessionsStatus(summary, "success");
    showResult(summary, "success");
    showGameSessionsCloseDetail(data.result || {}, customerId, { allowConfirm: false });
  } catch (error) {
    const message = formatError(error.message);
    renderCloseGameSessionsStatus(message, "error");
    showResult(`No pude cerrar sesiones: ${message}`, "error");
  } finally {
    if (elements.sessionCloseConfirmBtn) {
      elements.sessionCloseConfirmBtn.disabled = false;
      elements.sessionCloseConfirmBtn.innerHTML = previousHtml;
    }
  }
}

function renderCloseGameSessionsStatus(message, type = "idle") {
  if (!elements.closeGameSessionsStatus) return;
  elements.closeGameSessionsStatus.textContent = message;
  elements.closeGameSessionsStatus.dataset.state = type;
}

function formatGameSessionsCloseSummary(result = {}) {
  const estado = result.estado || "procesado";
  const cerradas = Number.isFinite(Number(result.cantidadCerradas)) ? Number(result.cantidadCerradas) : null;
  const queuePrefix = result.encolado ? "En cola ejecutado: " : "";
  if (estado === "completado") {
    return `${queuePrefix}Sesiones cerradas${cerradas !== null ? `: ${cerradas}` : ""}.`;
  }
  if (estado === "sin_sesion") {
    return `${queuePrefix}No había sesiones abiertas para cerrar.`;
  }
  if (estado === "requiere_revision") {
    return `${queuePrefix}Requiere revisión${cerradas !== null ? `: ${cerradas} cerradas` : ""}. ${result.notas || ""}`.trim();
  }
  if (estado === "limite_excedido") {
    return `${queuePrefix}Bloqueado por límite seguro. ${result.notas || ""}`.trim();
  }
  if (estado === "pendiente" && result.mode === "dry-run") {
    const pendientes = Number(result.detalle?.pendientes ?? 0);
    return pendientes > 0 ? `Revisión lista: cerraría ${pendientes} sesiones. Confirma para ejecutar.` : (result.notas || "Revisión lista.");
  }
  if (estado === "error") {
    return `${queuePrefix}${result.notas || result.resultado || "El cierre terminó con error."}`;
  }
  return `${queuePrefix}${result.notas || result.resultado || `Resultado: ${estado}`}`;
}

function canConfirmGameSessionClose(result = {}) {
  const estado = String(result.estado || "").trim();
  const pendientes = Number(result.detalle?.pendientes ?? 0);
  const limite = Number(result.detalle?.limitePorCierre ?? 25);
  return result.mode === "dry-run" && estado === "pendiente" && pendientes > 0 && pendientes <= limite;
}

function showGameSessionsCloseDetail(result = {}, customerId = "", options = {}) {
  if (!elements.sessionCloseOverlay) return;
  const estado = String(result.estado || "").trim();
  const detalle = result.detalle && typeof result.detalle === "object" ? result.detalle : {};
  const rango = detalle.rango && typeof detalle.rango === "object" ? detalle.rango : {};
  const juegos = Array.isArray(detalle.juegos) ? detalle.juegos.filter(Boolean) : [];
  const pendingWins = Array.isArray(detalle.pendingWins) ? detalle.pendingWins.filter(Boolean) : [];
  const cerradas = Number.isFinite(Number(result.cantidadCerradas)) ? Number(result.cantidadCerradas) : 0;
  const pendientes = Number.isFinite(Number(detalle.pendientes)) ? Number(detalle.pendientes) : 0;
  const isPreview = result.mode === "dry-run";
  const title = estado === "completado"
    ? "Cierre completado"
    : estado === "sin_sesion"
      ? "Sin sesiones pendientes"
      : estado === "requiere_revision"
        ? "Requiere revisión"
        : "Cierre de sesiones";

  if (elements.sessionCloseBadge) {
    elements.sessionCloseBadge.textContent = `ID ${result.id || customerId || "—"} · ${estado || "procesado"}`;
  }
  if (elements.sessionCloseTitle) {
    elements.sessionCloseTitle.textContent = title;
  }
  if (elements.sessionCloseSubtitle) {
    elements.sessionCloseSubtitle.textContent = result.mensajeCola || result.notas || "Resultado del cierre solicitado.";
  }
  if (elements.sessionCloseCount) {
    elements.sessionCloseCount.textContent = String(isPreview ? pendientes : cerradas);
  }
  if (elements.sessionCloseCountLabel) {
    elements.sessionCloseCountLabel.textContent = isPreview ? "Sesiones a cerrar" : "Sesiones cerradas";
  }
  if (elements.sessionCloseRange) {
    const inicio = rango.inicio || "";
    const fin = rango.fin || "";
    elements.sessionCloseRange.textContent = inicio && fin ? `${inicio} a ${fin}` : "—";
  }
  if (elements.sessionClosePendingCount) {
    elements.sessionClosePendingCount.textContent = pendingWins.length > 0 ? String(pendingWins.length) : "Ninguno";
  }
  if (elements.sessionClosePendingList) {
    elements.sessionClosePendingList.className = pendingWins.length > 0 ? "session-close-list" : "session-close-empty";
    elements.sessionClosePendingList.innerHTML = pendingWins.length > 0
      ? pendingWins.map((item) => sessionCloseListItem(`${item.game || "Juego sin código"} · ${item.amount || "0"}`, "⚠")).join("")
      : "Ninguna sesión pendiente reportó Pending Win.";
  }
  if (elements.sessionCloseGamesList) {
    elements.sessionCloseGamesList.innerHTML = juegos.length > 0
      ? juegos.map((game) => sessionCloseListItem(game, "🎮")).join("")
      : `<div class="session-close-empty">No se reportaron juegos pendientes.</div>`;
  }
  if (elements.sessionCloseDate) {
    elements.sessionCloseDate.textContent = result.fechaProceso || new Date().toLocaleString("es-MX");
  }
  if (elements.sessionCloseConfirmBtn) {
    elements.sessionCloseConfirmBtn.hidden = !options.allowConfirm;
    elements.sessionCloseConfirmBtn.disabled = !options.allowConfirm;
  }

  elements.sessionCloseOverlay.hidden = false;
  document.body.classList.add("session-close-modal-open");
}

function sessionCloseListItem(text, icon) {
  return `<div class="session-close-list-item"><span>${escapeHtml(icon)}</span><strong>${escapeHtml(String(text || "—"))}</strong></div>`;
}

function closeGameSessionsModal() {
  if (!elements.sessionCloseOverlay) return;
  elements.sessionCloseOverlay.hidden = true;
  document.body.classList.remove("session-close-modal-open");
  if (elements.sessionCloseConfirmBtn) {
    elements.sessionCloseConfirmBtn.hidden = true;
    elements.sessionCloseConfirmBtn.disabled = true;
  }
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

  syncSessionCloseCustomerId({ force: true });
  syncKycEmailInput({ force: true });
  applyAutofill({ force: true });
  applySlackAutofill({ force: true });
  applyDefaultTicketSearch({ force: true });
  if (elements.replyInput) loadChatMessagesForSuggestion();
  maybeSendLiveChatWelcome();
  scheduleLiveChatSafeTemplateCheck(4500);
  window.setTimeout(() => loadCustomerContext().catch(() => null), 800);
  renderDestinationMode();
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

async function loadCustomerContext({ force = false } = {}) {
  if (!currentAccount || !elements.customerContextPanel) return;
  const email = elements.customerEmail.value.trim().toLowerCase();
  const authId = elements.authId.value.trim();
  const chatId = elements.chatId.value.trim();
  const query = email || authId;
  if (!query && !chatId) {
    elements.customerContextPanel.hidden = true;
    return;
  }

  const requestId = ++customerContextRequestId;
  elements.customerContextPanel.hidden = false;
  elements.customerContextStatus.textContent = "Consultando Jira y conversaciones anteriores...";
  elements.customerContextContent.innerHTML = '<p class="search-state">Cargando contexto operativo...</p>';
  elements.refreshCustomerContextBtn.disabled = true;

  const jiraPromise = query ? fetchJson(`/api/jira-search?query=${encodeURIComponent(query)}`) : Promise.resolve({ tickets: [] });
  const historyPromise = fetchJson("/api/support-ticket?action=livechat-customer-history", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, chatId, limit: force ? 100 : 60 })
    });

  const [jiraResult, historyResult] = await Promise.allSettled([
    jiraPromise,
    historyPromise
  ]);
  if (requestId !== customerContextRequestId) return;

  const jira = jiraResult.status === "fulfilled"
    ? (jiraResult.value.tickets || []).filter(isOpenJiraTicket)
    : [];
  const history = historyResult?.status === "fulfilled" ? historyResult.value.history || [] : [];
  // Si el registro coincide por cliente, debe mostrarse aunque la fila de Slack
  // venga clasificada como "OTROS" o no incluya literalmente la palabra retiro.
  const withdrawalItems = [];
  const devwalletItems = jira.filter((ticket) => ticket.devwallet);
  const errors = [jiraResult, historyResult].filter((result) => result.status === "rejected").length;

  elements.customerContextStatus.textContent = [
    `${jira.length} Jira`,
    `${devwalletItems.length} DevWallet`,
    `${withdrawalItems.length} reportes Slack`,
    `${history.length} conversaciones previas`,
    errors ? `${errors} consultas con error` : ""
  ].filter(Boolean).join(" · ");
  elements.customerContextContent.innerHTML = renderCustomerContext({ jira, devwalletItems, withdrawalItems, history });
  elements.refreshCustomerContextBtn.disabled = false;
  loadCustomerContextSlack({ requestId, query, jira, devwalletItems, history, errors }).catch(() => null);
}

async function loadCustomerContextSlack({ requestId, query, jira, devwalletItems, history, errors = 0 }) {
  if (!query || requestId !== customerContextRequestId) return;
  const panels = Array.isArray(supportConfig.listPanels) ? supportConfig.listPanels.filter((panel) => panel?.id) : [];
  if (!panels.length) return;
  elements.customerContextStatus.textContent = [
    `${jira.length} Jira`,
    `${devwalletItems.length} DevWallet`,
    "Slack cargando",
    `${history.length} conversaciones previas`,
    errors ? `${errors} consultas con error` : ""
  ].filter(Boolean).join(" · ");
  const withdrawalItems = await fetchSlackPanelsForSearch(panels, query, { timeoutMs: 15000 });
  if (requestId !== customerContextRequestId) return;
  elements.customerContextStatus.textContent = [
    `${jira.length} Jira`,
    `${devwalletItems.length} DevWallet`,
    `${withdrawalItems.reduce((total, panel) => total + (panel.items?.length || 0), 0)} reportes Slack`,
    `${history.length} conversaciones previas`,
    errors ? `${errors} consultas con error` : ""
  ].filter(Boolean).join(" · ");
  elements.customerContextContent.innerHTML = renderCustomerContext({
    jira,
    devwalletItems,
    withdrawalItems: withdrawalItems.flatMap((panel) =>
      (panel.items || []).map((item) => ({ ...item, panelLabel: panel.panel?.label || "Slack" }))
    ),
    history
  });
}

function renderCustomerContext({ jira = [], devwalletItems = [], withdrawalItems = [], history = [] } = {}) {
  return `
    <div class="customer-context-grid">
      <section>
        <div class="customer-context-heading"><strong>Devolución Wallet</strong><span>${devwalletItems.length}</span></div>
        ${devwalletItems.length ? devwalletItems.slice(0, 4).map((ticket) => {
          const devwallet = ticket.devwallet || {};
          return `
          <a class="customer-context-item is-devwallet" href="${escapeHtml(ticket.url || "#")}" target="_blank" rel="noreferrer">
            <b class="${escapeHtml(getDevWalletClass(devwallet.intent))}">${escapeHtml(devwallet.label || "Pendiente de clasificar")} · ${escapeHtml(ticket.key || "Ticket")}</b>
            <span>${escapeHtml(truncateText(devwallet.description || ticket.summary || "Ticket de Devolución Wallet encontrado.", 150))}</span>
            <span>${escapeHtml([ticket.status, `${ticket.commentsTotal || 0} comentarios`, devwallet.confidence ? `confianza ${devwallet.confidence}` : ""].filter(Boolean).join(" · "))}</span>
          </a>
        `;
        }).join("") : '<p class="customer-context-empty">Sin Devolución Wallet clasificada.</p>'}
      </section>
      <section>
        <div class="customer-context-heading"><strong>Jira</strong><span>${jira.length}</span></div>
        ${jira.length ? jira.slice(0, 4).map((ticket) => `
          <a class="customer-context-item" href="${escapeHtml(ticket.url || "#")}" target="_blank" rel="noreferrer">
            <b>${escapeHtml(ticket.key || "Ticket")} · ${escapeHtml(ticket.status || "Sin estado")}</b>
            <span>${escapeHtml(truncateText(ticket.summary || ticket.description || "Sin resumen", 130))}</span>
          </a>
        `).join("") : '<p class="customer-context-empty">Sin tickets encontrados.</p>'}
      </section>
      <section>
        <div class="customer-context-heading"><strong>Reportes en Slack</strong><span>${withdrawalItems.length}</span></div>
        ${withdrawalItems.length ? withdrawalItems.map((item) => {
          const approval = formatContextSlackApproval(item.approvalStatus);
          return `
          <article class="customer-context-item">
            <b class="${approval.className}">${escapeHtml(approval.label)} · ${escapeHtml(item.amount ? `$${item.amount}` : item.panelLabel || "Slack")}</b>
            <span>${escapeHtml(truncateText([item.reviewTopic, item.detail].filter(Boolean).join(" · ") || "Reporte Slack encontrado.", 160))}</span>
          </article>
        `;
        }).join("") : '<p class="customer-context-empty">Sin reportes Slack encontrados.</p>'}
      </section>
      <section>
        <div class="customer-context-heading"><strong>Conversaciones anteriores</strong><span>${history.length}</span></div>
        ${history.length ? history.slice(0, 3).map((chat) => `
          <a class="customer-context-item" href="https://my.livechatinc.com/chats/${encodeURIComponent(chat.chatId || "")}" target="_blank" rel="noreferrer">
            <b>${escapeHtml(chat.dateLabel || "Conversacion previa")}</b>
            <span>${escapeHtml(truncateText(chat.summary || "Sin mensajes útiles.", 180))}</span>
          </a>
        `).join("") : '<p class="customer-context-empty">Sin conversaciones previas localizadas.</p>'}
      </section>
    </div>
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
  return { label: value ? String(value).toUpperCase() : "SIN ESTATUS", className: "is-rejected" };
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
  hideResult();
  if (!query) {
    renderSearchResults([], "Escribe un dato para buscar tickets.");
    return;
  }

  elements.searchTicketBtn.disabled = true;
  elements.searchTicketBtn.innerHTML = "BUSCANDO...";
  elements.searchResults.innerHTML = '<p class="search-state">Buscando en Jira...</p>';
  const requestId = ++searchRequestId;

  try {
    const jiraResult = await Promise.resolve(fetchJson(`/api/jira-search?query=${encodeURIComponent(query)}`))
      .then((value) => ({ status: "fulfilled", value }))
      .catch((reason) => ({ status: "rejected", reason }));
    const panels = Array.isArray(supportConfig.listPanels) ? supportConfig.listPanels.filter((panel) => panel?.id) : [];
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
    elements.searchTicketBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.8 18.6a7.8 7.8 0 1 1 0-15.6 7.8 7.8 0 0 1 0 15.6Z"></path><path d="m16.5 16.5 4.5 4.5"></path></svg>BUSCAR TICKET';
  }
}

async function fetchSlackPanelsForSearch(panels, query, { timeoutMs = 4500 } = {}) {
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

function updateQuickActionLayout() {
  const quickDepositOpen = Boolean(elements.quickDepositForm && !elements.quickDepositForm.hidden);
  elements.searchView?.classList.toggle("quick-action-expanded", quickDepositOpen);
}

function handleTraceabilityOpen() {
  if (!ensureAuthenticated()) return;
  if (elements.quickDepositForm) elements.quickDepositForm.hidden = true;
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

async function handleAiChatSubmit(event) {
  event.preventDefault();
  if (!ensureAuthenticated()) return;

  const message = elements.aiChatInput.value.trim();
  if (!message) {
    renderAiOutput("Escribe la consulta que quieres resolver.", "empty");
    return;
  }

  elements.aiAskBtn.disabled = true;
  elements.aiAskBtn.textContent = "Consultando...";
  elements.aiCopyBtn.disabled = true;
  elements.aiSaveGoodBtn.disabled = true;
  elements.aiBadBtn.disabled = true;
  renderAiOutput("Consultando asistente...", "loading");

  try {
    const data = await fetchJson("/api/support-ticket?action=ai-chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        message,
        context: buildAiContext(message)
      })
    });
    lastAiAnswer = data.answer || "";
    lastAiQuestion = message;
    lastAiTopic = data.topic || inferLocalAiTopic(message);
    renderAiStructuredOutput(data.classification, lastAiAnswer || "No recibi una respuesta util.");
    elements.aiCopyBtn.disabled = !lastAiAnswer;
    elements.aiSaveGoodBtn.disabled = !lastAiAnswer;
    elements.aiBadBtn.disabled = !lastAiAnswer;
  } catch (error) {
    lastAiAnswer = "";
    renderAiOutput(`No pude consultar GPT: ${formatError(error.message)}`, "error");
  } finally {
    elements.aiAskBtn.disabled = false;
    elements.aiAskBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 2 11 13"></path><path d="m22 2-7 20-4-9-9-4 20-7Z"></path></svg>CONSULTAR';
  }
}

async function handleAiCopy() {
  if (!lastAiAnswer) return;
  try {
    await navigator.clipboard.writeText(lastAiAnswer);
    elements.aiCopyBtn.textContent = "COPIADO";
    setTimeout(() => {
      elements.aiCopyBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 8h11v11H8z"></path><path d="M5 16H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v1"></path></svg>COPIAR';
    }, 1200);
  } catch {
    elements.aiChatInput.value = lastAiAnswer;
    elements.aiChatInput.select();
  }
}

function handleAiClear() {
  lastAiAnswer = "";
  lastAiQuestion = "";
  lastAiTopic = "general";
  elements.aiChatInput.value = "";
  elements.aiCopyBtn.disabled = true;
  elements.aiSaveGoodBtn.disabled = true;
  elements.aiBadBtn.disabled = true;
  elements.aiChatOutput.hidden = true;
  elements.aiChatOutput.textContent = "";
  elements.aiChatOutput.className = "ai-chat-output";
}

function renderAiOutput(message, type = "answer") {
  elements.aiChatOutput.hidden = false;
  elements.aiChatOutput.className = `ai-chat-output ${type}`;
  elements.aiChatOutput.textContent = message;
}

function renderAiStructuredOutput(classification, fallbackAnswer) {
  if (!classification || typeof classification !== "object") {
    renderAiOutput(fallbackAnswer, "answer");
    return;
  }

  const missingData = Array.isArray(classification.missingData) && classification.missingData.length
    ? classification.missingData.map((item) => `- ${item}`).join("\n")
    : "Sin datos faltantes criticos detectados.";
  const autoLabel = classification.canAutoRespond
    ? "Puede usarse como respuesta automatica simple si el contexto coincide."
    : "Sugerencia para agente: revisar antes de enviar.";
  const sourceLabel = classification.source === "template-fallback"
    ? "Plantilla operativa sin GPT: no consume tokens."
    : autoLabel;

  renderAiOutput([
    "Diagnostico probable",
    `${classification.selectedIntent || "general"}${classification.subdiagnostic ? ` / ${classification.subdiagnostic}` : ""}`,
    "",
    "Datos faltantes",
    missingData,
    "",
    "Riesgo",
    classification.riskLevel || "medium",
    "",
    "Modo de uso",
    sourceLabel,
    "",
    "Respuesta sugerida",
    classification.response || fallbackAnswer
  ].join("\n"), "answer");
}

async function handleAiSaveGood() {
  if (!lastAiAnswer || !lastAiQuestion) return;
  elements.aiSaveGoodBtn.disabled = true;
  try {
    await fetchJson("/api/support-ticket?action=ai-save-example", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        topic: lastAiTopic,
        question: lastAiQuestion,
        answer: lastAiAnswer,
        notes: "Guardada desde el widget por el agente."
      })
    });
    elements.aiSaveGoodBtn.textContent = "GUARDADA";
    setTimeout(() => {
      elements.aiSaveGoodBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m20 6-11 11-5-5"></path></svg>BUENA';
      elements.aiSaveGoodBtn.disabled = false;
    }, 1400);
  } catch (error) {
    renderAiOutput(`No pude guardar ejemplo: ${formatError(error.message)}`, "error");
    elements.aiSaveGoodBtn.disabled = false;
  }
}

async function handleAiBad() {
  if (!lastAiAnswer || !lastAiQuestion) return;
  const correction = window.prompt("Escribe como debio responder GPT para mejorar el entrenamiento:");
  if (!correction?.trim()) return;
  elements.aiBadBtn.disabled = true;
  try {
    await fetchJson("/api/support-ticket?action=ai-feedback", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        topic: lastAiTopic,
        question: lastAiQuestion,
        answer: lastAiAnswer,
        correction: correction.trim()
      })
    });
    elements.aiBadBtn.textContent = "REGISTRADA";
    setTimeout(() => {
      elements.aiBadBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 9v4"></path><path d="M12 17h.01"></path><path d="m10.3 3.9-8.1 14A2 2 0 0 0 3.9 21h16.2a2 2 0 0 0 1.7-3.1l-8.1-14a2 2 0 0 0-3.4 0Z"></path></svg>INCORRECTA';
      elements.aiBadBtn.disabled = false;
    }, 1400);
  } catch (error) {
    renderAiOutput(`No pude guardar correccion: ${formatError(error.message)}`, "error");
    elements.aiBadBtn.disabled = false;
  }
}

function buildAiContext(message = "") {
  const workflow = reportWorkflows[elements.ticketDestination.value] || {};
  const selectedIssueType = issueTypes.find((item) => item.id === elements.issueType.value || item.name === elements.issueType.value);
  const relatedQuickReplies = findQuickReplies(`${message}\n${elements.ticketSearchInput.value}\n${elements.replyInput?.value || ""}`).slice(0, 3);
  return JSON.stringify({
    agent: {
      name: currentAccount?.displayName || "",
      email: currentAccount?.email || ""
    },
    customer: {
      name: elements.customerName.value.trim(),
      email: elements.customerEmail.value.trim(),
      authId: elements.authId.value.trim(),
      chatId: elements.chatId.value.trim()
    },
    ticketDraft: {
      workflowId: workflow.id || elements.ticketDestination.value,
      workflow: workflow.label || elements.ticketDestination.value,
      destination: workflow.destination || "",
      issueType: selectedIssueType?.name || elements.issueType.value || "",
      summary: getFieldValue("summary"),
      description: getFieldValue("description"),
      priority: getFieldValue("priority")
    },
    slackDraft: {
      agentName: elements.slackAgentName.value.trim(),
      customerId: elements.slackCustomerId.value.trim(),
      customerEmail: elements.slackCustomerEmail.value.trim(),
      game: elements.slackGame.value.trim(),
      trackingKey: elements.slackTrackingKey.value.trim(),
      amount: elements.slackAmount.value.trim(),
      detail: elements.slackDetail.value.trim()
    },
    currentSearch: {
      query: elements.ticketSearchInput.value.trim(),
      jiraResults: searchTickets.slice(0, 5).map((ticket) => ({
        key: ticket.key,
        summary: ticket.summary,
        status: ticket.status,
        url: ticket.url
      })),
      slackPanels: searchSlackPanels.slice(0, 3).map((panelResult) => ({
        label: panelResult.panel?.label || "",
        count: panelResult.items?.length || 0
      }))
    },
    liveChatMessage: elements.replyInput?.value?.trim() || "",
    relatedQuickReplies: relatedQuickReplies.map((reply) => ({
      id: reply.id,
      title: reply.title,
      response: personalizeReply(reply.response)
    }))
  }, null, 2);
}

function inferLocalAiTopic(text) {
  const clean = normalizeText(text);
  if (/(deposito|spei|cep|clave de rastreo|transferencia)/.test(clean)) return "depositos";
  if (/(retiro|retirar|rechazo|banco|liquidacion)/.test(clean)) return "retiros";
  if (/(kyc|ine|documento|selfie|verificacion)/.test(clean)) return "kyc";
  if (/(bono|promocion|rollover)/.test(clean)) return "bonos";
  if (/(juego|casino|tirada|ganancia)/.test(clean)) return "juegos";
  if (/(cierre|sesion|autoexclusion|cerrar cuenta)/.test(clean)) return "cierres";
  if (/(escalar|escalacion|jira|proveedor)/.test(clean)) return "escalacion";
  return "general";
}

function renderQuickDepositPreview() {
  if (!elements.quickDepositPreview) return;
  const values = getQuickDepositValues();
  elements.quickDepositPreview.innerHTML = `
    <strong>Mensaje a #depositos_exce</strong>
    <pre>${escapeHtml(buildDepositSlackMessage(values))}</pre>
  `;
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
  const slackTotal = slackPanels.reduce((total, panelResult) => total + (panelResult.items?.length || 0), 0);
  const hasPanels = slackPanels.length > 0;
  const hasResults = tickets.length || slackTotal;

  if (!hasResults && !errors.length) {
    elements.searchResults.innerHTML = `
      <p class="search-state">No encontré coincidencias en Jira ni en las listas de Slack.</p>
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
          ${items.map(renderListPanelCard).join("")}
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
        <button type="submit">AGREGAR COMENTARIO</button>
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

async function handleTicketCommentSubmit(event) {
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
    if (status) status.textContent = "Escribe el comentario antes de enviarlo.";
    textarea?.focus();
    return;
  }

  submitButton.disabled = true;
  if (status) status.textContent = "Agregando comentario...";

  try {
    const data = await fetchJson("/api/jira-search", {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        issueKey: ticket.key,
        body
      })
    });

    const comment = data.comment || {
      author: currentAccount?.displayName || currentAccount?.email || "Agente",
      created: new Date().toISOString(),
      body
    };
    const comments = Array.isArray(ticket.comments) ? ticket.comments : [];
    ticket.comments = [comment, ...comments].slice(0, 3);
    ticket.commentsTotal = Number(ticket.commentsTotal || comments.length) + 1;
    renderSearchResults(searchTickets);
  } catch (error) {
    if (status) status.textContent = `No pude comentar: ${formatError(error.message)}`;
    submitButton.disabled = false;
  }
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
    missing_openai_api_key: "falta OPENAI_API_KEY en Vercel para activar el asistente GPT.",
    openai_rate_limited: "OpenAI llego al limite temporal de tokens de la cuenta. Intenta mas tarde o usa una plantilla mientras se libera el limite.",
    openai_quota_exceeded: "OpenAI indica que la cuenta no tiene cuota disponible o falta billing activo. Revisa plan, saldo o metodo de pago de OpenAI.",
    openai_request_failed: "OpenAI rechazo la consulta. Revisa el modelo, la llave o los limites de la cuenta.",
    missing_message: "escribe una consulta para el asistente GPT.",
    invalid_login: "correo o PIN incorrecto.",
    login_required: "primero inicia sesión con Slack para usar la app.",
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
    session_close_request_already_finished: "esa solicitud ya fue atendida en APP Betxico."
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
  elements.quickDepositEvidence.classList.add("dragover");
}

function handleQuickEvidenceDragLeave(event) {
  event.preventDefault();
  event.stopPropagation();
  elements.quickDepositEvidence.classList.remove("dragover");
}

async function handleQuickEvidenceDrop(event) {
  event.preventDefault();
  event.stopPropagation();
  elements.quickDepositEvidence.classList.remove("dragover");
  await addFilesFromTransfer(event.dataTransfer, {
    emptyMessage: "No pude leer ese archivo. Abre la imagen del chat y usa copiar/pegar, o descargala y seleccionala desde tu equipo.",
    successMessage: "Evidencia agregada al reporte automático."
  });
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

  const urls = urlsFromDropData(dataTransfer);
  if (!urls.length) {
    showResult(messages.emptyMessage || "No pude leer el archivo arrastrado.", "error");
    return;
  }

  try {
    const files = await filesFromDroppedUrls(urls);
    if (!files.length) {
      throw new Error("empty_drop_urls");
    }
    addFiles(files);
    if (messages.successMessage) showResult(messages.successMessage, "success");
  } catch {
    showResult("LiveChat no entrego el archivo como adjunto descargable. Abre la imagen del chat y pegala con Cmd/Ctrl+V, o descargala y arrastrala desde tu equipo.", "error");
  }
}

async function handleAttachmentPaste(event) {
  const quickDepositOpen = elements.quickDepositForm && !elements.quickDepositForm.hidden;
  if (!elements.ticketForm.classList.contains("active") && !quickDepositOpen) return;
  const files = filesFromClipboard(event.clipboardData);
  const urls = urlsFromClipboard(event.clipboardData);
  if (!files.length && !urls.length) {
    if (quickDepositOpen) {
      showResult("No encontré imagen en el portapapeles. Copia la imagen del chat o usa clic para seleccionarla.", "error");
    }
    return;
  }
  event.preventDefault();
  if (files.length) {
    addFiles(files);
    if (quickDepositOpen) {
      showResult("Evidencia agregada al reporte automático.", "success");
    }
    return;
  }

  try {
    const urlFiles = await filesFromDroppedUrls(urls);
    if (!urlFiles.length) throw new Error("empty_clipboard_urls");
    addFiles(urlFiles);
    if (quickDepositOpen) {
      showResult("Evidencia agregada al reporte automático.", "success");
    }
  } catch {
    showResult("No pude convertir la imagen copiada desde LiveChat. Descargala o haz clic en el recuadro para seleccionarla.", "error");
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

function urlsFromClipboard(clipboardData) {
  return [
    ...urlsFromHtml(clipboardData?.getData("text/html")),
    ...String(clipboardData?.getData("text/uri-list") || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^https?:\/\//i.test(line)),
    ...String(clipboardData?.getData("text/plain") || "")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => /^https?:\/\//i.test(line))
  ];
}

function normalizeClipboardFile(file, index) {
  if (!file) return null;
  const extension = file.type === "image/png" ? "png" : file.type === "image/jpeg" ? "jpg" : "bin";
  const name = file.name || `captura-pegada-${Date.now()}-${index + 1}.${extension}`;
  return file.name ? file : new File([file], name, { type: file.type || "application/octet-stream" });
}

function urlsFromDropData(dataTransfer) {
  const values = [
    dataTransfer?.getData("text/uri-list"),
    dataTransfer?.getData("text/plain"),
    ...urlsFromHtml(dataTransfer?.getData("text/html"))
  ].filter(Boolean);

  return [...new Set(values.flatMap((value) => String(value)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^https?:\/\//i.test(line))))];
}

function urlsFromHtml(html) {
  if (!html) return [];
  const documentFragment = new DOMParser().parseFromString(html, "text/html");
  return [
    ...Array.from(documentFragment.querySelectorAll("img[src]")).map((node) => node.src),
    ...Array.from(documentFragment.querySelectorAll("a[href]")).map((node) => node.href)
  ];
}

async function filesFromDroppedUrls(urls) {
  const files = [];
  for (const [index, url] of urls.entries()) {
    const response = await fetch(url, { credentials: "include" });
    if (!response.ok) continue;
    const blob = await response.blob();
    if (!blob.size) continue;
    files.push(new File([blob], filenameFromUrl(url, blob.type, index), {
      type: blob.type || "application/octet-stream"
    }));
  }
  return files;
}

function filenameFromUrl(url, contentType, index) {
  const pathname = new URL(url).pathname;
  const rawName = decodeURIComponent(pathname.split("/").filter(Boolean).pop() || "");
  if (rawName && /\.[a-z0-9]{2,8}$/i.test(rawName)) {
    return rawName;
  }
  return `archivo-livechat-${Date.now()}-${index + 1}.${extensionForContentType(contentType)}`;
}

function extensionForContentType(contentType = "") {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("jpeg") || contentType.includes("jpg")) return "jpg";
  if (contentType.includes("pdf")) return "pdf";
  if (contentType.includes("webp")) return "webp";
  return "bin";
}

function addFiles(fileList) {
  const files = Array.from(fileList || []);
  for (const file of files) {
    if (!file) continue;
    if (attachments.length >= 6) {
      showResult("Puedes adjuntar máximo 6 archivos por ticket.", "error");
      break;
    }
    if (file.size > 10 * 1024 * 1024) {
      showResult(`El archivo ${file.name} pesa más de 10 MB. Súbelo directo en Jira.`, "error");
      continue;
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
