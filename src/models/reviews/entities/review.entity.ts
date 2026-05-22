import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from '../../products/entities/product.entity';
import { User } from '../../user/entities/user.entity';

@Entity('reviews')
@Check(`status IN ('ACTIVE', 'INACTIVE')`)
@Check(`rating IS NULL OR rating BETWEEN 1 AND 5`)
export class Review {
  @PrimaryGeneratedColumn('uuid', { name: 'review_id' })
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user?: User;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product?: Product;

  @Column({ type: 'int', nullable: true })
  rating?: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ length: 20, default: 'ACTIVE' })
  status: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
