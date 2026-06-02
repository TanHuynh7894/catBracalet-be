import { Module } from '@nestjs/common';
import { NhanhvnController } from './nhanhvn.controller';
import { NhanhvnScheduler } from './nhanhvn.scheduler';
import { NhanhvnService } from './nhanhvn.service';

@Module({
  controllers: [NhanhvnController],
  providers: [NhanhvnService, NhanhvnScheduler],
  exports: [NhanhvnService],
})
export class NhanhvnModule {}
