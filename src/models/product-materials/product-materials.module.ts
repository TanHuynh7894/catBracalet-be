import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductMaterialsService } from './product-materials.service';
import { ProductMaterialsController } from './product-materials.controller';
import { ProductMaterial } from './entities/product-material.entity'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([ProductMaterial]),
  ],
  controllers: [ProductMaterialsController],
  providers: [ProductMaterialsService],
  exports: [ProductMaterialsService],
})
export class ProductMaterialsModule {}