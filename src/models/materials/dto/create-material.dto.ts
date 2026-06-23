import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export enum MaterialStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

export class CreateMaterialDto {
  @ApiProperty({
    description: 'The name of the material',
    example: 'Leather',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  materialName: string;

  @ApiPropertyOptional({
    description: 'The type of the material',
    example: 'Natural',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  materialType?: string;

  @ApiPropertyOptional({
    description: 'The color of the material',
    example: 'Brown',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  color?: string;
}
