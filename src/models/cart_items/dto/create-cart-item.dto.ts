import { ApiProperty } from '@nestjs/swagger';

export class CreateCartItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'The ID of the cart' })
  cartId: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'The ID of the product variant' })
  variantId: string;

  @ApiProperty({ example: 1, description: 'The quantity of the item' })
  quantity: number;
}
