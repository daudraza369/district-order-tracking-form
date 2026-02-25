/**
 * Order Entry API - Google Apps Script
 * Append rows to Google Sheet via POST request
 *
 * CONFIG: Replace these before deploying
 */
const SPREADSHEET_ID = '192Vwk9QaayUSgXWiX8t0HHl5-STyKQlD8fM3oNdcNZc';
const SECRET_TOKEN = 'flowerOrder2024';
const ORDERS_SHEET_NAME = 'Paid Orders';  // Sheet tab where orders are appended
const CAMPAIGNS_SHEET_NAME = 'Campaigns.'; // Sheet tab with campaign list (must match exact tab name)

/**
 * Handle GET requests (e.g. fetch campaigns list)
 * Usage: GET ?action=campaigns
 */
function doGet(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);
  try {
    const action = (e && e.parameter && e.parameter.action) || '';
    if (action === 'campaigns') {
      const campaigns = getCampaignsFromSheet();
      return output.setContent(JSON.stringify({ campaigns: campaigns }));
    }
    if (action === 'insights') {
      const range = (e.parameter.range || '').toString().trim();
      const from = (e.parameter.from || '').toString().trim();
      const to = (e.parameter.to || '').toString().trim();
      const insights = getOrderInsights({ range: range, from: from, to: to });
      return output.setContent(JSON.stringify(insights));
    }
    return output.setContent(JSON.stringify({ campaigns: ['None'] }));
  } catch (err) {
    return output.setContent(JSON.stringify({ campaigns: ['None'], error: String(err.message) }));
  }
}

/**
 * Read campaign names from Campaigns sheet tab (column A)
 * Row 1 = header "Campaign", data from row 2 onwards
 */
function getCampaignsFromSheet() {
  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(CAMPAIGNS_SHEET_NAME);
  if (!sheet) return ['None'];
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return ['None'];
  var values = sheet.getRange(2, 1, lastRow, 1).getValues().map(function(r) { return String(r[0] || '').trim(); });
  var list = values.filter(function(v) { return v.length > 0; });
  var unique = list.filter(function(v, i, a) { return a.indexOf(v) === i; });
  return ['None'].concat(unique);
}

/**
 * Read Paid Orders sheet and return aggregate insights
 * Columns: Timestamp(1), ChatwootID(2), OrderType(3), LeadSource(4), Fulfillment(5), Campaign(6)... OrderDate(10)
 * Uses Order Date (col 10) for date filtering - the exact date the order was placed.
 * @param {Object} opts - { range: 'today'|'week'|'', from: 'YYYY-MM-DD', to: 'YYYY-MM-DD' }
 */
function getOrderInsights(opts) {
  opts = opts || {};
  var range = String(opts.range || '').trim();
  var fromStr = String(opts.from || '').trim();
  var toStr = String(opts.to || '').trim();

  var today = new Date();
  var todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).replace(/^(\d)$/, '0$1') + '-' + String(today.getDate()).replace(/^(\d)$/, '0$1');

  var useFrom = null;
  var useTo = null;
  if (range === 'today') {
    useFrom = todayStr;
    useTo = todayStr;
  } else if (range === 'week') {
    var weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - 6);
    useFrom = weekStart.getFullYear() + '-' + String(weekStart.getMonth() + 1).replace(/^(\d)$/, '0$1') + '-' + String(weekStart.getDate()).replace(/^(\d)$/, '0$1');
    useTo = todayStr;
  } else if (fromStr && toStr) {
    useFrom = fromStr;
    useTo = toStr;
  }

  var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  var sheet = ss.getSheetByName(ORDERS_SHEET_NAME);
  if (!sheet) return { total: 0, delivery: 0, pickup: 0, priorityDelivery: 0, today: 0 };
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return { total: 0, delivery: 0, pickup: 0, priorityDelivery: 0, today: 0 };

  var data = sheet.getRange(2, 1, lastRow, 10).getValues();
  var total = 0;
  var delivery = 0;
  var pickup = 0;
  var priorityDelivery = 0;
  var todayCount = 0;

  function toDateStr(val) {
    if (val === null || val === undefined || val === '') return null;
    var d;
    if (val instanceof Date) {
      d = val;
    } else if (typeof val === 'string') {
      var s = String(val).trim();
      var m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
      if (m) return m[1] + '-' + String(m[2]).replace(/^(\d)$/, '0$1') + '-' + String(m[3]).replace(/^(\d)$/, '0$1');
      d = new Date(s);
    } else {
      d = new Date(val);
    }
    if (isNaN(d.getTime())) return null;
    return d.getFullYear() + '-' + String(d.getMonth() + 1).replace(/^(\d)$/, '0$1') + '-' + String(d.getDate()).replace(/^(\d)$/, '0$1');
  }

  function inRange(rowDate) {
    if (!useFrom || !useTo || !rowDate) return true;
    return rowDate >= useFrom && rowDate <= useTo;
  }

  for (var i = 0; i < data.length; i++) {
    var row = data[i];
    var orderDateVal = row[9];
    var rowDate = toDateStr(orderDateVal);
    if (!rowDate) continue;  // Skip rows without valid timestamp (blank/totals rows)
    if (!inRange(rowDate)) continue;

    total++;
    var fulfill = String(row[4] || '').trim();
    if (fulfill === 'Delivery') delivery++;
    else if (fulfill === 'Pickup') pickup++;
    else if (fulfill === 'Priority Delivery') priorityDelivery++;
    if (rowDate === todayStr) todayCount++;
  }

  return {
    total: total,
    delivery: delivery,
    pickup: pickup,
    priorityDelivery: priorityDelivery,
    today: todayCount
  };
}

/**
 * Handle POST requests from the order form
 * @param {GoogleAppsScript.Events.DoPost} e - Event object with postData
 * @returns {GoogleAppsScript.HTTP.HtmlOutput} JSON response
 */
function doPost(e) {
  const output = ContentService.createTextOutput();
  output.setMimeType(ContentService.MimeType.JSON);

  try {
    // 1. Verify token
    const token = getTokenFromRequest(e);
    if (!token || token !== SECRET_TOKEN) {
      return output.setContent(JSON.stringify({ success: false, error: 'Unauthorized' }));
    }

    // 2. Parse JSON body
    const postData = e.postData ? e.postData.contents : null;
    if (!postData) {
      return output.setContent(JSON.stringify({ success: false, error: 'No data received' }));
    }

    const payload = JSON.parse(postData);

    // 3. Build row and append
    const timestamp = new Date();
    const row = [
      timestamp,
      payload.chatwootId || '',
      payload.orderType || '',
      payload.leadSource || '',
      payload.fulfillment || '',
      payload.campaign || '',
      payload.product || '',
      payload.barcodes || '',
      payload.quantity ?? '',
      payload.orderDate || '',
      payload.requestedDate || '',
      payload.requestedTime || '',
      payload.customerName || '',
      payload.email || '',
      payload.contactNumber || '',
      payload.deliveryAddress || '',
      payload.area || '',
      (payload.invoiceNo || '').toString().trim(),
      payload.orderTotal ?? '',
      payload.amountPaid ?? ''
    ];

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(ORDERS_SHEET_NAME);
    sheet.appendRow(row);

    return output.setContent(JSON.stringify({ success: true }));
  } catch (err) {
    return output.setContent(JSON.stringify({
      success: false,
      error: err.message || 'Server error'
    }));
  }
}

/**
 * Extract token from request body
 * Note: Apps Script does not expose HTTP headers (e.g. Authorization), so token must be in JSON body.
 * @param {GoogleAppsScript.Events.DoPost} e
 * @returns {string|null}
 */
function getTokenFromRequest(e) {
  if (!e.postData || !e.postData.contents) return null;
  try {
    const body = JSON.parse(e.postData.contents);
    return body.token || null;
  } catch (_) {
    return null;
  }
}
