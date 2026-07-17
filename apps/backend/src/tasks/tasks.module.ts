import { Module } from '@nestjs/common';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { SyncModule } from '../sync/sync.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, SyncModule],
  controllers: [TasksController],
  providers: [TasksService],
  exports: [TasksService],
})
export class TasksModule {}