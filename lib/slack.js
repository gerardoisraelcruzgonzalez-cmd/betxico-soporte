import { optionalEnv } from "./http.js";
import { getSupportConfig } from "./remote-config.js";
import { getSlackUserToken } from "./slack-user-tokens.js";

const PANEL_CACHE_TTL_MS = 5 * 60 * 1000;

const DEFAULT_LIST_COLUMNS = {
  customerId: "",
  summary: "",
  issueType: "",
  priority: "",
  customerName: "",
  customerEmail: "",
  authId: "",
  trackingKey: "",
  amount: "",
  movementProof: "",
  chatId: "",
  livechatGroupId: "",
  jiraKey: "",
  jiraUrl: "",
  status: "",
  description: "",
  createdAt: "",
  reporter: "",
  agentName: "",
  game: ""
};

const REVIEW_TOPIC_LABELS = {
  OptH3VBLLXV: "REVISION FIRST",
  OptOXZP9XLK: "MONTO Y PRIMERA VEZ",
  OptTIDNF9UD: "COMPORTAMIENTO REPETITIVO",
  Opt0NZEY6T2: "GANANCIAS ALTAS EN SLOTS",
  Opt9NFDZA8G: "ROLL OVER INCOMPLETO",
  OptQSKWY63C: "REVISION TDC",
  OptXY0MX1IW: "REDUCCION DE SALDO X BONO",
  DEVWALLET: "DEVWALLET",
  OptPV5CMI20: "ADV BONO/JUEGOS",
  OptA8FQJJR1: "OTROS"
};

const APPROVAL_STATUS_LABELS = {
  OptW0ENCR8G: "APROBAR",
  Opt9HID4LD3: "CANCELAR",
  OptBDBL2BMY: "PEDIR DOCUMENTOS",
  OptRHLRZCFG: "ADVERTENCIA"
};

export async function sendSlackSupportNotification(report, jira) {
  const token = optionalEnv("SLACK_BOT_TOKEN");
  const route = await resolveSlackRoute(report);

  if (!token || (!route.channelId && !route.listId)) {
    return { ok: false, skipped: true, reason: "missing_slack_config" };
  }

  const result = {
    ok: true,
    routeId: route.id,
    routeName: route.name,
    channel: null,
    list: null,
    files: []
  };

  const shouldSendMessage = route.mode === "message" || route.mode === "both" || (!route.mode && route.channelId);
  const hasMappedListColumns = Object.values(route.listColumns || {}).some(Boolean);
  const shouldCreateListItem =
    !report.workflow?.messageOnly &&
    hasMappedListColumns &&
    (route.mode === "list" || route.mode === "both" || (!route.mode && route.listId));

  if (shouldSendMessage && route.channelId) {
    const userToken = await getSlackUserToken(report.accountSettings?.email || "").catch(() => "");
    const messageText = buildSlackText(report, jira, route);
    try {
      result.channel = await sendMessageToSlack({
        token: userToken || token,
        channelId: route.channelId,
        text: messageText,
        asUser: Boolean(userToken)
      });
    } catch (error) {
      if (!userToken) throw error;
      result.channel = await sendMessageToSlack({
        token,
        channelId: route.channelId,
        text: messageText,
        asUser: false,
        userFallback: error.message || "slack_user_post_failed"
      });
    }

    if (result.channel?.ts && Array.isArray(report.attachments) && report.attachments.length) {
      result.files = await uploadSlackThreadFiles({
        token,
        channelId: route.channelId,
        threadTs: result.channel.ts,
        attachments: report.attachments
      });
    }
  }

  if (shouldCreateListItem && route.listId) {
    result.list = await createSupportListItem({
      token,
      listId: route.listId,
      columns: route.listColumns,
      columnTypes: route.listColumnTypes,
      values: buildListValues(report, jira, route)
    });
  }

  return result;
}

export async function getSlackListSchema(listId) {
  const token = optionalEnv("SLACK_BOT_TOKEN");
  const cleanListId = String(listId || optionalEnv("SLACK_LIST_ID")).trim();

  if (!token || !cleanListId) {
    const error = new Error("missing_slack_config");
    error.statusCode = 500;
    throw error;
  }

  const itemList = await slackApiCall({
    token,
    method: "slackLists.items.list",
    body: {
      list_id: cleanListId,
      limit: "1"
    },
    encoding: "form"
  });

  if (!itemList.items?.length) {
    const error = new Error("slack_list_has_no_items");
    error.statusCode = 400;
    throw error;
  }

  const itemInfo = await slackApiCall({
    token,
    method: "slackLists.items.info",
    body: {
      list_id: cleanListId,
      id: itemList.items[0].id
    },
    encoding: "form"
  });

  const schema = itemInfo.list?.list_metadata?.schema || [];
  return {
    listId: cleanListId,
    columns: detectColumnsFromSchema(schema),
    rawColumns: schema.map((column) => ({
      id: column.id,
      name: column.name || "",
      key: column.key || "",
      type: column.type || ""
    }))
  };
}

export async function getSlackListPanelItems(panelId, options = {}) {
  const token = optionalEnv("SLACK_BOT_TOKEN");
  const config = await getSupportConfig();
  const panel = (config.listPanels || []).find((item) => item.id === String(panelId || "").trim() && item.enabled !== false);

  if (!token || !panel?.listId) {
    const error = new Error("missing_slack_config");
    error.statusCode = 500;
    throw error;
  }

  const itemLimit = resolvePanelLimit(options.limit, panel.limit);
  let baseItems = [];
  let stale = false;
  let warning = "";

  try {
    const readLimit = resolveReadLimit(panel, itemLimit, options);
    if (hasPanelSearch(options)) {
      baseItems = await searchSlackListPanelItems({
        token,
        panel,
        listId: panel.listId,
        options,
        itemLimit,
        readLimit
      });
    } else {
      const rawItems = await fetchSlackListItems({
        token,
        listId: panel.listId,
        maxItems: readLimit
      });
      const hydratedItems = await hydrateSlackListItems({ token, listId: panel.listId, items: rawItems });
      baseItems = hydratedItems
        .map((item) => mapSlackListPanelItem(item, panel.columns || {}))
        .filter((item) => matchesPanelFilter(item, panel.filter || {}))
        .sort(comparePanelItemsByDate);
      await setPanelCache(panel.id, baseItems).catch(() => null);
    }
  } catch (error) {
    if (!isSlackRateLimited(error)) throw error;
    const cached = await getPanelCache(panel.id).catch(() => null);
    baseItems = Array.isArray(cached?.items) ? cached.items : [];
    stale = Boolean(baseItems.length);
    warning = stale ? "slack_rate_limited_cached" : "slack_rate_limited";
  }

  const mappedItems = baseItems
    .filter((item) => matchesEmailSearch(item, options.email))
    .filter((item) => matchesPanelQuery(item, options.query))
    .slice(0, itemLimit);

  return {
    panel: {
      id: panel.id,
      label: panel.label,
      limit: panel.limit,
      email: String(options.email || "").trim(),
      query: String(options.query || "").trim(),
      stale,
      warning
    },
    items: mappedItems,
    warning
  };
}

function resolveReadLimit(panel, itemLimit, options) {
  const configured = Number(panel.readLimit || 250);
  if (hasPanelSearch(options)) return Math.max(configured, itemLimit);
  return Math.max(configured, itemLimit);
}

function hasPanelSearch(options = {}) {
  return Boolean(String(options.email || options.query || "").trim());
}

function resolvePanelLimit(requestedLimit, fallbackLimit) {
  const parsed = Number.parseInt(String(requestedLimit || ""), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackLimit;
  }
  return Math.min(parsed, 1000);
}

async function fetchSlackListItems({ token, listId, maxItems }) {
  const items = [];
  let cursor = "";
  let page = 0;

  while (items.length < maxItems && page < 10) {
    const body = {
      list_id: listId,
      limit: String(Math.min(100, maxItems - items.length))
    };
    if (cursor) body.cursor = cursor;

    const itemList = await slackApiCall({
      token,
      method: "slackLists.items.list",
      body,
      encoding: "form"
    });

    const pageItems = Array.isArray(itemList.items) ? itemList.items : [];
    items.push(...pageItems);
    cursor = readSlackCursor(itemList);
    page += 1;
    if (!cursor || !pageItems.length) break;
  }

  return items.slice(0, maxItems);
}

async function searchSlackListPanelItems({ token, panel, listId, options, itemLimit, readLimit }) {
  const matches = [];
  let cursor = "";
  let scanned = 0;
  let page = 0;

  while (scanned < readLimit && page < 12 && matches.length < itemLimit) {
    const pageLimit = Math.min(100, readLimit - scanned);
    const body = {
      list_id: listId,
      limit: String(pageLimit)
    };
    if (cursor) body.cursor = cursor;

    const itemList = await slackApiCall({
      token,
      method: "slackLists.items.list",
      body,
      encoding: "form"
    });

    const pageItems = Array.isArray(itemList.items) ? itemList.items : [];
    scanned += pageItems.length;
    page += 1;
    if (!pageItems.length) break;

    const hydratedItems = await hydrateSlackListItems({ token, listId, items: pageItems });
    const pageMatches = hydratedItems
      .map((item) => mapSlackListPanelItem(item, panel.columns || {}))
      .filter((item) => matchesPanelFilter(item, panel.filter || {}))
      .filter((item) => matchesEmailSearch(item, options.email))
      .filter((item) => matchesPanelQuery(item, options.query));

    matches.push(...pageMatches);
    cursor = readSlackCursor(itemList);
    if (!cursor) break;
  }

  return matches.sort(comparePanelItemsByDate).slice(0, itemLimit);
}

async function hydrateSlackListItems({ token, listId, items }) {
  const hydrated = [];
  const batchSize = 6;

  for (let index = 0; index < items.length; index += batchSize) {
    const batch = items.slice(index, index + batchSize);
    const results = await Promise.all(batch.map((item) => hydrateSlackListItem({ token, listId, item })));
    hydrated.push(...results);
  }

  return hydrated;
}

function readSlackCursor(data) {
  return String(
    data?.response_metadata?.next_cursor ||
    data?.next_cursor ||
    data?.cursor ||
    ""
  ).trim();
}

async function resolveSlackRoute(report) {
  const routes = await loadSlackRoutes();
  const fallback = buildFallbackRoute();
  const candidates = routes.length ? routes : [fallback].filter(Boolean);
  const workflowRouteId = String(report.workflow?.slackRouteId || "").trim();
  if (workflowRouteId) {
    const exactRoute = candidates.find((route) => route.id === workflowRouteId);
    if (exactRoute) {
      return normalizeRoute(exactRoute);
    }

    const error = new Error("slack_route_not_configured");
    error.statusCode = 400;
    throw error;
  }

  let best = null;
  let bestScore = -1;

  for (const route of candidates) {
    const score = scoreRoute(route, report);
    if (score > bestScore) {
      best = route;
      bestScore = score;
    }
  }

  return normalizeRoute(best || fallback || {});
}

async function hydrateSlackListItem({ token, listId, item }) {
  if (Array.isArray(item?.fields) && item.fields.length) return item;
  const itemId = item?.id || item?.item_id || item?.row_id;
  if (!itemId) return item;

  const itemInfo = await slackApiCall({
    token,
    method: "slackLists.items.info",
    body: {
      list_id: listId,
      id: itemId
    },
    encoding: "form"
  }).catch(() => null);

  return itemInfo?.item || itemInfo?.list_item || itemInfo?.list?.item || item;
}

function mapSlackListPanelItem(item, columns) {
  const fields = item?.fields || item?.record || item?.cells || [];
  const reviewTopicValue = getColumnRawValue(fields, columns.reviewTopic);
  const approvalStatusValue = getColumnRawValue(fields, columns.approvalStatus);
  const values = {
    id: String(item?.id || item?.item_id || item?.row_id || "").trim(),
    email: getColumnDisplayValue(fields, columns.email),
    authId: getColumnDisplayValue(fields, columns.authId),
    reviewTopic: REVIEW_TOPIC_LABELS[reviewTopicValue] || getColumnDisplayValue(fields, columns.reviewTopic),
    reviewTopicValue,
    amount: getColumnDisplayValue(fields, columns.amount),
    detail: getColumnDisplayValue(fields, columns.detail),
    withdrawalClabe: getColumnDisplayValue(fields, columns.withdrawalClabe),
    assignedPerson: getColumnDisplayValue(fields, columns.assignedPerson),
    approvalStatus: APPROVAL_STATUS_LABELS[approvalStatusValue] || getColumnDisplayValue(fields, columns.approvalStatus),
    jiraKey: getColumnDisplayValue(fields, columns.jiraKey),
    jiraUrl: getColumnDisplayValue(fields, columns.jiraUrl),
    validas: getColumnDisplayValue(fields, columns.validas),
    noPasan: getColumnDisplayValue(fields, columns.noPasan),
    total: getColumnDisplayValue(fields, columns.total),
    kycCompleto: getColumnDisplayValue(fields, columns.kycCompleto),
    updatedAt: readSlackItemDate(item) || normalizeSlackDate(getColumnDisplayValue(fields, columns.createdAt))
  };

  return {
    ...values,
    title: values.authId || values.email || values.jiraKey || values.id || "Registro Slack",
    withdrawalClabe: values.withdrawalClabe || extractClabeFromText(values.detail),
    detail: values.detail || "Sin detalle capturado"
  };
}

function extractClabeFromText(value) {
  const text = String(value || "");
  const labeled = text.match(/(?:clabe|cuenta)\s*(?:retiro|destino)?\D{0,40}(\d[\d\s-]{16,30}\d)/i);
  const direct = normalizeClabe(labeled?.[1] || "");
  if (direct) return direct;

  return "";
}

function normalizeClabe(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 18 ? digits : "";
}

function matchesPanelFilter(item, filter) {
  const reviewTopic = normalizeMatchValue(item.reviewTopic);
  const reviewTopicValue = normalizeMatchValue(item.reviewTopicValue);
  const filterTopic = normalizeMatchValue(filter.reviewTopic);
  const filterTopicValue = normalizeMatchValue(filter.reviewTopicValue);
  const search = normalizeMatchValue(filter.search);

  const topicFilters = [filterTopic, filterTopicValue].filter(Boolean);
  if (topicFilters.length && !topicFilters.some((value) => reviewTopic.includes(value) || reviewTopicValue === value)) {
    return false;
  }
  if (!search) return true;

  const searchable = normalizeMatchValue(Object.values(item).join(" "));
  return searchable.includes(search);
}

function matchesEmailSearch(item, email) {
  const cleanEmail = normalizeEmailSearch(email);
  if (!cleanEmail) return true;
  return normalizeEmailSearch(item.email).includes(cleanEmail);
}

function matchesPanelQuery(item, query) {
  const cleanQuery = normalizeMatchValue(query);
  if (!cleanQuery) return true;
  return normalizeMatchValue(Object.values(item).join(" ")).includes(cleanQuery);
}

function normalizeEmailSearch(value) {
  return String(value || "").trim().toLowerCase();
}

function comparePanelItemsByDate(first, second) {
  const firstTime = Date.parse(first.updatedAt || "");
  const secondTime = Date.parse(second.updatedAt || "");
  const firstValue = Number.isFinite(firstTime) ? firstTime : 0;
  const secondValue = Number.isFinite(secondTime) ? secondTime : 0;
  if (secondValue !== firstValue) return secondValue - firstValue;
  return String(second.id || "").localeCompare(String(first.id || ""));
}

function getColumnDisplayValue(fields, columnId) {
  const field = getFieldByColumnId(fields, columnId);
  if (!field) return "";
  return readFieldDisplayValue(field);
}

function getColumnRawValue(fields, columnId) {
  const field = getFieldByColumnId(fields, columnId);
  if (!field) return "";
  return [
    field.value,
    field.text,
    Array.isArray(field.select) ? field.select[0] : "",
    Array.isArray(field.option) ? field.option[0] : ""
  ].map((value) => String(value || "").trim()).find(Boolean) || "";
}

function getFieldByColumnId(fields, columnId) {
  if (!columnId) return null;
  const cleanColumnId = String(columnId).trim();
  const list = Array.isArray(fields) ? fields : Object.values(fields || {});
  return list.find((field) => {
    const keys = [field?.column_id, field?.columnId, field?.id, field?.key];
    return keys.some((key) => String(key || "").trim() === cleanColumnId);
  }) || null;
}

function readFieldDisplayValue(field) {
  if (field.text) return String(field.text).trim();
  if (field.value != null && typeof field.value !== "object") return String(field.value).trim();
  if (Array.isArray(field.email) && field.email[0]) return String(field.email[0]).trim();
  if (Array.isArray(field.number) && field.number[0] != null) return String(field.number[0]).trim();
  if (Array.isArray(field.date) && field.date[0]) return String(field.date[0]).trim();
  if (Array.isArray(field.timestamp) && field.timestamp[0]) return formatSlackTimestamp(field.timestamp[0]);
  if (Array.isArray(field.user) && field.user[0]) return String(field.user[0]).trim();
  if (Array.isArray(field.select) && field.select[0]) return String(field.select[0]).trim();
  if (Array.isArray(field.checkbox) && field.checkbox.length) return field.checkbox[0] ? "Si" : "No";
  if (typeof field.checked === "boolean") return field.checked ? "Si" : "No";
  if (Array.isArray(field.link) && field.link[0]) return field.link[0].url || field.link[0].text || "";
  if (Array.isArray(field.rich_text)) return readRichText(field.rich_text);
  return "";
}

function readRichText(blocks) {
  return JSON.stringify(blocks)
    .match(/"text":"([^"]+)"/g)
    ?.map((part) => part.replace(/^"text":"|"$|\\/g, ""))
    .join(" ")
    .trim() || "";
}

function readSlackItemDate(item) {
  const value = item?.created_at || item?.createdAt || item?.updated_at || item?.updatedAt || item?.date_updated || "";
  if (!value) return "";
  if (/^\d+$/.test(String(value))) {
    const number = Number(value);
    return new Date(number > 100000000000 ? number : number * 1000).toISOString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function normalizeSlackDate(value) {
  if (!value) return "";
  const number = Number(value);
  if (Number.isFinite(number)) {
    return new Date(number > 100000000000 ? number : number * 1000).toISOString();
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function formatSlackTimestamp(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "";
  return new Date(number > 100000000000 ? number : number * 1000).toISOString();
}

async function loadSlackRoutes() {
  const config = await getSupportConfig().catch(() => null);
  if (config?.slackRoutes?.length) {
    return config.slackRoutes.map(normalizeRoute).filter((route) => route.channelId || route.listId);
  }

  const raw = optionalEnv("SLACK_ROUTES_JSON");
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    const routes = Array.isArray(parsed) ? parsed : parsed.routes;
    return Array.isArray(routes) ? routes.map(normalizeRoute).filter((route) => route.channelId || route.listId) : [];
  } catch {
    return [];
  }
}

function buildFallbackRoute() {
  const channelId = optionalEnv("SLACK_CHANNEL_ID");
  const listId = optionalEnv("SLACK_LIST_ID");
  if (!channelId && !listId) return null;

  return normalizeRoute({
    id: "default",
    name: "Soporte",
    mode: channelId && listId ? "both" : listId ? "list" : "message",
    channelId,
    listId,
    listColumns: parseJsonEnv("SLACK_LIST_COLUMNS_JSON", DEFAULT_LIST_COLUMNS),
    listColumnTypes: parseJsonEnv("SLACK_LIST_COLUMN_TYPES_JSON", {})
  });
}

function normalizeRoute(route = {}) {
  return {
    id: String(route.id || route.name || "default").trim(),
    name: String(route.name || route.id || "Soporte").trim(),
    mode: String(route.mode || "").trim().toLowerCase(),
    channelId: String(route.channelId || route.channel || "").trim(),
    listId: String(route.listId || route.list || "").trim(),
    listColumns: {
      ...DEFAULT_LIST_COLUMNS,
      ...(route.listColumns || route.columns || {})
    },
    listColumnTypes: route.listColumnTypes || route.columnTypes || {},
    match: route.match || {}
  };
}

function scoreRoute(route, report) {
  const match = route.match || {};
  let score = 0;
  const issueTypeId = normalizeMatchValue(report.ticket.issueTypeId);
  const issueType = normalizeMatchValue(report.ticket.issueType);
  const priority = normalizeMatchValue(report.ticket.priority);
  const groupId = normalizeMatchValue(report.livechat.groupId);
  const labels = (report.ticket.labels || []).map(normalizeMatchValue);
  const workflowId = normalizeMatchValue(report.workflow?.id);

  if (matchesAny(match.workflowIds, workflowId)) score += 60;
  if (matchesAny(match.issueTypeIds, issueTypeId)) score += 50;
  if (matchesAny(match.issueTypes, issueType)) score += 40;
  if (matchesAny(match.groupIds, groupId)) score += 30;
  if (matchesAny(match.priorities, priority)) score += 10;
  if (Array.isArray(match.labels) && match.labels.some((label) => labels.includes(normalizeMatchValue(label)))) {
    score += 10;
  }

  if (!Object.keys(match).length) score += 1;
  return score;
}

function matchesAny(values, target) {
  if (!Array.isArray(values) || !target) return false;
  return values.map(normalizeMatchValue).includes(target);
}

function normalizeMatchValue(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function sendMessageToSlack({ token, channelId, text, asUser = false, userFallback = "" }) {
  const data = await slackApiCall({
    token,
    method: "chat.postMessage",
    body: {
      channel: channelId,
      text
    },
    encoding: "json"
  });

  return {
    ok: true,
    asUser,
    userFallback,
    channel: data.channel,
    ts: data.ts
  };
}

async function uploadSlackThreadFiles({ token, channelId, threadTs, attachments }) {
  const safeAttachments = Array.isArray(attachments) ? attachments.filter(Boolean).slice(0, 6) : [];
  const uploaded = [];

  for (const attachment of safeAttachments) {
    const filename = sanitizeFilename(attachment.filename || attachment.name || "evidencia");
    const contentType = String(attachment.contentType || attachment.type || "application/octet-stream").trim();
    const dataBase64 = String(attachment.dataBase64 || "").trim();
    if (!dataBase64) continue;

    const bytes = Buffer.from(dataBase64, "base64");
    const upload = await slackApiCall({
      token,
      method: "files.getUploadURLExternal",
      body: {
        filename,
        length: String(bytes.length)
      },
      encoding: "form"
    });

    const uploadResponse = await fetch(upload.upload_url, {
      method: "POST",
      headers: {
        "Content-Type": contentType
      },
      body: bytes
    });
    if (!uploadResponse.ok) {
      const error = new Error(`slack_file_upload_http_${uploadResponse.status}`);
      error.statusCode = uploadResponse.status;
      throw error;
    }

    const complete = await slackApiCall({
      token,
      method: "files.completeUploadExternal",
      body: {
        channel_id: channelId,
        thread_ts: threadTs,
        files: [
          {
            id: upload.file_id,
            title: filename
          }
        ],
        initial_comment: "Evidencia del depósito no reflejado"
      },
      encoding: "json"
    });

    uploaded.push({
      id: upload.file_id,
      filename,
      ok: Boolean(complete.ok)
    });
  }

  return uploaded;
}

async function createSupportListItem({ token, listId, columns, columnTypes, values }) {
  const initialFields = buildListFields({ columns, columnTypes, values, includeOptional: false });
  let createdItem = null;
  let shouldBackfillPrimaryFields = false;

  try {
    createdItem = await createSlackListItem({ token, listId, initialFields });
  } catch (error) {
    if (error.message !== "list_not_found") {
      throw error;
    }
    createdItem = await createSlackListItem({ token, listId, initialFields: [] });
    shouldBackfillPrimaryFields = true;
  }

  const rowId = createdItem?.item?.id;
  if (!rowId) {
    throw new Error("slack_row_not_created");
  }

  const updateFields = [
    ...(shouldBackfillPrimaryFields ? initialFields : []),
    ...buildListFields({ columns, columnTypes, values, includeOptional: true })
  ];
  const optionalUpdates = updateFields
    .map((field) => ({ ...field, row_id: rowId }));

  await applyListCellUpdates({ token, listId, updates: optionalUpdates });

  return {
    ok: true,
    listId,
    rowId
  };
}

async function createSlackListItem({ token, listId, initialFields }) {
  const body = { list_id: listId };
  if (initialFields.length) {
    body.initial_fields = initialFields;
  }

  return slackApiCall({
    token,
    method: "slackLists.items.create",
    body,
    encoding: "form"
  });
}

async function applyListCellUpdates({ token, listId, updates }) {
  for (const cell of updates) {
    if (!cell) continue;
    await slackApiCall({
      token,
      method: "slackLists.items.update",
      body: {
        list_id: listId,
        fields: [cell]
      },
      encoding: "form"
    });
  }
}

function buildListFields({ columns, columnTypes, values, includeOptional }) {
  const primaryKeys = ["customerId", "customerEmail", "trackingKey", "amount", "description"];
  const keys = Object.keys(DEFAULT_LIST_COLUMNS).filter((key) =>
    includeOptional ? !primaryKeys.includes(key) : primaryKeys.includes(key)
  );

  return keys
    .map((key) => buildListFieldForKey({ key, columnId: columns[key], columnTypes, value: values[key] }))
    .filter(Boolean);
}

function buildListFieldForKey({ key, columnId, columnTypes, value }) {
  if (!columnId || value == null || String(value).trim() === "") return null;
  const columnType = columnTypes[columnId] || inferListColumnType(key);
  return buildListField(columnId, columnType, value);
}

function buildListField(columnId, columnType, rawValue) {
  const value = String(rawValue).trim();
  const base = { column_id: columnId };

  switch (columnType) {
    case "email":
      return { ...base, email: [value] };
    case "number": {
      const number = parseSlackNumber(value);
      return number == null ? null : { ...base, number: [number] };
    }
    case "date":
    case "todo_due_date":
      return { ...base, date: [value] };
    case "timestamp":
      return { ...base, timestamp: [Math.floor(Date.now() / 1000)] };
    case "attachment":
      return /^F[A-Z0-9]+$/.test(value) ? { ...base, attachment: [value] } : null;
    case "reference":
      return /^F[A-Z0-9]+$/.test(value)
        ? {
            ...base,
            reference: [
              {
                file: {
                  file_id: value
                }
              }
            ]
          }
        : null;
    case "link":
      return /^https?:\/\//i.test(value)
        ? {
            ...base,
            link: [
              {
                url: value,
                text: value
              }
            ]
          }
        : null;
    case "user":
    case "users":
    case "member":
    case "members":
    case "person":
    case "people":
    case "todo_assignee":
      return /^U[A-Z0-9]+$/.test(value) ? { ...base, user: [value] } : null;
    case "select":
      return /^Opt/i.test(value) ? { ...base, select: [value] } : null;
    case "text":
    case "rich_text":
    default:
      return { ...base, rich_text: buildRichText(value) };
  }
}

function inferListColumnType(key) {
  if (key === "customerEmail") return "email";
  if (key === "createdAt") return "date";
  if (key === "amount") return "number";
  if (key === "agentName") return "text";
  if (key === "status") return "text";
  return "text";
}

function buildListValues(report, jira, route) {
  const fieldText = readJiraFieldText(report.jiraFields || {});
  const slackFields = report.slackFields || {};
  const agentName = slackFields.agentName || report.accountSettings?.displayName || report.accountSettings?.email || route.name;
  return {
    customerId: slackFields.customerId || report.customer.authId || readFieldByHints(fieldText, ["id", "cliente", "auth"]),
    summary: report.ticket.summary,
    issueType: report.ticket.issueType,
    priority: report.ticket.priority,
    customerName: report.customer.name,
    customerEmail: slackFields.customerEmail || report.customer.email,
    game: slackFields.game,
    authId: slackFields.customerId || report.customer.authId,
    trackingKey: slackFields.trackingKey || readFieldByHints(fieldText, ["clave de rastreo", "rastreo", "spei"]),
    amount: slackFields.amount || readFieldByHints(fieldText, ["monto", "importe", "cantidad"]),
    movementProof: report.ticket.amplifyUrl || readFieldByHints(fieldText, ["cep", "captura", "movimiento", "comprobante"]),
    chatId: report.livechat.chatId,
    livechatGroupId: report.livechat.groupId,
    jiraKey: jira?.key,
    jiraUrl: jira?.url,
    status: "Nuevo",
    description: slackFields.detail || report.ticket.description,
    createdAt: formatCurrentLocalDate(),
    reporter: report.accountSettings?.email || report.accountSettings?.jiraEmail || route.name,
    agentName
  };
}

function buildSlackText(report, jira, route) {
  if (report.workflow?.slackTemplate === "session-close" || route.id === "cierre-sesiones") {
    const slackFields = report.slackFields || {};
    return [
      "CIERRE DE SESIONES",
      `JUEGO:${slackFields.game || ""}`,
      `ID:${slackFields.customerId || report.customer.authId || ""}`,
      `CORREO:${slackFields.customerEmail || report.customer.email || ""}`
    ].join("\n");
  }

  if (isDepositRoute(report, route)) {
    const slackFields = report.slackFields || {};
    return [
      "💸 DEPOSITO NO REFLEJADO 💸",
      `AGENTE:${slackFields.agentName || report.accountSettings?.displayName || report.accountSettings?.email || ""}`,
      `ID:${slackFields.customerId || report.customer.authId || ""}`,
      `CORREO:${slackFields.customerEmail || report.customer.email || ""}`,
      `CLAVE DE RASTREO:${slackFields.trackingKey || ""}`,
      `MONTO:$${formatSlackAmount(slackFields.amount)}`
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    `Nuevo caso de soporte: ${report.ticket.summary}`,
    `Ruta: ${route.name}`,
    `Tipo: ${report.ticket.issueType || "Sin tipo"}`,
    `Prioridad: ${report.ticket.priority || "Media"}`,
    `Cliente: ${report.customer.name || "Sin nombre"} <${report.customer.email || "sin correo"}>`,
    report.customer.authId ? `AUTH ID: ${report.customer.authId}` : "",
    `LiveChat: ${report.livechat.chatId || "Sin chat ID"}`,
    report.livechat.groupId ? `Grupo LiveChat: ${report.livechat.groupId}` : "",
    jira?.url ? `Jira: ${jira.url}` : ""
  ]
    .filter(Boolean)
    .join("\n");
}

function formatSlackAmount(value) {
  const clean = String(value || "").trim().replace(/^\$+/, "");
  return clean;
}

function sanitizeFilename(value) {
  return String(value || "evidencia")
    .trim()
    .replace(/[^\w.\- ()]/g, "_")
    .slice(0, 120) || "evidencia";
}

function isDepositRoute(report, route) {
  const values = [
    route.id,
    route.name,
    report.workflow?.id,
    report.workflow?.label,
    report.workflow?.slackTemplate,
    report.ticket.issueType,
    report.ticket.summary
  ].map(normalizeMatchValue);
  return values.some((value) => value.includes("deposito no reflejado"));
}

async function slackApiCall({ token, method, body, encoding, attempt = 1 }) {
  const headers = {
    Authorization: `Bearer ${token}`
  };

  const requestInit = {
    method: "POST",
    headers
  };

  if (encoding === "json") {
    headers["Content-Type"] = "application/json; charset=utf-8";
    requestInit.body = JSON.stringify(body);
  } else {
    headers["Content-Type"] = "application/x-www-form-urlencoded; charset=utf-8";
    requestInit.body = new URLSearchParams(flattenBody(body));
  }

  const response = await fetch(`https://slack.com/api/${method}`, requestInit);
  const data = await response.json().catch(() => ({}));

  if (!response.ok || data.ok === false) {
    if ((response.status === 429 || data.error === "ratelimited") && attempt < 3) {
      const retryAfter = Number(response.headers.get("retry-after") || 1);
      await delay(Math.min(Math.max(retryAfter, 1), 5) * 1000);
      return slackApiCall({ token, method, body, encoding, attempt: attempt + 1 });
    }
    const error = new Error(data.error || `slack_http_${response.status}`);
    error.statusCode = response.status || 500;
    error.details = data;
    throw error;
  }

  return data;
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isSlackRateLimited(error) {
  return /ratelimited|rate.?limit|slack_http_429/i.test(String(error?.message || error || ""));
}

async function getPanelCache(panelId) {
  const response = await kvRequest(["GET", panelCacheKey(panelId)]);
  const payload = response?.result ? JSON.parse(response.result) : null;
  if (!payload?.updatedAt || Date.now() - Date.parse(payload.updatedAt) > PANEL_CACHE_TTL_MS) return null;
  return payload;
}

async function setPanelCache(panelId, items) {
  await kvRequest(["SET", panelCacheKey(panelId), JSON.stringify({
    updatedAt: new Date().toISOString(),
    items: Array.isArray(items) ? items.slice(0, 250) : []
  })]);
}

function panelCacheKey(panelId) {
  return `support:slack-panel-cache:${String(panelId || "default").replace(/[^a-z0-9_-]/gi, "_")}`;
}

async function kvRequest(command) {
  const url = optionalEnv("KV_REST_API_URL") || optionalEnv("UPSTASH_REDIS_REST_URL");
  const token = optionalEnv("KV_REST_API_TOKEN") || optionalEnv("UPSTASH_REDIS_REST_TOKEN");
  if (!url || !token) throw new Error("missing_kv_config");
  const response = await fetch(`${url.replace(/\/+$/, "")}/pipeline`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify([command])
  });
  const data = await response.json().catch(() => []);
  if (!response.ok) throw new Error("kv_request_failed");
  return Array.isArray(data) ? data[0] : data;
}

function flattenBody(body) {
  return Object.entries(body).reduce((acc, [key, value]) => {
    acc[key] = typeof value === "string" ? value : JSON.stringify(value);
    return acc;
  }, {});
}

function parseJsonEnv(name, fallback) {
  const raw = optionalEnv(name);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function readJiraFieldText(fields) {
  return Object.values(fields).map((field) => ({
    name: normalizeMatchValue(field?.name),
    value: String(field?.value || "").trim()
  }));
}

function readFieldByHints(fields, hints) {
  const normalizedHints = hints.map(normalizeMatchValue);
  const found = fields.find((field) =>
    normalizedHints.some((hint) => field.name.includes(hint))
  );
  return found?.value || "";
}

function detectColumnsFromSchema(schema) {
  const columns = {
    customerId: "",
    customerEmail: "",
    trackingKey: "",
    amount: "",
    movementProof: "",
    status: "",
    description: "",
    agentName: "",
    jiraUrl: "",
    createdAt: ""
  };
  const columnTypes = {};

  for (const column of schema) {
    const id = String(column.id || "").trim();
    if (!id) continue;

    const label = normalizeMatchValue(`${column.name || ""} ${column.key || ""}`);
    columnTypes[id] = column.type || "";

    if (!columns.customerId && label.includes("id")) columns.customerId = id;
    if (!columns.customerEmail && (label.includes("correo") || label.includes("email"))) columns.customerEmail = id;
    if (!columns.trackingKey && (label.includes("clave") || label.includes("rastreo"))) columns.trackingKey = id;
    if (!columns.amount && (label.includes("monto") || label.includes("importe"))) columns.amount = id;
    if (!columns.movementProof && (label.includes("cep") || label.includes("captura") || label.includes("movimiento"))) {
      columns.movementProof = id;
    }
    if (!columns.status && label.includes("status")) columns.status = id;
    if (!columns.description && label.includes("detalle")) columns.description = id;
    if (!columns.agentName && (label.includes("agente") || label.includes("agentes"))) columns.agentName = id;
    if (!columns.jiraUrl && label.includes("ticket") && label.includes("jira")) columns.jiraUrl = id;
    if (!columns.createdAt && label.includes("fecha")) columns.createdAt = id;
  }

  return { listColumns: columns, listColumnTypes: columnTypes };
}

function buildRichText(text) {
  return [
    {
      type: "rich_text",
      elements: [
        {
          type: "rich_text_section",
          elements: [
            {
              type: "text",
              text: text || "."
            }
          ]
        }
      ]
    }
  ];
}

function parseSlackNumber(value) {
  const normalized = String(value || "")
    .replace(/[^\d.,-]/g, "")
    .replace(/,/g, "");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCurrentLocalDate() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
