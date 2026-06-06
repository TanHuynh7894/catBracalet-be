import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Request } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';

import { AdminCreateShipmentDto } from './dto/admin-create-shipment.dto';
import { CalculateFeeDto } from './dto/calculate-fee.dto';
import { GoshipWebhookDto } from './dto/goship-webhook.dto';
import { ShipmentService } from './shipment.service';

@ApiTags('Shipment')
@ApiBearerAuth('JWT-auth')
@Controller('shipments')
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Get('provinces')
  @ApiOperation({ summary: 'Get Goship provinces/cities' })
  getAllProvinces() {
    return this.shipmentService.getProvinces();
  }

  @Get('districts/:provinceId')
  @ApiOperation({ summary: 'Get Goship districts by province/city id' })
  getDistrictsByProvince(@Param('provinceId') provinceId: string) {
    return this.shipmentService.getDistricts(provinceId);
  }

  @Get('wards/:districtId')
  @ApiOperation({ summary: 'Get Goship wards by district id' })
  getWardsByDistrict(@Param('districtId') districtId: string) {
    return this.shipmentService.getWards(districtId);
  }

  @Post('calculate-client')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate client shipping fee from the cheapest Goship rate',
  })
  calculateForClient(@Body() dto: CalculateFeeDto) {
    return this.shipmentService.calculateFeeForClient(dto);
  }

  @Post('calculate-admin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calculate all Goship rates so shop owner can compare carriers',
  })
  calculateForAdmin(@Body() dto: CalculateFeeDto) {
    return this.shipmentService.calculateFeeForAdmin(dto);
  }

  @Post('create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a Goship shipment from selected rate id' })
  createShipment(@Body() dto: AdminCreateShipmentDto) {
    return this.shipmentService.createShipment(dto);
  }

  @Get('track/:orderId')
  @ApiOperation({ summary: 'Track shipment by internal order id' })
  trackShipment(@Param('orderId') orderId: string) {
    return this.shipmentService.trackShipment(orderId);
  }

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive Goship shipment status webhook' })
  @ApiHeader({
    name: 'x-goship-hmac-sha256',
    required: true,
    description:
      'HMAC-SHA256 signature generated from request body and GOSHIP_CLIENT_SECRET. This is not the shipment tracking code.',
    example: 'sha256=2c4c3f8e9b7f...',
  })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  async handleGoshipWebhook(
    @Body() webhookDto: GoshipWebhookDto,
    @Headers('x-goship-hmac-sha256') hmacHeader: string,
    @Req() req: Request & { rawBody?: Buffer },
  ) {
    this.logWebhookDebug(req, webhookDto, hmacHeader);

    const clientSecret = process.env.GOSHIP_CLIENT_SECRET;

    if (!req.rawBody || !hmacHeader || !clientSecret) {
      throw new UnauthorizedException('Missing Goship webhook signature data');
    }

    if (
      !this.isValidGoshipHmac(req.rawBody, webhookDto, hmacHeader, clientSecret)
    ) {
      throw new UnauthorizedException('Invalid Goship webhook signature');
    }

    await this.shipmentService.handleWebhook(webhookDto);
    return {
      success: true,
      message: 'Shipment status synchronized',
    };
  }

  private isValidGoshipHmac(
    rawBody: Buffer,
    webhookDto: GoshipWebhookDto,
    hmacHeader: string,
    clientSecret: string,
  ): boolean {
    const payload = JSON.stringify(webhookDto);
    const normalizedHeader = this.normalizeHmacHeader(hmacHeader);
    const rawBodyHex = createHmac('sha256', clientSecret)
      .update(rawBody)
      .digest('hex');
    const payloadHex = createHmac('sha256', clientSecret)
      .update(payload)
      .digest('hex');
    const rawBodyBase64 = createHmac('sha256', clientSecret)
      .update(rawBody)
      .digest('base64');
    const payloadBase64 = createHmac('sha256', clientSecret)
      .update(payload)
      .digest('base64');

    const candidates = new Set([
      rawBodyHex,
      payloadHex,
      rawBodyBase64,
      payloadBase64,
      `sha256=${rawBodyHex}`,
      `sha256=${payloadHex}`,
      `sha256=${rawBodyBase64}`,
      `sha256=${payloadBase64}`,
    ]);

    return [...candidates].some((candidate) => {
      const normalizedCandidate = this.normalizeHmacHeader(candidate);

      return (
        this.timingSafeStringEqual(candidate, hmacHeader.trim()) ||
        this.timingSafeStringEqual(normalizedCandidate, normalizedHeader)
      );
    });
  }

  private normalizeHmacHeader(value: string): string {
    return value.trim().replace(/^sha256=/i, '');
  }

  private logWebhookDebug(
    req: Request & { rawBody?: Buffer },
    webhookDto: GoshipWebhookDto,
    hmacHeader?: string,
  ): void {
    if (process.env.GOSHIP_WEBHOOK_DEBUG !== 'true') return;

    const rawBody = req.rawBody?.toString('utf8') ?? '';
    const signaturePreview = hmacHeader
      ? `${hmacHeader.slice(0, 12)}...${hmacHeader.slice(-8)}`
      : null;

    console.log('[GOSHIP_WEBHOOK_DEBUG] Headers:', {
      names: Object.keys(req.headers),
      signatureHeader: signaturePreview,
      contentType: req.headers['content-type'],
      userAgent: req.headers['user-agent'],
    });
    console.log('[GOSHIP_WEBHOOK_DEBUG] Raw body:', {
      length: rawBody.length,
      preview: rawBody.slice(0, 1000),
    });
    console.log('[GOSHIP_WEBHOOK_DEBUG] Parsed body:', webhookDto);
  }

  private timingSafeStringEqual(left: string, right: string): boolean {
    const leftBuffer = Buffer.from(left);
    const rightBuffer = Buffer.from(right);

    return (
      leftBuffer.length === rightBuffer.length &&
      timingSafeEqual(leftBuffer, rightBuffer)
    );
  }
}
