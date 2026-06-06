import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsEmail, IsString } from 'class-validator';

export class LoginUserDto {
  @ApiProperty({
    example: 'truongnxse184799@fpt.edu.vn',
    description: 'Activated email address',
  })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email phải là địa chỉ email hợp lệ' })
  email: string;

  @ApiProperty({ example: '123456', description: 'User password' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @IsString({ message: 'Mật khẩu phải là chuỗi ký tự' })
  password: string;
}
