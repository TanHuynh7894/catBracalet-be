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
import { Material } from '../../materials/entities/material.entity';
import { ProductImage } from '../../product-images/entities/product-image.entity';
import { ProductVariantMapping } from '../../product-variant-mappings/entities/product-variant-mapping.entity';

@Entity('products')
@Check(`status IN ('ACTIVE', 'INACTIVE')`)
export class Product {
  @PrimaryGeneratedColumn('uuid', { name: 'product_id' })
  id: string;

  @Column({ type: 'uuid', name: 'category_id', nullable: true })
  categoryId?: string;

  @Column({ type: 'uuid', name: 'material_id', nullable: true })
  materialId?: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id', referencedColumnName: 'id' })
  category?: Category;

  @ManyToOne(() => Material, { nullable: true })
  @JoinColumn({ name: 'material_id', referencedColumnName: 'id' })
  material?: Material;

  @OneToMany(() => ProductImage, (productImage) => productImage.product)
  productImages?: ProductImage[];

  @OneToMany(
    () => ProductVariantMapping,
    (productVariantMapping) => productVariantMapping.product,
  )
  productVariantMappings?: ProductVariantMapping[];

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
