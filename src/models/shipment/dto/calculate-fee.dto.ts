import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CalculateFeeDto {
  @ApiProperty({
    example: 700000,
    description: 'Goship city/province id selected from /shipments/provinces',
  })
  @Transform(({ value }) => String(value))
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({
    example: 700100,
    description:
      'Goship district id selected from /shipments/districts/:provinceId',
  })
  @Transform(({ value }) => String(value))
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({
    example: 700101,
    description: 'Goship ward id selected from /shipments/wards/:districtId',
  })
  @Transform(({ value }) => String(value))
  @IsString()
  @IsNotEmpty()
  ward: string;

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
    example: 500000,
    description: 'Declared parcel value in VND',
    required: false,
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  amount?: number;
}
