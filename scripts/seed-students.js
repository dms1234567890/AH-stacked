const { PrismaClient } = require('@prisma/client');
const { google } = require('googleapis');
const prisma = new PrismaClient();

async function getSheetsClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  return google.sheets({ version: 'v4', auth });
}

function mapHeaders(headers) {
  const map = {};
  for (let i = 0; i < headers.length; i++) {
    const h = (headers[i] || '').toString().trim().toUpperCase();
    if (h) map[h] = i;
  }
  return map;
}

function getHeaderIndex(map, keys) {
  for (const k of keys) {
    const upper = k.toUpperCase();
    if (map[upper] !== undefined) return map[upper];
  }
  return -1;
}

async function main() {
  console.log('=== Seeding Students from Google Sheets ===');
  
  const spreadsheetId = process.env.GOOGLE_CLASSES_STUDENTS_SHEET_ID;
  if (!spreadsheetId) {
    console.error('GOOGLE_CLASSES_STUDENTS_SHEET_ID not found in .env');
    process.exit(1);
  }

  const sheets = await getSheetsClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: 'students_database!A:Z',
  });

  const rows = response.data.values;
  if (!rows || rows.length < 2) {
    console.log('No student rows found in students_database sheet.');
    return;
  }

  const headers = mapHeaders(rows[0]);
  
  // Resolve key indices
  const studentIdIdx = getHeaderIndex(headers, ['STUDENTSID', 'STUDENTS ID', 'STUDENT ID', 'STUDENTID']);
  const studentNameIdx = getHeaderIndex(headers, ['STUDENT NAME', 'STUDENTNAME', 'NAME']);
  const startSessionIdx = getHeaderIndex(headers, ['START SESSION', 'STARTSESSION']);
  const endSessionIdx = getHeaderIndex(headers, ['END SESSION', 'ENDSESSION']);
  const dateOfAppIdx = getHeaderIndex(headers, ['DATE OF APPLICATION', 'DATEOFAPPLICATION']);
  const fatherNameIdx = getHeaderIndex(headers, ['FATHER\'S NAME', 'FATHERS NAME', 'FATHER NAME']);
  const motherNameIdx = getHeaderIndex(headers, ['MOTHER\'S NAME', 'MOTHERS NAME', 'MOTHER NAME']);
  const dobIdx = getHeaderIndex(headers, ['DOB', 'DATE OF BIRTH']);
  const mobileIdx = getHeaderIndex(headers, ['MOBILE NUMBERS', 'MOBILENUMBERS', 'MOBILE']);
  const emailIdx = getHeaderIndex(headers, ['EMAIL']);
  const categoryIdx = getHeaderIndex(headers, ['CATEGORY']);
  const fatherOccIdx = getHeaderIndex(headers, ['FATHER\'S OCCUPATION', 'FATHERS OCCUPATION', 'FATHER OCCUPATION']);
  const defenceIdx = getHeaderIndex(headers, ['DEFENCE SERVICE', 'DEFENCESERVICE']);
  const jobIdx = getHeaderIndex(headers, ['JOB DESCRIPTION', 'JOBDESCRIPTION']);
  const classIdx = getHeaderIndex(headers, ['CLASS']);
  const schoolIdx = getHeaderIndex(headers, ['PRESENT SCHOOL', 'PRESENTSCHOOL']);
  const batchIdx = getHeaderIndex(headers, ['BATCH']);
  const additionalLangIdx = getHeaderIndex(headers, ['ADDITIONAL LANGUAGE', 'ADDITIONALLANGUAGE']);
  const programIdx = getHeaderIndex(headers, ['PROGRAM']);

  if (studentIdIdx === -1 || studentNameIdx === -1) {
    console.error('Critical columns missing. Must have student ID and name.');
    process.exit(1);
  }

  // Load existing batches to map batch names to UUIDs
  const dbBatches = await prisma.batch.findMany();
  const batchMap = {};
  dbBatches.forEach(b => {
    batchMap[b.name.trim().toLowerCase()] = b.id;
  });

  let createdCount = 0;
  let updatedCount = 0;

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const rawStudentId = (row[studentIdIdx] || '').toString().trim();
    const studentName = (row[studentNameIdx] || '').toString().trim();
    if (!rawStudentId || !studentName) continue;

    const studentId = rawStudentId.toUpperCase();

    // Map Batch
    let batchId = null;
    if (batchIdx !== -1 && row[batchIdx]) {
      const bName = row[batchIdx].toString().trim().toLowerCase();
      if (batchMap[bName]) {
        batchId = batchMap[bName];
      } else {
        // Create batch dynamically if not exists
        const actualName = row[batchIdx].toString().trim();
        const newBatch = await prisma.batch.create({ data: { name: actualName } });
        batchMap[bName] = newBatch.id;
        batchId = newBatch.id;
        console.log(`  Created missing batch dynamically: "${actualName}"`);
      }
    }

    // Dates
    let dob = null;
    if (dobIdx !== -1 && row[dobIdx]) {
      const d = new Date(row[dobIdx]);
      if (!isNaN(d.getTime())) dob = d;
    }

    let dateOfApplication = null;
    if (dateOfAppIdx !== -1 && row[dateOfAppIdx]) {
      const d = new Date(row[dateOfAppIdx]);
      if (!isNaN(d.getTime())) dateOfApplication = d;
    }

    const payload = {
      studentName,
      startSession: startSessionIdx === -1 ? null : (row[startSessionIdx] || '').toString().trim() || null,
      endSession: endSessionIdx === -1 ? null : (row[endSessionIdx] || '').toString().trim() || null,
      dateOfApplication,
      fatherName: fatherNameIdx === -1 ? null : (row[fatherNameIdx] || '').toString().trim() || null,
      dob,
      mobileNumbers: mobileIdx === -1 ? null : (row[mobileIdx] || '').toString().trim() || null,
      email: emailIdx === -1 ? null : (row[emailIdx] || '').toString().trim() || null,
      motherName: motherNameIdx === -1 ? null : (row[motherNameIdx] || '').toString().trim() || null,
      category: categoryIdx === -1 ? null : (row[categoryIdx] || '').toString().trim() || null,
      fatherOccupation: fatherOccIdx === -1 ? null : (row[fatherOccIdx] || '').toString().trim() || null,
      defenceService: defenceIdx === -1 ? null : (row[defenceIdx] || '').toString().trim() || null,
      jobDescription: jobIdx === -1 ? null : (row[jobIdx] || '').toString().trim() || null,
      class: classIdx === -1 ? null : (row[classIdx] || '').toString().trim() || null,
      presentSchool: schoolIdx === -1 ? null : (row[schoolIdx] || '').toString().trim() || null,
      additionalLanguage: additionalLangIdx === -1 ? null : (row[additionalLangIdx] || '').toString().trim() || null,
      program: programIdx === -1 ? null : (row[programIdx] || '').toString().trim() || null,
      batchId,
      status: 'ACTIVE',
    };

    const existing = await prisma.student.findUnique({ where: { studentId } });
    if (existing) {
      await prisma.student.update({
        where: { studentId },
        data: payload,
      });
      updatedCount++;
    } else {
      await prisma.student.create({
        data: {
          studentId,
          ...payload,
        },
      });
      createdCount++;
    }
  }

  console.log(`\n=== Seeding Finished ===`);
  console.log(`  Students created: ${createdCount}`);
  console.log(`  Students updated: ${updatedCount}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
