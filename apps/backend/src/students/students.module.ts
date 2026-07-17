import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { AdmissionsService } from './admissions.service';
import { SyncModule } from '../sync/sync.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule, SyncModule],
  controllers: [StudentsController],
  providers: [StudentsService, AdmissionsService],
  exports: [StudentsService, AdmissionsService],
})
export class StudentsModule {}
