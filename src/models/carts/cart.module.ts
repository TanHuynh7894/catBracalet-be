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
    // 💡 Bắt buộc phải nạp đầy đủ các Entity mà CartService đang Inject vào Repository
    TypeOrmModule.forFeature([
      Cart,
      CartItem,
      ProductVariant,
      ProductVariantMapping,
    ]),
  ],
  controllers: [CartController],
  providers: [CartService],
  exports: [CartService], // Export nếu cần dùng ở các module khác (ví dụ: OrdersModule)
})
export class CartModule {}
