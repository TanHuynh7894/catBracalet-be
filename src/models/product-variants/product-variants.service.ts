// src/models/product-variants/product-variants.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ProductVariantMapping } from '../product-variant-mappings/entities/product-variant-mapping.entity';
import { Product } from '../products/entities/product.entity';

import {
  CreateProductVariantDto,
  ProductVariantStatus,
} from './dto/create-product-variant.dto';
import {
  GetProductListDto,
  ProductListSortBy,
} from './dto/get-product-list.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { ProductVariant } from './entities/product-variant.entity';

@Injectable()
export class ProductVariantsService {
  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(
    createProductVariantDto: CreateProductVariantDto,
  ): Promise<ProductVariant> {
    const { productId, ...variantInput } = createProductVariantDto;
    const stockQuantity = createProductVariantDto.stockQuantity ?? 0;
    const extraPrice = createProductVariantDto.extraPrice ?? 0;

    this.validateVariantBusinessRules(stockQuantity, extraPrice);

    const product = await this.productRepository.findOneBy({ id: productId });
    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    // Chạy Transaction bảo đảm an toàn dữ liệu cho cả 2 bảng
    const fullCreatedVariant = await this.dataSource.transaction(async (manager) => {
      const variantRepository = manager.getRepository(ProductVariant);
      const mappingRepository = manager.getRepository(ProductVariantMapping);

      const newProductVariant = variantRepository.create({
        ...variantInput,
        stockQuantity,
        extraPrice,
        status: ProductVariantStatus.ACTIVE,
      });

      const savedVariant = await variantRepository.save(newProductVariant);

      // 🟢 ĐÃ FIX CHUẨN: Sử dụng variantId tương thích chính xác với Entity ProductVariantMapping của ông
      const newMapping = mappingRepository.create({
        productId,
        variantId: savedVariant.id, 
        status: 'ACTIVE',
      });

      await mappingRepository.save(newMapping);

      // Truy vấn nạp đầy đủ cấu trúc quan hệ dữ liệu ngay trong transaction
      return await variantRepository.findOne({
        where: { id: savedVariant.id },
        relations: {
          productVariantMappings: {
            product: {
              category: true,
              productImages: true,
              product_materials: {
                material: true,
              },
            },
          },
        },
      });
    });

    if (!fullCreatedVariant) {
      throw new NotFoundException(`Lỗi hệ thống: Không thể tìm thấy dữ liệu Variant vừa tạo`);
    }

    // Đổ baseUrl vào đường dẫn ảnh tương đối và trả về cho Client
    return this.mapVariantImageUrls(fullCreatedVariant);
  }

  async findAll(): Promise<ProductVariant[]> {
    const variants = await this.productVariantRepository.find({
      relations: {
        productVariantMappings: {
          product: {
            category: true,
            productImages: true,
            product_materials: {
              material: true,
            },
          },
        },
      },
    });

    return variants.map((variant) => this.mapVariantImageUrls(variant));
  }

  async getProductList(params: GetProductListDto): Promise<ProductVariant[]> {
    const {
      keyword,
      categoryId,
      minPrice,
      maxPrice,
      color,
      size,
      rating,
      sortBy,
    } = params;

    if (
      minPrice !== undefined &&
      maxPrice !== undefined &&
      minPrice > maxPrice
    ) {
      throw new BadRequestException(
        'minPrice cannot be greater than maxPrice.',
      );
    }

    const query = this.productVariantRepository
      .createQueryBuilder('variant')
      .leftJoinAndSelect('variant.productVariantMappings', 'mapping')
      .leftJoinAndSelect('mapping.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.product_materials', 'product_material')
      .leftJoinAndSelect('product_material.material', 'material')
      .leftJoinAndSelect('product.productImages', 'productImage')
      .where('variant.status = :variantStatus', {
        variantStatus: ProductVariantStatus.ACTIVE,
      })
      .andWhere('mapping.status = :mappingStatus', {
        mappingStatus: 'ACTIVE',
      })
      .andWhere('product.status = :productStatus', {
        productStatus: 'ACTIVE',
      })
      .distinct(true);

    if (keyword?.trim()) {
      query.andWhere('product.productName ILIKE :keyword', {
        keyword: `%${keyword.trim()}%`,
      });
    }

    if (categoryId) {
      query.andWhere('product.categoryId = :categoryId', {
        categoryId,
      });
    }

    if (color?.trim()) {
      query.andWhere('variant.color ILIKE :color', {
        color: `%${color.trim()}%`,
      });
    }

    if (size?.trim()) {
      query.andWhere('variant.size ILIKE :size', {
        size: `%${size.trim()}%`,
      });
    }

    if (minPrice !== undefined) {
      query.andWhere(
        '(COALESCE(product.base_price, 0) + COALESCE(variant.extra_price, 0)) >= :minPrice',
        { minPrice },
      );
    }

    if (maxPrice !== undefined) {
      query.andWhere(
        '(COALESCE(product.base_price, 0) + COALESCE(variant.extra_price, 0)) <= :maxPrice',
        { maxPrice },
      );
    }

    if (rating !== undefined) {
      query.andWhere(
        `(SELECT COALESCE(AVG(rv.rating), 0)
          FROM reviews rv
          WHERE rv.product_id = product.product_id
            AND rv.status = 'ACTIVE') >= :rating`,
        { rating },
      );
    }

    switch (sortBy) {
      case ProductListSortBy.PRICE_ASC:
        query.orderBy(
          '(COALESCE(product.base_price, 0) + COALESCE(variant.extra_price, 0))',
          'ASC',
        );
        break;
      case ProductListSortBy.PRICE_DESC:
        query.orderBy(
          '(COALESCE(product.base_price, 0) + COALESCE(variant.extra_price, 0))',
          'DESC',
        );
        break;
      case ProductListSortBy.RATING_DESC:
        query.orderBy(
          `(SELECT COALESCE(AVG(rv.rating), 0)
            FROM reviews rv
            WHERE rv.product_id = product.product_id
              AND rv.status = 'ACTIVE')`,
          'DESC',
        );
        break;
      case ProductListSortBy.NEWEST:
      default:
        query.orderBy('mapping.createdAt', 'DESC');
        break;
    }

    const variants = await query.getMany();

    return variants.map((variant) => this.mapVariantImageUrls(variant));
  }

  async findByName(name: string): Promise<ProductVariant[]> {
    const keyword = name.trim();

    if (!keyword) {
      return [];
    }

    const variants = await this.productVariantRepository
      .createQueryBuilder('variant')
      .leftJoinAndSelect('variant.productVariantMappings', 'mapping')
      .leftJoinAndSelect('mapping.product', 'product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.product_materials', 'product_material')
      .leftJoinAndSelect('product_material.material', 'material')
      .leftJoinAndSelect('product.productImages', 'productImage')
      .where('product.productName ILIKE :keyword', {
        keyword: `%${keyword}%`,
      })
      .distinct(true)
      .orderBy('variant.sku', 'ASC')
      .getMany();

    return variants.map((variant) => this.mapVariantImageUrls(variant));
  }

  async findOne(id: string): Promise<ProductVariant> {
    const productVariant = await this.productVariantRepository.findOne({
      where: { id },
      relations: {
        productVariantMappings: {
          product: {
            category: true,
            productImages: true,
            product_materials: {
              material: true,
            },
          },
        },
      },
    });

    if (!productVariant) {
      throw new NotFoundException(`Product variant with id ${id} not found`);
    }

    return this.mapVariantImageUrls(productVariant);
  }

  async update(
    id: string,
    updateProductVariantDto: UpdateProductVariantDto,
  ): Promise<ProductVariant> {
    const productVariant = await this.findOneEntity(id);

    if ('status' in updateProductVariantDto) {
      throw new BadRequestException('Status cannot be updated in this API');
    }

    if ('productId' in updateProductVariantDto) {
      throw new BadRequestException('productId cannot be updated in this API');
    }

    const stockQuantity =
      updateProductVariantDto.stockQuantity ?? productVariant.stockQuantity;
    const extraPrice =
      updateProductVariantDto.extraPrice ?? Number(productVariant.extraPrice);

    this.validateVariantBusinessRules(stockQuantity, extraPrice);

    this.productVariantRepository.merge(
      productVariant,
      updateProductVariantDto,
    );

    await this.productVariantRepository.save(productVariant);

    return await this.findOne(id);
  }

  async softDelete(id: string): Promise<ProductVariant> {
    const productVariant = await this.findOneEntity(id);

    productVariant.status = ProductVariantStatus.INACTIVE;

    await this.productVariantRepository.save(productVariant);

    return await this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const productVariant = await this.findOneEntity(id);

    await this.productVariantRepository.remove(productVariant);
  }

  private async findOneEntity(id: string): Promise<ProductVariant> {
    const productVariant = await this.productVariantRepository.findOneBy({
      id,
    });

    if (!productVariant) {
      throw new NotFoundException(`Product variant with id ${id} not found`);
    }

    return productVariant;
  }

  private validateVariantBusinessRules(
    stockQuantity: number,
    extraPrice: number,
  ): void {
    if (stockQuantity < 0) {
      throw new BadRequestException(
        'stockQuantity must be greater than or equal to 0.',
      );
    }

    if (Number(extraPrice) < 0) {
      throw new BadRequestException(
        'extraPrice must be greater than or equal to 0.',
      );
    }
  }

  private mapVariantImageUrls(variant: ProductVariant): ProductVariant {
    const baseUrl = (
      this.configService.get<string>('url_base_BE') || ''
    ).replace(/\/$/, '');

    if (!variant.productVariantMappings?.length || !baseUrl) {
      return variant;
    }

    return {
      ...variant,
      productVariantMappings: variant.productVariantMappings.map((mapping) => {
        const product = mapping.product;

        if (!product?.productImages?.length) {
          return mapping;
        }

        return {
          ...mapping,
          product: {
            ...product,
            productImages: product.productImages.map((image) => {
              if (/^https?:\/\//i.test(image.imageUrl)) {
                return image;
              }

              return {
                ...image,
                imageUrl: `${baseUrl}${image.imageUrl}`,
              };
            }),
          },
        };
      }),
    } as ProductVariant;
  }
}