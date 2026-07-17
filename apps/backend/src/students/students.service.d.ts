import { PrismaService } from '../common/prisma.service';
import { SyncService } from '../sync/sync.service';
import type { StudentDto, SyncPreviewDto, PaginatedResult } from '@prime/types';
interface FindAllQuery {
    page?: number;
    limit?: number;
    search?: string;
    batchId?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
interface CreateStudentInput {
    studentId: string;
    studentName: string;
    startSession?: string;
    endSession?: string;
    dateOfApplication?: string;
    fatherName?: string;
    dob?: string;
    mobileNumbers?: string;
    email?: string;
    motherName?: string;
    category?: string;
    fatherOccupation?: string;
    defenceService?: string;
    jobDescription?: string;
    class?: string;
    presentSchool?: string;
    batchId?: string;
    additionalLanguage?: string;
    program?: string;
    changedById?: string;
}
interface UpdateStudentInput {
    studentName?: string;
    startSession?: string;
    endSession?: string;
    fatherName?: string;
    dob?: string;
    mobileNumbers?: string;
    email?: string;
    motherName?: string;
    category?: string;
    fatherOccupation?: string;
    defenceService?: string;
    jobDescription?: string;
    class?: string;
    presentSchool?: string;
    batchId?: string;
    additionalLanguage?: string;
    program?: string;
    changedById?: string;
}
export declare class StudentsService {
    private readonly prisma;
    private readonly syncService;
    private readonly logger;
    constructor(prisma: PrismaService, syncService: SyncService);
    findAll(query: FindAllQuery): Promise<PaginatedResult<StudentDto>>;
    findById(id: string): Promise<StudentDto>;
    findByStudentId(studentId: string): Promise<StudentDto>;
    create(data: CreateStudentInput): Promise<StudentDto>;
    update(id: string, data: UpdateStudentInput): Promise<StudentDto>;
    cancel(id: string, reason: string, cancelledById: string): Promise<{
        message: string;
    }>;
    getSyncPreview(): Promise<SyncPreviewDto>;
    findDuplicates(): Promise<{
        totalRows: any;
        totalDuplicateGroups: number;
        totalDuplicateRows: any;
        groups: any[];
        matchedOnFields: string[];
    }>;
    getBatchHistory(studentId: string): Promise<any>;
    private toDto;
}
export {};
//# sourceMappingURL=students.service.d.ts.map