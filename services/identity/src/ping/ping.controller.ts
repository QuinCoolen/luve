import { Controller, Get } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PingCommand } from './ping.command';
import { PingResponseDto } from './ping.dto';
import type { PingResult } from './ping.handler';

/**
 * Proof-of-life endpoint. Dispatches a {@link PingCommand} through the CQRS bus
 * (which emits a PingedEvent) and returns `{ ok: true }`.
 *
 * Throwaway — remove with the rest of the ping scaffolding in Phase 2 (O1).
 */
@ApiTags('ping')
@Controller('ping')
export class PingController {
  constructor(private readonly commandBus: CommandBus) {}

  @Get()
  @ApiOperation({ summary: 'CQRS proof-of-life ping' })
  @ApiOkResponse({ type: PingResponseDto })
  ping(): Promise<PingResult> {
    return this.commandBus.execute(new PingCommand(new Date().toISOString()));
  }
}
