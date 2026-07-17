import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { SyncService } from '../sync/sync.service';
import type { StudentDto, SyncPreviewDto, PaginatedResult } from '@prime/types';
import {
  normalizeStudentIdComparable,
  buildStudentMatchKey,
  findNonConflictingBestMatches,
  buildDatabaseDuplicateKey,
  STUDENT_MATCH_FIELDS,
  DB_DUPLICATE_MATCH_FIELDS,
} from './student-match.helper';

interface FindAllQuery {
  page?: number;
  limit?: number;
  search?: string;
  batchId?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

interface CreateStudentInput {
  studentId: string;
  studentName: string;
  startSession?: string;
  endSession?: string;
  dateOfApplication?: string;
  fatherName?: string;
  dob?: string;
  mobileNumbers?: string;
  email?: string;
  motherName?: string;
  category?: string;
  fatherOccupation?: string;
  defenceService?: string;
  jobDescription?: string;
  class?: string;
  presentSchool?: string;
  batchId?: string;
  additionalLanguage?: string;
  program?: string;
  changedById?: string;
}

interface UpdateStudentInput {
  studentName?: string;
  startSession?: string;
  endSession?: string;
  fatherName?: string;
  dob?: string;
  mobileNumbers?: string;
  email?: string;
  motherName?: string;
  category?: string;
  fatherOccupation?: string;
  defenceService?: string;
  jobDescription?: string;
  class?: string;
  presentSchool?: string;
  batchId?: string;
  additionalLanguage?: string;
  program?: string;
  changedById?: string;
}

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly syncService: SyncService,
  ) {}

  async findAll(query: FindAllQuery): Promise<PaginatedResult<StudentDto>> {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 30));
    const skip = (page - 1) * limit;

    const where: any = { deletedAt: null };

    if (query.search) {
      where.OR = [
        { studentName: { contains: query.search, mode: 'insensitive' } },
        { studentId: { contains: query.search, mode: 'insensitive' } },
        { fatherName: { contains: query.search, mode: 'insensitive' } },
        { motherName: { contains: query.search, mode: 'insensitive' } },
        { mobileNumbers: { contains: query.search } },
      ];
    }

    if (query.batchId) {
      where.batchId = query.batchId;
    }

    if (query.status) {
      where.status = query.status;
    }

    const [total, students] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
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
          batchId: true,
          additionalLanguage: true,
          program: true,
          status: true,
          createdAt: true,
          batch: {
            select: { id: true, name: true },
          },
        },
        orderBy: query.sortBy
          ? { [query.sortBy]: query.sortOrder || 'asc' }
          : { createdAt: 'desc' },
      }),
    ]);

    return {
      data: students.map((s: any) => this.toDto(s)),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<StudentDto> {
    const student = await this.prisma.student.findUnique({
      where: { id },
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
        batchId: true,
        additionalLanguage: true,
        program: true,
        status: true,
        createdAt: true,
        batch: {
          select: { id: true, name: true },
        },
      },
    });

    if (!student || (student as any).deletedAt) {
      throw new NotFoundException('Student not found');
    }

    return this.toDto(student);
  }

  async findByStudentId(studentId: string): Promise<StudentDto> {
    const student = await this.prisma.student.findUnique({
      where: { studentId },
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
        batchId: true,
        additionalLanguage: true,
        program: true,
        status: true,
        createdAt: true,
        batch: {
          select: { id: true, name: true },
        },
      },
    });

    if (!student || (student as any).deletedAt) {
      throw new NotFoundException('Student not found');
    }

    return this.toDto(student);
  }

  async create(data: CreateStudentInput) {
    const existing = await this.prisma.student.findUnique({
      where: { studentId: data.studentId },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException('Student with this ID already exists');
    }

    const student = await this.prisma.student.create({
      data: {
        studentId: data.studentId,
        studentName: data.studentName,
        startSession: data.startSession,
        endSession: data.endSession,
        dateOfApplication: data.dateOfApplication ? new Date(data.dateOfApplication) : undefined,
        fatherName: data.fatherName,
        dob: data.dob ? new Date(data.dob) : undefined,
        mobileNumbers: data.mobileNumbers,
        email: data.email,
        motherName: data.motherName,
        category: data.category,
        fatherOccupation: data.fatherOccupation,
        defenceService: data.defenceService,
        jobDescription: data.jobDescription,
        class: data.class,
        presentSchool: data.presentSchool,
        batchId: data.batchId,
        additionalLanguage: data.additionalLanguage,
        program: data.program,
        status: 'ACTIVE',
      },
      select: {
        id: true,
        studentId: true,
        studentName: true,
        batchId: true,
        batch: { select: { name: true } },
      },
    });

    if (data.batchId && data.changedById) {
      const batch = await this.prisma.batch.findUnique({
        where: { id: data.batchId },
        select: { name: true },
      });
      if (batch) {
        await this.prisma.batchChangeLog.create({
          data: {
            studentId: student.studentId,
            studentName: student.studentName,
            newBatch: batch.name,
            changedById: data.changedById,
            dateOfChange: new Date(),
          },
        });
      }
    }

    await this.syncService.queueSync('students', student.id, 'INSERT');
    return this.findById(student.id);
  }

  async update(id: string, data: UpdateStudentInput) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      select: {
        id: true,
        studentId: true,
        studentName: true,
        batchId: true,
        batch: { select: { name: true } },
      },
    });

    if (!student || (student as any).deletedAt) {
      throw new NotFoundException('Student not found');
    }

    const previousBatchId = (student as any).batchId;
    const updateData: any = { ...data };
    if (data.dob) updateData.dob = new Date(data.dob);
    delete updateData.changedById;

    await this.prisma.student.update({
      where: { id },
      data: updateData,
      select: { id: true },
    });

    if (data.batchId && data.batchId !== previousBatchId && data.changedById) {
      const [oldBatch, newBatch] = await Promise.all([
        previousBatchId
          ? this.prisma.batch.findUnique({ where: { id: previousBatchId }, select: { name: true } })
          : null,
        this.prisma.batch.findUnique({ where: { id: data.batchId }, select: { name: true } }),
      ]);

      if (newBatch) {
        await this.prisma.batchChangeLog.create({
          data: {
            studentId: (student as any).studentId,
            studentName: (student as any).studentName,
            previousBatch: oldBatch?.name || '',
            newBatch: newBatch.name,
            changedById: data.changedById,
            dateOfChange: new Date(),
          },
        });
      }
    }

    await this.syncService.queueSync('students', id, 'UPDATE');
    return this.findById(id);
  }

  async cancel(id: string, reason: string, cancelledById: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!student) throw new NotFoundException('Student not found');

    await this.prisma.student.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        deletedAt: new Date(),
      },
    });

    await this.syncService.queueSync('students', id, 'DELETE');
    return { message: 'Student admission cancelled successfully' };
  }

  async getSyncPreview(): Promise<SyncPreviewDto> {


    const [admissions, students] = await Promise.all([
      this.prisma.admission.findMany({
        where: { deletedAt: null },
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

    const mismatches: any[] = [];
    let totalMatches = 0;
    let ambiguousCount = 0;

    for (const admission of admissions) {
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
      } else {
        const matches = findNonConflictingBestMatches(admissionRow, dbRows, 3);
        if (matches.length > 0) {
          matchMetaList = matches.map((m: any) => ({
            row: m.row,
            compared: m.compared,
            matchType: 'relaxed',
          }));
        }
      }

      if (matchMetaList.length === 0) continue;
      if (matchMetaList.length > 1) {
        ambiguousCount++;
        continue;
      }

      const matchMeta = matchMetaList[0];
      const dbRow = matchMeta.row;
      const admissionId = normalizeStudentIdComparable(admission.studentId);
      const dbId = normalizeStudentIdComparable(dbRow.studentId);

      if (!admissionId) continue;
      if (admissionId !== dbId) {
        mismatches.push({
          studentName: admission.studentName,
          admissionId: admission.studentId,
          databaseId: dbRow.studentId,
          admissionRowNumber: admission.id,
          databaseRowNumber: dbRow.id,
          class: admission.class || dbRow.class || '',
          dob: admissionRow.dob || dbRow.dob || '',
          startSession: admission.startSession || dbRow.startSession || '',
          endSession: admission.endSession || dbRow.endSession || '',
          matchedFields: matchMeta.compared,
          matchType: matchMeta.matchType,
        });
      } else {
        totalMatches++;
      }
    }

    return {
      totalMatches,
      totalMismatches: mismatches.length,
      ambiguousCount,
      mismatches,
      admissionsCount: admissions.length,
      databaseCount: students.length,
    };
  }

  async findDuplicates() {


    const students = await this.prisma.student.findMany({
      where: { deletedAt: null },
    });

    const dbRows = students.map((s: any) => ({
      ...s,
      dob: s.dob ? s.dob.toISOString().split('T')[0] : '',
      dateOfApplication: s.dateOfApplication ? s.dateOfApplication.toISOString().split('T')[0] : '',
    }));

    const map = new Map<string, any[]>();
    for (const row of dbRows) {
      const key = buildDatabaseDuplicateKey(row);
      if (!key) continue;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(row);
    }

    const groups: any[] = [];
    for (const [key, groupRows] of map.entries()) {
      if (groupRows.length < 2) continue;
      const rowsPayload = groupRows.map(row => ({
        rowNumber: row.id,
        studentId: row.studentId,
        studentName: row.studentName,
        motherName: row.motherName || '',
        fatherName: row.fatherName || '',
        mobile: row.mobileNumbers || '',
        email: row.email || '',
        dob: row.dob || '',
        class: row.class || '',
        duplicateKey: key,
        matchedData: DB_DUPLICATE_MATCH_FIELDS.map((field: string) => ({
          field: field,
          value: row[field] || '',
        })),
      }));
      groups.push({ count: groupRows.length, rows: rowsPayload });
    }

    const totalDuplicateGroups = groups.length;
    const totalDuplicateRows = groups.reduce((sum, group) => sum + group.count, 0);

    return {
      totalRows: students.length,
      totalDuplicateGroups,
      totalDuplicateRows,
      groups,
      matchedOnFields: DB_DUPLICATE_MATCH_FIELDS,
    };
  }

  async changeBatch(studentId: string, newBatchId: string, changedById: string) {
    const student = await this.prisma.student.findFirst({
      where: {
        OR: [
          { id: studentId },
          { studentId: studentId }
        ],
        deletedAt: null
      },
      select: {
        id: true,
        studentId: true,
        studentName: true,
        batchId: true,
      }
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const previousBatchId = student.batchId;
    if (previousBatchId === newBatchId) {
      return { success: true, message: 'Student is already in this batch.' };
    }

    const [oldBatch, newBatch] = await Promise.all([
      previousBatchId
        ? this.prisma.batch.findUnique({ where: { id: previousBatchId }, select: { name: true } })
        : null,
      this.prisma.batch.findUnique({ where: { id: newBatchId }, select: { name: true } }),
    ]);

    if (!newBatch) {
      throw new NotFoundException('Target batch not found');
    }

    await this.prisma.student.update({
      where: { id: student.id },
      data: { batchId: newBatchId },
    });

    await this.prisma.batchChangeLog.create({
      data: {
        studentId: student.studentId,
        studentName: student.studentName,
        previousBatch: oldBatch?.name || '',
        newBatch: newBatch.name,
        changedById,
        dateOfChange: new Date(),
        batchId: newBatchId,
      },
    });

    await this.syncService.queueSync('students', student.id, 'UPDATE');
    return { success: true, message: `Student batch changed successfully to ${newBatch.name}.` };
  }

  async getBatchHistory(studentId: string) {
    return this.prisma.batchChangeLog.findMany({
      where: {
        OR: [
          { studentId },
          { studentId: { equals: studentId } }
        ]
      },
      orderBy: { dateOfChange: 'desc' },
      select: {
        id: true,
        studentId: true,
        studentName: true,
        previousBatch: true,
        newBatch: true,
        dateOfChange: true,
        changedBy: {
          select: { name: true },
        },
      },
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private toDto(student: any): StudentDto {
    return {
      id: student.id,
      studentId: student.studentId,
      startSession: student.startSession || undefined,
      endSession: student.endSession || undefined,
      dateOfApplication: student.dateOfApplication?.toISOString(),
      studentName: student.studentName,
      fatherName: student.fatherName || undefined,
      dob: student.dob?.toISOString().split('T')[0],
      mobileNumbers: student.mobileNumbers || undefined,
      email: student.email || undefined,
      motherName: student.motherName || undefined,
      category: student.category || undefined,
      fatherOccupation: student.fatherOccupation || undefined,
      defenceService: student.defenceService || undefined,
      jobDescription: student.jobDescription || undefined,
      class: student.class || undefined,
      presentSchool: student.presentSchool || undefined,
      batchName: student.batch?.name || undefined,
      batchId: student.batchId || undefined,
      additionalLanguage: student.additionalLanguage || undefined,
      program: student.program || undefined,
      status: student.status,
      createdAt: student.createdAt instanceof Date
        ? student.createdAt.toISOString()
        : student.createdAt,
    };
  }
}