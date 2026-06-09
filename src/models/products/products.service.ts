import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

import { CreateProductDto, ProductStatus } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { Product } from './entities/product.entity';
import { ProductMaterial } from '../product-materials/entities/product-material.entity';

import { FilterProductDto } from './dto/FilterProduct.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductMaterial)
    private readonly productMaterialRepository: Repository<ProductMaterial>,

    // Inject ConfigService để lấy giá trị biến môi trường (.env)
    private readonly configService: ConfigService,
  ) { }

  /**
   * Helper function xuất ra: URL_BASE_BE + THUMBNAIL GỐC
   */
  private formatProductImageUrl(product: Product): Product {
    if (product && product.thumbnail) {
      // Đọc trực tiếp từ configService mỗi khi hàm chạy để đảm bảo không bị cache chuỗi rỗng
      const baseUrl = this.configService.get<string>('url_base_BE') || 'http://localhost:3000';

      console.log('--- LOG DEBUG ---');
      console.log('KEY URL_BASE_BE ĐỌC ĐƯỢC:', baseUrl);
      console.log('THUMBNAIL GỐC TRONG DB:', product.thumbnail);

      // Làm sạch các dấu gạch chéo dư thừa trước khi nối chuỗi
      const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      const cleanThumbnail = product.thumbnail.startsWith('/') ? product.thumbnail : `/${product.thumbnail}`;

      // Gán đè kết quả nối chuỗi trực tiếp
      product.thumbnail = `${cleanBaseUrl}${cleanThumbnail}`;

      console.log('KẾT QUẢ SAU KHI NỐI URL:', product.thumbnail);
      console.log('-----------------');
    }
    return product;
  }

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
    const products = await this.productRepository.find({
      relations: ['product_materials', 'product_materials.material'],
    });

    return products.map((product) => this.formatProductImageUrl(product));
  }

  async findByName(name: string): Promise<Product[]> {
    const keyword = name?.trim();

    if (!keyword) {
      return [];
    }

    const products = await this.productRepository.find({
      where: {
        productName: ILike(`%${keyword}%`),
      },
      order: {
        productName: 'ASC',
      },
      relations: ['product_materials', 'product_materials.material'],
    });

    return products.map((product) => this.formatProductImageUrl(product));
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: ['product_materials', 'product_materials.material'],
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    return this.formatProductImageUrl(product);
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    if ('status' in updateProductDto) {
      throw new BadRequestException('Status cannot be updated in this API');
    }

    const { materialIds, ...productData } = updateProductDto;

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

  // async softDelete(id: string): Promise<Product> {
  //   const product = await this.productRepository.findOne({ where: { id } });

  //   if (!product) {
  //     throw new NotFoundException(`Product with id ${id} not found`);
  //   }

  //   product.status = ProductStatus.INACTIVE;
  //   const savedProduct = await this.productRepository.save(product);

  //   return this.findOne(savedProduct.id);
  // }

  async softDelete(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    // Toggle trạng thái giữa ACTIVE và INACTIVE
    product.status = product.status === ProductStatus.INACTIVE
      ? ProductStatus.ACTIVE
      : ProductStatus.INACTIVE;

    const savedProduct = await this.productRepository.save(product);

    return this.findOne(savedProduct.id);
  }

  async remove(id: string): Promise<void> {
    const product = await this.productRepository.findOne({ where: { id } });

    if (!product) {
      throw new NotFoundException(`Product with id ${id} not found`);
    }

    await this.productRepository.remove(product);
  }

  async filterProducts(filterDto: FilterProductDto): Promise<Product[]> {
    // Thêm stoneColor vào lúc destructuring
    const { color, stoneColor, stoneType, size, minPrice, maxPrice } = filterDto;

    const query = this.productRepository.createQueryBuilder('product')
      .leftJoinAndSelect('product.product_materials', 'product_materials')
      .leftJoinAndSelect('product_materials.material', 'material')
      .where('product.status = :status', { status: ProductStatus.ACTIVE });

    // 1. Lọc Màu sắc và Màu đá (Gom chung lại dùng IN để tránh xung đột AND)
    const searchColors = [];
    if (color) searchColors.push(color);
    if (stoneColor) searchColors.push(stoneColor);

    if (searchColors.length > 0) {
      query.andWhere('material.color IN (:...searchColors)', { searchColors });
    }

    // 2. Lọc Loại đá (Nằm trong bảng material luôn)
    if (stoneType) {
      query.andWhere('material.materialType = :stoneType', { stoneType });
    }

    // 3. Lọc Kích cỡ (Nằm trong bảng variant)
    if (size) {
      query.innerJoin('product_variant_mapping', 'mapping', 'mapping.product_id = product.id')
        .innerJoin('product_variants', 'variant', 'variant.id = mapping.variant_id')
        .andWhere('variant.size = :size', { size });
    }

    // 4. Lọc giá tiền (Nằm ở bảng Product)
    if (minPrice !== undefined) {
      query.andWhere('product.basePrice >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      query.andWhere('product.basePrice <= :maxPrice', { maxPrice });
    }

    const products = await query.getMany();

    return products.map((product) => this.formatProductImageUrl(product));
  }
}