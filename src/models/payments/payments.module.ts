import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { Payments } from './entities/payments.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Payments])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
