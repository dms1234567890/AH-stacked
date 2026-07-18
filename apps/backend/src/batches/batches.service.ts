import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { SyncService } from '../sync/sync.service';
import type { SubjectDto } from '@prime/types';

export interface BatchListItem {
  id: string;
  name: string;
  classRoom: string;
  subjects: SubjectDto[];
  subjectsCsv: string;
  studentCount: number;
  createdAt: Date;
}

@Injectable()
export class BatchesService {
  private readonly logger = new Logger(BatchesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly syncService: SyncService,
  ) {}

  async findAll(): Promise<BatchListItem[]> {
    const batches = await this.prisma.batch.findMany({
      where: { deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        classRoom: true,
        createdAt: true,
        subjects: {
          select: {
            subject: {
              select: { id: true, name: true, code: true },
            },
          },
        },
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    });

    return (batches as any[]).map((b: any): BatchListItem => ({
      id: b.id,
      name: b.name,
      classRoom: b.classRoom || '',
      subjects: b.subjects.map((s: any): SubjectDto => ({
        id: s.subject.id,
        name: s.subject.name,
        code: s.subject.code,
      })),
      subjectsCsv: b.subjects.map((s: any): string => s.subject.name).join(', '),
      studentCount: b._count.students,
      createdAt: b.createdAt,
    }));
  }

  async findById(id: string): Promise<BatchListItem> {
    const batch = await this.prisma.batch.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        classRoom: true,
        isActive: true,
        createdAt: true,
        subjects: {
          select: {
            subject: {
              select: { id: true, name: true, code: true, isActive: true },
            },
          },
        },
        _count: { select: { students: true } },
      },
    });

    if (!batch || (batch as any).deletedAt) {
      throw new NotFoundException('Batch not found');
    }

    return this.toBatchListItem(batch as any);
  }

  async findByName(name: string): Promise<BatchListItem> {
    const batch = await this.prisma.batch.findFirst({
      where: { name, deletedAt: null },
      select: {
        id: true,
        name: true,
        classRoom: true,
        isActive: true,
        createdAt: true,
        subjects: {
          select: {
            subject: {
              select: { id: true, name: true, code: true, isActive: true },
            },
          },
        },
        _count: { select: { students: true } },
      },
    });

    if (!batch) throw new NotFoundException('Batch not found');
    return this.toBatchListItem(batch as any);
  }

  async create(data: {
    name: string;
    subjects: string[];
    classRoom?: string;
    changedById?: string;
  }): Promise<BatchListItem> {
    const existing = await this.prisma.batch.findFirst({
      where: { name: data.name, deletedAt: null },
      select: { id: true },
    });
    if (existing) throw new ConflictException('Batch already exists');

    const batch = await this.prisma.batch.create({
      data: {
        name: data.name,
        classRoom: data.classRoom,
        subjects: {
          create: data.subjects.map((subjectId: string) => ({
            subject: { connect: { id: subjectId } },
          })),
        },
      },
      select: {
        id: true,
        name: true,
        classRoom: true,
        isActive: true,
        createdAt: true,
        subjects: {
          select: {
            subject: {
              select: { id: true, name: true, code: true, isActive: true },
            },
          },
        },
        _count: { select: { students: true } },
      },
    });

    await this.syncService.queueSync('batches', batch.id, 'INSERT');

    return this.toBatchListItem(batch as any);
  }

  async update(
    id: string,
    data: { name?: string; classRoom?: string; subjects?: string[] },
  ): Promise<BatchListItem> {
    const existing = await this.prisma.batch.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });
    if (!existing || (existing as any).deletedAt)
      throw new NotFoundException('Batch not found');

    if (data.subjects) {
      await this.prisma.$transaction([
        this.prisma.batchSubject.deleteMany({ where: { batchId: id } }),
        this.prisma.batchSubject.createMany({
          data: data.subjects.map((subjectId: string) => ({
            batchId: id,
            subjectId,
          })),
        }),
      ]);
    }

    const updated = await this.prisma.batch.update({
      where: { id },
      data: {
        name: data.name,
        classRoom: data.classRoom,
      },
      select: {
        id: true,
        name: true,
        classRoom: true,
        isActive: true,
        createdAt: true,
        subjects: {
          select: {
            subject: {
              select: { id: true, name: true, code: true, isActive: true },
            },
          },
        },
        _count: { select: { students: true } },
      },
    });

    await this.syncService.queueSync('batches', id, 'UPDATE');

    return this.toBatchListItem(updated as any);
  }

  async delete(id: string, action: string, targetBatchId?: string) {
    const countResult = await this.prisma.batch.findUnique({
      where: { id },
      select: {
        id: true,
        _count: { select: { students: true } },
      },
    });
    if (!countResult) throw new NotFoundException('Batch not found');

    const studentCount = (countResult as any)._count.students;
    let affectedStudents: { id: string }[] = [];

    if (studentCount > 0) {
      affectedStudents = await this.prisma.student.findMany({
        where: { batchId: id, deletedAt: null },
        select: { id: true },
      });

      if (action === 'shift_students' && targetBatchId) {
        await this.prisma.student.updateMany({
          where: { batchId: id },
          data: { batchId: targetBatchId },
        });
      } else if (action === 'delete_students') {
        await this.prisma.student.updateMany({
          where: { batchId: id },
          data: { deletedAt: new Date(), status: 'CANCELLED' },
        });
      } else {
        return {
          success: false,
          requiresAction: true,
          affectedCount: studentCount,
          message: 'Students exist in this batch. Choose delete or shift action.',
        };
      }
    }

    await this.prisma.$transaction([
      this.prisma.batchSubject.deleteMany({ where: { batchId: id } }),
      this.prisma.batch.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false },
      }),
    ]);

    await this.syncService.queueSync('batches', id, 'DELETE');

    // Queue sync for affected students
    for (const student of affectedStudents) {
      await this.syncService.queueSync(
        'students',
        student.id,
        action === 'delete_students' ? 'DELETE' : 'UPDATE',
      );
    }

    return {
      success: true,
      message: 'Batch deleted successfully',
      affectedCount: studentCount,
    };
  }

  async getStudentCount(batchId: string): Promise<number> {
    return this.prisma.student.count({
      where: { batchId, deletedAt: null },
    });
  }

  async getNames(): Promise<string[]> {
    const batches = await this.prisma.batch.findMany({
      where: { deletedAt: null, isActive: true },
      select: { name: true },
      orderBy: { name: 'asc' },
    });
    return batches.map((b: { name: string }) => b.name);
  }

  async addSubjectToBatch(batchId: string, subjectId: string) {
    const existing = await this.prisma.batchSubject.findUnique({
      where: { batchId_subjectId: { batchId, subjectId } },
    });
    if (existing) throw new ConflictException('Subject already assigned to batch');

    await this.prisma.batchSubject.create({ data: { batchId, subjectId } });
    await this.syncService.queueSync('batches', batchId, 'UPDATE');

    return { message: 'Subject added to batch' };
  }

  async removeSubjectFromBatch(batchId: string, subjectId: string) {
    await this.prisma.batchSubject.delete({
      where: { batchId_subjectId: { batchId, subjectId } },
    });
    await this.syncService.queueSync('batches', batchId, 'UPDATE');

    return { message: 'Subject removed from batch' };
  }

  private toBatchListItem(batch: any): BatchListItem {
    return {
      id: batch.id,
      name: batch.name,
      classRoom: batch.classRoom || '',
      subjects: batch.subjects.map((s: any): SubjectDto => ({
        id: s.subject.id,
        name: s.subject.name,
        code: s.subject.code,
        isActive: s.subject.isActive,
      })),
      subjectsCsv: batch.subjects.map((s: any): string => s.subject.name).join(', '),
      studentCount: batch._count.students,
      createdAt: batch.createdAt,
    };
  }
}