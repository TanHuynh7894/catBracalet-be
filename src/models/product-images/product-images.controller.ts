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

import { CreateProductImageDto } from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { ProductImage } from './entities/product-image.entity';
import { ProductImagesService } from './product-images.service';

@ApiTags('Product Images')
@Controller('product-images')
export class ProductImagesController {
  constructor(
    private readonly productImagesService: ProductImagesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a product image' })
  @ApiCreatedResponse({ type: ProductImage })
  create(@Body() createProductImageDto: CreateProductImageDto) {
    return this.productImagesService.create(createProductImageDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product images' })
  @ApiOkResponse({ type: ProductImage, isArray: true })
  findAll() {
    return this.productImagesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product image by id' })
  @ApiParam({ name: 'id', description: 'Product image UUID' })
  @ApiOkResponse({ type: ProductImage })
  findOne(@Param('id') id: string) {
    return this.productImagesService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update product image (status cannot be updated here)',
  })
  @ApiParam({ name: 'id', description: 'Product image UUID' })
  @ApiOkResponse({ type: ProductImage })
  update(
    @Param('id') id: string,
    @Body() updateProductImageDto: UpdateProductImageDto,
  ) {
    return this.productImagesService.update(id, updateProductImageDto);
  }

  @Patch(':id/soft-delete')
  @ApiOperation({
    summary: 'Soft delete product image (ACTIVE -> INACTIVE)',
  })
  @ApiParam({ name: 'id', description: 'Product image UUID' })
  @ApiOkResponse({ type: ProductImage })
  softDelete(@Param('id') id: string) {
    return this.productImagesService.softDelete(id);
  }

  @Delete(':id/force')
  @ApiOperation({
    summary: 'Force delete product image permanently',
  })
  @ApiParam({ name: 'id', description: 'Product image UUID' })
  remove(@Param('id') id: string) {
    return this.productImagesService.remove(id);
  }
}