import { type INestApplication, RequestMethod, VersioningType } from '@nestjs/common';

/** A route to keep outside the `/api/v1` prefix (structurally Nest's `RouteInfo`). */
export interface ExcludedRoute {
  path: string;
  method: RequestMethod;
}

/**
 * Puts every endpoint under `/api/v1/...`, which is what the gateway routes
 * on. Shared by the HTTP bootstrap and the OpenAPI exporter, so the
 * documented paths match what is served.
 */
export function applyRouting(app: INestApplication, excludeFromPrefix: ExcludedRoute[] = []): void {
  app.setGlobalPrefix('api', { exclude: excludeFromPrefix });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
}
