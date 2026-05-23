import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto'; // 🌟 1. Nhập thư viện core để đẻ chuỗi 64 ký tự

interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtTokenService {
  private readonly accessTokenExpiration = '15m';

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Type guard an toàn tuyệt đối: Giữ nguyên để tránh lỗi linter
   */
  private isJwtPayload(payload: unknown): payload is JwtPayload {
    if (typeof payload !== 'object' || payload === null) {
      return false;
    }
    const obj = payload as Record<string, unknown>;
    return typeof obj.userId === 'string' && typeof obj.email === 'string';
  }

  /**
   * Sinh Access Token (15 phút) - GIỮ NGUYÊN JWT STATELÈSS
   */
  generateAccessToken(userId: string, email: string): string {
    const payload = { userId, email };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.accessTokenExpiration,
    });
  }

  /**
   * Sinh Refresh Token (Opaque Token) - 🌟 SỬA TẠI ĐÂY
   * Bỏ tham số đầu vào (userId, email), đẻ thẳng chuỗi 64 ký tự cố định
   */
  generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Xác minh Access Token - GIỮ NGUYÊN JWT
   */
  verifyAccessToken(token: string): JwtPayload | null {
    try {
      console.log('[JWT.TOKEN_SERVICE] Verifying access token');
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      }) as unknown;

      if (this.isJwtPayload(decoded)) {
        console.log('[JWT.TOKEN_SERVICE] Access token verified:', {
          userId: decoded.userId,
          email: decoded.email,
        });
        return decoded;
      }

      console.warn('[JWT.TOKEN_SERVICE] Access token payload invalid');
      return null;
    } catch (error) {
      console.error('[JWT.TOKEN_SERVICE] Access token verification failed:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }

  /**
   * Xác minh cấu trúc Refresh Token - 🌟 SỬA TẠI ĐÂY
   * Vì token giờ là chuỗi 64 ký tự ngẫu nhiên, không thể dùng jwtService.verify() được nữa.
   * Ta sửa hàm này thành hàm check độ dài hợp lệ (đủ 64 ký tự) để không làm gãy code ở nơi khác gọi tới.
   */
  verifyRefreshToken(token: string): boolean {
    try {
      console.log('[JWT.TOKEN_SERVICE] Checking opaque refresh token format');

      if (!token || token.length !== 64) {
        console.warn(
          '[JWT.TOKEN_SERVICE] Refresh token format invalid (Not 64 chars)',
        );
        return false;
      }

      return true;
    } catch {
      return false;
    }
  }
}
