const { google } = require('googleapis');

const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

const auth = new google.auth.JWT({
  email,
  key: privateKey,
  scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
});

const sheets = google.sheets({ version: 'v4', auth });

async function main() {
  const spreadsheetId = process.env.GOOGLE_CLASSES_STUDENTS_SHEET_ID;
  console.log('Fetching sheet metadata for spreadsheet:', spreadsheetId);
  
  const res = await sheets.spreadsheets.get({
    spreadsheetId,
  });
  
  const sheetNames = res.data.sheets.map(s => s.properties.title);
  console.log('Sheets present:', sheetNames);
}

main().catch(console.error);
