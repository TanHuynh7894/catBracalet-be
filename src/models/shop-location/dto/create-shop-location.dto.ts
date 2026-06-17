import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateShopLocationDto {
  @ApiProperty({
    description: 'Shop name shown on the map',
    example: 'Cat Bracelet Store',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  shopName: string;

  @ApiProperty({
    description: 'Full shop address shown on Google Maps',
    example: '123 Nguyen Hue, Ben Nghe, District 1, Ho Chi Minh City',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  address: string;

  @ApiProperty({
    description: 'Shop latitude',
    example: 10.776889,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude: number;

  @ApiProperty({
    description: 'Shop longitude',
    example: 106.700806,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude: number;

  @ApiPropertyOptional({
    description: 'Optional Google Maps place id for this shop address',
    example: 'ChIJ0T2NLikvdTERKxE8d61aX_E',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  googlePlaceId?: string;

  @ApiPropertyOptional({
    description: 'Optional public note shown with the shop location',
    example: 'Open daily from 9:00 to 21:00',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
