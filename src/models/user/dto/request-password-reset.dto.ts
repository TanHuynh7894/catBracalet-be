import { ApiProperty } from '@nestjs/swagger';

export class RequestPasswordResetDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Email của người dùng cần reset mật khẩu',
  })
  email: string;
}
