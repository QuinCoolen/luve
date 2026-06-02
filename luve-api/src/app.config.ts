import {
  INestApplication,
  RequestMethod,
  VersioningType,
} from '@nestjs/common';
import type { RouteInfo } from '@nestjs/common/interfaces';

/** Global route prefix for all business endpoints (`/api/v1/...`). */
export const GLOBAL_PREFIX = 'api';

/**
 * Routes kept off the `/api` prefix. Health lives at `/health/*` so probes
 * don't need to know about versioning.
 */
export const PREFIX_EXCLUDE: RouteInfo[] = [
  { path: 'health/live', method: RequestMethod.GET },
  { path: 'health/ready', method: RequestMethod.GET },
];

/**
 * Applies the global prefix + URI versioning. Shared by the HTTP bootstrap
 * (main.ts) and the spec exporter (openapi/export.ts) so the documented paths
 * match what's actually served.
 */
export function applyApiPrefixAndVersioning(app: INestApplication): void {
  app.setGlobalPrefix(GLOBAL_PREFIX, { exclude: PREFIX_EXCLUDE });
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
}
