import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Public } from '../common/public.decorator';
import { StudentsService } from './students.service';
import { AdmissionsService } from './admissions.service';
import { Request } from 'express';

@ApiTags('Students')
@Public()
@Controller('students')
export class StudentsController {
  constructor(
    private readonly studentsService: StudentsService,
    private readonly admissionsService: AdmissionsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all students (paginated)' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'batchId', required: false })
  @ApiQuery({ name: 'status', required: false })
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('batchId') batchId?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.studentsService.findAll({ page, limit, search, batchId, status, sortBy, sortOrder });
  }

  @Get('new')
  @ApiOperation({ summary: 'Get new students (not yet enrolled)' })
  async getNewStudents() {
    return this.admissionsService.getNewStudents();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active students' })
  async getActiveStudents(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('batchId') batchId?: string,
  ) {
    return this.studentsService.findAll({ page, limit, search, batchId, status: 'ACTIVE' });
  }

  @Get('sync-preview')
  @ApiOperation({ summary: 'Preview student ID mismatches between admissions and database' })
  async getSyncPreview() {
    return this.studentsService.getSyncPreview();
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync student IDs from admissions to database' })
  async syncStudentIds() {
    return this.admissionsService.syncIds();
  }

  @Get('duplicates')
  @ApiOperation({ summary: 'Find duplicate students in database' })
  async findDuplicates() {
    return this.studentsService.findDuplicates();
  }

  @Get('batch-history/:studentId')
  @ApiOperation({ summary: 'Get batch change history for a student' })
  async getBatchHistory(@Param('studentId') studentId: string) {
    return this.studentsService.getBatchHistory(studentId);
  }

  @Get('student-id/:studentId')
  @ApiOperation({ summary: 'Find student by student ID (e.g., 2602060001)' })
  async findByStudentId(@Param('studentId') studentId: string) {
    return this.studentsService.findByStudentId(studentId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get student by ID' })
  async findById(@Param('id') id: string) {
    return this.studentsService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new student' })
  async create(@Body() body: any, @Req() req: Request) {
    const user = (req as any).user || { id: 'admin_user' };
    return this.studentsService.create({ ...body, changedById: user.id });
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a student' })
  async update(@Param('id') id: string, @Body() body: any, @Req() req: Request) {
    const user = (req as any).user || { id: 'admin_user' };
    return this.studentsService.update(id, { ...body, changedById: user.id });
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel student admission (soft delete)' })
  async cancel(@Param('id') id: string, @Req() req: Request) {
    const user = (req as any).user || { id: 'admin_user' };
    return this.studentsService.cancel(id, 'Cancelled by admin', user.id);
  }

  @Post('batch-change')
  @ApiOperation({ summary: 'Change student batch' })
  async changeBatch(@Body() body: { studentId: string; newBatchId: string }, @Req() req: Request) {
    const user = (req as any).user || { id: 'admin_user' };
    return this.studentsService.changeBatch(body.studentId, body.newBatchId, user.id);
  }

  @Delete('admissions/:id')
  @ApiOperation({ summary: 'Delete admission entry' })
  async deleteAdmission(@Param('id') id: string) {
    return this.admissionsService.deleteAdmission(id);
  }

  @Delete('admissions/duplicate/:id')
  @ApiOperation({ summary: 'Delete duplicate from admissions and database' })
  async deleteDuplicate(@Param('id') id: string, @Query('studentId') studentId: string) {
    return this.admissionsService.deleteDuplicate(id, studentId);
  }
}