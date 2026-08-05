import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateProductDto {
  @ApiPropertyOptional({
    description: 'The category UUID of the product',
    example: '6f9c4b1a-b5c2-4d96-9a2f-4b327cf0d917',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({
    description: 'The list of material UUIDs associated with the product',
    example: [
      '8fe51f4d-e889-4fda-86ad-d1d3cae6d6a9',
      'c39b8214-41d3-4a1e-8f55-123456789abc',
    ],
    type: [String],
  })
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;

    if (
      typeof value === 'string' &&
      value.trim().startsWith('[') &&
      value.trim().endsWith(']')
    ) {
      try {
        return JSON.parse(value);
      } catch {
        return [];
      }
    }

    if (typeof value === 'string' && value.includes(',')) {
      return value.split(',').map((id) => id.trim());
    }

    if (typeof value === 'string') {
      return [value.trim()];
    }

    return value;
  })
  @IsOptional()
  @IsArray({ message: 'materialIds phải là một mảng danh sách!' })
  @IsUUID('all', {
    each: true,
    message: 'Mỗi phần tử trong mảng phải là định dạng UUID hợp lệ!',
  })
  materialIds?: string[];

  @ApiProperty({
    description: 'The name of the product',
    example: 'Cat Bracelet Premium',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  productName: string;

  @ApiPropertyOptional({
    description: 'The description of the product',
    example: 'Handmade bracelet for cat lovers',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'The base price of the product',
    example: 199000,
  })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({
    type: 'string',
    format: 'binary', 
    description: 'Ảnh đại diện của sản phẩm (Upload tệp ảnh)',
  })
  @IsOptional()
  thumbnail?: any;

  @ApiProperty({
    description: 'Loại upload dữ liệu (P: Product, A: Avatar)',
    example: 'P',
  })
  @IsString()
  @IsNotEmpty()
  type: string;
}
