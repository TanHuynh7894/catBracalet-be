import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PayOS } from '@payos/node';
import { createHmac, timingSafeEqual } from 'crypto';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Payments } from './entities/payments.entity';

const MAX_GENERATE_ATTEMPTS = 20;
const MIN_ORDER_CODE = 100_000_000;
const MAX_INTEGER_ORDER_CODE = 2_147_483_647;

export interface PayOSPaymentLinkInfo {
  orderCode: number;
  amount: number;
  status: 'PAID' | 'PENDING' | 'CANCELLED';
  amountPaid: number;
  amountRemaining: number;
}

export interface PaymentRedirectOptions {
  returnUrl?: string;
  cancelUrl?: string;
}

@Injectable()
export class PaymentsService {
  private readonly payOS: PayOS;

  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Payments)
    private readonly paymentsRepository: Repository<Payments>,
    private readonly configService: ConfigService,
  ) {
    const clientId = this.configService.get<string>('PAYOS_CLIENT_ID') ?? '';
    const apiKey = this.configService.get<string>('PAYOS_API_KEY') ?? '';
    const checksumKey =
      this.configService.get<string>('PAYOS_CHECKSUM_KEY') ?? '';

    this.payOS = new PayOS({ clientId, apiKey, checksumKey });
  }

  private normalizeValue(value: unknown): string {
    if (
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      return String(value);
    }
    return '';
  }

  private normalizeUrl(value: string): string {
    return value.replace(/\/+$/, '');
  }

  private getPaymentRedirectUrl(
    configKey: 'PAYOS_RETURN_URL' | 'PAYOS_CANCEL_URL',
    fallbackPath: string,
    query: Record<string, string | number>,
    overrideUrl?: string,
  ): string {
    const configuredUrl =
      overrideUrl?.trim() || this.configService.get<string>(configKey)?.trim();

    const redirectUrl =
      configuredUrl ||
      this.getPaymentRedirectBaseUrl(configKey, fallbackPath);

    return this.appendQueryParams(redirectUrl, query);
  }

  private getPaymentRedirectBaseUrl(
    configKey: 'PAYOS_RETURN_URL' | 'PAYOS_CANCEL_URL',
    fallbackPath: string,
  ): string {
    if (fallbackPath.includes('://')) {
      return fallbackPath;
    }

    const redirectBaseUrl =
      this.configService.get<string>('PAYOS_REDIRECT_BASE_URL')?.trim() ||
      this.configService.get<string>('url_base_FE')?.trim() ||
      this.configService.get<string>('url_base_BE')?.trim();

    if (!redirectBaseUrl) {
      throw new InternalServerErrorException(
        `Missing payment redirect URL configuration for ${configKey}`,
      );
    }

    return `${this.normalizeUrl(redirectBaseUrl)}${fallbackPath}`;
  }

  private appendQueryParams(
    url: string,
    query: Record<string, string | number>,
  ): string {
    const separator = url.includes('?') ? '&' : '?';
    const params = Object.entries(query)
      .map(
        ([key, value]) =>
          `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`,
      )
      .join('&');

    return `${url}${separator}${params}`;
  }

  async createOSPayment(
    orderId: string,
    redirectOptions: PaymentRedirectOptions = {},
  ) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }

    const amount = Math.round(Number(order.totalAmount));
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new NotFoundException(
        `Order total amount is invalid for ${orderId}`,
      );
    }

    const orderCode = await this.generateUniqueOrderCode();

    const paymentRecord = this.paymentsRepository.create({
      orderId,
      orderCode,
      paymentMethod: 'PAYOS',
      transactionCode: null,
      amount,
      paymentStatus: 'PENDING',
      paidAt: null,
    });

    await this.paymentsRepository.save(paymentRecord);

    const returnUrl = this.getPaymentRedirectUrl(
      'PAYOS_RETURN_URL',
      '/successfulpayment',
      { status: 'success', orderId, orderCode },
      redirectOptions.returnUrl,
    );
    const cancelUrl = this.getPaymentRedirectUrl(
      'PAYOS_CANCEL_URL',
      '/payment/cancel',
      { status: 'cancel', orderId, orderCode },
      redirectOptions.cancelUrl,
    );

    const paymentLink = await this.payOS.paymentRequests.create({
      orderCode,
      amount,
      description: `ORDER-${String(orderId).replace(/-/g, '').slice(-6)}`,
      returnUrl,
      cancelUrl,
    });

    return {
      success: true,
      orderId,
      orderCode,
      amount,
      paymentAmountSource: 'orders.totalAmount',
      checkoutUrl: paymentLink.checkoutUrl,
      paymentLinkId: paymentLink.paymentLinkId,
    };
  }

  async retryPayment(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      select: { id: true, status: true },
    });

    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }

    if (order.status === 'CANCELLED' || order.status === 'DELIVERED') {
      throw new BadRequestException(
        `Cannot retry payment for order with status ${order.status}`,
      );
    }

    const paidPayment = await this.paymentsRepository.findOne({
      where: { orderId, paymentStatus: 'PAID' },
    });

    if (paidPayment) {
      throw new BadRequestException('Order has already been paid');
    }

    return this.createOSPayment(orderId);
  }

  verifyPaymentWebhookWithSDK(body: Record<string, unknown>): {
    orderCode: number;
    reference: string | null;
  } {
    try {
      const { data, signature } = body;

      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        throw new Error('Missing webhook data');
      }

      const webhookData = data as Record<string, unknown>;
      const sortedKeys = Object.keys(webhookData).sort();

      const signDataString = sortedKeys
        .map((key) => `${key}=${this.normalizeValue(webhookData[key])}`)
        .join('&');

      const checksumKey =
        this.configService.get<string>('PAYOS_CHECKSUM_KEY') ?? '';

      if (!checksumKey) {
        throw new Error('Missing PAYOS_CHECKSUM_KEY');
      }

      const calculatedSignature = createHmac('sha256', checksumKey)
        .update(signDataString)
        .digest('hex');

      const receivedSignature = typeof signature === 'string' ? signature : '';

      // ✅ timing-safe compare
      const isValid =
        calculatedSignature.length === receivedSignature.length &&
        timingSafeEqual(
          Buffer.from(calculatedSignature),
          Buffer.from(receivedSignature),
        );

      if (!isValid) {
        throw new Error('Signature mismatch');
      }

      const orderCode = Number(webhookData.orderCode);
      if (!Number.isFinite(orderCode)) {
        throw new Error('Invalid orderCode');
      }

      const rawReference = webhookData.reference;
      const reference =
        typeof rawReference === 'string'
          ? rawReference
          : rawReference == null
            ? null
            : JSON.stringify(rawReference);

      return { orderCode, reference };
    } catch {
      throw new HttpException(
        'Invalid Webhook Signature',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async processSuccessfulPayment(orderCode: number, reference: string | null) {
    const payment = await this.paymentsRepository.findOne({
      where: { orderCode },
    });

    if (!payment) {
      return { success: false, message: 'Payment record not found' };
    }

    const order = await this.orderRepository.findOne({
      where: { id: payment.orderId },
      select: { id: true, status: true },
    });

    if (!order) {
      return { success: false, message: 'Order record not found' };
    }

    if (order.status !== 'PENDING') {
      return {
        success: true,
        message: `Payment webhook ignored because order is already ${order.status}`,
      };
    }

    if (payment.paymentStatus !== 'PAID') {
      payment.paymentStatus = 'PAID';
      payment.transactionCode = reference ?? payment.transactionCode;
      payment.paidAt = new Date();
      payment.paymentMethod ??= 'BANKING';

      await this.paymentsRepository.save(payment);
    }

    return {
      success: true,
      message:
        'Payment marked as paid. Order is still pending staff confirmation.',
      orderId: payment.orderId,
      orderStatus: order.status,
      paymentStatus: payment.paymentStatus,
    };
  }

  private async getPaymentLinkInfoSafe(
    orderCode: number,
  ): Promise<PayOSPaymentLinkInfo> {
    const raw = await this.payOS.paymentRequests.get(orderCode);

    if (!raw || typeof raw !== 'object') {
      throw new Error('Invalid PayOS response');
    }

    const data = raw as Record<string, unknown>;

    const orderCodeParsed = Number(data.orderCode);
    const amount = Number(data.amount);
    const amountPaid = Number(data.amountPaid);
    const amountRemaining = Number(data.amountRemaining);

    if (
      !Number.isFinite(orderCodeParsed) ||
      !Number.isFinite(amount) ||
      !Number.isFinite(amountPaid) ||
      !Number.isFinite(amountRemaining)
    ) {
      throw new Error('Invalid numeric data from PayOS');
    }

    const statusRaw = data.status;

    if (
      statusRaw !== 'PAID' &&
      statusRaw !== 'PENDING' &&
      statusRaw !== 'CANCELLED'
    ) {
      throw new Error('Invalid status from PayOS');
    }

    return {
      orderCode: orderCodeParsed,
      amount,
      status: statusRaw,
      amountPaid,
      amountRemaining,
    };
  }

  async getPaymentStatus(orderCode: number) {
    try {
      const paymentLinkInfo = await this.getPaymentLinkInfoSafe(orderCode);

      return {
        success: true,
        data: paymentLinkInfo,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      throw new HttpException(
        `Không thể lấy trạng thái thanh toán từ PayOS: ${errorMessage}`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async handlePaymentCallback(body: Record<string, unknown>) {
    const { orderCode, reference } = this.verifyPaymentWebhookWithSDK(body);
    return this.processSuccessfulPayment(orderCode, reference);
  }

  async getInformationPayment(orderCode: number) {
    const parsedOrderCode = Number(orderCode);

    if (!Number.isFinite(parsedOrderCode)) {
      throw new HttpException(
        'Mã orderCode không hợp lệ!',
        HttpStatus.BAD_REQUEST,
      );
    }

    const payment = await this.paymentsRepository.findOne({
      where: { orderCode: parsedOrderCode },
    });

    if (!payment) {
      throw new NotFoundException(
        `Payment with orderCode ${parsedOrderCode} not found`,
      );
    }

    return { success: true, data: payment };
  }

  private async generateUniqueOrderCode(): Promise<number> {
    for (let attempt = 0; attempt < MAX_GENERATE_ATTEMPTS; attempt += 1) {
      const orderCode =
        MIN_ORDER_CODE +
        Math.floor(
          Math.random() * (MAX_INTEGER_ORDER_CODE - MIN_ORDER_CODE + 1),
        );

      const existing = await this.paymentsRepository.findOne({
        where: { orderCode },
        select: { id: true },
      });

      if (!existing) return orderCode;
    }

    throw new InternalServerErrorException(
      'Unable to generate unique orderCode',
    );
  }
}
