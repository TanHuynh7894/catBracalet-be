import { ApiProperty } from '@nestjs/swagger';

export class CreatePaymentResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ format: 'uuid' })
  orderId: string;

  @ApiProperty()
  orderCode: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  checkoutUrl: string;

  @ApiProperty()
  paymentLinkId: string;
}

export class BasicSuccessResponseDto {
  @ApiProperty()
  success: boolean;
}

export class PaymentRedirectResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  message: string;

  @ApiProperty({ required: false, type: Object })
  data?: Record<string, string>;
}

export class PaymentStatusResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: 123456 })
  orderCode: number;

  @ApiProperty({
    example: 'PENDING',
    description: 'PAID, PENDING, CANCELLED,...',
  })
  paymentStatus: string;

  @ApiProperty({
    nullable: true,
    type: String,
    example: '2026-06-01T12:00:00.000Z',
  })
  paidAt: Date | null;

  @ApiProperty({ example: 50000 })
  amount: number;

  @ApiProperty({ nullable: true, example: 'FTX123456' })
  transactionCode: string | null;

  @ApiProperty({ example: 0, description: 'Số tiền khách đã thanh toán' })
  amountPaid: number;

  @ApiProperty({
    example: 50000,
    description: 'Số tiền còn lại cần thanh toán',
  })
  amountRemaining: number;
}

export class PaymentDataDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({ format: 'uuid' })
  orderId: string;

  @ApiProperty({ nullable: true })
  orderCode: number | null;

  @ApiProperty()
  paymentMethod: string;

  @ApiProperty({ nullable: true })
  transactionCode: string | null;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  paymentStatus: string;

  @ApiProperty({ nullable: true, type: String })
  paidAt: Date | null;
}

export class PaymentInfoResponseDto {
  @ApiProperty()
  success: boolean;

  @ApiProperty({ type: PaymentDataDto })
  data: PaymentDataDto;
}
