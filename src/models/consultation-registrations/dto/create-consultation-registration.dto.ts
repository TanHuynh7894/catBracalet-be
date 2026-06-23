import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateConsultationRegistrationDto {
  @ApiProperty({ description: 'Họ và tên', example: 'Nguyễn Văn A' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @ApiProperty({ description: 'Ngày sinh (YYYY-MM-DD)', example: '1998-12-31' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'dateOfBirth must be in YYYY-MM-DD format',
  })
  dateOfBirth: string;

  @ApiProperty({ description: 'Giờ sinh (HH:mm:ss)', example: '14:30:00' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{2}:\d{2}(:\d{2})?$/, {
    message: 'timeOfBirth must be in HH:mm or HH:mm:ss format',
  })
  timeOfBirth: string;

  @ApiProperty({ description: 'Giới tính', example: 'MALE' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  gender: string;

  @ApiProperty({ description: 'Số điện thoại', example: '0987654321' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phoneNumber: string;

  // @ApiPropertyOptional({ description: 'ID Sản phẩm quan tâm', example: '123e4567-e89b-12d3-a456-426614174000' })
  // @IsOptional()
  // @IsUUID('4')
  // productId?: string;

  @ApiPropertyOptional({
    description: 'Mục tiêu/Ghi chú mong muốn tư vấn',
    example: 'Cầu tài lộc, bình an',
  })
  @IsOptional()
  @IsString()
  objective?: string;
}
