import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

/**
 * Builds the OpenAPI document for the app. `cleanupOpenApiDoc` (nestjs-zod v5)
 * post-processes the doc so Zod DTOs render as proper schemas — it replaces the
 * old `patchNestJsSwagger()` from earlier nestjs-zod versions.
 */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('Luve API')
    .setVersion('1.0.0')
    .addServer('http://localhost:5218')
    .addApiKey({ type: 'apiKey', in: 'cookie', name: 'jwt' }, 'cookieAuth')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  return cleanupOpenApiDoc(document);
}
