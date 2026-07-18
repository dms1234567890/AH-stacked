const { google } = require('googleapis');
const auth = new google.auth.JWT(
  process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
  undefined,
  (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/spreadsheets.readonly'],
);
const sheets = google.sheets({ version: 'v4', auth });

async function main() {
  const CLASSES_STUDENTS_SHEET_ID = process.env.GOOGLE_CLASSES_STUDENTS_SHEET_ID || '1DK4OpEdEDh2z_Ng9vIHbci41yBLSQ2m4ZXI7sqA7mJs';
  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: CLASSES_STUDENTS_SHEET_ID,
      range: 'Exam_Types!A:E',
    });
    console.log('\n=== Exam_Types Headers & Data ===');
    console.log('Headers:', res.data.values?.[0]);
    console.log('Row 1:', res.data.values?.[1]);
    console.log('Row 2:', res.data.values?.[2]);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

main();
