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

@Entity('wishlists')
@Check(`quantity > 0`)
export class Wishlist {
  @PrimaryGeneratedColumn('uuid', { name: 'wishlist_id' })
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @Column({ type: 'int', default: 1 })
  quantity: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'user_id', referencedColumnName: 'id' })
  user: User;

  @ManyToOne(() => Product, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'product_id', referencedColumnName: 'id' })
  product: Product;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
