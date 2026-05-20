import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID, MaxLength } from 'class-validator';

export enum ProductImageStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateProductImageDto {
  @ApiProperty({
    description: 'The product UUID for this image',
    example: '90d9d3de-9e38-4d45-bc8a-4de847f9d739',
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'The URL of the product image',
    example: 'https://example.com/images/product-1.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  imageUrl: string;
}