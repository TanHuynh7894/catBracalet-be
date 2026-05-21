import { ApiProperty } from '@nestjs/swagger';

export class SetVipLevelDto {
    @ApiProperty({ example: 'uuid-v4-of-vip-level', description: 'The ID of the VIP level to assign' })
    vipLevelId: string;

    @ApiProperty({ example: 'Promotion due to high spending', description: 'Reason for the level change', required: false })
    reason?: string;
}
