import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CheckoutDto {
  @ApiProperty({ description: 'ID của người dùng thực hiện thanh toán' })
  @IsUUID()
  userId: string;

  @ApiProperty({ description: 'ID của địa chỉ giao hàng' })
  @IsUUID()
  addressId: string;

  @ApiProperty({ description: 'Mã giảm giá (nếu có)', required: false })
  @IsOptional()
  @IsString()
  voucherCode?: string;
}
