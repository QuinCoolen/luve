export { bootstrapService, configureApp } from './bootstrap.js';
export { applyRouting, type ExcludedRoute } from './routing.js';
export { defineService, type ServiceDefinition } from './service.js';

export { AccessTokenVerifier } from './auth/access-token.verifier.js';
export {
  ACCESS_TOKEN_ALGORITHM,
  ACCESS_TOKEN_COOKIE,
  type AuthUser,
  JWT_AUTH_OPTIONS,
  type JwtAuthOptions,
  REFRESH_TOKEN_COOKIE,
} from './auth/auth.constants.js';
export { Auth, CurrentUser } from './auth/decorators.js';
export { type AuthenticatedRequest, JwtAuthGuard } from './auth/jwt-auth.guard.js';
export { JwtAuthModule, type JwtAuthModuleAsyncOptions } from './auth/jwt-auth.module.js';

export { buildOpenApiDocument, COOKIE_AUTH, type OpenApiInfo } from './openapi/document.js';
export { exportOpenApi } from './openapi/export.js';
export { zodStandardSchemaConverter } from './openapi/zod-converter.js';
