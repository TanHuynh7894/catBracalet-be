import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Email của người dùng',
  })
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Mã OTP 6 chữ số nhận được qua email',
  })
  otp: string;

  @ApiProperty({
    example: 'newPassword123',
    description: 'Mật khẩu mới (tối thiểu 6 ký tự)',
  })
  newPassword: string;
}
