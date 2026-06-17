import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CalculateOrderRatesDto {
  @ApiProperty({
    example: 500,
    description: 'Parcel weight in grams',
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  weight?: number;

  @ApiProperty({
    example: 10,
    description: 'Parcel width in cm',
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  width?: number;

  @ApiProperty({
    example: 10,
    description: 'Parcel height in cm',
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  height?: number;

  @ApiProperty({
    example: 10,
    description: 'Parcel length in cm',
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  length?: number;

  @ApiProperty({
    example: 0,
    description: 'COD amount in VND',
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  cod?: number;

  @ApiProperty({
    example: '24e630a0-0f21-4254-9abe-c684db699ceb',
    description: 'Optional active shop location id selected as shipping origin',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  shopLocationId?: string;
}
