import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TeachersService } from './teachers.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';

@ApiTags('Teachers')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('teachers')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all teachers' })
  async findAll() {
    return this.teachersService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Create a teacher' })
  async create(@Body() body: { name: string; teacherId: string; email?: string }) {
    return this.teachersService.create(body);
  }
}