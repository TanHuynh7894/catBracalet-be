import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum ProductVariantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateProductVariantDto {
  @ApiProperty({
    description: 'The product UUID that this variant belongs to',
    example: '6f9c4b1a-b5c2-4d96-9a2f-4b327cf0d917',
    type: String,
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'The SKU of the variant',
    example: 'CB-PRM-BLK-S',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @ApiPropertyOptional({
    description: 'Variant size',
    example: 'S',
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  size?: string;

  @ApiPropertyOptional({
    description: 'Variant color',
    example: 'Black',
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  color?: string;

  @ApiPropertyOptional({
    description: 'Stock quantity',
    example: 20,
    default: 0,
    type: Number,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(0)
  stockQuantity?: number;

  @ApiPropertyOptional({
    description: 'Extra price added to product base price',
    example: 50000,
    default: 0,
    type: Number,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  extraPrice?: number;
}