import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export enum CategoryStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateCategoryDto {
  @ApiProperty({
    description: 'The name of the category',
    example: 'Accessories',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  categoryName: string;

  @ApiPropertyOptional({
    description: 'The description of the category',
    example: 'Collection for cat accessories',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
