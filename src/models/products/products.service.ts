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

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    const newProduct = this.productRepository.create({
      ...createProductDto,
      status: ProductStatus.ACTIVE,
    });

    return await this.productRepository.save(newProduct);
  }

  async findAll(): Promise<Product[]> {
    return await this.productRepository.find();
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
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOneBy({ id });

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

    this.productRepository.merge(product, updateProductDto);

    return await this.productRepository.save(product);
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
