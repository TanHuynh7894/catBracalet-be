import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  Res,
  type RawBodyRequest,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { Public } from '../../auth/decorators/public.decorator';
import { CreatePayosPaymentDto } from './dto/create-payos-payment.dto';
import { PayOSWebhookDto } from './dto/payos-webhook.dto';
import {
  BasicSuccessResponseDto,
  CreatePaymentResponseDto,
  PaymentInfoResponseDto,
  PaymentRedirectResponseDto,
  PaymentStatusResponseDto,
} from './dto/payment-response.dto';

class RegisterWebhookDto {
  webhookUrl: string;
}
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('api/payment')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create PayOS payment link (production)' })
  @ApiBody({ type: CreatePayosPaymentDto })
  @ApiCreatedResponse({ type: CreatePaymentResponseDto })
  create(@Body() body: CreatePayosPaymentDto) {
    return this.paymentsService.createOSPayment(body.orderId);
  }

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Receive and process PayOS webhook callback (public)',
  })
  @ApiBody({ type: PayOSWebhookDto })
  @ApiOkResponse({ type: BasicSuccessResponseDto })
  async webhook(
    @Req() req: RawBodyRequest<Request>,
    @Body() body: Record<string, unknown>,
  ) {
    console.log('=== [WEBHOOK] NHẬN ĐƯỢC YÊU CẦU TỪ PAYOS ===');
    console.log('Headers nhận được:', req.headers);
    console.log('Body nhận được:', JSON.stringify(body));

    try {
      return await this.paymentsService.handlePaymentCallback(
        req.rawBody,
        body,
      );
    } catch (error) {
      console.log('Raw body nhận được:', req.rawBody);
      console.log('Dữ liệu parsed: ', JSON.stringify(body));
      throw error;
    }
  }

  @Post('webhook-test')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Test PayOS webhook processing in Swagger without signature',
  })
  @ApiBody({ type: PayOSWebhookDto })
  @ApiOkResponse({ type: BasicSuccessResponseDto })
  async webhookTest(@Body() body: Record<string, unknown>) {
    return this.paymentsService.handleWebhookTest(body);
  }

  @Post('register-webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Register PayOS webhook URL from Swagger',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        webhookUrl: {
          type: 'string',
          example: 'https://xxxx.loca.lt/api/payment/webhook',
        },
      },
      required: ['webhookUrl'],
    },
  })
  async registerWebhook(@Body() body: { webhookUrl: string }) {
    return this.paymentsService.registerWebhook(body.webhookUrl);
  }

  @Get('success')
  @ApiOperation({
    summary: 'PayOS success redirect endpoint (frontend landing)',
  })
  @ApiOkResponse({ type: PaymentRedirectResponseDto })
  success(@Query() query: Record<string, string>, @Res() res: Response) {
    const redirectUrl = new URL('https://truongnguyen.me/successfulpayment');
    const orderCode = query.orderCode ?? query.id ?? '';
    if (orderCode) {
      redirectUrl.searchParams.set('orderCode', orderCode);
    }
    redirectUrl.searchParams.set('status', 'PAID');
    return res.redirect(redirectUrl.toString());
  }

  @Get('cancel')
  @ApiOperation({ summary: 'PayOS cancel redirect endpoint' })
  @ApiOkResponse({ type: PaymentRedirectResponseDto })
  cancel(
    @Query() query: Record<string, string>,
    @Res({ passthrough: true }) res: Response,
  ) {
    const frontendBase = process.env.url_base_FE?.trim() ?? null;
    if (frontendBase) {
      const params = new URLSearchParams(query);
      res.redirect(
        `${frontendBase.replace(/\/$/, '')}/payment/cancel?${params.toString()}`,
      );
      return;
    }
    return { success: true, message: 'Payment cancelled', data: query };
  }

  @Get('status/:orderCode')
  @ApiOperation({ summary: 'Get payment status by orderCode' })
  @ApiParam({ name: 'orderCode', description: 'PayOS orderCode number' })
  @ApiOkResponse({ type: PaymentStatusResponseDto })
  getPaymentStatus(@Param('orderCode') orderCode: string) {
    return this.paymentsService.getPaymentStatus(Number(orderCode));
  }

  @Get('info/:orderCode')
  @ApiOperation({ summary: 'Get payment information by orderCode' })
  @ApiParam({ name: 'orderCode', description: 'PayOS orderCode number' })
  @ApiOkResponse({ type: PaymentInfoResponseDto })
  getInformationPayment(@Param('orderCode') orderCode: string) {
    return this.paymentsService.getInformationPayment(Number(orderCode));
  }
}
