import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CartController } from './cart.controller';
import { CartService } from './cart.service';
import { Cart } from './entities/cart.entity';
import { CartItem } from '../cart_items/entities/cart-item.entity';
import { ProductVariant } from '../product-variants/entities/product-variant.entity';
import { ProductVariantMapping } from '../product-variant-mappings/entities/product-variant-mapping.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cart,
      CartItem,
      ProductVariant,
      ProductVariantMapping,
    ]),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService],
})
export class CartModule {}
