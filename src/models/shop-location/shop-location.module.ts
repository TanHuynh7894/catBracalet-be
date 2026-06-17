import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ShopLocation } from './entities/shop-location.entity';
import { ShopLocationController } from './shop-location.controller';
import { ShopLocationService } from './shop-location.service';
import { ShipmentModule } from '../shipment/shipment.module';

@Module({
  imports: [TypeOrmModule.forFeature([ShopLocation]), ShipmentModule],
  controllers: [ShopLocationController],
  providers: [ShopLocationService],
  exports: [ShopLocationService],
})
export class ShopLocationModule {}
