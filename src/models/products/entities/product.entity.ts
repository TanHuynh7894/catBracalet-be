import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Category } from '../../categories/entities/category.entity';
import { ProductImage } from '../../product-images/entities/product-image.entity';
import { ProductVariantMapping } from '../../product-variant-mappings/entities/product-variant-mapping.entity';
import { ProductMaterial } from '../../product-materials/entities/product-material.entity'; // Đã thêm import này

@Entity('products')
@Check(`status IN ('ACTIVE', 'INACTIVE')`)
export class Product {
  @PrimaryGeneratedColumn('uuid', { name: 'product_id' })
  id: string;

  @Column({ type: 'uuid', name: 'category_id', nullable: true })
  categoryId?: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id', referencedColumnName: 'id' })
  category?: Category;

  @OneToMany(() => ProductImage, (productImage) => productImage.product)
  productImages?: ProductImage[];

  @OneToMany(
    () => ProductVariantMapping,
    (productVariantMapping) => productVariantMapping.product,
  )
  productVariantMappings?: ProductVariantMapping[];

  @OneToMany(() => ProductMaterial, (productMaterial) => productMaterial.product)
  product_materials: ProductMaterial[];

  @Column({ length: 255, name: 'product_name' })
  productName: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'base_price',
  })
  basePrice: number;

  @Column({ length: 500, nullable: true })
  thumbnail?: string;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;
}