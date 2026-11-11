import { Logger } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { PingCommand } from './ping.command';
import { PingedEvent } from './pinged.event';

export interface PingResult {
  ok: true;
}

@CommandHandler(PingCommand)
export class PingHandler implements ICommandHandler<PingCommand, PingResult> {
  private readonly logger = new Logger(PingHandler.name);

  constructor(private readonly eventBus: EventBus) {}

  execute(command: PingCommand): Promise<PingResult> {
    this.logger.log(`PingCommand handled (at=${command.at})`);
    this.eventBus.publish(new PingedEvent(command.at));
    return Promise.resolve({ ok: true });
  }
}
