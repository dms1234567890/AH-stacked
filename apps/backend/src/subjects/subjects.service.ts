import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class SubjectsService {
  private readonly logger = new Logger(SubjectsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const subjects = await this.prisma.subject.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { name: 'asc' },
    });

    return subjects.map((s: any) => ({
      subjectName: s.name,
      subjectCode: s.code,
      id: s.id,
    }));
  }

  async create(data: { name: string; code: string }) {
    const existing = await this.prisma.subject.findFirst({
      where: {
        OR: [
          { code: data.code },
          { name: { equals: data.name, mode: 'insensitive' } },
        ],
      },
    });
    if (existing) throw new ConflictException('Subject name or code already exists');

    const subject = await this.prisma.subject.create({
      data: { name: data.name, code: data.code.toUpperCase() },
    });

    return {
      id: subject.id,
      subjectName: subject.name,
      subjectCode: subject.code,
    };
  }

  async update(code: string, data: { name?: string }) {
    const subject = await this.prisma.subject.findUnique({ where: { code } });
    if (!subject) throw new NotFoundException('Subject not found');

    const updated = await this.prisma.subject.update({
      where: { code },
      data: { name: data.name },
    });

    return { subjectName: updated.name, subjectCode: updated.code };
  }

  async delete(code: string) {
    const subject = await this.prisma.subject.findUnique({ where: { code } });
    if (!subject) throw new NotFoundException('Subject not found');

    await this.prisma.subject.update({
      where: { code },
      data: { deletedAt: new Date(), isActive: false },
    });

    return { message: 'Subject deleted successfully' };
  }
}