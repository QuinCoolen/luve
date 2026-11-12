import { generateKeyPairSync } from 'node:crypto';
import type { ConfigService } from '@nestjs/config';
import { decodeProtectedHeader, errors } from 'jose';
import { describe, expect, it } from 'vitest';
import type { Env } from '../env.js';
import { AccessTokens } from './access-tokens.js';
import { SigningKeys } from './signing-keys.js';

function config(values: Partial<Env>): ConfigService<Env, true> {
  const env: Partial<Env> = {
    JWT_KEY_ID: 'test-key',
    JWT_ISSUER: 'luve-auth',
    JWT_AUDIENCE: 'luve',
    ACCESS_TOKEN_TTL_SECONDS: 900,
    ...values,
  };
  return { get: (key: keyof Env) => env[key] } as unknown as ConfigService<Env, true>;
}

describe('access tokens', () => {
  it('round-trip: an issued token verifies to its user', async () => {
    const pem = generateKeyPairSync('ed25519')
      .privateKey.export({ format: 'pem', type: 'pkcs8' })
      .toString();
    const cfg = config({ JWT_PRIVATE_KEY: Buffer.from(pem).toString('base64') });
    const keys = new SigningKeys(cfg);
    const tokens = new AccessTokens(keys, cfg);
    const token = await tokens.issue({ id: 'u-1', username: 'alice' });

    expect(decodeProtectedHeader(token)).toMatchObject({ alg: 'EdDSA', kid: 'test-key' });
    expect(keys.publicJwk).not.toHaveProperty('d'); // never publish the private part
    await expect(tokens.verify(token)).resolves.toEqual({ id: 'u-1', username: 'alice' });
  });

  it('reject a token signed with another key', async () => {
    const cfg = config({});
    const token = await new AccessTokens(new SigningKeys(cfg), cfg).issue({
      id: 'u-1',
      username: 'alice',
    });
    const otherKeys = new AccessTokens(new SigningKeys(cfg), cfg);
    await expect(otherKeys.verify(token)).rejects.toBeInstanceOf(
      errors.JWSSignatureVerificationFailed,
    );
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
