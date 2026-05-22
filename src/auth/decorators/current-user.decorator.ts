import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '../../models/user/entities/user.entity';

// eslint-disable-next-line @typescript-eslint/naming-convention
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): User => {
    const request = ctx.switchToHttp().getRequest();
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return request.user as User;
  },
);
