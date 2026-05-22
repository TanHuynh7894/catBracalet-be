import { Check, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('materials')
@Check(`status IN ('ACTIVE', 'INACTIVE')`)
export class Material {
  @PrimaryGeneratedColumn('uuid', { name: 'material_id' })
  id: string;

  @Column({ length: 255, name: 'material_name' })
  materialName: string;

  @Column({ length: 100, name: 'material_type', nullable: true })
  materialType?: string;

  @Column({ length: 100, nullable: true })
  color?: string;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;
}
