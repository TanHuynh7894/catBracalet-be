import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('carts')
export class Cart {
    @PrimaryGeneratedColumn('uuid', { name: 'cart_id' })
    id: string;
    @Column('uuid', { name: 'user_id' })
    userId: string;
    @Column('timestamp', { name: 'created_at' })
    createdAt: Date;
}