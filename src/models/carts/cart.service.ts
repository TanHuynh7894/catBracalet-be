import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindOptionsWhere } from 'typeorm';
import { Cart } from './entities/cart.entity';
import { CartItem } from '../cart_items/entities/cart-item.entity';
import { ProductVariant } from '../product-variants/entities/product-variant.entity';
import { ProductVariantMapping } from '../product-variant-mappings/entities/product-variant-mapping.entity';
import { Product } from '../products/entities/product.entity';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductVariantMapping)
    private readonly productVariantMappingRepository: Repository<ProductVariantMapping>,
  ) {}

  private async getOrCreateCartByUserId(userId: string): Promise<Cart> {
    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: [
        'items',
        'items.variant',
        'items.variant.productVariantMappings',
        'items.variant.productVariantMappings.product',
      ],
    });

    if (!cart) {
      const newCart = this.cartRepository.create({ userId });
      cart = await this.cartRepository.save(newCart);
      cart.items = [];
    }

    return cart;
  }

  // Helper: parse decimal values returned by TypeORM (may be string or number)
  private parseDecimal(value: string | number | undefined | null): number {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    // typeof value === 'string'
    const n = parseFloat(value);
    return Number.isFinite(n) ? n : 0;
  }

  // Round to 2 decimal places (money)
  private round2(value: number): number {
    return Math.round(value * 100) / 100;
  }

  async getCartDetails(userId: string) {
    const cart = await this.getOrCreateCartByUserId(userId);

    let totalItems = 0;
    let totalPrice = 0;

    const items = cart.items ?? [];

    const formattedItems = items.map((item) => {
      totalItems += item.quantity;

      // variant and product mapping are loaded via relations (may be undefined)
      const variant: ProductVariant | undefined = item.variant;
      const mappings: ProductVariantMapping[] | undefined =
        variant?.productVariantMappings;

      const mapping = this.getSingleActiveMapping(mappings, item.variantId);

      const product: Product | undefined = mapping?.product;

      const unitPrice = this.round2(this.parseDecimal(variant?.extraPrice));

      const subTotalRaw = unitPrice * item.quantity;
      const subTotal = this.round2(subTotalRaw);

      totalPrice += subTotal;

      // Return minimal variant/product details for frontend
      return {
        cartItemId: item.id, // cart_items.cart_item_id - used for delete/update
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        subTotal,
        variantDetails: {
          id: variant?.id,
          sku: variant?.sku,
          size: variant?.size,
          color: variant?.color,
          stockQuantity: variant?.stockQuantity,
          extraPrice: this.parseDecimal(variant?.extraPrice),
        },
        product: product
          ? {
              id: product.id,
              productName: product.productName,
              basePrice: this.parseDecimal(product.basePrice),
            }
          : null,
      };
    });

    totalPrice = this.round2(totalPrice);

    return {
      cartId: cart.id,
      userId: cart.userId,
      totalItems,
      totalPrice,
      items: formattedItems,
    };
  }

  async addToCart(
    userId: string,
    variantId: string,
    quantity: number,
  ): Promise<CartItem> {
    if (quantity <= 0)
      throw new BadRequestException('Quantity must be greater than 0');

    const cart = await this.getOrCreateCartByUserId(userId);

    const variant = await this.productVariantRepository.findOne({
      where: { id: variantId },
    });
    if (!variant) throw new NotFoundException('Product variant not found');

    await this.findSingleActiveMapping(variantId);

    const existingItem = cart.items?.find((it) => it.variantId === variantId);
    const newQuantity = (existingItem?.quantity ?? 0) + quantity;

    if (variant.stockQuantity < newQuantity) {
      throw new BadRequestException(
        'Insufficient stock for the requested quantity',
      );
    }

    if (existingItem) {
      existingItem.quantity = newQuantity;
      return await this.cartItemRepository.save(existingItem);
    }

    const newItem = this.cartItemRepository.create({
      cartId: cart.id,
      variantId,
      quantity,
    });
    return await this.cartItemRepository.save(newItem);
  }

  private getSingleActiveMapping(
    mappings: ProductVariantMapping[] | undefined,
    variantId: string,
  ): ProductVariantMapping | undefined {
    const activeMappings = (mappings ?? []).filter(
      (mapping) => mapping.status === 'ACTIVE',
    );

    if (activeMappings.length > 1) {
      throw new BadRequestException(
        `Variant ${variantId} is mapped to multiple active products`,
      );
    }

    return activeMappings[0];
  }

  private async findSingleActiveMapping(
    variantId: string,
  ): Promise<ProductVariantMapping> {
    const mappings = await this.productVariantMappingRepository.find({
      where: {
        variantId,
        status: 'ACTIVE',
      },
      relations: ['product'],
    });

    if (!mappings.length) {
      throw new NotFoundException(
        'Product variant is not mapped to an active product',
      );
    }

    if (mappings.length > 1) {
      throw new BadRequestException(
        `Variant ${variantId} is mapped to multiple active products`,
      );
    }

    return mappings[0];
  }

  async updateCartItem(
    userId: string,
    cartItemId: string,
    quantity: number,
  ): Promise<CartItem> {
    if (quantity <= 0)
      throw new BadRequestException('Quantity must be greater than 0');

    // Find cart id for the user without loading relations; do not create a cart when updating
    const cart = await this.cartRepository.findOne({
      where: { userId },
      select: ['id'],
    });
    if (!cart) throw new NotFoundException('Cart not found');

    const item = await this.cartItemRepository.findOne({
      where: { id: cartItemId },
      relations: ['variant'],
    });
    if (!item || item.cartId !== cart.id)
      throw new NotFoundException('Cart item not found');

    const variant = item.variant
      ? item.variant
      : await this.productVariantRepository.findOne({
          where: { id: item.variantId },
        });
    if (!variant) throw new NotFoundException('Product variant not found');

    if (variant.stockQuantity < quantity)
      throw new BadRequestException(
        'Insufficient stock for the requested quantity',
      );

    item.quantity = quantity;
    return await this.cartItemRepository.save(item);
  }

  async removeCartItem(
    userId: string,
    cartItemId: string,
  ): Promise<{ success: boolean }> {
    // Do not create cart when removing; ensure cart exists for user
    const cart = await this.cartRepository.findOne({
      where: { userId },
      select: ['id'],
    });
    if (!cart) throw new NotFoundException('Cart not found');

    const item = await this.cartItemRepository.findOne({
      where: { id: cartItemId },
    });
    if (!item || item.cartId !== cart.id)
      throw new NotFoundException('Cart item not found');

    await this.cartItemRepository.delete(item.id);
    return { success: true };
  }

  async clearCart(userId: string): Promise<{ success: boolean }> {
    const cart = await this.cartRepository.findOne({
      where: { userId },
      select: ['id'],
    });
    if (!cart) return { success: true };

    const deleteCriteria: FindOptionsWhere<CartItem> = { cartId: cart.id };

    await this.cartItemRepository.delete(deleteCriteria);
    return { success: true };
  }
}
