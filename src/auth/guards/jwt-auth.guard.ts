import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContext } from '@nestjs/common';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const request = (context as any).switchToHttp().getRequest();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const authHeader = request.headers?.authorization;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log('[JWT.AUTH.GUARD] Request details:', {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        method: request.method,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        path: request.path,
        authHeaderPresent: !!authHeader,
      });

      if (err) {
        console.error('[JWT.AUTH.GUARD] Error during authentication:', err);
        throw err;
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (info) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        console.warn('[JWT.AUTH.GUARD] Authentication info:', info.message);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        throw new UnauthorizedException(info.message || 'Unauthorized');
      }

      if (!user) {
        console.error('[JWT.AUTH.GUARD] User not found after validation');
        throw new UnauthorizedException('Unauthorized');
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      console.log('[JWT.AUTH.GUARD] Authentication successful for user:',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        user.id);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return user;
    } catch (error) {
      console.error('[JWT.AUTH.GUARD] Exception in handleRequest:', error);
      throw error;
    }
  }
}
