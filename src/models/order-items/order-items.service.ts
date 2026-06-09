import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { CartItem } from '../cart_items/entities/cart-item.entity';
import { CreateOrderItemDto } from '../orders/dto/create-order-item.dto';
import { Order } from '../orders/entities/order.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { ProductVariantMapping } from '../product-variant-mappings/entities/product-variant-mapping.entity';
import { ProductVariant } from '../product-variants/entities/product-variant.entity';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';

interface CalculatedOrderItem {
  variantId: string;
  productName?: string;
  sku?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface PreparedOrderItems {
  items: CalculatedOrderItem[];
  productSubtotal: number;
}

@Injectable()
export class OrderItemsService {
  constructor(
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(ProductVariantMapping)
    private readonly productVariantMappingRepository: Repository<ProductVariantMapping>,
  ) {}

  private getRepository(manager?: EntityManager): Repository<OrderItem> {
    return manager
      ? manager.getRepository(OrderItem)
      : this.orderItemRepository;
  }

  private getOrderRepository(manager?: EntityManager): Repository<Order> {
    return manager ? manager.getRepository(Order) : this.orderRepository;
  }

  private getVariantRepository(
    manager?: EntityManager,
  ): Repository<ProductVariant> {
    return manager
      ? manager.getRepository(ProductVariant)
      : this.productVariantRepository;
  }

  private parseMoney(value: string | number | undefined | null): number {
    if (value === undefined || value === null) return 0;
    return Number(value);
  }

  private calculateUnitPrice(variant: ProductVariant): number {
    return this.parseMoney(variant.extraPrice);
  }

  prepareFromCartItems(cartItems: CartItem[]): PreparedOrderItems {
    let productSubtotal = 0;

    const items = cartItems.map((item) => {
      const variant = item.variant;
      const mapping = this.getSingleActiveMapping(
        variant?.productVariantMappings,
        item.variantId,
      );
      const product = mapping?.product;
      const unitPrice = this.parseMoney(variant?.extraPrice);
      const totalPrice = unitPrice * item.quantity;

      productSubtotal += totalPrice;

      return {
        variantId: item.variantId,
        productName: product?.productName,
        sku: variant?.sku,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      };
    });

    return { items, productSubtotal };
  }

  async createForOrder(
    orderId: string,
    itemsData: CalculatedOrderItem[],
    manager?: EntityManager,
  ): Promise<OrderItem[]> {
    const repository = this.getRepository(manager);
    const orderItems = itemsData.map((item) =>
      repository.create({
        orderId,
        variantId: item.variantId,
        productName: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      }),
    );

    return repository.save(orderItems);
  }

  async createOne(
    orderId: string,
    itemData: CreateOrderItemDto,
    manager?: EntityManager,
  ): Promise<OrderItem> {
    await this.ensureOrderExists(orderId, manager);

    const repository = this.getRepository(manager);
    const variant = await this.findVariant(itemData.variantId, manager);
    const mapping = await this.findSingleActiveMapping(
      itemData.variantId,
      manager,
    );
    const product = mapping.product;
    const unitPrice = this.calculateUnitPrice(variant);
    const totalPrice = unitPrice * itemData.quantity;
    const orderItem = repository.create({
      ...itemData,
      orderId,
      productName: product?.productName,
      sku: variant.sku,
      unitPrice,
      totalPrice,
    });

    const savedItem = await repository.save(orderItem);
    await this.recalculateOrderTotal(orderId, manager);

    return savedItem;
  }

  findByOrderId(orderId: string): Promise<OrderItem[]> {
    return this.orderItemRepository.find({
      where: { orderId },
      relations: [
        'variant',
        'variant.productVariantMappings',
        'variant.productVariantMappings.product',
      ],
    });
  }

  async calculateOrderItemsTotal(
    orderId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const repository = this.getRepository(manager);
    const items = await repository.find({
      where: { orderId },
    });

    return items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  }

  async updateOne(
    orderId: string,
    itemId: string,
    updateOrderItemDto: UpdateOrderItemDto,
  ): Promise<OrderItem> {
    const item = await this.orderItemRepository.findOne({
      where: { id: itemId, orderId },
    });
    if (!item) {
      throw new NotFoundException(`Order item with id ${itemId} not found`);
    }

    if (updateOrderItemDto.quantity !== undefined) {
      item.quantity = updateOrderItemDto.quantity;
    }
    if (updateOrderItemDto.unitPrice !== undefined) {
      item.unitPrice = updateOrderItemDto.unitPrice;
    }
    if (updateOrderItemDto.productName !== undefined) {
      item.productName = updateOrderItemDto.productName;
    }

    item.totalPrice = Number(item.unitPrice) * item.quantity;

    const savedItem = await this.orderItemRepository.save(item);
    await this.recalculateOrderTotal(orderId);

    return savedItem;
  }

  async removeOne(
    orderId: string,
    itemId: string,
  ): Promise<{ success: boolean }> {
    const item = await this.orderItemRepository.findOne({
      where: { id: itemId, orderId },
    });
    if (!item) {
      throw new NotFoundException(`Order item with id ${itemId} not found`);
    }

    await this.orderItemRepository.delete(item.id);
    await this.recalculateOrderTotal(orderId);

    return { success: true };
  }

  async recalculateOrderTotal(
    orderId: string,
    manager?: EntityManager,
  ): Promise<number> {
    const totalAmount = await this.calculateOrderItemsTotal(orderId, manager);
    const orderRepository = this.getOrderRepository(manager);
    await orderRepository.update(orderId, { totalAmount });

    return totalAmount;
  }

  async restoreStock(
    items: OrderItem[],
    manager: EntityManager,
  ): Promise<void> {
    for (const item of items) {
      await manager.increment(
        ProductVariant,
        { id: item.variantId },
        'stockQuantity',
        item.quantity,
      );
    }
  }

  async deductStock(cartItems: CartItem[], manager: EntityManager) {
    for (const item of cartItems) {
      await manager.decrement(
        ProductVariant,
        { id: item.variantId },
        'stockQuantity',
        item.quantity,
      );
    }
  }

  private async ensureOrderExists(
    orderId: string,
    manager?: EntityManager,
  ): Promise<void> {
    const orderRepository = this.getOrderRepository(manager);
    const order = await orderRepository.findOne({
      where: { id: orderId },
      select: { id: true },
    });
    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }
  }

  private async findVariant(
    variantId: string,
    manager?: EntityManager,
  ): Promise<ProductVariant> {
    const variantRepository = this.getVariantRepository(manager);
    const variant = await variantRepository.findOne({
      where: { id: variantId },
      relations: ['productVariantMappings', 'productVariantMappings.product'],
    });

    if (!variant) {
      throw new NotFoundException(
        `Product variant with id ${variantId} not found`,
      );
    }

    return variant;
  }

  private getMappingRepository(
    manager?: EntityManager,
  ): Repository<ProductVariantMapping> {
    return manager
      ? manager.getRepository(ProductVariantMapping)
      : this.productVariantMappingRepository;
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
    manager?: EntityManager,
  ): Promise<ProductVariantMapping> {
    const mappingRepository = this.getMappingRepository(manager);
    const mappings = await mappingRepository.find({
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
}
