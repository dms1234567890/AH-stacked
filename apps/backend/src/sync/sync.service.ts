import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { SyncQueue } from './sync.queue';

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly syncQueue: SyncQueue,
  ) {}

  /**
   * Queue a sync job. Called by services after CRUD operations.
   * Instead of direct DB polling, this enqueues a BullMQ job for
   * immediate async processing.
   */
  async queueSync(entityType: string, entityId: string, action: 'INSERT' | 'UPDATE' | 'DELETE'): Promise<void> {
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

    this.logger.debug(
      `Queued sync job ${jobId} for ${entityType}:${entityId} (${action})`,
    );
  }

  /**
   * Admin endpoint: process ALL pending syncs by re-enqueuing them
   * through BullMQ. This replaces the old synchronous DB-polling approach.
   */
  async processPendingSyncs(): Promise<{ reQueued: number; message: string }> {
    try {
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
          action: log.action as 'INSERT' | 'UPDATE' | 'DELETE',
        });
      }

      this.logger.log(`Re-queued ${pendingLogs.length} pending sync jobs`);
      return {
        reQueued: pendingLogs.length,
        message: `Re-queued ${pendingLogs.length} pending sync jobs to BullMQ for processing`,
      };
    } catch (err: any) {
      this.logger.warn(`processPendingSyncs skipped: Database offline or query failed (${err.message})`);
      return { reQueued: 0, message: `Database offline: ${err.message}` };
    }
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
}