import { generateKeyPairSync } from 'node:crypto';
import { AccessTokenVerifier } from '@luve/service-kit';
import type { ConfigService } from '@nestjs/config';
import { decodeProtectedHeader } from 'jose';
import { describe, expect, it } from 'vitest';
import type { Env } from '../env.js';
import { AccessTokens } from './access-tokens.js';
import { SigningKeys } from './signing-keys.js';

function config(values: Partial<Env>): ConfigService<Env, true> {
  const env: Partial<Env> = {
    JWT_KEY_ID: 'test-key',
    JWT_ISSUER: 'luve-identity',
    JWT_AUDIENCE: 'luve',
    ACCESS_TOKEN_TTL_SECONDS: 900,
    ...values,
  };
  return { get: (key: keyof Env) => env[key] } as unknown as ConfigService<Env, true>;
}

describe('access tokens', () => {
  it('are verifiable with the published public key', async () => {
    const pem = generateKeyPairSync('ed25519')
      .privateKey.export({ format: 'pem', type: 'pkcs8' })
      .toString();
    const cfg = config({ JWT_PRIVATE_KEY: Buffer.from(pem).toString('base64') });
    const keys = new SigningKeys(cfg);
    const token = await new AccessTokens(keys, cfg).issue({ id: 'u-1', username: 'alice' });

    expect(decodeProtectedHeader(token)).toMatchObject({ alg: 'EdDSA', kid: 'test-key' });
    expect(keys.publicJwk).not.toHaveProperty('d'); // never publish the private part

    const verifier = new AccessTokenVerifier({
      issuer: 'luve-identity',
      audience: 'luve',
      jwks: { keys: [keys.publicJwk] },
    });
    await expect(verifier.verify(token)).resolves.toEqual({ id: 'u-1', username: 'alice' });
  });

  it('fall back to an ephemeral key when none is configured', () => {
    const keys = new SigningKeys(config({}));
    expect(keys.keyId).toMatch(/^ephemeral-/);
    expect(keys.publicJwk).toMatchObject({ kty: 'OKP', crv: 'Ed25519', alg: 'EdDSA' });
  });

  it('refuse a non-Ed25519 key', () => {
    const pem = generateKeyPairSync('ec', { namedCurve: 'P-256' })
      .privateKey.export({ format: 'pem', type: 'pkcs8' })
      .toString();
    expect(
      () => new SigningKeys(config({ JWT_PRIVATE_KEY: Buffer.from(pem).toString('base64') })),
    ).toThrow(/Ed25519/);
  });
});
