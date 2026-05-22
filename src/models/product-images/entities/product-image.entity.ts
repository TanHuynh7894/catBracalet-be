import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';

@Entity('product_images')
@Check(`status IN ('ACTIVE', 'INACTIVE')`)
export class ProductImage {
  @PrimaryGeneratedColumn('uuid', { name: 'image_id' })
  id: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @ManyToOne(() => Product, { nullable: false })
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product;

  @Column({ length: 500, name: 'image_url' })
  imageUrl: string;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;
}
