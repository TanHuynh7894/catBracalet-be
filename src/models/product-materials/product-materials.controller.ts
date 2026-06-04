import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ProductMaterialsService } from './product-materials.service';
import { CreateProductMaterialDto } from './dto/create-product-material.dto';

@Controller('product-materials')
export class ProductMaterialsController {
  constructor(private readonly productMaterialsService: ProductMaterialsService) {}

  // 1. API Gán vật liệu cho sản phẩm (POST: /product-materials)
  @Post()
  create(@Body() createProductMaterialDto: CreateProductMaterialDto) {
    return this.productMaterialsService.create(createProductMaterialDto);
  }

  // 2. API Lấy toàn bộ danh sách liên kết (GET: /product-materials)
  @Get()
  findAll() {
    return this.productMaterialsService.findAll();
  }

  // 3. API Tìm một liên kết cụ thể (GET: /product-materials/:productId/:materialId)
  @Get(':productId/:materialId')
  findOne(
    @Param('productId') productId: string,
    @Param('materialId') materialId: string,
  ) {
    return this.productMaterialsService.findOne(productId, materialId);
  }

  // 4. API Xóa liên kết vật liệu khỏi sản phẩm (DELETE: /product-materials/:productId/:materialId)
  @Delete(':productId/:materialId')
  remove(
    @Param('productId') productId: string,
    @Param('materialId') materialId: string,
  ) {
    return this.productMaterialsService.remove(productId, materialId);
  }
}