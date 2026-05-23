import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator'; // 🌟 Đã xóa sạch IsJWT ở đây để ko bị chặn token mới

export class RefreshTokenDto {
  @ApiProperty({
    example: 'd3b07384d113edec49eaa6238ad5ff00b7d92834b99a771a2a4b87e224e0ec78', // 🌟 Thay bằng chuỗi mã hex 64 ký tự mẫu
    description:
      'Refresh token định dạng Opaque (chuỗi ngẫu nhiên 64 ký tự) thu được từ lần đăng nhập trước',
  })
  @IsNotEmpty({ message: 'Refresh token không được để trống' })
  @IsString({ message: 'Refresh token phải là chuỗi ký tự' })
  @Length(64, 64, {
    message: 'Refresh token phải có độ dài chính xác là 64 ký tự',
  }) // 🌟 Khóa cứng độ dài đúng 64 ký tự để nâng cao bảo mật
  refreshToken: string;
}
