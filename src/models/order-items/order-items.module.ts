import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { ProductVariantMapping } from '../product-variant-mappings/entities/product-variant-mapping.entity';
import { ProductVariant } from '../product-variants/entities/product-variant.entity';
import { OrderItemsController } from './order-items.controller';
import { OrderItemsService } from './order-items.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderItem,
      ProductVariant,
      ProductVariantMapping,
    ]),
  ],
  controllers: [OrderItemsController],
  providers: [OrderItemsService],
  exports: [OrderItemsService],
})
export class OrderItemsModule {}
