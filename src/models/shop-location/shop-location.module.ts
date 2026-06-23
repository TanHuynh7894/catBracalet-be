import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopLocation } from './entities/shop-location.entity';
import { ShopInventory } from './entities/shop-inventory.entity';
import { ShopLocationController } from './shop-location.controller';
import { ShopLocationService } from './shop-location.service';
import { ShipmentModule } from '../shipment/shipment.module';
import { ProductVariant } from '../product-variants/entities/product-variant.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ShopLocation, ShopInventory, ProductVariant]),
    ShipmentModule,
  ],
  controllers: [ShopLocationController],
  providers: [ShopLocationService],
  exports: [ShopLocationService],
})
export class ShopLocationModule {}
