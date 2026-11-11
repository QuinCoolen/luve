import {
  type INestApplication,
  StandardSchemaSerializerInterceptor,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import type { BaseEnv } from './config/env.schema.js';
import { ProblemJsonFilter } from './http/problem-json.filter.js';
import { applyRouting } from './http/routing.js';
import { SchemaValidationException } from './http/schema-validation.exception.js';
import { buildOpenApiDocument } from './openapi/document.js';
import type { ServiceDefinition } from './service.js';

/**
 * Applies the cross-cutting HTTP setup shared by every service. Split from
 * `bootstrapService` so e2e tests can configure a `Test.createTestingModule`
 * app exactly like production.
 */
export function configureApp(app: INestApplication, service: ServiceDefinition): void {
  const express = app as NestExpressApplication;

  app.useLogger(app.get(Logger));

  // Behind Traefik: trust private-network proxies so req.ip is the client's.
  express.set('trust proxy', 'loopback, linklocal, uniquelocal');
  // TLS (if any) terminates at the gateway, and locally everything is plain
  // http://localhost:8000, so skip HSTS and the CSP https upgrade: they would
  // make browsers rewrite Swagger UI's asset URLs to https.
  app.use(
    helmet({
      hsts: false,
      contentSecurityPolicy: { directives: { upgradeInsecureRequests: null } },
    }),
  );
  app.use(cookieParser());

  applyRouting(app, service.excludeFromPrefix);

  // Zod (any Standard Schema) validation for @Body/@Query/@Param({ schema }).
  app.useGlobalPipes(
    new StandardSchemaValidationPipe({
      exceptionFactory: (issues) => new SchemaValidationException(issues),
    }),
  );
  // Response shaping for handlers annotated with @SerializeOptions({ schema }).
  app.useGlobalInterceptors(new StandardSchemaSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new ProblemJsonFilter(app.get(HttpAdapterHost)));

  // Swagger UI at /docs/<name>, raw spec at /docs/<name>/openapi.json.
  const document = buildOpenApiDocument(app, service);
  SwaggerModule.setup(`docs/${service.name}`, app, document, {
    jsonDocumentUrl: `docs/${service.name}/openapi.json`,
  });

  app.enableShutdownHooks();
}

/** Creates, configures and starts a service on `PORT`. */
export async function bootstrapService(service: ServiceDefinition): Promise<INestApplication> {
  const app = await NestFactory.create(service.module, {
    bufferLogs: true,
    ...service.nestOptions,
  });
  configureApp(app, service);

  const config: ConfigService<BaseEnv, true> = app.get(ConfigService);
  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  app
    .get(Logger)
    .log(`${service.name} listening on http://localhost:${port} (docs: /docs/${service.name})`);
  return app;
}
