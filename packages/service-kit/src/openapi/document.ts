import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, type OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { zodStandardSchemaConverter } from './zod-converter.js';

export const COOKIE_AUTH = 'cookieAuth';

export interface OpenApiInfo {
  title: string;
  description?: string;
  version?: string;
}

/**
 * Builds the service's OpenAPI document. The server is `/` because browsers
 * reach every service through the gateway on one origin. Operation ids are
 * the handler method names, which become Orval hook names (`login` →
 * `useLogin`), so keep handler names unique within a service.
 */
export function buildOpenApiDocument(app: INestApplication, info: OpenApiInfo): OpenAPIObject {
  const builder = new DocumentBuilder()
    .setTitle(info.title)
    .setVersion(info.version ?? '1.0.0')
    .addServer('/')
    .addApiKey({ type: 'apiKey', in: 'cookie', name: 'jwt' }, COOKIE_AUTH);
  if (info.description) {
    builder.setDescription(info.description);
  }

  return SwaggerModule.createDocument(app, builder.build(), {
    operationIdFactory: (_controllerKey, methodKey) => methodKey,
    standardSchemaConverter: zodStandardSchemaConverter,
  });
}
