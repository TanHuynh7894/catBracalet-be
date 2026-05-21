import { ApiProperty } from '@nestjs/swagger';

export class RemoveRoleDto {
  @ApiProperty({
    description:
      'New status of the role after soft delete (default is INACTIVE)',
    example: 'INACTIVE',
    enum: ['ACTIVE', 'INACTIVE'],
    default: 'INACTIVE',
    required: false,
  })
  status?: string;
}
