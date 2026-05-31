import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CreatePayosPaymentDto } from './dto/create-payos-payment.dto';
import { PayosPaymentService } from './payos-payment.service';

@ApiTags('PayOS Payment - Test/Mock')
@Controller('api/payment-test')
export class PayosPaymentController {
  constructor(private readonly payosPaymentService: PayosPaymentService) {}

  @Post('create')
  @ApiOperation({ summary: 'Create mocked PayOS payment link' })
  @ApiBody({
    description: 'Create payment input',
    schema: {
      example: {
        orderId: '123e4567-e89b-12d3-a456-426614174000',
      },
    },
  })
  @ApiCreatedResponse({
    schema: {
      example: {
        success: true,
        orderId: '123e4567-e89b-12d3-a456-426614174000',
        orderCode: 1234567890,
        checkoutUrl: 'https://pay.payos.vn/web/abcd1234',
        paymentLinkId: '124c33293c43417ab7879e14c8d9eb18',
      },
    },
  })
  async create(@Body() createPayosPaymentDto: CreatePayosPaymentDto) {
    return this.payosPaymentService.createPaymentLink(
      createPayosPaymentDto.orderId,
    );
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive and verify mocked PayOS webhook callback' })
  @ApiBody({
    description: 'Mock payOS webhook payload',
    schema: {
      example: {
        code: '00',
        desc: 'success',
        success: true,
        data: {
          orderCode: 1234567890,
          amount: 120000,
          description: 'MOCK-123456',
          accountNumber: '12345678',
          reference: 'TF230204212323',
          transactionDateTime: '2023-02-04 18:25:00',
          currency: 'VND',
          paymentLinkId: '124c33293c43417ab7879e14c8d9eb18',
          code: '00',
          desc: 'Thành công',
        },
        signature:
          '8d8640d802576397a1ce45ebda7f835055768ac7ad2e0bfb77f9b8f12cca4c7f',
      },
    },
  })
  @ApiOkResponse({
    schema: {
      example: { success: true },
    },
  })
  async webhook(@Req() req: Request) {
    const result = await this.payosPaymentService.handleWebhook(req.body);
    return result ?? { success: true };
  }

  @Get('status/:orderCode')
  @ApiOperation({ summary: 'Get payment status by orderCode' })
  @ApiParam({
    name: 'orderCode',
    example: 1234567890,
    description: 'PayOS orderCode number',
  })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        orderCode: 1234567890,
        paymentStatus: 'PAID',
        paidAt: '2026-06-01T12:00:00.000Z',
        amount: 120000,
        checkoutUrl: 'https://pay.payos.vn/web/abcd1234',
        paymentLinkId: '124c33293c43417ab7879e14c8d9eb18',
        transactionCode: 'TF230204212323',
      },
    },
  })
  getPaymentStatus(@Param('orderCode') orderCode: string) {
    return this.payosPaymentService.getPaymentStatus(Number(orderCode));
  }

  @Get('info/:orderCode')
  @ApiOperation({ summary: 'Get mocked payment log by orderCode' })
  @ApiParam({
    name: 'orderCode',
    example: 1234567890,
    description: 'PayOS orderCode number',
  })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        data: {
          paymentId: '3d8f0b75-7ab4-4c7f-b4b1-3fdbbc3a4c6e',
          orderId: '123e4567-e89b-12d3-a456-426614174000',
          orderCode: 1234567890,
          paymentMethod: 'PAYOS',
          transactionCode: 'TF230204212323',
          amount: 120000,
          paymentStatus: 'PAID',
          checkoutUrl: 'https://pay.payos.vn/web/abcd1234',
          paymentLinkId: '124c33293c43417ab7879e14c8d9eb18',
          paidAt: '2026-06-01T12:00:00.000Z',
          createdAt: '2026-06-01T11:59:00.000Z',
          updatedAt: '2026-06-01T12:00:00.000Z',
          webhookData: {
            code: '00',
            desc: 'success',
          },
        },
      },
    },
  })
  getInformationPayment(@Param('orderCode') orderCode: string) {
    return this.payosPaymentService.getInformationPayment(Number(orderCode));
  }
}
