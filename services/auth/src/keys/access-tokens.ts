import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { jwtVerify, SignJWT } from 'jose';
import type { Env } from '../env.js';
import { ACCESS_TOKEN_ALGORITHM, SigningKeys } from './signing-keys.js';

/** The user an access token belongs to. */
export interface TokenUser {
  id: string;
  username: string;
}

/** Issues and checks short-lived access tokens: `{ sub, username }`, signed with EdDSA. */
@Injectable()
export class AccessTokens {
  constructor(
    private readonly keys: SigningKeys,
    private readonly config: ConfigService<Env, true>,
  ) {}

  get ttlSeconds(): number {
    return this.config.get('ACCESS_TOKEN_TTL_SECONDS', { infer: true });
  }

  issue(user: TokenUser): Promise<string> {
    return new SignJWT({ username: user.username })
      .setProtectedHeader({ alg: ACCESS_TOKEN_ALGORITHM, kid: this.keys.keyId, typ: 'JWT' })
      .setSubject(user.id)
      .setIssuer(this.config.get('JWT_ISSUER', { infer: true }))
      .setAudience(this.config.get('JWT_AUDIENCE', { infer: true }))
      .setIssuedAt()
      .setExpirationTime(`${this.ttlSeconds}s`)
      .setJti(randomUUID())
      .sign(this.keys.privateKey);
  }

  /** Resolves the token's user, or throws one of jose's `errors.*` (e.g. JWTExpired). */
  async verify(token: string): Promise<TokenUser> {
    const { payload } = await jwtVerify(token, this.keys.publicKey, {
      issuer: this.config.get('JWT_ISSUER', { infer: true }),
      audience: this.config.get('JWT_AUDIENCE', { infer: true }),
      algorithms: [ACCESS_TOKEN_ALGORITHM],
    });
    if (typeof payload.sub !== 'string' || typeof payload['username'] !== 'string') {
      throw new Error('access token is missing the sub or username claim');
    }
    return { id: payload.sub, username: payload['username'] };
  }
}
