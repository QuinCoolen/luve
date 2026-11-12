import { createParamDecorator, type ExecutionContext } from '@nestjs/common';
import type { TokenUser } from '../keys/access-tokens.js';
import type { AuthenticatedRequest } from './jwt-auth.guard.js';

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
