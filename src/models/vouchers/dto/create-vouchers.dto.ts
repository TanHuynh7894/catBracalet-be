import { IsString, IsNumber, IsEnum, IsInt, IsDateString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateVouchersDto {
  @ApiProperty({
    example: 'SUMMER2026',
    description: 'Mã voucher',
  })
  @IsString()
  code: string;

  @ApiProperty({ example: 15.5, description: 'Giá trị giảm' })
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiProperty({
    example: 'PERCENT',
    description: 'Loại giảm giá (PERCENT hoặc FIXED)',
    enum: ['PERCENT', 'FIXED'],
  })
  @IsEnum(['PERCENT', 'FIXED'], {
    message: 'discountType phải là PERCENT hoặc FIXED',
  })
  discountType: string;

  @ApiProperty({
    example: 100,
    description: 'Số lượng voucher',
  })
  @IsInt()
  @Min(0)
  quantity: number;

  @ApiProperty({
    example: '2026-06-01T00:00:00Z',
    description: 'Ngày bắt đầu',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    example: '2026-06-30T23:59:59Z',
    description: 'Ngày kết thúc',
  })
  @IsDateString()
  endDate: string;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Trạng thái voucher',
    required: false,
    enum: ['ACTIVE', 'INACTIVE'],
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: string;
}
