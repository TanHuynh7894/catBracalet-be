import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ProductVariant } from '../../product-variants/entities/product-variant.entity';
import { ShopLocation } from './shop-location.entity';

@Entity('shop_inventory')
@Unique(['shopLocationId', 'variantId'])
@Check(`stock_quantity >= 0`)
export class ShopInventory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid', { name: 'shop_location_id' })
  shopLocationId: string;

  @ManyToOne(() => ShopLocation)
  @JoinColumn({ name: 'shop_location_id' })
  shopLocation: ShopLocation;

  @Column('uuid', { name: 'variant_id' })
  variantId: string;

  @ManyToOne(() => ProductVariant)
  @JoinColumn({ name: 'variant_id' })
  variant: ProductVariant;

  @Column({ type: 'int', name: 'stock_quantity', default: 0 })
  stockQuantity: number;
}
