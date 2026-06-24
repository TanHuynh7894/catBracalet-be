import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateShopLocationDto {
  @ApiProperty({
    example: 'Shop Cat Bracelet Thu Duc',
    description: 'Shop display name',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  shopName?: string;

  @ApiProperty({
    example: '0900000000',
    description: 'Shop phone number',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiProperty({
    example: '08:00 - 21:00',
    description: 'Shop working hours',
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  workingHours?: string;

  @ApiProperty({
    example: '700000',
    description: 'Goship province/city id from GET /shop-location/provinces',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  province: string;

  @ApiProperty({
    example: '701000',
    description:
      'Goship district id from GET /shop-location/districts/:provinceId',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  district: string;

  @ApiProperty({
    example: '701011',
    description: 'Goship ward id from GET /shop-location/wards/:districtId',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  ward: string;

  @ApiProperty({
    example: 'Số 31 Đường 30',
    description: 'The detailed street address',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  detailAddress: string;

  @ApiProperty({
    example: true,
    description: 'Whether this shop can be used for map/shipping selection',
    required: false,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
