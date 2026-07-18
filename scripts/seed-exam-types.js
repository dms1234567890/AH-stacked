const { PrismaClient } = require('@prisma/client');
const { google } = require('googleapis');
const prisma = new PrismaClient();

async function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  return google.sheets({ version: 'v4', auth });
}

async function main() {
  console.log('=== Seeding Exam Types from Google Sheets ===');
  
  const spreadsheetId = process.env.GOOGLE_CLASSES_STUDENTS_SHEET_ID;
  if (!spreadsheetId) {
    console.error('GOOGLE_CLASSES_STUDENTS_SHEET_ID not found in .env');
    process.exit(1);
  }

  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'Exam_Types!A:C',
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) {
    console.log('No exam types rows found in Exam_Types sheet.');
    return;
  }

  let createdCount = 0;
  let updatedCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const sheetId = (row[0] || '').toString().trim();
    const name = (row[1] || '').toString().trim();
    const detailsRaw = (row[2] || '').toString().trim();

    if (!name) continue;

    let subjectsWithMarks = [];
    try {
      subjectsWithMarks = JSON.parse(detailsRaw);
    } catch (err) {
      console.warn(`Could not parse JSON for row ${i}: ${detailsRaw}`);
      subjectsWithMarks = [];
    }

    // Standardize key to match frontend expectation
    // Convert any item.subjectName to item.subject or vice versa if needed
    const normalizedSubjects = subjectsWithMarks.map(item => {
      const sub = item.subject || item.subjectName || '';
      const marks = item.maxMarks || item.marks || 0;
      return {
        subject: sub,
        maxMarks: Number(marks)
      };
    });

    const existing = await prisma.examType.findFirst({
      where: {
        OR: [
          ...(sheetId ? [{ sheetId }] : []),
          { name },
        ]
      }
    });

    const dataPayload = {
      sheetId: sheetId || null,
      name,
      subjectsWithMarks: normalizedSubjects,
    };

    if (existing) {
      await prisma.examType.update({
        where: { id: existing.id },
        data: dataPayload,
      });
      updatedCount++;
    } else {
      await prisma.examType.create({
        data: dataPayload,
      });
      createdCount++;
    }
  }

  console.log(`\n=== Exam Seeding Finished ===`);
  console.log(`  Exam types created: ${createdCount}`);
  console.log(`  Exam types updated: ${updatedCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
