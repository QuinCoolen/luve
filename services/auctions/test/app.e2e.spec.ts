import { configureApp } from '@luve/service-kit';
import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { service } from '../src/service.js';

describe('auctions service (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [service.module] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(app, service);
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('serves its OpenAPI document', async () => {
    const res = await request(app.getHttpServer()).get('/docs/auctions/openapi.json').expect(200);
    expect(res.body.info.title).toBe('Luve Auctions API');
  });
});
