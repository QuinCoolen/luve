import { type CanActivate, type ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { errors } from 'jose';
import { ProblemException } from '../http/problem.js';
import { AccessTokenVerifier } from './access-token.verifier.js';
import { ACCESS_TOKEN_COOKIE, type AuthUser } from './auth.constants.js';

export type AuthenticatedRequest = Request & { user?: AuthUser };

/**
 * Accepts the access token from the `jwt` cookie (browsers) or an
 * `Authorization: Bearer` header (tools, other services). An expired token
 * gets its own problem type, so the web client knows to refresh and retry.
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly verifier: AccessTokenVerifier) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = extractToken(request);
    if (!token) {
      throw unauthorized(
        '/errors/unauthenticated',
        'Authentication required',
        'Log in to continue.',
      );
    }

    try {
      request.user = await this.verifier.verify(token);
      return true;
    } catch (error) {
      if (error instanceof errors.JWTExpired) {
        throw unauthorized(
          '/errors/token-expired',
          'Access token expired',
          'Refresh the session and retry.',
        );
      }
      throw unauthorized('/errors/invalid-token', 'Invalid access token', 'Log in again.');
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

function unauthorized(type: string, title: string, detail: string): ProblemException {
  return new ProblemException({ status: 401, type, title, detail });
}
