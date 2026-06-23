import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class CalculateAddressFeeDto {
  @ApiProperty({
    example: '2d3dbd2f-b08f-4d7a-89db-9c2f40f31c98',
    description:
      'User id used to read cart items and select the nearest shop with enough inventory',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  userId?: string;

  @ApiProperty({
    example: '09047a40-bc72-4b06-abf8-9a82682478fe',
    description: 'User address id selected for shipping fee calculation',
  })
  @IsUUID()
  addressId: string;

  @ApiProperty({
    example: [
      'a9f3df22-bf0d-4cab-a34c-dfdfb9cb0801',
      '8bd61567-12b8-41f0-bdf0-efadcbaf96aa',
    ],
    description:
      'Cart item ids to estimate. Omit this field to estimate the whole cart.',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  cartItemIds?: string[];
}
