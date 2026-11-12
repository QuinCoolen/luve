import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { errors } from 'jose';
import { AccessTokens, type TokenUser } from '../keys/access-tokens.js';
import { ACCESS_TOKEN_COOKIE } from './auth-cookies.js';

export type AuthenticatedRequest = Request & { user?: TokenUser };

/**
 * Lets a request through only with a valid access token in the `jwt` cookie,
 * and puts its user on `request.user` (read it with @CurrentUser()). Any
 * failure is a 401; the web client answers it by refreshing the session once
 * and retrying.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly accessTokens: AccessTokens) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = (request.cookies as Record<string, string> | undefined)?.[ACCESS_TOKEN_COOKIE];
    if (!token) {
      throw new UnauthorizedException('Log in to continue.');
    }

    try {
      request.user = await this.accessTokens.verify(token);
      return true;
    } catch (error) {
      if (error instanceof errors.JWTExpired) {
        throw new UnauthorizedException('Access token expired.');
      }
      throw new UnauthorizedException('Invalid access token.');
    }
  }
}
