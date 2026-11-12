import {
  applyDecorators,
  createParamDecorator,
  type ExecutionContext,
  UseGuards,
} from '@nestjs/common';
import { ApiSecurity, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { COOKIE_AUTH } from '../openapi/document.js';
import type { AuthUser } from './auth.constants.js';
import { type AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard.js';

/** Requires a valid access token; documents the cookie security and the 401. */
export function Auth(): MethodDecorator & ClassDecorator {
  return applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiSecurity(COOKIE_AUTH),
    ApiUnauthorizedResponse({ description: 'Missing, invalid or expired access token' }),
  );
}

/** The caller resolved by `@Auth()`. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthUser => {
    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (!user) {
      throw new Error('@CurrentUser() used on a route without @Auth()');
    }
    return user;
  },
);
