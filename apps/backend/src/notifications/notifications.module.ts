import { Module, forwardRef } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { DailyAlertsModule } from '../daily-alerts/daily-alerts.module';
import { SyncModule } from '../sync/sync.module';

@Module({
  imports: [DailyAlertsModule, forwardRef(() => SyncModule)],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
