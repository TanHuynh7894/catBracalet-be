import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SetVipLevelDto {
  @ApiProperty({
    example: 'uuid-v4-of-vip-level',
    description: 'The ID of the VIP level to assign',
  })
  @IsNotEmpty()
  @IsString()
  vipLevelId: string;

  @ApiProperty({
    example: 'Promotion due to high spending',
    description: 'Reason for the level change',
    required: false,
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
