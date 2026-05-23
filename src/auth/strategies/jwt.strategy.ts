/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '../../models/user/user.service';

interface JwtPayload {
  id?: string;
  sub?: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly userService: UserService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') ?? 'DEFAULT_SECRET',
    });
  }

  async validate(payload: JwtPayload) {
    const userId = payload.sub || payload.id;

    console.log('[JWT.STRATEGY] Validating token payload:', {
      userId,
      email: payload.email,
    });

    if (!userId) {
      throw new UnauthorizedException(
        'Token không chứa thông tin định danh hợp lệ',
      );
    }

    const user = await this.userService.findOne(userId);

    if (!user) {
      throw new UnauthorizedException('User không tồn tại');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản không hoạt động');
    }

    console.log('[JWT.STRATEGY] Validation successful for user:', user.id);
    return user;
  }
}
