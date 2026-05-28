import { IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RemoveRoleDto {
  @ApiProperty({
    description: 'Trạng thái mới sau khi xóa mềm',
    example: 'INACTIVE',
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'INACTIVE',
    required: false,
  })
  @IsOptional()
  @IsEnum(['ACTIVE', 'INACTIVE'])
  status?: string;
}
