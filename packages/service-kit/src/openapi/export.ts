import { writeFileSync } from 'node:fs';
import { NestFactory } from '@nestjs/core';
import { applyRouting } from '../routing.js';
import type { ServiceDefinition } from '../service.js';
import { buildOpenApiDocument } from './document.js';

/**
 * Boots the service in **preview mode** (providers are not instantiated, so no
 * database or broker connection is made), writes its OpenAPI document to
 * `outFile` and exits. This file is the contract Orval generates the web
 * client from; CI fails when it's stale.
 *
 * Modules still load, so a service that validates its environment at startup
 * (identity) runs its `openapi:export` script with `--env-file=.env.example`.
 */
export async function exportOpenApi(
  service: ServiceDefinition,
  outFile: URL | string,
): Promise<void> {
  const app = await NestFactory.create(service.module, { preview: true, logger: false });
  applyRouting(app, service.excludeFromPrefix);
  await app.init();

  const document = buildOpenApiDocument(app, service);
  writeFileSync(outFile, `${JSON.stringify(document, null, 2)}\n`, 'utf8');

  await app.close();
  console.log(`[${service.name}] openapi.json written`);
}
