import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtTokenService {
  private readonly accessTokenExpiration = '15m';
  private readonly refreshTokenExpiration = '24h';

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Type guard an toàn tuyệt đối: Thay 'any' bằng 'unknown' để diệt tận gốc lỗi Unsafe member access
   */
  private isJwtPayload(payload: unknown): payload is JwtPayload {
    if (typeof payload !== 'object' || payload === null) {
      return false;
    }

    // Ép sang Record kiểu thuần ẩn để đọc thuộc tính mà không dính lỗi linter
    const obj = payload as Record<string, unknown>;

    return typeof obj.userId === 'string' && typeof obj.email === 'string';
  }

  /**
   * Sinh Access Token (15 phút)
   */
  generateAccessToken(userId: string, email: string): string {
    const payload = { userId, email };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_SECRET'),
      expiresIn: this.accessTokenExpiration,
    });
  }

  /**
   * Sinh Refresh Token (7 ngày)
   */
  generateRefreshToken(userId: string, email: string): string {
    const payload = { userId, email };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.refreshTokenExpiration,
    });
  }

  /**
   * Xác minh Access Token
   */
  verifyAccessToken(token: string): JwtPayload | null {
    try {
      console.log('[JWT.TOKEN_SERVICE] Verifying access token');
      // Ép kiểu đầu ra từ 'any' về 'unknown' để dập tắt hoàn toàn lỗi Unsafe assignment
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
   * Xác minh Refresh Token
   */
  verifyRefreshToken(token: string): JwtPayload | null {
    try {
      console.log('[JWT.TOKEN_SERVICE] Verifying refresh token');
      // Ép kiểu đầu ra từ 'any' về 'unknown' để dập tắt hoàn toàn lỗi Unsafe assignment
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      }) as unknown;

      if (this.isJwtPayload(decoded)) {
        console.log('[JWT.TOKEN_SERVICE] Refresh token verified:', {
          userId: decoded.userId,
          email: decoded.email,
        });
        return decoded;
      }

      console.warn('[JWT.TOKEN_SERVICE] Refresh token payload invalid');
      return null;
    } catch (error) {
      console.error('[JWT.TOKEN_SERVICE] Refresh token verification failed:', {
        error: error instanceof Error ? error.message : String(error),
      });
      return null;
    }
  }
}
