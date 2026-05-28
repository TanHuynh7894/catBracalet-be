import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNumber, IsPositive } from 'class-validator';

export class CreateOrderItemDto {
    @ApiProperty({
        example: '123e4567-e89b-12d3-a456-426614174000',
        description: 'The variant ID of the product',
    })
    @IsUUID()
    variantId: string;

    @ApiProperty({ example: 2, description: 'The quantity of the item' })
    @IsNumber()
    @IsPositive()
    quantity: number;

    @ApiProperty({ example: 49.99, description: 'The unit price of the item' })
    @IsNumber()
    @IsPositive()
    unitPrice: number;
}
