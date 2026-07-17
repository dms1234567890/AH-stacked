import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@ApiTags('Class Schedules')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  @ApiOperation({ summary: 'Get class schedule by date' })
  async findByDate(@Query('date') date: string) {
    return this.classesService.findByDate(date);
  }

  @Post()
  @ApiOperation({ summary: 'Create class schedule entries' })
  async create(@Body() body: { scheduleData: any[]; scheduleDate: string }) {
    const results: Awaited<ReturnType<ClassesService['create']>>[] = [];
    for (const entry of body.scheduleData) {
      const result = await this.classesService.create({
        date: body.scheduleDate,
        batchId: entry.batchId,
        subjectId: entry.subjectId,
        startTime: entry.startTime,
        endTime: entry.endTime,
        teacherId: entry.teacherId,
        teacherName: entry.teacherName,
        teacherEmail: entry.teacherEmail,
      });
      results.push(result);
    }
    return { success: true, message: 'Schedule saved successfully.', data: results };
  }
}
