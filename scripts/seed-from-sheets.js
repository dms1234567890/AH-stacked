/**
 * Seed script: Reads data from Google Sheets and populates PostgreSQL.
 * Run this once to migrate existing data from the legacy Google Sheets
 * into the new PostgreSQL database.
 *
 * Usage: npx ts-node scripts/seed-from-sheets.ts
 */
import * as bcrypt from 'bcryptjs';
import { google } from 'googleapis';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
// Google Sheets IDs (from .env)
const LOGIN_TASK_SHEET_ID = process.env.GOOGLE_LOGIN_SHEET_ID || '1_vUAFShQrvHRlJALfcnBCCZEZF7zHYGuulYV-kPifTI';
const CLASSES_STUDENTS_SHEET_ID = process.env.GOOGLE_CLASSES_STUDENTS_SHEET_ID || '1DK4OpEdEDh2z_Ng9vIHbci41yBLSQ2m4ZXI7sqA7mJs';
const ADMISSIONS_SHEET_ID = process.env.GOOGLE_ADMISSIONS_SHEET_ID || '1StEreMtS9_mbt4Np-T0J4WK5ILwDqyxmtqwxw8ZebOA';
async function getSheetsClient() {
    const auth = new google.auth.JWT(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL, undefined, (process.env.GOOGLE_PRIVATE_KEY || '').replace(/\\n/g, '\n'), ['https://www.googleapis.com/auth/spreadsheets.readonly']);
    return google.sheets({ version: 'v4', auth });
}
async function getSheetData(sheets, spreadsheetId, range) {
    try {
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        return response.data.values || [];
    }
    catch (error) {
        console.warn(`Warning: Could not read sheet ${spreadsheetId}/${range}:`, error?.message);
        return [];
    }
}
async function seedUsers(sheets) {
    console.log('\n--- Seeding Users ---');
    const data = await getSheetData(sheets, LOGIN_TASK_SHEET_ID, 'Login!A:G');
    if (data.length < 2) {
        console.log('No user data found in Login sheet');
        return;
    }
    let created = 0;
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const username = (row[0] || '').toString().trim();
        const password = (row[1] || '').toString().trim();
        const post = (row[2] || 'ACADEMIC MANAGER').toString().trim();
        const id = (row[3] || '').toString().trim();
        const name = (row[4] || username).toString().trim();
        const email = (row[5] || '').toString().trim();
        const mobile = (row[6] || '').toString().trim();
        if (!username || !password)
            continue;
        // Check if user already exists
        const existing = await prisma.user.findUnique({ where: { username } });
        if (existing) {
            console.log(`  User "${username}" already exists, skipping`);
            continue;
        }
        // Hash the password (original sheet has plaintext)
        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.user.create({
            data: {
                username,
                passwordHash,
                post,
                name,
                email: email || undefined,
                mobile: mobile || undefined,
                role: post === 'ADMIN' ? 'ADMIN' : 'STAFF',
            },
        });
        console.log(`  Created user: ${username} (${name})`);
        created++;
    }
    console.log(`  Total users created: ${created}`);
}
async function seedEmployees(sheets) {
    console.log('\n--- Seeding Employees ---');
    const data = await getSheetData(sheets, LOGIN_TASK_SHEET_ID, 'Personal Detail!A:B');
    if (data.length < 2) {
        console.log('No employee data found');
        return;
    }
    let created = 0;
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const name = (row[0] || '').toString().trim();
        const employeeId = (row[1] || '').toString().trim();
        if (!name || !employeeId)
            continue;
        const existing = await prisma.employee.findUnique({ where: { employeeId } });
        if (existing)
            continue;
        await prisma.employee.create({ data: { name, employeeId } });
        created++;
    }
    console.log(`  Total employees created: ${created}`);
}
async function seedTeachers(sheets) {
    console.log('\n--- Seeding Teachers ---');
    const data = await getSheetData(sheets, CLASSES_STUDENTS_SHEET_ID, 'Personal Detail!A:C');
    if (data.length < 2) {
        console.log('No teacher data found');
        return;
    }
    let created = 0;
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const name = (row[0] || '').toString().trim();
        const teacherId = (row[1] || '').toString().trim();
        const email = (row[2] || '').toString().trim();
        if (!name || !teacherId)
            continue;
        const existing = await prisma.teacher.findUnique({ where: { teacherId } });
        if (existing)
            continue;
        await prisma.teacher.create({ data: { name, teacherId, email: email || undefined } });
        created++;
    }
    console.log(`  Total teachers created: ${created}`);
}
async function seedSubjects(sheets) {
    console.log('\n--- Seeding Subjects ---');
    const data = await getSheetData(sheets, CLASSES_STUDENTS_SHEET_ID, 'Subjects!A:B');
    if (data.length < 2) {
        console.log('No subject data found');
        return;
    }
    let created = 0;
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const name = (row[0] || '').toString().trim();
        const code = (row[1] || name.substring(0, 4).toUpperCase()).toString().trim();
        if (!name)
            continue;
        const existing = await prisma.subject.findFirst({ where: { OR: [{ name }, { code }] } });
        if (existing)
            continue;
        await prisma.subject.create({ data: { name, code } });
        created++;
    }
    console.log(`  Total subjects created: ${created}`);
}
async function seedBatches(sheets) {
    console.log('\n--- Seeding Batches ---');
    const data = await getSheetData(sheets, CLASSES_STUDENTS_SHEET_ID, 'Batches!A:C');
    if (data.length < 2) {
        console.log('No batch data found');
        return;
    }
    let created = 0;
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const name = (row[0] || '').toString().trim();
        const classRoom = (row[2] || '').toString().trim();
        if (!name)
            continue;
        const existing = await prisma.batch.findFirst({ where: { name } });
        if (existing)
            continue;
        await prisma.batch.create({ data: { name, classRoom: classRoom || undefined } });
        created++;
    }
    console.log(`  Total batches created: ${created}`);
}
async function seedAdmissions(sheets) {
    console.log('\n--- Seeding Admissions ---');
    const data = await getSheetData(sheets, ADMISSIONS_SHEET_ID, 'Admissions!A:W');
    if (data.length < 2) {
        console.log('No admission data found');
        return;
    }
    // Get headers to map columns
    const headers = data[0].map((h) => h.toString().trim());
    const colMap = {};
    headers.forEach((h, i) => { colMap[h] = i; });
    let created = 0;
    for (let i = 1; i < data.length; i++) {
        const row = data[i];
        const studentId = (row[colMap['StudentsId']] || '').toString().trim();
        const studentName = (row[colMap['Student Name']] || '').toString().trim();
        if (!studentId || !studentName)
            continue;
        const existing = await prisma.admission.findUnique({ where: { studentId } });
        if (existing)
            continue;
        await prisma.admission.create({
            data: {
                studentId,
                studentName,
                startSession: (row[colMap['Start Session']] || '').toString().trim() || undefined,
                endSession: (row[colMap['End Session']] || '').toString().trim() || undefined,
                fatherName: (row[colMap["Father's Name"]] || '').toString().trim() || undefined,
                motherName: (row[colMap["Mother's Name"]] || '').toString().trim() || undefined,
                mobileNumbers: (row[colMap['Mobile Numbers']] || '').toString().trim() || undefined,
                email: (row[colMap['Email']] || '').toString().trim() || undefined,
                category: (row[colMap['Category']] || '').toString().trim() || undefined,
                class: (row[colMap['Class']] || '').toString().trim() || undefined,
                program: (row[colMap['Program']] || '').toString().trim() || undefined,
            },
        });
        created++;
    }
    console.log(`  Total admissions created: ${created}`);
}
async function main() {
    console.log('=== Seed from Google Sheets ===');
    console.log('This script reads data from your Google Sheets and populates PostgreSQL.');
    console.log('Make sure your .env file has the correct Google Sheets credentials.\n');
    // Check if Google credentials are configured
    if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
        console.error('ERROR: Google Service Account credentials not found in .env');
        console.error('Please set GOOGLE_SERVICE_ACCOUNT_EMAIL and GOOGLE_PRIVATE_KEY');
        process.exit(1);
    }
    const sheets = await getSheetsClient();
    await seedUsers(sheets);
    await seedEmployees(sheets);
    await seedTeachers(sheets);
    await seedSubjects(sheets);
    await seedBatches(sheets);
    await seedAdmissions(sheets);
    console.log('\n=== Seeding Complete ===');
    console.log('You can now log in with your Google Sheets credentials.');
    console.log('Passwords have been hashed with bcrypt for security.\n');
    await prisma.$disconnect();
}
main().catch((error) => {
    console.error('Seed failed:', error);
    prisma.$disconnect();
    process.exit(1);
});
//# sourceMappingURL=seed-from-sheets.js.map