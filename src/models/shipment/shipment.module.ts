import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ShipmentController } from './shipment.controller';
import { ShipmentService } from './shipment.service';
import { Shipment } from './entities/shipment.entity';
import { Order } from '../orders/entities/order.entity';
import { UserAddress } from '../user_address/entities/user_address.entity';
import { VipModule } from '../VIP/vip.module';
import { ShopLocation } from '../shop-location/entities/shop-location.entity';
import { ShopInventory } from '../shop-location/entities/shop-inventory.entity';
import { Cart } from '../carts/entities/cart.entity';
import { CartItem } from '../cart_items/entities/cart-item.entity';
import { OrderItemsModule } from '../order-items/order-items.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Shipment,
      Order,
      UserAddress,
      ShopLocation,
      ShopInventory,
      Cart,
      CartItem,
    ]),
    HttpModule,
    VipModule,
    OrderItemsModule,
  ],
  controllers: [ShipmentController],
  providers: [ShipmentService],
  exports: [ShipmentService],
})
export class ShipmentModule {}
