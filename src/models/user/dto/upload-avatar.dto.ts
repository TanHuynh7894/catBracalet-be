// users/dto/upload-avatar.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UploadAvatarDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Tệp ảnh đại diện của người dùng (png, jpg, jpeg)',
  })
  avatar?: any;

  @ApiProperty({
    description: 'Bắt buộc điền chữ "A" để hệ thống đẩy ảnh vào đúng thư mục avatar',
    example: 'A',
  })
  @IsString()
  @IsNotEmpty()
  type: string;
}