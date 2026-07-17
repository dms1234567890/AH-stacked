import { PrismaService } from '../common/prisma.service';
import { SyncService } from '../sync/sync.service';
import type { SubjectDto } from '@prime/types';
export interface BatchListItem {
    id: string;
    name: string;
    classRoom: string;
    subjects: SubjectDto[];
    subjectsCsv: string;
    studentCount: number;
    createdAt: Date;
}
export declare class BatchesService {
    private readonly prisma;
    private readonly syncService;
    private readonly logger;
    constructor(prisma: PrismaService, syncService: SyncService);
    findAll(): Promise<BatchListItem[]>;
    findById(id: string): Promise<BatchListItem>;
    findByName(name: string): Promise<BatchListItem>;
    create(data: {
        name: string;
        subjects: string[];
        classRoom?: string;
        changedById?: string;
    }): Promise<BatchListItem>;
    update(id: string, data: {
        name?: string;
        classRoom?: string;
        subjects?: string[];
    }): Promise<BatchListItem>;
    delete(id: string, action: string, targetBatchId?: string): Promise<{
        success: boolean;
        requiresAction: boolean;
        affectedCount: any;
        message: string;
    } | {
        success: boolean;
        message: string;
        affectedCount: any;
        requiresAction?: undefined;
    }>;
    getStudentCount(batchId: string): Promise<number>;
    getNames(): Promise<string[]>;
    addSubjectToBatch(batchId: string, subjectId: string): Promise<{
        message: string;
    }>;
    removeSubjectFromBatch(batchId: string, subjectId: string): Promise<{
        message: string;
    }>;
    private toBatchListItem;
}
//# sourceMappingURL=batches.service.d.ts.map