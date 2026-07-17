var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { Injectable, Logger } from '@nestjs/common';
let SyncService = (() => {
    let _classDecorators = [Injectable()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var SyncService = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            SyncService = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
            __runInitializers(_classThis, _classExtraInitializers);
        }
        prisma;
        syncQueue;
        logger = new Logger(SyncService.name);
        constructor(prisma, syncQueue) {
            this.prisma = prisma;
            this.syncQueue = syncQueue;
        }
        /**
         * Queue a sync job. Called by services after CRUD operations.
         * Instead of direct DB polling, this enqueues a BullMQ job for
         * immediate async processing.
         */
        async queueSync(entityType, entityId, action) {
            // Persist to SyncLog for audit trail
            const syncLog = await this.prisma.syncLog.create({
                data: {
                    entityType,
                    entityId,
                    action,
                    status: 'PENDING',
                },
            });
            // Enqueue to BullMQ for immediate async processing
            const jobId = await this.syncQueue.enqueue({
                syncLogId: syncLog.id,
                entityType,
                entityId,
                action,
            });
            this.logger.debug(`Queued sync job ${jobId} for ${entityType}:${entityId} (${action})`);
        }
        /**
         * Admin endpoint: process ALL pending syncs by re-enqueuing them
         * through BullMQ. This replaces the old synchronous DB-polling approach.
         */
        async processPendingSyncs() {
            const pendingLogs = await this.prisma.syncLog.findMany({
                where: { status: { in: ['PENDING', 'FAILED'] } },
                take: 50,
                orderBy: { createdAt: 'asc' },
            });
            if (pendingLogs.length === 0) {
                return { reQueued: 0, message: 'No pending sync jobs found' };
            }
            for (const log of pendingLogs) {
                await this.syncQueue.enqueue({
                    syncLogId: log.id,
                    entityType: log.entityType,
                    entityId: log.entityId,
                    action: log.action,
                });
            }
            this.logger.log(`Re-queued ${pendingLogs.length} pending sync jobs`);
            return {
                reQueued: pendingLogs.length,
                message: `Re-queued ${pendingLogs.length} pending sync jobs to BullMQ for processing`,
            };
        }
        /**
         * Get sync status summary for monitoring.
         */
        async getSyncStatus() {
            const [pending, inProgress, completed, failed] = await Promise.all([
                this.prisma.syncLog.count({ where: { status: 'PENDING' } }),
                this.prisma.syncLog.count({ where: { status: 'IN_PROGRESS' } }),
                this.prisma.syncLog.count({ where: { status: 'COMPLETED' } }),
                this.prisma.syncLog.count({ where: { status: 'FAILED' } }),
            ]);
            return { pending, inProgress, completed, failed, total: pending + inProgress + completed + failed };
        }
        /**
         * Get the most recent sync log entries.
         */
        async getSyncLogs(limit = 20) {
            return this.prisma.syncLog.findMany({
                take: limit,
                orderBy: { createdAt: 'desc' },
            });
        }
    };
    return SyncService = _classThis;
})();
export { SyncService };
//# sourceMappingURL=sync.service.js.map