import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO để lấy thông tin user hiện tại từ JWT token
 * Được sử dụng bởi @GetCurrentUser() decorator
 */
export class GetCurrentUserDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: 'User ID từ JWT token',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email từ JWT token',
  })
  email: string;
}
