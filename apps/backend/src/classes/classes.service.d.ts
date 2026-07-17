import { PrismaService } from '../common/prisma.service';
export declare class ClassesService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    findByDate(date: string): Promise<any>;
    create(data: {
        date: string;
        batchId: string;
        subjectId: string;
        startTime?: string;
        endTime?: string;
        teacherId?: string;
        teacherName?: string;
        teacherEmail?: string;
    }): Promise<any>;
}
//# sourceMappingURL=classes.service.d.ts.map