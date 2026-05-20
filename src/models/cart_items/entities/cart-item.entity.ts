import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid', { name: 'cart_item_id' })
  id: string;

  @Column({ type: 'uuid', name: 'cart_id' })
  cartId: string;

  @Column({ type: 'uuid', name: 'variant_id' })
  variantId: string;

  @Column({ type: 'int', name: 'quantity', default: 1 })
  quantity: number;
}
