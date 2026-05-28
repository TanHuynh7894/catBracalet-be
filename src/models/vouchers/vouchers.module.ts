import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VouchersService } from './vouchers.service';
import { VouchersController } from './vouchers.controller';
import { Vouchers } from './entities/vouchers.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Vouchers])],
  controllers: [VouchersController],
  providers: [VouchersService],
  exports: [VouchersService],
})
export class VouchersModule { }

