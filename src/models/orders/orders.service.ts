import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager, In } from 'typeorm';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Cart } from '../carts/entities/cart.entity';
import { CartItem } from '../cart_items/entities/cart-item.entity';
import { ProductVariant } from '../product-variants/entities/product-variant.entity';
import { Vouchers } from '../vouchers/entities/vouchers.entity';
import { UserAddress } from '../user_address/entities/user_address.entity';
import { VouchersService } from '../vouchers/vouchers.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(ProductVariant)
    private readonly productVariantRepository: Repository<ProductVariant>,
    @InjectRepository(Vouchers)
    private readonly voucherRepository: Repository<Vouchers>,
    @InjectRepository(UserAddress)
    private readonly addressRepository: Repository<UserAddress>,
    private readonly vouchersService: VouchersService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Main checkout handler with transaction support
   */
  async handleCheckout(
    userId: string,
    addressId: string,
    voucherCode?: string,
  ) {
    return await this.dataSource.transaction(async (manager: EntityManager) => {
      try {
        // 1. Validate checkout conditions
        const { cartItems, voucher, address } = await this.validateCheckout(
          manager,
          userId,
          addressId,
          voucherCode,
        );

        // 2. Calculate order total and prepare item data
        const { totalAmount, subtotal, discountAmount, orderItemsData } =
          await this.calculateOrderTotal(cartItems, voucher);

        // 3. Create Order
        const order = await this.createOrder(
          manager,
          userId,
          addressId,
          voucher?.id,
          totalAmount,
        );

        // 4. Create Order Items
        await this.createOrderItems(manager, order.id, orderItemsData);

        // 5. Apply Voucher (Reduce voucher quantity) - Gọi qua VoucherService
        if (voucher) {
          await this.vouchersService.decrementVoucherQuantity(
            voucher.id,
            manager,
          );
        }

        // 6. Deduct Stock from product variants
        await this.deductStock(manager, cartItems);

        // 7. Clear Cart Items
        await this.clearCart(manager, userId);

        return await manager.findOne(Order, {
          where: { id: order.id },
          relations: [
            'user',
            'address',
            'voucher',
            'items',
            'items.variant',
            'items.variant.productVariantMappings',
            'items.variant.productVariantMappings.product',
          ],
        });
      } catch (error) {
        throw error;
      }
    });
  }

  /**
   * 1. Hủy đơn hàng và hoàn lại stock/voucher
   */
  async cancelOrder(orderId: string) {
    return await this.dataSource.transaction(async (manager: EntityManager) => {
      const order = await manager.findOne(Order, {
        where: { id: orderId },
        relations: ['items'],
      });

      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng cần hủy');
      }

      const cancellableStatuses = ['PENDING', 'CONFIRMED'];
      if (!cancellableStatuses.includes(order.status)) {
        throw new BadRequestException(
          `Không thể hủy đơn hàng đang ở trạng thái: ${order.status}`,
        );
      }

      order.status = 'CANCELLED';
      await manager.save(order);

      await this.restoreStock(manager, order.items);

      // Hoàn lại voucher - Gọi qua VoucherService
      if (order.voucherId) {
        await this.vouchersService.rollbackVoucher(order.voucherId, manager);
      }

      return {
        message: 'Hủy đơn hàng thành công',
        orderId: order.id,
        status: order.status,
      };
    });
  }

  /**
   * 2. Cập nhật trạng thái đơn hàng (Admin)
   */
  async updateOrderStatus(orderId: string, newStatus: string) {
    return await this.dataSource.transaction(async (manager: EntityManager) => {
      const order = await manager.findOne(Order, { where: { id: orderId } });
      if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

      this.validateOrderStatusTransition(order.status, newStatus);

      if (newStatus === 'CANCELLED') {
        return await this.cancelOrder(orderId);
      }

      order.status = newStatus;
      const savedOrder = await manager.save(order);

      if (newStatus === 'COMPLETED') {
        await this.triggerVipUpdate(order.userId, manager);
      }

      return savedOrder;
    });
  }

  /**
   * Helper: Hoàn lại tồn kho cho các Variant
   */
  private async restoreStock(manager: EntityManager, items: OrderItem[]) {
    for (const item of items) {
      await manager.increment(
        ProductVariant,
        { id: item.variantId },
        'stockQuantity',
        item.quantity,
      );
    }
  }

  /**
   * Helper: Validate logic chuyển đổi status
   */
  private validateOrderStatusTransition(
    currentStatus: string,
    nextStatus: string,
  ) {
    const validTransitions = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['SHIPPING', 'CANCELLED'],
      SHIPPING: ['COMPLETED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    if (currentStatus === nextStatus) {
      throw new BadRequestException(
        'Trạng thái mới trùng với trạng thái hiện tại',
      );
    }

    const allowed = validTransitions[currentStatus] || [];
    if (!allowed.includes(nextStatus)) {
      throw new BadRequestException(
        `Không cho phép chuyển trạng thái từ ${currentStatus} sang ${nextStatus}`,
      );
    }
  }

  /**
   * Helper: Trigger cập nhật hạng thành viên VIP (Mở rộng sau)
   */
  private async triggerVipUpdate(userId: string, manager: EntityManager) {
    console.log(`Triggering VIP update logic for user: ${userId}`);
  }

  /**
   * Validate cart, stock, variants, voucher, and address
   */
  private async validateCheckout(
    manager: EntityManager,
    userId: string,
    addressId: string,
    voucherCode?: string,
  ) {
    const cart = await manager.findOne(Cart, { where: { userId } });
    if (!cart)
      throw new NotFoundException('Không tìm thấy giỏ hàng cho người dùng này');

    const cartItems = await manager.find(CartItem, {
      where: { cartId: cart.id },
      relations: [
        'variant',
        'variant.productVariantMappings',
        'variant.productVariantMappings.product',
      ],
    });

    if (!cartItems.length) {
      throw new BadRequestException('Giỏ hàng trống, không thể thanh toán');
    }

    for (const item of cartItems) {
      if (!item.variant) {
        throw new NotFoundException(
          `Biến thể sản phẩm với ID ${item.variantId} không tồn tại`,
        );
      }
      if (item.variant.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `Sản phẩm ${item.variant.sku} không đủ tồn kho (Cần: ${item.quantity}, Hiện có: ${item.variant.stockQuantity})`,
        );
      }
      if (item.variant.status !== 'ACTIVE') {
        throw new BadRequestException(
          `Sản phẩm ${item.variant.sku} hiện không khả dụng`,
        );
      }
    }

    const address = await manager.findOne(UserAddress, {
      where: { id: addressId, userId },
    });
    if (!address) {
      throw new NotFoundException(
        'Địa chỉ giao hàng không hợp lệ cho người dùng này',
      );
    }

    // Validate Voucher qua VoucherService
    let voucher: Vouchers | null = null;
    if (voucherCode) {
      voucher = await this.vouchersService.validateVoucher(
        voucherCode,
        manager,
      );
    }

    return { cartItems, voucher, address };
  }

  /**
   * Calculate total amount and prepare order items data
   */
  private async calculateOrderTotal(cartItems: CartItem[], voucher?: Vouchers) {
    let subtotal = 0;
    const orderItemsData = cartItems.map((item) => {
      const basePrice = Number(
        item.variant.productVariantMappings?.[0]?.product?.basePrice || 0,
      );
      const extraPrice = Number(item.variant.extraPrice || 0);
      const unitPrice = basePrice + extraPrice;
      const totalPrice = unitPrice * item.quantity;

      subtotal += totalPrice;

      return {
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
      };
    });

    let totalAmount = subtotal;
    let discountAmount = 0;

    // Tính toán discount qua VoucherService
    if (voucher) {
      discountAmount = this.vouchersService.calculateVoucherDiscount(
        subtotal,
        voucher,
      );
      totalAmount = subtotal - discountAmount;
    }

    return { totalAmount, subtotal, discountAmount, orderItemsData };
  }

  /**
   * Create the order record
   */
  private async createOrder(
    manager: EntityManager,
    userId: string,
    addressId: string,
    voucherId: string | undefined,
    totalAmount: number,
  ) {
    const order = manager.create(Order, {
      userId,
      addressId,
      voucherId,
      totalAmount,
      status: 'PENDING',
      createdAt: new Date(),
    });
    return await manager.save(order);
  }

  /**
   * Create order items from calculated data
   */
  private async createOrderItems(
    manager: EntityManager,
    orderId: string,
    itemsData: any[],
  ) {
    const orderItems = itemsData.map((item) =>
      manager.create(OrderItem, {
        orderId,
        variantId: item.variantId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      }),
    );
    return await manager.save(orderItems);
  }

  /**
   * Deduct stock from variants
   */
  private async deductStock(manager: EntityManager, cartItems: CartItem[]) {
    for (const item of cartItems) {
      await manager.decrement(
        ProductVariant,
        { id: item.variantId },
        'stockQuantity',
        item.quantity,
      );
    }
  }

  /**
   * Delete items from the user's cart
   */

  private async clearCart(manager: EntityManager, userId: string) {
    const cart = await manager.findOne(Cart, { where: { userId } });
    if (cart) {
      await manager.delete(CartItem, { cartId: cart.id });
    }
  }

  // --- Keep existing methods below or update them if needed ---

  async createOrder_legacy(createOrderDto: CreateOrderDto) {
    const { items, ...orderData } = createOrderDto;

    const newOrder = this.orderRepository.create({
      ...orderData,
      createdAt: new Date(),
    });

    const savedOrder = await this.orderRepository.save(newOrder);

    if (items && items.length > 0) {
      const orderItems = items.map((item) => {
        return this.orderItemRepository.create({
          ...item,
          orderId: savedOrder.id,
          totalPrice: item.unitPrice * item.quantity,
        });
      });
      await this.orderItemRepository.save(orderItems);

      await this.calculateOrderTotal_legacy(savedOrder.id);
      return this.getOrderById(savedOrder.id);
    }

    return savedOrder;
  }

  async createOrderItem(orderId: string, itemData: CreateOrderItemDto) {
    const totalPrice = itemData.unitPrice * itemData.quantity;
    const orderItem = this.orderItemRepository.create({
      ...itemData,
      orderId,
      totalPrice,
    });
    const savedItem = await this.orderItemRepository.save(orderItem);

    await this.calculateOrderTotal_legacy(orderId);

    return savedItem;
  }

  async calculateOrderTotal_legacy(orderId: string) {
    const items = await this.orderItemRepository.find({
      where: { orderId },
    });

    const totalAmount = items.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0,
    );

    await this.orderRepository.update(orderId, { totalAmount });

    return totalAmount;
  }

  findAll() {
    return this.orderRepository.find({
      relations: [
        'user',
        'address',
        'voucher',
        'items',
        'items.variant',
        'items.variant.productVariantMappings',
        'items.variant.productVariantMappings.product',
      ],
    });
  }

  async getOrderById(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: [
        'user',
        'address',
        'voucher',
        'items',
        'items.variant',
        'items.variant.productVariantMappings',
        'items.variant.productVariantMappings.product',
      ],
    });
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    return order;
  }

  async getOrdersByUser(userId: string) {
    return this.orderRepository.find({
      where: { userId },
      relations: [
        'user',
        'address',
        'voucher',
        'items',
        'items.variant',
        'items.variant.productVariantMappings',
        'items.variant.productVariantMappings.product',
      ],
    });
  }

  async getOrdersByStatus(status: string) {
    return this.orderRepository.find({
      where: { status },
      relations: [
        'user',
        'address',
        'voucher',
        'items',
        'items.variant',
        'items.variant.productVariantMappings',
        'items.variant.productVariantMappings.product',
      ],
    });
  }

  async getOrdersByTime(startDate: Date, endDate: Date) {
    return this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .leftJoinAndSelect('order.address', 'address')
      .leftJoinAndSelect('order.voucher', 'voucher')
      .leftJoinAndSelect('order.items', 'items')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('variant.productVariantMappings', 'mappings')
      .leftJoinAndSelect('mappings.product', 'product')
      .where('order.createdAt BETWEEN :start AND :end', {
        start: startDate,
        end: endDate,
      })
      .getMany();
  }

  update(id: string, updateOrderDto: UpdateOrderDto) {
    return this.orderRepository.update(id, updateOrderDto);
  }

  remove(id: string) {
    return this.orderRepository.delete(id);
  }
}
