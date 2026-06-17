import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class CalculateAddressFeeDto {
  @ApiProperty({
    example: '09047a40-bc72-4b06-abf8-9a82682478fe',
    description: 'User address id selected for shipping fee calculation',
  })
  @IsUUID()
  addressId: string;

  @ApiProperty({
    example: '24e630a0-0f21-4254-9abe-c684db699ceb',
    description: 'Optional active shop location id selected as shipping origin',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  shopLocationId?: string;
}
