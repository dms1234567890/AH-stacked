import { Module } from '@nestjs/common';
import { SyncController } from './sync.controller';
import { SyncService } from './sync.service';
import { SyncQueue } from './sync.queue';
import { GoogleSheetsService } from './google-sheets.service';
import { PrismaModule } from '../common/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SyncController],
  providers: [SyncService, SyncQueue, GoogleSheetsService],
  exports: [SyncService],
})
export class SyncModule {}