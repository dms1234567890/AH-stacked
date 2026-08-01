import { Module } from '@nestjs/common';
import { PrismaModule } from '../common/prisma.module';
import { CallingController } from './calling.controller';
import { CallingService } from './calling.service';

import { SyncModule } from '../sync/sync.module';

@Module({
  imports: [PrismaModule, SyncModule],
  controllers: [CallingController],
  providers: [CallingService],
  exports: [CallingService],
})
export class CallingModule {}
