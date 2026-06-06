import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductVariantMapping } from '../product-variant-mappings/entities/product-variant-mapping.entity';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductVariantsController } from './product-variants.controller';
import { ProductVariantsService } from './product-variants.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductVariant, Product, ProductVariantMapping]),
  ],
  controllers: [ProductVariantsController],
  providers: [ProductVariantsService],
})
export class ProductVariantsModule {}
