import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { Payments } from './entities/payments.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Payments])],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
