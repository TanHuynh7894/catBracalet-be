import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VipLevel } from './entities/vip-level.entity';
import { VipHistory } from './entities/vip-history.entity';
import { User } from '../user/entities/user.entity';
import { VipService } from './vip.service';
import { VipController } from './vip.controller';

@Module({
  imports: [TypeOrmModule.forFeature([VipLevel, VipHistory, User])],
  controllers: [VipController],
  providers: [VipService],
  exports: [VipService],
})
export class VipModule {}
