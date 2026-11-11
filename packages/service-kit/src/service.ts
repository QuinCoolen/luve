import type { NestApplicationOptions, Type } from '@nestjs/common';
import type { ExcludedRoute } from './http/routing.js';

/**
 * Everything the bootstrap and the OpenAPI exporter need to know about a
 * service. Each service declares one in `src/service.ts` and passes it to both
 * `bootstrapService()` (main.ts) and `exportOpenApi()` (openapi.ts), so the
 * served routes and the documented routes can't drift apart.
 */
export interface ServiceDefinition {
  /** Short id, e.g. `identity`. Used in logs and the docs path `/docs/<name>`. */
  name: string;
  /** OpenAPI title, e.g. `Luve Identity API`. */
  title: string;
  description?: string;
  module: Type<unknown>;
  /** Extra routes to keep outside `/api/v1` (health is always excluded). */
  excludeFromPrefix?: ExcludedRoute[];
  /** Passed to `NestFactory.create`, e.g. `{ rawBody: true }` for webhooks. */
  nestOptions?: NestApplicationOptions;
}

export function defineService(definition: ServiceDefinition): ServiceDefinition {
  return definition;
}
