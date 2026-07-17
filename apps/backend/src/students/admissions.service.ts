import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import type { AdmissionDto, SyncPreviewDto } from '@prime/types';
import {
  normalizeStudentIdComparable,
  buildStudentMatchKey,
  findNonConflictingBestMatches,
  STUDENT_MATCH_FIELDS,
} from './student-match.helper';

@Injectable()
export class AdmissionsService {
  private readonly logger = new Logger(AdmissionsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const admissions = await this.prisma.admission.findMany({
      where: { deletedAt: null },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        studentId: true,
        startSession: true,
        endSession: true,
        dateOfApplication: true,
        studentName: true,
        fatherName: true,
        dob: true,
        mobileNumbers: true,
        email: true,
        motherName: true,
        category: true,
        fatherOccupation: true,
        defenceService: true,
        jobDescription: true,
        class: true,
        presentSchool: true,
        program: true,
        status: true,
      },
    });

    return admissions;
  }

  async getNewStudents() {
    const [admissions, students] = await Promise.all([
      this.prisma.admission.findMany({
        where: { deletedAt: null, status: 'PENDING' },
      }),
      this.prisma.student.findMany({
        where: { deletedAt: null },
      }),
    ]);



    // Build indexes of database students
    const dbMatchMap = new Map<string, any[]>();
    const dbRows: any[] = [];
    const normalizedExistingIds = new Set<string>();

    for (const student of students) {
      const dbRow = {
        ...student,
        dob: student.dob ? student.dob.toISOString().split('T')[0] : '',
        dateOfApplication: student.dateOfApplication ? student.dateOfApplication.toISOString().split('T')[0] : '',
      };
      dbRows.push(dbRow);
      
      const normalizedId = normalizeStudentIdComparable(student.studentId);
      if (normalizedId) normalizedExistingIds.add(normalizedId);

      const matchKey = buildStudentMatchKey(dbRow);
      if (matchKey) {
        if (!dbMatchMap.has(matchKey)) dbMatchMap.set(matchKey, []);
        dbMatchMap.get(matchKey)!.push(dbRow);
      }
    }

    const possibleDuplicates: any[] = [];
    const newStudents: any[] = [];

    for (const admission of admissions) {
      const studentId = admission.studentId;
      const normalizedStudentId = normalizeStudentIdComparable(studentId);

      // Check if already enrolled in the DB
      const isEnrolled = normalizedStudentId && normalizedExistingIds.has(normalizedStudentId);
      if (isEnrolled) continue;

      const admissionRow = {
        ...admission,
        dob: admission.dob ? admission.dob.toISOString().split('T')[0] : '',
        dateOfApplication: admission.dateOfApplication ? admission.dateOfApplication.toISOString().split('T')[0] : '',
      };

      const matchKey = buildStudentMatchKey(admissionRow);
      let matchMetaList: any[] = [];

      if (matchKey && dbMatchMap.has(matchKey)) {
        matchMetaList = dbMatchMap.get(matchKey)!.map(row => ({
          row,
          compared: STUDENT_MATCH_FIELDS.length,
          matchType: 'strict',
        }));
      }

      if (matchMetaList.length === 0) {
        const matches = findNonConflictingBestMatches(admissionRow, dbRows, 3);
        if (matches.length > 0) {
          matchMetaList = matches.map((m: any) => ({
            row: m.row,
            compared: m.compared,
            matchType: 'relaxed',
          }));
        }
      }

      const mismatchedMatches = matchMetaList.filter(item => {
        const dbId = normalizeStudentIdComparable(item.row.studentId);
        return dbId !== normalizedStudentId;
      });

      if (mismatchedMatches.length > 0) {
        const foundMatch = mismatchedMatches[0].row;
        possibleDuplicates.push({
          studentName: admission.studentName,
          studentId: admission.studentId,
          status: 'possible_duplicate',
          duplicateOfId: foundMatch.studentId,
          duplicateOfName: foundMatch.studentName,
          duplicateCount: mismatchedMatches.length,
          admissionRowNumber: admission.id,
          fullData: {
            ...admissionRow,
            id: admission.id,
          },
        });
      } else {
        newStudents.push({
          studentName: admission.studentName,
          studentId: admission.studentId,
          status: 'new',
          admissionRowNumber: admission.id,
          fullData: {
            ...admissionRow,
            id: admission.id,
          },
        });
      }
    }

    return [...possibleDuplicates, ...newStudents];
  }

  async syncIds() {


    const [admissions, students] = await Promise.all([
      this.prisma.admission.findMany({
        where: { deletedAt: null, status: 'PENDING' },
      }),
      this.prisma.student.findMany({
        where: { deletedAt: null },
      }),
    ]);

    const dbRows = students.map((s: any) => ({
      ...s,
      dob: s.dob ? s.dob.toISOString().split('T')[0] : '',
      dateOfApplication: s.dateOfApplication ? s.dateOfApplication.toISOString().split('T')[0] : '',
    }));

    const dbMatchMap = new Map<string, any[]>();
    for (const dbRow of dbRows) {
      const matchKey = buildStudentMatchKey(dbRow);
      if (matchKey) {
        if (!dbMatchMap.has(matchKey)) dbMatchMap.set(matchKey, []);
        dbMatchMap.get(matchKey)!.push(dbRow);
      }
    }

    let updated = 0;

    for (const admission of admissions) {
      const admissionRow = {
        ...admission,
        dob: admission.dob ? admission.dob.toISOString().split('T')[0] : '',
        dateOfApplication: admission.dateOfApplication ? admission.dateOfApplication.toISOString().split('T')[0] : '',
      };

      const matchKey = buildStudentMatchKey(admissionRow);
      let matchedStudent: any = null;

      if (matchKey && dbMatchMap.has(matchKey)) {
        matchedStudent = dbMatchMap.get(matchKey)![0];
      } else {
        const matches = findNonConflictingBestMatches(admissionRow, dbRows, 3);
        if (matches.length > 0) {
          matchedStudent = matches[0].row;
        }
      }

      if (matchedStudent) {
        const admissionId = normalizeStudentIdComparable(admission.studentId);
        const dbId = normalizeStudentIdComparable(matchedStudent.studentId);

        if (admissionId && admissionId !== dbId) {
          await this.prisma.student.update({
            where: { id: matchedStudent.id },
            data: { studentId: admission.studentId },
          });
          updated++;
        }
      }
    }

    return { success: true, message: `Synced ${updated} student ID(s).`, updated };
  }

  async deleteAdmission(id: string) {
    await this.prisma.admission.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    });
    return { success: true, message: 'Admission entry deleted successfully.' };
  }

  async deleteDuplicate(admissionId: string, studentId: string) {
    await this.prisma.admission.update({
      where: { id: admissionId },
      data: { deletedAt: new Date(), status: 'CANCELLED' },
    });

    const student = await this.prisma.student.findUnique({
      where: { studentId },
      select: { id: true },
    });

    if (student) {
      await this.prisma.student.update({
        where: { id: student.id },
        data: { deletedAt: new Date(), status: 'CANCELLED' },
      });
    }

    return { success: true, message: 'Admission and duplicate student entry deleted successfully.' };
  }

}