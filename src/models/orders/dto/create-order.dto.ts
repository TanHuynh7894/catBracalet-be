import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateOrderItemDto } from './create-order-item.dto';
import { Type } from 'class-transformer';
import { IsIn, IsOptional, ValidateNested } from 'class-validator';
import { ORDER_STATUSES } from '../constants/order-status.constants';
import type { OrderStatus } from '../constants/order-status.constants';

export class CreateOrderDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'The user ID associated with the order',
  })
  userId: string;

  @ApiProperty({
    example: '987e6543-e21b-12d3-a456-426614174111',
    description: 'The address ID for the order',
  })
  addressId: string;

  @ApiPropertyOptional({
    example: 'vch-001',
    description: 'The voucher ID applied to the order',
  })
  voucherId?: string;

  @ApiProperty({ example: 100.5, description: 'The total amount of the order' })
  totalAmount: number;

  @ApiPropertyOptional({
    example: 'PENDING',
    description: 'The status of the order',
    enum: ORDER_STATUSES,
  })
  @IsOptional()
  @IsIn(ORDER_STATUSES)
  status?: OrderStatus;

  @ApiPropertyOptional({ type: [CreateOrderItemDto] })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items?: CreateOrderItemDto[];
}
