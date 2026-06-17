import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreateShopLocationDto } from './dto/create-shop-location.dto';
import { UpdateShopLocationDto } from './dto/update-shop-location.dto';
import { ShopLocation } from './entities/shop-location.entity';
import { ShopLocationService } from './shop-location.service';

@ApiTags('Shop Location')
@Controller('shop-location')
export class ShopLocationController {
  constructor(private readonly shopLocationService: ShopLocationService) {}

  @Post()
  @ApiOperation({
    summary: 'Save shop address and geocode coordinates with Nominatim',
  })
  @ApiCreatedResponse({ type: ShopLocation })
  create(@Body() createShopLocationDto: CreateShopLocationDto) {
    return this.shopLocationService.create(createShopLocationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get current active shop location for FE map' })
  @ApiOkResponse({ type: ShopLocation })
  findCurrent() {
    return this.shopLocationService.findCurrent();
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
