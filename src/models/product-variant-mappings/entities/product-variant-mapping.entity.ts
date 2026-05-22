import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { ProductVariant } from '../../product-variants/entities/product-variant.entity';

@Entity('product_variant_mapping')
@Check(`status IN ('ACTIVE', 'INACTIVE')`)
export class ProductVariantMapping {
  @PrimaryColumn({ type: 'uuid', name: 'product_id' })
  productId: string;

  @PrimaryColumn({ type: 'uuid', name: 'variant_id' })
  variantId: string;

  @ManyToOne(() => Product, (product) => product.productVariantMappings, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product;

  @ManyToOne(
    () => ProductVariant,
    (variant) => variant.productVariantMappings,
    {
      onDelete: 'CASCADE',
      nullable: false,
    },
  )
  @JoinColumn({ name: 'variant_id', referencedColumnName: 'id' })
  variant: ProductVariant;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;
}
