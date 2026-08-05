import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateShipmentDto {
  @ApiProperty({
    example: '9076656c-849a-4939-b9ba-8a81d8fbc151', 
    description: 'Order ID in the database to create shipment',
  })
  @IsUUID()
  orderId: string;
}
