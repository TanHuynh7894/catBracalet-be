import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('carts')
export class Cart {
  @PrimaryGeneratedColumn('uuid', { name: 'cart_id' })
  id: string;

  @Column({ type: 'uuid', name: 'user_id' })
  userId: string;

  @CreateDateColumn({ type: 'timestamp', name: 'created_at' })
  createdAt: Date;
}
