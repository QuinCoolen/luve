import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { createRemoteJWKSet, errors, type JWTVerifyGetKey, jwtVerify } from 'jose';
import type { Env } from '../env.js';

/** The user an access token belongs to. */
export interface TokenUser {
  id: string;
}

export type AuthenticatedRequest = Request & { user?: TokenUser };

/**
 * Copied from the auth service and adapted: auth checks tokens with its own
 * key, this service downloads auth's public keys from AUTH_JWKS_URL (once,
 * then cached) and checks them with those. No call to auth per request.
 *
 * Lets a request through only with a valid access token in the `jwt` cookie,
 * and puts its user on `request.user` (read it with @CurrentUser()).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly authPublicKeys: JWTVerifyGetKey;

  constructor(private readonly config: ConfigService<Env, true>) {
    this.authPublicKeys = createRemoteJWKSet(new URL(config.get('AUTH_JWKS_URL', { infer: true })));
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = (request.cookies as Record<string, string> | undefined)?.['jwt'];
    if (!token) {
      throw new UnauthorizedException('Log in to continue.');
    }

    try {
      const { payload } = await jwtVerify(token, this.authPublicKeys, {
        issuer: this.config.get('JWT_ISSUER', { infer: true }),
        audience: this.config.get('JWT_AUDIENCE', { infer: true }),
        algorithms: ['EdDSA'],
      });
      if (typeof payload.sub !== 'string') {
        throw new Error('access token has no subject');
      }
      request.user = { id: payload.sub };
      return true;
    } catch (error) {
      if (error instanceof errors.JWTExpired) {
        throw new UnauthorizedException('Access token expired.');
      }
      throw new UnauthorizedException('Invalid access token.');
    }
  }
}
