import { Column, Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Cart } from '../../cart/entity/cart.entity';

@Entity('cart_items')
export class CartItem {
    @PrimaryGeneratedColumn('uuid', { name: 'cart_item_id' })
    id: string;

    @Column('uuid', { name: 'cart_id' })
    cartId: string;

    @Column('uuid', { name: 'variant_id' })
    productId: string;

    @Column('integer', { name: 'quantity' })
    quantity: number;

    @ManyToOne(() => Cart, (cart) => cart.items)
    @JoinColumn({ name: 'cart_id' })
    cart: Cart;
}