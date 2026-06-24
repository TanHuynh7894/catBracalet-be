import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { buildImagePublicUrl } from '../../helpers/upload-image.helper';

import {
  CreateProductImageDto,
  ProductImageStatus,
} from './dto/create-product-image.dto';
import { UpdateProductImageDto } from './dto/update-product-image.dto';
import { ProductImage } from './entities/product-image.entity';

@Injectable()
export class ProductImagesService {
  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(ProductImage)
    private readonly productImageRepository: Repository<ProductImage>,
  ) {}

  async create(
    createProductImageDto: CreateProductImageDto,
    file: Express.Multer.File,
  ): Promise<ProductImage> {
    if (!file) {
      throw new BadRequestException('Image file is required.');
    }

    const imageUrl = buildImagePublicUrl(file.path);

    const newProductImage = this.productImageRepository.create({
      productId: createProductImageDto.productId,
      imageUrl,
      status: ProductImageStatus.ACTIVE,
    });

    const savedProductImage =
      await this.productImageRepository.save(newProductImage);

    return this.toPublicImageUrl(savedProductImage);
  }

  async findAll(): Promise<ProductImage[]> {
    const productImages = await this.productImageRepository.find();

    return productImages.map((productImage) =>
      this.toPublicImageUrl(productImage),
    );
  }

  async findOne(id: string): Promise<ProductImage> {
    const productImage = await this.findOneEntity(id);

    return this.toPublicImageUrl(productImage);
  }

  private async findOneEntity(id: string): Promise<ProductImage> {
    const productImage = await this.productImageRepository.findOneBy({ id });

    if (!productImage) {
      throw new NotFoundException(`Product image with id ${id} not found`);
    }

    return productImage;
  }

  private toPublicImageUrl(productImage: ProductImage): ProductImage {
    const baseUrl = (
      this.configService.get<string>('url_base_BE') || ''
    ).replace(/\/$/, '');

    if (!baseUrl || /^https?:\/\//i.test(productImage.imageUrl)) {
      return productImage;
    }

    return {
      ...productImage,
      imageUrl: `${baseUrl}${productImage.imageUrl}`,
    };
  }

  async update(
    id: string,
    updateProductImageDto: UpdateProductImageDto,
  ): Promise<ProductImage> {
    const productImage = await this.findOneEntity(id);

    if ('status' in updateProductImageDto) {
      throw new BadRequestException('Status cannot be updated in this API');
    }

    this.productImageRepository.merge(productImage, updateProductImageDto);

    const updatedProductImage =
      await this.productImageRepository.save(productImage);

    return this.toPublicImageUrl(updatedProductImage);
  }

  // async softDelete(id: string): Promise<ProductImage> {
  //   const productImage = await this.findOneEntity(id);

  //   productImage.status = ProductImageStatus.INACTIVE;

  //   const updatedProductImage =
  //     await this.productImageRepository.save(productImage);

  //   return this.toPublicImageUrl(updatedProductImage);
  // }

  async softDelete(id: string): Promise<ProductImage> {
    const productImage = await this.findOneEntity(id);

    productImage.status =
      productImage.status === ProductImageStatus.INACTIVE
        ? ProductImageStatus.ACTIVE
        : ProductImageStatus.INACTIVE;

    // 3. Lưu vào database
    const updatedProductImage =
      await this.productImageRepository.save(productImage);

    return this.toPublicImageUrl(updatedProductImage);
  }

  async remove(id: string): Promise<void> {
    const productImage = await this.findOneEntity(id);

    await this.productImageRepository.remove(productImage);
  }
}
