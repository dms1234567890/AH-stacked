import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';

@ApiTags('Subjects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all subjects' })
  async findAll() {
    return this.subjectsService.findAll();
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new subject' })
  async create(@Body() body: { name: string; code: string }) {
    return this.subjectsService.create(body);
  }

  @Put(':code')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update a subject' })
  async update(@Param('code') code: string, @Body() body: { name?: string }) {
    return this.subjectsService.update(code, body);
  }

  @Delete(':code')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a subject' })
  async delete(@Param('code') code: string) {
    return this.subjectsService.delete(code);
  }
}