import { Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { User } from '../../models/user/entities/user.entity';

type GuardInfo = { message?: string } | string | undefined | null;

interface RequestWithUser extends Request {
  user?: User;
}

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  override canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  override handleRequest<TUser = User>(
    err: unknown,
    user: unknown,
    info: GuardInfo,
    context: ExecutionContext,
  ): TUser {
    try {
      const request = context.switchToHttp().getRequest<RequestWithUser>();
      const authHeader = request.headers?.authorization;

      console.log('[JWT.AUTH.GUARD] Request details:', {
        method: request.method,
        path: request.path,
        authHeaderPresent: !!authHeader,
      });

      // 1. Nếu có lỗi hệ thống hoặc lỗi runtime từ Passport Strategy
      if (err) {
        console.error('[JWT.AUTH.GUARD] Error during authentication:', err);
        throw err;
      }

      // 2. Kiểm tra xem Passport có giải mã thành công thực thể user từ Strategy hay không
      if (!user) {
        const infoMessage = typeof info === 'string' ? info : info?.message;
        console.warn(
          '[JWT.AUTH.GUARD] Authentication failed:',
          infoMessage || 'No user payload found',
        );

        throw new UnauthorizedException(
          infoMessage && infoMessage.includes('jwt expired')
            ? 'Token đã hết hạn, vui lòng refresh token'
            : 'Mã xác thực không hợp lệ hoặc đã hết hạn',
        );
      }

      // 3. Đăng nhập thành công, ép kiểu ghi log kiểm tra định danh
      const validatedUser = user as User;
      console.log(
        '[JWT.AUTH.GUARD] Authentication successful for user:',
        validatedUser.id,
      );

      return user as TUser;
    } catch (error) {
      console.error('[JWT.AUTH.GUARD] Exception in handleRequest:', error);
      throw error;
    }
  }
}
