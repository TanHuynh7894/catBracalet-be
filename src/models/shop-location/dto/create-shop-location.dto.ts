import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateShopLocationDto {
  @ApiProperty({
    description: 'Shop address text. Backend will geocode it with Nominatim.',
    example: '123 Nguyen Hue, Ben Nghe, District 1, Ho Chi Minh City',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  shopAddress: string;
}
