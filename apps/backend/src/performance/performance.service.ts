import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { GoogleSheetsService } from '../sync/google-sheets.service';

const HW_POINTS: Record<string, number> = {
  'COMPLETE': 10,
  'PARTIALLY COMPLETE': 7,
  'HALF COMPLETE': 5,
  'INCOMPLETE': 2,
  'HW COPY FORGET': 1,
  'ABSENT': 0,
};

const SHEET_ATTENDANCE_ALIASES = [
  "Student'sAttendenceData",
  'Student AttendanceData',
  'Student Attendance Data',
  'StudentAttendanceData',
  'Student_AttendanceData',
  'Student_Attendance_Data',
  'AttendanceData',
  'Attendance Data',
];

interface StudentMapValue {
  name: string;
  batch: string;
  fatherName: string;
  language: string;
  mobile: string;
  attendance: number;
  hwScore: number;
  resultScore: number;
  countResult: number;
  countHw: number;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  firstAttendanceDate: string;
  lastAttendanceDate: string;
  _firstAttendanceDateMs: number | null;
  _lastAttendanceDateMs: number | null;
  attendanceRecords: any[];
  totalObtainedMarks: number;
  totalMaxMarks: number;
  hwStatusCounts: Record<string, number>;
  resultCalculationDebug?: any;
}

@Injectable()
export class PerformanceService {
  private readonly logger = new Logger(PerformanceService.name);
  private readonly homeworkSpreadsheetId =
    process.env.GOOGLE_HOMEWORK_SHEET_ID || '1IR48k48Koil2lHv_coP8yBmLYUcGBOy_9xgdd9t6YR8';

  constructor(
    private readonly prisma: PrismaService,
    private readonly sheets: GoogleSheetsService,
  ) {}

  private mapHeaders(headers: any[]): Record<string, number> {
    const map: Record<string, number> = {};
    if (!headers) return map;
    for (let i = 0; i < headers.length; i++) {
      const h = (headers[i] || '').toString().trim().toUpperCase();
      if (h) map[h] = i;
    }
    return map;
  }

  private getHeaderIndex(map: Record<string, number>, keys: string[]): number {
    for (const k of keys) {
      const upper = k.toUpperCase();
      if (map[upper] !== undefined) return map[upper];
    }
    return -1;
  }

  private normalizeId(id: any): string {
    if (id === null || id === undefined) return '';
    return id.toString().trim().toUpperCase();
  }

  private normalizeText(text: any): string {
    if (text === null || text === undefined) return '';
    return text.toString().trim().toUpperCase();
  }

  private normalizeMobile(mobile: any): string {
    if (mobile === null || mobile === undefined) return '';
    const clean = mobile.toString().replace(/\D/g, '');
    return clean;
  }

  private parseDateValue(value: any): Date | null {
    if (!value) return null;
    if (value instanceof Date) return value;
    const d = new Date(value);
    if (!isNaN(d.getTime())) return d;
    return null;
  }

  private formatDate(date: Date): string {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  private buildDateFilter(fromDate?: string, toDate?: string) {
    if (!fromDate || !toDate) return null;
    const from = new Date(fromDate);
    from.setHours(0, 0, 0, 0);
    const to = new Date(toDate);
    to.setHours(23, 59, 59, 999);

    return (dateVal: any) => {
      const d = this.parseDateValue(dateVal);
      if (!d) return false;
      return d >= from && d <= to;
    };
  }

  private roundOne(val: number): number {
    return Math.round(val * 10) / 10;
  }

  private calculateMarksPercentage(obtained: number, max: number): number {
    if (max <= 0) return 0;
    return (obtained / max) * 100;
  }

  private getSubjectLanguage(subjectName: string): 'ENGLISH' | 'HINDI' | '' {
    const upper = this.normalizeText(subjectName);
    if (upper.includes('ENGLISH')) return 'ENGLISH';
    if (upper.includes('HINDI')) return 'HINDI';
    return '';
  }

  private shouldIncludeSubject(
    subjectName: string,
    studentLanguage: string,
    mode: string,
  ): boolean {
    if (!subjectName) return false;
    const lang = this.getSubjectLanguage(subjectName);
    if (!lang) return true;
    if (mode === 'BOTH') return true;
    if (mode === 'ENGLISH' || mode === 'HINDI') return lang === mode;
    if (mode === 'AUTO') {
      if (!studentLanguage) return true;
      return lang === studentLanguage;
    }
    return true;
  }

  private async fetchAttendanceData(): Promise<any[][]> {
    const mainSheetId = process.env.GOOGLE_CLASSES_STUDENTS_SHEET_ID;
    const hwSheetId = this.homeworkSpreadsheetId;

    if (hwSheetId) {
      for (const alias of SHEET_ATTENDANCE_ALIASES) {
        const values = await this.sheets.getSheetValues(hwSheetId, `${alias}!A:Z`);
        if (values && values.length > 1) {
          return values;
        }
      }
    }

    if (mainSheetId) {
      for (const alias of SHEET_ATTENDANCE_ALIASES) {
        const values = await this.sheets.getSheetValues(mainSheetId, `${alias}!A:Z`);
        if (values && values.length > 1) {
          return values;
        }
      }
    }

    return [];
  }

  private async buildLeaderboardPayload(
    fromDate?: string,
    toDate?: string,
    languageMode = 'AUTO',
    targetStudentId?: string,
    batchFilter = 'ALL',
  ) {
    const dateFilter = this.buildDateFilter(fromDate, toDate);
    const mainSheetId = process.env.GOOGLE_CLASSES_STUDENTS_SHEET_ID || '';

    // 1. Fetch active students from local database
    let dbStudents: any[] = [];
    try {
      dbStudents = await this.prisma.student.findMany({
        where: {
          status: 'ACTIVE',
          deletedAt: null,
        },
        include: {
          batch: true,
        },
      });
    } catch (err: any) {
      this.logger.warn(`PerformanceService DB student query warning: ${err.message}`);
    }

    const studentMap: Record<string, StudentMapValue> = {};
    const batches = new Set<string>();

    for (const s of dbStudents) {
      const id = this.normalizeId(s.studentId);
      if (!id) continue;
      const batchName = s.batch?.name || '';

      studentMap[id] = {
        name: s.studentName,
        batch: batchName,
        fatherName: s.fatherName || '',
        language: this.normalizeText(s.additionalLanguage || ''),
        mobile: this.normalizeMobile(s.mobileNumbers || ''),
        attendance: 0,
        hwScore: 0,
        resultScore: 0,
        countResult: 0,
        countHw: 0,
        totalDays: 0,
        presentDays: 0,
        absentDays: 0,
        firstAttendanceDate: '',
        lastAttendanceDate: '',
        _firstAttendanceDateMs: null,
        _lastAttendanceDateMs: null,
        attendanceRecords: [],
        totalObtainedMarks: 0,
        totalMaxMarks: 0,
        hwStatusCounts: {
          COMPLETE: 0,
          'PARTIALLY COMPLETE': 0,
          'HALF COMPLETE': 0,
          INCOMPLETE: 0,
          'HW COPY FORGET': 0,
          ABSENT: 0,
        },
      };

      if (batchName) batches.add(batchName);
    }

    // 2. Fetch homework data from sheets
    const hwValues = await this.sheets.getSheetValues(this.homeworkSpreadsheetId, 'Homework_data!A:Z');
    if (hwValues && hwValues.length > 1) {
      const hwHeaders = this.mapHeaders(hwValues[0]);
      const studentIdIndex = this.getHeaderIndex(hwHeaders, ['STUDENTID', 'STUDENT ID', 'STUDENT_ID']);
      const dateIndex = this.getHeaderIndex(hwHeaders, ['DATE']);
      const finalStatusIndex = this.getHeaderIndex(hwHeaders, ['FINALSTATUS', 'FINAL STATUS', 'FINAL_STATUS']);

      if (studentIdIndex !== -1 && dateIndex !== -1 && finalStatusIndex !== -1) {
        for (let i = 1; i < hwValues.length; i++) {
          const row = hwValues[i];
          const id = this.normalizeId(row[studentIdIndex]);
          if (!id || !studentMap[id]) continue;

          const dateVal = row[dateIndex];
          if (dateFilter && !dateFilter(dateVal)) continue;

          const status = this.normalizeText(row[finalStatusIndex]);
          const points = HW_POINTS[status] !== undefined ? HW_POINTS[status] : 5;

          studentMap[id].hwScore += points;
          studentMap[id].countHw++;
          if (studentMap[id].hwStatusCounts[status] !== undefined) {
            studentMap[id].hwStatusCounts[status]++;
          }
        }
      }
    }

    // 3. Fetch attendance data from sheets
    const attendanceValues = await this.fetchAttendanceData();
    if (attendanceValues && attendanceValues.length > 1) {
      const attHeaders = this.mapHeaders(attendanceValues[0]);
      const dateCol = this.getHeaderIndex(attHeaders, ['DATE']);
      const batchCol = this.getHeaderIndex(attHeaders, ['BATCH']);
      const studentIdCol = this.getHeaderIndex(attHeaders, ['STUDENTSID', 'STUDENTS ID', 'STUDENT ID', 'STUDENTID']);
      const presenceTypeCol = this.getHeaderIndex(attHeaders, ['PRESENCETYPE', 'PRESENCE TYPE', 'PRESENCE_TYPE']);
      const teacherNameCol = this.getHeaderIndex(attHeaders, ['TEACHERNAME', 'TEACHER NAME', 'TEACHER_NAME']);

      if (dateCol !== -1 && studentIdCol !== -1 && presenceTypeCol !== -1) {
        for (let i = 1; i < attendanceValues.length; i++) {
          const row = attendanceValues[i];
          const id = this.normalizeId(row[studentIdCol]);
          if (!id || !studentMap[id]) continue;

          const dateVal = row[dateCol];
          const dateObj = this.parseDateValue(dateVal);
          if (!dateObj) continue;
          if (dateFilter && !dateFilter(dateVal)) continue;

          const presenceType = this.normalizeText(row[presenceTypeCol]);
          if (presenceType !== 'PRESENT' && presenceType !== 'ABSENT') continue;

          const student = studentMap[id];
          if (presenceType === 'PRESENT') {
            student.presentDays++;
          } else {
            student.absentDays++;
          }
          student.totalDays++;

          const dateText = this.formatDate(dateObj);
          const dateTime = dateObj.getTime();
          const shouldKeepDetails = !targetStudentId || id === targetStudentId;

          if (shouldKeepDetails) {
            if (student._firstAttendanceDateMs === null || dateTime < student._firstAttendanceDateMs) {
              student._firstAttendanceDateMs = dateTime;
              student.firstAttendanceDate = dateText;
            }
            if (student._lastAttendanceDateMs === null || dateTime > student._lastAttendanceDateMs) {
              student._lastAttendanceDateMs = dateTime;
              student.lastAttendanceDate = dateText;
            }

            student.attendanceRecords.push({
              date: dateText,
              batch: batchCol === -1 ? '' : row[batchCol],
              presenceType: presenceType,
              teacherName: teacherNameCol === -1 ? '' : row[teacherNameCol],
              _sortTime: dateTime,
              _rowIndex: i,
            });
          }
        }
      }
    }

    // 4. Fetch results data from sheets
    const testMap: Record<string, any> = {};
    const subjectStats: Record<string, Record<string, { sumPct: number; count: number; sumObt: number; sumMax: number }>> = {};
    const subjectByStudent: Record<string, Record<string, { sumPct: number; count: number; sumObt: number; sumMax: number }>> = {};
    const seenResultRows = new Set<string>();

    const resValues = await this.sheets.getSheetValues(mainSheetId, 'Final_Results!A:Z');
    if (resValues && resValues.length > 1) {
      const resHeaders = this.mapHeaders(resValues[0]);
      const resStudentIdIndex = this.getHeaderIndex(resHeaders, ['STUDENT ID', 'STUDENTID']);
      const examDateIndex = this.getHeaderIndex(resHeaders, ['EXAM DATE', 'EXAMDATE', 'DATE']);
      const testIdIndex = this.getHeaderIndex(resHeaders, ['TEST ID', 'TESTID']);
      const examTypeIndex = this.getHeaderIndex(resHeaders, ['EXAM TYPE', 'EXAMTYPE']);
      const batchNameIndex = this.getHeaderIndex(resHeaders, ['BATCH NAME', 'BATCHNAME', 'BATCH']);
      const subjectNameIndex = this.getHeaderIndex(resHeaders, ['SUBJECT NAME', 'SUBJECTNAME', 'SUBJECT']);
      const subjectObtIndex = this.getHeaderIndex(resHeaders, ['SUBJECT OBTAINED MARKS', 'SUBJECT_OBTAINED_MARKS', 'OBTAINED']);
      const subjectMaxIndex = this.getHeaderIndex(resHeaders, ['SUBJECT MAX MARKS', 'SUBJECT_MAX_MARKS', 'MAX_MARKS']);
      const totalObtIndex = this.getHeaderIndex(resHeaders, ['TOTAL OBTAINED MARKS', 'TOTAL_OBTAINED_MARKS']);
      const totalMaxIndex = this.getHeaderIndex(resHeaders, ['EXAM TOTAL MAX MARKS', 'EXAM_TOTAL_MAX_MARKS']);

      if (resStudentIdIndex !== -1 && examDateIndex !== -1) {
        for (let i = 1; i < resValues.length; i++) {
          const row = resValues[i];
          const id = this.normalizeId(row[resStudentIdIndex]);
          if (!id || !studentMap[id]) continue;

          const dateVal = row[examDateIndex];
          if (dateFilter && !dateFilter(dateVal)) continue;

          const testId = testIdIndex === -1 ? 'T1' : this.normalizeText(row[testIdIndex]);
          const examType = examTypeIndex === -1 ? '' : this.normalizeText(row[examTypeIndex]);
          const batchName = batchNameIndex === -1 ? studentMap[id].batch : row[batchNameIndex];
          if (batchFilter !== 'ALL' && this.normalizeText(batchName) !== this.normalizeText(batchFilter)) continue;

          const subjectName = subjectNameIndex === -1 ? 'GENERAL' : String(row[subjectNameIndex]).trim();
          const subjectObtained = subjectObtIndex === -1 ? 0 : Number(row[subjectObtIndex]) || 0;
          const subjectMax = subjectMaxIndex === -1 ? 100 : Number(row[subjectMaxIndex]) || 0;

          const totalObtained = totalObtIndex === -1 ? 0 : Number(row[totalObtIndex]) || 0;
          const totalMax = totalMaxIndex === -1 ? 0 : Number(row[totalMaxIndex]) || 0;

          if (!this.shouldIncludeSubject(subjectName, studentMap[id].language, languageMode)) {
            continue;
          }

          const dateObj = this.parseDateValue(dateVal);
          const dateStr = dateObj ? this.formatDate(dateObj) : String(dateVal);
          const rowSignature = `${testId}|${id}|${subjectName.toUpperCase()}|${dateStr}`;
          if (seenResultRows.has(rowSignature)) continue;
          seenResultRows.add(rowSignature);

          const key = `${id}|${testId}|${dateStr}|${examType}|${batchName}`;
          if (!testMap[key]) {
            testMap[key] = {
              studentId: id,
              testId,
              examDate: dateStr,
              sumObtained: 0,
              sumMax: 0,
              totalObtained,
              totalMax,
              examType,
              batchName,
              subjects: [],
            };
          }

          testMap[key].sumObtained += subjectObtained;
          testMap[key].sumMax += subjectMax;

          if (subjectName && subjectMax > 0) {
            testMap[key].subjects.push({
              subjectName,
              obtainedMarks: this.roundOne(subjectObtained),
              maximumMarks: this.roundOne(subjectMax),
              subjectPercentage: this.roundOne(this.calculateMarksPercentage(subjectObtained, subjectMax)),
            });

            // Batch Subject Stats
            if (!subjectStats[batchName]) subjectStats[batchName] = {};
            if (!subjectStats[batchName][subjectName]) {
              subjectStats[batchName][subjectName] = { sumPct: 0, count: 0, sumObt: 0, sumMax: 0 };
            }
            const pct = this.calculateMarksPercentage(subjectObtained, subjectMax);
            subjectStats[batchName][subjectName].sumPct += pct;
            subjectStats[batchName][subjectName].sumObt += subjectObtained;
            subjectStats[batchName][subjectName].sumMax += subjectMax;
            subjectStats[batchName][subjectName].count++;

            // Student Subject Stats
            if (!subjectByStudent[id]) subjectByStudent[id] = {};
            if (!subjectByStudent[id][subjectName]) {
              subjectByStudent[id][subjectName] = { sumPct: 0, count: 0, sumObt: 0, sumMax: 0 };
            }
            subjectByStudent[id][subjectName].sumPct += pct;
            subjectByStudent[id][subjectName].sumObt += subjectObtained;
            subjectByStudent[id][subjectName].sumMax += subjectMax;
            subjectByStudent[id][subjectName].count++;
          }
        }
      }
    }

    // Apply overall aggregates
    for (const key in testMap) {
      const t = testMap[key];
      const s = studentMap[t.studentId];
      let obtained = t.sumObtained;
      let max = t.sumMax;

      if (max <= 0 && t.totalMax > 0) {
        obtained = t.totalObtained;
        max = t.totalMax;
      }

      if (max > 0) {
        s.countResult++;
        s.totalObtainedMarks += obtained;
        s.totalMaxMarks += max;
      }
    }

    // Apply subject totals back to student
    for (const id in studentMap) {
      const s = studentMap[id];
      const sSubjects = subjectByStudent[id] || {};
      let totalObt = 0;
      let totalMax = 0;
      for (const subName in sSubjects) {
        totalObt += sSubjects[subName].sumObt;
        totalMax += sSubjects[subName].sumMax;
      }
      if (totalMax > 0) {
        s.totalObtainedMarks = totalObt;
        s.totalMaxMarks = totalMax;
        s.resultScore = this.calculateMarksPercentage(totalObt, totalMax);
      }
    }

    // 5. Build Leaderboard Data
    const leaderboard: any[] = [];
    const batchStats: Record<string, any> = {};
    const studentMetrics: Record<string, any> = {};

    for (const id in studentMap) {
      const s = studentMap[id];
      const attPct = s.totalDays > 0 ? (s.presentDays / s.totalDays) * 100 : 0;
      const hwAvg = s.countHw > 0 ? s.hwScore / s.countHw : 0;
      const hwPct = (hwAvg / 10) * 100;
      const resPct = s.resultScore;

      const overall = attPct * 0.3 + hwPct * 0.3 + resPct * 0.4;

      if (s.totalDays > 0 || s.countResult > 0 || s.countHw > 0) {
        leaderboard.push({
          id,
          name: s.name,
          batch: s.batch,
          attendance: this.roundOne(attPct),
          homework: this.roundOne(hwAvg),
          result: this.roundOne(resPct),
          overall: this.roundOne(overall),
        });

        studentMetrics[id] = {
          attendance: this.roundOne(attPct),
          homework: this.roundOne(hwAvg),
          result: this.roundOne(resPct),
          overall: this.roundOne(overall),
        };

        if (!batchStats[s.batch]) {
          batchStats[s.batch] = {
            name: s.batch,
            totalOverall: 0,
            count: 0,
            attSum: 0,
            hwSum: 0,
            totalObtained: 0,
            totalMax: 0,
          };
        }

        const b = batchStats[s.batch];
        b.totalOverall += overall;
        b.attSum += attPct;
        b.hwSum += hwPct;
        b.totalObtained += s.totalObtainedMarks;
        b.totalMax += s.totalMaxMarks;
        b.count++;
      }
    }

    leaderboard.sort((a, b) => b.overall - a.overall);

    // 6. Fetch batch heads from database
    let headAssignments: any[] = [];
    try {
      headAssignments = await this.prisma.headAssignment.findMany({
        where: { assignmentType: 'Batch' },
      });
    } catch (err: any) {
      this.logger.warn(`PerformanceService headAssignments query warning: ${err.message}`);
    }
    const headMap: Record<string, string> = {};
    for (const h of headAssignments) {
      headMap[h.targetName] = h.headName;
    }

    const batchRankings: any[] = [];
    for (const bKey in batchStats) {
      const d = batchStats[bKey];
      const resAvg = d.totalMax > 0 ? (d.totalObtained / d.totalMax) * 100 : 0;
      batchRankings.push({
        batch: d.name,
        headName: headMap[d.name] || '-',
        score: this.roundOne(d.totalOverall / d.count),
        att: this.roundOne(d.attSum / d.count),
        hw: this.roundOne(d.hwSum / d.count),
        res: this.roundOne(resAvg),
        totalMarks: this.roundOne(d.totalMax),
      });
    }
    batchRankings.sort((a, b) => b.score - a.score);

    // 7. Process Subject rankings
    const subjectRankings: any[] = [];
    const batchExtremes: Record<string, { max: number; min: number }> = {};

    for (const batchName in subjectStats) {
      for (const subjectName in subjectStats[batchName]) {
        const d = subjectStats[batchName][subjectName];
        if (!d.count) continue;
        const avgPct = this.calculateMarksPercentage(d.sumObt, d.sumMax);
        subjectRankings.push({
          batch: batchName,
          subject: subjectName,
          avgPct: this.roundOne(avgPct),
          avgObtained: this.roundOne(d.sumObt / d.count),
          avgMax: this.roundOne(d.sumMax / d.count),
          tag: '',
        });

        if (!batchExtremes[batchName]) {
          batchExtremes[batchName] = { max: avgPct, min: avgPct };
        } else {
          batchExtremes[batchName].max = Math.max(batchExtremes[batchName].max, avgPct);
          batchExtremes[batchName].min = Math.min(batchExtremes[batchName].min, avgPct);
        }
      }
    }

    subjectRankings.forEach((r) => {
      const ex = batchExtremes[r.batch];
      if (ex) {
        if (r.avgPct === this.roundOne(ex.max)) r.tag = 'Dominant';
        else if (r.avgPct === this.roundOne(ex.min)) r.tag = 'Weak';
      }
    });
    subjectRankings.sort((a, b) => b.avgPct - a.avgPct);

    // 8. Complaints mapping (from sheet)
    const complaintsByStudent: Record<string, any[]> = {};
    const compValues = await this.sheets.getSheetValues(mainSheetId, 'StudentComplaints!A:Z');
    if (compValues && compValues.length > 1) {
      const compHeaders = this.mapHeaders(compValues[0]);
      const compStudentIdCol = this.getHeaderIndex(compHeaders, ['STUDENT ID', 'STUDENTID']);
      const compDateCol = this.getHeaderIndex(compHeaders, ['DATE']);
      const compTextCol = this.getHeaderIndex(compHeaders, ['COMPLAINT TEXT', 'COMPLAINTTEXT', 'COMPLAINT']);
      const compStatusCol = this.getHeaderIndex(compHeaders, ['STATUS']);
      const compPdfCol = this.getHeaderIndex(compHeaders, ['PDF LINK', 'PDFLINK', 'PDF']);

      if (compStudentIdCol !== -1 && compDateCol !== -1) {
        for (let i = 1; i < compValues.length; i++) {
          const row = compValues[i];
          const id = this.normalizeId(row[compStudentIdCol]);
          if (!id) continue;

          const dateVal = row[compDateCol];
          if (dateFilter && !dateFilter(dateVal)) continue;

          if (!complaintsByStudent[id]) complaintsByStudent[id] = [];
          
          const dateObj = this.parseDateValue(dateVal);
          complaintsByStudent[id].push({
            date: dateObj ? this.formatDate(dateObj) : String(dateVal),
            text: compTextCol === -1 ? '' : row[compTextCol] || '',
            status: compStatusCol === -1 ? '' : row[compStatusCol] || '',
            pdf: compPdfCol === -1 ? '' : row[compPdfCol] || '',
          });
        }
      }
    }

    // 9. Subject by student list
    const subjectByStudentList: Record<string, any[]> = {};
    for (const studentId in subjectByStudent) {
      const subjects = subjectByStudent[studentId];
      const list: any[] = [];
      for (const subjectName in subjects) {
        const d = subjects[subjectName];
        if (!d.count) continue;
        list.push({
          subject: subjectName,
          avgPct: this.roundOne(this.calculateMarksPercentage(d.sumObt, d.sumMax)),
          avgObtained: this.roundOne(d.sumObt / d.count),
          avgMax: this.roundOne(d.sumMax / d.count),
          totalObtained: this.roundOne(d.sumObt),
          totalMax: this.roundOne(d.sumMax),
          recordsCounted: d.count,
        });
      }
      subjectByStudentList[studentId] = list;
    }

    return {
      students: leaderboard,
      batches: Array.from(batches).sort(),
      batchRankings,
      subjectRankings,
      studentMap,
      studentMetrics,
      complaintsByStudent,
      subjectByStudent: subjectByStudentList,
      testGroups: testMap,
    };
  }

  async getLeaderboard(fromDate?: string, toDate?: string, languageMode = 'AUTO', batchFilter = 'ALL') {
    const data = await this.buildLeaderboardPayload(fromDate, toDate, languageMode, undefined, batchFilter);
    return {
      students: data.students,
      batches: data.batches,
      batchRankings: data.batchRankings,
      subjectRankings: data.subjectRankings,
    };
  }

  async getStudentReport(studentId: string, fromDate?: string, toDate?: string, languageMode = 'AUTO', batchFilter = 'ALL') {
    const normStudentId = this.normalizeId(studentId);
    const data = await this.buildLeaderboardPayload(fromDate, toDate, languageMode, normStudentId, batchFilter);
    const student = data.studentMap[normStudentId];
    if (!student) {
      return { error: 'Student not found for ID: ' + normStudentId };
    }

    const metrics = data.studentMetrics[normStudentId] || {
      attendance: 0,
      homework: 0,
      result: 0,
      overall: 0,
    };

    const complaints = data.complaintsByStudent[normStudentId] || [];
    const subjectAnalytics = data.subjectByStudent[normStudentId] || [];

    // Build Results Summary
    let strongest = '-';
    let weakest = '-';
    let weakSubjects: string[] = [];
    const sorted = [...subjectAnalytics].sort((a, b) => b.avgPct - a.avgPct);
    if (sorted.length > 0) {
      strongest = `${sorted[0].subject} (${sorted[0].avgPct}%)`;
      weakest = `${sorted[sorted.length - 1].subject} (${sorted[sorted.length - 1].avgPct}%)`;
      weakSubjects = sorted.slice(-2).map((s) => `${s.subject} (${s.avgPct}%)`);
    }

    const resultSummary = {
      strongest,
      weakest,
      subjects: sorted,
      weakSubjects,
      totalObtainedMarks: this.roundOne(student.totalObtainedMarks || 0),
      totalMaximumMarks: this.roundOne(student.totalMaxMarks || 0),
      overallPercentage: this.roundOne(student.resultScore || 0),
    };

    // Homework Summary
    const counts = student.hwStatusCounts || {};
    const hwTotal = student.countHw || 0;
    const hwComplete = counts['COMPLETE'] || 0;
    const hwIncomplete = (counts['INCOMPLETE'] || 0) + (counts['HALF COMPLETE'] || 0) + (counts['PARTIALLY COMPLETE'] || 0);
    const hwRate = hwTotal > 0 ? (hwComplete / hwTotal) * 100 : 0;

    const homeworkSummary = {
      total: hwTotal,
      complete: hwComplete,
      incomplete: hwIncomplete,
      absent: counts['ABSENT'] || 0,
      copyForget: counts['HW COPY FORGET'] || 0,
      completionRate: this.roundOne(hwRate),
      breakdown: counts,
    };

    // Attendance Summary
    const attPresent = student.presentDays || 0;
    const attTotal = student.totalDays || 0;
    const attAbsent = student.absentDays !== undefined ? student.absentDays : attTotal - attPresent;
    const attPct = attTotal > 0 ? (attPresent / attTotal) * 100 : 0;
    const attRecords = (student.attendanceRecords || [])
      .slice()
      .sort((a, b) => a._sortTime - b._sortTime)
      .map((r) => ({
        date: r.date,
        batch: r.batch,
        presenceType: r.presenceType,
        teacherName: r.teacherName,
      }));

    const attendanceSummary = {
      present: attPresent,
      absent: attAbsent,
      total: attTotal,
      percentage: this.roundOne(attPct),
      audit: {
        studentId: normStudentId,
        selectedDateRange: fromDate && toDate ? `${fromDate} to ${toDate}` : 'All Dates',
        presentRecords: attPresent,
        absentRecords: attAbsent,
        totalRecords: attTotal,
        firstAttendanceDate: student.firstAttendanceDate || '-',
        lastAttendanceDate: student.lastAttendanceDate || '-',
      },
      records: attRecords,
    };

    // Audit logs for calculations
    const testsAudited = Object.keys(data.testGroups)
      .filter((k) => k.startsWith(normStudentId))
      .map((k) => data.testGroups[k]);

    return {
      student: {
        id: normStudentId,
        name: student.name || '-',
        batch: student.batch || '-',
        fatherName: student.fatherName || '-',
        language: student.language || '-',
        mobile: student.mobile || '-',
      },
      metrics,
      complaints,
      attendance: attendanceSummary,
      homework: homeworkSummary,
      results: resultSummary,
      testAudit: testsAudited,
    };
  }
}
