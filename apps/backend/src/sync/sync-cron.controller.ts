import { Controller, Post, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/public.decorator';
import { SyncCronService } from './sync-cron.service';

@ApiTags('Sync Cron')
@Public()
@Controller('sync/cron')
export class SyncCronController {
  constructor(private readonly syncCronService: SyncCronService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get automated cron scheduler status' })
  async getCronStatus() {
    return {
      status: 'ACTIVE',
      jobs: [
        { name: 'Periodic Google Sheets Auto Sync', schedule: 'Every 15 minutes' },
        { name: 'Daily Academic Alerts Digest Email', schedule: 'Every day at 9:00 AM' },
        { name: 'Nightly System Maintenance', schedule: 'Every day at 00:00 AM' },
      ],
      timestamp: new Date().toISOString(),
    };
  }

  @Post('run-sync')
  @ApiOperation({ summary: 'Manually trigger 15-minute Google Sheets sync cron now' })
  async triggerSyncCron() {
    await this.syncCronService.handlePeriodicGoogleSheetsSync();
    return { message: 'Periodic Google Sheets auto-sync triggered successfully' };
  }

  @Post('run-daily-alerts')
  @ApiOperation({ summary: 'Manually trigger Daily Academic Alerts digest dispatch cron now' })
  async triggerDailyAlertsCron() {
    await this.syncCronService.handleDailyAcademicAlertsCron();
    return { message: 'Daily Academic Alerts digest dispatch triggered successfully' };
  }
}
