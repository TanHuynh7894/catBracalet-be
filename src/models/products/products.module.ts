import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductMaterial } from '../product-materials/entities/product-material.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, ProductMaterial])],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
