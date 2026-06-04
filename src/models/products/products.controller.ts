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

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductsService } from './products.service';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a product' })
  @ApiCreatedResponse({ type: Product })
  create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products' })
  @ApiOkResponse({ type: Product, isArray: true })
  findAll() {
    return this.productsService.findAll();
  }

  @Get('by-name/:name')
  @ApiOperation({ summary: 'Get products by name' })
  @ApiParam({ name: 'name', description: 'Product name keyword' })
  @ApiOkResponse({ type: Product, isArray: true })
  findByName(@Param('name') name: string) {
    return this.productsService.findByName(name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product by id' })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiOkResponse({ type: Product })
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update product (status cannot be updated here)',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiOkResponse({ type: Product })
  update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
    return this.productsService.update(id, updateProductDto);
  }

  @Patch(':id/soft-delete')
  @ApiOperation({
    summary: 'Soft delete product (ACTIVE -> INACTIVE)',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiOkResponse({ type: Product })
  softDelete(@Param('id') id: string) {
    return this.productsService.softDelete(id);
  }

  @Delete(':id/force')
  @ApiOperation({
    summary: 'Force delete product permanently',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}