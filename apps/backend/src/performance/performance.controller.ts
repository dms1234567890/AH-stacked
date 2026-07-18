import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { PerformanceService } from './performance.service';

@ApiTags('Performance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
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
