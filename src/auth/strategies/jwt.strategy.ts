import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../models/user/entities/user.entity';

interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    console.log('[JWT.STRATEGY] Validating token payload:', {
      userId: payload.userId,
      email: payload.email,
      iat: payload.iat,
      exp: payload.exp,
    });

    const user = await this.userRepository.findOne({
      where: { id: payload.userId },
      relations: ['roles', 'vipLevel'],
    });

    if (!user) {
      console.error(
        '[JWT.STRATEGY] User not found for userId:',
        payload.userId,
      );
      throw new UnauthorizedException('User không tồn tại');
    }

    console.log('[JWT.STRATEGY] User found:', {
      id: user.id,
      email: user.email,
      status: user.status,
    });

    if (user.status !== 'ACTIVE') {
      console.warn('[JWT.STRATEGY] Account not active:', {
        userId: user.id,
        status: user.status,
      });
      throw new UnauthorizedException('Tài khoản không hoạt động');
    }

    console.log('[JWT.STRATEGY] Validation successful for user:', user.id);
    return user;
  }
}
