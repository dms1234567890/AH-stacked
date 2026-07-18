import { Controller, Get, Post, Body, Query, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@ApiTags('Class Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get('bootstrap')
  @ApiOperation({ summary: 'Get bootstrap data' })
  async getBootstrapData() {
    return this.classesService.getBootstrapData();
  }

  @Get('recurring')
  @ApiOperation({ summary: 'Get recurring schedule' })
  async getRecurringSchedule(@Query('batchId') batchId?: string) {
    return this.classesService.getRecurringSchedule(batchId);
  }

  @Post('recurring')
  @ApiOperation({ summary: 'Save recurring schedule' })
  async saveRecurringSchedule(@Body() body: { batchId: string; weekDay: string | null; entries: any[] }) {
    return this.classesService.saveRecurringSchedule(body.batchId, body.weekDay, body.entries);
  }

  @Get('schedule/:date')
  @ApiOperation({ summary: 'Get combined schedule for a date' })
  async getScheduleForDate(@Param('date') date: string) {
    return this.classesService.getScheduleForDate(date);
  }

  @Get('partial/:date')
  @ApiOperation({ summary: 'Get partial overrides for a date' })
  async getPartialOverrides(@Param('date') date: string) {
    return this.classesService.getPartialOverrides(date);
  }

  @Post('partial')
  @ApiOperation({ summary: 'Save partial override' })
  async savePartialOverride(@Body() body: any) {
    return this.classesService.savePartialOverride(body);
  }

  @Get('work-time')
  @ApiOperation({ summary: 'Get teacher work times' })
  async getTeacherWorkTimes() {
    return this.classesService.getTeacherWorkTimes();
  }

  @Post('work-time')
  @ApiOperation({ summary: 'Save teacher work time' })
  async saveTeacherWorkTime(@Body() body: { teacherId: string; startTime: string; endTime: string }) {
    return this.classesService.saveTeacherWorkTime(body.teacherId, body.startTime, body.endTime);
  }

  @Delete('work-time/:teacherId')
  @ApiOperation({ summary: 'Delete teacher work time' })
  async deleteTeacherWorkTime(@Param('teacherId') teacherId: string) {
    return this.classesService.deleteTeacherWorkTime(teacherId);
  }

  @Get('absences')
  @ApiOperation({ summary: 'Get teacher absences' })
  async getTeacherAbsences(@Query() query: any) {
    return this.classesService.getTeacherAbsences(query);
  }

  @Post('absences')
  @ApiOperation({ summary: 'Save teacher absence' })
  async saveTeacherAbsence(@Body() body: any) {
    return this.classesService.saveTeacherAbsence(body);
  }

  @Get('merged/:date')
  @ApiOperation({ summary: 'Get merged classes for a date' })
  async getMergedClasses(@Param('date') date: string) {
    return this.classesService.getMergedClasses(date);
  }

  @Post('merged')
  @ApiOperation({ summary: 'Save merged class' })
  async saveMergedClass(@Body() body: any) {
    return this.classesService.saveMergedClass(body);
  }

  @Delete('merged/:id')
  @ApiOperation({ summary: 'Delete merged class' })
  async deleteMergedClass(@Param('id') id: string) {
    return this.classesService.deleteMergedClass(id);
  }

  @Get('sunday/:date')
  @ApiOperation({ summary: 'Get Sunday duties for a date' })
  async getSundayDuties(@Param('date') date: string) {
    return this.classesService.getSundayDuties(date);
  }

  @Post('sunday')
  @ApiOperation({ summary: 'Save Sunday duty' })
  async saveSundayDuty(@Body() body: { date: string; entries: any[] }) {
    return this.classesService.saveSundayDuty(body.date, body.entries);
  }

  @Delete('sunday/:id')
  @ApiOperation({ summary: 'Delete Sunday duty' })
  async deleteSundayDuty(@Param('id') id: string) {
    return this.classesService.deleteSundayDuty(id);
  }

  @Get('analytics/free-time')
  @ApiOperation({ summary: 'Get free time analytics' })
  async getFreeTimeAnalytics(@Query('date') date: string, @Query('teacherId') teacherId?: string) {
    return this.classesService.getFreeTimeAnalytics(date, teacherId);
  }

  @Get('analytics/available')
  @ApiOperation({ summary: 'Find available teachers' })
  async findAvailableTeachers(@Query('date') date: string, @Query('timeSlot') timeSlot: string, @Query('subject') subject?: string) {
    return this.classesService.findAvailableTeachers(date, timeSlot, subject);
  }
}
