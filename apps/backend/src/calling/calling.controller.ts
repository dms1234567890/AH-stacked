import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Public } from '../common/public.decorator';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { CallingService } from './calling.service';

@Controller('calling')
@UseGuards(JwtAuthGuard)
export class CallingController {
  constructor(private readonly callingService: CallingService) {}

  @Public()
  @Get('dashboard')
  async getDashboardData(
    @Query('date') date?: string,
    @Query('batch') batch?: string,
    @Query('taskType') taskType?: string,
  ) {
    return this.callingService.getDashboardData(date, batch, taskType);
  }

  @Post('task/create')
  async createManualTask(@Body() body: any) {
    return this.callingService.createManualCallTask(body);
  }

  @Post('status/update')
  async updateCallStatus(@Body() body: any) {
    return this.callingService.updateCallStatus(body);
  }

  @Post('drop-message')
  async sendDropMessage(@Body() body: any) {
    return this.callingService.sendDropMessage(body);
  }

  @Post('complete')
  async markCallCompleted(@Body() body: any) {
    return this.callingService.markCallCompleted(body);
  }
}
