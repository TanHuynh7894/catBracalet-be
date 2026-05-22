import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsArray, ArrayNotEmpty, IsUUID } from 'class-validator';

export class UpdateUserRolesDto {
  @ApiProperty({
    description: 'Danh sách các ID của Roles cần gán cho User',
    example: ['d3b07384-d113-4956-b5e1-16b7f3d8a69d'],
    type: [String],
  })
  @IsNotEmpty({ message: 'Danh sách Role IDs không được để trống' })
  @IsArray({ message: 'Role IDs phải là một mảng' })
  @ArrayNotEmpty({ message: 'Danh sách Role IDs phải có ít nhất một phần tử' })
  @IsUUID('4', { each: true, message: 'Mỗi Role ID phải là UUID hợp lệ' })
  roleIds: string[];
}
