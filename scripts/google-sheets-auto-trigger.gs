/**
 * ============================================================================
 * PRIME ACADEMIC MANAGER - GOOGLE SHEETS AUTOMATED WEBHOOK TRIGGER SCRIPT
 * ============================================================================
 * Attach this Apps Script file to any Prime Classes Google Spreadsheet:
 * 1. Open Google Sheet -> Extensions -> Apps Script
 * 2. Paste this code and update BACKEND_WEBHOOK_URL with your backend URL.
 * 3. Go to Triggers (alarm icon on left) -> Add Trigger:
 *    - Function: onSheetChangeTrigger
 *    - Event source: From spreadsheet
 *    - Event type: On change / On edit
 * ============================================================================
 */

// Replace with your live API domain or ngrok tunnel URL
var BACKEND_WEBHOOK_URL = "http://localhost:3001/api/v1/sync/webhook";
var WEBHOOK_SECRET = "prime-secret-webhook-key-2026";

/**
 * Triggered automatically when any row is edited or added in the Google Sheet.
 */
function onSheetChangeTrigger(e) {
  try {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getActiveSheet();
    var sheetName = sheet.getName();
    var activeRange = sheet.getActiveRange();
    
    var payload = {
      spreadsheetId: ss.getId(),
      spreadsheetName: ss.getName(),
      sheetName: sheetName,
      editedRow: activeRange ? activeRange.getRow() : 0,
      editedColumn: activeRange ? activeRange.getColumn() : 0,
      timestamp: new Date().toISOString(),
      secret: WEBHOOK_SECRET
    };

    // Include recent row values if editing a specific row
    if (activeRange && activeRange.getRow() > 1) {
      var rowValues = sheet.getRange(activeRange.getRow(), 1, 1, sheet.getLastColumn()).getValues()[0];
      payload.rowData = rowValues;
    }

    var options = {
      method: "post",
      contentType: "application/json",
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    var response = UrlFetchApp.fetch(BACKEND_WEBHOOK_URL, options);
    Logger.log("Webhook sent to backend. Status: " + response.getResponseCode());
  } catch (err) {
    Logger.log("Error sending webhook: " + err.toString());
  }
}

/**
 * Manual test function to verify backend webhook connectivity.
 */
function testWebhookConnection() {
  var payload = {
    spreadsheetId: "TEST_SPREADSHEET",
    spreadsheetName: "Test Sheet",
    sheetName: "Requisitions",
    editedRow: 2,
    timestamp: new Date().toISOString(),
    secret: WEBHOOK_SECRET,
    rowData: ["2026-07-31 17:40:00", "EMP-101", "ACADEMIC", "Faculty", "IT DEPARTMENT", "IT Support", "2", "45,000", "2026-08-15", "System Admin Support", "Node.js / React experience", "SUBMITTED"]
  };

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(BACKEND_WEBHOOK_URL, options);
  Logger.log("Test Webhook Status: " + response.getResponseCode());
  Logger.log("Test Webhook Body: " + response.getContentText());
}
