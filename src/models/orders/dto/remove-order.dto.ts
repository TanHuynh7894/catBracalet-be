import { ApiProperty } from '@nestjs/swagger';

export class RemoveOrderDto {
  @ApiProperty({
    description: 'ID của Order cần xóa',
    example: 'd3b07384-d113-4956-b5e1-16b7f3d8a69d',
  })
  orderId: string;
}
