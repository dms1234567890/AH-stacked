import { Module, forwardRef } from '@nestjs/common';
import { SyncModule } from '../sync/sync.module';
import { DailyAlertsController } from './daily-alerts.controller';
import { DailyAlertsService } from './daily-alerts.service';

@Module({
  imports: [forwardRef(() => SyncModule)],
  controllers: [DailyAlertsController],
  providers: [DailyAlertsService],
  exports: [DailyAlertsService],
})
export class DailyAlertsModule {}
