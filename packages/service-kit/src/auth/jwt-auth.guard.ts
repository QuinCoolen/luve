import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { errors } from 'jose';
import { AccessTokenVerifier } from './access-token.verifier.js';
import { ACCESS_TOKEN_COOKIE, type AuthUser } from './auth.constants.js';

export type AuthenticatedRequest = Request & { user?: AuthUser };

/**
 * Accepts the access token from the `jwt` cookie (browsers) or an
 * `Authorization: Bearer` header (tools, other services). Any failure is a
 * 401; the web client answers it by refreshing the session once and retrying.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly verifier: AccessTokenVerifier) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractToken(request);
    if (!token) {
      throw new UnauthorizedException('Log in to continue.');
    }

    try {
      request.user = await this.verifier.verify(token);
      return true;
    } catch (error) {
      if (error instanceof errors.JWTExpired) {
        throw new UnauthorizedException('Access token expired.');
      }
      throw new UnauthorizedException('Invalid access token.');
    }
  }
}

function extractToken(request: Request): string | undefined {
  const cookie = (request.cookies as Record<string, string> | undefined)?.[ACCESS_TOKEN_COOKIE];
  if (cookie) {
    return cookie;
  }
  const header = request.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice('Bearer '.length) : undefined;
}
