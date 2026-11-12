import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { AuthenticatedRequest, TokenUser } from './jwt-auth.guard.js';

/** The signed-in user, as checked by JwtAuthGuard: `me(@CurrentUser() user: TokenUser)`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): TokenUser => {
    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (!user) {
      throw new Error('@CurrentUser() used on a route without @UseGuards(JwtAuthGuard)');
    }
    return user;
  },
);
