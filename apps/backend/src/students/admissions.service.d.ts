import { PrismaService } from '../common/prisma.service';
export declare class AdmissionsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(): Promise<any>;
    getNewStudents(): Promise<any>;
    syncIds(): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=admissions.service.d.ts.map