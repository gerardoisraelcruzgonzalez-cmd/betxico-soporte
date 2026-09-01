const state = {
  account: null,
  capabilities: null,
  payload: null,
  pendingFiles: [],
  localPreviews: new Map(),
  senderRole: "customer",
  busy: false
};

const elements = Object.fromEntries([
  "loginView", "loginForm", "loginEmail", "loginPin", "loginBtn", "slackLoginBtn", "loginMessage",
  "accessDeniedView", "accessDeniedMessage", "deniedLogoutBtn", "startView", "startForm", "customerEmail",
  "customerAuthId", "customerName", "startBtn", "startMessage", "workspaceView", "sessionLabel", "logoutBtn",
  "conversationCustomer", "conversationIdentity", "conversationStatus", "workflowLabel", "transcript", "refreshBtn",
  "newCaseBtn", "messageForm", "messageInput", "fileInput", "attachBtn", "sendBtn", "fileTray", "conversationMessage",
  "sendAsCustomerBtn", "sendAsAgentBtn", "replyModeLabel",
  "caseState", "caseRevision", "jiraCount", "jiraResults", "slackCount", "slackResults", "atenaStatus", "atenaResult", "kycStatus", "kycResult", "knowledgeCount", "knowledgeResults",
  "investigationTrace", "usageCalls", "usageInput", "usageOutput", "usageTotal", "usageCost", "usageModel", "usageBudget", "usageEstimate",
  "evidenceList", "reviewEvidenceBtn", "kycCompleteBtn", "kycIncompleteBtn", "analysisTitle", "analysisText", "nextStepText", "sourceChips", "actionStatus",
  "actionPanel", "actionType", "actionTarget", "actionText", "proposeBtn", "approveBtn", "executionGate", "executionPin",
  "executionConfirmation", "executeBtn", "actionMessage"
].map((id) => [id, document.getElementById(id)]));

bindEvents();
restoreLocalPreviews();
loadSession();

function bindEvents() {
  elements.loginForm.addEventListener("submit", loginWithPin);
  elements.slackLoginBtn.addEventListener("click", loginWithSlack);
  window.addEventListener("message", handleSlackLoginComplete);
  window.addEventListener("storage", handleSlackLoginStorage);
  elements.logoutBtn.addEventListener("click", logout);
  elements.deniedLogoutBtn.addEventListener("click", logout);
  elements.startForm.addEventListener("submit", startConversation);
  elements.newCaseBtn.addEventListener("click", resetConversation);
  elements.refreshBtn.addEventListener("click", refreshSources);
  elements.messageForm.addEventListener("submit", sendCustomerMessage);
  elements.sendAsCustomerBtn.addEventListener("click", () => setSenderRole("customer"));
  elements.sendAsAgentBtn.addEventListener("click", () => setSenderRole("agent"));
  elements.attachBtn.addEventListener("click", () => elements.fileInput.click());
  elements.fileInput.addEventListener("change", () => addFiles(elements.fileInput.files));
  elements.reviewEvidenceBtn.addEventListener("click", reviewEvidence);
  elements.kycCompleteBtn.addEventListener("click", () => recordKycReview("complete"));
  elements.kycIncompleteBtn.addEventListener("click", () => recordKycReview("incomplete"));
  elements.actionType.addEventListener("change", updateActionPlaceholder);
  elements.proposeBtn.addEventListener("click", proposeAction);
  elements.approveBtn.addEventListener("click", approveAction);
  elements.executeBtn.addEventListener("click", executeAction);
  elements.usageBudget.addEventListener("input", updateUsageEstimate);
}

async function loadSession() {
  setBusy(true, "Revisando acceso...");
  try {
    const accountData = await request("/api/account-settings");
    if (!accountData.account) return showOnly("loginView");
    state.account = accountData.account;
    await verifySimulatorAccess();
  } catch (error) {
    showOnly("loginView");
    setMessage(elements.loginMessage, humanError(error.message), "error");
  } finally {
    setBusy(false);
  }
}

async function verifySimulatorAccess() {
  try {
    const data = await simulatorRequest("status");
    state.account = data.account;
    state.capabilities = data.capabilities;
    elements.sessionLabel.textContent = data.account.displayName || data.account.email;
    elements.logoutBtn.hidden = false;
    showOnly(state.payload ? "workspaceView" : "startView");
  } catch (error) {
    elements.accessDeniedMessage.textContent = humanError(error.message);
    elements.logoutBtn.hidden = true;
    showOnly("accessDeniedView");
  }
}

async function loginWithPin(event) {
  event.preventDefault();
  setMessage(elements.loginMessage, "Validando cuenta...");
  elements.loginBtn.disabled = true;
  try {
    const data = await request("/api/auth-login", {
      method: "POST",
      body: {
        email: elements.loginEmail.value.trim(),
        pin: elements.loginPin.value.trim()
      }
    });
    state.account = data.account;
    elements.loginPin.value = "";
    await verifySimulatorAccess();
  } catch (error) {
    setMessage(elements.loginMessage, humanError(error.message), "error");
  } finally {
    elements.loginBtn.disabled = false;
  }
}

async function loginWithSlack() {
  elements.slackLoginBtn.disabled = true;
  setMessage(elements.loginMessage, "Abriendo Slack...");
  try {
    const data = await request("/api/slack-user?action=signin-start", { method: "POST", body: {} });
    if (!data.url) throw new Error("slack_oauth_url_missing");
    const popup = window.open(data.url, "betxicoSlackSimulatorLogin", "width=520,height=720");
    if (!popup) window.location.href = data.url;
    else popup.focus?.();
  } catch (error) {
    setMessage(elements.loginMessage, humanError(error.message), "error");
  } finally {
    elements.slackLoginBtn.disabled = false;
  }
}

function handleSlackLoginComplete(event) {
  if (event.origin !== window.location.origin || event.data?.type !== "betxico-slack-login-complete") return;
  loadSession();
}

function handleSlackLoginStorage(event) {
  if (event.key === "betxicoSlackLoginComplete") loadSession();
}

async function logout() {
  await request("/api/auth-logout", { method: "POST", body: {} }).catch(() => null);
  state.account = null;
  state.payload = null;
  state.capabilities = null;
  clearLocalPreviews();
  elements.logoutBtn.hidden = true;
  elements.sessionLabel.textContent = "Sin sesión";
  showOnly("loginView");
}

async function startConversation(event) {
  event.preventDefault();
  elements.startBtn.disabled = true;
  setMessage(elements.startMessage, "Consultando el expediente real...");
  try {
    state.payload = await simulatorRequest("start", {
      email: elements.customerEmail.value.trim(),
      authId: elements.customerAuthId.value.trim(),
      name: elements.customerName.value.trim()
    });
    renderWorkspace();
    showOnly("workspaceView");
    elements.messageInput.focus();
  } catch (error) {
    setMessage(elements.startMessage, humanError(error.message), "error");
  } finally {
    elements.startBtn.disabled = false;
  }
}

function resetConversation() {
  state.payload = null;
  state.pendingFiles = [];
  clearLocalPreviews();
  renderFileTray();
  elements.startForm.reset();
  setSenderRole("customer");
  setMessage(elements.startMessage, "");
  showOnly("startView");
  elements.customerEmail.focus();
}

async function refreshSources() {
  await runConversationTask("Actualizando Jira, Slack, Atena, KYC y manual...", async () => {
    state.payload = await simulatorRequest("refresh", { chatId: currentChatId() });
    renderWorkspace();
  });
}

async function sendCustomerMessage(event) {
  event.preventDefault();
  const text = elements.messageInput.value.trim();
  if (!text && !state.pendingFiles.length) {
    return setMessage(elements.conversationMessage, "Escribe un mensaje o adjunta un archivo.", "error");
  }
  const attachments = state.pendingFiles.map((file) => ({
    name: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size
  }));
  const taskLabel = state.senderRole === "agent"
    ? "Añadiendo la respuesta manual..."
    : "Analizando el mensaje y consultando fuentes...";
  await runConversationTask(taskLabel, async () => {
    if (state.senderRole === "customer") renderInvestigationPending();
    state.payload = await simulatorRequest("message", {
      chatId: currentChatId(),
      role: state.senderRole,
      text,
      attachments: state.senderRole === "customer" ? attachments : []
    });
    state.pendingFiles = [];
    elements.fileInput.value = "";
    elements.messageInput.value = "";
    renderFileTray();
    renderWorkspace();
  });
}

function setSenderRole(role) {
  state.senderRole = role === "agent" ? "agent" : "customer";
  const asAgent = state.senderRole === "agent";
  elements.sendAsCustomerBtn.dataset.active = String(!asAgent);
  elements.sendAsAgentBtn.dataset.active = String(asAgent);
  elements.replyModeLabel.dataset.mode = state.senderRole;
  elements.replyModeLabel.textContent = asAgent
    ? "Mensaje manual; la app no contestará de nuevo"
    : "La app analizará y responderá al cliente";
  elements.messageInput.placeholder = asAgent
    ? "Escribe la respuesta manual del agente..."
    : "Escribe como si fueras el cliente...";
  elements.messageInput.setAttribute("aria-label", asAgent ? "Mensaje del agente" : "Mensaje del cliente");
  elements.attachBtn.disabled = asAgent;
  elements.sendBtn.textContent = asAgent ? "Responder" : "Enviar";
  if (asAgent && state.pendingFiles.length) {
    state.pendingFiles = [];
    renderFileTray();
    setMessage(elements.conversationMessage, "Los adjuntos sólo se reciben en el modo Cliente.");
  }
}

function addFiles(fileList) {
  const accepted = [...(fileList || [])].filter((file) => {
    const allowed = ["image/jpeg", "image/png", "image/webp", "application/pdf"].includes(file.type);
    return allowed && file.size <= 10 * 1024 * 1024;
  });
  for (const file of accepted) {
    if (state.pendingFiles.length >= 6) break;
    const key = fileKey(file);
    if (state.pendingFiles.some((item) => fileKey(item) === key)) continue;
    state.pendingFiles.push(file);
    if (file.type.startsWith("image/") && !state.localPreviews.has(key)) {
      state.localPreviews.set(key, URL.createObjectURL(file));
    }
  }
  elements.fileInput.value = "";
  renderFileTray();
}

function renderFileTray() {
  elements.fileTray.hidden = state.pendingFiles.length === 0;
  elements.fileTray.innerHTML = state.pendingFiles.map((file, index) => {
    const preview = state.localPreviews.get(fileKey(file));
    return `<div class="file-token">
      ${preview ? `<img src="${escapeAttribute(preview)}" alt="Vista previa de ${escapeHtml(file.name)}">` : ""}
      <strong>${escapeHtml(file.name)}</strong>
      <span>${formatBytes(file.size)}</span>
      <button type="button" data-remove-file="${index}" aria-label="Quitar ${escapeAttribute(file.name)}">×</button>
    </div>`;
  }).join("");
  elements.fileTray.querySelectorAll("[data-remove-file]").forEach((button) => {
    button.addEventListener("click", () => {
      state.pendingFiles.splice(Number(button.dataset.removeFile), 1);
      renderFileTray();
    });
  });
}

async function reviewEvidence() {
  const attachmentIds = [...elements.evidenceList.querySelectorAll("input:checked")].map((item) => item.value);
  if (!attachmentIds.length) return;
  elements.reviewEvidenceBtn.disabled = true;
  try {
    state.payload = await simulatorRequest("evidence-review", { chatId: currentChatId(), attachmentIds });
    renderWorkspace();
    setMessage(elements.conversationMessage, "La evidencia quedó marcada como revisada.", "success");
  } catch (error) {
    setMessage(elements.conversationMessage, humanError(error.message), "error");
  }
}

async function recordKycReview(status) {
  const label = status === "complete" ? "KYC actualizado" : "KYC pendiente";
  elements.kycCompleteBtn.disabled = true;
  elements.kycIncompleteBtn.disabled = true;
  try {
    state.payload = await simulatorRequest("kyc-review", { chatId: currentChatId(), status });
    renderWorkspace();
    setMessage(elements.conversationMessage, `${label} por confirmación humana.`, "success");
  } catch (error) {
    setMessage(elements.conversationMessage, humanError(error.message), "error");
    renderEvidence(state.payload?.case?.evidenceItems || []);
  }
}

async function proposeAction() {
  elements.proposeBtn.disabled = true;
  setMessage(elements.actionMessage, "Validando propuesta...");
  try {
    state.payload = await simulatorRequest("action-propose", {
      chatId: currentChatId(),
      actionType: elements.actionType.value,
      target: elements.actionTarget.value.trim(),
      text: elements.actionText.value.trim()
    });
    renderWorkspace();
    setMessage(elements.actionMessage, "Propuesta creada. Revisa y aprueba antes de ejecutar.", "success");
  } catch (error) {
    setMessage(elements.actionMessage, humanError(error.message), "error");
  } finally {
    renderAction();
  }
}

async function approveAction() {
  const proposalId = state.payload?.action?.proposalId;
  if (!proposalId) return;
  elements.approveBtn.disabled = true;
  try {
    state.payload = await simulatorRequest("action-approve", { proposalId });
    renderWorkspace();
    setMessage(elements.actionMessage, "Acción aprobada. Aún no se ha enviado nada.", "success");
  } catch (error) {
    setMessage(elements.actionMessage, humanError(error.message), "error");
  }
}

async function executeAction() {
  const proposalId = state.payload?.action?.proposalId;
  if (!proposalId) return;
  elements.executeBtn.disabled = true;
  setMessage(elements.actionMessage, "Ejecutando y comprobando el resultado...");
  try {
    state.payload = await simulatorRequest("action-execute", {
      proposalId,
      pin: elements.executionPin.value.trim(),
      confirmation: elements.executionConfirmation.value.trim()
    });
    elements.executionPin.value = "";
    renderWorkspace();
    const verified = state.payload?.result?.verified === true;
    setMessage(elements.actionMessage, verified ? "Acción ejecutada y verificada." : "La acción no quedó verificada.", verified ? "success" : "error");
  } catch (error) {
    setMessage(elements.actionMessage, humanError(error.message), "error");
  } finally {
    renderAction();
  }
}

async function runConversationTask(message, task) {
  setBusy(true, message);
  setMessage(elements.conversationMessage, message);
  try {
    await task();
    setMessage(
      elements.conversationMessage,
      state.senderRole === "agent"
        ? "Mensaje manual agregado a la conversación."
        : "La app respondió con los datos disponibles.",
      "success"
    );
  } catch (error) {
    setMessage(elements.conversationMessage, humanError(error.message), "error");
    if (error.message === "case_action_already_active" && error.payload?.action) {
      state.payload = { ...state.payload, action: error.payload.action };
      renderAction();
    }
  } finally {
    setBusy(false);
  }
}

function renderWorkspace() {
  if (!state.payload?.case) return;
  state.capabilities = state.payload.capabilities || state.capabilities;
  const supportCase = state.payload.case;
  elements.conversationCustomer.textContent = supportCase.customer.name || "Cliente sin nombre";
  elements.conversationIdentity.textContent = [supportCase.customer.email, supportCase.customer.authId ? `ID ${supportCase.customer.authId}` : ""].filter(Boolean).join(" · ");
  elements.caseState.textContent = humanState(supportCase.state);
  elements.caseRevision.textContent = `R${supportCase.revision || 0}`;
  elements.workflowLabel.textContent = [humanWorkflow(supportCase.workflow?.id), supportCase.nextAction?.message].filter(Boolean).join(" · ");
  renderTranscript(supportCase.transcript || []);
  renderInvestigationTrace(supportCase.investigationTrace || []);
  renderAiUsage(supportCase.aiUsage || {});
  renderSources(supportCase.systemFacts || {});
  renderEvidence(supportCase.evidenceItems || []);
  renderAnalysis();
  renderAction();
}

function renderInvestigationPending() {
  const labels = ["Validando identidad", "Clasificando solicitud", "Consultando Jira", "Consultando Slack Lista 8", "Consultando Atena", "Consultando KYC", "Consultando manual operativo", "Eligiendo ruta", "Preparando siguiente paso"];
  elements.investigationTrace.innerHTML = labels.map((label, index) => `<li class="trace-step is-pending" style="--step-index:${index}">
    <span class="trace-marker" aria-hidden="true"></span>
    <div><strong>${escapeHtml(label)}</strong><p>${index < 2 ? "Procesando el mensaje recibido." : "Esperando resultado verificable."}</p></div>
  </li>`).join("");
}

function renderInvestigationTrace(steps) {
  if (!Array.isArray(steps) || !steps.length) return renderInvestigationPending();
  elements.investigationTrace.innerHTML = steps.map((step, index) => `<li class="trace-step is-${escapeAttribute(step.status || "waiting")}" style="--step-index:${index}">
    <span class="trace-marker" aria-hidden="true"></span>
    <div class="trace-copy">
      <div class="trace-title"><strong>${escapeHtml(step.title || "Paso")}</strong><span>${escapeHtml(humanTraceStatus(step.status))}</span></div>
      <p>${escapeHtml(step.detail || "Sin detalle.")}</p>
      <p class="trace-branch"><b>Entonces:</b> ${escapeHtml(step.branch || "Continuar con el expediente.")}</p>
    </div>
  </li>`).join("");
}

function renderAiUsage(usage) {
  elements.usageCalls.textContent = formatNumber(usage.calls);
  elements.usageInput.textContent = formatNumber(usage.inputTokens);
  elements.usageOutput.textContent = formatNumber(usage.outputTokens);
  elements.usageTotal.textContent = formatNumber(usage.totalTokens);
  elements.usageCost.textContent = `$${Number(usage.estimatedCostUsd || 0).toFixed(6)} USD`;
  const last = Array.isArray(usage.history) ? usage.history.at(-1) : null;
  elements.usageModel.textContent = last?.model
    ? `${last.model} · último uso ${formatNumber(last.totalTokens)} tokens`
    : "Aún no se ha consultado la IA.";
  if (!elements.usageBudget.value) {
    elements.usageBudget.value = localStorage.getItem("betxicoSimulatorAiBudgetUsd") || "";
  }
  updateUsageEstimate();
}

function updateUsageEstimate() {
  const budget = Math.max(0, Number(elements.usageBudget.value) || 0);
  const cost = Math.max(0, Number(state.payload?.case?.aiUsage?.estimatedCostUsd) || 0);
  if (elements.usageBudget.value) localStorage.setItem("betxicoSimulatorAiBudgetUsd", String(budget));
  if (!budget) {
    elements.usageEstimate.textContent = "Ingresa tu presupuesto para estimar conversaciones similares.";
    return;
  }
  if (!cost) {
    elements.usageEstimate.textContent = "La estimación aparecerá después de la primera respuesta de IA.";
    return;
  }
  const conversations = Math.floor(budget / cost);
  elements.usageEstimate.textContent = `Con $${budget.toFixed(2)} alcanzarían aproximadamente ${formatNumber(conversations)} conversaciones con este mismo consumo.`;
}

function renderTranscript(transcript) {
  elements.transcript.innerHTML = transcript.map((message) => `<div class="message-row" data-role="${escapeAttribute(message.role || "assistant")}">
    <article class="message-bubble">
      <span class="message-author">${message.role === "customer" ? "Cliente" : message.role === "agent" ? "Agente" : "App"}</span>
      ${message.text ? `<p>${escapeHtml(message.text)}</p>` : ""}
      ${(message.attachments || []).map((file) => `<div class="message-attachment">${escapeHtml(file.name || "Archivo")} · ${formatBytes(file.size)}</div>`).join("")}
      <time class="message-time">${formatTime(message.createdAt)}</time>
    </article>
  </div>`).join("");
  requestAnimationFrame(() => { elements.transcript.scrollTop = elements.transcript.scrollHeight; });
}

function renderSources(systemFacts) {
  renderRecordSource("jira", systemFacts.jira, elements.jiraCount, elements.jiraResults);
  renderRecordSource("slack", systemFacts.slack, elements.slackCount, elements.slackResults);
  const atena = systemFacts.atena;
  const withdrawal = atena?.data?.latestWithdrawal;
  elements.atenaStatus.textContent = withdrawal?.status || humanSourceStatus(atena?.status);
  elements.atenaResult.innerHTML = withdrawal
    ? `<div class="source-item"><div class="source-item-head"><strong>${escapeHtml(withdrawal.status || "Sin estado")}</strong><span class="record-status">Retiro más reciente</span></div><p>${escapeHtml([withdrawal.date, withdrawal.amount].filter(Boolean).join(" · ") || "Sin fecha o monto")}</p></div>${freshnessLine(atena)}`
    : emptySource(atena, atena?.status === "not_found" ? "No se encontró el cliente exacto en Atena." : "No se encontró un retiro en el periodo consultado o la consulta sigue pendiente.");
  const kyc = systemFacts.kyc;
  const kycReview = systemFacts.kycReview;
  const exactMatches = Number(kyc?.data?.exactMatches?.total || 0);
  const reviewRecord = kycReview?.data?.record;
  elements.kycStatus.textContent = exactMatches
    ? `${exactMatches} coincidencia${exactMatches === 1 ? "" : "s"}`
    : humanSourceStatus(kyc?.status);
  const automatic = exactMatches
    ? `<div class="source-item"><div class="source-item-head"><strong>${escapeHtml(humanKyc(kyc?.data?.overallStatus || "unknown"))}</strong><span class="record-status">Consulta KYC</span></div><p>Usuarios: ${Number(kyc?.data?.exactMatches?.users || 0)} · Verificaciones: ${Number(kyc?.data?.exactMatches?.verifications || 0)}</p></div>${freshnessLine(kyc)}`
    : emptySource(kyc, "No existe una coincidencia exacta o la consulta sigue pendiente.");
  const human = reviewRecord
    ? `<div class="source-item"><div class="source-item-head"><strong>${escapeHtml(humanKyc(reviewRecord.status))}</strong><span class="record-status">Revisión humana</span></div><p>Revisado ${escapeHtml(formatDate(reviewRecord.reviewedAt))}</p></div>${freshnessLine(kycReview)}`
    : "";
  elements.kycResult.innerHTML = automatic + human;
  renderKnowledgeSource(systemFacts.knowledge);
}

function renderKnowledgeSource(result) {
  const records = Array.isArray(result?.data?.records) ? result.data.records : [];
  elements.knowledgeCount.textContent = String(records.length);
  if (!records.length) {
    elements.knowledgeResults.innerHTML = emptySource(
      result,
      state.capabilities?.knowledgeEnabled === true
        ? "No se encontró una sección pertinente para este mensaje."
        : "El manual consultable está apagado en este entorno."
    );
    return;
  }
  elements.knowledgeResults.innerHTML = records.map((record) => `<article class="source-item knowledge-item">
    <div class="source-item-head"><strong>${escapeHtml(record.title || "Regla operativa")}</strong><span class="record-status">Guía</span></div>
    <p>${escapeHtml(record.review?.[0] || record.guidance?.[0] || record.avoid?.[0] || "Consulta el procedimiento antes de responder.")}</p>
  </article>`).join("") + `<p class="knowledge-warning">Orienta la respuesta; no confirma lo ocurrido en la cuenta.</p>${freshnessLine(result)}`;
}

function renderRecordSource(type, result, countElement, container) {
  const records = Array.isArray(result?.data?.records) ? result.data.records : [];
  countElement.textContent = String(records.length);
  if (!records.length) {
    container.innerHTML = emptySource(result, type === "jira" ? "No se encontró un ticket exacto." : "No hay un registro vigente en la caché.");
    return;
  }
  container.innerHTML = records.map((record) => {
    if (type === "jira") {
      return `<article class="source-item"><div class="source-item-head"><strong>${escapeHtml(record.ticketKey || "Ticket")}</strong><span class="record-status">${escapeHtml(record.status || "Sin estado")}</span></div><p>${escapeHtml(record.untrustedContent?.summary || record.untrustedContent?.description || "Sin detalle")}</p></article>`;
    }
    return `<article class="source-item"><div class="source-item-head"><strong>Lista 8</strong><span class="record-status">${escapeHtml(record.status || "Sin estado")}</span></div><p>${escapeHtml(record.untrustedContent?.reason || record.untrustedContent?.note || "Sin detalle")}</p></article>`;
  }).join("") + freshnessLine(result);
}

function emptySource(result, message) {
  return `<p class="source-empty"><strong>${escapeHtml(humanSourceStatus(result?.status))}</strong><br>${escapeHtml(message)}${result?.error?.code ? `<br>${escapeHtml(humanError(result.error.code))}` : ""}</p>${freshnessLine(result)}`;
}

function freshnessLine(result) {
  return result?.checkedAt ? `<p class="freshness">Consultado ${escapeHtml(formatDate(result.checkedAt))}</p>` : "";
}

function renderEvidence(items) {
  if (!items.length) {
    elements.evidenceList.innerHTML = '<p class="source-empty">Todavía no hay archivos en la conversación.</p>';
    elements.reviewEvidenceBtn.disabled = true;
    elements.kycCompleteBtn.disabled = true;
    elements.kycIncompleteBtn.disabled = true;
    return;
  }
  const reviews = state.payload.case.evidence?.reviews || {};
  const reviewedIds = new Set(state.payload.case.evidence?.reviewedAttachmentIds || []);
  elements.evidenceList.innerHTML = items.map((item) => {
    const reviewed = Boolean(reviews[item.id]?.reviewedAt || reviewedIds.has(item.id));
    const preview = findLocalPreview(item);
    return `<label class="evidence-item">
      <input type="checkbox" value="${escapeAttribute(item.id)}" ${reviewed ? "disabled" : ""}>
      <span><strong>${escapeHtml(item.name || "Archivo")}</strong><span>${escapeHtml(item.mimeType || item.kind || "archivo")} · ${formatBytes(item.size)}</span></span>
      <span class="evidence-side">
        ${preview ? `<img class="evidence-preview" src="${escapeAttribute(preview)}" alt="Vista previa">` : ""}
        <span class="evidence-state" data-reviewed="${reviewed}">${reviewed ? "Revisado" : "Pendiente"}</span>
      </span>
    </label>`;
  }).join("");
  elements.evidenceList.querySelectorAll("input").forEach((input) => input.addEventListener("change", updateReviewButton));
  updateReviewButton();
  updateKycReviewButtons();
}

function updateReviewButton() {
  elements.reviewEvidenceBtn.disabled = !elements.evidenceList.querySelector("input:checked");
}

function updateKycReviewButtons() {
  const evidence = state.payload?.case?.evidence || {};
  const received = Number(evidence.receivedCount || 0);
  const reviewed = Number(evidence.reviewedCount || 0);
  const decisionRoute = state.payload?.case?.nextAction?.type;
  const isKycCase = decisionRoute === "review_kyc" || state.payload?.case?.workflow?.id === "kyc_identity";
  elements.kycCompleteBtn.disabled = !isKycCase || !received || reviewed < received;
  elements.kycIncompleteBtn.disabled = !isKycCase;
}

function renderAnalysis() {
  const draft = state.payload?.draft;
  if (!draft) {
    elements.analysisTitle.textContent = "Sin análisis todavía";
    elements.analysisText.textContent = "Envía un mensaje para iniciar el análisis del caso.";
    elements.nextStepText.textContent = state.payload?.case?.nextAction?.message || "";
    elements.sourceChips.innerHTML = "";
    return;
  }
  elements.analysisTitle.textContent = humanWorkflow(draft.classification);
  elements.analysisText.textContent = draft.analysis || "El asistente no agregó una explicación.";
  elements.nextStepText.textContent = draft.nextStep || state.payload?.case?.nextAction?.message || "";
  elements.sourceChips.innerHTML = (draft.usedSources || []).map((source) => `<span class="source-chip">${escapeHtml(humanSource(source))}</span>`).join("");
  if (draft.suggestedAction && ["jira.comment", "slack.notify"].includes(draft.suggestedAction.actionType)) {
    elements.actionType.value = draft.suggestedAction.actionType;
    elements.actionTarget.value = draft.suggestedAction.target || "";
    elements.actionText.value = draft.suggestedAction.text || "";
    updateActionPlaceholder();
  }
}

function renderAction() {
  elements.actionPanel.hidden = state.capabilities?.realActionsEnabled !== true;
  if (elements.actionPanel.hidden) return;
  const action = state.payload?.action;
  const status = action?.status || "";
  elements.actionStatus.textContent = humanActionStatus(status);
  elements.actionStatus.dataset.status = status;
  const locked = ["proposed", "approved", "executing", "verification_pending"].includes(status);
  elements.actionType.disabled = locked;
  elements.actionTarget.disabled = locked;
  elements.actionText.disabled = locked;
  elements.proposeBtn.disabled = locked;
  elements.approveBtn.disabled = status !== "proposed";
  elements.executionGate.hidden = status !== "approved" && status !== "executing" && status !== "verification_pending";
  elements.executeBtn.disabled = !state.capabilities?.realActionsEnabled;
  if (action?.proposal?.payload) {
    elements.actionType.value = action.proposal.actionType;
    elements.actionTarget.value = action.proposal.payload.issueKey || action.proposal.payload.routeId || "";
    elements.actionText.value = stripSimulatorMarker(action.proposal.payload.body || action.proposal.payload.text || "");
  }
  if (!state.capabilities?.realActionsEnabled && !elements.executionGate.hidden) {
    setMessage(elements.actionMessage, "Las escrituras reales están apagadas en este preview.", "error");
  }
  updateActionPlaceholder();
}

function updateActionPlaceholder() {
  elements.actionTarget.placeholder = elements.actionType.value === "jira.comment" ? "BTF-1234" : "ruta-de-pruebas";
}

function setBusy(busy, label = "") {
  state.busy = busy;
  elements.conversationStatus.dataset.busy = String(busy);
  elements.sendBtn.disabled = busy;
  elements.refreshBtn.disabled = busy;
  elements.sendAsCustomerBtn.disabled = busy;
  elements.sendAsAgentBtn.disabled = busy;
  if (busy && label) elements.workflowLabel.textContent = label;
}

function showOnly(viewId) {
  for (const id of ["loginView", "accessDeniedView", "startView", "workspaceView"]) {
    elements[id].hidden = id !== viewId;
  }
}

function currentChatId() {
  const chatId = state.payload?.case?.chatId;
  if (!chatId) throw new Error("support_case_not_found");
  return chatId;
}

async function simulatorRequest(action, body = {}) {
  return request(`/api/support-simulator?action=${encodeURIComponent(action)}`, { method: "POST", body });
}

async function request(url, options = {}) {
  const requestOptions = { method: options.method || "GET", credentials: "same-origin", headers: {} };
  if (options.body !== undefined) {
    requestOptions.headers["content-type"] = "application/json";
    requestOptions.body = JSON.stringify(options.body);
  }
  const response = await fetch(url, requestOptions);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    const error = new Error(payload.error || `request_failed_${response.status}`);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }
  return payload;
}

function setMessage(element, message, tone = "") {
  element.textContent = message || "";
  element.dataset.tone = tone;
}

function humanError(code) {
  const errors = {
    invalid_login: "El correo o PIN no son correctos.",
    login_required: "Inicia sesión para continuar.",
    support_simulator_disabled: "El simulador privado está apagado en este entorno.",
    support_simulator_not_authorized: "Tu cuenta no está autorizada para este simulador.",
    simulator_same_origin_required: "La solicitud no proviene de esta página.",
    invalid_customer_email: "Ingresa un correo válido para el cliente.",
    support_case_not_found: "La conversación ya no está disponible. Inicia una nueva prueba.",
    case_action_already_active: "Hay una acción pendiente. Apruébala o ejecútala antes de continuar.",
    case_action_jira_ticket_not_verified: "El ticket indicado no aparece entre los resultados verificados de Jira.",
    case_action_verified_source_required: "Hace falta una fuente vigente antes de proponer esa acción.",
    case_action_evidence_review_pending: "Revisa los adjuntos antes de enviar el caso a Slack.",
    simulator_real_actions_disabled: "Las escrituras reales están apagadas.",
    simulator_confirmation_required: "Escribe la frase de confirmación exacta.",
    simulator_jira_target_not_allowed: "Ese ticket no está autorizado como destino de prueba.",
    simulator_slack_target_not_allowed: "Esa ruta de Slack no está autorizada para pruebas.",
    invalid_case_action_payload: "Completa el destino y el texto de la acción.",
    case_action_proposal_expired: "La propuesta venció. Inicia una nueva prueba.",
    case_action_revision_changed: "El expediente cambió después de aprobar. Genera una propuesta nueva.",
    simulator_agent_message_not_verified: "Ese mensaje afirma un resultado que aún no está respaldado por una fuente vigente.",
    missing_groq_api_key: "No está configurado el proveedor de IA en este entorno.",
    missing_openai_api_key: "No está configurado el proveedor de IA en este entorno.",
    slack_oauth_url_missing: "Slack no devolvió una dirección de acceso."
  };
  return errors[code] || String(code || "No fue posible completar la operación.").replaceAll("_", " ");
}

function humanState(value) {
  return ({ new: "Nuevo", identified: "Identificado", classified: "Clasificado", waiting_evidence: "Esperando evidencia", investigating: "Investigando", waiting_customer: "Esperando cliente", waiting_approval: "Esperando aprobación", escalated: "Escalado", resolved: "Resuelto" })[value] || "En análisis";
}

function humanWorkflow(value) {
  return ({ withdrawal: "Retiro", deposit: "Depósito", kyc: "Verificación KYC", account_access: "Acceso a cuenta", unknown: "Caso por identificar", sin_clasificar: "Caso por identificar" })[value] || String(value || "Caso por identificar").replaceAll("_", " ");
}

function humanSourceStatus(value) {
  return ({ available: "Disponible", not_found: "Sin coincidencias", stale: "Dato vencido", unavailable: "No disponible" })[value] || "Sin consultar";
}

function humanKyc(value) {
  return ({ complete: "KYC completo", incomplete: "KYC incompleto" })[value] || String(value || "Sin dato").replaceAll("_", " ");
}

function humanSource(value) {
  return ({ jira: "Jira", slack: "Slack", atena: "Atena", kyc: "KYC", kycReview: "KYC humano", knowledge: "Manual" })[value] || value;
}

function humanActionStatus(value) {
  return ({ proposed: "Propuesta", approved: "Aprobada", executing: "Ejecutando", verification_pending: "Verificación pendiente", verified: "Verificada", failed: "Fallida", rejected: "Rechazada" })[value] || "Sin propuesta";
}

function humanTraceStatus(value) {
  return ({ complete: "Completo", available: "Encontrado", not_found: "Sin coincidencia", stale: "Incompleto", unavailable: "No disponible", waiting: "En espera", active: "Ruta actual", replaced: "Sustituido" })[value] || "Procesando";
}

function formatNumber(value) {
  return new Intl.NumberFormat("es-MX").format(Math.max(0, Number(value) || 0));
}

function formatDate(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return "sin fecha";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}

function formatTime(value) {
  if (!value || !Number.isFinite(Date.parse(value))) return "";
  return new Intl.DateTimeFormat("es-MX", { hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function formatBytes(value) {
  const bytes = Number(value);
  if (!Number.isFinite(bytes) || bytes < 0) return "tamaño desconocido";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileKey(file) { return `${file.name}|${file.size}|${file.type}`; }
function findLocalPreview(item) {
  for (const [key, url] of state.localPreviews.entries()) {
    if (key.startsWith(`${item.name}|${item.size}|`)) return url;
  }
  return "";
}
function restoreLocalPreviews() { state.localPreviews = new Map(); }
function clearLocalPreviews() {
  for (const url of state.localPreviews.values()) URL.revokeObjectURL(url);
  state.localPreviews.clear();
}
function stripSimulatorMarker(value) { return String(value || "").replace(/^\[SIMULADOR CONTROLADO[^\]]*\]\s*/u, ""); }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>"']/gu, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]); }
function escapeAttribute(value) { return escapeHtml(value); }
