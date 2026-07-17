import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { BatchesService } from './batches.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';
import { RolesGuard } from '../common/roles.guard';
import { Roles } from '../common/roles.decorator';
import { Request } from 'express';

@ApiTags('Batches')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('batches')
export class BatchesController {
  constructor(private readonly batchesService: BatchesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all batches' })
  async findAll() {
    return this.batchesService.findAll();
  }

  @Get('names')
  @ApiOperation({ summary: 'Get batch names only' })
  async getNames() {
    return this.batchesService.getNames();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get batch by ID' })
  async findById(@Param('id') id: string) {
    return this.batchesService.findById(id);
  }

  @Get('name/:name')
  @ApiOperation({ summary: 'Get batch by name' })
  async findByName(@Param('name') name: string) {
    return this.batchesService.findByName(name);
  }

  @Post()
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Create a new batch' })
  async create(@Body() body: { name: string; subjects: string[]; classRoom?: string }, @Req() req: Request) {
    const user = req.user as { id: string };
    return this.batchesService.create({ ...body, changedById: user.id });
  }

  @Put(':id')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Update a batch' })
  async update(@Param('id') id: string, @Body() body: { name?: string; classRoom?: string; subjects?: string[] }) {
    return this.batchesService.update(id, body);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Delete a batch' })
  async delete(
    @Param('id') id: string,
    @Query('action') action: string,
    @Query('targetBatchId') targetBatchId?: string,
  ) {
    return this.batchesService.delete(id, action, targetBatchId);
  }

  @Get(':id/student-count')
  @ApiOperation({ summary: 'Get student count for a batch' })
  async getStudentCount(@Param('id') id: string) {
    const count = await this.batchesService.getStudentCount(id);
    return { count };
  }

  @Post(':batchId/subjects/:subjectId')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Add subject to batch' })
  async addSubject(@Param('batchId') batchId: string, @Param('subjectId') subjectId: string) {
    return this.batchesService.addSubjectToBatch(batchId, subjectId);
  }

  @Delete(':batchId/subjects/:subjectId')
  @Roles('ADMIN', 'MANAGER')
  @ApiOperation({ summary: 'Remove subject from batch' })
  async removeSubject(@Param('batchId') batchId: string, @Param('subjectId') subjectId: string) {
    return this.batchesService.removeSubjectFromBatch(batchId, subjectId);
  }
}