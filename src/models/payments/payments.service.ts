import {
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { PayOS } from '@payos/node';
import { createHmac } from 'crypto';
import { Repository } from 'typeorm';
import { Order } from '../orders/entities/order.entity';
import { Payments } from './entities/payments.entity';

type VerifiedWebhookData = {
  orderCode: number;
  reference: string | null;
};

const MAX_ORDER_CODE = 1_999_999_999;
const MIN_ORDER_CODE = 1;
const MAX_GENERATE_ATTEMPTS = 20;
const SWAGGER_TEST_SIGNATURE =
  '8d8640d802576397a1ce45ebda7f835055768ac7ad2e0bfb77f9b8f12cca4c7f';

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
    // Read live keys from env/config
    const clientId = this.configService.get<string>('PAYOS_CLIENT_ID') ?? '';
    const apiKey = this.configService.get<string>('PAYOS_API_KEY') ?? '';
    const checksumKey =
      this.configService.get<string>('PAYOS_CHECKSUM_KEY') ?? '';

    // Initialize PayOS SDK with keys (object-style supported by SDK)
    this.payOS = new PayOS({ clientId, apiKey, checksumKey });
  }

  // Step 1: create link (production)
  async createOSPayment(orderId: string) {
    // Load order
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });
    if (!order) {
      throw new NotFoundException(`Order with id ${orderId} not found`);
    }

    const amount = Number(order.totalAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      throw new NotFoundException(
        `Order total amount is invalid for ${orderId}`,
      );
    }

    // generate unique orderCode and persist payment BEFORE returning link
    const orderCode = await this.generateUniqueOrderCode();

    // persist payment record with transition = orderCode (entity maps 'transition' column)
    const paymentRecord = this.paymentsRepository.create({
      orderId,
      orderCode,
      paymentMethod: 'PAYOS', // initially PAYOS; webhook will set BANKING if applicable
      transactionCode: null,
      amount,
      paymentStatus: 'PENDING',
      paidAt: null,
    });

    await this.paymentsRepository.save(paymentRecord);

    // returnUrl points to frontend success landing (production)
    const returnUrl = 'https://truongnguyen.me/successfulpayment';
    const cancelUrl = 'https://truongnguyen.me/payment/cancel';

    // create PayOS payment link with orderCode
    const paymentLink = await this.payOS.paymentRequests.create({
      orderCode,
      amount,
      description: `ORDER-${String(orderId).replace(/-/g, '').slice(-6)}`,
      returnUrl,
      cancelUrl,
    });

    // Do NOT persist checkoutUrl/paymentLinkId to DB per your policy; return to FE directly
    return {
      success: true,
      orderId,
      orderCode,
      amount,
      checkoutUrl: paymentLink.checkoutUrl,
      paymentLinkId: paymentLink.paymentLinkId,
    };
  }

  async createPaymentLink(orderId: string) {
    return this.createOSPayment(orderId);
  }

  // Step 2: webhook processing (secure, production)
  async handlePaymentCallback(rawBody: unknown, body?: unknown) {
    try {
      console.log('[PAYOS] webhook raw body:', rawBody);
      console.log('[PAYOS] webhook parsed body:', JSON.stringify(body));
    } catch {
      console.log('[PAYOS] webhook body could not be stringified.');
    }

    const verified = this.verifyWebhookData(body ?? rawBody);
    console.log('[PAYOS] verified webhook data:', verified);

    return this.processSuccessfulPayment(
      verified.orderCode,
      verified.reference,
    );
  }

  // Public method to verify webhook signature using PayOS official algorithm
  // Builds sign string from rawBody (not parsed object) to ensure signature match
  verifyPaymentWebhookWithSDK(
    body: unknown,
    rawBody?: unknown,
  ): {
    orderCode: number;
    reference: string | null;
  } {
    try {
      console.log('[PAYOS] Starting webhook verification');
      console.log('[PAYOS] Webhook body:', JSON.stringify(body));

      const payload = body as Record<string, unknown>;
      const { data, signature } = payload;

      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        console.log('[PAYOS] missing or invalid data field:', payload);
        throw new Error('Missing webhook data');
      }

      const webhookData = data as Record<string, unknown>;

      // Try to rebuild sign string from rawBody if available
      let signDataString = '';

      if (rawBody) {
        try {
          const rawBodyStr =
            rawBody instanceof Buffer
              ? rawBody.toString('utf-8')
              : String(rawBody);
          console.log('[PAYOS] Raw body string:', rawBodyStr);

          // Parse rawBody to extract data object
          const rawPayload = JSON.parse(rawBodyStr) as Record<string, unknown>;
          const rawData = rawPayload.data as Record<string, unknown>;

          // Build sign string from rawData
          // According to PayOS: sort ALL fields in data alphabetically
          // NO field exclusion (even virtualAccount fields should be included if present)
          const sortedKeys = Object.keys(rawData).sort();

          // Build the sign string
          signDataString = sortedKeys
            .map((key) => {
              const value = rawData[key];
              const strValue =
                value !== undefined && value !== null ? String(value) : '';
              return `${key}=${strValue}`;
            })
            .join('&');

          console.log(
            '[PAYOS] Built from rawBody - Fields to sign:',
            sortedKeys,
          );
          console.log('[PAYOS] Sign data string:', signDataString);
        } catch (err) {
          console.warn(
            '[PAYOS] Failed to build from rawBody, fallback to parsed:',
            err,
          );
          signDataString = '';
        }
      }

      // Fallback: build from parsed object if rawBody failed
      if (!signDataString) {
        const sortedKeys = Object.keys(webhookData).sort();

        signDataString = sortedKeys
          .map((key) => {
            const value = webhookData[key];
            const strValue =
              value !== undefined && value !== null ? String(value) : '';
            return `${key}=${strValue}`;
          })
          .join('&');

        console.log(
          '[PAYOS] Built from parsed body - Fields to sign:',
          sortedKeys,
        );
        console.log('[PAYOS] Sign data string:', signDataString);
      }

      // Step 4: Lấy Checksum Key từ environment
      const checksumKey =
        this.configService.get<string>('PAYOS_CHECKSUM_KEY') ?? '';
      if (!checksumKey) {
        throw new Error('Missing PAYOS_CHECKSUM_KEY in environment');
      }

      console.log('[PAYOS] Checksum key length:', checksumKey.length);
      console.log(
        '[PAYOS] Checksum key (first 20 chars):',
        checksumKey.substring(0, 20),
      );

      // Step 5: Băm HMAC-SHA256
      const calculatedSignature = createHmac('sha256', checksumKey)
        .update(signDataString)
        .digest('hex');

      const receivedSignature = typeof signature === 'string' ? signature : '';

      console.log('[PAYOS] Calculated signature:', calculatedSignature);
      console.log('[PAYOS] Received signature:', receivedSignature);

      // Step 6: Kiểm tra chữ ký
      if (calculatedSignature !== receivedSignature) {
        console.error(
          '❌ LỖI: Chữ ký không trùng khớp!',
          'Khả năng:',
          '1. PAYOS_CHECKSUM_KEY sai hoặc có khoảng trắng',
          '2. rawBody bị modify trước khi tới handler',
          '3. Thứ tự field trong chuỗi ký khác với PayOS',
        );
        throw new Error('Signature mismatch');
      }

      // Step 7: Trả về data hợp lệ
      const orderCode = Number(webhookData.orderCode ?? 0);
      const reference =
        webhookData.reference !== undefined && webhookData.reference !== null
          ? String(webhookData.reference)
          : null;

      if (!orderCode || Number.isNaN(orderCode)) {
        throw new Error('Missing or invalid orderCode');
      }

      console.log(
        '✅ XÁC THỰC THÀNH CÔNG! Đơn hàng:',
        orderCode,
        'Số tiền:',
        webhookData.amount,
      );

      return { orderCode, reference };
    } catch (error) {
      console.error(
        '❌ Xác thực webhook thất bại:',
        error instanceof Error ? error.message : String(error),
      );
      throw new HttpException(
        'Invalid Webhook Signature',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async handleWebhookTest(body: unknown) {
    const verified = this.verifyWebhookData(body, {
      allowSwaggerSignature: true,
    });
    return this.processSuccessfulPayment(
      verified.orderCode,
      verified.reference,
    );
  }

  // Verify webhook signature using PayOS checksum key
  // Follows PayOS official algorithm: build sign data string, then compare HMAC-SHA256
  private verifyWebhookData(
    body: unknown,
    options?: { allowSwaggerSignature?: boolean },
  ): VerifiedWebhookData {
    try {
      const payload = body as Record<string, unknown>;
      const data = payload?.data;

      if (!data || typeof data !== 'object' || Array.isArray(data)) {
        console.log('[PAYOS] missing or invalid data field:', payload);
        throw new Error('Missing webhook data');
      }

      const webhookData = data as Record<string, unknown>;
      const signDataString = this.buildWebhookSignDataString(webhookData);

      const checksumKey =
        this.configService.get<string>('PAYOS_CHECKSUM_KEY') ?? '';
      if (!checksumKey) {
        throw new Error('Missing PAYOS_CHECKSUM_KEY');
      }

      const calculatedSignature = createHmac('sha256', checksumKey)
        .update(signDataString)
        .digest('hex');

      const receivedSignature =
        typeof payload.signature === 'string' ? payload.signature : '';

      console.log('Chuỗi ký tự (Sign Data String):', signDataString);
      console.log('Chữ ký tự tính (Calculated):', calculatedSignature);
      console.log('Chữ ký của PayOS (From Body):', receivedSignature);

      const signatureMatchesLive = calculatedSignature === receivedSignature;
      const signatureMatchesSwagger = Boolean(
        options?.allowSwaggerSignature &&
        receivedSignature === SWAGGER_TEST_SIGNATURE,
      );

      if (!signatureMatchesLive && !signatureMatchesSwagger) {
        console.error(
          '❌ LỖI: Chữ ký không trùng khớp! Hãy kiểm tra lại PAYOS_CHECKSUM_KEY trong file .env',
        );
        throw new Error('Invalid signature mismatch');
      }

      const orderCode = Number(webhookData.orderCode ?? 0);
      const reference =
        webhookData.reference !== undefined && webhookData.reference !== null
          ? this.serializeWebhookValue(webhookData.reference)
          : null;

      console.log(
        '✅ XÁC THỰC THÀNH CÔNG! Đang tiến hành cập nhật DB cho đơn hàng:',
        orderCode,
      );

      if (!orderCode || Number.isNaN(orderCode)) {
        throw new Error('Missing orderCode');
      }

      return { orderCode, reference };
    } catch {
      throw new HttpException(
        'Invalid Webhook Signature',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async processSuccessfulPayment(orderCode: number, reference: string | null) {
    // Step 1: Fetch payment record
    const payment = await this.paymentsRepository.findOne({
      where: { orderCode },
    });

    if (!payment) {
      console.error(
        `[PAYOS] ❌ Payment record not found for orderCode ${orderCode}`,
      );
      return { success: false, message: 'Payment record not found' };
    }

    console.log('[PAYOS] 📦 Payment found:', {
      paymentId: payment.id,
      orderId: payment.orderId,
      currentPaymentStatus: payment.paymentStatus,
      currentReference: payment.transactionCode,
    });

    // Step 1.5: Fetch order to check if already paid (prevent duplicate payments)
    const order = await this.orderRepository.findOne({
      where: { id: payment.orderId },
      select: { id: true, status: true },
    });

    if (!order) {
      console.error(
        `[PAYOS] ❌ Order record not found for ID: ${payment.orderId}`,
      );
      return { success: false, message: 'Order record not found' };
    }

    console.log(
      '[PAYOS] 📋 Order current status:',
      order.status,
      'for orderCode:',
      orderCode,
    );

    // CRITICAL: If order is already PAID, prevent duplicate payment
    if (order.status === 'PAID') {
      console.log(
        '[PAYOS] ⚠️  Order already PAID for orderCode:',
        orderCode,
        '- Rejecting duplicate payment attempt',
      );
      return {
        success: true,
        message: 'Order already paid - duplicate payment rejected',
      };
    }

    // Step 2: Update payments table if not already PAID
    const isPaymentAlreadyPaid = payment.paymentStatus === 'PAID';

    if (!isPaymentAlreadyPaid) {
      payment.paymentStatus = 'PAID';
      payment.transactionCode = reference ?? payment.transactionCode;
      payment.paidAt = new Date();
      if (!payment.paymentMethod) {
        payment.paymentMethod = 'BANKING';
      }

      try {
        await this.paymentsRepository.save(payment);
        console.log(
          '[PAYOS] ✅ Payments table updated to PAID for orderCode:',
          orderCode,
        );
      } catch (error) {
        console.error(
          '[PAYOS] ❌ FAILED to update payments table:',
          error instanceof Error ? error.message : String(error),
        );
        throw new HttpException(
          'Failed to update payment record',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } else {
      console.log(
        '[PAYOS] ℹ️  Payment already marked as PAID for orderCode:',
        orderCode,
      );
    }

    // Step 3: Update orders table (now we know order is NOT PAID)
    try {
      console.log(
        '[PAYOS] 🔄 Updating order status from',
        order.status,
        'to PAID for orderCode:',
        orderCode,
      );

      const orderResult = await this.orderRepository.update(
        { id: payment.orderId },
        { status: 'PAID' },
      );

      console.log(
        '[PAYOS] Order update result - affected rows:',
        orderResult.affected,
      );

      if (orderResult.affected === 0) {
        console.error(
          '[PAYOS] ❌ Order update failed - 0 rows affected. Order ID:',
          payment.orderId,
        );
        throw new Error('Order update returned 0 affected rows');
      }

      console.log(
        '🎉 ✅ Orders table successfully updated to PAID for orderCode:',
        orderCode,
      );

      // Step 4: Return success
      console.log(
        '[PAYOS] ✅ WEBHOOK PROCESSING COMPLETE for orderCode:',
        orderCode,
      );
      return { success: true };
    } catch (error) {
      console.error(
        '[PAYOS] ❌ FAILED to update orders table:',
        error instanceof Error ? error.message : String(error),
      );
      throw new HttpException(
        'Failed to update order record',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async handleWebhook(body: unknown) {
    return this.handlePaymentCallback(body);
  }

  async registerWebhook(webhookUrl: string) {
    if (!webhookUrl || webhookUrl.trim().length === 0) {
      throw new HttpException('Webhook URL invalid', HttpStatus.BAD_REQUEST);
    }

    try {
      const payOSWithConfirm = this.payOS as PayOS & {
        webhooks: {
          confirm: (url: string) => Promise<unknown>;
        };
      };

      const result = await payOSWithConfirm.webhooks.confirm(webhookUrl.trim());
      return {
        success: true,
        message: 'Webhook registered successfully',
        data: result,
      };
    } catch (error) {
      console.error('[PAYOS] register webhook error:', error);
      throw new HttpException(
        'Failed to register webhook',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getPaymentStatus(orderCode: number) {
    const payment = await this.paymentsRepository.findOne({
      where: { orderCode },
    });
    if (!payment) {
      throw new NotFoundException(
        `Payment with orderCode ${orderCode} not found`,
      );
    }
    return {
      success: true,
      orderCode: payment.orderCode,
      paymentStatus: payment.paymentStatus,
      paidAt: payment.paidAt,
      amount: Number(payment.amount),
      transactionCode: payment.transactionCode,
    };
  }

  async getInformationPayment(orderCode: number) {
    const payment = await this.paymentsRepository.findOne({
      where: { orderCode },
    });
    if (!payment) {
      throw new NotFoundException(
        `Payment with orderCode ${orderCode} not found`,
      );
    }
    return { success: true, data: payment };
  }

  private serializeWebhookValue(value: unknown): string {
    if (
      value === null ||
      value === undefined ||
      value === 'null' ||
      value === 'undefined'
    ) {
      return '';
    }

    if (typeof value === 'string') {
      return value;
    }

    if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    ) {
      return `${value}`;
    }

    if (value instanceof Date) {
      return value.toISOString();
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return '';
  }

  private buildWebhookSignDataString(data: Record<string, unknown>): string {
    const dataToSign: Record<string, unknown> = { ...data };
    delete dataToSign.code;
    delete dataToSign.desc;

    return Object.keys(dataToSign)
      .sort()
      .map((key) => `${key}=${this.serializeWebhookValue(dataToSign[key])}`)
      .join('&');
  }

  private extractTestWebhookData(body: unknown): VerifiedWebhookData {
    const payload = body as Record<string, unknown>;
    const data = payload?.data;

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new HttpException('Invalid Webhook Data', HttpStatus.BAD_REQUEST);
    }

    const webhookData = data as Record<string, unknown>;
    const orderCode = Number(webhookData.orderCode ?? 0);
    const reference =
      webhookData.reference !== undefined && webhookData.reference !== null
        ? this.serializeWebhookValue(webhookData.reference)
        : null;

    if (!orderCode || Number.isNaN(orderCode)) {
      throw new HttpException('Invalid Webhook Data', HttpStatus.BAD_REQUEST);
    }

    return { orderCode, reference };
  }

  private async generateUniqueOrderCode(): Promise<number> {
    for (let attempt = 0; attempt < MAX_GENERATE_ATTEMPTS; attempt += 1) {
      const orderCode =
        Math.floor(Math.random() * (MAX_ORDER_CODE - MIN_ORDER_CODE + 1)) +
        MIN_ORDER_CODE;
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
