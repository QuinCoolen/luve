import {
  type DynamicModule,
  type InjectionToken,
  Module,
  type ModuleMetadata,
} from '@nestjs/common';
import { AccessTokenVerifier } from './access-token.verifier.js';
import { JWT_AUTH_OPTIONS, type JwtAuthOptions } from './auth.constants.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';

export interface JwtAuthModuleAsyncOptions {
  imports?: ModuleMetadata['imports'];
  inject?: InjectionToken[];
  useFactory: (...args: never[]) => JwtAuthOptions | Promise<JwtAuthOptions>;
}

/**
 * Access-token verification for `@Auth()` routes. Global: import it once in
 * the root module.
 *
 * ```ts
 * JwtAuthModule.forRootAsync({
 *   inject: [ConfigService],
 *   useFactory: (config: ConfigService) => ({
 *     issuer: 'luve-identity',
 *     audience: 'luve',
 *     jwks: { url: config.getOrThrow('JWKS_URL') },
 *   }),
 * })
 * ```
 */
@Module({})
export class JwtAuthModule {
  static forRootAsync(options: JwtAuthModuleAsyncOptions): DynamicModule {
    return {
      module: JwtAuthModule,
      global: true,
      imports: options.imports ?? [],
      providers: [
        {
          provide: JWT_AUTH_OPTIONS,
          inject: options.inject ?? [],
          useFactory: options.useFactory as (...args: unknown[]) => JwtAuthOptions,
        },
        AccessTokenVerifier,
        JwtAuthGuard,
      ],
      exports: [JWT_AUTH_OPTIONS, AccessTokenVerifier, JwtAuthGuard],
    };
  }
}
