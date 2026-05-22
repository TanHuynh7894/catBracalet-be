import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator';

export enum ReviewStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateReviewDto {
  @ApiProperty({
    description: 'The user UUID who writes the review',
    example: '7b66cc26-8918-4a41-b31f-e60d3f8f2d65',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'The product UUID being reviewed',
    example: 'f4e560f1-7f09-49e4-bc79-cf0ef4cdbbb6',
  })
  @IsUUID()
  productId: string;

  @ApiPropertyOptional({
    description: 'Rating score from 1 to 5',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    description: 'User comment for the product',
    example: 'Great quality, exactly as expected.',
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
