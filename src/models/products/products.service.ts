import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';

import { CreateProductDto, ProductStatus } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductMaterial } from '../product-materials/entities/product-material.entity';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductMaterial)
    private readonly productMaterialRepository: Repository<ProductMaterial>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const { materialIds, ...productData } = createProductDto;

    const newProduct = this.productRepository.create({
      ...productData,
      status: ProductStatus.ACTIVE,
    });

    const savedProduct = await this.productRepository.save(newProduct);

    if (materialIds && materialIds.length > 0) {
      const productMaterials = materialIds.map((materialId) =>
        this.productMaterialRepository.create({
          product_id: savedProduct.id,
          material_id: materialId,
        }),
      );
      await this.productMaterialRepository.save(productMaterials);
    }

    return this.findOne(savedProduct.id);
  }

  async findAll(): Promise<Product[]> {
    return await this.productRepository.find({
      relations: ['product_materials', 'product_materials.material'],
    });
  }

  async findByName(name: string): Promise<Product[]> {
    const keyword = name.trim();

    if (!keyword) {
      return [];
    }

    return await this.productRepository.find({
      where: {
        productName: ILike(`%${keyword}%`),
      },
      order: {
        productName: 'ASC',
      },
      relations: ['product_materials', 'product_materials.material'],
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['product_materials', 'product_materials.material'],
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    if ('status' in updateProductDto) {
      throw new BadRequestException('Status cannot be updated in this API');
    }

    const { materialIds, ...productData } = updateProductDto as any;

    this.productRepository.merge(product, productData);
    await this.productRepository.save(product);

    if (materialIds) {
      await this.productMaterialRepository.delete({ product_id: id });

      if (materialIds.length > 0) {
        const productMaterials = materialIds.map((materialId) =>
          this.productMaterialRepository.create({
            product_id: id,
            material_id: materialId,
          }),
        );
        await this.productMaterialRepository.save(productMaterials);
      }
    }

    return this.findOne(id);
  }

  async softDelete(id: string): Promise<Product> {
    const product = await this.findOne(id);

    product.status = ProductStatus.INACTIVE;

    return await this.productRepository.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);

    await this.productRepository.remove(product);
  }
}
