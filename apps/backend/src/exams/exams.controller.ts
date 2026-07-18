import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { JwtAuthGuard } from '../common/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  getAll() {
    return this.examsService.getAll();
  }

  @Post()
  save(@Body() payload: any) {
    return this.examsService.save(payload);
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.examsService.delete(id);
  }

  @Get('bootstrap')
  bootstrap() {
    return this.examsService.bootstrap();
  }
}
