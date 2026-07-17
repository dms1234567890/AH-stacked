import { Injectable, Logger } from '@nestjs/common';
import { Queue, Worker, Job } from 'bullmq';
import { PrismaService } from '../common/prisma.service';
import { GoogleSheetsService } from './google-sheets.service';

export interface SyncJobData {
  syncLogId: string;
  entityType: string;
  entityId: string;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  retryAttempt: number;
}

@Injectable()
export class SyncQueue {
  private readonly logger = new Logger(SyncQueue.name);
  private queue: Queue<SyncJobData>;
  private worker: Worker<SyncJobData>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly googleSheets: GoogleSheetsService,
  ) {
    this.initializeQueue().catch(err => {
      this.logger.warn(`Redis unavailable - Sync queue disabled: ${err.message}`);
    });
  }

  private async initializeQueue() {
    const connection = {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
      retryStrategy: () => null,
    };

    this.queue = new Queue<SyncJobData>('google-sheets-sync', {
      connection,
      defaultJobOptions: {
        attempts: 5,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    });

    this.worker = new Worker<SyncJobData>(
      'google-sheets-sync',
      async (job) => this.processJob(job),
      {
        connection,
        concurrency: 3,
        limiter: {
          max: 10,
          duration: 1000,
        },
      },
    );

    this.worker.on('completed', (job) => {
      this.logger.log(`Sync job ${job.id} completed: ${job.data.entityType}:${job.data.entityId}`);
    });

    this.worker.on('failed', (job, error) => {
      this.logger.error(
        `Sync job ${job?.id} failed after ${job?.attemptsMade} attempts: ${error.message}`,
        error.stack,
      );
    });

    this.logger.log('BullMQ sync queue initialized');
  }

  async enqueue(data: Omit<SyncJobData, 'retryAttempt'>): Promise<string> {
    const job = await this.queue.add('sync-to-sheets', {
      ...data,
      retryAttempt: 0,
    });
    return job.id ?? '';
  }

  private async processJob(job: Job<SyncJobData>): Promise<void> {
    const { syncLogId, entityType, entityId, action } = job.data;

    // Mark as in_progress
    await this.prisma.syncLog.update({
      where: { id: syncLogId },
      data: {
        status: 'IN_PROGRESS',
        lastAttemptAt: new Date(),
        retryCount: job.attemptsMade,
      },
    });

    try {
      // Fetch the full entity data from the database
      const entityData = await this.fetchEntityData(entityType, entityId);

      // Push to Google Sheets
      await this.googleSheets.sync(entityType, entityId, action, entityData);

      // Mark as completed
      await this.prisma.syncLog.update({
        where: { id: syncLogId },
        data: { status: 'COMPLETED' },
      });
    } catch (error: any) {
      // Update error info; BullMQ handles retry via attempts/backoff
      await this.prisma.syncLog.update({
        where: { id: syncLogId },
        data: {
          status: 'FAILED',
          errorMessage: error.message,
          lastAttemptAt: new Date(),
          retryCount: job.attemptsMade,
        },
      });
      throw error; // Re-throw so BullMQ retries
    }
  }

  private async fetchEntityData(entityType: string, entityId: string): Promise<Record<string, any>> {
    switch (entityType) {
      case 'students': {
        const student = await this.prisma.student.findUnique({
          where: { id: entityId },
          include: { batch: true },
        });
        if (!student) throw new Error(`Student ${entityId} not found`);
        return {
          'Student ID': student.studentId,
          'Student Name': student.studentName,
          "Father's Name": student.fatherName || '',
          "Mother's Name": student.motherName || '',
          DOB: student.dob?.toISOString().split('T')[0] || '',
          'Mobile Numbers': student.mobileNumbers || '',
          Email: student.email || '',
          Category: student.category || '',
          Class: student.class || '',
          Batch: student.batch?.name || '',
          Program: student.program || '',
          Status: student.status,
          'Start Session': student.startSession || '',
          'End Session': student.endSession || '',
        };
      }

      case 'batches': {
        const batch = await this.prisma.batch.findUnique({
          where: { id: entityId },
          include: {
            subjects: { include: { subject: true } },
            _count: { select: { students: true } },
          },
        });
        if (!batch) throw new Error(`Batch ${entityId} not found`);
        return {
          'Batch Name': batch.name,
          'Class Room': batch.classRoom || '',
          Subjects: batch.subjects.map((s: any) => s.subject.name).join(', '),
          'Student Count': batch._count.students,
          Active: batch.isActive,
        };
      }

      case 'tasks': {
        const task = await this.prisma.task.findUnique({
          where: { id: entityId },
          include: { employee: true, giver: true },
        });
        if (!task) throw new Error(`Task ${entityId} not found`);
        return {
          Token: task.token,
          Employee: task.employeeName || task.employee?.name || '',
          'Task Type': task.taskType || '',
          'Task Detail': task.taskDetail || '',
          'Task Role': task.taskRole || '',
          'Ending Date': task.taskEndingDate?.toISOString().split('T')[0] || '',
          Status: task.status,
          'Given By': task.giver?.name || '',
          Created: task.createdAt.toISOString(),
        };
      }

      case 'employees': {
        const employee = await this.prisma.employee.findUnique({
          where: { id: entityId },
        });
        if (!employee) throw new Error(`Employee ${entityId} not found`);
        return {
          'Employee ID': employee.employeeId,
          Name: employee.name,
          Email: employee.email || '',
          Department: employee.department || '',
          Designation: employee.designation || '',
          Phone: employee.phone || '',
        };
      }

      case 'teachers': {
        const teacher = await this.prisma.teacher.findUnique({
          where: { id: entityId },
        });
        if (!teacher) throw new Error(`Teacher ${entityId} not found`);
        return {
          'Teacher ID': teacher.teacherId,
          Name: teacher.name,
          Email: teacher.email || '',
        };
      }

      case 'subjects': {
        const subject = await this.prisma.subject.findUnique({
          where: { id: entityId },
        });
        if (!subject) throw new Error(`Subject ${entityId} not found`);
        return {
          Code: subject.code,
          Name: subject.name,
          Active: subject.isActive,
        };
      }

      default:
        throw new Error(`Unknown entity type: ${entityType}`);
    }
  }

  async onModuleDestroy() {
    await this.queue.close();
    await this.worker.close();
  }
}