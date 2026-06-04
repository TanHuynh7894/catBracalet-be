import { Type } from 'class-transformer';
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
      'c39b8214-41d3-4a1e-8f55-123456789abc'
    ],
    type: [String], // Khai báo kiểu mảng string cho Swagger nhận diện
  })
  @IsOptional()
  @IsArray({ message: 'materialIds phải là một mảng danh sách!' })
  @IsUUID('all', { each: true, message: 'Mỗi kí tự trong mảng phải là định dạng UUID hợp lệ!' })
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
    description: 'The thumbnail URL of the product',
    example: 'https://example.com/images/cat-bracelet.jpg',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  thumbnail?: string;
}