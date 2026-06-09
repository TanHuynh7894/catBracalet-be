import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ShipmentController } from './shipment.controller';
import { ShipmentService } from './shipment.service';
import { Shipment } from './entities/shipment.entity';
import { Order } from '../orders/entities/order.entity';
import { UserAddress } from '../user_address/entities/user_address.entity';
import { VipModule } from '../VIP/vip.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Shipment, Order, UserAddress]),
    HttpModule,
    VipModule,
  ],
  controllers: [ShipmentController],
  providers: [ShipmentService],
  exports: [ShipmentService],
})
export class ShipmentModule {}
