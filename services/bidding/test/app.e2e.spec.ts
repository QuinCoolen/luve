import { configureApp } from '@luve/service-kit';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

describe('bidding service (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    process.env.PORT ??= '4003';
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'silent';
    // Imported after the env is set: ConfigModule validates at import time.
    const { service } = await import('../src/service.js');

    const moduleRef = await Test.createTestingModule({ imports: [service.module] }).compile();
    app = moduleRef.createNestApplication({ bufferLogs: true });
    configureApp(app, service);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('is live', async () => {
    await request(app.getHttpServer()).get('/health/live').expect(200, { status: 'ok' });
  });

  it('answers unknown API routes with problem+json', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/does-not-exist').expect(404);
    expect(res.headers['content-type']).toMatch(/application\/problem\+json/);
    expect(res.body).toMatchObject({ status: 404, type: '/errors/not-found' });
  });

  it('serves its OpenAPI document', async () => {
    const res = await request(app.getHttpServer()).get('/docs/bidding/openapi.json').expect(200);
    expect(res.body.info.title).toBe('Luve Bidding API');
  });
});
