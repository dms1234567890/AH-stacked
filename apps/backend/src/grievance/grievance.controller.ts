import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GrievanceService } from './grievance.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Public } from '../common/public.decorator';

@ApiTags('Grievance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('grievance')
export class GrievanceController {
  constructor(private readonly grievanceService: GrievanceService) {}

  @Public()
  @Get('dashboard')
  @ApiOperation({ summary: 'Get grievance dashboard data' })
  async getDashboard() {
    return this.grievanceService.getDashboardData();
  }

  @Public()
  @Get('complaints')
  @ApiOperation({ summary: 'Get all grievance complaints' })
  async getAllComplaints() {
    return this.grievanceService.getComplaints();
  }

  @Public()
  @Get('complaints/search')
  @ApiOperation({ summary: 'Search complaints' })
  @ApiQuery({ name: 'q', required: true })
  async searchComplaints(@Query('q') q: string) {
    return this.grievanceService.searchComplaints(q);
  }

  @Public()
  @Get('complaints/:complaintId')
  @ApiOperation({ summary: 'Get complaint details' })
  async getComplaint(@Param('complaintId') complaintId: string) {
    return this.grievanceService.getComplaint(complaintId);
  }

  @Public()
  @Post('complaints')
  @ApiOperation({ summary: 'Create a new complaint' })
  async createComplaint(@Body() data: any) {
    return this.grievanceService.createComplaint(data);
  }

  @Put('complaints/:complaintId')
  @ApiOperation({ summary: 'Update a complaint' })
  async updateComplaint(@Param('complaintId') complaintId: string, @Body() data: any) {
    return this.grievanceService.updateComplaint(complaintId, data);
  }

  @Delete('complaints/:complaintId')
  @ApiOperation({ summary: 'Delete a complaint' })
  async deleteComplaint(@Param('complaintId') complaintId: string) {
    return this.grievanceService.deleteComplaint(complaintId);
  }

  @Get('pending-calls')
  @ApiOperation({ summary: 'Get pending calls for today' })
  async getPendingCalls() {
    return this.grievanceService.getPendingCallsForToday();
  }

  @Get('call-logs')
  @ApiOperation({ summary: 'Get recent call logs' })
  @ApiQuery({ name: 'limit', required: false })
  async getCallLogs(@Query('limit') limit?: number) {
    return this.grievanceService.getRecentCallLogs(limit ? { limit } : undefined);
  }

  @Get('callbacks')
  @ApiOperation({ summary: 'Get scheduled callbacks' })
  async getCallbacks() {
    return this.grievanceService.getScheduledCallbacks();
  }

  @Get('call-summary')
  @ApiOperation({ summary: "Get today's call summary" })
  async getCallSummary() {
    return this.grievanceService.getTodaysCallSummary();
  }

  @Post('calls')
  @ApiOperation({ summary: 'Log a call record' })
  async logCall(@Body() payload: any) {
    return this.grievanceService.logCall(payload);
  }

  @Get('calls/:complaintId')
  @ApiOperation({ summary: 'Get call records for a complaint' })
  async getCallRecords(@Param('complaintId') complaintId: string) {
    return this.grievanceService.getCallRecordsForComplaint(complaintId);
  }
}