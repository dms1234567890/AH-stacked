import { BatchesService } from './batches.service';
import { Request } from 'express';
export declare class BatchesController {
    private readonly batchesService;
    constructor(batchesService: BatchesService);
    findAll(): Promise<import("./batches.service").BatchListItem[]>;
    getNames(): Promise<string[]>;
    findById(id: string): Promise<import("./batches.service").BatchListItem>;
    findByName(name: string): Promise<import("./batches.service").BatchListItem>;
    create(body: {
        name: string;
        subjects: string[];
        classRoom?: string;
    }, req: Request): Promise<import("./batches.service").BatchListItem>;
    update(id: string, body: {
        name?: string;
        classRoom?: string;
        subjects?: string[];
    }): Promise<import("./batches.service").BatchListItem>;
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
    getStudentCount(id: string): Promise<{
        count: number;
    }>;
    addSubject(batchId: string, subjectId: string): Promise<{
        message: string;
    }>;
    removeSubject(batchId: string, subjectId: string): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=batches.controller.d.ts.map