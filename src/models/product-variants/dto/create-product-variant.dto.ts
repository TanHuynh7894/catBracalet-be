import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export enum ProductVariantStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateProductVariantDto {
  @ApiProperty({
    description: 'The SKU of the variant',
    example: 'CB-PRM-BLK-S',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  sku: string;

  @ApiPropertyOptional({
    description: 'Variant size',
    example: 'S',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  size?: string;

  @ApiPropertyOptional({
    description: 'Variant color',
    example: 'Black',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  color?: string;

  @ApiPropertyOptional({
    description: 'Stock quantity',
    example: 20,
    default: 0,
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
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  extraPrice?: number;
}
