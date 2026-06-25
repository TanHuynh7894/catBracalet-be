import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class UpdateShopInventoryDto {
  @ApiProperty({
    example: 10,
    description: 'Available stock quantity for this variant at the shop',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  stockQuantity: number;
}
