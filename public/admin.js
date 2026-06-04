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
  aiEnabled: document.getElementById("aiEnabled"),
  aiBaseInstructions: document.getElementById("aiBaseInstructions"),
  aiBusinessContext: document.getElementById("aiBusinessContext"),
  aiToneRules: document.getElementById("aiToneRules"),
  aiSafetyRules: document.getElementById("aiSafetyRules"),
  aiDefaultResponseFormat: document.getElementById("aiDefaultResponseFormat"),
  aiVectorStoreId: document.getElementById("aiVectorStoreId"),
  aiMaxExamples: document.getElementById("aiMaxExamples"),
  aiFileSearchMaxResults: document.getElementById("aiFileSearchMaxResults"),
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

let config = { adminEmails: [], authorizedUsers: [], supportAlerts: [], reportWorkflows: [], slackRoutes: [], aiAssistant: {} };
let aiExamples = [];
let alertAcknowledgements = {};

els.loginBtn.addEventListener("click", login);
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
  const [data, examplesData] = await Promise.all([
    fetchJson("/api/admin-config"),
    fetchJson("/api/admin-config?action=ai-examples").catch(() => ({ examples: [] }))
  ]);
  config = data.config || config;
  alertAcknowledgements = data.alertAcknowledgements || {};
  aiExamples = examplesData.examples || [];
  els.login.hidden = true;
  els.panel.hidden = false;
  render();
}

function render() {
  renderAiAssistant();
  els.workflowsList.innerHTML = (config.reportWorkflows || []).map(renderWorkflow).join("");
  els.usersList.innerHTML = (config.authorizedUsers || []).map(renderUser).join("");
  els.alertsList.innerHTML = (config.supportAlerts || []).map(renderAlert).join("");
  els.routesList.innerHTML = (config.slackRoutes || []).map(renderRoute).join("");
  els.aiExamplesList.innerHTML = (aiExamples || []).map(renderAiExample).join("");
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
      <label>Rol
        <select data-user-field="role">
          <option value="agent" ${user.role !== "admin" ? "selected" : ""}>Agente</option>
          <option value="admin" ${user.role === "admin" ? "selected" : ""}>Admin</option>
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
  updateWorkflowsFromDom();
  updateUsersFromDom();
  updateAlertsFromDom();
  updateRoutesFromDom();
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
    aiExamples = (await fetchJson("/api/admin-config?action=ai-examples").catch(() => ({ examples: aiExamples }))).examples || aiExamples;
    render();
    showStatus("Configuracion remota guardada.", "success");
  } catch (error) {
    showStatus(`No pude guardar: ${formatError(error.message)}`, "error");
  }
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
    slack_route_not_configured: "esa opcion aun no tiene ruta Slack configurada."
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
