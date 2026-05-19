import { ApiProperty } from '@nestjs/swagger';

export class CreateCartItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'The cart ID associated with the item' })
  cartId: string;

  @ApiProperty({ example: '987e6543-e21b-12d3-a456-426614174111', description: 'The product or variant ID' })
  productId: string;

  @ApiProperty({ example: 1, description: 'The quantity of the product' })
  quantity: number;
}
