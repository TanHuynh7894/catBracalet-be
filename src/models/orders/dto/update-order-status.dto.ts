import { IsString, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({
    example: 'CONFIRMED',
    description: 'Trạng thái mới của đơn hàng',
    enum: ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'],
  })
  @IsString()
  @IsIn(['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED', 'CANCELLED'], {
    message:
      'Trạng thái không hợp lệ. Phải là một trong các giá trị: PENDING, CONFIRMED, SHIPPING, COMPLETED, CANCELLED',
  })
  status: string;
}
