import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CalculateAddressFeeDto {
  @ApiProperty({
    example: '09047a40-bc72-4b06-abf8-9a82682478fe',
    description: 'User address id selected for shipping fee calculation',
  })
  @IsUUID()
  addressId: string;
}
