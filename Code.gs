/**
 * Order Entry API - Google Apps Script
 * Append rows to Google Sheet via POST request
 *
 * CONFIG: Replace these before deploying
 */
const SPREADSHEET_ID = '192Vwk9QaayUSgXWiX8t0HHl5-STyKQlD8fM3oNdcNZc';
const SECRET_TOKEN = 'YOUR_SECRET_TOKEN';

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
      payload.fulfillment || '',
      payload.product || '',
      payload.quantity ?? '',
      payload.orderDate || '',
      payload.requestedDate || '',
      payload.customerName || '',
      payload.email || '',
      payload.contactNumber || '',
      payload.deliveryAddress || '',
      payload.area || '',
      (payload.invoiceNo || '').toString().trim(),
      payload.orderTotal ?? '',
      payload.amountPaid ?? ''
    ];

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getActiveSheet();
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
