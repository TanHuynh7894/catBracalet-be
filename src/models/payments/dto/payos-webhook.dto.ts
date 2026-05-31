import { ApiProperty } from '@nestjs/swagger';

export class PayOSWebhookDataDto {
  @ApiProperty({ example: 1234567890 })
  orderCode: number;

  @ApiProperty({ example: 3000000 })
  amount: number;

  @ApiProperty({ example: 'ORDER-ABC123' })
  description: string;

  @ApiProperty({ example: '9704' })
  accountNumber: string;

  @ApiProperty({ example: 'FT25123456789012' })
  reference: string;

  @ApiProperty({ example: '2026-06-01 12:00:00' })
  transactionDateTime: string;

  @ApiProperty({ example: 'VND' })
  currency: string;

  @ApiProperty({ example: 'b0b95f57a4ce4d7f95fc5c1ff3a9e73d' })
  paymentLinkId: string;

  @ApiProperty({ example: '00' })
  code: string;

  @ApiProperty({ example: 'success' })
  desc: string;
}

export class PayOSWebhookDto {
  @ApiProperty({ example: '00' })
  code: string;

  @ApiProperty({ example: 'success' })
  desc: string;

  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: PayOSWebhookDataDto })
  data: PayOSWebhookDataDto;

  @ApiProperty({
    example: '8d8640d802576397a1ce45ebda7f835055768ac7ad2e0bfb77f9b8f12cca4c7f',
  })
  signature: string;
}
