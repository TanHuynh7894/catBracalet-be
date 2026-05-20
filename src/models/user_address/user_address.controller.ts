import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserAddressService } from './user_address.service';
import { CreateUserAddressDto } from './dto/create-user-address.dto';
import { UpdateUserAddressDto } from './dto/update-user-address.dto';

@ApiTags('User Address')
@Controller('user-address')
export class UserAddressController {
  constructor(private readonly userAddressService: UserAddressService) {}

  @Post(':userId')
  @ApiOperation({ summary: 'Create a new address for a user' })
  createAddressForUser(
    @Param('userId') userId: string,
    @Body() createUserAddressDto: CreateUserAddressDto,
  ) {
    return this.userAddressService.createAddressForUser(userId, createUserAddressDto);
  }

  @Get(':userId')
  @ApiOperation({ summary: 'Get all addresses of a user' })
  getAddressesByUser(@Param('userId') userId: string) {
    return this.userAddressService.getAddressesByUser(userId);
  }

  @Patch(':userId/:addressId')
  @ApiOperation({ summary: 'Update an address for a user' })
  updateAddressForUser(
    @Param('userId') userId: string,
    @Param('addressId') addressId: string,
    @Body() updateUserAddressDto: UpdateUserAddressDto,
  ) {
    return this.userAddressService.updateAddressForUser(userId, addressId, updateUserAddressDto);
  }

  @Delete(':userId/:addressId')
  @ApiOperation({ summary: 'Delete an address of a user' })
  deleteAddressForUser(
    @Param('userId') userId: string,
    @Param('addressId') addressId: string,
  ) {
    return this.userAddressService.deleteAddressForUser(userId, addressId);
  }
}
