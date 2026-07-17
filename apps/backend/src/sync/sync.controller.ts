import { Controller, Post, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@ApiTags('Sync')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sync')
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

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