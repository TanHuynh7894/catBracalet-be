import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductVariant } from './entities/product-variant.entity';
import { Product } from '../products/entities/product.entity';
import { ProductImage } from '../product-images/entities/product-image.entity';
import { ProductVariantsController } from './product-variants.controller';
import { ProductVariantsService } from './product-variants.service';

@Module({
  imports: [TypeOrmModule.forFeature([ProductVariant, Product, ProductImage])],
  controllers: [ProductVariantsController],
  providers: [ProductVariantsService],
})
export class ProductVariantsModule {}