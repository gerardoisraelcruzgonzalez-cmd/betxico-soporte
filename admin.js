const els = {
  login: document.getElementById("adminLogin"),
  panel: document.getElementById("adminPanel"),
  email: document.getElementById("adminEmail"),
  pin: document.getElementById("adminPin"),
  loginBtn: document.getElementById("adminLoginBtn"),
  workflowsList: document.getElementById("workflowsList"),
  usersList: document.getElementById("usersList"),
  alertsList: document.getElementById("alertsList"),
  routesList: document.getElementById("routesList"),
  aiExamplesList: document.getElementById("aiExamplesList"),
  traceabilityEnabled: document.getElementById("traceabilityEnabled"),
  traceabilityDepositFile: document.getElementById("traceabilityDepositFile"),
  traceabilityDepositText: document.getElementById("traceabilityDepositText"),
  parseTraceabilityBtn: document.getElementById("parseTraceabilityBtn"),
  clearTraceabilityBtn: document.getElementById("clearTraceabilityBtn"),
  traceabilityAdminSummary: document.getElementById("traceabilityAdminSummary"),
  safeTemplateMode: document.getElementById("safeTemplateMode"),
  evidenceResponseMode: document.getElementById("evidenceResponseMode"),
  liveChatAutomationEnabled: document.getElementById("liveChatAutomationEnabled"),
  liveChatAutoWelcomeEnabled: document.getElementById("liveChatAutoWelcomeEnabled"),
  liveChatWelcomeOncePerChat: document.getElementById("liveChatWelcomeOncePerChat"),
  liveChatWelcomeAgents: document.getElementById("liveChatWelcomeAgents"),
  liveChatWelcomeMessage: document.getElementById("liveChatWelcomeMessage"),
  aiEnabled: document.getElementById("aiEnabled"),
  aiBaseInstructions: document.getElementById("aiBaseInstructions"),
  aiBusinessContext: document.getElementById("aiBusinessContext"),
  aiToneRules: document.getElementById("aiToneRules"),
  aiSafetyRules: document.getElementById("aiSafetyRules"),
  aiDefaultResponseFormat: document.getElementById("aiDefaultResponseFormat"),
  aiVectorStoreId: document.getElementById("aiVectorStoreId"),
  aiMaxExamples: document.getElementById("aiMaxExamples"),
  aiFileSearchMaxResults: document.getElementById("aiFileSearchMaxResults"),
  aiRuntimeStatus: document.getElementById("aiRuntimeStatus"),
  aiRuntimePin: document.getElementById("aiRuntimePin"),
  aiRuntimeToggleBtn: document.getElementById("aiRuntimeToggleBtn"),
  addWorkflowBtn: document.getElementById("addWorkflowBtn"),
  addUserBtn: document.getElementById("addUserBtn"),
  addAlertBtn: document.getElementById("addAlertBtn"),
  addRouteBtn: document.getElementById("addRouteBtn"),
  addAiExampleBtn: document.getElementById("addAiExampleBtn"),
  saveBtn: document.getElementById("saveAdminConfigBtn"),
  reloadBtn: document.getElementById("reloadAdminConfigBtn"),
  status: document.getElementById("adminStatus")
};

const slackFields = [
  ["customerId", "ID"],
  ["customerEmail", "Correo"],
  ["trackingKey", "Clave de rastreo"],
  ["amount", "Monto"],
  ["game", "Juego"],
  ["movementProof", "CEP/Captura"],
  ["status", "Status"],
  ["description", "Detalle"],
  ["agentName", "Agente"],
  ["jiraUrl", "Ticket en Jira"],
  ["createdAt", "Fecha"]
];

let config = { adminEmails: [], authorizedUsers: [], supportAlerts: [], reportWorkflows: [], slackRoutes: [], aiAssistant: {}, liveChatAutomation: {}, traceability: {} };
let aiExamples = [];
let alertAcknowledgements = {};
let aiRuntime = { enabled: false };

els.loginBtn.addEventListener("click", login);
els.aiRuntimeToggleBtn.addEventListener("click", toggleAiRuntime);
els.addWorkflowBtn.addEventListener("click", () => {
  config.reportWorkflows.push({
    id: "nueva-opcion",
    label: "Nueva opcion",
    destination: "slack",
    jiraIssueType: "",
    slackRouteId: "",
    slackTemplate: "",
    requiredSlackFields: [],
    enabled: true
  });
  render();
});
els.addUserBtn.addEventListener("click", () => {
  config.authorizedUsers.push({ email: "", displayName: "", role: "agent", enabled: true });
  render();
});
els.addAlertBtn.addEventListener("click", () => {
  const now = new Date().toISOString();
  config.supportAlerts = config.supportAlerts || [];
  config.supportAlerts.unshift({
    id: `alert-${Date.now()}`,
    title: "Aviso operativo",
    message: "",
    severity: "info",
    target: "agents",
    targetEmails: [],
    enabled: true,
    requireAcknowledgement: true,
    createdAt: now,
    updatedAt: now
  });
  render();
});
els.addRouteBtn.addEventListener("click", () => {
  config.slackRoutes.push({
    id: "nueva-ruta",
    name: "Nueva ruta",
    mode: "both",
    match: { issueTypes: [] },
    channelId: "",
    listId: "",
    listColumns: {},
    listColumnTypes: {}
  });
  render();
});
els.addAiExampleBtn.addEventListener("click", () => {
  aiExamples.unshift({
    id: `local-${Date.now()}`,
    topic: "general",
    question: "",
    answer: "",
    notes: "",
    enabled: true
  });
  render();
});
els.traceabilityDepositFile.addEventListener("change", handleTraceabilityFileChange);
els.parseTraceabilityBtn.addEventListener("click", parseTraceabilityDepositsFromInput);
els.clearTraceabilityBtn.addEventListener("click", clearTraceabilityDeposits);
els.traceabilityEnabled.addEventListener("change", updateTraceabilityFromDom);
els.saveBtn.addEventListener("click", saveConfig);
els.reloadBtn.addEventListener("click", loadConfig);

loadConfig().catch(() => null);

async function login() {
  try {
    await fetchJson("/api/auth-login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: els.email.value.trim(), pin: els.pin.value.trim() })
    });
    els.pin.value = "";
    await loadConfig();
  } catch (error) {
    showStatus(`No pude iniciar sesion: ${formatError(error.message)}`, "error");
  }
}

async function loadConfig() {
  const [data, examplesData, runtimeData] = await Promise.all([
    fetchJson("/api/admin-config"),
    fetchJson("/api/admin-config?action=ai-examples").catch(() => ({ examples: [] })),
    fetchJson("/api/admin-config?action=ai-runtime").catch(() => ({ runtime: { enabled: false } }))
  ]);
  config = data.config || config;
  alertAcknowledgements = data.alertAcknowledgements || {};
  aiExamples = examplesData.examples || [];
  aiRuntime = runtimeData.runtime || { enabled: false };
  els.login.hidden = true;
  els.panel.hidden = false;
  render();
}

function render() {
  renderLiveChatAutomation();
  renderTraceability();
  renderAiAssistant();
  els.workflowsList.innerHTML = (config.reportWorkflows || []).map(renderWorkflow).join("");
  els.usersList.innerHTML = (config.authorizedUsers || []).map(renderUser).join("");
  els.alertsList.innerHTML = (config.supportAlerts || []).map(renderAlert).join("");
  els.routesList.innerHTML = (config.slackRoutes || []).map(renderRoute).join("");
  els.aiExamplesList.innerHTML = (aiExamples || []).map(renderAiExample).join("");
  bindLiveChatAutomationFields();
  bindAiFields();
  els.workflowsList.querySelectorAll("[data-workflow-index]").forEach((node) => {
    node.addEventListener("input", updateWorkflowsFromDom);
    node.addEventListener("change", updateWorkflowsFromDom);
  });
  els.usersList.querySelectorAll("[data-user-index]").forEach((node) => {
    node.addEventListener("input", updateUsersFromDom);
    node.addEventListener("change", updateUsersFromDom);
  });
  els.alertsList.querySelectorAll("[data-alert-index]").forEach((node) => {
    node.addEventListener("input", updateAlertsFromDom);
    node.addEventListener("change", updateAlertsFromDom);
  });
  els.alertsList.querySelectorAll("[data-remove-alert]").forEach((button) => {
    button.addEventListener("click", removeAlert);
  });
  els.routesList.querySelectorAll("[data-route-index]").forEach((node) => {
    node.addEventListener("input", updateRoutesFromDom);
    node.addEventListener("change", updateRoutesFromDom);
  });
  els.routesList.querySelectorAll("[data-detect-route]").forEach((button) => {
    button.addEventListener("click", detectRouteColumns);
  });
  els.aiExamplesList.querySelectorAll("[data-remove-ai-example]").forEach((button) => {
    button.addEventListener("click", removeAiExample);
  });
}

function renderTraceability() {
  const traceability = config.traceability || {};
  const deposits = Array.isArray(traceability.deposits) ? traceability.deposits : [];
  els.traceabilityEnabled.checked = traceability.enabled !== false;
  els.traceabilityDepositText.value = "";
  els.traceabilityAdminSummary.textContent = deposits.length
    ? `${deposits.length} clientes con ultimo deposito cargado. Actualizado: ${traceability.updatedAt || "sin fecha"}.`
    : "Sin depositos cargados.";
}

function renderLiveChatAutomation() {
  const automation = config.liveChatAutomation || {};
  const autoWelcome = automation.autoWelcome || {};
  const mode = ["disabled", "suggest_only", "auto_send_safe"].includes(automation.safeTemplateMode)
    ? automation.safeTemplateMode
    : "suggest_only";
  els.safeTemplateMode.value = mode;
  els.evidenceResponseMode.value = ["suggest_only", "auto_send_verified"].includes(automation.evidenceResponseMode)
    ? automation.evidenceResponseMode
    : "suggest_only";
  els.liveChatAutomationEnabled.checked = automation.enabled !== false;
  els.liveChatAutoWelcomeEnabled.checked = autoWelcome.enabled !== false;
  els.liveChatWelcomeOncePerChat.checked = autoWelcome.oncePerChat !== false;
  els.liveChatWelcomeAgents.value = (autoWelcome.onlyForAgents || []).join(", ");
  els.liveChatWelcomeMessage.value = autoWelcome.message || "";
}

function bindLiveChatAutomationFields() {
  [
    els.safeTemplateMode,
    els.evidenceResponseMode,
    els.liveChatAutomationEnabled,
    els.liveChatAutoWelcomeEnabled,
    els.liveChatWelcomeOncePerChat,
    els.liveChatWelcomeAgents,
    els.liveChatWelcomeMessage
  ].forEach((node) => {
    node.addEventListener("input", updateLiveChatAutomationFromDom);
    node.addEventListener("change", updateLiveChatAutomationFromDom);
  });
}

function renderAiAssistant() {
  const ai = config.aiAssistant || {};
  els.aiEnabled.checked = ai.enabled !== false;
  els.aiBaseInstructions.value = ai.baseInstructions || "";
  els.aiBusinessContext.value = ai.businessContext || "";
  els.aiToneRules.value = ai.toneRules || "";
  els.aiSafetyRules.value = ai.safetyRules || "";
  els.aiDefaultResponseFormat.value = ai.defaultResponseFormat || "";
  els.aiVectorStoreId.value = ai.vectorStoreId || "";
  els.aiMaxExamples.value = ai.maxExamples || 5;
  els.aiFileSearchMaxResults.value = ai.fileSearchMaxResults || 3;
  els.aiRuntimeStatus.textContent = aiRuntime.enabled ? "IA activa" : "IA apagada";
  els.aiRuntimeToggleBtn.textContent = aiRuntime.enabled ? "Apagar IA" : "Activar IA";
}

async function toggleAiRuntime() {
  const nextEnabled = !aiRuntime.enabled;
  const pin = els.aiRuntimePin.value.trim();
  if (!pin) return showStatus("Ingresa tu PIN para cambiar el estado de la IA.", "error");
  els.aiRuntimeToggleBtn.disabled = true;
  try {
    const data = await fetchJson("/api/admin-config?action=ai-runtime", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ enabled: nextEnabled, pin })
    });
    aiRuntime = data.runtime || { enabled: false };
    els.aiRuntimePin.value = "";
    renderAiAssistant();
    showStatus(aiRuntime.enabled ? "IA activada con PIN." : "IA apagada.", "success");
  } catch (error) {
    showStatus(`No pude cambiar la IA: ${formatError(error.message)}`, "error");
  } finally {
    els.aiRuntimeToggleBtn.disabled = false;
  }
}

function bindAiFields() {
  [
    els.aiEnabled,
    els.aiBaseInstructions,
    els.aiBusinessContext,
    els.aiToneRules,
    els.aiSafetyRules,
    els.aiDefaultResponseFormat,
    els.aiVectorStoreId,
    els.aiMaxExamples,
    els.aiFileSearchMaxResults
  ].forEach((node) => {
    node.addEventListener("input", updateAiFromDom);
    node.addEventListener("change", updateAiFromDom);
  });
  els.aiExamplesList.querySelectorAll("[data-ai-example-index]").forEach((node) => {
    node.addEventListener("input", updateAiExamplesFromDom);
    node.addEventListener("change", updateAiExamplesFromDom);
  });
}

function renderWorkflow(workflow, index) {
  return `
    <article class="admin-route" data-workflow-index="${index}">
      <div class="admin-route-grid">
        <label>Texto visible <input data-workflow-field="label" value="${escapeHtml(workflow.label || "")}" placeholder="Deposito no reflejado"></label>
        <label>ID interno <input data-workflow-field="id" value="${escapeHtml(workflow.id || "")}" placeholder="deposito-no-reflejado"></label>
        <label>Hace
          <select data-workflow-field="destination">
            <option value="both" ${workflow.destination === "both" ? "selected" : ""}>Jira y Slack</option>
            <option value="slack" ${workflow.destination === "slack" ? "selected" : ""}>Solo Slack</option>
            <option value="jira" ${workflow.destination === "jira" ? "selected" : ""}>Solo Jira</option>
          </select>
        </label>
        <label>Tipo Jira <input data-workflow-field="jiraIssueType" value="${escapeHtml(workflow.jiraIssueType || "")}" placeholder="Transacciones"></label>
        <label>Ruta Slack <input data-workflow-field="slackRouteId" value="${escapeHtml(workflow.slackRouteId || "")}" placeholder="deposito-no-reflejado"></label>
        <label>Plantilla Slack
          <select data-workflow-field="slackTemplate">
            <option value="" ${!workflow.slackTemplate ? "selected" : ""}>Generica</option>
            <option value="deposit" ${workflow.slackTemplate === "deposit" ? "selected" : ""}>Deposito no reflejado</option>
            <option value="session-close" ${workflow.slackTemplate === "session-close" ? "selected" : ""}>Cierre de sesiones</option>
          </select>
        </label>
        <label>Campos obligatorios <input data-workflow-field="requiredSlackFields" value="${escapeHtml((workflow.requiredSlackFields || []).join(", "))}" placeholder="agentName, customerId, customerEmail"></label>
        <label class="check-field"><input data-workflow-field="enabled" type="checkbox" ${workflow.enabled !== false ? "checked" : ""}> Activa</label>
      </div>
    </article>
  `;
}

function renderUser(user, index) {
  return `
    <article class="admin-row" data-user-index="${index}">
      <label>Correo <input data-user-field="email" value="${escapeHtml(user.email || "")}" placeholder="agente@betxico.mx"></label>
      <label>Nombre <input data-user-field="displayName" value="${escapeHtml(user.displayName || "")}" placeholder="Nombre"></label>
      <label>PIN inicial o restablecer <input data-user-field="initialPin" type="password" autocomplete="new-password" placeholder="Solo si deseas asignarlo"></label>
      <label>Rol
        <select data-user-field="role">
          <option value="agent" ${user.role !== "admin" ? "selected" : ""}>Agente</option>
          <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
        </select>
      </label>
      <label>Grupo de herramientas
        <select data-user-field="accessGroup">
          <option value="basic" ${!user.accessGroup || user.accessGroup === "basic" ? "selected" : ""}>Basico: Jira, Slack y tickets</option>
          <option value="operations" ${user.accessGroup === "operations" ? "selected" : ""}>Operacion: Atena, KYC y BoB</option>
          <option value="ai" ${user.accessGroup === "ai" ? "selected" : ""}>IA</option>
          <option value="complete" ${user.accessGroup === "complete" ? "selected" : ""}>Completo</option>
        </select>
      </label>
      <label class="check-field"><input data-user-field="enabled" type="checkbox" ${user.enabled !== false ? "checked" : ""}> Activo</label>
    </article>
  `;
}

function renderAlert(alert, index) {
  const ack = alertAcknowledgements[alert.id] || { targetCount: 0, seenCount: 0, pendingCount: 0, seenEmails: [], pendingEmails: [] };
  return `
    <article class="admin-route" data-alert-index="${index}">
      <div class="admin-route-grid">
        <label>Titulo <input data-alert-field="title" value="${escapeHtml(alert.title || "")}" placeholder="Aviso operativo"></label>
        <label>Riesgo
          <select data-alert-field="severity">
            <option value="info" ${alert.severity !== "warning" && alert.severity !== "critical" ? "selected" : ""}>Informativo</option>
            <option value="warning" ${alert.severity === "warning" ? "selected" : ""}>Importante</option>
            <option value="critical" ${alert.severity === "critical" ? "selected" : ""}>Critico</option>
          </select>
        </label>
        <label>Destino
          <select data-alert-field="target">
            <option value="agents" ${alert.target !== "admins" && alert.target !== "all" && alert.target !== "emails" ? "selected" : ""}>Agentes</option>
            <option value="admins" ${alert.target === "admins" ? "selected" : ""}>Admins</option>
            <option value="all" ${alert.target === "all" ? "selected" : ""}>Todos</option>
            <option value="emails" ${alert.target === "emails" ? "selected" : ""}>Correos especificos</option>
          </select>
        </label>
        <label>Correos especificos <input data-alert-field="targetEmails" value="${escapeHtml((alert.targetEmails || []).join(", "))}" placeholder="agente@betxico.mx"></label>
        <label class="check-field"><input data-alert-field="enabled" type="checkbox" ${alert.enabled !== false ? "checked" : ""}> Activa</label>
        <label class="check-field"><input data-alert-field="requireAcknowledgement" type="checkbox" ${alert.requireAcknowledgement !== false ? "checked" : ""}> Requiere visto</label>
        <button type="button" class="secondary-button danger-light" data-remove-alert="${index}">Quitar</button>
        <label class="span-2">Mensaje
          <textarea data-alert-field="message" rows="5" placeholder="Escribe el aviso que debe ver el agente...">${escapeHtml(alert.message || "")}</textarea>
        </label>
      </div>
      <div class="alert-ack-summary">
        <strong>Vistos: ${ack.seenCount || 0}/${ack.targetCount || 0}</strong>
        <span>Faltan: ${ack.pendingCount || 0}</span>
        <div>
          <b>Ya lo vieron</b>
          <p>${(ack.seenEmails || []).length ? escapeHtml(ack.seenEmails.join(", ")) : "Nadie aun"}</p>
        </div>
        <div>
          <b>Pendientes</b>
          <p>${(ack.pendingEmails || []).length ? escapeHtml(ack.pendingEmails.join(", ")) : "Sin pendientes"}</p>
        </div>
      </div>
    </article>
  `;
}

function renderRoute(route, index) {
  return `
    <article class="admin-route" data-route-index="${index}">
      <div class="admin-route-grid">
        <label>Nombre <input data-route-field="name" value="${escapeHtml(route.name || "")}"></label>
        <label>ID interno <input data-route-field="id" value="${escapeHtml(route.id || "")}"></label>
        <label>Modo
          <select data-route-field="mode">
            <option value="both" ${route.mode === "both" ? "selected" : ""}>Canal y lista</option>
            <option value="message" ${route.mode === "message" ? "selected" : ""}>Solo canal</option>
            <option value="list" ${route.mode === "list" ? "selected" : ""}>Solo lista</option>
          </select>
        </label>
        <label>Canal Slack <input data-route-field="channelId" value="${escapeHtml(route.channelId || "")}" placeholder="C..."></label>
        <label>Slack List <input data-route-field="listId" value="${escapeHtml(route.listId || "")}" placeholder="F..."></label>
        <label>Opciones widget <input data-route-field="workflowIds" value="${escapeHtml((route.match?.workflowIds || []).join(", "))}" placeholder="deposito-no-reflejado"></label>
        <label>Tipos de Jira <input data-route-field="issueTypes" value="${escapeHtml((route.match?.issueTypes || []).join(", "))}" placeholder="Servicio al Cliente, Deposito no reflejado"></label>
      </div>
      <div class="columns-toolbar">
        <strong>Columnas detectadas</strong>
        <button type="button" class="secondary-button" data-detect-route="${index}">Detectar columnas</button>
      </div>
      <div class="columns-grid">
        ${slackFields.map(([key, label]) => `
          <label>${escapeHtml(label)}
            <input data-column-key="${key}" value="${escapeHtml(route.listColumns?.[key] || "")}" placeholder="Col...">
          </label>
        `).join("")}
      </div>
    </article>
  `;
}

function renderAiExample(example, index) {
  return `
    <article class="admin-route" data-ai-example-index="${index}">
      <div class="admin-route-grid">
        <label>Tema
          <select data-ai-example-field="topic">
            ${["depositos", "retiros", "kyc", "bonos", "juegos", "cierres", "escalacion", "general"].map((topic) => `
              <option value="${topic}" ${example.topic === topic ? "selected" : ""}>${topic}</option>
            `).join("")}
          </select>
        </label>
        <label class="check-field"><input data-ai-example-field="enabled" type="checkbox" ${example.enabled !== false ? "checked" : ""}> Activo</label>
        <button type="button" class="secondary-button danger-light" data-remove-ai-example="${index}">Quitar</button>
        <label class="span-2">Pregunta o situacion
          <textarea data-ai-example-field="question" rows="3">${escapeHtml(example.question || "")}</textarea>
        </label>
        <label class="span-2">Respuesta aprobada
          <textarea data-ai-example-field="answer" rows="5">${escapeHtml(example.answer || "")}</textarea>
        </label>
        <label class="span-2">Notas internas
          <textarea data-ai-example-field="notes" rows="2">${escapeHtml(example.notes || "")}</textarea>
        </label>
      </div>
    </article>
  `;
}

function updateUsersFromDom() {
  config.authorizedUsers = [...els.usersList.querySelectorAll("[data-user-index]")].map((row) => ({
    email: row.querySelector('[data-user-field="email"]').value.trim().toLowerCase(),
    displayName: row.querySelector('[data-user-field="displayName"]').value.trim(),
    role: row.querySelector('[data-user-field="role"]').value,
    accessGroup: row.querySelector('[data-user-field="accessGroup"]').value,
    enabled: row.querySelector('[data-user-field="enabled"]').checked
  })).filter((user) => user.email);
  config.adminEmails = config.authorizedUsers.filter((user) => user.role === "admin" && user.enabled).map((user) => user.email);
}

function updateAlertsFromDom() {
  config.supportAlerts = [...els.alertsList.querySelectorAll("[data-alert-index]")].map((row) => {
    const previous = config.supportAlerts[Number(row.dataset.alertIndex)] || {};
    const next = {
      id: previous.id || `alert-${Date.now()}`,
      title: row.querySelector('[data-alert-field="title"]').value.trim(),
      message: row.querySelector('[data-alert-field="message"]').value.trim(),
      severity: row.querySelector('[data-alert-field="severity"]').value,
      target: row.querySelector('[data-alert-field="target"]').value,
      targetEmails: row.querySelector('[data-alert-field="targetEmails"]').value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean),
      enabled: row.querySelector('[data-alert-field="enabled"]').checked,
      requireAcknowledgement: row.querySelector('[data-alert-field="requireAcknowledgement"]').checked,
      createdAt: previous.createdAt || new Date().toISOString(),
      updatedAt: previous.updatedAt || previous.createdAt || new Date().toISOString()
    };
    if (hasAlertChanged(previous, next)) {
      next.updatedAt = new Date().toISOString();
    }
    return next;
  }).filter((alert) => alert.id && alert.title && alert.message);
}

function hasAlertChanged(previous = {}, next = {}) {
  return [
    "title",
    "message",
    "severity",
    "target",
    "enabled",
    "requireAcknowledgement"
  ].some((field) => String(previous[field] ?? "") !== String(next[field] ?? ""))
    || (previous.targetEmails || []).join(",") !== (next.targetEmails || []).join(",");
}

function updateWorkflowsFromDom() {
  config.reportWorkflows = [...els.workflowsList.querySelectorAll("[data-workflow-index]")].map((row) => ({
    id: row.querySelector('[data-workflow-field="id"]').value.trim(),
    label: row.querySelector('[data-workflow-field="label"]').value.trim(),
    destination: row.querySelector('[data-workflow-field="destination"]').value,
    jiraIssueType: row.querySelector('[data-workflow-field="jiraIssueType"]').value.trim(),
    slackRouteId: row.querySelector('[data-workflow-field="slackRouteId"]').value.trim(),
    slackTemplate: row.querySelector('[data-workflow-field="slackTemplate"]').value,
    requiredSlackFields: row.querySelector('[data-workflow-field="requiredSlackFields"]').value.split(",").map((item) => item.trim()).filter(Boolean),
    enabled: row.querySelector('[data-workflow-field="enabled"]').checked
  })).filter((workflow) => workflow.id && workflow.label);
}

function updateRoutesFromDom() {
  config.slackRoutes = [...els.routesList.querySelectorAll("[data-route-index]")].map((row) => {
    const route = {
      id: row.querySelector('[data-route-field="id"]').value.trim(),
      name: row.querySelector('[data-route-field="name"]').value.trim(),
      mode: row.querySelector('[data-route-field="mode"]').value,
      channelId: row.querySelector('[data-route-field="channelId"]').value.trim(),
      listId: row.querySelector('[data-route-field="listId"]').value.trim(),
      match: {
        workflowIds: row.querySelector('[data-route-field="workflowIds"]').value.split(",").map((item) => item.trim()).filter(Boolean),
        issueTypes: row.querySelector('[data-route-field="issueTypes"]').value.split(",").map((item) => item.trim()).filter(Boolean)
      },
      listColumns: {},
      listColumnTypes: config.slackRoutes[Number(row.dataset.routeIndex)]?.listColumnTypes || {}
    };
    for (const input of row.querySelectorAll("[data-column-key]")) {
      route.listColumns[input.dataset.columnKey] = input.value.trim();
    }
    return route;
  }).filter((route) => route.id && (route.channelId || route.listId));
}

async function handleTraceabilityFileChange() {
  const file = els.traceabilityDepositFile.files?.[0];
  if (!file) return;
  try {
    els.traceabilityDepositText.value = await file.text();
    showStatus(`Archivo cargado: ${file.name}. Da clic en Procesar depositos.`, "success");
  } catch {
    showStatus("No pude leer el archivo. Exporta Paybridge como CSV o copia y pega la tabla.", "error");
  }
}

function parseTraceabilityDepositsFromInput() {
  const text = els.traceabilityDepositText.value.trim();
  if (!text) {
    showStatus("Pega o sube primero el CSV de depositos.", "error");
    return;
  }

  try {
    const deposits = parseTraceabilityDeposits(text);
    const latestDeposits = [...latestTraceabilityDepositByEmail(deposits).values()]
      .sort((left, right) => left.email.localeCompare(right.email));
    config.traceability = {
      ...(config.traceability || {}),
      enabled: els.traceabilityEnabled.checked,
      deposits: latestDeposits,
      updatedAt: new Date().toISOString()
    };
    els.traceabilityDepositText.value = "";
    renderTraceability();
    showStatus(`${latestDeposits.length} clientes con ultimo deposito listos para guardar. Da clic en Guardar cambios remotos.`, "success");
  } catch (error) {
    showStatus(`No pude procesar depositos: ${formatError(error.message)}`, "error");
  }
}

function clearTraceabilityDeposits() {
  config.traceability = {
    ...(config.traceability || {}),
    enabled: els.traceabilityEnabled.checked,
    deposits: [],
    updatedAt: new Date().toISOString()
  };
  els.traceabilityDepositText.value = "";
  renderTraceability();
  showStatus("Depositos limpiados. Da clic en Guardar cambios remotos para aplicar.", "success");
}

function updateTraceabilityFromDom() {
  config.traceability = {
    ...(config.traceability || {}),
    enabled: els.traceabilityEnabled.checked,
    deposits: Array.isArray(config.traceability?.deposits) ? config.traceability.deposits : [],
    updatedAt: config.traceability?.updatedAt || ""
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

  if (indexes.email < 0) throw new Error("deposit_csv_missing_email");
  if (indexes.sourceClabe < 0) throw new Error("deposit_csv_missing_clabe");
  if (indexes.createdAt < 0) throw new Error("deposit_csv_missing_date");

  const deposits = rows.slice(1).map((row, index) => {
    const createdAt = cellAt(row, indexes.createdAt);
    return {
      email: normalizeEmail(cellAt(row, indexes.email)),
      depositAmount: normalizeMoneyText(cellAt(row, indexes.amount)),
      depositClabe: normalizeClabe(cellAt(row, indexes.sourceClabe)),
      depositDate: createdAt,
      depositorName: cellAt(row, indexes.depositorName),
      dateTs: parseTraceabilityDate(createdAt),
      sourceRow: index + 2
    };
  }).filter((deposit) => deposit.email);

  const invalidClabe = deposits.find((deposit) => !deposit.depositClabe);
  if (invalidClabe) throw new Error(`deposit_csv_invalid_clabe_row_${invalidClabe.sourceRow}`);
  const invalidDate = deposits.find((deposit) => !deposit.dateTs);
  if (invalidDate) throw new Error(`deposit_csv_invalid_date_row_${invalidDate.sourceRow}`);
  return deposits;
}

function latestTraceabilityDepositByEmail(deposits) {
  const grouped = new Map();
  for (const deposit of deposits) {
    const current = grouped.get(deposit.email);
    if (!current || deposit.dateTs > current.dateTs || (deposit.dateTs === current.dateTs && deposit.sourceRow > current.sourceRow)) {
      grouped.set(deposit.email, deposit);
    }
  }
  return grouped;
}

function parseDelimitedRows(text) {
  const lines = String(text || "").replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (!lines.length) return [];
  const delimiter = detectDelimiter(lines[0]);
  return lines.map((line) => splitDelimitedLine(line, delimiter));
}

function detectDelimiter(line) {
  return ["\t", ";", ","]
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

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeMoneyText(value) {
  return String(value || "").trim().replace(/^\$+/, "");
}

function normalizeClabe(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 18 ? digits : "";
}

function extractClabe(value) {
  const candidates = String(value || "").match(/\b\d[\d\s-]{16,30}\d\b/g) || [];
  for (const candidate of candidates) {
    const clabe = normalizeClabe(candidate);
    if (clabe) return clabe;
  }
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

function updateLiveChatAutomationFromDom() {
  const previous = config.liveChatAutomation || {};
  config.liveChatAutomation = {
    ...previous,
    enabled: els.liveChatAutomationEnabled.checked,
    safeTemplateMode: els.safeTemplateMode.value,
    evidenceResponseMode: els.evidenceResponseMode.value,
    autoWelcome: {
      ...(previous.autoWelcome || {}),
      enabled: els.liveChatAutoWelcomeEnabled.checked,
      oncePerChat: els.liveChatWelcomeOncePerChat.checked,
      onlyForAgents: els.liveChatWelcomeAgents.value.split(",").map((item) => item.trim().toLowerCase()).filter(Boolean),
      message: els.liveChatWelcomeMessage.value.trim()
    }
  };
}

function updateAiFromDom() {
  config.aiAssistant = {
    enabled: els.aiEnabled.checked,
    baseInstructions: els.aiBaseInstructions.value.trim(),
    businessContext: els.aiBusinessContext.value.trim(),
    toneRules: els.aiToneRules.value.trim(),
    safetyRules: els.aiSafetyRules.value.trim(),
    defaultResponseFormat: els.aiDefaultResponseFormat.value.trim(),
    vectorStoreId: els.aiVectorStoreId.value.trim(),
    maxExamples: Number(els.aiMaxExamples.value) || 5,
    fileSearchMaxResults: Number(els.aiFileSearchMaxResults.value) || 3
  };
}

function updateAiExamplesFromDom() {
  aiExamples = [...els.aiExamplesList.querySelectorAll("[data-ai-example-index]")].map((row) => ({
    id: aiExamples[Number(row.dataset.aiExampleIndex)]?.id || "",
    topic: row.querySelector('[data-ai-example-field="topic"]').value,
    question: row.querySelector('[data-ai-example-field="question"]').value.trim(),
    answer: row.querySelector('[data-ai-example-field="answer"]').value.trim(),
    notes: row.querySelector('[data-ai-example-field="notes"]').value.trim(),
    enabled: row.querySelector('[data-ai-example-field="enabled"]').checked,
    createdAt: aiExamples[Number(row.dataset.aiExampleIndex)]?.createdAt || "",
    updatedAt: new Date().toISOString()
  })).filter((example) => example.question && example.answer);
}

function removeAiExample(event) {
  updateAiExamplesFromDom();
  aiExamples.splice(Number(event.currentTarget.dataset.removeAiExample), 1);
  render();
}

function removeAlert(event) {
  updateAlertsFromDom();
  config.supportAlerts.splice(Number(event.currentTarget.dataset.removeAlert), 1);
  render();
}

async function detectRouteColumns(event) {
  updateRoutesFromDom();
  const index = Number(event.currentTarget.dataset.detectRoute);
  const route = config.slackRoutes[index];
  if (!route?.listId) {
    showStatus("Primero escribe el ID de la lista Slack.", "error");
    return;
  }
  try {
    const data = await fetchJson(`/api/slack-list-schema?listId=${encodeURIComponent(route.listId)}`);
    route.listColumns = data.columns?.listColumns || route.listColumns || {};
    route.listColumnTypes = data.columns?.listColumnTypes || route.listColumnTypes || {};
    render();
    showStatus(`Columnas detectadas para ${route.listId}.`, "success");
  } catch (error) {
    showStatus(`No pude detectar columnas: ${formatError(error.message)}`, "error");
  }
}

async function saveConfig() {
  const pendingPins = collectPendingUserPins();
  updateWorkflowsFromDom();
  updateUsersFromDom();
  updateAlertsFromDom();
  updateRoutesFromDom();
  updateTraceabilityFromDom();
  updateLiveChatAutomationFromDom();
  updateAiFromDom();
  updateAiExamplesFromDom();
  try {
    const [data] = await Promise.all([
      fetchJson("/api/admin-config", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ config })
      }),
      fetchJson("/api/admin-config?action=ai-examples", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ examples: aiExamples })
      })
    ]);
    config = data.config || config;
    alertAcknowledgements = data.alertAcknowledgements || {};
    const provisioning = await Promise.allSettled(pendingPins.map((user) => fetchJson("/api/admin-config?action=provision-account", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: user.email, displayName: user.displayName, pin: user.pin })
    })));
    const failedProvisioning = provisioning.filter((result) => result.status === "rejected");
    if (failedProvisioning.length) {
      throw new Error(`account_provisioning_failed_${failedProvisioning.length}`);
    }
    aiExamples = (await fetchJson("/api/admin-config?action=ai-examples").catch(() => ({ examples: aiExamples }))).examples || aiExamples;
    render();
    showStatus(pendingPins.length ? `Configuración guardada y PIN asignado a ${pendingPins.length} usuario(s).` : "Configuración remota guardada.", "success");
  } catch (error) {
    showStatus(`No pude guardar: ${formatError(error.message)}`, "error");
  }
}

function collectPendingUserPins() {
  return [...els.usersList.querySelectorAll("[data-user-index]")].map((row) => ({
    email: row.querySelector('[data-user-field="email"]').value.trim().toLowerCase(),
    displayName: row.querySelector('[data-user-field="displayName"]').value.trim(),
    pin: row.querySelector('[data-user-field="initialPin"]').value.trim()
  })).filter((user) => user.email && user.pin);
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.ok === false) throw new Error(data.error || `http_${response.status}`);
  return data;
}

function showStatus(message, type) {
  els.status.hidden = false;
  els.status.className = `result ${type}`;
  els.status.textContent = message;
}

function formatError(value) {
  const messages = {
    admin_not_authorized: "tu usuario no tiene permiso de administracion.",
    invalid_login: "correo o PIN incorrecto.",
    missing_slack_config: "falta token Slack o ID de lista.",
    slack_list_has_no_items: "la lista necesita al menos una fila para leer columnas.",
    slack_route_not_configured: "esa opcion aun no tiene ruta Slack configurada.",
    missing_kv_config: "falta la conexión de estado para guardar la activación de IA."
  };
  return messages[value] || value;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}
