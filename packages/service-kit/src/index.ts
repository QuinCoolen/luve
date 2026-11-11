export { bootstrapService, configureApp } from './bootstrap.js';
export { defineService, type ServiceDefinition } from './service.js';

export { baseEnvSchema, parseEnv, type BaseEnv } from './config/env.schema.js';
export { ConfigKitModule } from './config/config.module.js';

export { LoggingModule, REQUEST_ID_HEADER } from './logging/logging.module.js';

export { HealthKitModule, type HealthKitOptions } from './health/health.module.js';
export { type ReadinessReport } from './health/health.controller.js';
export { READINESS_CHECKS, type ReadinessCheck } from './health/readiness-check.js';

export {
  ProblemDetailsSchema,
  ProblemException,
  type ProblemDetails,
  type ProblemInit,
} from './http/problem.js';
export { ProblemJsonFilter, toProblem } from './http/problem-json.filter.js';
export {
  applyRouting,
  DEFAULT_API_VERSION,
  GLOBAL_PREFIX,
  type ExcludedRoute,
} from './http/routing.js';
export { SchemaValidationException, type SchemaIssue } from './http/schema-validation.exception.js';

export { buildOpenApiDocument, COOKIE_AUTH, type OpenApiInfo } from './openapi/document.js';
export { exportOpenApi } from './openapi/export.js';
export { zodStandardSchemaConverter } from './openapi/zod-converter.js';
