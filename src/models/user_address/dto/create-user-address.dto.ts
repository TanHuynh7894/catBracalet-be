import { ApiProperty } from '@nestjs/swagger';

export class CreateUserAddressDto {
  @ApiProperty({ example: 'Nguyen Van A', description: 'The name of the receiver' })
  receiverName: string;

  @ApiProperty({ example: '0987654321', description: 'The phone number of the receiver' })
  phone: string;

  @ApiProperty({ example: 'TP. Ho Chi Minh', description: 'The province or city' })
  province: string;

  @ApiProperty({ example: 'Quan 1', description: 'The district' })
  district: string;

  @ApiProperty({ example: 'Phuong Ben Nghe', description: 'The ward or commune' })
  ward: string;

  @ApiProperty({ example: '123 Nguyen Hue', description: 'The detailed street address' })
  detailAddress: string;

  @ApiProperty({ example: 'ACTIVE', description: 'Status of the address (ACTIVE or INACTIVE)', required: false, default: 'ACTIVE' })
  status?: string;
}
