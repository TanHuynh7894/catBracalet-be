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

import { CreateProductVariantDto } from './dto/create-product-variant.dto';
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