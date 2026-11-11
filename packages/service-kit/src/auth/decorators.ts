import {
  applyDecorators,
  createParamDecorator,
  type ExecutionContext,
  UseGuards,
} from '@nestjs/common';
import { ApiResponse, ApiSecurity } from '@nestjs/swagger';
import { ProblemDetailsSchema } from '../http/problem.js';
import { COOKIE_AUTH } from '../openapi/document.js';
import type { AuthUser } from './auth.constants.js';
import { type AuthenticatedRequest, JwtAuthGuard } from './jwt-auth.guard.js';

/** Requires a valid access token; documents the cookie security and the 401. */
export function Auth(): MethodDecorator & ClassDecorator {
  return applyDecorators(
    UseGuards(JwtAuthGuard),
    ApiSecurity(COOKIE_AUTH),
    ApiResponse({
      status: 401,
      description: 'Not authenticated (missing, invalid or expired access token)',
      standardSchema: ProblemDetailsSchema,
    }),
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

/** The request id (from `x-request-id` or minted by the logger), for correlating events. */
export const RequestId = createParamDecorator((_data: unknown, context: ExecutionContext) => {
  const id = (context.switchToHttp().getRequest<{ id?: unknown }>().id ?? '') as string | number;
  return String(id);
});

/** Documents a problem+json error response. */
export function ApiProblem(status: number, description: string): MethodDecorator & ClassDecorator {
  return ApiResponse({ status, description, standardSchema: ProblemDetailsSchema });
}
