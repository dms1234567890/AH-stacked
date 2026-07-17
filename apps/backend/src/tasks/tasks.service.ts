import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { SyncService } from '../sync/sync.service';
import * as crypto from 'crypto';

interface CreateTaskInput {
  employeeId?: string;
  employeeName?: string;
  taskType?: string;
  taskReason?: string;
  taskRole?: string;
  taskDetail?: string;
  taskEndingDate?: string;
  giverId?: string;
}

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly syncService: SyncService,
  ) {}

  async create(data: CreateTaskInput) {
    const token = crypto.randomBytes(4).toString('hex');
    const task = await this.prisma.task.create({
      data: {
        token,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        taskType: data.taskType || 'EXTRA WORK',
        taskReason: data.taskReason,
        taskRole: data.taskRole,
        taskDetail: data.taskDetail,
        taskEndingDate: data.taskEndingDate ? new Date(data.taskEndingDate) : undefined,
        giverId: data.giverId,
      },
      select: { id: true },
    });

    await this.syncService.queueSync('tasks', task.id, 'INSERT');

    return this.findById(task.id);
  }

  async findAll(query: { page?: number; limit?: number; status?: string }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 30));
    const where: any = { deletedAt: null };
    if (query.status) where.status = query.status;

    const [total, tasks] = await Promise.all([
      this.prisma.task.count({ where }),
      this.prisma.task.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          token: true,
          employeeId: true,
          employeeName: true,
          taskType: true,
          taskReason: true,
          taskRole: true,
          taskDetail: true,
          taskEndingDate: true,
          status: true,
          createdAt: true,
          giver: { select: { id: true, name: true } },
          employee: {
            select: { id: true, name: true, employeeId: true },
          },
          completions: {
            select: { id: true, completedAt: true, notes: true },
          },
          ratings: {
            select: { id: true, rating: true, notes: true, createdAt: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: tasks,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: {
        id: true,
        token: true,
        employeeId: true,
        employeeName: true,
        taskType: true,
        taskReason: true,
        taskRole: true,
        taskDetail: true,
        taskEndingDate: true,
        status: true,
        createdAt: true,
        giver: { select: { id: true, name: true } },
        employee: {
          select: { id: true, name: true, employeeId: true },
        },
        completions: {
          select: { id: true, completedAt: true, notes: true },
        },
        ratings: {
          select: { id: true, rating: true, notes: true, createdAt: true },
        },
      },
    });

    if (!task || (task as any).deletedAt) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }

  async getCompletedForRating() {
    return this.prisma.task.findMany({
      where: { status: 'COMPLETED', deletedAt: null },
      select: {
        id: true,
        token: true,
        employeeName: true,
        taskType: true,
        taskDetail: true,
        status: true,
        employee: {
          select: { id: true, name: true },
        },
        completions: {
          select: { completedAt: true, notes: true },
        },
      },
    });
  }

  async findByToken(token: string) {
    const task = await this.prisma.task.findUnique({
      where: { token },
      select: {
        id: true,
        token: true,
        employeeId: true,
        employeeName: true,
        taskType: true,
        taskReason: true,
        taskRole: true,
        taskDetail: true,
        taskEndingDate: true,
        status: true,
        createdAt: true,
        giver: { select: { id: true, name: true } },
        employee: {
          select: { id: true, name: true, employeeId: true },
        },
      },
    });

    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async complete(token: string, notes?: string) {
    const task = await this.prisma.task.findUnique({
      where: { token },
      select: { id: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    const result = await this.prisma.$transaction([
      this.prisma.taskCompletion.create({
        data: { taskId: task.id, notes },
      }),
      this.prisma.task.update({
        where: { id: task.id },
        data: { status: 'COMPLETED' },
        select: { id: true },
      }),
    ]);

    await this.syncService.queueSync('tasks', task.id, 'UPDATE');

    return { message: 'Task completed successfully' };
  }

  async rate(token: string, rating: number, raterId: string, notes?: string) {
    const task = await this.prisma.task.findUnique({
      where: { token },
      select: { id: true, status: true },
    });
    if (!task) throw new NotFoundException('Task not found');
    if (task.status !== 'COMPLETED') {
      throw new Error('Task must be completed before rating');
    }

    await this.prisma.$transaction([
      this.prisma.taskRating.create({
        data: { taskId: task.id, rating, raterId, notes },
      }),
      this.prisma.task.update({
        where: { id: task.id },
        data: { status: 'RATED' },
      }),
    ]);

    await this.syncService.queueSync('tasks', task.id, 'UPDATE');

    return { message: 'Rating saved successfully' };
  }

  async update(id: string, data: Partial<CreateTaskInput>) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: { id: true, deletedAt: true },
    });
    if (!task || (task as any).deletedAt) {
      throw new NotFoundException('Task not found');
    }

    const updateData: any = { ...data };
    if (data.taskEndingDate) {
      updateData.taskEndingDate = new Date(data.taskEndingDate);
    }
    delete updateData.giverId;

    await this.prisma.task.update({
      where: { id },
      data: updateData,
    });

    await this.syncService.queueSync('tasks', id, 'UPDATE');

    return this.findById(id);
  }

  async delete(id: string) {
    const task = await this.prisma.task.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!task) throw new NotFoundException('Task not found');

    await this.prisma.task.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.syncService.queueSync('tasks', id, 'DELETE');

    return { message: 'Task deleted successfully' };
  }
}