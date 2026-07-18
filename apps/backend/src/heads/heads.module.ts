import { Module } from '@nestjs/common';
import { HeadsController } from './heads.controller';
import { HeadsService } from './heads.service';

@Module({
  controllers: [HeadsController],
  providers: [HeadsService],
  exports: [HeadsService],
})
export class HeadsModule {}
