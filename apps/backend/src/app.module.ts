import { Module } from '@nestjs/common';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PrismaModule } from './common/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { StudentsModule } from './students/students.module';
import { EmployeesModule } from './employees/employees.module';
import { TeachersModule } from './teachers/teachers.module';
import { BatchesModule } from './batches/batches.module';
import { SubjectsModule } from './subjects/subjects.module';
import { ClassesModule } from './classes/classes.module';
import { TasksModule } from './tasks/tasks.module';
import { SyncModule } from './sync/sync.module';
import { HeadsModule } from './heads/heads.module';
import { PerformanceModule } from './performance/performance.module';
import { ExamsModule } from './exams/exams.module';
import { GrievanceModule } from './grievance/grievance.module';
import { DailyAlertsModule } from './daily-alerts/daily-alerts.module';
import { CallingModule } from './calling/calling.module';
import { JobsModule } from './jobs/jobs.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    // Rate limiting
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    // Feature modules
    PrismaModule,
    AuthModule,
    UsersModule,
    StudentsModule,
    EmployeesModule,
    TeachersModule,
    BatchesModule,
    SubjectsModule,
    ClassesModule,
    TasksModule,
    SyncModule,
    HeadsModule,
    PerformanceModule,
    ExamsModule,
    GrievanceModule,
    DailyAlertsModule,
    CallingModule,
    JobsModule,
    NotificationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
