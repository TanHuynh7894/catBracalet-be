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
  private readonly refreshTokenExpiration = '7d';

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
      // Ép kiểu đầu ra từ 'any' về 'unknown' để dập tắt hoàn toàn lỗi Unsafe assignment
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      }) as unknown;

      if (this.isJwtPayload(decoded)) {
        return decoded;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Xác minh Refresh Token
   */
  verifyRefreshToken(token: string): JwtPayload | null {
    try {
      // Ép kiểu đầu ra từ 'any' về 'unknown' để dập tắt hoàn toàn lỗi Unsafe assignment
      const decoded = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      }) as unknown;

      if (this.isJwtPayload(decoded)) {
        return decoded;
      }

      return null;
    } catch {
      return null;
    }
  }
}
