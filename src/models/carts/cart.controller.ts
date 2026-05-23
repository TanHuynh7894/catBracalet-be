import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
  Delete,
  Param,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiBody,
  ApiProperty,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CartService } from './cart.service';
import { CartItemDto } from '../cart_items/dto/cart-item.dto';
import { IsInt, Min, IsNotEmpty, IsString } from 'class-validator';
import { Type } from 'class-transformer';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email?: string;
  };
}

// Lightweight DTOs used locally to keep controller explicit
class UpdateCartItemDto {
  @ApiProperty({
    type: 'integer',
    example: 1,
    description: 'Số lượng mới muốn cập nhật',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsNotEmpty()
  quantity: number;
}

@ApiTags('Carts')
@ApiBearerAuth('JWT-auth')
@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({
    summary:
      'Lấy thông tin chi tiết giỏ hàng hiện tại của user (Show sản phẩm, số lượng, id để xóa)',
  })
  async getMyCart(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return this.cartService.getCartDetails(userId);
  }

  @Post('add')
  @ApiOperation({ summary: 'Thêm sản phẩm biến thể vào giỏ hàng' })
  async addToCart(@Req() req: AuthenticatedRequest, @Body() body: CartItemDto) {
    const userId = req.user.id;
    return this.cartService.addToCart(userId, body.variantId, body.quantity);
  }

  // Primary UX-friendly endpoint: update by cartItemId (recommended)
  @Patch('item/:id')
  @ApiOperation({
    summary: 'Cập nhật số lượng của một sản phẩm trong giỏ (Dùng cart_item_id)',
  })
  @ApiParam({
    name: 'id',
    description: 'Mã định danh cart_item_id trong bảng cart_items',
    type: String,
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        quantity: {
          type: 'integer',
          example: 1,
          description: 'Số lượng mới muốn cập nhật',
        },
      },
      required: ['quantity'],
    },
  })
  async updateCartItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() body: UpdateCartItemDto,
  ) {
    const userId = req.user.id;
    return this.cartService.updateCartItem(userId, id, body.quantity);
  }

  @Delete('item/:id')
  @ApiOperation({
    summary: 'Xóa một dòng sản phẩm khỏi giỏ hàng (Dùng cart_item_id)',
  })
  @ApiParam({
    name: 'id',
    description: 'Mã định danh cart_item_id trong bảng cart_items',
    type: String,
  })
  async removeCartItem(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
  ) {
    const userId = req.user.id;
    return this.cartService.removeCartItem(userId, id);
  }

  @Delete('clear')
  @ApiOperation({
    summary: 'Xóa sạch toàn bộ sản phẩm trong giỏ hàng của user',
  })
  async clearCart(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;
    return await this.cartService.clearCart(userId);
  }
}
