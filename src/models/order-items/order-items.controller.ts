import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CreateOrderItemDto } from '../orders/dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { OrderItemsService } from './order-items.service';

@ApiTags('Order Items')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('order-items')
export class OrderItemsController {
  constructor(private readonly orderItemsService: OrderItemsService) {}

  @Get('order/:orderId')
  @ApiOperation({ summary: 'Lay danh sach san pham cua mot don hang' })
  findByOrderId(@Param('orderId') orderId: string) {
    return this.orderItemsService.findByOrderId(orderId);
  }

  @Post('order/:orderId')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Them mot san pham vao don hang' })
  createOne(
    @Param('orderId') orderId: string,
    @Body() createOrderItemDto: CreateOrderItemDto,
  ) {
    return this.orderItemsService.createOne(orderId, createOrderItemDto);
  }

  @Patch('order/:orderId/:itemId')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Cap nhat mot san pham trong don hang' })
  updateOne(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
    @Body() updateOrderItemDto: UpdateOrderItemDto,
  ) {
    return this.orderItemsService.updateOne(
      orderId,
      itemId,
      updateOrderItemDto,
    );
  }

  @Delete('order/:orderId/:itemId')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Xoa mot san pham khoi don hang' })
  removeOne(
    @Param('orderId') orderId: string,
    @Param('itemId') itemId: string,
  ) {
    return this.orderItemsService.removeOne(orderId, itemId);
  }
}
