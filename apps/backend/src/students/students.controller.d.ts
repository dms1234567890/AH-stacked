import { StudentsService } from './students.service';
import { AdmissionsService } from './admissions.service';
import { Request } from 'express';
export declare class StudentsController {
    private readonly studentsService;
    private readonly admissionsService;
    constructor(studentsService: StudentsService, admissionsService: AdmissionsService);
    findAll(page?: number, limit?: number, search?: string, batchId?: string, status?: string, sortBy?: string, sortOrder?: 'asc' | 'desc'): Promise<import("@prime/types").PaginatedResult<import("@prime/types").StudentDto>>;
    getNewStudents(): Promise<any>;
    getActiveStudents(page?: number, limit?: number, search?: string, batchId?: string): Promise<import("@prime/types").PaginatedResult<import("@prime/types").StudentDto>>;
    getSyncPreview(): Promise<import("@prime/types").SyncPreviewDto>;
    syncStudentIds(): Promise<{
        message: string;
    }>;
    findDuplicates(): Promise<{
        totalRows: any;
        totalDuplicateGroups: number;
        totalDuplicateRows: any;
        groups: any[];
        matchedOnFields: string[];
    }>;
    getBatchHistory(studentId: string): Promise<any>;
    findById(id: string): Promise<import("@prime/types").StudentDto>;
    create(body: any, req: Request): Promise<import("@prime/types").StudentDto>;
    update(id: string, body: any, req: Request): Promise<import("@prime/types").StudentDto>;
    cancel(id: string, req: Request): Promise<{
        message: string;
    }>;
    findByStudentId(studentId: string): Promise<import("@prime/types").StudentDto>;
}
//# sourceMappingURL=students.controller.d.ts.map