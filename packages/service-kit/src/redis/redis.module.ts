import { Global, Module } from '@nestjs/common';
import { RedisService } from './redis.service';

/** Global so the single Redis connection is shared everywhere. */
@Global()
@Module({
  providers: [RedisService],
  exports: [RedisService],
})
export class RedisModule {}
