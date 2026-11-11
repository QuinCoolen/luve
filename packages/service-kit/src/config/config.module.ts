import { type DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import type { z } from 'zod';
import { parseEnv } from './env.schema.js';

/**
 * `@nestjs/config` validated by the service's Zod env schema. Global, so
 * `ConfigService` is injectable everywhere. Reads `.env` from the working
 * directory (the service folder under `pnpm dev`); real environment variables
 * win over the file.
 */
@Module({})
export class ConfigKitModule {
  static forRoot(schema: z.ZodType): DynamicModule {
    return {
      module: ConfigKitModule,
      global: true,
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          cache: true,
          validate: (config) => parseEnv(schema, config) as Record<string, unknown>,
        }),
      ],
      exports: [ConfigModule],
    };
  }
}
