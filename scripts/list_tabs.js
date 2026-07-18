const { google } = require('googleapis');
const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  undefined,
  (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets.readonly'],
);

async function listTabs(spreadsheetId, name) {
  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const titles = meta.data.sheets.map(s => s.properties.title);
    console.log(`Tabs in ${name} (${spreadsheetId}):`, titles);
  } catch (err) {
    console.error(`Error listing tabs for ${name}:`, err.message);
  }
}

async function main() {
  const LOGIN_TASK_SHEET_ID = process.env.GOOGLE_LOGIN_SHEET_ID || '1_vUAFShQrvHRlJALfcnBCCZEZF7zHYGuulYV-kPifTI';
  const CLASSES_STUDENTS_SHEET_ID = process.env.GOOGLE_CLASSES_STUDENTS_SHEET_ID || '1DK4OpEdEDh2z_Ng9vIHbci41yBLSQ2m4ZXI7sqA7mJs';
  const ADMISSIONS_SHEET_ID = process.env.GOOGLE_ADMISSIONS_SHEET_ID || '1StEreMtS9_mbt4Np-T0J4WK5ILwDqyxmtqwxw8ZebOA';
  const HOMEWORK_SHEET_ID = process.env.GOOGLE_HOMEWORK_SHEET_ID || '1IR48k48Koil2lHv_coP8yBmLYUcGBOy_9xgdd9t6YR8';

  await listTabs(LOGIN_TASK_SHEET_ID, 'LOGIN_TASK_SHEET_ID');
  await listTabs(CLASSES_STUDENTS_SHEET_ID, 'CLASSES_STUDENTS_SHEET_ID');
  await listTabs(ADMISSIONS_SHEET_ID, 'ADMISSIONS_SHEET_ID');
  await listTabs(HOMEWORK_SHEET_ID, 'HOMEWORK_SHEET_ID');
}

main();
