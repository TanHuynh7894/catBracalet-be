import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsUUID } from 'class-validator';
import { UploadImageType } from '../../../helpers/upload-image.helper';

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
    description: 'Upload type: P for product, A for avatar',
    enum: UploadImageType,
    example: UploadImageType.PRODUCT,
  })
  @IsEnum(UploadImageType)
  @IsNotEmpty()
  type: UploadImageType;
}