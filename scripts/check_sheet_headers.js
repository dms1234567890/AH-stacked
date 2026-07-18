const { google } = require('googleapis');
const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  undefined,
  (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets.readonly'],
);
const sheets = google.sheets({ version: 'v4', auth });

async function checkSheet(spreadsheetId, range, name) {
  try {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
    console.log(`\n=== Header & first row of ${name} ===`);
    console.log('Headers:', res.data.values?.[0]);
    console.log('Row 1:', res.data.values?.[1]);
    console.log('Row 2:', res.data.values?.[2]);
  } catch (err) {
    console.error(`Error checking ${name}:`, err.message);
  }
}

async function main() {
  const CLASSES_STUDENTS_SHEET_ID = process.env.GOOGLE_CLASSES_STUDENTS_SHEET_ID || '1DK4OpEdEDh2z_Ng9vIHbci41yBLSQ2m4ZXI7sqA7mJs';
  const HOMEWORK_SHEET_ID = process.env.GOOGLE_HOMEWORK_SHEET_ID || '1IR48k48Koil2lHv_coP8yBmLYUcGBOy_9xgdd9t6YR8';

  await checkSheet(CLASSES_STUDENTS_SHEET_ID, 'AttendanceLogs!A:G', 'CLASSES_STUDENTS_SHEET_ID - AttendanceLogs');
  await checkSheet(HOMEWORK_SHEET_ID, "Student'sAttendenceData!A:G", "HOMEWORK_SHEET_ID - Student'sAttendenceData");
}

main();
