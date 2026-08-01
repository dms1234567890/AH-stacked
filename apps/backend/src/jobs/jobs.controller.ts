import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JobsService } from './jobs.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Public } from '../common/public.decorator';

@ApiTags('Jobs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Public()
  @Get('bootstrap')
  @ApiOperation({ summary: 'Get job requirements metadata, departments, and positions' })
  async getBootstrap() {
    return this.jobsService.getBootstrapData();
  }

  @Public()
  @Get('requisitions')
  @ApiOperation({ summary: 'Get all submitted job requisitions' })
  async getRequisitions() {
    return this.jobsService.getRequisitions();
  }

  @Public()
  @Post('requisitions')
  @ApiOperation({ summary: 'Submit a new job requisition' })
  async submitRequisition(@Body() data: any) {
    return this.jobsService.submitRequisition(data);
  }
}
