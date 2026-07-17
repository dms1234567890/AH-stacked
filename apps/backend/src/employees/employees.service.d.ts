import { PrismaService } from '../common/prisma.service';
export declare class EmployeesService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(): Promise<any>;
    create(data: {
        name: string;
        employeeId: string;
        email?: string;
        department?: string;
        designation?: string;
        phone?: string;
    }): Promise<any>;
}
//# sourceMappingURL=employees.service.d.ts.map