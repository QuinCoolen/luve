import {
  Body,
  Controller,
  Get,
  Injectable,
  type INestApplication,
  Module,
  Post,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { configureApp } from './bootstrap.js';
import { ConfigKitModule } from './config/config.module.js';
import { baseEnvSchema } from './config/env.schema.js';
import { HealthKitModule } from './health/health.module.js';
import type { ReadinessCheck } from './health/readiness-check.js';
import { ProblemException } from './http/problem.js';
import { LoggingModule } from './logging/logging.module.js';
import { defineService } from './service.js';

const EchoSchema = z.object({
  name: z.string().min(2),
  address: z.object({ city: z.string() }),
});

@Injectable()
class GreetingService {
  greet(name: string): string {
    return `hello ${name}`;
  }
}

@Controller('demo')
class DemoController {
  // Implicit constructor injection: proves decorator metadata is emitted by
  // the test transform (Vite/Oxc), which Nest DI relies on.
  constructor(private readonly greetings: GreetingService) {}

  @Post('echo')
  echo(@Body({ schema: EchoSchema }) body: z.infer<typeof EchoSchema>) {
    return { greeting: this.greetings.greet(body.name) };
  }

  @Get('conflict')
  conflict(): never {
    throw new ProblemException({
      status: 409,
      type: '/errors/demo-conflict',
      title: 'Demo conflict',
      detail: 'Something already happened.',
    });
  }

  @Get('boom')
  boom(): never {
    throw new Error('secret internals');
  }
}

@Injectable()
class AlwaysUp implements ReadinessCheck {
  readonly name = 'always-up';
  async check(): Promise<void> {}
}

@Injectable()
class AlwaysDown implements ReadinessCheck {
  readonly name = 'always-down';
  async check(): Promise<void> {
    throw new Error('dependency unreachable');
  }
}

async function createApp(checks: Array<new () => ReadinessCheck>): Promise<INestApplication> {
  process.env.PORT ??= '4999';
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';

  @Module({
    imports: [
      ConfigKitModule.forRoot(baseEnvSchema),
      LoggingModule.forRoot('test'),
      HealthKitModule.forRoot({ checks }),
    ],
    controllers: [DemoController],
    providers: [GreetingService],
  })
  class TestAppModule {}

  const moduleRef = await Test.createTestingModule({ imports: [TestAppModule] }).compile();
  const app = moduleRef.createNestApplication({ bufferLogs: true });
  configureApp(app, defineService({ name: 'test', title: 'Test API', module: TestAppModule }));
  await app.init();
  return app;
}

describe('configureApp', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createApp([AlwaysUp]);
  });

  afterAll(async () => {
    await app.close();
  });

  it('serves routes under /api/v1 and resolves injected providers', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/demo/echo')
      .send({ name: 'Quin', address: { city: 'Eindhoven' } })
      .expect(201);
    expect(res.body).toEqual({ greeting: 'hello Quin' });
  });

  it('turns schema failures into field-keyed problem+json', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/demo/echo')
      .send({ name: 'Q', address: {} })
      .expect(400);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(res.body).toMatchObject({
      type: '/errors/validation',
      status: 400,
      instance: '/api/v1/demo/echo',
    });
    expect(Object.keys(res.body.errors).sort()).toEqual(['address.city', 'name']);
  });

  it('renders ProblemException with its own type', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/demo/conflict').expect(409);
    expect(res.body).toMatchObject({ type: '/errors/demo-conflict', title: 'Demo conflict' });
  });

  it('hides internals of unexpected errors', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/demo/boom').expect(500);
    expect(res.body.detail).toBe('An unexpected error occurred.');
    expect(JSON.stringify(res.body)).not.toContain('secret internals');
  });

  it('returns problem+json 404 for unknown routes', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/nope').expect(404);
    expect(res.body).toMatchObject({ type: '/errors/not-found', status: 404 });
  });

  it('keeps health probes outside the prefix', async () => {
    await request(app.getHttpServer()).get('/health/live').expect(200, { status: 'ok' });
    const ready = await request(app.getHttpServer()).get('/health/ready').expect(200);
    expect(ready.body).toEqual({ status: 'ok', details: { 'always-up': { status: 'up' } } });
  });

  it('echoes or mints a request id', async () => {
    const res = await request(app.getHttpServer())
      .get('/health/live')
      .set('x-request-id', 'abc-123')
      .expect(200);
    expect(res.headers['x-request-id']).toBe('abc-123');
  });

  it('serves the OpenAPI document with the request schema', async () => {
    const res = await request(app.getHttpServer()).get('/docs/test/openapi.json').expect(200);
    expect(res.body.paths).toHaveProperty('/api/v1/demo/echo');
    expect(res.body.paths['/api/v1/demo/echo'].post.operationId).toBe('echo');
    expect(res.body.paths).not.toHaveProperty('/health/live');
  });
});

describe('readiness', () => {
  it('returns 503 when a readiness check fails', async () => {
    const app = await createApp([AlwaysUp, AlwaysDown]);
    try {
      const res = await request(app.getHttpServer()).get('/health/ready').expect(503);
      expect(res.body.status).toBe('error');
      expect(res.body.details['always-down']).toEqual({
        status: 'down',
        message: 'dependency unreachable',
      });
    } finally {
      await app.close();
    }
  });
});
