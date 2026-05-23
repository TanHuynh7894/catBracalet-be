import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator'; // 🌟 Xóa bỏ IsJWT ở đây

export class LogoutDto {
  @ApiProperty({
    example: 'd3b07384d113edec49eaa6238ad5ff00b7d92834b99a771a2a4b87e224e0ec78', // 🌟 Thay bằng chuỗi hex 64 ký tự mẫu
    description: 'Refresh token định dạng Opaque (chuỗi 64 ký tự) cần hủy',
  })
  @IsNotEmpty({ message: 'Refresh token không được để trống' })
  @IsString({ message: 'Refresh token phải là chuỗi ký tự' })
  @Length(64, 64, {
    message: 'Refresh token phải có độ dài chính xác là 64 ký tự',
  }) // 🌟 Ép cứng độ dài đúng 64 ký tự
  refreshToken: string;
}
