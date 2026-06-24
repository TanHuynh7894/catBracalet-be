import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class ListShopOptionsDto {
  @ApiProperty({
    example: '09047a40-bc72-4b06-abf8-9a82682478fe',
    description:
      'Active user address id used to list active shop shipping options',
  })
  @IsUUID()
  addressId: string;
}
