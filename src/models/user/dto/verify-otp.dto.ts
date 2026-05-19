import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: 'john@example.com', description: 'Email đã đăng ký' })
  email: string;

  @ApiProperty({ example: '123456', description: 'Mã OTP 6 chữ số' })
  otp: string;
}
