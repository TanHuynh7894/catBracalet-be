import { Check, Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('categories')
@Check(`status IN ('ACTIVE', 'INACTIVE')`)
export class Category {
  @PrimaryGeneratedColumn('uuid', { name: 'category_id' })
  id: string;

  @Column({ length: 255, name: 'category_name' })
  categoryName: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;
}