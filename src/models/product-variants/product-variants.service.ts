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
import { Product } from '../products/entities/product.entity';
import { ProductImage } from '../product-images/entities/product-image.entity';

@Injectable()
export class ProductVariantsService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
  ) {}

  async create(
    createProductVariantDto: CreateProductVariantDto,
  ): Promise<ProductVariant> {
    const stockQuantity = createProductVariantDto.stockQuantity ?? 0;
    const extraPrice = createProductVariantDto.extraPrice ?? 0;

    await this.validateVariantBusinessRules(
      createProductVariantDto.productId,
      stockQuantity,
      extraPrice,
    );

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
        product: {
          category: true,
          material: true,
          productImages: true,
        },
      },
    });

    return variants.map((variant) => this.mapVariantImageUrls(variant));
  }

  async findOne(id: string): Promise<ProductVariant> {
    const productVariant = await this.productVariantRepository.findOne({
      where: { id },
      relations: {
        product: {
          category: true,
          material: true,
          productImages: true,
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

    const productId = updateProductVariantDto.productId ?? productVariant.productId;
    const stockQuantity =
      updateProductVariantDto.stockQuantity ?? productVariant.stockQuantity;
    const extraPrice =
      updateProductVariantDto.extraPrice ?? Number(productVariant.extraPrice);

    await this.validateVariantBusinessRules(
      productId,
      stockQuantity,
      extraPrice,
    );

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

  private async validateVariantBusinessRules(
    productId: string,
    stockQuantity: number,
    extraPrice: number,
  ): Promise<void> {
    if (stockQuantity < 0) {
      throw new BadRequestException(
        'stockQuantity must be greater than or equal to 0.',
      );
    }

    const product = await this.productRepository.findOneBy({ id: productId });

    if (!product) {
      throw new NotFoundException(
        `Product with id ${productId} not found`,
      );
    }

    const basePrice = Number(product.basePrice);
    if (Number(extraPrice) < basePrice) {
      throw new BadRequestException(
        `extraPrice must be greater than or equal to product basePrice. basePrice=${basePrice}, receivedExtraPrice=${Number(extraPrice)}`,
      );
    }
  }

  private mapVariantImageUrls(variant: ProductVariant): ProductVariant {
    const baseUrl = (this.configService.get<string>('url_base_BE') || '').replace(
      /\/$/,
      '',
    );

    if (!variant.product?.productImages?.length || !baseUrl) {
      return variant;
    }

    return {
      ...variant,
      product: {
        ...variant.product,
        productImages: variant.product.productImages.map((image) => {
          if (/^https?:\/\//i.test(image.imageUrl)) {
            return image;
          }

          return {
            ...image,
            imageUrl: `${baseUrl}${image.imageUrl}`,
          };
        }),
      },
    } as ProductVariant;
  }
}