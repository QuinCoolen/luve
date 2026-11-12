import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { applyRouting, buildOpenApiDocument } from './setup.js';

// Writes openapi.json, which Orval turns into the web app's typed client.
// Preview mode builds the routes without connecting to the database or the
// broker. The environment is still validated, hence `--env-file=.env.example`
// in the package.json script.
const app = await NestFactory.create(AppModule, { preview: true, logger: false });
applyRouting(app);
await app.init();
writeFileSync(
  new URL('../openapi.json', import.meta.url),
  `${JSON.stringify(buildOpenApiDocument(app), null, 2)}\n`,
);
await app.close();
console.log('[auth] openapi.json written');
