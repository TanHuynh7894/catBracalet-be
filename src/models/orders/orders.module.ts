import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from '../carts/entities/cart.entity';
import { CartItem } from '../cart_items/entities/cart-item.entity';
import { ProductVariant } from '../product-variants/entities/product-variant.entity';
import { Vouchers } from '../vouchers/entities/vouchers.entity';
import { UserAddress } from '../user_address/entities/user_address.entity';

import { VouchersModule } from '../vouchers/vouchers.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      Cart,
      CartItem,
      ProductVariant,
      Vouchers,
      UserAddress,
    ]),
    VouchersModule,
  ],
  controllers: [OrdersController],

  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule { }

