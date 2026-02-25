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
