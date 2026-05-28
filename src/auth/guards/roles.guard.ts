import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredRoles) {
            return true;
        }

        const { user } = context.switchToHttp().getRequest();

        // Kiểm tra xem user có ít nhất một trong các role yêu cầu không
        // Lưu ý: user.roles thường là mảng các object Role sau khi đã được mapping
        return requiredRoles.some((role) =>
            user.roles?.some((userRole) => userRole.name === role)
        );
    }
}
