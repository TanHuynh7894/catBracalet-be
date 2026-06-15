import { ApiProperty } from '@nestjs/swagger';

export class CreateShipmentResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({
    format: 'uuid',
    example: '1a280b97-8548-4db2-8068-9280155db512',
  })
  shipmentId: string;

  @ApiProperty({
    format: 'uuid',
    example: '9076656c-849a-4939-b9ba-8a81d8fbc151',
  })
  orderId: string;

  @ApiProperty({ example: 'GHN001' })
  trackingCode: string;

  @ApiProperty({ example: 'SHIPPING' })
  shippingStatus: string;
}
