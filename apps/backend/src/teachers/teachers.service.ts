import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class TeachersService {
  private readonly logger = new Logger(TeachersService.name);
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.teacher.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: { name: string; teacherId: string; email?: string }) {
    return this.prisma.teacher.create({ data });
  }
}