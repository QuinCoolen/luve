import {
  type INestApplication,
  RequestMethod,
  StandardSchemaSerializerInterceptor,
  StandardSchemaValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { ACCESS_TOKEN_COOKIE } from './auth/auth-cookies.js';
import { zodSchemaConverter } from './zod-schema-converter.js';

/**
 * Every endpoint lives under /api/v1/... (that's what the gateway routes on),
 * except the public signing keys at /.well-known/jwks.json.
 */
export function applyRouting(app: INestApplication): void {
  app.setGlobalPrefix('api', {
    exclude: [{ path: '.well-known/jwks.json', method: RequestMethod.GET }],
  });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
}

/** The OpenAPI document. src/openapi.ts writes it to openapi.json for the web client. */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Luve Auth API')
    .setDescription('Accounts, sessions and access tokens.')
    .setVersion('1.0.0')
    .addServer('/')
    .addCookieAuth(ACCESS_TOKEN_COOKIE)
    .build();
  return SwaggerModule.createDocument(app, config, {
    // Operation ids become the web client's function names: login → useLogin.
    operationIdFactory: (_controller, method) => method,
    standardSchemaConverter: zodSchemaConverter,
  });
}

/** Used by main.ts and the e2e tests, so tests run the app exactly like production. */
export function setupApp(app: INestApplication): void {
  // Behind Traefik: read X-Forwarded-For so req.ip is the browser's address.
  (app as NestExpressApplication).set('trust proxy', 'loopback, linklocal, uniquelocal');
  // Tokens arrive as cookies.
  app.use(cookieParser());

  applyRouting(app);

  // Validates @Body/@Param({ schema }) with Zod. A failure is a 400 whose
  // `message` lists every problem as `field: message`.
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  // Shapes responses with @SerializeOptions({ schema }): fields the schema
  // doesn't list (like passwordHash) never leave the service.
  app.useGlobalInterceptors(new StandardSchemaSerializerInterceptor(app.get(Reflector)));

  // Swagger UI at /docs/auth.
  SwaggerModule.setup('docs/auth', app, buildOpenApiDocument(app), {
    jsonDocumentUrl: 'docs/auth/openapi.json',
  });
}
