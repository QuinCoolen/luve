import { Inject, Injectable } from '@nestjs/common';
import { createLocalJWKSet, createRemoteJWKSet, type JWTVerifyGetKey, jwtVerify } from 'jose';
import {
  ACCESS_TOKEN_ALGORITHM,
  type AuthUser,
  JWT_AUTH_OPTIONS,
  type JwtAuthOptions,
} from './auth.constants.js';

/**
 * Verifies access tokens locally with identity's public keys. With a JWKS URL
 * the key set is fetched lazily, cached, and refetched when a token carries an
 * unknown key id (so identity can rotate keys), never once per request.
 */
@Injectable()
export class AccessTokenVerifier {
  private readonly getKey: JWTVerifyGetKey;

  constructor(@Inject(JWT_AUTH_OPTIONS) private readonly options: JwtAuthOptions) {
    this.getKey =
      'url' in options.jwks
        ? createRemoteJWKSet(new URL(options.jwks.url), {
            cooldownDuration: 30_000,
            cacheMaxAge: 10 * 60_000,
          })
        : createLocalJWKSet({ keys: options.jwks.keys });
  }

  /** Resolves the caller, or throws one of jose's `errors.*` when the token is invalid. */
  async verify(token: string): Promise<AuthUser> {
    const { payload } = await jwtVerify(token, this.getKey, {
      issuer: this.options.issuer,
      audience: this.options.audience,
      algorithms: [ACCESS_TOKEN_ALGORITHM],
    });
    if (typeof payload.sub !== 'string' || typeof payload['username'] !== 'string') {
      throw new Error('access token is missing the sub or username claim');
    }
    return { id: payload.sub, username: payload['username'] };
  }
}
