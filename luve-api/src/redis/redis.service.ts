import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';
import type { Env } from '../config/env.schema';

/**
 * Global Redis client. Used by the health check today; the throttler and BullMQ
 * will share this instance in later phases. Extends ioredis so it *is* the
 * client — inject `RedisService` anywhere a `Redis` is needed.
 */
@Injectable()
export class RedisService extends Redis implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(config: ConfigService<Env, true>) {
    super(config.get('REDIS_URL', { infer: true }), {
      // null keeps blocking commands (BullMQ) happy and is harmless otherwise.
      maxRetriesPerRequest: null,
    });
    this.on('error', (err) =>
      this.logger.error(`Redis connection error: ${err.message}`),
    );
  }

  async onModuleDestroy(): Promise<void> {
    await this.quit();
  }
}
