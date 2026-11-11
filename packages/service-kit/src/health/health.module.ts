import { type DynamicModule, Module, type ModuleMetadata, type Type } from '@nestjs/common';
import { HealthController } from './health.controller.js';
import { READINESS_CHECKS, type ReadinessCheck } from './readiness-check.js';

export interface HealthKitOptions {
  /** Modules that provide what the readiness checks inject (e.g. a Prisma module). */
  imports?: ModuleMetadata['imports'];
  /** Checks that must pass for `/health/ready` to return 200. */
  checks?: Type<ReadinessCheck>[];
}

/** `/health/live` + `/health/ready` with pluggable readiness checks. */
@Module({})
export class HealthKitModule {
  static forRoot(options: HealthKitOptions = {}): DynamicModule {
    const checks = options.checks ?? [];
    return {
      module: HealthKitModule,
      imports: options.imports ?? [],
      controllers: [HealthController],
      providers: [
        ...checks,
        {
          provide: READINESS_CHECKS,
          useFactory: (...instances: ReadinessCheck[]) => instances,
          inject: checks,
        },
      ],
    };
  }
}
