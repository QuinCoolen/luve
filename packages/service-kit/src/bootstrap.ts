import {
  type INestApplication,
  Logger,
  StandardSchemaSerializerInterceptor,
  StandardSchemaValidationPipe,
} from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { buildOpenApiDocument } from './openapi/document.js';
import { applyRouting } from './routing.js';
import type { ServiceDefinition } from './service.js';

/**
 * The HTTP setup every service shares. Split from `bootstrapService` so e2e
 * tests can set up a `Test.createTestingModule` app the same way.
 */
export function configureApp(app: INestApplication, service: ServiceDefinition): void {
  // Behind Traefik: read X-Forwarded-For so req.ip is the browser's address.
  (app as NestExpressApplication).set('trust proxy', 'loopback, linklocal, uniquelocal');
  // The JWT guard reads the access token from the `jwt` cookie.
  app.use(cookieParser());

  applyRouting(app, service.excludeFromPrefix);

  // Validates @Body/@Query/@Param({ schema }) with Zod. A failure is a 400
  // whose `message` lists every problem as `field: message`.
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  // Shapes responses with @SerializeOptions({ schema }): fields the schema
  // doesn't list (e.g. passwordHash) never leave the service.
  app.useGlobalInterceptors(new StandardSchemaSerializerInterceptor(app.get(Reflector)));

  // Swagger UI at /docs/<name>, raw spec at /docs/<name>/openapi.json.
  SwaggerModule.setup(`docs/${service.name}`, app, buildOpenApiDocument(app, service), {
    jsonDocumentUrl: `docs/${service.name}/openapi.json`,
  });
}

/** Creates, configures and starts a service. */
export async function bootstrapService(service: ServiceDefinition): Promise<INestApplication> {
  const app = await NestFactory.create(service.module);
  configureApp(app, service);

  const port = Number(process.env.PORT ?? service.port);
  await app.listen(port);
  new Logger(service.name).log(
    `Listening on http://localhost:${port} (docs: /docs/${service.name})`,
  );
  return app;
}
