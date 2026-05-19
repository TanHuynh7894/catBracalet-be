import { ApiProperty } from '@nestjs/swagger';

export class CreateCartDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000', description: 'The user ID associated with the cart' })
  userId: string;
}
