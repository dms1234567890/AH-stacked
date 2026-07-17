import { Controller, Get, Post, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TasksService } from './tasks.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { Request } from 'express';

@ApiTags('Tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tasks')
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new task' })
  async create(@Body() body: any, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.tasksService.create({ ...body, giverId: user.id });
  }

  @Get()
  @ApiOperation({ summary: 'Get all tasks' })
  async findAll(@Query('page') page?: number, @Query('limit') limit?: number, @Query('status') status?: string) {
    return this.tasksService.findAll({ page, limit, status });
  }

  @Get('completed')
  @ApiOperation({ summary: 'Get completed tasks for rating' })
  async getCompletedForRating() {
    return this.tasksService.getCompletedForRating();
  }

  @Post(':token/rate')
  @ApiOperation({ summary: 'Rate a task' })
  async rate(@Param('token') token: string, @Body() body: { rating: number; notes?: string }, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.tasksService.rate(token, body.rating, user.id, body.notes);
  }
}