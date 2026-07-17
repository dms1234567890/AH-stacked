import { PrismaService } from '../common/prisma.service';
import { SyncService } from '../sync/sync.service';
interface CreateTaskInput {
    employeeId?: string;
    employeeName?: string;
    taskType?: string;
    taskReason?: string;
    taskRole?: string;
    taskDetail?: string;
    taskEndingDate?: string;
    giverId?: string;
}
export declare class TasksService {
    private readonly prisma;
    private readonly syncService;
    private readonly logger;
    constructor(prisma: PrismaService, syncService: SyncService);
    create(data: CreateTaskInput): Promise<any>;
    findAll(query: {
        page?: number;
        limit?: number;
        status?: string;
    }): Promise<{
        data: any;
        meta: {
            total: any;
            page: number;
            limit: number;
            totalPages: number;
        };
    }>;
    findById(id: string): Promise<any>;
    getCompletedForRating(): Promise<any>;
    findByToken(token: string): Promise<any>;
    complete(token: string, notes?: string): Promise<{
        message: string;
    }>;
    rate(token: string, rating: number, raterId: string, notes?: string): Promise<{
        message: string;
    }>;
    update(id: string, data: Partial<CreateTaskInput>): Promise<any>;
    delete(id: string): Promise<{
        message: string;
    }>;
}
export {};
//# sourceMappingURL=tasks.service.d.ts.map