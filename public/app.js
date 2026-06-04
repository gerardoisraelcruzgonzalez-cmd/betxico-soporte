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
let supportConfig = { slackRoutes: [], listPanels: [], liveChatAutomation: null };
let activeProfileKey = "";
let currentReplyMatches = [];
let activeListPanelId = "";
let activeListPanelEmail = "";
let lastAiAnswer = "";
let lastAiQuestion = "";
let lastAiTopic = "general";
let pendingAgentAlerts = [];
let activeAgentAlert = null;
let supportConfigPollId = null;
let lastSupportConfigCheckAt = 0;
let autoWelcomeAttempts = new Set();

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
  elements.aiChatForm?.addEventListener("submit", handleAiChatSubmit);
  elements.aiCopyBtn?.addEventListener("click", handleAiCopy);
  elements.aiClearBtn?.addEventListener("click", handleAiClear);
  elements.aiSaveGoodBtn?.addEventListener("click", handleAiSaveGood);
  elements.aiBadBtn?.addEventListener("click", handleAiBad);
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
      liveChatAutomation: data.config?.liveChatAutomation || supportConfig.liveChatAutomation || null
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
      liveChatAutomation: data.liveChatAutomation || null
    };
    setReportWorkflows(data.reportWorkflows || []);
    pendingAgentAlerts = Array.isArray(data.activeAlerts) ? data.activeAlerts : [];
    renderAgentAlert();
    renderLiveChatAutomationPanel();
    renderListPanelTabs();
    renderDestinationMode();
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
      </dl>
      ${kycSummary.length ? `<p class="list-panel-meta">${escapeHtml(kycSummary.join(" · "))}</p>` : ""}
      <p class="list-panel-detail">${escapeHtml(truncateText(item.detail, 180))}</p>
      ${item.jiraUrl ? `<a class="list-panel-link" href="${escapeHtml(item.jiraUrl)}" target="_blank" rel="noreferrer">Abrir Jira</a>` : ""}
    </article>
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

  applyAutofill({ force: true });
  applySlackAutofill({ force: true });
  applyDefaultTicketSearch({ force: true });
  if (elements.replyInput) loadChatMessagesForSuggestion();
  maybeSendLiveChatWelcome();
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

function maybeSendLiveChatWelcome() {
  const automation = supportConfig.liveChatAutomation;
  const autoWelcome = automation?.autoWelcome || {};
  if (!currentAccount || automation?.enabled === false || autoWelcome.enabled === false) return;
  const chatId = elements.chatId.value.trim();
  if (!chatId || autoWelcomeAttempts.has(chatId)) return;
  autoWelcomeAttempts.add(chatId);
  sendLiveChatWelcome({ manual: false });
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
  elements.searchResults.innerHTML = '<p class="search-state">Buscando en Jira y listas de Slack...</p>';

  try {
    const panels = Array.isArray(supportConfig.listPanels) ? supportConfig.listPanels.filter((panel) => panel?.id) : [];
    const [jiraResult, ...slackResults] = await Promise.allSettled([
      fetchJson(`/api/jira-search?query=${encodeURIComponent(query)}`),
      ...panels.map((panel) => fetchJson(`/api/slack-list-schema?mode=items&panel=${encodeURIComponent(panel.id)}&query=${encodeURIComponent(query)}`))
    ]);

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
          items: result.value.items || []
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
  } catch (error) {
    searchTickets = [];
    searchSlackPanels = [];
    renderSearchResults([], `No pude buscar: ${formatError(error.message)}`);
  } finally {
    elements.searchTicketBtn.disabled = false;
    elements.searchTicketBtn.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10.8 18.6a7.8 7.8 0 1 1 0-15.6 7.8 7.8 0 0 1 0 15.6Z"></path><path d="m16.5 16.5 4.5 4.5"></path></svg>BUSCAR TICKET';
  }
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
    if (options.forceResult) {
      renderReplyEmpty("Todavía no tengo mensajes del cliente para este chat. Revisa que el webhook de LiveChat esté apuntando a /api/livechat-webhook.");
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
        <p class="search-state">${panelResult.error ? `No pude consultar esta lista: ${escapeHtml(panelResult.error)}` : "Sin coincidencias en esta lista."}</p>
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
    admin_not_authorized: "tu usuario no tiene permiso de administración."
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
