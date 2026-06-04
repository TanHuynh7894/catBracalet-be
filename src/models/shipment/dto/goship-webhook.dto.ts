import { ApiProperty } from '@nestjs/swagger';

export class GoshipWebhookDataDto {
  @ApiProperty({ example: 'GHN001', description: 'Mã vận đơn của hãng ship' })
  id: string; // Mã vận đơn thực tế (tracking_code)

  @ApiProperty({ example: '9076656c-849a-4939-b9ba-8a81d8fbc151' })
  order_id: string; // ID đơn hàng phía Web của ông

  @ApiProperty({ example: 500, description: 'Mã trạng thái từ Goship' })
  status: number;

  @ApiProperty({
    example: 'DELIVERING',
    description: 'Text trạng thái trực quan',
  })
  status_text: string;

  @ApiProperty({ example: 'GHN', description: 'Tên đối tác vận chuyển' })
  carrier_name: string;
}

export class GoshipWebhookDto {
  @ApiProperty({ type: GoshipWebhookDataDto })
  data: GoshipWebhookDataDto;
}
