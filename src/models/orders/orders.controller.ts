import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiQuery,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CheckoutDto } from './dto/checkout.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';

@ApiTags('Orders')
@ApiBearerAuth('JWT-auth') // Hiện khóa trên Swagger
@UseGuards(JwtAuthGuard, RolesGuard) // Kích hoạt bảo vệ
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('checkout')
  @ApiOperation({ summary: 'Xử lý thanh toán đơn hàng (User)' })
  handleCheckout(@Body() checkoutDto: CheckoutDto) {
    const { userId, addressId, voucherCode } = checkoutDto;
    return this.ordersService.handleCheckout(userId, addressId, voucherCode);
  }

  @Patch(':orderId/cancel')
  @ApiOperation({ summary: 'Hủy đơn hàng (User/Admin)' })
  cancelOrder(@Param('orderId') orderId: string) {
    return this.ordersService.cancelOrder(orderId);
  }

  @Patch(':orderId/status')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Cập nhật trạng thái đơn hàng (Admin/Staff)' })
  updateStatus(
    @Param('orderId') orderId: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(
      orderId,
      updateOrderStatusDto.status,
    );
  }

  @Post()
  @ApiOperation({
    summary: 'Tạo đơn hàng mới (kèm danh sách sản phẩm từ giỏ hàng)',
  })
  createOrder(@Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder_legacy(createOrderDto);
  }

  @Get()
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Lấy tất cả danh sách đơn hàng (Admin/Staff)' })
  findAll() {
    return this.ordersService.findAll();
  }

  @Get('user/:userId')
  @ApiOperation({
    summary: 'Lấy danh sách đơn hàng của một người dùng (User/Admin)',
  })
  getOrdersByUser(@Param('userId') userId: string) {
    return this.ordersService.getOrdersByUser(userId);
  }

  @Get('status/:status')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({
    summary: 'Lấy danh sách đơn hàng theo trạng thái (Admin/Staff)',
  })
  getOrdersByStatus(@Param('status') status: string) {
    return this.ordersService.getOrdersByStatus(status);
  }

  @Get(':id/current-status')
  @ApiOperation({
    summary: 'Láº¥y tráº¡ng thÃ¡i hiá»‡n táº¡i cá»§a Ä‘Æ¡n hÃ ng',
  })
  getCurrentOrderStatus(@Param('id') id: string) {
    return this.ordersService.getCurrentOrderStatus(id);
  }

  @Get('filter/time')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Lọc đơn hàng theo khoảng thời gian (Admin/Staff)' })
  @ApiQuery({ name: 'start', required: true, type: String })
  @ApiQuery({ name: 'end', required: true, type: String })
  getOrdersByTime(@Query('start') start: string, @Query('end') end: string) {
    return this.ordersService.getOrdersByTime(new Date(start), new Date(end));
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết một đơn hàng theo ID (User/Admin)' })
  getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Patch(':id')
  @Roles('ADMIN', 'STAFF')
  @ApiOperation({ summary: 'Cập nhật thông tin đơn hàng (Admin/Staff)' })
  update(@Param('id') id: string, @Body() updateOrderDto: UpdateOrderDto) {
    return this.ordersService.update(id, updateOrderDto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @ApiOperation({ summary: 'Xóa đơn hàng (Admin)' })
  remove(@Param('id') id: string) {
    return this.ordersService.remove(id);
  }
}
