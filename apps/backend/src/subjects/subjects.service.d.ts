import { PrismaService } from '../common/prisma.service';
export declare class SubjectsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findAll(): Promise<any>;
    create(data: {
        name: string;
        code: string;
    }): Promise<{
        id: any;
        subjectName: any;
        subjectCode: any;
    }>;
    update(code: string, data: {
        name?: string;
    }): Promise<{
        subjectName: any;
        subjectCode: any;
    }>;
    delete(code: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=subjects.service.d.ts.map