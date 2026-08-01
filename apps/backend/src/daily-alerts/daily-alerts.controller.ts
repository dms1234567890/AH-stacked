import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/public.decorator';
import { DailyAlertsPayload, DailyAlertsService } from './daily-alerts.service';

@ApiTags('Daily Alerts')
@Public()
@Controller('daily-alerts')
export class DailyAlertsController {
  constructor(private readonly dailyAlertsService: DailyAlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Get academic follow-up alerts for a date' })
  getAlerts(@Query('date') date?: string): Promise<DailyAlertsPayload> {
    return this.dailyAlertsService.getAlerts(date);
  }
}
