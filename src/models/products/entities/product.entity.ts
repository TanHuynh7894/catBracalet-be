import { Check, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('products')
@Check(`status IN ('ACTIVE', 'INACTIVE')`)
export class Product {
  @PrimaryGeneratedColumn('uuid', { name: 'product_id' })
  id: string;

  @Column({ type: 'uuid', name: 'category_id', nullable: true })
  categoryId?: string;

  @Column({ type: 'uuid', name: 'material_id', nullable: true })
  materialId?: string;

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