import {
  Check,
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductMaterial } from '../../product-materials/entities/product-material.entity';

@Entity('materials')
@Check(`status IN ('ACTIVE', 'INACTIVE')`)
export class Material {
  @PrimaryGeneratedColumn('uuid', { name: 'material_id' })
  id: string;

  @OneToMany(
    () => ProductMaterial,
    (productMaterial) => productMaterial.material,
  )
  product_materials: ProductMaterial[];

  @Column({ length: 255, name: 'material_name' })
  materialName: string;

  @Column({ length: 50, name: 'material_type', nullable: true })
  materialType?: string;

  @Column({ length: 100, nullable: true })
  color?: string;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;
}
