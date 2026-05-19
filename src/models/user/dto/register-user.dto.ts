import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Email của người dùng',
  })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Tên đầy đủ của người dùng',
  })
  fullName: string;

  @ApiProperty({
    example: 'password123',
    description: 'Mật khẩu (tối thiểu 6 ký tự)',
  })
  password: string;

  @ApiProperty({
    example: '0912345678',
    description: 'Số điện thoại (tùy chọn)',
    required: false,
  })
  phone?: string;
}
