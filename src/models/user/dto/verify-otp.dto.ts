import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({ example: 'john@example.com', description: 'Registered email address' })
  email: string;

  @ApiProperty({ example: '123456', description: '6-digit OTP code' })
  otp: string;
}
