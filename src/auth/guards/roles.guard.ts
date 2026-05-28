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

        if (!user || !user.roles) {
            console.log('[RolesGuard] Access denied: User or roles not found in request');
            return false;
        }

        console.log('[RolesGuard] User roles:', user.roles.map(r => r.name));
        console.log('[RolesGuard] Required roles:', requiredRoles);

        // Kiểm tra không phân biệt chữ hoa chữ thường
        const hasRole = requiredRoles.some((role) =>
            user.roles?.some((userRole) => userRole.name.toUpperCase() === role.toUpperCase())
        );

        if (!hasRole) {
            console.log('[RolesGuard] Access denied: User does not have required roles');
        }

        return hasRole;
    }
}
