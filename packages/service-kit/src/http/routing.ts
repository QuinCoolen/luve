import { type INestApplication, RequestMethod, VersioningType } from '@nestjs/common';

/** A route to keep outside the `/api/v1` prefix (structurally Nest's `RouteInfo`). */
export interface ExcludedRoute {
  path: string;
  method: RequestMethod;
}

/** Every business endpoint lives under `/api/v1/...`. */
export const GLOBAL_PREFIX = 'api';
export const DEFAULT_API_VERSION = '1';

/**
 * Health probes stay at `/health/*`, outside the prefix and version, so
 * orchestrators don't need to know about either.
 */
const ALWAYS_EXCLUDED: ExcludedRoute[] = [
  { path: 'health/live', method: RequestMethod.GET },
  { path: 'health/ready', method: RequestMethod.GET },
];

/**
 * Applies the global prefix and URI versioning. Shared by the HTTP bootstrap
 * and the OpenAPI exporter, so the documented paths match what is served.
 */
export function applyRouting(app: INestApplication, excludeFromPrefix: ExcludedRoute[] = []): void {
  app.setGlobalPrefix(GLOBAL_PREFIX, { exclude: [...ALWAYS_EXCLUDED, ...excludeFromPrefix] });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: DEFAULT_API_VERSION });
}
