import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/public.decorator';
import { HeadsService } from './heads.service';

@ApiTags('Heads')
@Public()
@Controller('heads')
export class HeadsController {
  constructor(private readonly headsService: HeadsService) {}

  @Get('bootstrap')
  @ApiOperation({ summary: 'Get bootstrap data for heads and syllabus' })
  getBootstrapData() {
    return this.headsService.getBootstrapData();
  }

  @Post('subject')
  @ApiOperation({ summary: 'Save subject head assignment' })
  saveSubjectHead(@Body() payload: any) {
    return this.headsService.saveSubjectHead(payload);
  }

  @Post('batch')
  @ApiOperation({ summary: 'Save batch head assignment' })
  saveBatchHead(@Body() payload: any) {
    return this.headsService.saveBatchHead(payload);
  }

  @Delete('subject/:id')
  @ApiOperation({ summary: 'Delete subject head assignment' })
  deleteSubjectHead(@Param('id') id: string) {
    return this.headsService.deleteSubjectHead(id);
  }

  @Delete('batch/:id')
  @ApiOperation({ summary: 'Delete batch head assignment' })
  deleteBatchHead(@Param('id') id: string) {
    return this.headsService.deleteBatchHead(id);
  }

  @Get('syllabus')
  @ApiOperation({ summary: 'Get syllabus modules for batch and subject' })
  getSyllabusModules(
    @Query('batchName') batchName: string,
    @Query('subjectName') subjectName: string,
  ) {
    return this.headsService.getSyllabusModules(batchName, subjectName);
  }

  @Post('syllabus')
  @ApiOperation({ summary: 'Save syllabus module' })
  saveSyllabusModule(@Body() payload: any) {
    return this.headsService.saveSyllabusModule(payload);
  }

  @Delete('syllabus/:id')
  @ApiOperation({ summary: 'Delete syllabus module' })
  deleteSyllabusModule(@Param('id') id: string) {
    return this.headsService.deleteSyllabusModule(id);
  }

  @Get('syllabus/overview')
  @ApiOperation({ summary: 'Get syllabus overview' })
  getSyllabusOverview() {
    return this.headsService.getSyllabusOverview();
  }

  @Get('syllabus/pdf')
  @ApiOperation({ summary: 'Generate syllabus PDF' })
  generateSyllabusPdf(
    @Query('batchName') batchName: string,
    @Query('subjectName') subjectName: string,
  ) {
    return this.headsService.generateSyllabusPdf(batchName, subjectName);
  }
}
