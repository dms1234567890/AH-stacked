import { PrismaService } from '../common/prisma.service';
import { SyncQueue } from './sync.queue';
export declare class SyncService {
    private readonly prisma;
    private readonly syncQueue;
    private readonly logger;
    constructor(prisma: PrismaService, syncQueue: SyncQueue);
    /**
     * Queue a sync job. Called by services after CRUD operations.
     * Instead of direct DB polling, this enqueues a BullMQ job for
     * immediate async processing.
     */
    queueSync(entityType: string, entityId: string, action: 'INSERT' | 'UPDATE' | 'DELETE'): Promise<void>;
    /**
     * Admin endpoint: process ALL pending syncs by re-enqueuing them
     * through BullMQ. This replaces the old synchronous DB-polling approach.
     */
    processPendingSyncs(): Promise<{
        reQueued: number;
        message: string;
    }>;
    /**
     * Get sync status summary for monitoring.
     */
    getSyncStatus(): Promise<{
        pending: any;
        inProgress: any;
        completed: any;
        failed: any;
        total: any;
    }>;
    /**
     * Get the most recent sync log entries.
     */
    getSyncLogs(limit?: number): Promise<any>;
}
//# sourceMappingURL=sync.service.d.ts.map