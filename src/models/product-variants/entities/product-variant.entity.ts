import {
  Check,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductVariantMapping } from '../../product-variant-mappings/entities/product-variant-mapping.entity';

@Entity('product_variants')
@Check(`stock_quantity >= 0`)
@Check(`status IN ('ACTIVE', 'INACTIVE')`)
export class ProductVariant {
  @PrimaryGeneratedColumn('uuid', { name: 'variant_id' })
  id: string;

  @OneToMany(
    () => ProductVariantMapping,
    (productVariantMapping) => productVariantMapping.variant,
  )
  productVariantMappings?: ProductVariantMapping[];

  @Column({ length: 100, unique: true })
  sku: string;

  @Column({ length: 50, nullable: true })
  size?: string;

  @Column({ length: 100, nullable: true })
  color?: string;

  @Column({ type: 'int', name: 'stock_quantity', default: 0 })
  stockQuantity: number;

  @Column({
    type: 'decimal',
    precision: 15,
    scale: 2,
    name: 'extra_price',
    default: 0,
  })
  extraPrice: number;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;
}
