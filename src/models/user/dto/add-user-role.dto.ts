import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddUserRoleDto {
  @ApiProperty({
    description: 'ID của Role cần gán cho User',
    example: 'd3b07384-d113-4956-b5e1-16b7f3d8a69d',
  })
  @IsNotEmpty({ message: 'Role ID không được để trống' })
  @IsUUID('4', { message: 'Role ID phải là UUID hợp lệ' })
  roleId: string;
}
