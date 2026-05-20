import { ApiProperty } from '@nestjs/swagger';

export class AddUserRoleDto {
  @ApiProperty({
    description: 'ID của Role cần gán cho User',
    example: 'd3b07384-d113-4956-b5e1-16b7f3d8a69d',
  })
  roleId: string;
}
