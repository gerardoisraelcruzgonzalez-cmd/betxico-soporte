import { optionalEnv } from "./http.js";
import {
  SUPPORT_SLACK_LIST_ID,
  SUPPORT_SLACK_PANEL_ID,
  SUPPORT_SLACK_HISTORICAL_PANEL_ID,
  getSupportConfig
} from "./remote-config.js";
import { getSlackUserToken } from "./slack-user-tokens.js";

// A single shared snapshot is refreshed by the Vercel cron every four minutes.
// Readers never call Slack directly, so all agents see the same complete data.
const PANEL_CACHE_TTL_MS = 5 * 60 * 1000;
const PANEL_SYNC_LOCK_SECONDS = 120;

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
  OptQHRGM5AC: "REVISION FIRST",
  OptMO6FXMXV: "MONTO Y PRIMERA VEZ",
  OptKOOLQ1AD: "COMPORTAMIENTO REPETITIVO",
  OptFMW91BR4: "GANANCIAS ALTAS EN SLOTS",
  Opt4E8SWADZ: "ROLL OVER INCOMPLETO",
  OptXTXR6A9K: "REVISION TDC",
  Opt9PVLD4SS: "REDUCCION DE SALDO X BONO",
  OptJUH41YGW: "OTROS",
  Opt32JW5YP9: "CUENTA SOSPECHOSA",
  Opt45MV8ZIY: "FIRST CREDIT Y GANANCIAS DE SLOT",
  OptP6XE36X1: "ADV BONO/JUEGOS",
  OptGP48G6TW: "EXCEDE LIMITES",
  OptFMSD9OPF: "DEVWALLET",
  OptH3VBLLXV: "REVISION FIRST",
  OptOXZP9XLK: "MONTO Y PRIMERA VEZ",
  OptTIDNF9UD: "COMPORTAMIENTO REPETITIVO",
  Opt0NZEY6T2: "GANANCIAS ALTAS EN SLOTS",
  Opt9NFDZA8G: "ROLL OVER INCOMPLETO",
  OptQSKWY63C: "REVISION TDC",
  OptXY0MX1IW: "REDUCCION DE SALDO X BONO",
  DEVWALLET: "DEVWALLET",
  OptPV5CMI20: "DEVWALLET",
  OptA8FQJJR1: "OTROS",
  OptMJSCYAW9: "REVISION FIRST",
  OptAFG47YXR: "MONTO Y PRIMERA VEZ",
  OptQ1D8UD45: "COMPORTAMIENTO REPETITIVO",
  OptC9WOSWVU: "GANANCIAS ALTAS EN SLOTS",
  OptBPXULYGA: "ROLL OVER INCOMPLETO",
  OptUNARF1LZ: "REVISION TDC",
  Opt7B9MIH6N: "REDUCCION DE SALDO X BONO",
  Opt9X1XFGTO: "OTROS",
  OptRHNBB65N: "CUENTA SOSPECHOSA",
  Opt4BA3GUVY: "FIRST CREDIT Y GANANCIAS DE SLOT",
  OptCDY3VPOI: "ADV BONO/JUEGOS",
  OptT3WM2PBO: "EXCEDE LIMITES",
  Opt4T00SI6R: "DEVWALLET",
  OptIQJOWSVI: "DEVWALLET",
  OptCC7JYRPR: "REVISION FIRST",
  OptQ4YI9UIG: "OTROS",
  Opt4EVTC29B: "MONTO Y PRIMERA VEZ",
  OptMXBCSYP7: "COMPORTAMIENTO REPETITIVO",
  OptZNLBCF6A: "GANANCIAS ALTAS EN SLOTS",
  OptWL29JV17: "ROLL OVER INCOMPLETO",
  OptRA7WEDUT: "REVISION TDC",
  Opt68U8MAUW: "REDUCCION DE SALDO X BONO",
  OptJLDIUWVD: "CUENTA SOSPECHOSA",
  Opt3N569HPM: "FIRST CREDIT Y GANANCIAS DE SLOT",
  OptMW5DYHBA: "ADV BONO/JUEGOS",
  OptMITZCWJB: "EXCEDE LIMITES"
};

const APPROVAL_STATUS_LABELS = {
  OptJTVJCE0M: "APROBAR",
  OptWKB8KFIU: "CANCELAR",
  OptUZ6UAGPE: "PEDIR DOCUMENTOS",
  OptIYT7VDOW: "ADVERTENCIA",
  OptW0ENCR8G: "APROBAR",
  Opt9HID4LD3: "CANCELAR",
  OptBDBL2BMY: "PEDIR DOCUMENTOS",
  OptRHLRZCFG: "ADVERTENCIA",
  OptP61JKR85: "APROBAR",
  OptH957YL02: "CANCELAR",
  OptCQ3CTH7V: "PEDIR DOCUMENTOS",
  OptXOE0QQGP: "ADVERTENCIA",
  Opt27XUHK3U: "APROBAR",
  Opt14V5IDKW: "CANCELAR",
  OptBO2QUH18: "PEDIR DOCUMENTOS",
  Opt5BV2HM48: "ADVERTENCIA"
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
        attachments: report.attachments,
        initialComment: "Evidencia del depósito no reflejado"
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

export async function sendSlackRouteMessage({
  routeId,
  text,
  attachments = [],
  initialComment = "Evidencia adjunta",
  accountSettings = {}
} = {}) {
  const token = optionalEnv("SLACK_BOT_TOKEN");
  const routes = await loadSlackRoutes();
  const route = routes.find((item) => item.id === String(routeId || "").trim());
  const message = String(text || "").trim().slice(0, 3000);
  if (!token || !route?.channelId) {
    const error = new Error("slack_route_not_configured");
    error.statusCode = 503;
    throw error;
  }
  if (!message) {
    const error = new Error("missing_slack_message");
    error.statusCode = 400;
    throw error;
  }

  const userToken = await getSlackUserToken(accountSettings.email || "").catch(() => "");
  let channel;
  try {
    channel = await sendMessageToSlack({
      token: userToken || token,
      channelId: route.channelId,
      text: message,
      asUser: Boolean(userToken)
    });
  } catch (error) {
    if (!userToken) throw error;
    channel = await sendMessageToSlack({
      token,
      channelId: route.channelId,
      text: message,
      asUser: false,
      userFallback: error.message || "slack_user_post_failed"
    });
  }

  const files = channel?.ts && Array.isArray(attachments) && attachments.length
    ? await uploadSlackThreadFiles({
      token,
      channelId: route.channelId,
      threadTs: channel.ts,
      attachments,
      initialComment
    })
    : [];

  return {
    ok: true,
    routeId: route.id,
    routeName: route.name,
    channel,
    files
  };
}

export async function sendSlackApprovedMessage({ routeId, text, accountSettings = {} } = {}) {
  const token = optionalEnv("SLACK_BOT_TOKEN");
  const routes = await loadSlackRoutes();
  const route = routes.find((item) => item.id === String(routeId || "").trim());
  const message = String(text || "").trim().slice(0, 3000);
  if (!token || !route?.channelId) {
    const error = new Error("slack_approved_route_not_configured");
    error.statusCode = 503;
    throw error;
  }
  if (!message) {
    const error = new Error("missing_slack_message");
    error.statusCode = 400;
    throw error;
  }

  const userToken = await getSlackUserToken(accountSettings.email || "").catch(() => "");
  try {
    return await sendMessageToSlack({
      token: userToken || token,
      channelId: route.channelId,
      text: message,
      asUser: Boolean(userToken)
    });
  } catch (error) {
    if (!userToken) throw error;
    return sendMessageToSlack({
      token,
      channelId: route.channelId,
      text: message,
      asUser: false,
      userFallback: error.message || "slack_user_post_failed"
    });
  }
}

export async function verifySlackApprovedMessage({ routeId, channel, ts, text, accountSettings = {} } = {}) {
  const token = optionalEnv("SLACK_BOT_TOKEN");
  const routes = await loadSlackRoutes();
  const route = routes.find((item) => item.id === String(routeId || "").trim());
  const messageTs = String(ts || "").trim();
  const expectedText = normalizeApprovedMessageText(text);
  if (!token || !route?.channelId || route.channelId !== String(channel || "").trim() || !messageTs || !expectedText) {
    return false;
  }
  const userToken = await getSlackUserToken(accountSettings.email || "").catch(() => "");
  const data = await readSlackMessagesWithFallback({
    primaryToken: userToken,
    fallbackToken: token,
    channelId: route.channelId,
    body: {
      latest: messageTs,
      inclusive: "true",
      limit: "1"
    }
  });
  return Array.isArray(data.messages) && data.messages.some((message) => (
    String(message?.ts || "").trim() === messageTs
    && normalizeApprovedMessageText(message?.text) === expectedText
  ));
}

export async function findSlackApprovedMessage({ routeId, text, since, accountSettings = {} } = {}) {
  const token = optionalEnv("SLACK_BOT_TOKEN");
  const routes = await loadSlackRoutes();
  const route = routes.find((item) => item.id === String(routeId || "").trim());
  const expectedText = normalizeApprovedMessageText(text);
  const sinceMs = Date.parse(String(since || ""));
  if (!token || !route?.channelId || !expectedText || !Number.isFinite(sinceMs)) return null;

  const userToken = await getSlackUserToken(accountSettings.email || "").catch(() => "");
  const lowerBoundSeconds = Math.max(0, (sinceMs - 60_000) / 1000);
  const data = await readSlackMessagesWithFallback({
    primaryToken: userToken,
    fallbackToken: token,
    channelId: route.channelId,
    body: {
      oldest: String(lowerBoundSeconds),
      inclusive: "true",
      limit: "100"
    }
  });
  const match = (Array.isArray(data.messages) ? data.messages : []).find((message) => (
    Number(message?.ts) >= lowerBoundSeconds
    && normalizeApprovedMessageText(message?.text) === expectedText
  ));
  return match?.ts ? { channel: route.channelId, ts: String(match.ts) } : null;
}

export async function getSlackListSchema(listId) {
  const token = optionalEnv("SLACK_BOT_TOKEN");
  const requestedListId = String(listId || SUPPORT_SLACK_LIST_ID).trim();
  if (requestedListId !== SUPPORT_SLACK_LIST_ID) {
    const error = new Error("slack_list_not_allowed");
    error.statusCode = 400;
    throw error;
  }
  const cleanListId = SUPPORT_SLACK_LIST_ID;

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
  const config = await getSupportConfig();
  const panel = resolveLista7Panel(config, panelId);

  if (!panel) {
    const error = new Error("missing_slack_config");
    error.statusCode = 500;
    throw error;
  }

  const itemLimit = resolvePanelLimit(options.limit, panel.limit);
  const cached = await getPanelCacheRaw(panel.id).catch(() => null);
  const baseItems = Array.isArray(cached?.items) ? cached.items : [];
  const cacheExpired = !cached?.updatedAt || Date.now() - Date.parse(cached.updatedAt) > panelCacheTtlMs(panel);
  const stale = Boolean(baseItems.length) && (cacheExpired || cached?.complete !== true);
  const warning = !cached?.updatedAt
    ? "slack_cache_unavailable"
    : stale
      ? "slack_cache_stale"
      : "";

  const mappedItems = baseItems
    .filter((item) => matchesEmailSearch(item, options.email))
    .filter((item) => matchesPanelQuery(item, options.query))
    .slice(0, itemLimit);

  return {
    panel: {
      id: panel.id,
      label: panel.label,
      listId: panel.listId,
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

export async function syncSlackListPanelCache(panelId, options = {}) {
  const botToken = optionalEnv("SLACK_BOT_TOKEN");
  const userToken = await getSlackUserToken(options.accountEmail || "").catch(() => "");
  const token = userToken || botToken;
  const config = await getSupportConfig();
  const cleanPanelId = String(panelId || "").trim();
  const panel = resolveLista7Panel(config, cleanPanelId);
  if (!token || !panel?.listId) {
    const error = new Error("missing_slack_config");
    error.statusCode = 500;
    throw error;
  }

  const cooldownSeconds = panelSyncCooldownSeconds(panel);
  await claimSlackPanelSync(cleanPanelId, cooldownSeconds);
  try {
    const maxItems = clampSyncInteger(
      optionalEnv("SUPPORT_SLACK_SYNC_MAX_ITEMS") || panel.readLimit,
      1000,
      50,
      1000
    );
    const fetchResult = await fetchSlackListItems({ token, listId: panel.listId, maxItems });
    const hydratedItems = await hydrateSlackListItems({
      token,
      listId: panel.listId,
      items: fetchResult.items,
      batchSize: 6,
      pauseMs: 0
    });
    const items = hydratedItems
      .map((item) => mapSlackListPanelItem(item, panel.columns || {}))
      .filter((item) => matchesPanelFilter(item, panel.filter || {}))
      .sort(comparePanelItemsByDate);
    await setPanelCache(cleanPanelId, items, {
      complete: fetchResult.complete,
      scannedCount: fetchResult.scannedCount,
      ttlSeconds: panel.cacheTtlSeconds
    });
    const syncedAt = new Date().toISOString();
    await kvRequest([
      "SET",
      panelSyncCooldownKey(cleanPanelId),
      syncedAt,
      "EX",
      String(cooldownSeconds)
    ]);
    return {
      panel: { id: panel.id, label: panel.label, listId: panel.listId },
      syncedAt,
      itemCount: items.length,
      scannedCount: fetchResult.scannedCount,
      complete: fetchResult.complete,
      coverage: fetchResult.complete ? "complete" : "partial",
      source: userToken ? "slack_user" : "slack_bot"
    };
  } catch (error) {
    if (isSlackRateLimited(error)) {
      const retryAfterSeconds = clampSyncInteger(error?.details?.retryAfterSeconds, cooldownSeconds, 1, 3600);
      await kvRequest([
        "SET",
        panelSyncCooldownKey(cleanPanelId),
        new Date().toISOString(),
        "EX",
        String(retryAfterSeconds)
      ]).catch(() => null);
    }
    throw error;
  } finally {
    await kvRequest(["DEL", panelSyncLockKey(cleanPanelId)]).catch(() => null);
  }
}

export async function lookupSlackListCache(value, options = {}) {
  const config = await getSupportConfig();
  const panel = resolveLista7Panel(config, SUPPORT_SLACK_PANEL_ID);
  const panels = panel ? [panel] : [];
  const queryType = String(options.queryType || "").trim();
  const normalizedValue = queryType === "email"
    ? normalizeEmailSearch(value)
    : normalizeMatchValue(value);
  const records = [];
  const timestamps = [];
  let missingPanels = 0;
  let partialPanels = 0;

  for (const panel of panels) {
    const cached = await getPanelCacheRaw(panel.id).catch(() => null);
    if (!cached?.updatedAt || !Array.isArray(cached.items)) {
      missingPanels += 1;
      continue;
    }
    if (cached.complete !== true) partialPanels += 1;
    timestamps.push(Date.parse(cached.updatedAt));
    for (const item of cached.items) {
      const matches = queryType === "email"
        ? normalizeEmailSearch(item.email) === normalizedValue
        : queryType === "auth_id"
          ? normalizeMatchValue(item.authId) === normalizedValue
          : matchesPanelQuery(item, normalizedValue);
      if (!matches) continue;
      records.push({
        listId: panel.listId,
        panelId: panel.id,
        recordId: item.id,
        email: item.email,
        authId: item.authId,
        status: item.withdrawalStatus || item.approvalStatus || item.listStatus,
        reason: item.retentionReason || item.detail,
        note: item.reviewDetail,
        updatedAt: item.updatedAt
      });
    }
  }

  if (!timestamps.length) {
    return {
      status: "unavailable",
      records: [],
      checkedAt: "",
      expiresAt: "",
      coverage: buildSlackCacheCoverage(panels.length, 0, missingPanels)
    };
  }
  const finiteTimestamps = timestamps.filter(Number.isFinite);
  const oldestTimestamp = finiteTimestamps.length ? Math.min(...finiteTimestamps) : NaN;
  const checkedAt = Number.isFinite(oldestTimestamp) ? new Date(oldestTimestamp).toISOString() : "";
  const expiresAt = checkedAt ? new Date(Date.parse(checkedAt) + panelCacheTtlMs(panel)).toISOString() : "";
  const stale = missingPanels > 0 || partialPanels > 0 || !expiresAt || Date.parse(expiresAt) <= Date.now();
  return {
    status: stale ? "stale" : records.length ? "available" : "not_found",
    records: records.slice(0, 20),
    checkedAt,
    expiresAt,
    coverage: buildSlackCacheCoverage(panels.length, timestamps.length, missingPanels, partialPanels)
  };
}

export function buildSlackCacheCoverage(expectedPanels, cachedPanels, missingPanels, partialPanels = 0) {
  const expected = Math.max(0, Number(expectedPanels) || 0);
  const cached = Math.max(0, Number(cachedPanels) || 0);
  const missing = Math.max(0, Number(missingPanels) || 0);
  const partial = Math.max(0, Number(partialPanels) || 0);
  const complete = expected > 0 && cached >= expected && missing === 0 && partial === 0;
  return {
    status: complete ? "complete" : "partial",
    complete,
    expectedPanels: expected,
    cachedPanels: cached,
    missingPanels: missing,
    partialPanels: partial
  };
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

  return {
    items: items.slice(0, maxItems),
    complete: !cursor,
    scannedCount: items.length
  };
}

async function hydrateSlackListItems({ token, listId, items, batchSize = 6, pauseMs = 0 }) {
  const hydrated = [];
  const safeBatchSize = Math.max(1, Math.min(Number(batchSize) || 6, 6));

  for (let index = 0; index < items.length; index += safeBatchSize) {
    const batch = items.slice(index, index + safeBatchSize);
    const results = await Promise.all(batch.map((item) => hydrateSlackListItem({ token, listId, item })));
    hydrated.push(...results);
    if (pauseMs > 0 && index + safeBatchSize < items.length) {
      await delay(Math.min(Math.max(Number(pauseMs) || 0, 0), 1000));
    }
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
  }).catch((error) => {
    if (isSlackRateLimited(error)) throw error;
    return null;
  });

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
    reviewDetail: getColumnDisplayValue(fields, columns.reviewDetail),
    withdrawalClabe: getColumnDisplayValue(fields, columns.withdrawalClabe),
    depositClabe: getColumnDisplayValue(fields, columns.depositClabe),
    assignedPerson: getColumnDisplayValue(fields, columns.assignedPerson),
    listStatus: normalizeListCompletion(getColumnDisplayValue(fields, columns.completed)),
    approvalStatus: APPROVAL_STATUS_LABELS[approvalStatusValue] || getColumnDisplayValue(fields, columns.approvalStatus),
    rvc: getColumnDisplayValue(fields, columns.rvc),
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
    detail: values.detail || "Sin detalle capturado",
    retentionReason: buildRetentionReason(values),
    withdrawalStatus: values.approvalStatus || (values.listStatus === "COMPLETADO" ? "COMPLETADO" : "RETENIDO / EN REVISION")
  };
}

function normalizeListCompletion(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (["true", "1", "si", "sí", "yes", "completed", "completado"].includes(normalized)) return "COMPLETADO";
  if (["false", "0", "no", "pending", "pendiente"].includes(normalized)) return "PENDIENTE";
  return normalized ? String(value).trim().toUpperCase() : "";
}

function buildRetentionReason(values) {
  const seen = new Set();
  return [values.reviewTopic, values.detail, values.reviewDetail, values.rvc]
    .map((value) => String(value || "").trim())
    .filter((value) => {
      if (!value || /^sin detalle capturado$/i.test(value)) return false;
      const normalized = value.toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    })
    .join(" · ");
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
  if (typeof field.completed === "boolean") return field.completed ? "Si" : "No";
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

async function uploadSlackThreadFiles({ token, channelId, threadTs, attachments, initialComment = "Evidencia adjunta" }) {
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
        initial_comment: String(initialComment || "Evidencia adjunta").slice(0, 3000)
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

async function readSlackMessagesWithFallback({ primaryToken, fallbackToken, channelId, body }) {
  const request = (token) => slackApiCall({
    token,
    method: "conversations.history",
    body: { channel: channelId, ...body },
    encoding: "form"
  });
  if (primaryToken) {
    try {
      return await request(primaryToken);
    } catch (error) {
      if (!fallbackToken || primaryToken === fallbackToken) throw error;
    }
  }
  return request(fallbackToken);
}

function normalizeApprovedMessageText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

async function slackApiCall({ token, method, body, encoding }) {
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
    const error = new Error(data.error || `slack_http_${response.status}`);
    error.statusCode = response.status || 500;
    error.details = {
      ...data,
      retryAfterSeconds: Math.max(0, Number(response.headers.get("retry-after")) || 0)
    };
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

function resolveLista7Panel(config, panelId) {
  const requestedPanelId = String(panelId || SUPPORT_SLACK_PANEL_ID).trim();
  if (![SUPPORT_SLACK_PANEL_ID, SUPPORT_SLACK_HISTORICAL_PANEL_ID].includes(requestedPanelId)) return null;
  return (config.listPanels || []).find((panel) => (
    panel.id === requestedPanelId
    && (requestedPanelId === SUPPORT_SLACK_PANEL_ID ? panel.listId === SUPPORT_SLACK_LIST_ID : panel.role === "historical")
    && panel.enabled !== false
  )) || null;
}

async function getPanelCacheRaw(panelId) {
  const response = await kvRequest(["GET", panelCacheKey(panelId)]);
  return response?.result ? JSON.parse(response.result) : null;
}

async function setPanelCache(panelId, items, metadata = {}) {
  await kvRequest(["SET", panelCacheKey(panelId), JSON.stringify({
    updatedAt: new Date().toISOString(),
    complete: metadata.complete === true,
    scannedCount: Math.max(0, Number(metadata.scannedCount) || 0),
    items: Array.isArray(items) ? items.slice(0, 1000) : []
  }), "EX", String(Math.max(86400, Math.ceil((Number(metadata.ttlSeconds) || PANEL_CACHE_TTL_MS / 1000) * 2))) ]);
}

function panelCacheTtlMs(panel) {
  const configured = Number(panel?.cacheTtlSeconds);
  return (Number.isFinite(configured) && configured > 0 ? configured : PANEL_CACHE_TTL_MS / 1000) * 1000;
}

function panelSyncCooldownSeconds(panel) {
  const configured = Number(panel?.syncCooldownSeconds);
  if (Number.isFinite(configured) && configured > 0) return Math.trunc(configured);
  return clampSyncInteger(optionalEnv("SUPPORT_SLACK_SYNC_COOLDOWN_SECONDS"), 240, 60, 172800);
}

function panelCacheKey(panelId) {
  return `support:slack-panel-cache:${String(panelId || "default").replace(/[^a-z0-9_-]/gi, "_")}`;
}

async function claimSlackPanelSync(panelId, cooldownSeconds) {
  const cooldown = await kvRequest(["GET", panelSyncCooldownKey(panelId)]).catch(() => null);
  if (cooldown?.result) {
    const error = new Error("slack_panel_sync_cooldown");
    error.statusCode = 429;
    error.details = { retryAfterSeconds: cooldownSeconds };
    throw error;
  }
  const claim = await kvRequest([
    "SET",
    panelSyncLockKey(panelId),
    new Date().toISOString(),
    "EX",
    String(PANEL_SYNC_LOCK_SECONDS),
    "NX"
  ]);
  if (claim?.result !== "OK") {
    const error = new Error("slack_panel_sync_in_progress");
    error.statusCode = 409;
    throw error;
  }
}

function panelSyncLockKey(panelId) {
  return `support:slack-panel-sync-lock:${safePanelKey(panelId)}`;
}

function panelSyncCooldownKey(panelId) {
  return `support:slack-panel-sync-cooldown:${safePanelKey(panelId)}`;
}

function safePanelKey(panelId) {
  return String(panelId || "default").replace(/[^a-z0-9_-]/gi, "_");
}

function clampSyncInteger(value, fallback, min, max) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) ? Math.max(min, Math.min(max, parsed)) : fallback;
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
