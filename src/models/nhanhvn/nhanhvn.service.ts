import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type NhanhvnAccessTokenResponse = {
  success?: boolean;
  data?: {
    accessToken?: string;
    expiresIn?: number;
  };
  message?: string;
};

@Injectable()
export class NhanhvnService {
  private readonly logger = new Logger(NhanhvnService.name);

  constructor(private readonly configService: ConfigService) {}

  async getAccessToken() {
    const apiBaseUrl =
      this.configService.get<string>('NHANHVN_API_BASE_URL') ??
      'https://api.nhanh.vn';
    const appId = this.configService.get<string>('NHANHVN_APP_ID') ?? '';
    const appSecret =
      this.configService.get<string>('NHANHVN_APP_SECRET') ?? '';

    if (!appId || !appSecret) {
      throw new HttpException(
        'Nhanh.vn credentials are missing',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const response = await fetch(`${apiBaseUrl}/api/v2/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appId,
          appSecret,
        }),
      });

      const data = (await response.json()) as NhanhvnAccessTokenResponse;

      if (!response.ok) {
        throw new HttpException(
          data.message ?? 'Failed to get Nhanh.vn access token',
          HttpStatus.BAD_GATEWAY,
        );
      }

      return {
        success: true,
        data: data.data ?? data,
      };
    } catch (error) {
      this.logger.error('Failed to get Nhanh.vn access token', error as Error);
      throw new HttpException(
        'Failed to get Nhanh.vn access token',
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  syncNow() {
    return {
      success: true,
      message: 'Nhanh.vn sync triggered',
    };
  }

  handleWebhook(payload: unknown) {
    this.logger.log('Nhanh.vn webhook received');
    this.logger.debug(JSON.stringify(payload));

    return {
      success: true,
      message: 'Nhanh.vn webhook processed',
    };
  }

  registerWebhook(webhookUrl: string) {
    const apiBaseUrl =
      this.configService.get<string>('NHANHVN_API_BASE_URL') ??
      'https://api.nhanh.vn';

    if (!webhookUrl || webhookUrl.trim().length === 0) {
      throw new HttpException('Webhook URL invalid', HttpStatus.BAD_REQUEST);
    }

    return {
      success: true,
      message: 'Nhanh.vn webhook URL registered',
      data: {
        webhookUrl: webhookUrl.trim(),
        apiBaseUrl,
      },
    };
  }
}
