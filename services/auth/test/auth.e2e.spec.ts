import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import request, { type Response } from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrismaService } from '../src/prisma/prisma.service.js';
import { setupApp } from '../src/setup.js';

/**
 * End-to-end against a real Postgres (Testcontainers): HTTP in, rows and
 * outbox messages out. RabbitMQ isn't needed: the outbox relay is switched
 * off, so staged events stay in nest_outbox.messages where we can assert them.
 */

const serviceRoot = fileURLToPath(new URL('..', import.meta.url));

let container: StartedPostgreSqlContainer;
let app: INestApplication;
let prisma: PrismaService;

/** `{ jwt: '…', refresh: '…' }` from the Set-Cookie headers (empty value = cleared). */
function cookies(res: Response): Record<string, string> {
  const header = res.headers['set-cookie'] as unknown as string[] | undefined;
  return Object.fromEntries(
    (header ?? []).map((cookie) => {
      const [pair] = cookie.split(';');
      const index = pair!.indexOf('=');
      return [pair!.slice(0, index), decodeURIComponent(pair!.slice(index + 1))];
    }),
  );
}

async function outboxTopics(): Promise<
  Array<{ topic: string; payload: { data: Record<string, unknown> } }>
> {
  return prisma.$queryRawUnsafe('SELECT topic, payload FROM nest_outbox.messages ORDER BY seq');
}

/** The distinct fields in `["email: Invalid email address", …]`, sorted. */
function fieldsIn(res: Response): string[] {
  const fields = (res.body.message as string[]).map((message) => message.split(':')[0]!);
  return [...new Set(fields)].sort();
}

const alice = { email: 'Alice@Luve.dev', password: 'Password123' };

beforeAll(async () => {
  container = await new PostgreSqlContainer('postgres:16-alpine').start();
  const databaseUrl = container.getConnectionUri();
  execSync('pnpm exec prisma migrate deploy', {
    cwd: serviceRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });

  Object.assign(process.env, {
    DATABASE_URL: databaseUrl,
    // Never reached: the relay is off and the connection doesn't block boot.
    RABBITMQ_URL: 'amqp://guest:guest@127.0.0.1:1',
    OUTBOX_RELAY: 'off',
    // No grace window, so a replayed refresh token is always treated as reuse.
    REFRESH_REUSE_GRACE_SECONDS: '0',
  });
  // Imported after the env is set: ConfigModule validates at import time.
  const { AppModule } = await import('../src/app.module.js');
  const { PrismaService } = await import('../src/prisma/prisma.service.js');

  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  app = moduleRef.createNestApplication({ logger: false });
  setupApp(app);
  await app.init();
  prisma = app.get(PrismaService);
});

afterAll(async () => {
  await app?.close();
  await container?.stop();
});

describe('registration', () => {
  let res: Response;

  beforeAll(async () => {
    res = await request(app.getHttpServer()).post('/api/v1/auth/register').send(alice);
  });

  it('creates the account and signs in', () => {
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ id: expect.any(String), email: 'alice@luve.dev' });
    const set = cookies(res);
    expect(set['jwt']).toBeTruthy();
    expect(set['refresh']).toBeTruthy();
  });

  it('scopes the refresh cookie to the auth endpoints', () => {
    const header = (res.headers['set-cookie'] as unknown as string[]).find((c) =>
      c.startsWith('refresh='),
    );
    expect(header).toMatch(/Path=\/api\/v1\/auth/);
    expect(header).toMatch(/HttpOnly/);
  });

  it('stores an argon2id hash, never the password', async () => {
    const user = await prisma.user.findUniqueOrThrow({ where: { email: 'alice@luve.dev' } });
    expect(user.passwordHash).toMatch(/^\$argon2id\$/);
  });

  it('stages user-registered in the same transaction', async () => {
    const messages = await outboxTopics();
    expect(messages).toHaveLength(1);
    expect(messages[0]!.topic).toBe('auth.user-registered.v1');
    expect(messages[0]!.payload.data).toMatchObject({
      userId: res.body.id,
      email: 'alice@luve.dev',
    });
  });

  it('refuses a taken email', async () => {
    const dup = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ ...alice, email: 'ALICE@luve.dev' })
      .expect(409);
    expect(fieldsIn(dup)).toEqual(['email']);
  });

  it('reports every invalid field', async () => {
    const bad = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({ email: 'nope', password: 'short' })
      .expect(400);
    expect(fieldsIn(bad)).toEqual(['email', 'password']);
  });
});

describe('login', () => {
  it('rejects a wrong password and an unknown email the same way', async () => {
    const wrong = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: alice.email, password: 'Wrong12345' })
      .expect(401);
    const unknown = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({ email: 'nobody@luve.dev', password: 'Wrong12345' })
      .expect(401);
    expect(wrong.body.message).toBe('The email or password is incorrect.');
    expect(unknown.body).toEqual(wrong.body);
  });

  it('signs in with both cookies', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send(alice)
      .expect(200);
    expect(res.body.email).toBe('alice@luve.dev');
    expect(cookies(res)).toMatchObject({ jwt: expect.any(String), refresh: expect.any(String) });
  });
});

describe('refresh token rotation', () => {
  it('rotates the refresh token on every use', async () => {
    const login = await request(app.getHttpServer()).post('/api/v1/auth/login').send(alice);
    const first = cookies(login)['refresh']!;

    const refreshed = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', `refresh=${first}`)
      .expect(204);
    const second = cookies(refreshed)['refresh']!;
    expect(second).toBeTruthy();
    expect(second).not.toBe(first);
    expect(cookies(refreshed)['jwt']).toBeTruthy();
  });

  it('revokes the whole family when a rotated token is replayed', async () => {
    const login = await request(app.getHttpServer()).post('/api/v1/auth/login').send(alice);
    const stolen = cookies(login)['refresh']!;
    const rotated = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', `refresh=${stolen}`)
      .expect(204);
    const current = cookies(rotated)['refresh']!;

    // The attacker replays the old token…
    const replay = await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', `refresh=${stolen}`)
      .expect(401);
    expect(replay.body.message).toMatch(/already used/);

    // …which also kills the legitimate user's current token.
    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', `refresh=${current}`)
      .expect(401);
  });

  it('ends the session on logout', async () => {
    const login = await request(app.getHttpServer()).post('/api/v1/auth/login').send(alice);
    const token = cookies(login)['refresh']!;

    const logout = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', `refresh=${token}`)
      .expect(204);
    expect(cookies(logout)).toMatchObject({ jwt: '', refresh: '' });

    await request(app.getHttpServer())
      .post('/api/v1/auth/refresh')
      .set('Cookie', `refresh=${token}`)
      .expect(401);
  });
});

describe('deleting your account', () => {
  it('needs a signed-in user', async () => {
    const res = await request(app.getHttpServer()).delete('/api/v1/auth/me').expect(401);
    expect(res.body.message).toBe('Log in to continue.');
  });

  it('deletes the account and its sessions, signs out and stages user-deleted', async () => {
    const agent = request.agent(app.getHttpServer());
    const { body: me } = await agent
      .post('/api/v1/auth/register')
      .send({ email: 'carol@luve.dev', password: 'Password123' })
      .expect(201);

    const res = await agent.delete('/api/v1/auth/me').expect(204);
    expect(cookies(res)).toMatchObject({ jwt: '', refresh: '' });
    expect(await prisma.user.count({ where: { id: me.id } })).toBe(0);
    expect(await prisma.session.count({ where: { userId: me.id } })).toBe(0);

    const deleted = (await outboxTopics()).filter(
      (message) => message.topic === 'auth.user-deleted.v1',
    );
    expect(deleted.map((message) => message.payload.data['userId'])).toContain(me.id);
  });
});

describe('JWKS', () => {
  it('publishes the public signing key outside /api', async () => {
    const res = await request(app.getHttpServer()).get('/.well-known/jwks.json').expect(200);
    expect(res.body.keys).toHaveLength(1);
    expect(res.body.keys[0]).toMatchObject({ kty: 'OKP', crv: 'Ed25519', alg: 'EdDSA' });
    expect(res.body.keys[0]).not.toHaveProperty('d');
  });
});
