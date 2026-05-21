import { ApiProperty } from '@nestjs/swagger';

export class CreateVipLevelDto {
    @ApiProperty({ example: 'GOLD', description: 'The name of the VIP level' })
    levelName: string;

    @ApiProperty({ example: 5000000, description: 'Minimum spending to reach this level' })
    minSpending: number;

    @ApiProperty({ example: 10, description: 'Discount percentage for this level' })
    discountPercent: number;

    @ApiProperty({ example: 'Free shipping, priority support', description: 'Benefits of this level', required: false })
    benefits?: string;

    @ApiProperty({ example: 'ACTIVE', description: 'Status of the level', required: false })
    status?: string;
}
