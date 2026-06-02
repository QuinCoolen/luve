import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import { Logger } from 'nestjs-pino';
import { ZodValidationPipe } from 'nestjs-zod';
import { applyApiPrefixAndVersioning } from './app.config';
import { AppModule } from './app.module';
import { ProblemJsonFilter } from './common/filters/problem-json.filter';
import type { Env } from './config/env.schema';
import { buildOpenApiDocument } from './openapi/openapi';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  // Route Nest's own logs through pino.
  app.useLogger(app.get(Logger));

  const config: ConfigService<Env, true> = app.get(ConfigService);

  app.use(cookieParser());
  app.use(helmet());
  app.enableCors({
    origin: config.get('CORS_ORIGIN', { infer: true }),
    credentials: true,
  });

  applyApiPrefixAndVersioning(app);

  app.useGlobalPipes(new ZodValidationPipe());
  app.useGlobalFilters(new ProblemJsonFilter(app.get(HttpAdapterHost)));

  app.enableShutdownHooks();

  // OpenAPI: Swagger UI at /docs, raw spec at /openapi.json.
  const document = buildOpenApiDocument(app);
  SwaggerModule.setup('docs', app, document, {
    jsonDocumentUrl: 'openapi.json',
  });

  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  app.get(Logger).log(`Luve API listening on http://localhost:${port}`);
}

void bootstrap();
