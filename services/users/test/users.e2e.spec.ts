import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { EVENTS_EXCHANGE } from '@luve/contracts';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { RabbitMQContainer, type StartedRabbitMQContainer } from '@testcontainers/rabbitmq';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { AuthEventsConsumer } from '../src/profiles/auth-events.consumer.js';
import { setupApp } from '../src/setup.js';

/**
 * End-to-end against a real Postgres and a real RabbitMQ (Testcontainers).
 * The tests publish auth's events to the exchange, like the auth service does,
 * and wait for the profile to change. The messages are the example messages
 * that @luve/contracts checks against the event schemas, so this service and
 * auth agree on what they look like.
 */

const serviceRoot = fileURLToPath(new URL('..', import.meta.url));
const fixtures = new URL('../../../packages/contracts/fixtures/', import.meta.url);

function fixture(type: string): { type: string; data: Record<string, unknown> } {
  return JSON.parse(readFileSync(new URL(`${type}.json`, fixtures), 'utf8'));
}

const registered = fixture('auth.user-registered.v1');
const updated = fixture('auth.user-updated.v1');
const deleted = fixture('auth.user-deleted.v1');
const userId = registered.data['userId'] as string;

let postgres: StartedPostgreSqlContainer;
let rabbitmq: StartedRabbitMQContainer;
let app: INestApplication;
let amqp: AmqpConnection;
let consumer: AuthEventsConsumer;

beforeAll(async () => {
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

  Object.assign(process.env, { DATABASE_URL: databaseUrl, RABBITMQ_URL: rabbitmq.getAmqpUrl() });
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
});

function getProfile(id: string) {
  return request(app.getHttpServer()).get(`/api/v1/users/${id}`);
}

/** Publishes like the auth service does: to the events exchange, routed by type. */
function publish(message: { type: string }): Promise<unknown> {
  return amqp.publish(EVENTS_EXCHANGE, message.type, message);
}

/** The consumer works asynchronously, so retry the check until it passes (max 5 s). */
function eventually<T>(check: () => Promise<T>): Promise<T> {
  return vi.waitFor(check, { timeout: 5_000, interval: 100 });
}

describe('profiles from auth events', () => {
  it('has no profile before the user registers', async () => {
    await getProfile(userId).expect(404);
  });

  it('creates the profile on user-registered', async () => {
    await publish(registered);
    const res = await eventually(() => getProfile(userId).expect(200));
    expect(res.body).toEqual({
      id: userId,
      username: 'alice',
      createdAt: registered.data['registeredAt'],
    });
  });

  it('changes nothing when the same event is delivered twice', async () => {
    await consumer.handle(registered);
    const res = await getProfile(userId).expect(200);
    expect(res.body.username).toBe('alice');
  });

  it('renames on user-updated', async () => {
    await publish(updated);
    await eventually(async () => {
      const res = await getProfile(userId).expect(200);
      expect(res.body.username).toBe('alice_b');
    });
  });

  it('removes the profile on user-deleted', async () => {
    await publish(deleted);
    await eventually(() => getProfile(userId).expect(404));
  });

  it('rejects a message that breaks its contract', async () => {
    const broken = { ...registered, data: { ...registered.data, userId: 'not-a-uuid' } };
    await expect(consumer.handle(broken)).rejects.toThrow();
  });
});

describe('GET /api/v1/users/:id', () => {
  it('validates the user id', async () => {
    await getProfile('not-a-uuid').expect(400);
  });
});
