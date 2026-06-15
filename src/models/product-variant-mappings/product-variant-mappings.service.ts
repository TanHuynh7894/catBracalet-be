import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../products/entities/product.entity';
import { ProductVariant } from '../product-variants/entities/product-variant.entity';
import { CreateProductVariantMappingDto } from './dto/create-product-variant-mapping.dto';
import { ProductVariantMapping } from './entities/product-variant-mapping.entity';

export enum ProductVariantMappingStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Injectable()
export class ProductVariantMappingsService {
  constructor(
    @InjectRepository(ProductVariantMapping)
    private readonly mappingRepository: Repository<ProductVariantMapping>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
  ) { }

  async create(
    createMappingDto: CreateProductVariantMappingDto,
  ): Promise<ProductVariantMapping> {
    await this.ensureReferencesExist(
      createMappingDto.productId,
      createMappingDto.variantId,
    );

    const existingMapping = await this.mappingRepository.findOneBy({
      productId: createMappingDto.productId,
      variantId: createMappingDto.variantId,
    });

    if (existingMapping) {
      throw new ConflictException(
        'This product and variant are already linked.',
      );
    }

    const newMapping = this.mappingRepository.create({
      ...createMappingDto,
      status: ProductVariantMappingStatus.ACTIVE,
    });

    await this.mappingRepository.save(newMapping);

    return await this.findOne(newMapping.productId, newMapping.variantId);
  }

  async findAll(): Promise<ProductVariantMapping[]> {
    return await this.mappingRepository.find({
      relations: {
        product: {
          category: true,
          // 🟢 ĐÃ SỬA: Đi qua bảng trung gian product_materials để lấy thông tin material
          product_materials: {
            material: true,
          },
        },
        variant: true,
      },
    });
  }

  async findOne(
    productId: string,
    variantId: string,
  ): Promise<ProductVariantMapping> {
    const mapping = await this.mappingRepository.findOne({
      where: { productId, variantId },
      relations: {
        product: {
          category: true,
          // 🟢 ĐÃ SỬA: Đi qua bảng trung gian product_materials để lấy thông tin material
          product_materials: {
            material: true,
          },
        },
        variant: true,
      },
    });

    if (!mapping) {
      throw new NotFoundException(
        `Mapping for product ${productId} and variant ${variantId} not found`,
      );
    }

    return mapping;
  }

  // async softDelete(
  //   productId: string,
  //   variantId: string,
  // ): Promise<ProductVariantMapping> {
  //   const mapping = await this.findOne(productId, variantId);

  //   mapping.status = ProductVariantMappingStatus.INACTIVE;

  //   await this.mappingRepository.save(mapping);

  //   return await this.findOne(productId, variantId);
  // }

  async softDelete(
    productId: string,
    variantId: string,
  ): Promise<ProductVariantMapping> {
    // 1. Tìm mapping hiện tại theo cặp Id
    const mapping = await this.findOne(productId, variantId);

    // 2. Kiểm tra trạng thái để toggle giữa ACTIVE và INACTIVE
    mapping.status = mapping.status === ProductVariantMappingStatus.INACTIVE
      ? ProductVariantMappingStatus.ACTIVE
      : ProductVariantMappingStatus.INACTIVE;

    // 3. Lưu thay đổi
    await this.mappingRepository.save(mapping);

    // 4. Trả về data mới nhất
    return await this.findOne(productId, variantId);
  }

  async remove(productId: string, variantId: string): Promise<void> {
    const mapping = await this.findOne(productId, variantId);

    await this.mappingRepository.remove(mapping);
  }

  private async ensureReferencesExist(
    productId: string,
    variantId: string,
  ): Promise<void> {
    const product = await this.productRepository.findOneBy({ id: productId });
    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    const variant = await this.productVariantRepository.findOneBy({
      id: variantId,
    });
    if (!variant) {
      throw new NotFoundException(
        `Product variant with id ${variantId} not found`,
      );
    }
  }
}
