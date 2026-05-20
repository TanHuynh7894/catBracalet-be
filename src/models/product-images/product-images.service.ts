import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import {
  CreateProductImageDto,
  ProductImageStatus,
} from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { ProductImage } from './entities/product-image.entity';

@Injectable()
export class ProductImagesService {
  constructor(
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
  ) {}

  async create(
    createProductImageDto: CreateProductImageDto,
  ): Promise<ProductImage> {
    const newProductImage = this.productImageRepository.create({
      ...createProductImageDto,
      status: ProductImageStatus.ACTIVE,
    });

    return await this.productImageRepository.save(newProductImage);
  }

  async findAll(): Promise<ProductImage[]> {
    return await this.productImageRepository.find();
  }

  async findOne(id: string): Promise<ProductImage> {
    const productImage = await this.productImageRepository.findOneBy({ id });

    if (!productImage) {
      throw new NotFoundException(
        `Product image with id ${id} not found`,
      );
    }

    return productImage;
  }

  async update(
    id: string,
    updateProductImageDto: UpdateProductImageDto,
  ): Promise<ProductImage> {
    const productImage = await this.findOne(id);

    if ('status' in updateProductImageDto) {
      throw new BadRequestException(
        'Status cannot be updated in this API',
      );
    }

    this.productImageRepository.merge(productImage, updateProductImageDto);

    return await this.productImageRepository.save(productImage);
  }

  async softDelete(id: string): Promise<ProductImage> {
    const productImage = await this.findOne(id);

    productImage.status = ProductImageStatus.INACTIVE;

    return await this.productImageRepository.save(productImage);
  }

  async remove(id: string): Promise<void> {
    const productImage = await this.findOne(id);

    await this.productImageRepository.remove(productImage);
  }
}