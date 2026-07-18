import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { HeadsService } from './heads.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('heads')
export class HeadsController {
  constructor(private readonly headsService: HeadsService) {}

  @Get('bootstrap')
  getBootstrapData() {
    return this.headsService.getBootstrapData();
  }

  @Post('subject')
  saveSubjectHead(@Body() payload: any) {
    return this.headsService.saveSubjectHead(payload);
  }

  @Post('batch')
  saveBatchHead(@Body() payload: any) {
    return this.headsService.saveBatchHead(payload);
  }

  @Delete('subject/:id')
  deleteSubjectHead(@Param('id') id: string) {
    return this.headsService.deleteSubjectHead(id);
  }

  @Delete('batch/:id')
  deleteBatchHead(@Param('id') id: string) {
    return this.headsService.deleteBatchHead(id);
  }

  @Get('syllabus')
  getSyllabusModules(
    @Query('batchName') batchName: string,
    @Query('subjectName') subjectName: string,
  ) {
    return this.headsService.getSyllabusModules(batchName, subjectName);
  }

  @Post('syllabus')
  saveSyllabusModule(@Body() payload: any) {
    return this.headsService.saveSyllabusModule(payload);
  }

  @Delete('syllabus/:id')
  deleteSyllabusModule(@Param('id') id: string) {
    return this.headsService.deleteSyllabusModule(id);
  }

  @Get('syllabus/overview')
  getSyllabusOverview() {
    return this.headsService.getSyllabusOverview();
  }

  @Get('syllabus/pdf')
  generateSyllabusPdf(
    @Query('batchName') batchName: string,
    @Query('subjectName') subjectName: string,
  ) {
    return this.headsService.generateSyllabusPdf(batchName, subjectName);
  }
}
