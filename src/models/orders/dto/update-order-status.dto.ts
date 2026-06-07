import { IsIn, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ORDER_STATUSES } from '../constants/order-status.constants';
import type { OrderStatus } from '../constants/order-status.constants';

export class UpdateOrderStatusDto {
  @ApiProperty({
    example: 'CONFIRMED',
    description: 'New order status',
    enum: ORDER_STATUSES,
  })
  @IsString()
  @IsIn(ORDER_STATUSES, {
    message:
      'Invalid status. Must be one of: PENDING, CONFIRMED, SHIPPING, DELIVERED, CANCELLED',
  })
  status: OrderStatus;
}
