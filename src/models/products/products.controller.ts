import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiBody,
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
import { getImageUploadOptions, buildImagePublicUrl } from '../../helpers/upload-image.helper';

/**
 * Hàm helper dùng để xử lý dữ liệu materialIds truyền lên từ multipart/form-data.
 * Do Form-data biến Array thành String, hàm này giúp parse ngược lại thành Array chuẩn để không lỗi Validation.
 */
function parseMultipartArray(value: any): string[] {
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch {
      return value.split(',').map((val) => val.trim());
    }
  }
  return value;
}

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a product' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', example: 'P', description: 'Bắt buộc là P (PRODUCT) để Multer phân loại thư mục' },
        productName: { type: 'string', example: 'Cat Bracelet Premium' },
        basePrice: { type: 'number', example: 199000 },
        categoryId: { type: 'string', example: '6f9c4b1a-b5c2-4d96-9a2f-4b327cf0d917' },
        description: { type: 'string', example: 'Handmade bracelet for cat lovers' },
        materialIds: { type: 'array', items: { type: 'string' }, example: ['8fe51f4d-e889-4fda-86ad-d1d3cae6d6a9'] },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'Ảnh thumbnail của sản phẩm',
        },
      },
      required: ['type', 'productName', 'basePrice'],
    },
  })
  @ApiCreatedResponse({ type: Product })
  @UseInterceptors(FileInterceptor('thumbnail', getImageUploadOptions()))
  create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Ép kiểu dữ liệu đề phòng Form-data gửi materialIds sai cấu trúc mảng
    if (createProductDto.materialIds) {
      createProductDto.materialIds = parseMultipartArray(createProductDto.materialIds);
    }

    // Nếu có file upload, biến đổi đường dẫn tuyệt đối thành tương đối để lưu vào DB
    if (file) {
      createProductDto.thumbnail = buildImagePublicUrl(file.path);
    }
    
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
  findOne(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update product (status cannot be updated here)',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        type: { type: 'string', example: 'P', description: 'Bắt buộc là P (PRODUCT) nếu có cập nhật ảnh' },
        productName: { type: 'string', example: 'Cat Bracelet Premium Super' },
        basePrice: { type: 'number', example: 219000 },
        categoryId: { type: 'string', example: '6f9c4b1a-b5c2-4d96-9a2f-4b327cf0d917' },
        description: { type: 'string', example: 'Handmade bracelet for cat lovers - Updated' },
        materialIds: { type: 'array', items: { type: 'string' } },
        thumbnail: {
          type: 'string',
          format: 'binary',
          description: 'Ảnh thumbnail mới (để trống nếu giữ nguyên ảnh cũ)',
        },
      },
    },
  })
  @ApiOkResponse({ type: Product })
  @UseInterceptors(FileInterceptor('thumbnail', getImageUploadOptions()))
  update(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string, 
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    // Ép kiểu dữ liệu đề phòng Form-data gửi materialIds sai cấu trúc mảng khi update
    if (updateProductDto.materialIds) {
      updateProductDto.materialIds = parseMultipartArray(updateProductDto.materialIds);
    }

    // Nếu người dùng chọn upload file ảnh mới khi cập nhật
    if (file) {
      updateProductDto.thumbnail = buildImagePublicUrl(file.path);
    }

    return this.productsService.update(id, updateProductDto);
  }

  @Patch(':id/soft-delete')
  @ApiOperation({
    summary: 'Soft delete product (ACTIVE -> INACTIVE)',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  @ApiOkResponse({ type: Product })
  softDelete(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.productsService.softDelete(id);
  }

  @Delete(':id/force')
  @ApiOperation({
    summary: 'Force delete product permanently',
  })
  @ApiParam({ name: 'id', description: 'Product UUID' })
  remove(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.productsService.remove(id);
  }
}