import { randomUUID } from 'node:crypto';
import { ACCESS_TOKEN_ALGORITHM } from '@luve/service-kit';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SignJWT } from 'jose';
import type { Env } from '../env.js';
import { SigningKeys } from './signing-keys.js';

/** Issues short-lived access tokens: `{ sub, username }`, signed with EdDSA. */
@Injectable()
export class AccessTokens {
  constructor(
    private readonly keys: SigningKeys,
    private readonly config: ConfigService<Env, true>,
  ) {}

  get ttlSeconds(): number {
    return this.config.get('ACCESS_TOKEN_TTL_SECONDS', { infer: true });
  }

  issue(user: { id: string; username: string }): Promise<string> {
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
}
