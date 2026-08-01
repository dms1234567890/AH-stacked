import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '../common/public.decorator';
import { PerformanceService } from './performance.service';

@ApiTags('Performance')
@Public()
@Controller('performance')
export class PerformanceController {
  constructor(private readonly performanceService: PerformanceService) {}

  @Get('leaderboard')
  @ApiOperation({ summary: 'Get student leaderboard and ranking statistics' })
  async getLeaderboard(
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('languageMode') languageMode?: string,
    @Query('batchFilter') batchFilter?: string,
  ) {
    return this.performanceService.getLeaderboard(
      fromDate,
      toDate,
      languageMode,
      batchFilter,
    );
  }

  @Get('report/:studentId')
  @ApiOperation({ summary: 'Get a comprehensive performance report for a student' })
  async getStudentReport(
    @Param('studentId') studentId: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('languageMode') languageMode?: string,
    @Query('batchFilter') batchFilter?: string,
  ) {
    return this.performanceService.getStudentReport(
      studentId,
      fromDate,
      toDate,
      languageMode,
      batchFilter,
    );
  }
}
