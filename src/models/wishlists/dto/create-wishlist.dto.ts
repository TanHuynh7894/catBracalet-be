import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateWishlistDto {
  @ApiProperty({
    description: 'The user UUID that owns the wishlist item',
    example: 'c7220df3-9cd2-4f99-bc5e-75d9b313e83d',
  })
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'The product UUID added to wishlist',
    example: 'd0d822eb-6eb1-4d88-8e2f-e24557f96f4d',
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({
    description: 'Quantity of the product in wishlist',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity?: number;
}
