import { IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
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

  @ApiProperty({
    description:
      'Danh sach cart_item_id muon thanh toan. Bo trong de thanh toan toan bo gio hang.',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  cartItemIds?: string[];
}
