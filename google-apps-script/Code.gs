// =============================================================
// Learners Knowledge Base — Google Sheets Sync
// =============================================================
// SETUP INSTRUCTIONS (one-time, ~3 minutes):
//
// 1. Open your Google Sheet (create a new one if needed).
// 2. Click Extensions > Apps Script.
// 3. Delete any existing code in the editor.
// 4. Paste this entire file into the editor.
// 5. Click the Run button (▶) next to "setupSheet" to create headers.
//    Grant the permission prompt that appears.
// 6. Click Deploy > New deployment.
//    - Type: Web app
//    - Execute as: Me
//    - Who has access: Anyone
//    Click Deploy, then copy the Web App URL.
// 7. Go to your Supabase project → Project Settings → Edge Functions → Secrets.
//    Add a secret named SHEETS_WEBHOOK_URL and paste the URL from step 6.
// 8. In Supabase: Database → Webhooks → Create a new webhook:
//    - Name:   on_submission_insert
//    - Table:  submissions
//    - Events: INSERT
//    - Type:   HTTP Request
//    - URL:    https://<your-project-ref>.supabase.co/functions/v1/sync-to-sheets
//    - HTTP Headers:
//        Authorization: Bearer <your SUPABASE_ANON_KEY>
//    Click Save. Done — every new submission now appears in your Sheet.
// =============================================================

var SHEET_NAME = 'Submissions'; // Change this if you want a different tab name

// Called once to set up the spreadsheet headers and formatting.
function setupSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();

  // Create or get the Submissions sheet
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // Write header row
  var headers = [
    'Submitted At',
    'Full Name',
    'Badge Earned',
    'Track / Category',
    'Contribution Title',
    'Content',
    'Media Link',
    'Record ID'
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Style the header row
  var headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setBackground('#0ea5e9');   // sky-500
  headerRange.setFontColor('#ffffff');
  headerRange.setFontWeight('bold');
  headerRange.setFontSize(11);

  // Freeze the header row
  sheet.setFrozenRows(1);

  // Auto-resize columns after setting sample width hints
  sheet.setColumnWidth(1, 160);  // Submitted At
  sheet.setColumnWidth(2, 160);  // Full Name
  sheet.setColumnWidth(3, 160);  // Badge Earned
  sheet.setColumnWidth(4, 220);  // Track / Category
  sheet.setColumnWidth(5, 260);  // Contribution Title
  sheet.setColumnWidth(6, 360);  // Content
  sheet.setColumnWidth(7, 220);  // Media Link
  sheet.setColumnWidth(8, 280);  // Record ID

  SpreadsheetApp.getUi().alert('Sheet setup complete! Your Submissions tab is ready.');
}

// Receives POST requests from the Supabase Edge Function.
// Each call appends one row for the new submission.
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);

    // The Edge Function sends a flat object with these fields.
    var id          = payload.id          || '';
    var full_name   = payload.full_name   || '';
    var badge       = payload.badge       || 'Cohort Contributor';
    var track       = payload.track       || '';
    var title       = payload.title       || '';
    var content     = payload.content     || '';
    var media_link  = payload.media_link  || '';
    var created_at  = payload.created_at  || new Date().toISOString();

    // Format the timestamp to a human-readable local string
    var formattedDate = new Date(created_at).toLocaleString();

    var ss    = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(SHEET_NAME);

    if (!sheet) {
      // Auto-create the sheet if it doesn't exist yet
      sheet = ss.insertSheet(SHEET_NAME);
    }

    // Append the new row
    sheet.appendRow([
      formattedDate,
      full_name,
      badge,
      track,
      title,
      content,
      media_link,
      id
    ]);

    // Alternate row shading for readability
    var lastRow   = sheet.getLastRow();
    var numCols   = 8;
    var rowRange  = sheet.getRange(lastRow, 1, 1, numCols);
    if (lastRow % 2 === 0) {
      rowRange.setBackground('#f0f9ff'); // sky-50
    } else {
      rowRange.setBackground('#ffffff');
    }

    return ContentService
      .createTextOutput(JSON.stringify({ success: true, row: lastRow }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Optional: run this manually to pull all existing Supabase rows into the Sheet.
// Requires SUPABASE_URL and SUPABASE_ANON_KEY to be set as Script Properties.
// (Extensions > Apps Script > Project Settings > Script Properties)
function backfillFromSupabase() {
  var props    = PropertiesService.getScriptProperties();
  var url      = props.getProperty('SUPABASE_URL');
  var anonKey  = props.getProperty('SUPABASE_ANON_KEY');

  if (!url || !anonKey) {
    SpreadsheetApp.getUi().alert(
      'Add SUPABASE_URL and SUPABASE_ANON_KEY in\n' +
      'Extensions > Apps Script > Project Settings > Script Properties,\n' +
      'then run backfillFromSupabase again.'
    );
    return;
  }

  var response = UrlFetchApp.fetch(
    url + '/rest/v1/submissions?order=created_at.asc&select=*',
    {
      headers: {
        'apikey':        anonKey,
        'Authorization': 'Bearer ' + anonKey,
        'Content-Type':  'application/json'
      }
    }
  );

  var submissions = JSON.parse(response.getContentText());
  var ss          = SpreadsheetApp.getActiveSpreadsheet();
  var sheet       = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);

  submissions.forEach(function(row) {
    sheet.appendRow([
      new Date(row.created_at).toLocaleString(),
      row.full_name   || '',
      row.badge       || 'Cohort Contributor',
      row.track       || '',
      row.title       || '',
      row.content     || '',
      row.media_link  || '',
      row.id          || ''
    ]);
  });

  SpreadsheetApp.getUi().alert('Backfill complete: ' + submissions.length + ' rows imported.');
}
