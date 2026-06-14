import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserAddressService } from './user_address.service';
import { UserAddressController } from './user_address.controller';
import { UserAddress } from './entities/user_address.entity';
import { User } from '../user/entities/user.entity';
import { ShipmentModule } from '../shipment/shipment.module';

@Module({
  imports: [TypeOrmModule.forFeature([UserAddress, User]), ShipmentModule],
  controllers: [UserAddressController],
  providers: [UserAddressService],
  exports: [UserAddressService],
})
export class UserAddressModule {}
