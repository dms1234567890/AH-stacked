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
  const spreadsheetId = process.env.GOOGLE_LOGIN_SHEET_ID || '1_vUAFShQrvHRlJALfcnBCCZEZF7zHYGuulYV-kPifTI';
  
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Login!A:D',
  });
  
  console.log('Logins:');
  console.log(res.data.values);
}

main().catch(console.error);
