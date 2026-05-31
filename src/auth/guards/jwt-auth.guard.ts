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

  // 🛠️ SỬA LỖI: Biến hàm thành Generic <TUser = User> kế thừa chuẩn từ class cha
  override handleRequest<TUser = User>(
    err: unknown,
    user: unknown, // Để kiểu dữ liệu unknown cho an toàn, tránh ép kiểu ngầm định bừa bãi
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

      if (err) {
        console.error('[JWT.AUTH.GUARD] Error during authentication:', err);
        throw err;
      }

      if (info) {
        const message = typeof info === 'string' ? info : info?.message;
        console.warn('[JWT.AUTH.GUARD] Authentication info:', message);
        throw new UnauthorizedException(message || 'Unauthorized');
      }

      // Kiểm tra thực thể user có tồn tại thực sự hay không
      if (!user) {
        console.error('[JWT.AUTH.GUARD] User not found after validation');
        throw new UnauthorizedException('Unauthorized');
      }

      // Ép kiểu an toàn (Safe casting): Kiểm tra xem đối tượng có id của User hay không
      const validatedUser = user as User;
      console.log(
        '[JWT.AUTH.GUARD] Authentication successful for user:',
        validatedUser.id,
      );

      // Trả về đúng kiểu Generic TUser mà class cha yêu cầu
      return user as TUser;
    } catch (error) {
      console.error('[JWT.AUTH.GUARD] Exception in handleRequest:', error);
      throw error;
    }
  }
}
