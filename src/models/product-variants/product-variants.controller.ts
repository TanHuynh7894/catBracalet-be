import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { CreateProductVariantDto } from './dto/create-product-variant.dto';
import { GetProductListDto } from './dto/get-product-list.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { ProductVariant } from './entities/product-variant.entity';
import { ProductVariantsService } from './product-variants.service';

@ApiTags('Product Variants')
@Controller('product-variants')
export class ProductVariantsController {
  constructor(
    private readonly productVariantsService: ProductVariantsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a product variant' })
  @ApiBody({ type: CreateProductVariantDto }) 
  @ApiCreatedResponse({ type: ProductVariant })
  create(@Body() createProductVariantDto: CreateProductVariantDto) {
    return this.productVariantsService.create(createProductVariantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product variants' })
  @ApiOkResponse({ type: ProductVariant, isArray: true })
  findAll() {
    return this.productVariantsService.findAll();
  }

  @Get('filter')
  @ApiOperation({ summary: 'Get filtered product variant list' })
  @ApiQuery({ type: GetProductListDto })
  @ApiOkResponse({ type: ProductVariant, isArray: true })
  getProductList(@Query() params: GetProductListDto) {
    return this.productVariantsService.getProductList(params);
  }

  @Get('by-name/:name')
  @ApiOperation({ summary: 'Get product variants by product name' })
  @ApiParam({ name: 'name', description: 'Product name keyword' })
  @ApiOkResponse({ type: ProductVariant, isArray: true })
  findByName(@Param('name') name: string) {
    return this.productVariantsService.findByName(name);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get product variant by id' })
  @ApiParam({ name: 'id', description: 'Product variant UUID' })
  @ApiOkResponse({ type: ProductVariant })
  findOne(@Param('id') id: string) {
    return this.productVariantsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update product variant (status cannot be updated here)',
  })
  @ApiParam({ name: 'id', description: 'Product variant UUID' })
  @ApiBody({ type: UpdateProductVariantDto })
  @ApiOkResponse({ type: ProductVariant })
  update(
    @Param('id') id: string,
    @Body() updateProductVariantDto: UpdateProductVariantDto,
  ) {
    return this.productVariantsService.update(id, updateProductVariantDto);
  }

  @Patch(':id/soft-delete')
  @ApiOperation({
    summary: 'Soft delete product variant (ACTIVE -> INACTIVE)',
  })
  @ApiParam({ name: 'id', description: 'Product variant UUID' })
  @ApiOkResponse({ type: ProductVariant })
  softDelete(@Param('id') id: string) {
    return this.productVariantsService.softDelete(id);
  }

  @Delete(':id/force')
  @ApiOperation({
    summary: 'Force delete product variant permanently',
  })
  @ApiParam({ name: 'id', description: 'Product variant UUID' })
  remove(@Param('id') id: string) {
    return this.productVariantsService.remove(id);
  }
}
