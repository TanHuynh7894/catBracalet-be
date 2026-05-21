import { ApiProperty } from '@nestjs/swagger';

export class CreateVouchersDto {
  @ApiProperty({
    example: 'SUMMER2026',
    description: 'The code of the voucher',
  })
  code: string;

  @ApiProperty({ example: 15.5, description: 'The discount value' })
  discountValue: number;

  @ApiProperty({
    example: 'PERCENT',
    description: 'The type of discount (e.g., PERCENT, FIXED)',
  })
  discountType: string;

  @ApiProperty({
    example: 100,
    description: 'The quantity of vouchers available',
  })
  quantity: number;

  @ApiProperty({
    example: '2026-06-01T00:00:00Z',
    description: 'The start date of the voucher',
  })
  startDate: Date;

  @ApiProperty({
    example: '2026-06-30T23:59:59Z',
    description: 'The end date of the voucher',
  })
  endDate: Date;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'The status of the voucher',
    required: false,
  })
  status?: string;
}
