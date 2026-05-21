import { ApiProperty } from '@nestjs/swagger';

export class RegisterUserDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Email address of the user',
  })
  email: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Full name of the user',
  })
  fullName: string;

  @ApiProperty({
    example: 'password123',
    description: 'User password (minimum 6 characters)',
  })
  password: string;

  @ApiProperty({
    example: '0912345678',
    description: 'Phone number (optional)',
    required: false,
  })
  phone?: string;
}
