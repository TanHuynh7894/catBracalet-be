import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export enum ProductListSortBy {
  NEWEST = 'NEWEST',
  PRICE_ASC = 'PRICE_ASC',
  PRICE_DESC = 'PRICE_DESC',
  RATING_DESC = 'RATING_DESC',
}

export class GetProductListDto {
  @ApiPropertyOptional({
    description: 'Keyword to search product name',
    example: 'bracelet',
  })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({
    description: 'Filter by category UUID',
    example: '6f9c4b1a-b5c2-4d96-9a2f-4b327cf0d917',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'Minimum final price (basePrice + extraPrice)',
    example: 100000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({
    description: 'Maximum final price (basePrice + extraPrice)',
    example: 300000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({
    description: 'Filter by variant color',
    example: 'Black',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    description: 'Filter by variant size',
    example: 'M',
  })
  @IsOptional()
  @IsString()
  size?: string;

  @ApiPropertyOptional({
    description: 'Minimum average product rating (1-5)',
    example: 4,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Sort strategy',
    enum: ProductListSortBy,
    example: ProductListSortBy.NEWEST,
  })
  @IsOptional()
  @IsEnum(ProductListSortBy)
  sortBy?: ProductListSortBy;
}
