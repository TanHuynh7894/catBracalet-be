import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsJWT, Length } from 'class-validator';

export class LogoutDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjM0NTY3ODkwIiwiaWF0IjoxNTE2MjM5MDIyfQ.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ',
    description: 'Refresh token cần hủy',
  })
  @IsNotEmpty({ message: 'Refresh token không được để trống' })
  @IsString({ message: 'Refresh token phải là chuỗi ký tự' })
  @Length(10, 1000, { message: 'Refresh token không hợp lệ' })
  @IsJWT({ message: 'Refresh token phải là JWT token hợp lệ' })
  refreshToken: string;
}
