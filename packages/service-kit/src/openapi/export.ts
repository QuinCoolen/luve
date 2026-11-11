import 'reflect-metadata';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { applyApiPrefixAndVersioning } from '../app.config';
import { buildOpenApiDocument } from './openapi';

/**
 * Boots the app in **preview mode** (providers are not instantiated, so no DB
 * or Redis connection is made), builds the OpenAPI document, writes it to
 * `luve-api/openapi.json`, and exits. This is the contract artifact Orval
 * consumes on the frontend.
 */
async function exportSpec(): Promise<void> {
  const app = await NestFactory.create(AppModule, {
    preview: true,
    logger: false,
  });
  applyApiPrefixAndVersioning(app);
  await app.init();

  const document = buildOpenApiDocument(app);
  const outPath = join(__dirname, '..', '..', 'openapi.json');
  writeFileSync(outPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

  await app.close();

  console.log(`openapi.json written to ${outPath}`);
}

exportSpec()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
