import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createServer, type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EVENTS_EXCHANGE } from '@luve/contracts';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RabbitMQContainer, type StartedRabbitMQContainer } from '@testcontainers/rabbitmq';
import { exportJWK, generateKeyPair, SignJWT } from 'jose';
import request, { type Response } from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { AuthEventsConsumer } from '../src/profiles/auth-events.consumer.js';
import { setupApp } from '../src/setup.js';

/**
 * End-to-end against a real Postgres and a real RabbitMQ (Testcontainers).
 *
 * - Events: the tests publish auth's events to the exchange, like the auth
 *   service does, and wait for the profile to change. The messages are the
 *   example messages @luve/contracts checks against the event schemas.
 * - Tokens: a small HTTP server plays the auth service's JWKS endpoint, and
 *   the tests sign access tokens with the matching private key.
 */

const serviceRoot = fileURLToPath(new URL('..', import.meta.url));
const fixtures = new URL('../../../packages/contracts/fixtures/', import.meta.url);

function fixture(type: string): { type: string; data: Record<string, unknown> } {
  return JSON.parse(readFileSync(new URL(`${type}.json`, fixtures), 'utf8'));
}

const registered = fixture('auth.user-registered.v1');
const deleted = fixture('auth.user-deleted.v1');
const aliceId = registered.data['userId'] as string;
const bobId = '0196f7a2-6c1d-7f00-8a1b-2c3d4e5f6a7c';

let postgres: StartedPostgreSqlContainer;
let rabbitmq: StartedRabbitMQContainer;
let jwksServer: Server;
type PrivateKey = Awaited<ReturnType<typeof generateKeyPair>>['privateKey'];
let signingKey: PrivateKey;
let app: INestApplication;
let amqp: AmqpConnection;
let consumer: AuthEventsConsumer;

/** An access token like the auth service issues. */
function tokenFor(userId: string, key: PrivateKey = signingKey): Promise<string> {
  return new SignJWT({})
    .setProtectedHeader({ alg: 'EdDSA', kid: 'test-key' })
    .setSubject(userId)
    .setIssuer('luve-auth')
    .setAudience('luve')
    .setIssuedAt()
    .setExpirationTime('5m')
    .sign(key);
}

beforeAll(async () => {
  const keys = await generateKeyPair('EdDSA', { crv: 'Ed25519' });
  signingKey = keys.privateKey;
  const publicJwk = { ...(await exportJWK(keys.publicKey)), kid: 'test-key', alg: 'EdDSA' };
  jwksServer = createServer((_req, res) => {
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ keys: [publicJwk] }));
  });
  await new Promise<void>((resolve) => jwksServer.listen(0, '127.0.0.1', resolve));
  const jwksPort = (jwksServer.address() as AddressInfo).port;

  [postgres, rabbitmq] = await Promise.all([
    new PostgreSqlContainer('postgres:16-alpine').start(),
    new RabbitMQContainer('rabbitmq:4-alpine').start(),
  ]);
  const databaseUrl = postgres.getConnectionUri();
  execSync('pnpm exec prisma migrate deploy', {
    cwd: serviceRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });

  Object.assign(process.env, {
    DATABASE_URL: databaseUrl,
    RABBITMQ_URL: rabbitmq.getAmqpUrl(),
    AUTH_JWKS_URL: `http://127.0.0.1:${jwksPort}/.well-known/jwks.json`,
  });
  // Imported after the env is set: ConfigModule validates at import time.
  const { AppModule } = await import('../src/app.module.js');
  const { AuthEventsConsumer } = await import('../src/profiles/auth-events.consumer.js');

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ logger: false });
  setupApp(app);
  await app.init();
  amqp = app.get(AmqpConnection);
  consumer = app.get(AuthEventsConsumer);
});

afterAll(async () => {
  await app?.close();
  await Promise.all([postgres?.stop(), rabbitmq?.stop()]);
  jwksServer?.close();
});

function getProfile(id: string) {
  return api().get(`/api/v1/users/${id}`);
}

/** The cookie a browser signed in as `userId` would send. */
async function cookieFor(userId: string): Promise<string> {
  return `jwt=${await tokenFor(userId)}`;
}

function api() {
  return request(app.getHttpServer());
}

/** Publishes like the auth service does: to the events exchange, routed by type. */
function publish(message: { type: string }): Promise<unknown> {
  return amqp.publish(EVENTS_EXCHANGE, message.type, message);
}

/** The consumer works asynchronously, so retry the check until it passes (max 5 s). */
function eventually<T>(check: () => Promise<T>): Promise<T> {
  return vi.waitFor(check, { timeout: 5_000, interval: 100 });
}

/** The distinct fields in `["username: …", …]`, sorted. */
function fieldsIn(res: Response): string[] {
  const fields = (res.body.message as string[]).map((message) => message.split(':')[0]!);
  return [...new Set(fields)].sort();
}

describe('a new account', () => {
  it('has no profile before auth says it registered', async () => {
    await getProfile(aliceId).expect(404);
  });

  it('gets an empty profile on user-registered', async () => {
    await publish(registered);
    const res = await eventually(() => getProfile(aliceId).expect(200));
    expect(res.body).toEqual({
      id: aliceId,
      username: null,
      createdAt: registered.data['registeredAt'],
    });
  });

  it('changes nothing when the same event is delivered twice', async () => {
    await consumer.handle(registered);
    await getProfile(aliceId).expect(200);
  });
});

describe('your profile', () => {
  it('needs a signed-in user', async () => {
    const res = await api().get('/api/v1/users/me').expect(401);
    expect(res.body.message).toBe('Log in to continue.');
  });

  it('rejects a token that auth did not sign', async () => {
    const { privateKey } = await generateKeyPair('EdDSA', { crv: 'Ed25519' });
    const res = await request(app.getHttpServer())
      .get('/api/v1/users/me')
      .set('Cookie', `jwt=${await tokenFor(aliceId, privateKey)}`)
      .expect(401);
    expect(res.body.message).toBe('Invalid access token.');
  });

  it('has no username yet', async () => {
    const res = await api()
      .get('/api/v1/users/me')
      .set('Cookie', await cookieFor(aliceId))
      .expect(200);
    expect(res.body).toEqual({ id: aliceId, username: null });
  });

  it('validates the username', async () => {
    const res = await api()
      .patch('/api/v1/users/me')
      .set('Cookie', await cookieFor(aliceId))
      .send({ username: 'x' })
      .expect(400);
    expect(fieldsIn(res)).toEqual(['username']);
  });

  it('sets the username, which shows on the public profile', async () => {
    const res = await api()
      .patch('/api/v1/users/me')
      .set('Cookie', await cookieFor(aliceId))
      .send({ username: 'alice' })
      .expect(200);
    expect(res.body).toEqual({ id: aliceId, username: 'alice' });
    const profile = await getProfile(aliceId).expect(200);
    expect(profile.body.username).toBe('alice');
  });

  it('refuses a username someone else has', async () => {
    const res = await api()
      .patch('/api/v1/users/me')
      .set('Cookie', await cookieFor(bobId))
      .send({ username: 'alice' })
      .expect(409);
    expect(res.body.message).toEqual(['username: This username is taken.']);
  });

  it('works even before the user-registered event has arrived', async () => {
    await api()
      .patch('/api/v1/users/me')
      .set('Cookie', await cookieFor(bobId))
      .send({ username: 'bob' })
      .expect(200);
    // The late event only fills in the registration date; the username stays.
    const bobRegistered = {
      ...registered,
      eventId: '0196f7a2-6c1e-7b3a-9d2e-4f5a6b7c8d9f',
      data: { ...registered.data, userId: bobId, email: 'bob@luve.dev' },
    };
    await consumer.handle(bobRegistered);
    const profile = await getProfile(bobId).expect(200);
    expect(profile.body).toMatchObject({
      username: 'bob',
      createdAt: registered.data['registeredAt'],
    });
  });
});

describe('a deleted account', () => {
  it('loses its profile on user-deleted', async () => {
    await publish(deleted);
    await eventually(() => getProfile(aliceId).expect(404));
  });
});

describe('bad input', () => {
  it('rejects a message that breaks its contract', async () => {
    const broken = { ...registered, data: { ...registered.data, userId: 'not-a-uuid' } };
    await expect(consumer.handle(broken)).rejects.toThrow();
  });

  it('validates the user id', async () => {
    await getProfile('not-a-uuid').expect(400);
  });
});
