import { SyncService } from './sync.service';
export declare class SyncController {
    private readonly syncService;
    constructor(syncService: SyncService);
    processPending(): Promise<{
        reQueued: number;
        message: string;
    }>;
    getStatus(): Promise<{
        pending: any;
        inProgress: any;
        completed: any;
        failed: any;
        total: any;
    }>;
    getLogs(limit?: number): Promise<any>;
}
//# sourceMappingURL=sync.controller.d.ts.map