import { PrismaService } from '../common/prisma.service';
import { GoogleSheetsService } from './google-sheets.service';
export interface SyncJobData {
    syncLogId: string;
    entityType: string;
    entityId: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    retryAttempt: number;
}
export declare class SyncQueue {
    private readonly prisma;
    private readonly googleSheets;
    private readonly logger;
    private queue;
    private worker;
    constructor(prisma: PrismaService, googleSheets: GoogleSheetsService);
    enqueue(data: Omit<SyncJobData, 'retryAttempt'>): Promise<string>;
    private processJob;
    private fetchEntityData;
    onModuleDestroy(): Promise<void>;
}
//# sourceMappingURL=sync.queue.d.ts.map