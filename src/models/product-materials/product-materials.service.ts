import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductMaterialDto } from './dto/create-product-material.dto';
import { ProductMaterial } from './entities/product-material.entity';

@Injectable()
export class ProductMaterialsService {
  constructor(
    @InjectRepository(ProductMaterial)
    private readonly productMaterialRepository: Repository<ProductMaterial>,
  ) {}

  // 1. Tạo liên kết mới (Gán vật liệu cho sản phẩm)
  async create(createProductMaterialDto: CreateProductMaterialDto) {
    const { product_id, material_id } = createProductMaterialDto;

    // Kiểm tra xem mối quan hệ này đã tồn tại trong DB chưa
    const isExist = await this.productMaterialRepository.findOne({
      where: { product_id, material_id },
    });

    if (isExist) {
      throw new BadRequestException('Vật liệu này đã được gán cho sản phẩm này rồi!');
    }

    const newMapping = this.productMaterialRepository.create(createProductMaterialDto);
    return await this.productMaterialRepository.save(newMapping);
  }

  // 2. Lấy toàn bộ danh sách liên kết trong hệ thống
  async findAll() {
    return await this.productMaterialRepository.find({
      relations: ['product', 'material'], // Lấy kèm thông tin chi tiết của cả sản phẩm và vật liệu
    });
  }

  // 3. Tìm một liên kết cụ thể dựa vào cặp ID
  async findOne(product_id: string, material_id: string) {
    const relation = await this.productMaterialRepository.findOne({
      where: { product_id, material_id },
      relations: ['product', 'material'],
    });

    if (!relation) {
      throw new NotFoundException('Không tìm thấy liên kết giữa sản phẩm và vật liệu này!');
    }

    return relation;
  }

  // 4. Xóa liên kết (Bỏ gán vật liệu khỏi sản phẩm)
  async remove(product_id: string, material_id: string) {
    const result = await this.productMaterialRepository.delete({ product_id, material_id });
    
    if (result.affected === 0) {
      throw new NotFoundException('Không tìm thấy liên kết nào phù hợp để xóa!');
    }

    return { success: true, message: 'Xóa liên kết sản phẩm và vật liệu thành công!' };
  }
}