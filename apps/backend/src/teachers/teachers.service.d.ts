import { PrismaService } from '../common/prisma.service';
export declare class TeachersService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(): Promise<any>;
    create(data: {
        name: string;
        teacherId: string;
        email?: string;
    }): Promise<any>;
}
//# sourceMappingURL=teachers.service.d.ts.map