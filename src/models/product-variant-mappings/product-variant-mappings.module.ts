import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../product-variants/entities/product-variant.entity';
import { ProductVariantMappingsController } from './product-variant-mappings.controller';
import { ProductVariantMappingsService } from './product-variant-mappings.service';
import { ProductVariantMapping } from './entities/product-variant-mapping.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductVariantMapping, Product, ProductVariant]),
  ],
  controllers: [ProductVariantMappingsController],
  providers: [ProductVariantMappingsService],
})
export class ProductVariantMappingsModule {}
