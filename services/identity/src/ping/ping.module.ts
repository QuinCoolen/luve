import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PingController } from './ping.controller';
import { PingHandler } from './ping.handler';
import { PingedHandler } from './pinged.handler';

/** Throwaway CQRS proof-of-life module — delete in Phase 2 (O1). */
@Module({
  imports: [CqrsModule],
  controllers: [PingController],
  providers: [PingHandler, PingedHandler],
})
export class PingModule {}
