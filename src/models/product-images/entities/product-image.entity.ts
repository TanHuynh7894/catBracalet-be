import { Check, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('product_images')
@Check(`status IN ('ACTIVE', 'INACTIVE')`)
export class ProductImage {
  @PrimaryGeneratedColumn('uuid', { name: 'image_id' })
  id: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @Column({ length: 500, name: 'image_url' })
  imageUrl: string;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;
}