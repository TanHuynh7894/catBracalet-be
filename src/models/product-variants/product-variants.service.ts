import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  CreateProductVariantDto,
  ProductVariantStatus,
} from './dto/create-product-variant.dto';
import { UpdateProductVariantDto } from './dto/update-product-variant.dto';
import { ProductVariant } from './entities/product-variant.entity';

@Injectable()
export class ProductVariantsService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
  ) {}

  async create(
    createProductVariantDto: CreateProductVariantDto,
  ): Promise<ProductVariant> {
    const stockQuantity = createProductVariantDto.stockQuantity ?? 0;
    const extraPrice = createProductVariantDto.extraPrice ?? 0;

    this.validateVariantBusinessRules(stockQuantity, extraPrice);

    const newProductVariant = this.productVariantRepository.create({
      ...createProductVariantDto,
      stockQuantity,
      extraPrice,
      status: ProductVariantStatus.ACTIVE,
    });

    return await this.productVariantRepository.save(newProductVariant);
  }

  async findAll(): Promise<ProductVariant[]> {
    const variants = await this.productVariantRepository.find({
      relations: {
        productVariantMappings: {
          product: {
            category: true,
            material: true,
            productImages: true,
          },
        },
      },
    });

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
      .leftJoinAndSelect('product.material', 'material')
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
            material: true,
            productImages: true,
          },
        },
      },
    });

    if (!productVariant) {
      throw new NotFoundException(
        `Product variant with id ${id} not found`,
      );
    }

    return this.mapVariantImageUrls(productVariant);
  }

  async update(
    id: string,
    updateProductVariantDto: UpdateProductVariantDto,
  ): Promise<ProductVariant> {
    const productVariant = await this.findOneEntity(id);

    if ('status' in updateProductVariantDto) {
      throw new BadRequestException(
        'Status cannot be updated in this API',
      );
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
    const productVariant = await this.productVariantRepository.findOneBy({ id });

    if (!productVariant) {
      throw new NotFoundException(
        `Product variant with id ${id} not found`,
      );
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
    const baseUrl = (this.configService.get<string>('url_base_BE') || '').replace(
      /\/$/,
      '',
    );

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