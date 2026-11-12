import type { Type } from '@nestjs/common';
import type { ExcludedRoute } from './routing.js';

/**
 * Everything the bootstrap and the OpenAPI exporter need to know about a
 * service. Each service declares one in `src/service.ts` and passes it to both
 * `bootstrapService()` (main.ts) and `exportOpenApi()` (openapi.ts), so the
 * served routes and the documented routes can't drift apart.
 */
export interface ServiceDefinition {
  /** Short id, e.g. `identity`. Swagger UI is served at `/docs/<name>`. */
  name: string;
  /** OpenAPI title, e.g. `Luve Identity API`. */
  title: string;
  description?: string;
  /** Port to listen on; the `PORT` environment variable overrides it. */
  port: number;
  module: Type<unknown>;
  /** Routes to keep outside `/api/v1`, e.g. identity's `/.well-known/jwks.json`. */
  excludeFromPrefix?: ExcludedRoute[];
}

export function defineService(definition: ServiceDefinition): ServiceDefinition {
  return definition;
}
