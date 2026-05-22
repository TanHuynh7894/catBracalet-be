import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsEmail,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Email address of the user',
  })
  @IsNotEmpty({ message: 'Email không được để trống' })
  @IsEmail({}, { message: 'Email phải là địa chỉ email hợp lệ' })
  email: string;

  @ApiProperty({
    example: '123456',
    description: '6-digit OTP code received via email',
  })
  @IsNotEmpty({ message: 'OTP không được để trống' })
  @IsString({ message: 'OTP phải là chuỗi ký tự' })
  @Matches(/^[0-9]{6}$/, {
    message: 'OTP phải chứa 6 chữ số',
  })
  otp: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'New password (minimum 6 characters)',
  })
  @IsNotEmpty({ message: 'Mật khẩu mới không được để trống' })
  @IsString({ message: 'Mật khẩu mới phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;
}
