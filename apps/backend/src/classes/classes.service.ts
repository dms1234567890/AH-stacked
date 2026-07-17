import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);
  constructor(private readonly prisma: PrismaService) {}

  async findByDate(date: string) {
    const dateObj = new Date(date);
    return this.prisma.classSchedule.findMany({
      where: { date: dateObj, deletedAt: null },
      include: { batch: true, subject: true, teacher: true },
      orderBy: { startTime: 'asc' },
    });
  }

  async create(data: {
    date: string;
    batchId: string;
    subjectId: string;
    startTime?: string;
    endTime?: string;
    teacherId?: string;
    teacherName?: string;
    teacherEmail?: string;
  }) {
    return this.prisma.classSchedule.create({
      data: {
        date: new Date(data.date),
        batchId: data.batchId,
        subjectId: data.subjectId,
        startTime: data.startTime,
        endTime: data.endTime,
        teacherId: data.teacherId,
        teacherName: data.teacherName,
        teacherEmail: data.teacherEmail,
      },
      include: { batch: true, subject: true, teacher: true },
    });
  }
}