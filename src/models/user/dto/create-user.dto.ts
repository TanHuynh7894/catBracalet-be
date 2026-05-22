import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsUrl,
  Matches,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  @IsNotEmpty({ message: 'Tên đầy đủ không được để trống' })
  @IsString({ message: 'Tên đầy đủ phải là chuỗi ký tự' })
  fullName: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Email address of the user',
  })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email phải là địa chỉ email hợp lệ' })
  email: string;

  @ApiProperty({
    example: '0912345678',
    description: 'Phone number',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @Matches(/^[0-9]{10,11}$/, {
    message: 'Số điện thoại phải có từ 10 đến 11 chữ số',
  })
  phone?: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'Profile picture URL',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Avatar URL phải là chuỗi ký tự' })
  @IsUrl({}, { message: 'Avatar phải là URL hợp lệ' })
  avatar?: string;
}
