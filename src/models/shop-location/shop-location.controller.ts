import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateShopLocationDto } from './dto/create-shop-location.dto';
import { UpdateShopInventoryDto } from './dto/update-shop-inventory.dto';
import { UpdateShopLocationDto } from './dto/update-shop-location.dto';
import { ShopLocation } from './entities/shop-location.entity';
import { ShopLocationService } from './shop-location.service';

@ApiTags('Shop Location')
@Controller('shop-location')
export class ShopLocationController {
  constructor(private readonly shopLocationService: ShopLocationService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a shop location from selected Goship address codes',
  })
  @ApiCreatedResponse({ type: ShopLocation })
  create(@Body() createShopLocationDto: CreateShopLocationDto) {
    return this.shopLocationService.create(createShopLocationDto);
  }

  @Get('provinces')
  @ApiOperation({ summary: 'Get Goship provinces/cities for shop location' })
  getAllProvinces() {
    return this.shopLocationService.getProvinces();
  }

  @Get('districts/:provinceId')
  @ApiOperation({
    summary: 'Get Goship districts by province/city id for shop location',
  })
  getDistrictsByProvince(@Param('provinceId') provinceId: string) {
    return this.shopLocationService.getDistricts(provinceId);
  }

  @Get('wards/:districtId')
  @ApiOperation({
    summary: 'Get Goship wards by district id for shop location',
  })
  getWardsByDistrict(@Param('districtId') districtId: string) {
    return this.shopLocationService.getWards(districtId);
  }

  @Get()
  @ApiOperation({
    summary: 'Get latest active shop location for legacy FE map',
  })
  @ApiOkResponse({ type: ShopLocation })
  findCurrent() {
    return this.shopLocationService.findCurrent();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active shop locations for FE map/shipping' })
  @ApiOkResponse({ type: ShopLocation, isArray: true })
  findActive() {
    return this.shopLocationService.findActive();
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all shop locations' })
  @ApiOkResponse({ type: ShopLocation, isArray: true })
  findAll() {
    return this.shopLocationService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get shop location by id' })
  @ApiParam({ name: 'id', description: 'Shop location UUID' })
  @ApiOkResponse({ type: ShopLocation })
  findOne(@Param('id') id: string) {
    return this.shopLocationService.findOne(id);
  }

  @Get(':id/inventory')
  @ApiOperation({ summary: 'Get inventory for a shop location' })
  @ApiParam({ name: 'id', description: 'Shop location UUID' })
  getInventory(@Param('id') id: string) {
    return this.shopLocationService.getInventory(id);
  }

  @Put(':id/inventory/:variantId')
  @ApiOperation({ summary: 'Set variant inventory for a shop location' })
  @ApiParam({ name: 'id', description: 'Shop location UUID' })
  @ApiParam({ name: 'variantId', description: 'Product variant UUID' })
  setInventory(
    @Param('id') id: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateShopInventoryDto,
  ) {
    return this.shopLocationService.setInventory(id, variantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a shop location' })
  @ApiParam({ name: 'id', description: 'Shop location UUID' })
  @ApiOkResponse({ type: ShopLocation })
  update(
    @Param('id') id: string,
    @Body() updateShopLocationDto: UpdateShopLocationDto,
  ) {
    return this.shopLocationService.update(id, updateShopLocationDto);
  }

  @Patch(':id/active')
  @ApiOperation({ summary: 'Set a shop location as active' })
  @ApiParam({ name: 'id', description: 'Shop location UUID' })
  @ApiOkResponse({ type: ShopLocation })
  setActive(@Param('id') id: string) {
    return this.shopLocationService.setActive(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Deactivate a shop location' })
  @ApiParam({ name: 'id', description: 'Shop location UUID' })
  @ApiOkResponse({ type: ShopLocation })
  deactivate(@Param('id') id: string) {
    return this.shopLocationService.deactivate(id);
  }
}
