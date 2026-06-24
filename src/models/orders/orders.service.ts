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
import { Cart } from '../carts/entities/cart.entity';
import { CartItem } from '../cart_items/entities/cart-item.entity';
import { Vouchers } from '../vouchers/entities/vouchers.entity';
import { UserAddress } from '../user_address/entities/user_address.entity';
import { VouchersService } from '../vouchers/vouchers.service';
import { ShipmentService } from '../shipment/shipment.service';
import { VipService } from '../VIP/vip.service';
import {
  PaymentRedirectOptions,
  PaymentsService,
} from '../payments/payments.service';
import { Payments } from '../payments/entities/payments.entity';
import { OrderItemsService } from '../order-items/order-items.service';
import {
  ORDER_STATUSES,
  OrderStatus,
} from './constants/order-status.constants';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Payments)
    private readonly paymentsRepository: Repository<Payments>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    private readonly vouchersService: VouchersService,
    private readonly shipmentService: ShipmentService,
    private readonly vipService: VipService,
    private readonly paymentsService: PaymentsService,
    private readonly orderItemsService: OrderItemsService,
    private readonly dataSource: DataSource,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Main checkout handler with transaction support
   */
  async handleCheckout(
    userId: string,
    addressId: string,
    voucherCode?: string,
    cartItemIds?: string[],
    paymentRedirectOptions: PaymentRedirectOptions = {},
  ) {
    const checkoutResult = await this.dataSource.transaction(
      async (manager: EntityManager) => {
        // 1. Validate checkout conditions
        const { cartItems, voucher, address } = await this.validateCheckout(
          manager,
          userId,
          addressId,
          voucherCode,
          cartItemIds,
        );

        // 2. Calculate order total and prepare item data
        const {
          totalAmount,
          subtotal,
          shippingFee,
          discountAmount,
          orderItems,
        } = await this.calculateOrderTotal(cartItems, address, voucher);

        // 3. Create Order
        const order = await this.createOrder(
          manager,
          userId,
          addressId,
          voucher?.id,
          totalAmount,
        );

        // 4. Create Order Items
        await this.orderItemsService.createForOrder(
          order.id,
          orderItems,
          manager,
        );

        // 5. Apply Voucher (Reduce voucher quantity) - Gọi qua VoucherService
        if (voucher) {
          await this.vouchersService.decrementVoucherQuantity(
            voucher.id,
            manager,
          );
        }

        // 6. Deduct Stock from product variants
        await this.orderItemsService.deductStock(cartItems, manager);

        // 7. Clear Cart Items
        await this.clearCart(
          manager,
          userId,
          cartItems.map((item) => item.id),
        );

        const createdOrder = await manager.findOne(Order, {
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

        return {
          order: createdOrder,
          pricing: {
            subtotal,
            shippingFee,
            discountAmount,
            totalAmount,
          },
        };
      },
    );

    if (!checkoutResult.order) {
      throw new NotFoundException('Order was not created successfully');
    }

    const payment = await this.paymentsService.createOSPayment(
      checkoutResult.order.id,
      paymentRedirectOptions,
    );

    try {
      const newNotif = await this.notificationsService.createNotification({
        userId: checkoutResult.order.userId,
        title: 'Đơn hàng mới!',
        message: `Khách hàng vừa đặt đơn #${checkoutResult.order.id} (Chờ thanh toán)`,
        type: 'ORDER',
        relatedId: checkoutResult.order.id.toString(),
      });

      this.notificationsGateway.sendNotificationToAll(newNotif);
      console.log(`[DEBUG] Đã bắn thông báo cho đơn hàng ${checkoutResult.order.id}`);
    } catch (error) {
      // Bọc try-catch cẩn thận, lỡ thông báo lỗi thì khách vẫn nhận được link thanh toán
      console.error('[ERROR] Lỗi nổ thông báo checkout:', error);
    }

    return {
      order: checkoutResult.order,
      pricing: checkoutResult.pricing,
      payment,
      checkoutUrl: payment.checkoutUrl,
      orderCode: payment.orderCode,
      paymentLinkId: payment.paymentLinkId,
    };
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

      await this.orderItemsService.restoreStock(order.items, manager);

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
  async updateOrderStatus(orderId: string, newStatus: OrderStatus) {
    return await this.dataSource.transaction(async (manager: EntityManager) => {
      const order = await manager.findOne(Order, { where: { id: orderId } });
      if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

      this.validateOrderStatusTransition(order.status, newStatus);

      if (newStatus === 'CONFIRMED') {
        await this.ensureOrderPaid(orderId);
      }

      if (newStatus === 'CANCELLED') {
        return await this.cancelOrder(orderId);
      }

      order.status = newStatus;
      const savedOrder = await manager.save(order);

      try {
        let title = '';
        let message = '';
        const shortOrderId = savedOrder.id.substring(0, 8);

        if (newStatus === 'CONFIRMED') {
          title = 'Đơn hàng đã được xác nhận';
          message = `Cửa hàng đã xác nhận đơn hàng #${shortOrderId}... của bạn và đang chuẩn bị hàng.`;
        } else if (newStatus === 'SHIPPING') {
          title = 'Đơn hàng bắt đầu được giao';
          message = `Đơn hàng #${shortOrderId}... đã được bàn giao cho đơn vị vận chuyển.`;
        }

        if (title && message) {
          const notif = await this.notificationsService.createNotification({
            userId: savedOrder.userId,
            title,
            message,
            type: 'ORDER',
            relatedId: savedOrder.id,
          });
          this.notificationsGateway.sendNotificationToAll(notif);
        }
      } catch (error) {
        console.error(`[ERROR] Lỗi bắn thông báo chuyển trạng thái đơn hàng ${orderId}:`, error);
      }

      if (newStatus === 'DELIVERED') {
        await this.vipService.syncUserVipProgress(order.userId, manager);
      }

      return savedOrder;
    });
  }

  /**
   * Helper: Validate logic chuyển đổi status
   */
  async confirmOrder(orderId: string) {
    return this.updateOrderStatus(orderId, 'CONFIRMED');
  }

  private async ensureOrderPaid(orderId: string) {
    const paidPayment = await this.paymentsRepository.findOne({
      where: { orderId, paymentStatus: 'PAID' },
      select: { id: true },
    });

    if (!paidPayment) {
      throw new BadRequestException(
        'Chua the xac nhan don hang vi don hang chua thanh toan',
      );
    }
  }

  private validateOrderStatusTransition(
    currentStatus: string,
    nextStatus: OrderStatus,
  ) {
    if (!ORDER_STATUSES.includes(nextStatus)) {
      throw new BadRequestException(`Trang thai khong hop le: ${nextStatus}`);
    }

    const validTransitions: Record<string, OrderStatus[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['SHIPPING', 'CANCELLED'],
      SHIPPING: ['DELIVERED'],
      DELIVERED: [],
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

  private async validateCheckout(
    manager: EntityManager,
    userId: string,
    addressId: string,
    voucherCode?: string,
    cartItemIds?: string[],
  ) {
    const cart = await manager.findOne(Cart, { where: { userId } });
    if (!cart)
      throw new NotFoundException('Không tìm thấy giỏ hàng cho người dùng này');

    const allCartItems = await manager.find(CartItem, {
      where: { cartId: cart.id },
      relations: [
        'variant',
        'variant.productVariantMappings',
        'variant.productVariantMappings.product',
      ],
    });

    const selectedCartItemIds = new Set(cartItemIds ?? []);
    const cartItems = selectedCartItemIds.size
      ? allCartItems.filter((item) => selectedCartItemIds.has(item.id))
      : allCartItems;

    if (
      selectedCartItemIds.size &&
      cartItems.length !== selectedCartItemIds.size
    ) {
      throw new BadRequestException(
        'Một hoặc nhiều sản phẩm được chọn không tồn tại trong giỏ hàng',
      );
    }

    if (!cartItems.length) {
      throw new BadRequestException(
        selectedCartItemIds.size
          ? 'Không có sản phẩm hợp lệ nào được chọn để thanh toán'
          : 'Giỏ hàng trống, không thể thanh toán',
      );
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
  private async calculateOrderTotal(
    cartItems: CartItem[],
    address: UserAddress,
    voucher?: Vouchers,
  ) {
    const { items: orderItems, productSubtotal } =
      this.orderItemsService.prepareFromCartItems(cartItems);

    const shippingFee = await this.calculateCustomerShippingFee(
      address,
      productSubtotal,
    );
    const subtotal = productSubtotal;
    const totalBeforeDiscount = subtotal + shippingFee;
    let totalAmount = totalBeforeDiscount;
    let discountAmount = 0;

    // Tính toán discount qua VoucherService
    if (voucher) {
      discountAmount = this.vouchersService.calculateVoucherDiscount(
        totalBeforeDiscount,
        voucher,
      );
      totalAmount = totalBeforeDiscount - discountAmount;
    }

    totalAmount = Math.round(totalAmount);

    return {
      totalAmount,
      subtotal,
      shippingFee,
      discountAmount,
      orderItems,
    };
  }

  private async calculateCustomerShippingFee(
    address: UserAddress,
    productSubtotal: number,
  ): Promise<number> {
    const shippingFee = await this.shipmentService.calculateFeeForAddress(
      address,
      {
        amount: productSubtotal,
      },
    );

    return Number(shippingFee.total_shipping_fee);
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
   * Delete items from the user's cart
   */

  private async clearCart(
    manager: EntityManager,
    userId: string,
    cartItemIds?: string[],
  ) {
    const cart = await manager.findOne(Cart, { where: { userId } });
    if (cart) {
      if (cartItemIds?.length) {
        await manager.delete(CartItem, cartItemIds);
        return;
      }

      await manager.delete(CartItem, { cartId: cart.id });
    }
  }

  // --- Keep existing methods below or update them if needed ---

  async createOrder_legacy(createOrderDto: CreateOrderDto) {
    const { items, ...orderData } = createOrderDto;

    const newOrder = this.orderRepository.create({
      ...orderData,
      status: orderData.status ?? 'PENDING',
      createdAt: new Date(),
    });

    const savedOrder = await this.orderRepository.save(newOrder);

    if (items && items.length > 0) {
      for (const item of items) {
        await this.orderItemsService.createOne(savedOrder.id, item);
      }
      return this.getOrderById(savedOrder.id);
    }

    return savedOrder;
  }

  async createOrderItem(orderId: string, itemData: CreateOrderItemDto) {
    return this.orderItemsService.createOne(orderId, itemData);
  }

  async calculateOrderTotal_legacy(orderId: string) {
    return this.orderItemsService.recalculateOrderTotal(orderId);
  }

  private getOrderRelations() {
    return [
      'user',
      'address',
      'voucher',
      'items',
      'items.variant',
      'items.variant.productVariantMappings',
      'items.variant.productVariantMappings.product',
    ];
  }

  private summarizePayment(payments: Payments[]) {
    const paidPayment = payments.find(
      (payment) => payment.paymentStatus === 'PAID',
    );
    const latestPayment = paidPayment ?? payments[payments.length - 1] ?? null;

    return {
      paymentStatus: latestPayment?.paymentStatus ?? 'UNPAID',
      paymentOrderCode: latestPayment?.orderCode ?? null,
      paidAt: latestPayment?.paidAt ?? null,
    };
  }

  private canRetryPayment(order: Order, paymentStatus: string) {
    return (
      paymentStatus !== 'PAID' &&
      order.status !== 'CANCELLED' &&
      order.status !== 'DELIVERED'
    );
  }

  private getOrderProductSubtotal(order: Order) {
    return (order.items ?? []).reduce(
      (total, item) => total + Number(item.totalPrice ?? 0),
      0,
    );
  }

  private getEstimatedShippingFee(order: Order) {
    const totalAmount = Number(order.totalAmount ?? 0);
    const productSubtotal = this.getOrderProductSubtotal(order);
    const voucher = order.voucher;

    if (!voucher) {
      return Math.max(0, Math.round(totalAmount - productSubtotal));
    }

    if (voucher.discountType === 'FIXED') {
      const discountValue = Number(voucher.discountValue ?? 0);
      return Math.max(0, Math.round(totalAmount + discountValue - productSubtotal));
    }

    if (voucher.discountType === 'PERCENT') {
      const discountPercent = Number(voucher.discountValue ?? 0);
      const payableRate = 1 - discountPercent / 100;

      if (payableRate <= 0) return 0;

      return Math.max(0, Math.round(totalAmount / payableRate - productSubtotal));
    }

    return Math.max(0, Math.round(totalAmount - productSubtotal));
  }

  private formatOrderResponse(order: Order, payments: Payments[] = []) {
    const payment = this.summarizePayment(payments);

    return {
      ...order,
      totalAmount: Number(order.totalAmount),
      shippingFee: this.getEstimatedShippingFee(order),
      ...payment,
      canRetryPayment: this.canRetryPayment(order, payment.paymentStatus),
    };
  }

  private async formatOrderListResponse(orders: Order[]) {
    if (!orders.length) return [];

    const payments = await this.paymentsRepository.find({
      where: { orderId: In(orders.map((order) => order.id)) },
    });

    const paymentsByOrderId = new Map<string, Payments[]>();
    for (const payment of payments) {
      const orderPayments = paymentsByOrderId.get(payment.orderId) ?? [];
      orderPayments.push(payment);
      paymentsByOrderId.set(payment.orderId, orderPayments);
    }

    return orders.map((order) =>
      this.formatOrderResponse(order, paymentsByOrderId.get(order.id) ?? []),
    );
  }

  async findAll() {
    const orders = await this.orderRepository.find({
      relations: this.getOrderRelations(),
    });

    return this.formatOrderListResponse(orders);
  }

  async getOrderById(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      relations: this.getOrderRelations(),
    });
    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }
    const payments = await this.paymentsRepository.find({
      where: { orderId: order.id },
    });

    return this.formatOrderResponse(order, payments);
  }

  async getOrdersByUser(userId: string) {
    const orders = await this.orderRepository.find({
      where: { userId },
      relations: this.getOrderRelations(),
    });

    return this.formatOrderListResponse(orders);
  }

  async getOrdersByStatus(status: string) {
    const orders = await this.orderRepository.find({
      where: { status },
      relations: this.getOrderRelations(),
    });

    return this.formatOrderListResponse(orders);
  }

  async getCurrentOrderStatus(id: string) {
    const order = await this.orderRepository.findOne({
      where: { id },
      select: {
        id: true,
        status: true,
        totalAmount: true,
        createdAt: true,
      },
      relations: ['items', 'voucher'],
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${id} not found`);
    }

    const payments = await this.paymentsRepository.find({
      where: { orderId: order.id },
    });
    const payment = this.summarizePayment(payments);

    return {
      orderId: order.id,
      status: order.status,
      totalAmount: Number(order.totalAmount),
      shippingFee: this.getEstimatedShippingFee(order),
      ...payment,
      canRetryPayment: this.canRetryPayment(order, payment.paymentStatus),
      createdAt: order.createdAt,
    };
  }

  async getOrdersByTime(startDate: Date, endDate: Date) {
    const orders = await this.orderRepository
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

    return this.formatOrderListResponse(orders);
  }

  async update(id: string, updateOrderDto: UpdateOrderDto) {
    const updateResult = await this.orderRepository.update(id, updateOrderDto);

    const order = await this.orderRepository.findOne({ where: { id } });
    if (order?.status === 'DELIVERED') {
      await this.vipService.syncUserVipProgress(order.userId);
    }

    return updateResult;
  }

  remove(id: string) {
    return this.orderRepository.delete(id);
  }
}
