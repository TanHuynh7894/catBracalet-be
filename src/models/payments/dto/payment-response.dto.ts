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
  @ApiProperty()
  success: boolean;

  @ApiProperty()
  orderCode: number;

  @ApiProperty()
  paymentStatus: string;

  @ApiProperty({ nullable: true, type: String })
  paidAt: Date | null;

  @ApiProperty()
  amount: number;

  @ApiProperty({ nullable: true })
  transactionCode: string | null;
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
