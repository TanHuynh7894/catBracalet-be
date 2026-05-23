import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Cart } from '../../../models/carts/entities/cart.entity';
import { ProductVariant } from '../../product-variants/entities/product-variant.entity';

export function cartEntityFactory(): typeof Cart {
  return Cart;
}
export function productVariantEntityFactory(): typeof ProductVariant {
  return ProductVariant;
}

@Entity('cart_items')
export class CartItem {
  @PrimaryGeneratedColumn('uuid', { name: 'cart_item_id' })
  public id: string;

  @Column({ type: 'uuid', name: 'cart_id' })
  public cartId: string;

  @ManyToOne(cartEntityFactory, (cart: Cart) => cart.items, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'cart_id' })
  public cart?: Cart;

  @Column({ type: 'uuid', name: 'variant_id' })
  public variantId: string;

  @ManyToOne(productVariantEntityFactory, { nullable: false })
  @JoinColumn({ name: 'variant_id' })
  public variant?: ProductVariant;

  @Column({ type: 'int', name: 'quantity', default: 1 })
  public quantity: number;
}
