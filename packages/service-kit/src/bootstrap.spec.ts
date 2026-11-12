import {
  Body,
  Controller,
  Get,
  Injectable,
  type INestApplication,
  Module,
  Post,
  SerializeOptions,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { z } from 'zod';
import { configureApp } from './bootstrap.js';
import { defineService } from './service.js';

const EchoSchema = z.object({
  name: z.string().min(2),
  address: z.object({ city: z.string() }),
});

const PublicUserSchema = z.object({ id: z.string() });

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

  @Get('user')
  @SerializeOptions({ schema: PublicUserSchema })
  user() {
    return { id: 'u1', passwordHash: 'secret' };
  }
}

@Module({ controllers: [DemoController], providers: [GreetingService] })
class TestAppModule {}

describe('configureApp', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [TestAppModule] }).compile();
    app = moduleRef.createNestApplication({ logger: false });
    configureApp(
      app,
      defineService({ name: 'test', title: 'Test API', port: 0, module: TestAppModule }),
    );
    await app.init();
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

  it('rejects an invalid body with one `field: message` per problem', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/demo/echo')
      .send({ name: 'Q', address: {} })
      .expect(400);
    const fields = (res.body.message as string[]).map((message) => message.split(':')[0]);
    expect(fields.sort()).toEqual(['address.city', 'name']);
  });

  it('strips response fields the schema does not list', async () => {
    const res = await request(app.getHttpServer()).get('/api/v1/demo/user').expect(200);
    expect(res.body).toEqual({ id: 'u1' });
  });

  it('serves the OpenAPI document', async () => {
    const res = await request(app.getHttpServer()).get('/docs/test/openapi.json').expect(200);
    expect(res.body.paths['/api/v1/demo/echo'].post.operationId).toBe('echo');
  });
});
