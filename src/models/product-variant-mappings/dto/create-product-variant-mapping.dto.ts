import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class CreateProductVariantMappingDto {
  @ApiProperty({
    description: 'The product UUID to link',
    example: '90d9d3de-9e38-4d45-bc8a-4de847f9d739',
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'The product variant UUID to link',
    example: 'ddc59d72-8d89-4b9f-8c3e-b3b2b3290ef5',
  })
  @IsUUID()
  @IsNotEmpty()
  variantId: string;
}
