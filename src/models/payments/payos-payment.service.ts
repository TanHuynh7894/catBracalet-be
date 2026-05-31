import { Injectable } from '@nestjs/common';
import { PaymentsService } from './payments.service';

@Injectable()
export class PayosPaymentService {
  constructor(private readonly paymentsService: PaymentsService) {}

  async createPaymentLink(orderId: string) {
    return this.paymentsService.createOSPayment(orderId);
  }

  async getPaymentStatus(orderCode: number) {
    return this.paymentsService.getPaymentStatus(orderCode);
  }

  async getInformationPayment(orderCode: number) {
    return this.paymentsService.getInformationPayment(orderCode);
  }

  async handleWebhook(body: unknown) {
    return this.paymentsService.handlePaymentCallback(body);
  }
}
