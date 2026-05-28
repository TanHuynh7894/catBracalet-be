import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiQuery, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post('checkout')
  @ApiOperation({ summary: 'Xử lý thanh toán đơn hàng (Checkout)' })
  handleCheckout(@Body() checkoutDto: CheckoutDto) {
    const { userId, addressId, voucherCode } = checkoutDto;
    return this.ordersService.handleCheckout(userId, addressId, voucherCode);
  }

  @Patch(':orderId/cancel')
  @ApiOperation({ summary: 'Hủy đơn hàng (Hoàn lại kho và voucher)' })
  cancelOrder(@Param('orderId') orderId: string) {
    return this.ordersService.cancelOrder(orderId);
  }

  @Patch(':orderId/status')
  @ApiOperation({ summary: 'Cập nhật trạng thái đơn hàng (Admin)' })
  updateStatus(
    @Param('orderId') orderId: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto
  ) {
    return this.ordersService.updateOrderStatus(orderId, updateOrderStatusDto.status);
  }

  @Post()
  @ApiOperation({ summary: 'Tạo đơn hàng mới (kèm danh sách sản phẩm từ giỏ hàng)' })
  createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder_legacy(createOrderDto);
  }


  @Get()
  @ApiOperation({ summary: 'Lấy tất cả danh sách đơn hàng' })
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng của một người dùng' })
  getOrdersByUser(@Param('userId') userId: string) {
    return this.ordersService.getOrdersByUser(userId);
  }

  @Get('status/:status')
  @ApiOperation({ summary: 'Lấy danh sách đơn hàng theo trạng thái' })
  getOrdersByStatus(@Param('status') status: string) {
    return this.ordersService.getOrdersByStatus(status);
  }

  @Get('filter/time')
  @ApiOperation({ summary: 'Lọc đơn hàng theo khoảng thời gian' })
  @ApiQuery({ name: 'start', required: true, type: String })
  @ApiQuery({ name: 'end', required: true, type: String })
  getOrdersByTime(@Query('start') start: string, @Query('end') end: string) {
    return this.ordersService.getOrdersByTime(new Date(start), new Date(end));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một đơn hàng theo ID' })
  getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin đơn hàng' })
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa đơn hàng' })
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
