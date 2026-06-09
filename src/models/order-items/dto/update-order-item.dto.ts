import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateOrderItemDto {
  @ApiPropertyOptional({ example: 2, description: 'So luong moi cua item' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number;

  @ApiPropertyOptional({ example: 49.99, description: 'Don gia moi cua item' })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  unitPrice?: number;

  @ApiPropertyOptional({
    example: 'Cat Bracelet Silver',
    description: 'Ten san pham snapshot tren don hang',
  })
  @IsOptional()
  @IsString()
  productName?: string;
}
