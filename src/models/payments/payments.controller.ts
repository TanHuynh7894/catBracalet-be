import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../auth/decorators/public.decorator';
import { CreatePayosPaymentDto } from './dto/create-payos-payment.dto';
import {
  BasicSuccessResponseDto,
  CreatePaymentResponseDto,
  PaymentInfoResponseDto,
  PaymentStatusResponseDto,
} from './dto/payment-response.dto';
import { PayOSWebhookDto } from './dto/payos-webhook.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@ApiBearerAuth('JWT-auth') // 🌟 THÊM DÒNG NÀY: Kích hoạt ổ khóa bảo mật cho toàn bộ Route trong Controller này
@Controller('api/payment')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create PayOS payment link' })
  @ApiBody({ type: CreatePayosPaymentDto })
  @ApiCreatedResponse({ type: CreatePaymentResponseDto })
  create(@Body() body: CreatePayosPaymentDto) {
    return this.paymentsService.createOSPayment(body.orderId);
  }

  @Public() // 💡 Route này là Webhook từ cổng PayOS gọi về nên ông đã để Public, không lo bị chặn bởi khóa
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive and process PayOS webhook callback (Public)',
  })
  @ApiBody({
    type: PayOSWebhookDto,
    description: 'Dữ liệu Webhook mẫu từ PayOS hoặc Swagger test',
  })
  @ApiOkResponse({ type: BasicSuccessResponseDto })
  async webhook(@Body() body: Record<string, unknown>) {
    console.log('[PAYOS] Webhook received body:', JSON.stringify(body));

    if (
      !body ||
      Object.keys(body).length === 0 ||
      body.desc === 'schema_confirm' ||
      body.confirm === true
    ) {
      console.log(
        '[PAYOS] URL Validation or empty test request detected. Responding OK.',
      );
      return { success: true, message: 'Webhook URL validated successfully' };
    }

    return this.paymentsService.handlePaymentCallback(body);
  }

  @Get('status/:orderCode')
  @ApiOperation({ summary: 'Get payment status directly from PayOS SDK' })
  @ApiParam({
    name: 'orderCode',
    type: 'number',
    example: 123456,
    description:
      'Mã số orderCode cần kiểm tra trạng thái trực tiếp trên cổng PayOS',
  })
  @ApiOkResponse({
    type: PaymentStatusResponseDto,
    description: 'Trạng thái đơn hàng real-time từ cổng thanh toán PayOS',
  })
  getPaymentStatus(@Param('orderCode') orderCode: string) {
    return this.paymentsService.getPaymentStatus(Number(orderCode));
  }

  @Get('info/:orderCode')
  @ApiOperation({ summary: 'Get payment information by orderCode' })
  @ApiParam({
    name: 'orderCode',
    type: 'number',
    example: 123456,
    description: 'Mã số orderCode của đơn hàng trong Database nội bộ',
  })
  @ApiOkResponse({ type: PaymentInfoResponseDto })
  getInformationPayment(@Param('orderCode') orderCode: string) {
    return this.paymentsService.getInformationPayment(Number(orderCode));
  }
}
