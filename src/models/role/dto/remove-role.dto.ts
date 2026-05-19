import { ApiProperty } from '@nestjs/swagger';

export class RemoveRoleDto {
  @ApiProperty({
    description: 'Trạng thái mới của role sau khi xóa mềm (mặc định là INACTIVE)',
    example: 'INACTIVE',
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'INACTIVE',
    required: false,
  })
  status?: string;
}
