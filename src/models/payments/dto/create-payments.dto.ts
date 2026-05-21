import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentsDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'The ID of the order' })
  orderId: string;

  @ApiProperty({ example: 'CREDIT_CARD', description: 'The payment method (e.g., CREDIT_CARD, PAYPAL)' })
  paymentMethod: string;

  @ApiProperty({ example: 'TXN123456789', description: 'The transaction code from the payment provider', required: false })
  transactionCode?: string;

  @ApiProperty({ example: 150.50, description: 'The amount paid' })
  amount: number;

  @ApiProperty({ example: 'PENDING', description: 'The status of the payment', required: false })
  paymentStatus?: string;

  @ApiProperty({ example: '2026-06-01T12:00:00Z', description: 'The time the payment was made', required: false })
  paidAt?: Date;
}
