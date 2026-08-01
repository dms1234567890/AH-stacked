import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SyncService } from './sync.service';
import { DailyAlertsService } from '../daily-alerts/daily-alerts.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class SyncCronService {
  private readonly logger = new Logger(SyncCronService.name);
  private isSyncRunning = false;

  constructor(
    private readonly syncService: SyncService,
    private readonly dailyAlertsService: DailyAlertsService,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Cron Job 1: Periodic Google Sheets Auto Sync
   * Schedule: Runs every 15 minutes
   */
  @Cron('*/15 * * * *')
  async handlePeriodicGoogleSheetsSync() {
    if (this.isSyncRunning) {
      this.logger.warn('[Cron] Previous Google Sheets sync job still in progress. Skipping...');
      return;
    }

    this.isSyncRunning = true;
    this.logger.log('[Cron Triggered] Starting automated 15-minute Google Sheets data sync...');

    try {
      const result = await this.syncService.processPendingSyncs();
      this.logger.log(`[Cron Success] Automated Google Sheets sync finished: ${JSON.stringify(result)}`);
    } catch (err: any) {
      this.logger.error(`[Cron Error] Automated Google Sheets sync failed: ${err.message}`, err.stack);
    } finally {
      this.isSyncRunning = false;
    }
  }

  /**
   * Cron Job 2: Daily Academic Alerts Digest Dispatch
   * Schedule: Every morning at 9:00 AM
   */
  @Cron('0 9 * * *')
  async handleDailyAcademicAlertsCron() {
    this.logger.log('[Cron Triggered] Starting 9:00 AM Daily Academic Alerts Digest dispatch...');

    try {
      const digestResult = await this.notificationsService.sendDailyDigest();
      this.logger.log(`[Cron Success] Daily academic alerts digest sent: ${JSON.stringify(digestResult)}`);
    } catch (err: any) {
      this.logger.error(`[Cron Error] Daily academic alerts digest failed: ${err.message}`, err.stack);
    }
  }

  /**
   * Cron Job 3: Nightly Log Cleanup & System Refresh
   * Schedule: Every midnight (00:00 AM)
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleNightlyCleanupCron() {
    this.logger.log('[Cron Triggered] Performing nightly cache and sync log cleanup...');

    try {
      const status = await this.syncService.getSyncStatus();
      this.logger.log(`[Cron Success] Nightly system check complete. Sync Status: ${JSON.stringify(status)}`);
    } catch (err: any) {
      this.logger.error(`[Cron Error] Nightly cleanup failed: ${err.message}`, err.stack);
    }
  }
}
