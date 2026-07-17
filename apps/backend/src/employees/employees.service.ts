import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.employee.findMany({
      where: { deletedAt: null, isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async create(data: { name: string; employeeId: string; email?: string; department?: string; designation?: string; phone?: string }) {
    return this.prisma.employee.create({ data });
  }
}