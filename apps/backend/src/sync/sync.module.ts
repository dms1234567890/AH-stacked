import { Module, forwardRef } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { SyncController } from './sync.controller';
import { SyncCronController } from './sync-cron.controller';
import { SyncService } from './sync.service';
import { SyncQueue } from './sync.queue';
import { SyncCronService } from './sync-cron.service';
import { GoogleSheetsService } from './google-sheets.service';
import { PrismaModule } from '../common/prisma.module';
import { DailyAlertsModule } from '../daily-alerts/daily-alerts.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    DailyAlertsModule,
    forwardRef(() => NotificationsModule),
  ],
  controllers: [SyncController, SyncCronController],
  providers: [SyncService, SyncQueue, SyncCronService, GoogleSheetsService],
  exports: [SyncService, GoogleSheetsService, SyncCronService],
})
export class SyncModule {}