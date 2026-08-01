import { Controller, Post, Get, Query, Body, UseGuards, Logger } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Public } from '../common/public.decorator';

@ApiTags('Sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sync')
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(private readonly syncService: SyncService) {}

  @Public()
  @Post('webhook')
  @ApiOperation({ summary: 'Receive real-time automated trigger webhooks from Google Sheets' })
  async handleSheetWebhook(@Body() payload: any) {
    this.logger.log(`[Google Sheets Webhook Received] Sheet: "${payload.sheetName}" in "${payload.spreadsheetName}"`);

    // Signal live trigger acknowledgment
    return {
      received: true,
      spreadsheet: payload.spreadsheetName,
      sheetName: payload.sheetName,
      editedRow: payload.editedRow,
      timestamp: new Date().toISOString(),
      status: 'PROCESSED',
    };
  }

  @Post('process')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Re-queue all pending/failed sync jobs to BullMQ for processing' })
  async processPending() {
    return this.syncService.processPendingSyncs();
  }

  @Get('status')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get sync queue status summary' })
  async getStatus() {
    return this.syncService.getSyncStatus();
  }

  @Get('logs')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Get recent sync log entries' })
  @ApiQuery({ name: 'limit', required: false })
  async getLogs(@Query('limit') limit?: number) {
    return this.syncService.getSyncLogs(limit);
  }
}