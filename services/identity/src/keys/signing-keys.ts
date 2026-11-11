import {
  createPrivateKey,
  createPublicKey,
  generateKeyPairSync,
  type KeyObject,
} from 'node:crypto';
import { ACCESS_TOKEN_ALGORITHM } from '@luve/service-kit';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { JWK } from 'jose';
import type { Env } from '../env.js';

/**
 * The Ed25519 key identity signs access tokens with. The private half never
 * leaves this service; the public half is published as a JWKS so every other
 * service can verify tokens on its own.
 *
 * Without JWT_PRIVATE_KEY an ephemeral key is generated: access tokens then
 * stop verifying after a restart, and clients recover by refreshing (refresh
 * tokens live in the database, not in the key).
 */
@Injectable()
export class SigningKeys {
  private readonly logger = new Logger(SigningKeys.name);
  readonly keyId: string;
  readonly privateKey: KeyObject;
  readonly publicJwk: JWK;

  constructor(config: ConfigService<Env, true>) {
    const encoded = config.get('JWT_PRIVATE_KEY', { infer: true });
    if (encoded) {
      this.privateKey = createPrivateKey(Buffer.from(encoded, 'base64').toString('utf8'));
      this.keyId = config.get('JWT_KEY_ID', { infer: true });
    } else {
      this.privateKey = generateKeyPairSync('ed25519').privateKey;
      this.keyId = `ephemeral-${Date.now().toString(36)}`;
      this.logger.warn(
        'JWT_PRIVATE_KEY is not set: using an ephemeral signing key. Run `pnpm --filter @luve/identity keys:generate` for a stable one.',
      );
    }

    if (this.privateKey.asymmetricKeyType !== 'ed25519') {
      throw new Error(
        `JWT_PRIVATE_KEY must be an Ed25519 key, got ${this.privateKey.asymmetricKeyType}`,
      );
    }

    this.publicJwk = {
      ...(createPublicKey(this.privateKey).export({ format: 'jwk' }) as JWK),
      kid: this.keyId,
      alg: ACCESS_TOKEN_ALGORITHM,
      use: 'sig',
    };
  }
}
