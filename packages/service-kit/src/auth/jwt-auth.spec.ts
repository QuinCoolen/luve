import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { Controller, Get, type INestApplication, Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { exportJWK, generateKeyPair, type JWK, SignJWT } from 'jose';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { configureApp } from '../bootstrap.js';
import { ConfigKitModule } from '../config/config.module.js';
import { baseEnvSchema } from '../config/env.schema.js';
import { LoggingModule } from '../logging/logging.module.js';
import { defineService } from '../service.js';
import type { AuthUser, JwtAuthOptions } from './auth.constants.js';
import { Auth, CurrentUser } from './decorators.js';
import { JwtAuthModule } from './jwt-auth.module.js';

const ISSUER = 'luve-identity';
const AUDIENCE = 'luve';

@Controller('whoami')
class WhoAmIController {
  @Get()
  @Auth()
  whoami(@CurrentUser() user: AuthUser): AuthUser {
    return user;
  }
}

type KeyPair = Awaited<ReturnType<typeof generateKeyPair>>;

async function sign(
  keys: KeyPair,
  kid: string,
  claims: { sub: string; username: string },
  overrides: { expiresIn?: string | number; issuer?: string } = {},
): Promise<string> {
  return new SignJWT({ username: claims.username })
    .setProtectedHeader({ alg: 'EdDSA', kid })
    .setSubject(claims.sub)
    .setIssuer(overrides.issuer ?? ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(overrides.expiresIn ?? '5m')
    .sign(keys.privateKey);
}

async function createApp(jwks: JwtAuthOptions['jwks']): Promise<INestApplication> {
  process.env.PORT ??= '4999';
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';

  @Module({
    imports: [
      ConfigKitModule.forRoot(baseEnvSchema),
      LoggingModule.forRoot('test'),
      JwtAuthModule.forRootAsync({
        useFactory: () => ({ issuer: ISSUER, audience: AUDIENCE, jwks }),
      }),
    ],
    controllers: [WhoAmIController],
  })
  class TestAppModule {}

  const moduleRef = await Test.createTestingModule({ imports: [TestAppModule] }).compile();
  const app = moduleRef.createNestApplication({ bufferLogs: true });
  configureApp(app, defineService({ name: 'test', title: 'Test', module: TestAppModule }));
  await app.init();
  return app;
}

describe('JWT auth', () => {
  let keys: KeyPair;
  let publicJwk: JWK;
  const user = { sub: '0196f7a2-6c1d-7f00-8a1b-2c3d4e5f6a7b', username: 'alice' };

  beforeAll(async () => {
    keys = await generateKeyPair('EdDSA', { crv: 'Ed25519' });
    publicJwk = { ...(await exportJWK(keys.publicKey)), kid: 'k1', alg: 'EdDSA', use: 'sig' };
  });

  describe('with local keys', () => {
    let app: INestApplication;

    beforeAll(async () => {
      app = await createApp({ keys: [publicJwk] });
    });

    afterAll(async () => {
      await app.close();
    });

    it('accepts a valid token from the jwt cookie', async () => {
      const token = await sign(keys, 'k1', user);
      const res = await request(app.getHttpServer())
        .get('/api/v1/whoami')
        .set('Cookie', `jwt=${token}`)
        .expect(200);
      expect(res.body).toEqual({ id: user.sub, username: 'alice' });
    });

    it('accepts a bearer token', async () => {
      const token = await sign(keys, 'k1', user);
      await request(app.getHttpServer())
        .get('/api/v1/whoami')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
    });

    it('rejects a missing token', async () => {
      const res = await request(app.getHttpServer()).get('/api/v1/whoami').expect(401);
      expect(res.body.type).toBe('/errors/unauthenticated');
    });

    it('marks expired tokens so clients know to refresh', async () => {
      const token = await sign(keys, 'k1', user, {
        expiresIn: Math.floor(Date.now() / 1000) - 60,
      });
      const res = await request(app.getHttpServer())
        .get('/api/v1/whoami')
        .set('Cookie', `jwt=${token}`)
        .expect(401);
      expect(res.body.type).toBe('/errors/token-expired');
    });

    it('rejects a token from another issuer', async () => {
      const token = await sign(keys, 'k1', user, { issuer: 'someone-else' });
      const res = await request(app.getHttpServer())
        .get('/api/v1/whoami')
        .set('Cookie', `jwt=${token}`)
        .expect(401);
      expect(res.body.type).toBe('/errors/invalid-token');
    });

    it('rejects a token signed with an unknown key', async () => {
      const other = await generateKeyPair('EdDSA', { crv: 'Ed25519' });
      const token = await sign(other, 'k1', user);
      await request(app.getHttpServer())
        .get('/api/v1/whoami')
        .set('Cookie', `jwt=${token}`)
        .expect(401);
    });
  });

  describe('with a remote JWKS', () => {
    let app: INestApplication;
    let server: Server;
    let jwksRequests = 0;

    beforeAll(async () => {
      server = createServer((_req, res) => {
        jwksRequests += 1;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ keys: [publicJwk] }));
      });
      await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
      const { port } = server.address() as AddressInfo;
      app = await createApp({ url: `http://127.0.0.1:${port}/.well-known/jwks.json` });
    });

    afterAll(async () => {
      await app.close();
      await new Promise((resolve) => server.close(resolve));
    });

    it('fetches the key set once and caches it', async () => {
      const token = await sign(keys, 'k1', user);
      for (let i = 0; i < 3; i += 1) {
        await request(app.getHttpServer())
          .get('/api/v1/whoami')
          .set('Cookie', `jwt=${token}`)
          .expect(200);
      }
      expect(jwksRequests).toBe(1);
    });
  });
});
