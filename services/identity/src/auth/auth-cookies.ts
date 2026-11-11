import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE } from '@luve/service-kit';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { CookieOptions, Response } from 'express';
import type { Env } from '../env.js';
import type { IssuedRefreshToken } from './sessions.js';

/** The refresh cookie only travels to the auth endpoints, never to other APIs. */
export const REFRESH_COOKIE_PATH = '/api/v1/auth';

/**
 * Both tokens live in httpOnly cookies, so page scripts can't read them. The
 * browser and API share one origin (the gateway), so SameSite=Lax cookies are
 * first-party and no CORS is involved.
 */
@Injectable()
export class AuthCookies {
  constructor(private readonly config: ConfigService<Env, true>) {}

  private base(): CookieOptions {
    return {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.config.get('COOKIE_SECURE', { infer: true }),
    };
  }

  setAccessToken(res: Response, token: string, ttlSeconds: number): void {
    res.cookie(ACCESS_TOKEN_COOKIE, token, {
      ...this.base(),
      path: '/',
      maxAge: ttlSeconds * 1000,
    });
  }

  setRefreshToken(res: Response, refresh: IssuedRefreshToken): void {
    res.cookie(REFRESH_TOKEN_COOKIE, refresh.token, {
      ...this.base(),
      path: REFRESH_COOKIE_PATH,
      expires: refresh.expiresAt,
    });
  }

  clear(res: Response): void {
    res.clearCookie(ACCESS_TOKEN_COOKIE, { ...this.base(), path: '/' });
    res.clearCookie(REFRESH_TOKEN_COOKIE, { ...this.base(), path: REFRESH_COOKIE_PATH });
  }
}
