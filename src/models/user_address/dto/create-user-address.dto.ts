import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class CreateUserAddressDto {
  @ApiProperty({
    example: 'Nguyen Van A',
    description: 'The name of the receiver',
  })
  @IsString()
  @MaxLength(255)
  receiverName: string;

  @ApiProperty({
    example: '0987654321',
    description: 'The phone number of the receiver',
  })
  @IsString()
  @MaxLength(20)
  phone: string;

  @ApiProperty({
    example: 'TP. Ho Chi Minh',
    description: 'The province or city',
  })
  @IsString()
  @MaxLength(100)
  province: string;

  @ApiProperty({ example: 'Quan 1', description: 'The district' })
  @IsString()
  @MaxLength(100)
  district: string;

  @ApiProperty({
    example: 'Phuong Ben Nghe',
    description: 'The ward or commune',
  })
  @IsString()
  @MaxLength(100)
  ward: string;

  @ApiProperty({
    example: '123 Nguyen Hue',
    description: 'The detailed street address',
  })
  @IsString()
  @MaxLength(500)
  detailAddress: string;

  @ApiProperty({
    example: false,
    description: 'Is this the default address?',
    required: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;

  @ApiProperty({
    example: 'ACTIVE',
    description: 'Status of the address (ACTIVE or INACTIVE)',
    required: false,
    default: 'ACTIVE',
  })
  @IsString()
  @IsOptional()
  status?: string;
}
