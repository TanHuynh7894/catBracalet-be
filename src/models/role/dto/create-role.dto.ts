import { ApiProperty } from '@nestjs/swagger';

export class CreateRoleDto {
  @ApiProperty({ description: 'The name of the role', example: 'Admin' })
  name: string;

  @ApiProperty({ description: 'The description of the role', example: 'Administrator with full access', required: false })
  description?: string;

  @ApiProperty({ description: 'The status of the role', example: 'ACTIVE', enum: ['ACTIVE', 'INACTIVE'], default: 'ACTIVE', required: false })
  status?: string;
}

