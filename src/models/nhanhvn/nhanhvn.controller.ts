import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { NhanhvnService } from './nhanhvn.service';

class NhanhvnWebhookDto {
  @ApiProperty({ required: false })
  webhookId?: string;

  @ApiProperty({ required: false })
  event?: string;

  @ApiProperty({ required: false, type: Object })
  data?: Record<string, unknown>;
}

class TriggerNhanhvnSyncDto {
  @ApiProperty({ required: false })
  reason?: string;
}

class RegisterNhanhvnWebhookDto {
  @ApiProperty({
    example: 'https://api-catbracelet-be.kaelvercula.me/api/nhanhvn/webhook',
  })
  webhookUrl: string;
}

@ApiTags('Nhanhvn')
@Controller('api/nhanhvn')
export class NhanhvnController {
  constructor(private readonly nhanhvnService: NhanhvnService) {}

  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive webhook from Nhanh.vn' })
  @ApiBody({ type: NhanhvnWebhookDto })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        message: 'Nhanh.vn webhook processed',
      },
    },
  })
  webhook(@Body() body: NhanhvnWebhookDto) {
    return this.nhanhvnService.handleWebhook(body);
  }

  @Post('sync')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Trigger Nhanh.vn sync manually' })
  @ApiBody({ type: TriggerNhanhvnSyncDto })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        message: 'Nhanh.vn sync triggered',
      },
    },
  })
  sync() {
    return this.nhanhvnService.syncNow();
  }

  @Post('register-webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register Nhanh.vn webhook URL manually' })
  @ApiBody({ type: RegisterNhanhvnWebhookDto })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
        message: 'Nhanh.vn webhook URL registered',
      },
    },
  })
  registerWebhook(@Body() body: RegisterNhanhvnWebhookDto) {
    return this.nhanhvnService.registerWebhook(body.webhookUrl);
  }
}
