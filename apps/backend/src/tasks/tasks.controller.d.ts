import { TasksService } from './tasks.service';
import { Request } from 'express';
export declare class TasksController {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    create(body: any, req: Request): Promise<any>;
    findAll(page?: number, limit?: number, status?: string): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    getCompletedForRating(): Promise<any>;
    rate(token: string, body: {
        rating: number;
        notes?: string;
    }, req: Request): Promise<{
        message: string;
    }>;
}
//# sourceMappingURL=tasks.controller.d.ts.map