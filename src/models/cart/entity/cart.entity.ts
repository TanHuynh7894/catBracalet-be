import { Column, Entity, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { CartItem } from '../../cart_items/entities/cart_items.entity';

@Entity('carts')
export class Cart {
    @PrimaryGeneratedColumn('uuid', { name: 'cart_id' })
    id: string;
    @Column('uuid', { name: 'user_id' })
    userId: string;
    @Column('timestamp', { name: 'created_at' })
    createdAt: Date;

    @OneToMany(() => CartItem, (cartItem) => cartItem.cart)
    items: CartItem[];
}