import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateVipLevelDto {
  @ApiProperty({ example: 'GOLD', description: 'The name of the VIP level' })
  @IsNotEmpty()
  @IsString()
  levelName: string;

  @ApiProperty({
    example: 5000000,
    description: 'Minimum spending to reach this level',
  })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  minSpending: number;

  @ApiProperty({
    example: 10,
    description: 'Discount percentage for this level',
  })
  @Type(() => Number)
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  discountPercent: number;

  @ApiProperty({
    example: 'Free shipping, priority support',
    description: 'Benefits of this level',
    required: false,
  })
  @IsOptional()
  @IsString()
  benefits?: string;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Status of the level',
    required: false,
  })
  @IsOptional()
  @IsString()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;
}
