import {
  type INestApplication,
  StandardSchemaSerializerInterceptor,
  StandardSchemaValidationPipe,
  VersioningType,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { zodSchemaConverter } from './zod-schema-converter.js';

/** Every endpoint lives under /api/v1/... (that's what the gateway routes on). */
export function applyRouting(app: INestApplication): void {
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
}

/** The OpenAPI document. src/openapi.ts writes it to openapi.json for the web client. */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Luve Users API')
    .setDescription('Public user profiles.')
    .setVersion('1.0.0')
    .addServer('/')
    .addCookieAuth('jwt')
    .build();
  return SwaggerModule.createDocument(app, config, {
    // Operation ids become the web client's function names: getProfile → useGetProfile.
    operationIdFactory: (_controller, method) => method,
    standardSchemaConverter: zodSchemaConverter,
  });
}

/** Used by main.ts and the e2e tests, so tests run the app exactly like production. */
export function setupApp(app: INestApplication): void {
  // The access token arrives as the `jwt` cookie.
  app.use(cookieParser());
  applyRouting(app);
  // Validates @Body/@Param({ schema }) with Zod. A failure is a 400 whose
  // `message` lists every problem as `field: message`.
  app.useGlobalPipes(new StandardSchemaValidationPipe());
  // Shapes responses with @SerializeOptions({ schema }).
  app.useGlobalInterceptors(new StandardSchemaSerializerInterceptor(app.get(Reflector)));
  // Swagger UI at /docs/users.
  SwaggerModule.setup('docs/users', app, buildOpenApiDocument(app), {
    jsonDocumentUrl: 'docs/users/openapi.json',
  });
}
