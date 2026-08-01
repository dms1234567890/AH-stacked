import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { GoogleSheetsService } from '../sync/google-sheets.service';

type SheetRows = Array<Array<string | number | boolean | null | undefined>>;

interface BatchRecord {
  batchName: string;
  updated?: boolean;
  updatedToday?: boolean;
  updatedWeekly?: boolean;
  rowsCount?: number;
  rowsCountToday?: number;
  weeklyRowCount?: number;
  presentStudents?: Set<string>;
  absentStudents?: Set<string>;
  completedEntries?: Set<string>;
  pendingEntries?: Set<string>;
  studentKeys?: Set<string>;
  teacherNames?: Set<string>;
  attempts?: Map<string, TestAttempt>;
  presentCount?: number;
  absentCount?: number;
  completedCount?: number;
  pendingCount?: number;
  uniqueStudentCount?: number;
  appearedCount?: number;
  averageMarks?: number;
  topPerformer?: TestPerformer | null;
}

interface TestAttempt {
  studentName: string;
  totalObtained: number;
  totalMax: number;
  hasGrandTotal: boolean;
}

interface TestPerformer {
  name: string;
  percentage: number;
  obtained: number;
  maxMarks: number;
}

export interface BatchSummary {
  batchKey: string;
  batchName: string;
  totalStudents: number;
  missingItems: string[];
  attendance: {
    updated: boolean;
    recordsCount: number;
    presentCount: number;
    absentCount: number;
    teacherNames: string[];
  };
  homework: {
    updated: boolean;
    recordsCount: number;
    completedCount: number;
    pendingCount: number;
    teacherNames: string[];
  };
  test: {
    updatedToday: boolean;
    updatedWeekly: boolean;
    rowsCountToday: number;
    weeklyRowCount: number;
    appearedCount: number;
    averageMarks: number;
    topPerformer: TestPerformer | null;
  };
}

export interface DailyAlertsPayload {
  selectedDate: string;
  selectedDisplayDate: string;
  allBatchesUpdated: boolean;
  alerts: string[];
  batches: BatchSummary[];
  rosterMessage: string;
}

const HOMEWORK_SHEET_ID = '1IR48k48Koil2lHv_coP8yBmLYUcGBOy_9xgdd9t6YR8';
const CLASSES_SHEET_ID = '1DK4OpEdEDh2z_Ng9vIHbci41yBLSQ2m4ZXI7sqA7mJs';
const TEST_WINDOW_DAYS = 7;

@Injectable()
export class DailyAlertsService {
  constructor(private readonly sheets: GoogleSheetsService) {}

  async getAlerts(dateInput?: string): Promise<DailyAlertsPayload> {
    const selectedDate = this.parseDateInput(dateInput);
    if (!this.sheets.isAvailable()) {
      throw new ServiceUnavailableException(
        'Daily Alerts cannot connect to Google Sheets. Configure the Google service account and try again.',
      );
    }

    const homeworkSpreadsheetId = process.env.GOOGLE_HOMEWORK_SHEET_ID || HOMEWORK_SHEET_ID;
    const classesSpreadsheetId = process.env.GOOGLE_CLASSES_STUDENTS_SHEET_ID || CLASSES_SHEET_ID;
    const resultsSpreadsheetId = process.env.GOOGLE_RESULTS_SHEET_ID || classesSpreadsheetId;

    const [rosterRows, attendanceRows, homeworkRows, testRows] = await Promise.all([
      this.readRequiredSheet(classesSpreadsheetId, {
        names: ['students_database', 'Students Database', 'Student Database', 'Admissions', 'Admissions Data', 'ClassesDataForStudetnt', 'ClassesDataForStudent', 'Classes Data For Student', 'Classes Data'],
        requiredHeaders: [
          ['StudentsId', 'StudentID', 'Student Id', 'Admission No', 'Admission Number'],
          ['Student Name', 'StudentName', 'Students Name', 'StudentsName', 'Name'],
          ['Batch', 'Batch Name', 'BatchName', 'Class Batch', 'Class'],
        ],
        label: 'student roster',
      }),
      this.readRequiredSheet(homeworkSpreadsheetId, {
        names: ["Student'sAttendenceData", 'StudentsAttendenceData', 'Student Attendance Data', 'Attendance'],
        requiredHeaders: [['Date'], ['Batch'], ['PresenceType', 'Status']],
        label: 'attendance',
      }),
      this.readRequiredSheet(homeworkSpreadsheetId, {
        names: ['Homework_data', 'Homework Data', 'Homework', 'HomeworkData'],
        requiredHeaders: [['EntryID'], ['Date'], ['Batch'], ['StudentID', 'Student Id']],
        label: 'homework',
      }),
      this.readRequiredSheet(resultsSpreadsheetId, {
        names: ['Final_Results', 'Final Results', 'Results', 'Test Results', 'ResultData', 'Result Data'],
        requiredHeaders: [['Test ID', 'TestID'], ['Exam Date', 'Date'], ['Batch Name', 'Batch'], ['Student ID', 'StudentID']],
        label: 'test results',
      }),
    ]);

    const roster = this.buildRosterStats(rosterRows, selectedDate);
    const attendance = this.aggregateAttendance(attendanceRows, selectedDate);
    const homework = this.aggregateHomework(homeworkRows, selectedDate);
    const tests = this.aggregateTests(testRows, selectedDate);
    const batches = Object.keys(roster.totalStudentsByBatch)
      .filter((batchKey) => roster.totalStudentsByBatch[batchKey] > 0)
      .sort((left, right) => left.localeCompare(right))
      .map((batchKey) => this.composeBatchSummary(batchKey, roster, attendance, homework, tests));
    const selectedDisplayDate = this.formatDisplayDate(selectedDate);
    const alerts = this.buildAlerts(batches, selectedDisplayDate);

    return {
      selectedDate: this.formatDateKey(selectedDate),
      selectedDisplayDate,
      allBatchesUpdated: alerts.length === 0,
      alerts,
      batches,
      rosterMessage: roster.message,
    };
  }

  private async readRequiredSheet(
    spreadsheetId: string,
    config: { names: string[]; requiredHeaders: string[][]; label: string },
  ): Promise<SheetRows> {
    for (const sheetName of config.names) {
      try {
        const values = await this.sheets.getSheetValues(spreadsheetId, `${sheetName}!A:ZZ`);
        if (values && values.length && this.hasRequiredHeaders(values[0], config.requiredHeaders)) {
          return values;
        }
      } catch (err: any) {
        // Continue searching other potential sheet names
      }
    }

    return [];
  }

  private buildRosterStats(rows: SheetRows, selectedDate: Date) {
    const headers = this.buildHeaderIndex(rows[0] || []);
    const studentIdIndex = this.findColumnIndex(headers, ['StudentsId', 'StudentID', 'Student Id', 'Students ID', 'Student Id.', 'Admission No', 'Admission Number']);
    const studentNameIndex = this.findColumnIndex(headers, ['Student Name', 'StudentName', 'StudentsName', 'Students Name', 'Name']);
    const batchIndex = this.findColumnIndex(headers, ['Batch', 'Batch Name', 'BatchName', 'Class Batch', 'Class']);
    const startSessionIndex = this.findColumnIndex(headers, ['Start Session', 'StartSession', 'Session Start', 'SessionStart', 'Session Start Date', 'SessionStartDate', 'Start Session Date', 'StartSessionDate', 'Session From', 'SessionFrom', 'Batch Start', 'BatchStart', 'Start Date', 'StartDate']);
    const endSessionIndex = this.findColumnIndex(headers, ['End Session', 'EndSession', 'Session End', 'SessionEnd', 'Session End Date', 'SessionEndDate', 'End Session Date', 'EndSessionDate', 'Session To', 'SessionTo', 'Batch End', 'BatchEnd', 'End Date', 'EndDate']);
    const useSessionFilter = startSessionIndex !== -1 || endSessionIndex !== -1;

    const populate = (filterSessions: boolean) => {
      const displayNames: Record<string, string> = {};
      const studentsByBatch: Record<string, Set<string>> = {};
      rows.slice(1).forEach((row, index) => {
        if (filterSessions && !this.isRosterSessionActive(row[startSessionIndex], row[endSessionIndex], selectedDate)) return;
        const batch = this.registerBatchName(displayNames, row[batchIndex]);
        if (!batch) return;
        const studentKey = this.cleanText(row[studentIdIndex]) || this.cleanText(row[studentNameIndex]) || `ROW_${index + 1}`;
        (studentsByBatch[batch.key] ||= new Set()).add(studentKey);
      });
      return { displayNames, studentsByBatch };
    };

    let { displayNames, studentsByBatch } = populate(useSessionFilter);
    let fallbackUsed = false;
    if (useSessionFilter && !Object.keys(studentsByBatch).length && rows.length > 1) {
      ({ displayNames, studentsByBatch } = populate(false));
      fallbackUsed = Object.keys(studentsByBatch).length > 0;
    }

    const totalStudentsByBatch: Record<string, number> = {};
    Object.entries(studentsByBatch).forEach(([batchKey, students]) => {
      totalStudentsByBatch[batchKey] = students.size;
    });
    const message = fallbackUsed
      ? `No rows matched Start Session / End Session for ${this.formatDisplayDate(selectedDate)}, so all roster rows are shown. Check session values.`
      : !useSessionFilter
        ? 'Session columns were not matched in students_database, so all roster rows are being used.'
        : startSessionIndex === -1
          ? 'Start Session column was not matched in students_database, so session filtering may be incomplete.'
          : endSessionIndex === -1
            ? 'End Session column was not matched in students_database, so batches are treated as open-ended after their start session.'
            : 'Active batches are filtered from students_database using Start Session and End Session.';

    return { displayNames, totalStudentsByBatch, message };
  }

  private aggregateAttendance(rows: SheetRows, selectedDate: Date) {
    const byBatch: Record<string, BatchRecord> = {};
    const headers = this.buildHeaderIndex(rows[0] || []);
    const dateIndex = this.findColumnIndex(headers, ['Date']);
    const batchIndex = this.findColumnIndex(headers, ['Batch']);
    const studentIdIndex = this.findColumnIndex(headers, ['StudentsId', 'StudentID', 'Student Id']);
    const studentNameIndex = this.findColumnIndex(headers, ['StudentsName', 'Student Name', 'StudentName']);
    const presenceTypeIndex = this.findColumnIndex(headers, ['PresenceType', 'Status']);
    const teacherNameIndex = this.findColumnIndex(headers, ['TeacherName', 'Teacher Name']);
    const displayNames: Record<string, string> = {};
    const selectedDateKey = this.formatDateKey(selectedDate);

    rows.slice(1).forEach((row, index) => {
      if (this.getDateKey(row[dateIndex]) !== selectedDateKey) return;
      const batch = this.registerBatchName(displayNames, row[batchIndex]);
      if (!batch) return;
      const record = (byBatch[batch.key] ||= {
        batchName: batch.name, updated: false, rowsCount: 0, presentStudents: new Set(), absentStudents: new Set(), teacherNames: new Set(),
      });
      const studentKey = this.cleanText(row[studentIdIndex]) || this.cleanText(row[studentNameIndex]) || `ROW_${index + 1}`;
      record.updated = true;
      record.rowsCount = (record.rowsCount || 0) + 1;
      const teacherName = this.cleanText(row[teacherNameIndex]);
      if (teacherName) record.teacherNames?.add(teacherName);
      if (this.isPresentValue(this.normalizeKey(row[presenceTypeIndex]))) {
        record.presentStudents?.add(studentKey);
        record.absentStudents?.delete(studentKey);
      } else if (!record.presentStudents?.has(studentKey)) {
        record.absentStudents?.add(studentKey);
      }
    });

    Object.values(byBatch).forEach((record) => {
      record.presentCount = record.presentStudents?.size || 0;
      record.absentCount = record.absentStudents?.size || 0;
    });
    return byBatch;
  }

  private aggregateHomework(rows: SheetRows, selectedDate: Date) {
    const byBatch: Record<string, BatchRecord> = {};
    const headers = this.buildHeaderIndex(rows[0] || []);
    const dateIndex = this.findColumnIndex(headers, ['Date']);
    const batchIndex = this.findColumnIndex(headers, ['Batch']);
    const studentIdIndex = this.findColumnIndex(headers, ['StudentID', 'Student Id']);
    const studentNameIndex = this.findColumnIndex(headers, ['StudentName', 'Student Name']);
    const subjectIndex = this.findColumnIndex(headers, ['Subject']);
    const statusIndex = this.findColumnIndex(headers, ['FinalStatus', 'Status']);
    const teacherNameIndex = this.findColumnIndex(headers, ['TeacherName', 'Teacher Name']);
    const displayNames: Record<string, string> = {};
    const selectedDateKey = this.formatDateKey(selectedDate);

    rows.slice(1).forEach((row, index) => {
      if (this.getDateKey(row[dateIndex]) !== selectedDateKey) return;
      const batch = this.registerBatchName(displayNames, row[batchIndex]);
      if (!batch) return;
      const record = (byBatch[batch.key] ||= {
        batchName: batch.name, updated: false, rowsCount: 0, completedEntries: new Set(), pendingEntries: new Set(), studentKeys: new Set(), teacherNames: new Set(),
      });
      const studentKey = this.cleanText(row[studentIdIndex]) || this.cleanText(row[studentNameIndex]) || `ROW_${index + 1}`;
      const homeworkKey = `${studentKey}::${this.cleanText(row[subjectIndex]) || 'GENERAL'}`;
      record.updated = true;
      record.rowsCount = (record.rowsCount || 0) + 1;
      record.studentKeys?.add(studentKey);
      const teacherName = this.cleanText(row[teacherNameIndex]);
      if (teacherName) record.teacherNames?.add(teacherName);
      if (this.isCompletedHomework(this.normalizeKey(row[statusIndex]))) {
        record.completedEntries?.add(homeworkKey);
        record.pendingEntries?.delete(homeworkKey);
      } else if (!record.completedEntries?.has(homeworkKey)) {
        record.pendingEntries?.add(homeworkKey);
      }
    });

    Object.values(byBatch).forEach((record) => {
      record.completedCount = record.completedEntries?.size || 0;
      record.pendingCount = record.pendingEntries?.size || 0;
      record.uniqueStudentCount = record.studentKeys?.size || 0;
    });
    return byBatch;
  }

  private aggregateTests(rows: SheetRows, selectedDate: Date) {
    const byBatch: Record<string, BatchRecord> = {};
    const headers = this.buildHeaderIndex(rows[0] || []);
    const dateIndex = this.findColumnIndex(headers, ['Exam Date', 'Date']);
    const batchIndex = this.findColumnIndex(headers, ['Batch Name', 'Batch']);
    const testIdIndex = this.findColumnIndex(headers, ['Test ID', 'TestID']);
    const studentIdIndex = this.findColumnIndex(headers, ['Student ID', 'StudentID']);
    const studentNameIndex = this.findColumnIndex(headers, ['Student Name', 'StudentName']);
    const totalObtainedIndex = this.findColumnIndex(headers, ['Total Obtained Marks']);
    const totalMaxIndex = this.findColumnIndex(headers, ['Exam Total Max Marks']);
    const subjectObtainedIndex = this.findColumnIndex(headers, ['Subject Obtained Marks']);
    const subjectMaxIndex = this.findColumnIndex(headers, ['Subject Max Marks']);
    const displayNames: Record<string, string> = {};
    const selectedDateKey = this.formatDateKey(selectedDate);
    const windowStart = new Date(selectedDate);
    windowStart.setDate(windowStart.getDate() - (TEST_WINDOW_DAYS - 1));

    rows.slice(1).forEach((row, index) => {
      const rowDate = this.parseFlexibleDate(row[dateIndex]);
      if (!rowDate) return;
      const batch = this.registerBatchName(displayNames, row[batchIndex]);
      if (!batch) return;
      const record = (byBatch[batch.key] ||= {
        batchName: batch.name, updatedToday: false, updatedWeekly: false, rowsCountToday: 0, weeklyRowCount: 0, attempts: new Map(),
      });
      if (rowDate >= windowStart && rowDate <= selectedDate) {
        record.updatedWeekly = true;
        record.weeklyRowCount = (record.weeklyRowCount || 0) + 1;
      }
      if (this.formatDateKey(rowDate) !== selectedDateKey) return;

      record.updatedToday = true;
      record.rowsCountToday = (record.rowsCountToday || 0) + 1;
      const testId = this.cleanText(row[testIdIndex]) || 'TEST';
      const studentKey = this.cleanText(row[studentIdIndex]) || this.cleanText(row[studentNameIndex]) || `ROW_${index + 1}`;
      const attemptKey = `${testId}::${studentKey}`;
      const attempt = record.attempts?.get(attemptKey) || {
        studentName: this.cleanText(row[studentNameIndex]) || this.cleanText(row[studentIdIndex]) || 'Unknown',
        totalObtained: 0, totalMax: 0, hasGrandTotal: false,
      };
      const totalMax = this.toNumber(row[totalMaxIndex]);
      if (totalMax > 0) {
        attempt.totalObtained = this.toNumber(row[totalObtainedIndex]);
        attempt.totalMax = totalMax;
        attempt.hasGrandTotal = true;
      } else if (!attempt.hasGrandTotal && this.toNumber(row[subjectMaxIndex]) > 0) {
        attempt.totalObtained += this.toNumber(row[subjectObtainedIndex]);
        attempt.totalMax += this.toNumber(row[subjectMaxIndex]);
      }
      record.attempts?.set(attemptKey, attempt);
    });

    Object.values(byBatch).forEach((record) => {
      let percentageSum = 0;
      let appearedCount = 0;
      let topPerformer: TestPerformer | null = null;
      record.attempts?.forEach((attempt) => {
        if (attempt.totalMax <= 0) return;
        const percentage = (attempt.totalObtained / attempt.totalMax) * 100;
        percentageSum += percentage;
        appearedCount += 1;
        if (!topPerformer || percentage > topPerformer.percentage) {
          topPerformer = { name: attempt.studentName, percentage, obtained: attempt.totalObtained, maxMarks: attempt.totalMax };
        }
      });
      record.appearedCount = appearedCount;
      record.averageMarks = appearedCount ? percentageSum / appearedCount : 0;
      record.topPerformer = topPerformer;
    });
    return byBatch;
  }

  private composeBatchSummary(
    batchKey: string,
    roster: { displayNames: Record<string, string>; totalStudentsByBatch: Record<string, number> },
    attendanceByBatch: Record<string, BatchRecord>,
    homeworkByBatch: Record<string, BatchRecord>,
    testsByBatch: Record<string, BatchRecord>,
  ): BatchSummary {
    const attendanceSource = attendanceByBatch[batchKey] || {};
    const homeworkSource = homeworkByBatch[batchKey] || {};
    const testSource = testsByBatch[batchKey] || {};
    const inferredTotalStudents = Math.max(
      (attendanceSource.presentCount || 0) + (attendanceSource.absentCount || 0),
      homeworkSource.uniqueStudentCount || 0,
      testSource.appearedCount || 0,
      0,
    );
    const totalStudents = roster.totalStudentsByBatch[batchKey] || inferredTotalStudents;
    const explicitAbsentCount = attendanceSource.absentCount || 0;
    const inferredAbsentCount = totalStudents > 0 && attendanceSource.updated
      ? Math.max(totalStudents - (attendanceSource.presentCount || 0), 0)
      : explicitAbsentCount;
    const missingItems: string[] = [];
    if (!attendanceSource.updated) missingItems.push('Attendance not updated');
    if (!homeworkSource.updated) missingItems.push('Homework not updated');
    if (!testSource.updatedWeekly) missingItems.push('Weekly test data not updated');

    return {
      batchKey,
      batchName: roster.displayNames[batchKey] || attendanceSource.batchName || homeworkSource.batchName || testSource.batchName || batchKey,
      totalStudents,
      missingItems,
      attendance: {
        updated: Boolean(attendanceSource.updated), recordsCount: attendanceSource.rowsCount || 0,
        presentCount: attendanceSource.presentCount || 0,
        absentCount: Math.max(explicitAbsentCount, inferredAbsentCount),
        teacherNames: Array.from(attendanceSource.teacherNames || []),
      },
      homework: {
        updated: Boolean(homeworkSource.updated), recordsCount: homeworkSource.rowsCount || 0,
        completedCount: homeworkSource.completedCount || 0, pendingCount: homeworkSource.pendingCount || 0,
        teacherNames: Array.from(homeworkSource.teacherNames || []),
      },
      test: {
        updatedToday: Boolean(testSource.updatedToday), updatedWeekly: Boolean(testSource.updatedWeekly),
        rowsCountToday: testSource.rowsCountToday || 0, weeklyRowCount: testSource.weeklyRowCount || 0,
        appearedCount: testSource.appearedCount || 0, averageMarks: this.round(testSource.averageMarks || 0),
        topPerformer: testSource.topPerformer ? { ...testSource.topPerformer, percentage: this.round(testSource.topPerformer.percentage) } : null,
      },
    };
  }

  private buildAlerts(batches: BatchSummary[], selectedDisplayDate: string): string[] {
    return batches
      .filter((batch) => batch.missingItems.length > 0)
      .map((batch) => {
        const missing = [
          !batch.attendance.updated ? 'attendance' : '',
          !batch.homework.updated ? 'homework' : '',
          !batch.test.updatedWeekly ? 'weekly test data' : '',
        ].filter(Boolean);
        return `${batch.batchName} ${this.joinNaturalList(missing)} not updated for ${selectedDisplayDate}. Please update immediately.`;
      });
  }

  private parseDateInput(value?: string): Date {
    const parsed = this.parseFlexibleDate(value || this.localToday());
    if (!parsed) throw new BadRequestException(`Invalid date input: ${value}`);
    return parsed;
  }

  private parseFlexibleDate(value: unknown): Date | null {
    if (value === null || value === undefined || value === '') return null;
    if (value instanceof Date && !Number.isNaN(value.getTime())) return new Date(value.getFullYear(), value.getMonth(), value.getDate());
    if (typeof value === 'number') {
      if (value > 20_000 && value < 80_000) {
        const result = new Date(Math.round((value - 25569) * 86_400_000));
        return new Date(result.getFullYear(), result.getMonth(), result.getDate());
      }
      const result = new Date(value);
      return Number.isNaN(result.getTime()) ? null : new Date(result.getFullYear(), result.getMonth(), result.getDate());
    }
    const text = this.cleanText(value);
    let match = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (match) return this.validatedDate(Number(match[1]), Number(match[2]), Number(match[3]));
    match = text.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})(?:\s+.*)?$/);
    if (match) return this.parseDayMonthDate(Number(match[1]), Number(match[2]), Number(match[3]));
    match = text.match(/^(\d{4})[\/\-.](\d{1,2})[\/\-.](\d{1,2})(?:\s+.*)?$/);
    if (match) return this.validatedDate(Number(match[1]), Number(match[2]), Number(match[3]));
    const fallback = new Date(text);
    return Number.isNaN(fallback.getTime()) ? null : new Date(fallback.getFullYear(), fallback.getMonth(), fallback.getDate());
  }

  private parseDayMonthDate(first: number, second: number, year: number): Date | null {
    if (first > 12 && second <= 12) return this.validatedDate(year, second, first);
    if (second > 12 && first <= 12) return this.validatedDate(year, first, second);
    return this.validatedDate(year, second, first) || this.validatedDate(year, first, second);
  }

  private validatedDate(year: number, month: number, day: number): Date | null {
    const date = new Date(year, month - 1, day);
    return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day ? date : null;
  }

  private isRosterSessionActive(start: unknown, end: unknown, selectedDate: Date): boolean {
    const startDate = this.parseFlexibleDate(start);
    if (!startDate || startDate > selectedDate) return false;
    if (!this.cleanText(end)) return true;
    const endDate = this.parseFlexibleDate(end);
    return Boolean(endDate && endDate >= selectedDate);
  }

  private hasRequiredHeaders(headers: SheetRows[number], requirements: string[][]): boolean {
    const headerIndex = this.buildHeaderIndex(headers);
    return requirements.every((aliases) => this.findColumnIndex(headerIndex, aliases) !== -1);
  }

  private buildHeaderIndex(headers: SheetRows[number]): Record<string, number> {
    const index: Record<string, number> = {};
    headers.forEach((header, position) => { index[this.normalizeKey(header)] = position; });
    return index;
  }

  private findColumnIndex(headers: Record<string, number>, aliases: string[]): number {
    for (const alias of aliases) {
      const index = headers[this.normalizeKey(alias)];
      if (index !== undefined) return index;
    }
    return -1;
  }

  private registerBatchName(displayNames: Record<string, string>, value: unknown) {
    const name = this.cleanText(value);
    const key = name.toLowerCase().replace(/\s+/g, ' ');
    if (!key) return null;
    displayNames[key] ||= name;
    return { key, name: displayNames[key] };
  }

  private getDateKey(value: unknown): string {
    const date = this.parseFlexibleDate(value);
    return date ? this.formatDateKey(date) : '';
  }

  private formatDateKey(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private formatDisplayDate(date: Date): string {
    return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
  }

  private localToday(): string {
    const now = new Date();
    return this.formatDateKey(now);
  }

  private normalizeKey(value: unknown): string {
    return this.cleanText(value).toLowerCase().replace(/[^a-z0-9]+/g, '');
  }

  private cleanText(value: unknown): string {
    return value === null || value === undefined ? '' : String(value).trim();
  }

  private toNumber(value: unknown): number {
    const number = Number(this.cleanText(value).replace(/,/g, '').replace(/%/g, ''));
    return Number.isFinite(number) ? number : 0;
  }

  private isPresentValue(value: string): boolean {
    return value.includes('present') && !value.includes('absent');
  }

  private isCompletedHomework(value: string): boolean {
    return ['complete', 'done', 'submit', 'checked'].some((status) => value.includes(status));
  }

  private joinNaturalList(items: string[]): string {
    if (items.length < 2) return items[0] || '';
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
  }

  private round(value: number): number {
    return Math.round(value * 10) / 10;
  }
}
