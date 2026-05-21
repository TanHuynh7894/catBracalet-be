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
import { CreateProductVariantMappingDto } from './dto/create-product-variant-mapping.dto';
import { ProductVariantMapping } from './entities/product-variant-mapping.entity';
import { ProductVariantMappingsService } from './product-variant-mappings.service';

@ApiTags('Product Variant Mappings')
@Controller('product-variant-mappings')
export class ProductVariantMappingsController {
  constructor(
    private readonly productVariantMappingsService: ProductVariantMappingsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Link a product with a variant' })
  @ApiCreatedResponse({ type: ProductVariantMapping })
  create(@Body() createMappingDto: CreateProductVariantMappingDto) {
    return this.productVariantMappingsService.create(createMappingDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all product-variant mappings' })
  @ApiOkResponse({ type: ProductVariantMapping, isArray: true })
  findAll() {
    return this.productVariantMappingsService.findAll();
  }

  @Get(':productId/:variantId')
  @ApiOperation({ summary: 'Get a product-variant mapping by composite key' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiParam({ name: 'variantId', description: 'Variant UUID' })
  @ApiOkResponse({ type: ProductVariantMapping })
  findOne(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.productVariantMappingsService.findOne(productId, variantId);
  }

  @Patch(':productId/:variantId/soft-delete')
  @ApiOperation({ summary: 'Soft delete a product-variant mapping' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiParam({ name: 'variantId', description: 'Variant UUID' })
  @ApiOkResponse({ type: ProductVariantMapping })
  softDelete(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.productVariantMappingsService.softDelete(productId, variantId);
  }

  @Delete(':productId/:variantId/force')
  @ApiOperation({ summary: 'Force delete a product-variant mapping' })
  @ApiParam({ name: 'productId', description: 'Product UUID' })
  @ApiParam({ name: 'variantId', description: 'Variant UUID' })
  remove(
    @Param('productId') productId: string,
    @Param('variantId') variantId: string,
  ) {
    return this.productVariantMappingsService.remove(productId, variantId);
  }
}
