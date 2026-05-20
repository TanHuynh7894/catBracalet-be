import { ApiProperty } from '@nestjs/swagger';

export class LoginUserDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Email đã kích hoạt',
  })
  email: string;

  @ApiProperty({ example: 'password123', description: 'Mật khẩu' })
  password: string;
}
