import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { Material } from '../../materials/entities/material.entity';

@Entity('product_materials')
export class ProductMaterial {
  @PrimaryColumn({ type: 'uuid' })
  product_id: string;

  @PrimaryColumn({ type: 'uuid' })
  material_id: string;

  // Mối quan hệ với bảng Products
  @ManyToOne(() => Product, (product) => product.product_materials, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'product_id' })
  product: Product;

  // Mối quan hệ với bảng Materials
  @ManyToOne(() => Material, (material) => material.product_materials, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'material_id' })
  material: Material;
}
