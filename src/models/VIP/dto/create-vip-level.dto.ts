import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateVipLevelDto {
  @ApiProperty({ example: 'GOLD', description: 'The name of the VIP level' })
  @IsNotEmpty()
  @IsString()
  levelName: string;

  @ApiProperty({
    example: 5000000,
    description: 'Minimum spending to reach this level',
  })
  @IsNotEmpty()
  @IsNumber()
  minSpending: number;

  @ApiProperty({
    example: 10,
    description: 'Discount percentage for this level',
  })
  @IsNotEmpty()
  @IsNumber()
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
  status?: string;
}

